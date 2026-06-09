const fs = require('fs');
const path = require('path');

const modalsDir = './src/components/modals';
const files = fs.readdirSync(modalsDir).filter(f => f.endsWith('.tsx') && f !== 'ReconcileTakeoutModal.tsx');

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

  // Skip if already migrated
  if (content.includes('BottomSheetModal')) continue;

  // 1. Replace imports
  content = content.replace(/import Modal from 'react-native-modal';\n/, "import { BottomSheetModal, BottomSheetScrollView, BottomSheetFlatList, BottomSheetBackdrop } from '@gorhom/bottom-sheet';\n");

  // 2. Insert boilerplate before the first useEffect or handle* function, inside the component.
  // Find "export default function ComponentName({...}) {"
  const componentStartRegex = /export default function [a-zA-Z]+\([^{]*\{[^}]*\}[^)]*\)(?:\s*:\s*[a-zA-Z]+)?\s*\{/;
  const match = content.match(componentStartRegex);
  if (match) {
    const insertPos = match.index + match[0].length;
    content = content.slice(0, insertPos) + '\n' + boilerplateHead + content.slice(insertPos);
  }

  // 3. Replace Modal wrapper
  content = content.replace(/<Modal[^>]*>/, `
    <BottomSheetModal
      ref={bottomSheetRef}
      index={1}
      snapPoints={snapPoints}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: '#141714', borderRadius: 20 }}
      handleIndicatorStyle={{ backgroundColor: '#4a5e4c' }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >`);
  
  content = content.replace(/<\/Modal>/, `</BottomSheetModal>`);

  // 4. Replace KeyboardAvoidingView -> BottomSheetScrollView
  // Some files have <KeyboardAvoidingView behavior=...>
  // Some don't. We should just remove KeyboardAvoidingView.
  content = content.replace(/<KeyboardAvoidingView[^>]*>/g, '<BottomSheetScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">');
  content = content.replace(/<\/KeyboardAvoidingView>/g, '</BottomSheetScrollView>');

  // 5. Replace ScrollView -> BottomSheetScrollView if they exist inside
  // Wait, if we change KeyboardAvoidingView to BottomSheetScrollView, we don't want nested ScrollViews.
  // Actually, some files have ScrollView inside KeyboardAvoidingView. We should change those to <View> to avoid nested scrolls, or change the wrapper to View and inner to BottomSheetScrollView.
  // Let's just blindly change ScrollView to View for the inner ones since BottomSheetScrollView handles it.
  content = content.replace(/<ScrollView/g, '<View');
  content = content.replace(/<\/ScrollView>/g, '</View>');

  // 6. FlatList -> BottomSheetFlatList
  content = content.replace(/<FlatList/g, '<BottomSheetFlatList');
  content = content.replace(/<\/FlatList>/g, '</BottomSheetFlatList>');

  fs.writeFileSync(filePath, content);
  console.log(`Migrated ${file}`);
}
