export type StoredImage = {
  id: string;
  name: string;
  uri: string;
};

const DATABASE = 'chatapp-media';
const STORE = 'images';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('Trình duyệt chưa hỗ trợ lưu ảnh.'));
      return;
    }

    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Không mở được nơi lưu ảnh.'));
  });
}

export async function saveImages(images: StoredImage[]): Promise<void> {
  if (images.length === 0) return;
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Không lưu được ảnh. Dung lượng trình duyệt có thể đã đầy.'));
      transaction.onabort = () => reject(new Error('Việc lưu ảnh đã bị hủy.'));
      const store = transaction.objectStore(STORE);
      images.forEach((image) => store.put(image));
    });
  } finally {
    database.close();
  }
}

export async function loadImage(id: string): Promise<StoredImage | null> {
  const database = await openDatabase();

  try {
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(new Error('Không đọc được ảnh đã lưu.'));
    });
  } finally {
    database.close();
  }
}

export async function removeImages(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const database = await openDatabase();

  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Không gỡ được ảnh đã lưu.'));
      transaction.onabort = () => reject(new Error('Việc gỡ ảnh đã bị hủy.'));
      const store = transaction.objectStore(STORE);
      ids.forEach((id) => store.delete(id));
    });
  } finally {
    database.close();
  }
}
