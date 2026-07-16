const fs = require('fs');
const path = require('path');

const arabicTranslations = JSON.parse(fs.readFileSync('needs-translation.json', 'utf8'));

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Match t("trans_XXX") or t('trans_XXX')
      const regex = /t\(['"](trans_\d+)['"]\)/g;
      
      content = content.replace(regex, (match, key) => {
        if (arabicTranslations[key]) {
          changed = true;
          return JSON.stringify(arabicTranslations[key]);
        }
        return match;
      });

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Reverted translations in ${fullPath}`);
      }
    }
  }
}

traverse(path.join(__dirname, 'src'));
console.log('Revert complete.');
