// seed_from_json.mjs
import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// .env di root project
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

// ---- Service account dari env
const sa = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!sa.projectId || !sa.clientEmail || !sa.privateKey) {
  console.error('Missing PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY in env.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa) });
admin.firestore().settings({ ignoreUndefinedProperties: true });
const db = admin.firestore();

// ---- Data file
const jsonPath = path.join(__dirname, 'destinations.json'); // isi sesuai kebutuhan
const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// ---- Opsi seeding
const collectionName = process.env.SEED_COLLECTION || 'destinations';
const docIdMode = (process.env.SEED_DOC_ID || 'dataset').toLowerCase(); // 'dataset' | 'composite'

// Sumber userId untuk mode 'composite'
const seedUserIdEnv = process.env.SEED_USER_ID;             // ex: "42"
let userCounter = Number.parseInt(process.env.SEED_UID_START || '1', 10); // running number kalau tidak pakai SEED_USER_ID
if (!Number.isFinite(userCounter)) userCounter = 1;

// ---- Helpers
const toNum = (v, fallback = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const cleanMoneyOrNan = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === 'nan' || s === '' || s === 'null' || s === 'undefined') return null;
  return String(v); // tetap string "Rp..." untuk entry fee
};

const normalizeRecord = (rec) => {
  // pastikan id number
  const idNum = toNum(rec.id);
  if (!Number.isFinite(idNum)) {
    throw new Error(`Record tanpa id number yang valid: ${JSON.stringify(rec).slice(0,120)}...`);
  }

  // rating number (boleh null)
  const ratingNum = toNum(rec.rating, null);

  return {
    ...rec,
    id: idNum, // simpan sebagai number
    rating: ratingNum,
    childEntry: cleanMoneyOrNan(rec.childEntry),
    adultsEntry: cleanMoneyOrNan(rec.adultsEntry),
    name_lower: (rec.name || '').toLowerCase(),
    // bisa tambah regency_lower / category_lower bila mau query cepat
    // regency_lower: (rec.regency || '').toLowerCase(),
    // category_lower: (rec.category || '').toLowerCase(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const batches = chunk(payload, 400);
let written = 0;

for (const slice of batches) {
  const batch = db.batch();

  for (const raw of slice) {
    const rec = normalizeRecord(raw);

    // docId harus STRING
    const baseDocId = String(rec.id);

    // tentukan docId sesuai mode
    let docId;
    if (docIdMode === 'composite') {
      const userId = seedUserIdEnv ?? userCounter++; // pakai env kalau ada, kalau tidak running number
      docId = `${userId}_${baseDocId}`;
      rec.userId = Number.isFinite(Number(userId)) ? Number(userId) : userId; // simpan juga userId di dokumen
    } else {
      docId = baseDocId; // default: pakai id dataset
    }

    const ref = db.collection(collectionName).doc(docId);
    batch.set(ref, rec, { merge: false });
  }

  await batch.commit();
  written += slice.length;
  console.log(`Committed ${written}/${payload.length} records...`);
}

console.log('Done.');
process.exit(0);