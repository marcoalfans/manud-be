// data/seed_umkm.mjs
// ESM seeder for Firestore (Admin SDK)
// - Reads UMKM data from JSON
// - Ensures numeric incremental IDs (1,2,3,...)
// - If a record has no parsable id, allocate via transaction counter 'counters/umkm'
// - Writes to collection 'umkm' (override with SEED_UMKM_COLLECTION)
// - Uses docId = String(id), field id = Number(id)

import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load env from project root (one level up from data/)
dotenvConfig({ path: path.join(__dirname, '..', '.env') });

const sa = {
  projectId: process.env.PROJECT_ID,
  clientEmail: process.env.CLIENT_EMAIL,
  privateKey: (process.env.PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};
if (!sa.projectId || !sa.clientEmail || !sa.privateKey) {
  console.error('Missing PROJECT_ID / CLIENT_EMAIL / PRIVATE KEY in env.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(sa) });
admin.firestore().settings({ ignoreUndefinedProperties: true });
const db = admin.firestore();

// Choose input file: default to umkm.json (already numeric),
// or set SEED_UMKM_FILE=umkm.json to read string ids like "u-1", which we will convert.
const inputFile = process.env.SEED_UMKM_FILE || 'umkm.json';
const jsonPath  = path.join(__dirname, inputFile);

if (!fs.existsSync(jsonPath)) {
  console.error('Input file not found:', jsonPath);
  process.exit(1);
}

/** @type {Array<Record<string, any>>} */
const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const collectionName = process.env.SEED_UMKM_COLLECTION || 'umkm';

const norm   = (s) => (s !== undefined && s !== null ? String(s).trim() : null);
const lower  = (s) => (s ? String(s).toLowerCase() : null);
const digits = (s) => (s ? String(s).replace(/\D+/g, '') : null);

// Parse numeric id from any string like "u-12"; returns number or NaN
const toNumericId = (val) => {
  if (val === null || val === undefined || val === '') return NaN;
  const s = String(val);
  const m = s.match(/\d+/);
  if (!m) return NaN;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : NaN;
};

// Allocate next running number via transaction
async function nextSeq() {
  const ref = db.collection('counters').doc('umkm');
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? Number(snap.data().seq || 0) : 0;
    const nxt = cur + 1;
    if (snap.exists) {
      tx.update(ref, { seq: nxt, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, { seq: nxt, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    return nxt;
  });
}

const chunk = (arr, size) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

const batches = chunk(payload, 400);
let written = 0;

for (const slice of batches) {
  const batch = db.batch();

  for (const raw of slice) {
    let idNum = Number.isFinite(raw.id) ? Number(raw.id) : toNumericId(raw.id);
    if (!Number.isFinite(idNum)) {
      idNum = await nextSeq(); // allocate if needed
    }

    const rec = {
      id: idNum,                                 // number
      name: norm(raw.name),
      name_lower: lower(raw.name),
      image: norm(raw.image),
      description: norm(raw.description),
      category: norm(raw.category),
      category_lower: lower(raw.category),
      marketplaceUrl: norm(raw.marketplaceUrl),
      whatsapp: digits(raw.whatsapp),            // only digits, no '+'
      location: norm(raw.location),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = db.collection(collectionName).doc(String(idNum)); // docId must be string
    batch.set(ref, rec, { merge: false });
  }

  await batch.commit();
  written += slice.length;
  console.log(`Committed ${written}/${payload.length} records...`);
}

console.log('Done.');
process.exit(0);