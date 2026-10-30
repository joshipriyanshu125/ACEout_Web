# ACEout voice proxy

A small Express service that stands between the app and the two paid APIs the
voice assistant uses. Its only job is to hold the keys.

It exists because `EXPO_PUBLIC_*` variables are **inlined into the JS bundle at
build time** — that is what the prefix means. A Deepgram or Gemini key shipped
that way is readable by anyone with the APK:

```bash
unzip -p app-release.apk assets/index.android.bundle | grep -ao 'AIza[0-9A-Za-z_-]\{35\}'
```

Both services bill per request, so that is someone else's usage on your card.

## Endpoints

| | | |
|---|---|---|
| `POST /api/stt` | raw audio bytes | `{ text, confidence }` |
| `POST /api/tts` | `{ text }` | `audio/mpeg` |
| `POST /api/ask` | `{ labId, question }` | `{ answer, sources }` |
| `GET /health` | — | `{ ok, deepgram, gemini, labs }` |

`/api/ask` takes a **lab id, not a prompt**. The system prompt and the lab
knowledge live here, and `labId` is checked against the knowledge base — so the
Gemini key behind this URL can only ever answer questions about a lab. An
endpoint that forwarded an arbitrary prompt would just be a free LLM for
whoever found it.

There is a 30 requests/minute per-IP ceiling. It is in memory, which is fine
for one instance; move it to Redis if you ever run two.

## Running it

```bash
cd server
npm install
cp .env.example .env    # then paste your two keys in
npm start
```

Then point the app at it in `app/.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
```

Restart Metro with `npx expo start --clear` after changing that — `EXPO_PUBLIC_*`
values are baked in at bundle time, so a running bundler will not pick it up.

If `EXPO_PUBLIC_API_BASE_URL` is empty the app falls back to calling Deepgram
and Gemini directly with its own keys. That is convenient while building and
wrong to ship; delete the fallback in `app/src/voice/` once you deploy.

## Testing from a real phone

`localhost` on a phone means the phone. Two things bite here:

1. **Use your machine's LAN address**, not localhost:
   `EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:3000` (find it with `hostname -I`).
2. **Android blocks cleartext HTTP** in release builds since Android 9. A plain
   `http://` address will fail in the APK with no useful error. Either tunnel it
   over https (`npx cloudflared tunnel --url http://localhost:3000`) or, for LAN
   testing only, add to `app/app.json`:

   ```json
   ["expo-build-properties", { "android": { "usesCleartextTraffic": true } }]
   ```

   Deploying to any real host gives you https and makes both problems go away.

## Deploying

Any Node host works — set the root directory to `server`, build `npm install`,
start `npm start`, and set `DEEPGRAM_API_KEY` and `GEMINI_API_KEY` as
environment variables in the dashboard. Then set `EXPO_PUBLIC_API_BASE_URL` to
the deployed https URL and rebuild the APK.

One thing to watch: free tiers that sleep when idle. A voice assistant that
takes 50 seconds to answer the first question because the server was spinning
up is worse than no voice assistant. Check whether your host keeps the instance
warm, or ping `/health` on a schedule.

## Keeping the knowledge base in sync

`knowledge.js` is a copy of `app/src/voice/labKnowledge.js`, so the server can
deploy on its own without the app folder. After editing the app's copy:

```bash
npm run sync-knowledge
```
