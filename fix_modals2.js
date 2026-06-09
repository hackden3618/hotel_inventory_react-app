const fs = require('fs');
const path = require('path');

const modalsDir = './src/components/modals';
const files = fs.readdirSync(modalsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(modalsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace ={true} which was left hanging
  content = content.replace(/ =\{true\}/g, '');
  
  fs.writeFileSync(filePath, content);
  console.log(`Cleaned ${file}`);
}
