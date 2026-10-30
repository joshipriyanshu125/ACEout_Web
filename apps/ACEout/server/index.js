import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { LAB_KNOWLEDGE } from './knowledge.js';

/**
 * The voice proxy.
 *
 * Its only job is to hold the Deepgram and Gemini keys, which cannot live in
 * the app: `EXPO_PUBLIC_*` variables are inlined into the JS bundle at build
 * time, so a key shipped that way is readable by anyone who unzips the APK.
 * Both services bill per request.
 *
 * Three endpoints, mirroring the three network calls the assistant makes:
 *
 *   POST /api/stt   raw audio bytes  →  { text, confidence }
 *   POST /api/tts   { text }         →  audio/mpeg
 *   POST /api/ask   { labId, question } → { answer, sources }
 *
 * `/api/ask` deliberately does not take a prompt. The lab knowledge and the
 * system prompt live here, and `labId` is checked against the knowledge base —
 * so the Gemini key behind this endpoint can only ever answer questions about
 * a lab, not act as a free general-purpose LLM for whoever finds the URL.
 */

const PORT = process.env.PORT || 3000;
const DEEPGRAM_KEY = process.env.DEEPGRAM_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const DEEPGRAM_URL = 'https://api.deepgram.com/v1';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta';

if (!DEEPGRAM_KEY) console.warn('⚠️  DEEPGRAM_API_KEY is not set — /api/stt and /api/tts will fail.');
if (!GEMINI_KEY) console.warn('⚠️  GEMINI_API_KEY is not set — /api/ask will fail.');

const app = express();
app.use(cors());
app.disable('x-powered-by');

// ---------------------------------------------------------------------------
// Rate limiting
//
// A public URL holding two metered API keys needs a ceiling, and an in-memory
// counter is enough for one instance. Move this to Redis only if you ever run
// more than one.
// ---------------------------------------------------------------------------

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }

  if (entry.count >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ error: 'Too many requests. Slow down a moment.' });
  }

  entry.count += 1;
  next();
}

// Drop expired buckets so a long-running instance does not grow a map entry
// for every IP that has ever called it.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (now > entry.resetAt) hits.delete(ip);
}, WINDOW_MS).unref();

// ---------------------------------------------------------------------------
// Health
// ---------------------------------------------------------------------------

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    deepgram: Boolean(DEEPGRAM_KEY),
    gemini: Boolean(GEMINI_KEY),
    labs: Object.keys(LAB_KNOWLEDGE),
  });
});

// ---------------------------------------------------------------------------
// Speech to text
// ---------------------------------------------------------------------------

/**
 * The body is the recording itself, so it has to arrive as an untouched
 * Buffer — `express.json()` would try to parse an mp4 and fail. The client's
 * Content-Type is passed straight through: Deepgram sniffs the container but
 * rejects a type it does not recognise, and only the client knows whether
 * expo-av wrote MPEG-4 or the browser's MediaRecorder wrote WebM.
 */
app.post('/api/stt', rateLimit, express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
  if (!DEEPGRAM_KEY) return res.status(500).json({ error: 'Deepgram key not configured on the server.' });
  if (!req.body?.length) return res.status(400).json({ error: 'Empty audio body.' });

  const model = String(req.query.model || 'nova-2');
  const language = String(req.query.language || 'en');

  try {
    const upstream = await fetch(`${DEEPGRAM_URL}/listen?model=${model}&language=${language}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_KEY}`,
        'Content-Type': req.get('content-type') || 'audio/mp4',
      },
      body: req.body,
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('Deepgram STT failed:', upstream.status, text);
      return res.status(502).json({ error: `Speech recognition failed (${upstream.status}).` });
    }

    const data = JSON.parse(text);
    const best = data.results?.channels?.[0]?.alternatives?.[0];
    res.json({ text: best?.transcript || '', confidence: best?.confidence || 0 });
  } catch (err) {
    console.error('STT error:', err);
    res.status(502).json({ error: 'Speech recognition is unavailable.' });
  }
});

// ---------------------------------------------------------------------------
// Text to speech
// ---------------------------------------------------------------------------

