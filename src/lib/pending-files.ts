const DB_NAME = "nelo-pending";
const STORE_NAME = "files";
const KEY = "pending-upload";

interface SerializedFile {
  name: string;
  type: string;
  lastModified: number;
  buffer: ArrayBuffer;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function storePendingFiles(files: File[]): Promise<void> {
  const serialized: SerializedFile[] = await Promise.all(
    files.map(async (f) => ({
      name: f.name,
      type: f.type,
      lastModified: f.lastModified,
      buffer: await f.arrayBuffer(),
    })),
  );

  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(serialized, KEY);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function retrievePendingFiles(): Promise<File[] | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY);

    req.onsuccess = () => {
      const data = req.result as SerializedFile[] | undefined;
      store.delete(KEY);

      tx.oncomplete = () => {
        db.close();
        if (!data || data.length === 0) {
          resolve(null);
          return;
        }
        const files = data.map(
          (d) =>
            new File([d.buffer], d.name, {
              type: d.type,
              lastModified: d.lastModified,
            }),
        );
        resolve(files);
      };
    };

    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
