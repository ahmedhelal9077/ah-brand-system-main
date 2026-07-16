const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Fix "use client" placement
  if (content.includes('"use client"') || content.includes("'use client'")) {
    // Remove all instances
    content = content.replace(/"use client";?\n?/g, '');
    content = content.replace(/'use client';?\n?/g, '');
    // Put it exactly at the top
    content = `"use client";\n` + content;
  }

  // 2. Fix duplicate `t` definitions from useSettings
  // Find lines like `const { t } = useSettings();`
  // and see if there are other `useSettings()` calls in the same scope
  
  if (content.match(/const \{ t \} = useSettings\(\);/g)?.length > 1) {
    // If it appears multiple times, keep only the first one
    let first = true;
    content = content.replace(/const \{ t \} = useSettings\(\);/g, (match) => {
      if (first) {
        first = false;
        return match;
      }
      return '';
    });
  }

  // Handle case where `{ t }` was injected but `{ t, theme, ... }` already existed
  if (content.includes('useSettings()')) {
    const lines = content.split('\n');
    let hasComplexUseSettings = false;
    for (const line of lines) {
      if (line.includes('useSettings()') && line.includes(',') && line.includes('t')) {
        hasComplexUseSettings = true;
      }
    }
    if (hasComplexUseSettings) {
      // Remove the simple `const { t } = useSettings();`
      content = content.replace(/\s*const \{ t \} = useSettings\(\);\n?/g, '\n');
    }
  }

  // 3. Same for getServerTranslation
  if (content.match(/const \{ t \} = await getServerTranslation\(\);/g)?.length > 1) {
    let first = true;
    content = content.replace(/const \{ t \} = await getServerTranslation\(\);/g, (match) => {
      if (first) {
        first = false;
        return match;
      }
      return '';
    });
  }
  
  // Clean up duplicate imports
  if (content.match(/import \{ useSettings \} from "@/g)?.length > 1) {
    content = content.replace(/import \{ useSettings \} from "@\/lib\/SettingsContext";\n/, '');
  }
  if (content.match(/import \{ getServerTranslation \} from "@/g)?.length > 1) {
    content = content.replace(/import \{ getServerTranslation \} from "@\/lib\/serverI18n";\n/, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
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
