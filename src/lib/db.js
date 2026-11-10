// Uploaded songs live in IndexedDB so the audio and cover blobs survive reloads
const DB_NAME = "pulse-music";
const STORE = "uploads";

let dbPromise;
const openDb = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
};

const run = async (mode, action) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

export const getAllUploads = () => run("readonly", (s) => s.getAll());
export const getUpload = (id) => run("readonly", (s) => s.get(id));
export const saveUpload = (record) => run("readwrite", (s) => s.put(record));
export const deleteUpload = (id) => run("readwrite", (s) => s.delete(id));
