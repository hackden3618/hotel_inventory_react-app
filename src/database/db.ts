import * as SQLite from 'expo-sqlite';

// Open the database synchronously
export const db = SQLite.openDatabaseSync('mealsledger.db');

export interface Meal {
  id: number;
  name: string;
  price: number;
  stock: number;
  lowAlert: number;
  image: string; // Emoji representing the meal
}

export interface Transaction {
  id: number;
  type: 'sale' | 'takeaway' | 'consumed' | 'returned' | 'expense' | 'purchase' | 'debtor_payment' | 'creditor_payment';
  title: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'credit' | 'none';
  date: string;
  referenceName?: string; // Debtor, Creditor, or Staff name
}

export interface Debtor {
  id: number;
  name: string;
  totalOwed: number;
  totalPaid: number;
  lastUpdated: string;
}

export interface Creditor {
  id: number;
  name: string;
  totalOwed: number;
  totalPaid: number;
  lastUpdated: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'stock' | 'payment' | 'flow' | 'general';
  read: number; // 0 or 1
  date: string;
}

// Initialize tables
export function initDatabase() {
  // Create tables if they don't exist
  db.execSync(`
    CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      price REAL,
      stock INTEGER,
      lowAlert INTEGER,
      image TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      title TEXT,
      description TEXT,
      amount REAL,
      paymentMethod TEXT,
      date TEXT,
      referenceName TEXT
    );

    CREATE TABLE IF NOT EXISTS debtors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      totalOwed REAL,
      totalPaid REAL,
      lastUpdated TEXT
    );

    CREATE TABLE IF NOT EXISTS creditors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      totalOwed REAL,
      totalPaid REAL,
      lastUpdated TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      message TEXT,
      type TEXT,
      read INTEGER DEFAULT 0,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed default inventory items if table is empty
  const countMeals = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM meals');
  if (countMeals && countMeals.count === 0) {
    db.runSync("INSERT INTO meals (name, price, stock, lowAlert, image) VALUES ('Chapati', 20.0, 210, 30, '🫓')");
    db.runSync("INSERT INTO meals (name, price, stock, lowAlert, image) VALUES ('Tea', 15.0, 210, 20, '☕')");
    db.runSync("INSERT INTO meals (name, price, stock, lowAlert, image) VALUES ('Pilau', 80.0, 12, 15, '🥘')");
    db.runSync("INSERT INTO meals (name, price, stock, lowAlert, image) VALUES ('Wheat Flour', 200.0, 3, 1, '🌾')"); // Flour is an ingredient / raw stock
  }

  // Seed business settings if empty
  const countSettings = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM settings');
  if (countSettings && countSettings.count === 0) {
    db.runSync("INSERT INTO settings (key, value) VALUES ('business_name', 'Wambu\'s corner hotel')");
  }

  // Seed some initial history if empty for a complete feeling demo
  const countTx = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
  if (countTx && countTx.count === 0) {
    const today = new Date().toISOString();
    db.runSync(
      `INSERT INTO transactions (type, title, description, amount, paymentMethod, date) 
       VALUES ('sale', 'Sale — Cash', '15 Chapati · 8 Tea', 420.0, 'cash', ?)`,
      [today]
    );
    db.runSync(
      `INSERT INTO transactions (type, title, description, amount, paymentMethod, date, referenceName) 
       VALUES ('takeaway', 'Meal Taken Out', '12 Chapati', 240.0, 'none', ?, 'John')`,
      [today]
    );
    db.runSync(
      `INSERT INTO transactions (type, title, description, amount, paymentMethod, date, referenceName) 
       VALUES ('purchase', 'Credited Purchase', 'Wheat Flour Supply', 4200.0, 'credit', ?, 'Kamau Traders')`,
      [today]
    );
    
    // Seed initial debtors / creditors to match transactions
    db.runSync(
      "INSERT INTO debtors (name, totalOwed, totalPaid, lastUpdated) VALUES ('John', 2500.0, 1000.0, ?)",
      [today]
    );
    db.runSync(
      "INSERT INTO creditors (name, totalOwed, totalPaid, lastUpdated) VALUES ('Kamau Traders', 4200.0, 0.0, ?)",
      [today]
    );

    // Initial notifications
    db.runSync(
      "INSERT INTO notifications (title, message, type, date) VALUES ('Pilau stock low', 'Pilau stock is critically low — 12 remaining', 'stock', ?)",
      [today]
    );
  }
}

// --------------------- CRUD OPERATIONS ---------------------

// Meals / Inventory
export function getMeals(): Meal[] {
  return db.getAllSync<Meal>('SELECT * FROM meals ORDER BY id ASC');
}

export function updateMealStock(id: number, newStock: number) {
  db.runSync('UPDATE meals SET stock = ? WHERE id = ?', [newStock, id]);
}

export function addMeal(name: string, price: number, stock: number, lowAlert: number, image: string) {
  db.runSync(
    'INSERT OR REPLACE INTO meals (name, price, stock, lowAlert, image) VALUES (?, ?, ?, ?, ?)',
    [name, price, stock, lowAlert, image]
  );
}

// Transactions
export function getTransactions(): Transaction[] {
  return db.getAllSync<Transaction>('SELECT * FROM transactions ORDER BY date DESC');
}

export function addTransaction(
  type: Transaction['type'],
  title: string,
  description: string,
  amount: number,
  paymentMethod: Transaction['paymentMethod'],
  referenceName?: string
) {
  const date = new Date().toISOString();
  db.runSync(
    `INSERT INTO transactions (type, title, description, amount, paymentMethod, date, referenceName) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [type, title, description, amount, paymentMethod, date, referenceName || null]
  );

  // Auto trigger notifications on stock flows / low stock
  if (type === 'sale') {
    // Check if any meal is low
    const meals = getMeals();
    meals.forEach(meal => {
      if (meal.stock <= meal.lowAlert) {
        addNotification(
          'Low Stock Alert',
          `${meal.name} stock is low — ${meal.stock} remaining`,
          'stock'
        );
      }
    });
  }
}

