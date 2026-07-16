const fs = require('fs');
const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const I18N_PATH = 'src/lib/i18n.ts';
const content = fs.readFileSync(I18N_PATH, 'utf8');

const ast = parser.parse(content, {
  sourceType: 'module',
  plugins: ['typescript']
});

const arDict = {};
const enDict = {};
let currentDict = null;

traverse(ast, {
  ObjectProperty(path) {
    if (path.node.key.name === 'ar') {
      path.node.value.properties.forEach(p => {
        if (p.key && p.value) {
          arDict[p.key.name || p.key.value] = p.value.value;
        }
      });
    } else if (path.node.key.name === 'en') {
      path.node.value.properties.forEach(p => {
        if (p.key && p.value) {
          enDict[p.key.name || p.key.value] = p.value.value;
        }
      });
    }
  }
});

const needsTranslation = {};
for (const key in enDict) {
  if (enDict[key] && enDict[key].endsWith(' (EN)')) {
    needsTranslation[key] = arDict[key];
  }
}

fs.writeFileSync('needs-translation.json', JSON.stringify(needsTranslation, null, 2));
console.log(`Found ${Object.keys(needsTranslation).length} strings to translate.`);
