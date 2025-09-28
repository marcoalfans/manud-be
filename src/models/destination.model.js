import { db, admin } from '../config/firebase.js';

export const readDataDestinations = async (userId, name = '') => {
  let q = db.collection('destinations');

  if (userId !== undefined && userId !== null && userId !== '') {
    const uid = Number.isFinite(Number(userId)) ? Number(userId) : userId;
    q = q.where('userId', '==', uid);
  }

  if (name) {
    const key = String(name).toLowerCase();
    q = q
      .where('name_lower', '>=', key)
      .where('name_lower', '<', `${key}\uf8ff`); // ← backtick diperbaiki
  }

  const snap = await q.get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

/**
 * Ambil detail 1 destinasi berdasarkan docId Firestore (mis. "4")
 */
export const readDestinationById = async (docId) => {
  const doc = await db.collection('destinations').doc(String(docId)).get();
  if (!doc.exists) throw new Error('Destination not found');
  return { id: doc.id, ...doc.data() };
};

/**
 * Browse seluruh destinasi (tanpa user filter), dengan optional filter nama/regency/category.
 * Catatan: Supaya bisa full index-based, idealnya simpan regency_lower & category_lower saat seeding.
 * Untuk sekarang kita fallback filter di memory jika field lower belum tersedia.
 */
export const browseDataset = async (name, regency, category) => {
  let q = db.collection('destinations');

  // Kalau ada name_lower di dokumen, gunakan prefix search
  if (name) {
    const key = String(name).toLowerCase();
    q = q.where('name_lower', '>=', key).where('name_lower', '<', `${key}\uf8ff`);
  }

  const snap = await q.limit(500).get(); // batasi sesuai kebutuhan
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  // Fallback filter in-memory untuk regency/category (case-insensitive)
  if (regency) {
    const k = String(regency).toLowerCase();
    list = list.filter((x) => (x.regency || '').toLowerCase().includes(k));
  }
  if (category) {
    const k = String(category).toLowerCase();
    list = list.filter((x) => (x.category || '').toLowerCase().includes(k));
  }

  return list;
};

/**
 * Simpan "favorit" user:
 * - Kita BUAT dokumen baru dengan docId gabungan `${userId}_${destinationId}`
 *   agar tidak menimpa dokumen dataset asli (docId = destinationId).
 */
export const saveDestination = async (userId, destinationId) => {
  const uid = Number.isFinite(Number(userId)) ? Number(userId) : userId;

  // Ambil dokumen dataset aslinya
  const base = await readDestinationById(destinationId);

  const docId = `${uid}_${base.id}`;
  const ref = db.collection('destinations').doc(docId);

  await ref.set({
    ...base,
    userId: uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return docId;
};

/**
 * Hapus favorit user
 */
export const deleteDestination = async (userId, destinationId) => {
  const uid = Number.isFinite(Number(userId)) ? Number(userId) : userId;
  const docId = `${uid}_${destinationId}`;
  await db.collection('destinations').doc(docId).delete();
};

/**
 * Hapus semua favorit user (tanpa mengganggu dataset asli).
 * Menghapus doc yang punya userId == uid.
 */
export const deleteAllDestination = async (userId) => {
  const uid = Number.isFinite(Number(userId)) ? Number(userId) : userId;
  const q = db.collection('destinations').where('userId', '==', uid);
  const page = 400;

  while (true) {
    const snap = await q.limit(page).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    if (snap.size < page) break;
  }
};

// helper
const toNumOrNull = (v) => (v === undefined || v === null || v === '' ? null : Number(v));
const norm  = (s) => (s ? String(s).trim() : null);
const lower = (s) => (s ? String(s).toLowerCase() : null);

async function getNextSequence(name) {
  const ref = db.collection('counters').doc(name);
  return await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const current = snap.exists ? Number(snap.data().seq || 0) : 0;
    const next = current + 1;
    if (snap.exists) {
      tx.update(ref, { seq: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    } else {
      tx.set(ref, { seq: next, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    return next;
  });
}

/**
 * CREATE — id auto-increment (running number), payload TIDAK perlu id
 * docId Firestore = String(idNumber), field id disimpan sebagai number
 */
export const createDestination = async (_unusedUser, body = {}) => {
  const idNumber = await getNextSequence('destinations'); // <<-- kunci auto-increment

  const payload = {
    id: idNumber, 
    name: norm(body.name),
    regency: norm(body.regency),
    category: norm(body.category),
    rating: toNumOrNull(body.rating),
    location: norm(body.location),
    childEntry: norm(body.childEntry),
    adultsEntry: norm(body.adultsEntry),
    imageLink: norm(body.imageLink),
    information: body.information ?? null,

    // turunan & meta
    name_lower: lower(body.name),
    regency_lower: lower(body.regency) || undefined,
    category_lower: lower(body.category) || undefined,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  const ref = db.collection('destinations').doc(String(idNumber));
  await ref.set(payload, { merge: false });

  const snap = await ref.get();
  return { id: idNumber, ...snap.data() };
};
  
  /**
   * UPDATE — perbarui sebagian field
   * - Recompute field turunan (name_lower/regency_lower/category_lower) jika field asal berubah
   */
   export const updateDestination = async (docId, body = {}) => {
    const ref = db.collection('destinations').doc(String(docId));
    const snap0 = await ref.get();
    if (!snap0.exists) throw new Error('Destination not found');
  
    const patch = {};
  
    if (body.name !== undefined) {
      patch.name = norm(body.name);
      patch.name_lower = lower(body.name);
    }
    if (body.regency !== undefined) {
      patch.regency = norm(body.regency);
      patch.regency_lower = lower(body.regency);
    }
    if (body.category !== undefined) {
      patch.category = norm(body.category);
      patch.category_lower = lower(body.category);
    }
    if (body.rating !== undefined) patch.rating = toNumOrNull(body.rating);
    if (body.location !== undefined) patch.location = norm(body.location);
    if (body.childEntry !== undefined) patch.childEntry = norm(body.childEntry);
    if (body.adultsEntry !== undefined) patch.adultsEntry = norm(body.adultsEntry);
    if (body.imageLink !== undefined) patch.imageLink = norm(body.imageLink);
    if (body.information !== undefined) patch.information = body.information ?? null;
  
    patch.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  
    await ref.set(patch, { merge: true });
  
    const snap = await ref.get();
    const data = snap.data();
  
    return { ...data, id: Number(data.id) };
  };
  
  /**
   * DELETE — hapus satu dokumen destinasi by docId
   * (ini berbeda dengan delete "favorit" yang sebelumnya pakai composite id userId_datasetId)
   */
  export const deleteDestinationById = async (docId) => {
    const ref = db.collection('destinations').doc(String(docId));
    const snap = await ref.get();
    if (!snap.exists) throw new Error('Destination not found');
    await ref.delete();
    return { id: docId };
  };