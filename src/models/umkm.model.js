// src/models/umkm.model.js
import { db, admin } from '../config/firebase.js';

// ---------- helpers ----------
const toNumOrNull = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const norm  = (s) => (s !== undefined && s !== null ? String(s).trim() : null);
const lower = (s) => (s ? String(s).toLowerCase() : null);
const digits = (s) => (s ? String(s).replace(/\D+/g, '') : null);

// counter untuk auto-increment id (running number)
async function nextSeq() {
  const ref = db.collection('counters').doc('umkm');
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur  = snap.exists ? Number(snap.data().seq || 0) : 0;
    const nxt  = cur + 1;
    if (snap.exists) {
      tx.update(ref, { seq: nxt, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, { seq: nxt, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    return nxt;
  });
}

// ---------- CRUD ----------
export const createUmkm = async (body = {}) => {
  const idNumber = await nextSeq();

  const payload = {
    id: idNumber,                          // number
    name: norm(body.name),
    name_lower: lower(body.name),
    image: norm(body.image),
    description: norm(body.description),
    category: norm(body.category),
    category_lower: lower(body.category),
    marketplaceUrl: norm(body.marketplaceUrl),
    whatsapp: digits(body.whatsapp),
    location: norm(body.location),
    location_lower: lower(body.location),

    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = db.collection('umkm').doc(String(idNumber)); // docId harus string
  await ref.set(payload, { merge: false });

  const snap = await ref.get();
  return { id: idNumber, ...snap.data() };
};

export const updateUmkm = async (docId, body = {}) => {
  const ref = db.collection('umkm').doc(String(docId));
  const snap0 = await ref.get();
  if (!snap0.exists) throw new Error('UMKM not found');

  const patch = {};
  if (body.name !== undefined) {
    patch.name = norm(body.name);
    patch.name_lower = lower(body.name);
  }
  if (body.image !== undefined) patch.image = norm(body.image);
  if (body.description !== undefined) patch.description = norm(body.description);
  if (body.category !== undefined) {
    patch.category = norm(body.category);
    patch.category_lower = lower(body.category);
  }
  if (body.marketplaceUrl !== undefined) patch.marketplaceUrl = norm(body.marketplaceUrl);
  if (body.whatsapp !== undefined) patch.whatsapp = digits(body.whatsapp);
  if (body.location !== undefined) {
    patch.location = norm(body.location);
    patch.location_lower = lower(body.location);
  }

  patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await ref.set(patch, { merge: true });
  const snap = await ref.get();
  const data = snap.data();

  // pastikan id number
  return { ...data, id: Number(data.id) };
};

export const deleteUmkm = async (docId) => {
  const ref = db.collection('umkm').doc(String(docId));
  const snap = await ref.get();
  if (!snap.exists) throw new Error('UMKM not found');
  await ref.delete();
  return { id: Number(docId) };
};

export const getUmkmById = async (docId) => {
  const doc = await db.collection('umkm').doc(String(docId)).get();
  if (!doc.exists) throw new Error('UMKM not found');
  return { id: Number(doc.id), ...doc.data() };
};

// ---------- List dengan pagination + sort + filter ----------
// Cursor encoding untuk orderBy compound (sortField + id)
const encodeCursor = (sortVal, id) =>
  Buffer.from(JSON.stringify({ s: sortVal ?? null, id: Number(id) }), 'utf8').toString('base64');

const decodeCursor = (cur) => {
  if (cur == null || cur === '') return null;
  // dukung cursor numeric sederhana untuk sortBy=id
  if (/^\d+$/.test(String(cur))) return { s: Number(cur), id: Number(cur) };
  try {
    const obj = JSON.parse(Buffer.from(String(cur), 'base64').toString('utf8'));
    return { s: obj?.s ?? null, id: Number(obj?.id) };
  } catch {
    return null;
  }
};

/**
 * listUmkm
 * Query params (opsional):
 * - limit (default 20, max 100)
 * - cursor (base64 dari {s, id} atau angka untuk sortBy=id)
 * - sortBy: 'id' | 'name' | 'category' | 'createdAt' (default: 'id')
 * - order: 'asc' | 'desc' (default: 'asc')
 * - q: search prefix by name (pakai name_lower)
 * - category: exact match (case-ins) by category_lower
 */
export const listUmkm = async (opts = {}) => {
  const limit = Math.min(Number(opts.limit || 20), 100);
  const sortBy = String(opts.sortBy || 'id').toLowerCase();
  const order  = (String(opts.order || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc');
  const nameQ  = opts.q ? String(opts.q).toLowerCase() : '';
  const category = opts.category ? String(opts.category).toLowerCase() : '';

  let qRef = db.collection('umkm');

  // filter: category exact
  if (category) {
    qRef = qRef.where('category_lower', '==', category);
  }

  // pencarian prefix by name
  let effectiveSort = sortBy;
  if (nameQ) {
    const k = nameQ;
    qRef = qRef.where('name_lower', '>=', k).where('name_lower', '<', `${k}\uf8ff`);
    // Firestore mensyaratkan orderBy pertama = field range
    effectiveSort = 'name';
  }

  // mapping sort field
  const sortField =
    effectiveSort === 'name' ? 'name_lower' :
    effectiveSort === 'category' ? 'category_lower' :
    effectiveSort === 'createdat' ? 'createdAt' :
    'id'; // default

  // orderBy utama
  qRef = qRef.orderBy(sortField, order);

  // tambahkan tie-breaker stabil
  if (sortField !== 'id') {
    qRef = qRef.orderBy('id', 'asc');
  }

  // cursor
  const cur = decodeCursor(opts.cursor);
  if (cur) {
    if (sortField === 'id') {
      // single orderBy
      qRef = qRef.startAfter(Number(cur.id));
    } else {
      qRef = qRef.startAfter(cur.s ?? null, Number(cur.id));
    }
  }

  const snap = await qRef.limit(limit + 1).get();
  const docs = snap.docs.slice(0, limit);

  const items = docs.map((d) => ({ id: Number(d.get('id')), ...d.data() }));

  let nextCursor = null;
  if (snap.size > limit) {
    const last = docs[docs.length - 1];
    const lastSortVal = last.get(sortField);
    const lastId      = Number(last.get('id'));
    nextCursor = sortField === 'id' ? String(lastId) : encodeCursor(lastSortVal, lastId);
  }

  return {
    items,
    pageInfo: {
      limit,
      hasNextPage: Boolean(nextCursor),
      nextCursor,
      sortBy: effectiveSort,
      order,
    },
  };
};