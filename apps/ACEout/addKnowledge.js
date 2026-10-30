const fs = require('fs');
const path = require('path');

const p = '/home/adish/Desktop/ACEout/app/src/voice/labKnowledge.js';
let content = fs.readFileSync(p, 'utf8');

const additionalKnowledge = `  'ph-determination': [
    {
      id: 'ph-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Chemistry lab, you determine the pH of various solutions using universal indicator paper and a digital pH meter. You study the logarithmic relationship of [H+] and [OH-] concentrations governed by Kw = 1.0 × 10^-14.',
      keywords: ['ph', 'determination', 'universal indicator', 'digital ph meter', 'hydrogen ion', 'kw', 'class 11', 'chemistry'],
      category: 'theory'
    },
    {
      id: 'ph-theory',
      title: 'pH Theory',
      content: 'pH is defined as the negative logarithm to the base 10 of the hydrogen ion concentration in mol/L: pH = -log10[H+]. Similarly, pOH = -log10[OH-]. At 298 K, pH + pOH = 14.00.',
      keywords: ['ph formula', 'poh', 'logarithm', 'hydrogen', 'hydroxide', 'equation', 'theory'],
      category: 'theory'
    }
  ],
  'acid-base-indicators': [
    {
      id: 'ind-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Chemistry lab, you investigate the color changes of different acid-base indicators (Phenolphthalein, Methyl Orange, Litmus, and Bromothymol Blue) across varying pH levels to deduce their transition ranges.',
      keywords: ['indicator', 'acid-base', 'phenolphthalein', 'methyl orange', 'litmus', 'bromothymol blue', 'transition range', 'class 11', 'chemistry'],
      category: 'theory'
    },
    {
      id: 'ind-theory',
      title: 'Indicator Theory',
      content: 'An acid-base indicator is a weak organic acid (HIn) or weak organic base that changes color depending on the pH. The equilibrium is HIn ⇌ H+ + In-. The color depends on the ratio [In-]/[HIn]. The transition occurs around pH = pK_In ± 1.',
      keywords: ['equilibrium', 'hin', 'in-', 'pkin', 'color change', 'transition', 'ratio'],
      category: 'theory'
    }
  ],
  'gravity-launch': [
    {
      id: 'gl-overview',
      title: 'Lab Overview',
      content: 'In this Physics lab, a rover is horizontally launched off a deck. By measuring the horizontal range and the deck height across various worlds with different gravity, you plot R² versus 1/g to find the launch speed and determine the mystery world\\'s gravity.',
      keywords: ['gravity', 'launch', 'horizontal projectile', 'rover', 'deck', 'range', 'launch speed', 'mystery world'],
      category: 'theory'
    },
    {
      id: 'gl-theory',
      title: 'Projectile Theory',
      content: 'For a horizontal launch with speed u from height h, the time of fall is t = √(2h/g) and horizontal range is R = u·t = u·√(2h/g). Squaring gives R² = (2u²h)/g. A plot of R² vs 1/g gives a straight line through origin with gradient 2u²h.',
      keywords: ['projectile', 'horizontal', 'range formula', 'time of flight', 'gradient', 'straight line', 'plot'],
      category: 'formula'
    }
  ],
  'plant-physiology': [
    {
      id: 'pp-overview',
      title: 'Lab Overview',
      content: 'In this Class 11 Biology lab, you study three core plant physiology concepts: Plasmolysis in epidermal peels (like Rhoeo), Stomatal distribution in dicot vs monocot leaves, and Transpiration rates using the cobalt chloride paper method.',
      keywords: ['plant physiology', 'plasmolysis', 'stomata', 'transpiration', 'rhoeo', 'cobalt chloride', 'class 11', 'biology'],
      category: 'theory'
    },
    {
      id: 'pp-theory',
      title: 'Physiology Theory',
      content: 'Plasmolysis occurs when a plant cell loses water in a hypertonic solution (e.g. strong salt solution), causing the protoplast to shrink away from the cell wall. Stomata are more numerous on the lower epidermis of dicot leaves (dorsiventral). Transpiration turns blue cobalt chloride paper pink due to moisture.',
      keywords: ['plasmolysis', 'hypertonic', 'shrink', 'stomata density', 'lower epidermis', 'dicot', 'cobalt chloride', 'blue to pink', 'moisture'],
      category: 'theory'
    }
  ]
};`;

// replace the last '};' of the LAB_KNOWLEDGE with the additional knowledge
content = content.replace(/  \]\n\};\n/, "  ],\n" + additionalKnowledge + "\n");
fs.writeFileSync(p, content);
console.log('done');
