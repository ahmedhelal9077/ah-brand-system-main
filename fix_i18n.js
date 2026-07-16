const fs = require('fs');

const arabicTranslations = JSON.parse(fs.readFileSync('extracted-arabic.json', 'utf8'));
const I18N_PATH = 'src/lib/i18n.ts';
let i18nContent = fs.readFileSync(I18N_PATH, 'utf8');

let typeInjection = '';
let arInjection = '';
let enInjection = '';

// We need to parse existing keys to avoid duplicates
const existingKeys = new Set();
const keyRegex = /\b(trans_\d+|[a-zA-Z0-9_]+)\s*:/g;
let match;
while ((match = keyRegex.exec(i18nContent)) !== null) {
  existingKeys.add(match[1]);
}

for (const [k, v] of Object.entries(arabicTranslations)) {
  if (!existingKeys.has(k)) {
    typeInjection += `  ${k}: string;\n`;
    arInjection += `    ${k}: ${JSON.stringify(v)},\n`;
    enInjection += `    ${k}: ${JSON.stringify(v)},\n`; // fallback to Arabic for EN until translated
  }
}

i18nContent = i18nContent.replace(/type TranslationDict = \{/, `type TranslationDict = {\n${typeInjection}`);
i18nContent = i18nContent.replace(/ar: \{/, `ar: {\n${arInjection}`);
i18nContent = i18nContent.replace(/en: \{/, `en: {\n${enInjection}`);

fs.writeFileSync(I18N_PATH, i18nContent);
console.log("Successfully injected translations!");
