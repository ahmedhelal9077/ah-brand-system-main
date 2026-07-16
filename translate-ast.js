const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

const arDict = require('./src/locales/ar.json');
const enDict = require('./src/locales/en.json');

// Reverse dictionary to find existing keys
const reverseArDict = Object.fromEntries(Object.entries(arDict).map(([k, v]) => [v, k]));

let nextKeyId = Object.keys(arDict).length + 1;

function getTranslationKey(arabicStr) {
  let cleanStr = arabicStr.trim();
  if (!cleanStr) return null;
  
  if (reverseArDict[cleanStr]) {
    return reverseArDict[cleanStr];
  }
  
  // Create a new key
  const newKey = `trans_${nextKeyId++}`;
  arDict[newKey] = cleanStr;
  enDict[newKey] = cleanStr + " (EN)"; // Placeholder for English
  reverseArDict[cleanStr] = newKey;
  return newKey;
}

function processFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  if (!/[\u0600-\u06FF]/.test(code)) return; // Skip if no Arabic
  if (filePath.includes('i18n.ts') || filePath.includes('egyptCities.ts') || filePath.includes('arabicNames.ts') || filePath.includes('bostaActions.ts')) return;

  const isServerComponent = code.includes('"use server"') || code.includes("'use server'") || 
    (filePath.includes('/app/') && filePath.endsWith('page.tsx') && !code.includes('"use client"') && !code.includes("'use client'"));
  
  const isClientComponent = code.includes('"use client"') || code.includes("'use client'") || filePath.includes('Client.tsx');
  
  const isAction = filePath.endsWith('actions.ts');
  
  if (!isServerComponent && !isClientComponent && !isAction && !filePath.endsWith('.tsx')) return;

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
          // Check if it's inside a JSX attribute or normal code
          // Ignore imports, requires, etc
          if (path.parent.type === 'ImportDeclaration' || path.parent.type === 'ExportNamedDeclaration') return;
          
          const key = getTranslationKey(path.node.value);
          if (key) {
            // If inside JSX attribute, e.g. placeholder="أدخل" -> placeholder={t("key")}
            if (path.parent.type === 'JSXAttribute') {
              path.replaceWith(babel.types.jsxExpressionContainer(
                babel.types.callExpression(babel.types.identifier('t'), [babel.types.stringLiteral(key)])
              ));
              needsHook = true;
              modified = true;
            } else if (isAction && path.parent.type === 'ObjectProperty' && path.parent.key.name === 'error') {
               // Ignore server actions return errors for now to keep it simple
            } else if (path.parent.type === 'ObjectProperty' || path.parent.type === 'ArrayExpression' || path.parent.type === 'CallExpression' || path.parent.type === 'VariableDeclarator' || path.parent.type === 'AssignmentExpression' || path.parent.type === 'ReturnStatement' || path.parent.type === 'JSXExpressionContainer' || path.parent.type === 'LogicalExpression' || path.parent.type === 'ConditionalExpression') {
              // Standard replacement: t("key")
              if (!isAction) {
                path.replaceWith(babel.types.callExpression(babel.types.identifier('t'), [babel.types.stringLiteral(key)]));
                needsHook = true;
                modified = true;
              }
            }
          }
        }
      },
      JSXText(path) {
        if (/[\u0600-\u06FF]/.test(path.node.value)) {
          const key = getTranslationKey(path.node.value);
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
      
      // Inject imports and hooks if needed
      if (needsHook) {
        if (isClientComponent) {
          if (!outputCode.includes('useTranslation')) {
            outputCode = `import { useTranslation } from "react-i18next";\n` + outputCode;
          }
          // Inject hook inside component functions
          outputCode = outputCode.replace(/export default function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export default function $1($2) {\n  const { t } = useTranslation();`);
          outputCode = outputCode.replace(/export function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export function $1($2) {\n  const { t } = useTranslation();`);
          outputCode = outputCode.replace(/const ([a-zA-Z0-9_]+) = \(([^)]*)\) =>\s*\{/g, `const $1 = ($2) => {\n  const { t } = useTranslation();`);
        } else if (isServerComponent) {
          if (!outputCode.includes('getServerTranslation')) {
            outputCode = `import { getServerTranslation } from "@/lib/serverI18n";\n` + outputCode;
          }
          // Inject hook inside async component functions
          outputCode = outputCode.replace(/export default async function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export default async function $1($2) {\n  const { t } = await getServerTranslation();`);
          outputCode = outputCode.replace(/export async function ([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g, `export async function $1($2) {\n  const { t } = await getServerTranslation();`);
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

fs.writeFileSync('./src/locales/ar.json', JSON.stringify(arDict, null, 2));
fs.writeFileSync('./src/locales/en.json', JSON.stringify(enDict, null, 2));
console.log("Done.");
