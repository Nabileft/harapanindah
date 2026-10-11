import type { Memory } from './types'

/** Kunci folder untuk kenangan yang belum punya nama kota. */
export const OTHER_KEY = '~lainnya'

export type CityFolder = {
  key: string
  name: string
  memories: Memory[]
  photoCount: number
}

/** "Jakarta" dan "jakarta " masuk folder yang sama. */
export const folderKey = (kota?: string) => kota?.trim().toLocaleLowerCase('id') || OTHER_KEY

/**
 * Mengelompokkan kenangan per kota.
 * `memories` sudah terurut dari yang terbaru, jadi folder dengan kenangan terbaru ada di depan.
 * Kenangan tanpa kota masuk folder "Lainnya" di paling belakang.
 */
export function groupByCity(memories: Memory[]): CityFolder[] {
  const folders = new Map<string, CityFolder>()
  for (const memory of memories) {
    const key = folderKey(memory.kota)
    let folder = folders.get(key)
    if (!folder) {
      folder = { key, name: key === OTHER_KEY ? 'Lainnya' : memory.kota!.trim(), memories: [], photoCount: 0 }
      folders.set(key, folder)
    }
    folder.memories.push(memory)
    folder.photoCount += memory.foto.length
  }
  const list = [...folders.values()]
  return [...list.filter((f) => f.key !== OTHER_KEY), ...list.filter((f) => f.key === OTHER_KEY)]
}

export const folderSummary = (folder: CityFolder) => `${folder.memories.length} kenangan, ${folder.photoCount} foto`
