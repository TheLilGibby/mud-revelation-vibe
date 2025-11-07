const fs = require('fs');
const content = fs.readFileSync('src/pages/GuidesPage.js', 'utf8');
const lines = content.split('\n');
const truncated = lines.slice(0, 1845).join('\n');
fs.writeFileSync('src/pages/GuidesPage.js', truncated, 'utf8');
console.log('File truncated to 1845 lines');

