const fs = require('fs');
const path = require('path');

const files = [
  'src/components/modals/LedgerModal.tsx',
  'src/components/modals/PaymentModal.tsx',
  'src/components/modals/SettingsModal.tsx',
  'src/components/modals/RecordPurchaseModal.tsx',
  'src/components/modals/DispatchTakeoutModal.tsx',
  'src/components/modals/AddMealModal.tsx',
  'src/components/modals/RecordSaleModal.tsx',
  'src/components/modals/NotificationsModal.tsx',
  'src/components/modals/ReconcileTakeoutModal.tsx',
  'src/components/modals/AddInventoryModal.tsx',
  'src/components/modals/RecordExpenseModal.tsx',
  'src/components/ui/FloatingTabBar.tsx',
  'src/components/ui/StaffDropdown.tsx',
  'src/components/ui/AppBottomSheet.tsx',
  'src/components/ui/ProductImage.tsx',
  'src/components/screens/AiAnalystScreen.tsx',
  'src/components/screens/HomeScreen.tsx',
  'src/components/screens/InventoryScreen.tsx',
  'src/components/screens/TransactionsScreen.tsx',
  'src/components/screens/DebtorsScreen.tsx',
  'src/app/_layout.tsx',
  'src/app/index.tsx'
];

const replacements = {
  // Backgrounds
  'bg-\\[#141714\\]': 'bg-card',
  'bg-\\[#1c201b\\]': 'bg-input',
  'bg-\\[#000000\\]': 'bg-background',
  'bg-black': 'bg-background',
  'bg-white/5': 'bg-white/10 dark:bg-white/5', // Actually, wait, background borders/overlays
  
  // Texts
  'text-\\[#f0f4f0\\]': 'text-foreground',
  'text-\\[#8a9e8c\\]': 'text-muted',
  'text-\\[#4a5e4c\\]': 'text-muted-dark',
  'text-\\[#1c201b\\]': 'text-input',

  // Borders
  'border-white/5': 'border-border-light',
  'border-white/10': 'border-border',

  // Accents
  'text-\\[#2ecc71\\]': 'text-primary',
  'bg-\\[#2ecc71\\]': 'bg-primary',
  'border-\\[#2ecc71\\]': 'border-primary',
  
  'text-\\[#e74c3c\\]': 'text-danger',
  'bg-\\[#e74c3c\\]': 'bg-danger',
  'border-\\[#e74c3c\\]': 'border-danger',

  'text-\\[#f39c12\\]': 'text-warning',
  'bg-\\[#f39c12\\]': 'bg-warning',
  'border-\\[#f39c12\\]': 'border-warning',

  'text-\\[#0d1a12\\]': 'text-primary-foreground',
  'bg-\\[#0d1a12\\]': 'bg-primary-foreground',
  'border-\\[#0d1a12\\]': 'border-primary-foreground',
  
  // Specific alphas (hacky but works)
  'bg-\\[#2ecc71\\]/10': 'bg-primary/10',
  'border-\\[#2ecc71\\]/20': 'border-primary/20',
  'border-\\[#2ecc71\\]/30': 'border-primary/30',
  
  'bg-\\[#e74c3c\\]/5': 'bg-danger/5',
  'bg-\\[#e74c3c\\]/10': 'bg-danger/10',
  'border-\\[#e74c3c\\]/30': 'border-danger/30',
  'border-\\[#e74c3c\\]/40': 'border-danger/40',
  
  'bg-\\[#f39c12\\]/10': 'bg-warning/10',
  'bg-\\[#f39c12\\]/20': 'bg-warning/20',
  'border-\\[#f39c12\\]/30': 'border-warning/30',
};

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const [key, value] of Object.entries(replacements)) {
    const regex = new RegExp(key, 'g');
    content = content.replace(regex, value);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