app.all('/api/tts', rateLimit, express.json({ limit: '64kb' }), async (req, res) => {
  if (!DEEPGRAM_KEY) return res.status(500).json({ error: 'Deepgram key not configured on the server.' });

  const rawText = req.body?.text || req.query?.text;
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  if (!text) return res.status(400).json({ error: 'Missing `text`.' });
  // An answer is three or four sentences; anything longer is not this feature.
  if (text.length > 2000) return res.status(400).json({ error: '`text` is too long.' });

  const model = String(req.body?.model || req.query?.model || 'aura-asteria-en');

  try {
    const upstream = await fetch(`${DEEPGRAM_URL}/speak?model=${model}&encoding=mp3`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${DEEPGRAM_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      console.error('Deepgram TTS failed:', upstream.status, detail);
      return res.status(502).json({ error: `Speech synthesis failed (${upstream.status}).` });
    }

    const audio = Buffer.from(await upstream.arrayBuffer());
    res.set('Content-Type', 'audio/mpeg');
    res.set('Content-Length', String(audio.length));
    res.send(audio);
  } catch (err) {
    console.error('TTS error:', err);
    res.status(502).json({ error: 'Speech synthesis is unavailable.' });
  }
});

// ---------------------------------------------------------------------------
// Retrieval-augmented answer
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a helpful, conversational AI lab assistant for a high school physics virtual lab.
Your job is to answer the student's questions accurately based ONLY on the provided LAB KNOWLEDGE.

Guidelines:
1. Be concise. Keep answers under 3-4 sentences.
2. Be conversational. Your answer will be read aloud via Text-to-Speech, so avoid complex formatting or markdown.
3. If the user asks something outside the scope of the LAB KNOWLEDGE, politely redirect them back to the experiment.
4. Be encouraging and educational.`;

/**
 * Picking a Gemini model.
 *
 * `ListModels` is not a list of models you may call — it happily returns names
 * that `generateContent` then refuses with a 404 ("no longer available to new
 * users"). It also returns image, TTS, transcription and research models that
 * would fail differently. So: filter to plain text-chat models, rank them, and
 * walk the ranking until one actually answers.
 *
 * The result is cached, because which model works is an account-level fact, not
 * a per-question one. The original client code re-listed the models on every
 * single question — an extra round trip on every answer for information that
 * never changed.
 */

// Everything here either is not a chat model or needs a different request shape.
const NOT_A_CHAT_MODEL =
  /(-tts|-image|transcribe|embedding|customtools|computer-use|robotics|gemma|lyria|nano-banana|antigravity|deep-research|omni)/;

function rankModel(name) {
  // `-latest` aliases track Google's current pick, so they age well — which is
  // exactly what you want in a deployment nobody is watching.
  if (name === 'models/gemini-flash-latest') return 1e9;
  if (name === 'models/gemini-pro-latest') return 1e8;

  const version = name.match(/gemini-(\d+)(?:\.(\d+))?/);
  if (!version) return 0;

  const score = Number(version[1]) * 1000 + Number(version[2] || 0);
  const flash = name.includes('flash') ? 1e6 : 0; // fast and cheap: right for 3-sentence answers
  const penalty = (name.includes('lite') ? 5e5 : 0) + (name.includes('preview') ? 6e5 : 0);
  return flash + score - penalty;
}

let candidates = null;
let cachedModel = null;

async function modelCandidates() {
  if (candidates) return candidates;

  const res = await fetch(`${GEMINI_URL}/models?key=${GEMINI_KEY}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Could not list Gemini models.');

  candidates = (data.models || [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name)
    .filter((name) => name.startsWith('models/gemini') && !NOT_A_CHAT_MODEL.test(name))
    .sort((a, b) => rankModel(b) - rankModel(a));

  if (!candidates.length) throw new Error('No Gemini chat model is available on this key.');

  console.log(`Gemini candidates: ${candidates.slice(0, 3).join(', ')}…`);
  return candidates;
}

/**
 * One `generateContent` call.
 *
 * Two settings here are not incidental. `maxOutputTokens` is generous because
 * on Gemini 2.5 and later the model's internal reasoning is billed against the
 * same budget as the reply — at the 150 this used to be, the thinking consumed
 * it and the student got half a sentence ("a concave (diver"). And
 * `thinkingBudget: 0` switches that reasoning off entirely, which is right for
 * a three-sentence answer read from supplied context: it cut the response from
 * about ten seconds to under two, which is the difference between a
 * conversation and a wait.
 */
function callModel(model, prompt, noThinking) {
  const generationConfig = { temperature: 0.2, maxOutputTokens: 800 };
  if (noThinking) generationConfig.thinkingConfig = { thinkingBudget: 0 };

  return fetch(`${GEMINI_URL}/${model}:generateContent?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });
}

/**
 * Try each candidate in turn. A 404 means that model is retired for this key —
 * drop it and move on, rather than failing the student's question.
 */
async function generate(prompt) {
  const all = await modelCandidates();
  const ordered = cachedModel ? [cachedModel, ...all.filter((m) => m !== cachedModel)] : all;

  let lastError = 'No model answered.';

  for (const model of ordered) {
    let res = await callModel(model, prompt, true);
    let data = await res.json();

    // Not every model accepts a thinking budget. If this one does not, the
    // same request without it is still worth a try before moving on.
    if (!res.ok && /thinking/i.test(data.error?.message || '')) {
      res = await callModel(model, prompt, false);
      data = await res.json();
    }

    if (res.ok && !data.error) {
      const candidate = data.candidates?.[0];
      const answer = candidate?.content?.parts?.[0]?.text?.trim();
      if (answer) {
        if (cachedModel !== model) console.log(`Gemini model: ${model}`);
        cachedModel = model;
        return answer;
      }
      lastError = `Empty answer (finishReason: ${candidate?.finishReason || 'unknown'}).`;
      console.warn(`${model}: ${lastError}`);
      continue;
    }

    lastError = data.error?.message || `HTTP ${res.status}`;

    // A bad or unauthorised key fails identically on every model, so walking
    // the list would just be the same rejection several more times.
    if (res.status === 401 || res.status === 403) throw new Error(lastError);

    if (res.status === 404) {
      // Retired for this key — it will never work again, so stop offering it.
      candidates = candidates.filter((m) => m !== model);
      console.warn(`Dropping retired model ${model}: ${lastError}`);
    } else {
      // Overloaded or rate-limited. That is this model's problem today, not
      // tomorrow's, so keep it on the list and just try the next one now.
      console.warn(`${model} unavailable: ${lastError}`);
    }

    if (cachedModel === model) cachedModel = null;
  }

  throw new Error(lastError);
}

app.post('/api/ask', rateLimit, express.json({ limit: '16kb' }), async (req, res) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: 'Gemini key not configured on the server.' });

  const { labId, question } = req.body || {};

  // The guard that makes this endpoint safe to expose: the caller picks a lab,
  // never a prompt.
  const chunks = LAB_KNOWLEDGE[labId];
  if (!chunks) return res.status(400).json({ error: 'Unknown labId.' });

  const asked = typeof question === 'string' ? question.trim() : '';
  if (!asked) return res.status(400).json({ error: 'Missing `question`.' });
  if (asked.length > 500) return res.status(400).json({ error: '`question` is too long.' });

  const sources = chunks.map((c) => ({ id: c.id, title: c.title }));
  const context = chunks.map((c) => `### ${c.title}\n${c.content}`).join('\n\n');

  // Every lab has around ten chunks, so the whole base fits in the context
  // window — retrieval scoring would only risk dropping the relevant one.
  const prompt = `${SYSTEM_PROMPT}

=== LAB KNOWLEDGE ===
${context}
=====================

User Question: ${asked}`;

  try {
    const answer = await generate(prompt);
    res.json({ answer, sources, confidence: 1 });
  } catch (err) {
    console.error('Ask error:', err.message);
    res.status(502).json({ error: 'The assistant could not answer that right now.' });
  }
});

// ---------------------------------------------------------------------------

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.listen(PORT, () => {
  console.log(`ACEout voice proxy listening on http://localhost:${PORT}`);
});
