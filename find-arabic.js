const fs = require('fs');
const path = require('path');

function findArabicText(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findArabicText(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (/[\u0600-\u06FF]/.test(content)) {
        console.log(`Found Arabic in: ${fullPath}`);
      }
    }
  }
}

findArabicText(path.join(__dirname, 'src'));
