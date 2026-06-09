const fs = require('fs');
const path = require('path');

const modalsDir = './src/components/modals';
const files = fs.readdirSync(modalsDir).filter(f => f.endsWith('.tsx'));

const boilerplateHead = `
  const bottomSheetRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ['50%', '90%', '100%'], []);
  
  React.useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = React.useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  );
`;

for (const file of files) {
  const filePath = path.join(modalsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix missing boilerplate if bottomSheetRef is used but not defined
  if (content.includes('ref={bottomSheetRef}') && !content.includes('const bottomSheetRef')) {
    // find the first '{' after 'export default function' or 'const Component ='
    content = content.replace(/export default function[^{]+\{/, match => match + '\n' + boilerplateHead);
  }

  // Fix `<View showsVerticalScrollIndicator` -> `<BottomSheetScrollView showsVerticalScrollIndicator`
  content = content.replace(/<View([^>]*showsVerticalScrollIndicator[^>]*)>/g, '<BottomSheetScrollView$1>');
  content = content.replace(/<View([^>]*showsHorizontalScrollIndicator[^>]*)>/g, '<BottomSheetScrollView$1>');
  
  // Need to balance closing tags. This might be tricky if we don't know which `</View>` to replace.
  // Actually, `<View showsVerticalScrollIndicator={false}>` was originally `<ScrollView showsVerticalScrollIndicator={false}>`.
  // Since we blindly replaced `<ScrollView` with `<View` earlier, let's just revert any `<View` with scroll props to `<ScrollView` and rely on normal ScrollView inside BottomSheetModal, or use `<BottomSheetScrollView`.
  // BUT `<BottomSheetScrollView` is better.
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
}
