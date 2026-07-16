const fs = require('fs');
const content = fs.readFileSync('src/lib/i18n.ts', 'utf8');
const matches = content.match(/: ".*? \(EN\)",/g);
console.log(matches ? matches.length : 0);
