/**
 * Admin 後台專用 API：純 $fetch 包裝，供 Pinia 與 useApi.createApiRequest 使用。
 */
import type { CategoryType } from '~/types/gallery'
import type {
  GalleryListApiResponse,
  UploadApiResponse,
  UpdateEventApiResponse,
  DeleteImageApiResponse,
  UpdateImageApiResponse,
  DeleteEventApiResponse,
  UpdateEventBody,
  DeleteImageBody,
  UpdateImageBody,
  DeleteEventBody
} from '~/stores/adminTypes'

export async function fetchGalleryList (category: CategoryType): Promise<GalleryListApiResponse> {
  return await $fetch('/api/gallery', {
    query: { category }
  }) as GalleryListApiResponse
}

export async function postUpload (formData: FormData): Promise<UploadApiResponse> {
  return await $fetch('/api/upload', {
    method: 'POST',
    body: formData
  }) as UploadApiResponse
}

export async function patchUpdateEvent (body: UpdateEventBody): Promise<UpdateEventApiResponse> {
  return await $fetch('/api/update-event', {
    method: 'PATCH',
    body
  }) as UpdateEventApiResponse
}

export async function deleteImageRequest (body: DeleteImageBody): Promise<DeleteImageApiResponse> {
  return await $fetch('/api/delete-image', {
    method: 'DELETE',
    body
  }) as DeleteImageApiResponse
}

export async function patchUpdateImage (body: UpdateImageBody): Promise<UpdateImageApiResponse> {
  return await $fetch('/api/update-image', {
    method: 'PATCH',
    body
  }) as UpdateImageApiResponse
}

export async function deleteEventRequest (body: DeleteEventBody): Promise<DeleteEventApiResponse> {
  return await $fetch('/api/delete-event', {
    method: 'DELETE',
    body
  }) as DeleteEventApiResponse
}