// Debtors
export function getDebtors(): Debtor[] {
  return db.getAllSync<Debtor>('SELECT * FROM debtors ORDER BY name ASC');
}

export function updateDebtor(name: string, amtOwedDelta: number, amtPaidDelta: number) {
  const date = new Date().toISOString();
  const existing = db.getFirstSync<Debtor>('SELECT * FROM debtors WHERE name = ?', [name]);

  if (existing) {
    const newOwed = existing.totalOwed + amtOwedDelta;
    const newPaid = existing.totalPaid + amtPaidDelta;
    db.runSync(
      'UPDATE debtors SET totalOwed = ?, totalPaid = ?, lastUpdated = ? WHERE id = ?',
      [newOwed, newPaid, date, existing.id]
    );
  } else {
    db.runSync(
      'INSERT INTO debtors (name, totalOwed, totalPaid, lastUpdated) VALUES (?, ?, ?, ?)',
      [name, amtOwedDelta, amtPaidDelta, date]
    );
  }
}

export function clearDebtor(id: number) {
  const debtor = db.getFirstSync<Debtor>('SELECT * FROM debtors WHERE id = ?', [id]);
  if (debtor) {
    db.runSync('DELETE FROM debtors WHERE id = ?', [id]);
    addNotification(
      'Debtor Cleared',
      `Debtor ${debtor.name} has been successfully cleared from the list`,
      'payment'
    );
  }
}

// Creditors
export function getCreditors(): Creditor[] {
  return db.getAllSync<Creditor>('SELECT * FROM creditors ORDER BY name ASC');
}

export function updateCreditor(name: string, amtOwedDelta: number, amtPaidDelta: number) {
  const date = new Date().toISOString();
  const existing = db.getFirstSync<Creditor>('SELECT * FROM creditors WHERE name = ?', [name]);

  if (existing) {
    const newOwed = existing.totalOwed + amtOwedDelta;
    const newPaid = existing.totalPaid + amtPaidDelta;
    db.runSync(
      'UPDATE creditors SET totalOwed = ?, totalPaid = ?, lastUpdated = ? WHERE id = ?',
      [newOwed, newPaid, date, existing.id]
    );
  } else {
    db.runSync(
      'INSERT INTO creditors (name, totalOwed, totalPaid, lastUpdated) VALUES (?, ?, ?, ?)',
      [name, amtOwedDelta, amtPaidDelta, date]
    );
  }
}

// Notifications
export function getNotifications(): Notification[] {
  return db.getAllSync<Notification>('SELECT * FROM notifications ORDER BY date DESC LIMIT 50');
}

export function getUnreadNotificationsCount(): number {
  const res = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE read = 0');
  return res ? res.count : 0;
}

export function addNotification(title: string, message: string, type: Notification['type']) {
  const date = new Date().toISOString();
  db.runSync(
    'INSERT INTO notifications (title, message, type, date) VALUES (?, ?, ?, ?)',
    [title, message, type, date]
  );
}

export function markNotificationsAsRead() {
  db.runSync('UPDATE notifications SET read = 1 WHERE read = 0');
}

// Settings
export function getSetting(key: string): string {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : '';
}

export function updateSetting(key: string, value: string) {
  db.runSync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
}
