const fs = require('fs');
const path = require('path');

const modalsDir = './src/components/modals';
const files = fs.readdirSync(modalsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(modalsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace <Modal isVisible={visible} onBackdropPress={...} ... >
  // with <Modal isVisible={visible} avoidKeyboard style={{ margin: 0, justifyContent: 'flex-end' }}>
  content = content.replace(/<Modal[^>]*>/, (match) => {
    let newMatch = match.replace(/onBackdropPress=\{[^}]+\}/, '');
    newMatch = newMatch.replace(/onSwipeComplete=\{[^}]+\}/, '');
    newMatch = newMatch.replace(/swipeDirection="[^"]+"/, '');
    newMatch = newMatch.replace(/avoidKeyboard(\{true\})?/, ''); // remove if exists
    // inject avoidKeyboard
    newMatch = newMatch.replace('<Modal ', '<Modal avoidKeyboard ');
    // clean up double spaces
    return newMatch.replace(/\s+/g, ' ');
  });

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
}
