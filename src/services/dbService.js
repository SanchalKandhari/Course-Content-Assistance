// services/dbService.js

const DB_NAME = 'CourseAIDatabase';
const STORE_NAME = 'pdf_sources';
const DB_VERSION = 1;

/**
 * Initializes the IndexedDB database.
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        // The objects stored will look like { sessionId: '123', file: Blob, fileName: 'notes.pdf' }
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Save a file to the database associated with a specific session ID.
 */
export async function saveFileToDB(sessionId, file) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add({
      sessionId,
      file,
      fileName: file.name,
      fileType: file.type
    });
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Get all files associated with a specific session ID.
 * Returns an array of File objects reconstructed from the DB.
 */
export async function getFilesFromDB(sessionId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const allRecords = event.target.result;
      const sessionRecords = allRecords.filter(r => String(r.sessionId) === String(sessionId));
      
      const files = sessionRecords.map(r => {
        // Reconstruct a File object from the stored Blob
        return new File([r.file], r.fileName, { type: r.fileType });
      });
      resolve(files);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Delete all files associated with a specific session ID.
 */
export async function deleteFilesFromDB(sessionId) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = (event) => {
      const allRecords = event.target.result;
      allRecords.forEach(record => {
        if (String(record.sessionId) === String(sessionId)) {
          store.delete(record.id);
        }
      });
      resolve(true);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}
