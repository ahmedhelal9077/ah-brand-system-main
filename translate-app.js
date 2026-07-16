const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const I18N_PATH = path.join(__dirname, 'src/lib/i18n.ts');
let i18nContent = fs.readFileSync(I18N_PATH, 'utf8');

// Parse i18n to find existing keys to avoid duplicates
const existingKeys = new Set();
const keyMatch = i18nContent.match(/([a-zA-Z0-9_]+):\s*"/g);
if (keyMatch) {
  keyMatch.forEach(m => existingKeys.add(m.replace(/:\s*"/, '').trim()));
}

let nextKeyId = 1;
const newDictAr = {};
const newDictEn = {};

function getNewKey(arabicStr) {
  const cleanStr = arabicStr.trim();
  if (!cleanStr) return null;
  // Check if we already created a key for this string in the current run
  const existingKey = Object.keys(newDictAr).find(k => newDictAr[k] === cleanStr);
  if (existingKey) return existingKey;

  let keyName = `trans_${nextKeyId++}`;
  while (existingKeys.has(keyName)) {
    keyName = `trans_${nextKeyId++}`;
  }
  newDictAr[keyName] = cleanStr;
  newDictEn[keyName] = cleanStr + " (EN)"; // Placeholder
  return keyName;
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  if (!/[\u0600-\u06FF]/.test(code)) return;
  if (filePath.includes('i18n.ts') || filePath.includes('arabicNames.ts') || filePath.includes('egyptCities.ts')) return;

  const isServer = filePath.includes('\\app\\') && filePath.endsWith('page.tsx') && !code.includes('use client');
  const isClient = code.includes('use client') || filePath.includes('Client');
  
  // Skip pure actions for now to avoid complexity of async hooks in non-components
  if (filePath.endsWith('actions.ts')) return; 

  let needsHook = false;

  try {
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript'],
    });

    let modified = false;

    traverse(ast, {
      StringLiteral(path) {
        if (/[\u0600-\u06FF]/.test(path.node.value)) {
          if (path.parent.type === 'ImportDeclaration') return;
          const key = getNewKey(path.node.value);
          if (key) {
            if (path.parent.type === 'JSXAttribute') {
              path.replaceWith(babel.types.jsxExpressionContainer(
                babel.types.callExpression(babel.types.identifier('t'), [babel.types.stringLiteral(key)])
              ));
              needsHook = true;
              modified = true;
            } else if (path.parent.type !== 'ObjectProperty' || path.parent.key.name !== 'error') {
              path.replaceWith(babel.types.callExpression(babel.types.identifier('t'), [babel.types.stringLiteral(key)]));
              needsHook = true;
              modified = true;
            }
          }
        }
      },
      JSXText(path) {
        if (/[\u0600-\u06FF]/.test(path.node.value)) {
          const key = getNewKey(path.node.value);
          if (key) {
            path.replaceWith(babel.types.jsxExpressionContainer(
              babel.types.callExpression(babel.types.identifier('t'), [babel.types.stringLiteral(key)])
            ));
            needsHook = true;
            modified = true;
          }
        }
      }
    });

    if (modified) {
      let outputCode = generate(ast, { retainLines: true }, code).code;
      
      if (needsHook) {
        if (isClient) {
          if (!outputCode.includes('useSettings')) {
            outputCode = `import { useSettings } from "@/lib/SettingsContext";\n` + outputCode;
          }
          if (!outputCode.includes('const { t }')) {
             outputCode = outputCode.replace(/export default function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export default function $1($2) {\n  const { t } = useSettings();`);
             outputCode = outputCode.replace(/export function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export function $1($2) {\n  const { t } = useSettings();`);
          }
        } else if (isServer) {
          if (!outputCode.includes('getServerTranslation')) {
            outputCode = `import { getServerTranslation } from "@/lib/serverI18n";\n` + outputCode;
          }
          if (!outputCode.includes('const { t }')) {
             outputCode = outputCode.replace(/export default async function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export default async function $1($2) {\n  const { t } = await getServerTranslation();`);
          }
        }
      }

      fs.writeFileSync(filePath, outputCode);
      console.log(`Translated file: ${filePath}`);
    }
  } catch (err) {
    console.error(`Error parsing ${filePath}:`, err.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
        walkDir(fullPath);
      }
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));

// Now append newDict to i18n.ts
if (Object.keys(newDictAr).length > 0) {
  console.log(`Found ${Object.keys(newDictAr).length} new strings. Appending to i18n.ts...`);
  
  let typeInjection = "";
  let arInjection = "";
  let enInjection = "";

  for (const [key, val] of Object.entries(newDictAr)) {
    typeInjection += `  ${key}: string;\n`;
    arInjection += `    ${key}: "${val.replace(/"/g, '\\"')}",\n`;
    enInjection += `    ${key}: "${newDictEn[key].replace(/"/g, '\\"')}",\n`;
  }

  // Inject into TranslationDict
  i18nContent = i18nContent.replace(/type TranslationDict = \{/, `type TranslationDict = {\n${typeInjection}`);
  
  // Inject into ar
  i18nContent = i18nContent.replace(/ar: \{/, `ar: {\n${arInjection}`);
  
  // Inject into en
  i18nContent = i18nContent.replace(/en: \{/, `en: {\n${enInjection}`);

  fs.writeFileSync(I18N_PATH, i18nContent);
  console.log("Updated i18n.ts.");
} else {
  console.log("No new strings found.");
}
