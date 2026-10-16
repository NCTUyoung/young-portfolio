import type { GalleryItem } from '~~/shared/types/gallery'

const cameraLabel = /^(?:_?DSC[NF]?|DSCF|IMG|PXL)[_-]?\d+(?:[-_\s](?:編輯|edit|edited|\d+))*$/i
const generatedLabel = /^攝影作品\s*#\s*\d+$/

/** A display-only exhibition label; original titles, filenames and image IDs stay intact. */
export function getGalleryDisplayTitle (image: GalleryItem, photographyWorks: readonly GalleryItem[] = []): string {
  const title = image.title?.trim() || ''
  if (image.category !== 'photography') return title || '未命名作品'
  const stem = title.replace(/\.(?:jpe?g|png|webp|avif|tiff?|heic)$/i, '')
  if (title && !cameraLabel.test(stem) && !generatedLabel.test(title)) return image.title

  const eventName = image.event?.name?.trim() || ''
  const label = eventName || '攝影作品'
  const peers = photographyWorks
    .filter(work => work.category === 'photography' && (work.event?.name?.trim() || '') === eventName)
    .sort((a, b) => {
      const aTime = Date.parse(a.time || a.date) || 0
      const bTime = Date.parse(b.time || b.date) || 0
      return bTime - aTime || a.id.localeCompare(b.id)
    })
  const index = peers.findIndex(work => work.id === image.id)
  return index < 0 ? label : `${label} · ${String(index + 1).padStart(2, '0')}`
}
