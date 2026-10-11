// Penyimpanan sementara di browser (IndexedDB), sebelum tersambung ke Firebase.
// Kenangan yang disimpan di sini hanya ada di browser & perangkat yang dipakai saat menambahkannya.

const DB_NAME = 'tongkrongan'
const STORE = 'kenangan'

export type StoredPhoto = { full: Blob; thumb: Blob; width: number; height: number }

export type StoredMemory = {
  id: string
  judul: string
  tanggal?: string
  cerita?: string
  kota?: string
  lat: number
  lng: number
  foto: StoredPhoto[]
  dibuat: number
}

let database: Promise<IDBDatabase> | null = null

function openDatabase() {
  database ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return database
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = action(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export const listStoredMemories = () => run<StoredMemory[]>('readonly', (store) => store.getAll())
export const saveStoredMemory = (memory: StoredMemory) => run('readwrite', (store) => store.put(memory))
export const deleteStoredMemory = (id: string) => run('readwrite', (store) => store.delete(id))
