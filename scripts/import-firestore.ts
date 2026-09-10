import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = (!firebaseConfig.firestoreDatabaseId || firebaseConfig.firestoreDatabaseId === '(default)')
  ? getFirestore(app)
  : getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function importAll() {
  const backupPath = path.resolve(process.cwd(), 'firestore_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file not found at:', backupPath);
    process.exit(1);
  }

  const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  console.log(`Starting restore to project: ${firebaseConfig.projectId}...`);

  for (const [colName, docs] of Object.entries(backupData.collections as Record<string, any[]>)) {
    console.log(`Restoring collection: ${colName} (${docs.length} items)...`);
    for (const item of docs) {
      try {
        await setDoc(doc(db, colName, item.id), item.data);
      } catch (err: any) {
        console.warn(`  Failed restoring ${colName}/${item.id}:`, err.message);
      }
    }
  }

  // Restore conversation messages
  if (backupData.conversationMessages) {
    for (const [convId, messages] of Object.entries(backupData.conversationMessages as Record<string, any[]>)) {
      console.log(`Restoring messages for conversation ${convId} (${messages.length} items)...`);
      for (const msg of messages) {
        try {
          await setDoc(doc(db, 'conversations', convId, 'messages', msg.id), msg.data);
        } catch (err: any) {
          console.warn(`  Failed message ${msg.id} in ${convId}:`, err.message);
        }
      }
    }
  }

  console.log('All data restored successfully!');
  process.exit(0);
}

importAll().catch(err => {
  console.error('Restore failed:', err);
  process.exit(1);
});
