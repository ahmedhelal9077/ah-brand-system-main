const fs = require('fs');
const path = require('path');

const extractedStrings = new Set();

function extractFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Exclude certain files
  if (filePath.includes('egyptCities') || filePath.includes('arabicNames')) return;
  
  // Extract JSX text
  const jsxMatch = content.match(/>([^<]*?[\u0600-\u06FF]+[^<]*?)</g);
  if (jsxMatch) {
    jsxMatch.forEach(m => {
      let str = m.substring(1, m.length - 1).trim();
      if (str && !str.includes('{') && !str.includes('}') && !str.includes('/>') && !str.includes('="')) extractedStrings.add(str);
    });
  }

  // Extract strings in double quotes (JSX props like placeholder="...", or regular strings)
  const dQuotes = content.match(/"([^"\\]*?[\u0600-\u06FF]+[^"\\]*?)"/g);
  if (dQuotes) {
    dQuotes.forEach(m => {
      let str = m.substring(1, m.length - 1).trim();
      if (str && !str.includes('$') && !str.includes('{') && !str.includes('}')) extractedStrings.add(str);
    });
  }

  // Extract strings in single quotes
  const sQuotes = content.match(/'([^'\\]*?[\u0600-\u06FF]+[^'\\]*?)'/g);
  if (sQuotes) {
    sQuotes.forEach(m => {
      let str = m.substring(1, m.length - 1).trim();
      if (str && !str.includes('$') && !str.includes('{') && !str.includes('}')) extractedStrings.add(str);
    });
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
      extractFromFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));

const dict = {};
let counter = 1;

Array.from(extractedStrings).forEach(str => {
  // Simple heuristic to ignore JS code or too long text
  if (str.length < 150 && !str.includes('=>') && !str.includes('=')) {
    dict[`trans_${counter}`] = str;
    counter++;
  }
});

fs.writeFileSync('extracted-arabic.json', JSON.stringify(dict, null, 2));
console.log(`Extracted ${Object.keys(dict).length} unique Arabic strings.`);
