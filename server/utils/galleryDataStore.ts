import { readFile, writeFile, rename, unlink } from 'fs/promises'
import type { PhotographyData, GalleryData } from '~~/shared/types/gallery'

export type GalleryCategory = 'photography' | 'gallery'
type DataOf<C extends GalleryCategory> = C extends 'photography' ? PhotographyData : GalleryData

const PATHS: Record<GalleryCategory, string> = {
  photography: './public/photographyList.json',
  gallery: './public/galleryList.json'
}

export function resolveGalleryDataPath (category: GalleryCategory): string {
  return PATHS[category]
}

/**
 * Per-process async mutex keyed by file path.
 * 避免 read→modify→write 間交錯造成的資料覆蓋。
 */
const locks = new Map<string, Promise<void>>()

async function withLock<T> (key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve()
  let release!: () => void
  const gate = new Promise<void>((r) => { release = r })
  const chained = prev.then(() => gate)
  locks.set(key, chained)
  try {
    await prev
    return await fn()
  } finally {
    release()
    if (locks.get(key) === chained) locks.delete(key)
  }
}

export async function readGalleryData<C extends GalleryCategory> (
  category: C
): Promise<DataOf<C> | null> {
  try {
    const raw = await readFile(resolveGalleryDataPath(category), 'utf-8')
    return JSON.parse(raw) as DataOf<C>
  } catch {
    return null
  }
}

/**
 * Atomic write：先寫 .tmp 再 rename，避免程式中斷造成 JSON 半寫空檔。
 */
export async function writeGalleryDataAtomic<C extends GalleryCategory> (
  category: C,
  data: DataOf<C>
): Promise<void> {
  const target = resolveGalleryDataPath(category)
  const tmp = `${target}.tmp`
  const body = JSON.stringify(data, null, 2)
  try {
    await writeFile(tmp, body, 'utf-8')
    await rename(tmp, target)
  } catch (err) {
    try { await unlink(tmp) } catch { /* ignore */ }
    throw err
  }
}

/**
 * read → transform → atomic write，整段在 per-file mutex 下執行。
 * 避免多個 admin tab 並發上傳／刪除時覆蓋彼此。
 */
export async function updateGalleryData<C extends GalleryCategory> (
  category: C,
  fallback: () => DataOf<C>,
  updater: (data: DataOf<C>) => DataOf<C> | Promise<DataOf<C>>
): Promise<DataOf<C>> {
  return withLock(resolveGalleryDataPath(category), async () => {
    const existing = (await readGalleryData(category)) ?? fallback()
    const next = await updater(existing)
    await writeGalleryDataAtomic(category, next)
    return next
  })
}
