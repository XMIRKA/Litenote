import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Read config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const COLLECTIONS = [
  'users',
  'posts',
  'comments',
  'conversations',
  'dev_team',
  'friendships',
  'follows',
  'notifications',
  'bookmarks',
  'sessions',
  'activity_logs',
  'calls'
];

async function exportAll() {
  console.log('Starting full database backup...');
  const backupData: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    collections: {},
    conversationMessages: {}
  };

  for (const colName of COLLECTIONS) {
    try {
      console.log(`Exporting collection: ${colName}...`);
      const snap = await getDocs(collection(db, colName));
      backupData.collections[colName] = snap.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));
      console.log(`  -> ${snap.size} documents exported from ${colName}`);
    } catch (err: any) {
      console.warn(`  Warning: failed to read ${colName}:`, err.message);
      backupData.collections[colName] = [];
    }
  }

  // Also export messages inside conversations
  if (backupData.collections.conversations) {
    for (const conv of backupData.collections.conversations) {
      try {
        const msgsSnap = await getDocs(collection(db, 'conversations', conv.id, 'messages'));
        backupData.conversationMessages[conv.id] = msgsSnap.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        }));
        if (msgsSnap.size > 0) {
          console.log(`  -> ${msgsSnap.size} messages exported for conversation ${conv.id}`);
        }
      } catch (err: any) {
        console.warn(`  Warning: failed messages for ${conv.id}:`, err.message);
      }
    }
  }

  const outPath = path.resolve(process.cwd(), 'firestore_backup.json');
  fs.writeFileSync(outPath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`Backup completed successfully! Saved to: ${outPath}`);
  process.exit(0);
}

exportAll().catch(err => {
  console.error('Export failed:', err);
  process.exit(1);
});
