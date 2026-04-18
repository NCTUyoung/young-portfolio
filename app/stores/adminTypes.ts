import type { GalleryItem, PhotographyItem, CategoryType } from '~~/shared/types/gallery'

export type UnifiedGalleryItem = GalleryItem | PhotographyItem

export type GalleryListApiResponse = {
  success: boolean
  data: { Img: UnifiedGalleryItem[] }
}

export type UploadApiResponse = {
  success: boolean
  message: string
}

export type UpdateEventApiResponse = {
  success: boolean
  message: string
  updatedCount: number
}

export type DeleteImageApiResponse = {
  success: boolean
  message: string
}

export type UpdateImageApiResponse = {
  success: boolean
  message: string
  updatedImage: GalleryItem
}

export type DeleteEventApiResponse = {
  success: boolean
  message: string
  deletedCount: number
}

export type UpdateEventBody = {
  originalEventName: string
  newEventName: string
  newDescription: string
  newLocation: string
  category: CategoryType
}

export type DeleteImageBody = {
  filename: string
  category: CategoryType
}

export type UpdateImageBody = {
  filename: string
  category: CategoryType
  updates: {
    title: string
    content: string
    date: string
    color?: string
    tags?: string[]
  }
}

export type DeleteEventBody = {
  eventName: string
  category: CategoryType
}
