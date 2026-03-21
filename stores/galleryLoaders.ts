/**
 * Gallery 公開資料載入：JSON 路徑 fallback、轉成 GalleryItem
 */
import { sortImagesByTime } from '~/utils/galleryUtils'
import { generateImageId } from '~/utils/imageUtils'
import type {
  GalleryItem,
  DigitalArtItem,
  PhotographyItem,
  GalleryData,
  PhotographyData
} from '~/types/gallery'

export function transformDigitalWork (img: DigitalArtItem): GalleryItem {
  return {
    id: generateImageId('digital', img.filename),
    filename: img.filename,
    title: img.title,
    description: img.content,
    date: img.time,
    time: img.time,
    color: img.color,
    event: img.event || null,
    category: 'digital' as const,
    visible: true
  }
}

export function transformPhotographyWork (img: PhotographyItem): GalleryItem {
  return {
    id: generateImageId('photography', img.filename),
    filename: img.filename,
    title: img.title,
    description: img.content,
    date: img.time,
    time: img.time,
    tags: img.tags || [],
    event: img.event || null,
    camera: img.camera,
    model: img.model,
    focalLength: img.focalLength,
    aperture: img.aperture,
    iso: img.iso,
    shutterSpeed: img.shutterSpeed,
    category: 'photography' as const,
    visible: true
  }
}

/** 在不同環境下穩健載入 JSON（本機 dev / GitHub Pages） */
export async function fetchJsonWithFallback (filename: string): Promise<unknown> {
  const candidates = [
    `/young-portfolio/${filename}`,
    `/${filename}`,
    filename
  ]

  let lastError: unknown = null

  for (const path of candidates) {
    try {
      return await $fetch(path)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

export async function fetchDigitalWorks (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> {
  const data = await fetchJsonWithFallback('galleryList.json') as GalleryData

  const works = sortImagesByTime(
    data.Img.map(transformDigitalWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}

export async function fetchPhotographyWorks (): Promise<{ works: GalleryItem[], eventStats: Record<string, number> }> {
  const data = await fetchJsonWithFallback('photographyList.json') as PhotographyData

  const works = sortImagesByTime(
    data.Img.map(transformPhotographyWork)
  )

  return {
    works,
    eventStats: data.eventStats || {}
  }
}
