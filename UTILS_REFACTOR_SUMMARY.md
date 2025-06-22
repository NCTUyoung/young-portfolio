# Utils 目錄重構總結

## 🎯 重構目標

解決 utils 目錄中的重複內容和組織問題，建立清晰的架構分層：
- **Utils**: 純函數，無狀態
- **Composables**: 響應式邏輯，有狀態
- **Stores**: 全局狀態管理

## 📁 重構後的文件結構

### 新建文件

#### `utils/formatters.ts` - 純格式化函數
```typescript
// 日期格式化
- formatDateShort(date): MM/DD
- formatDateFull(date): YYYY MMM DD
- formatDateKey(date): YYYY-MM-DD

// 攝影相關格式化
- formatShutterSpeed(speed): 1/125s
- formatCameraName(camera, model): Nikon D850
- formatAperture(aperture): f/2.8
- formatFocalLength(length): 85mm
- formatISO(iso): ISO 400

// 通用格式化
- formatFileSize(bytes): 2.5 MB
- truncateText(text, length): text...
- capitalize(text): Text
- kebabCase(text): kebab-case
```

#### `utils/validators.ts` - 驗證函數
```typescript
// 檔案驗證
- isValidImageFile(filename): boolean
- isValidFileSize(size): boolean
- validateFile(file): ValidationResult

// 事件驗證
- validateEvent(event): boolean
- validateEventName(name): ValidationResult
- validateEventData(event): MultiValidationResult

// 圖片驗證
- validateImageTitle(title): ValidationResult
- validateImageTags(tags): MultiValidationResult
- validateGalleryItem(item): MultiValidationResult

// 通用驗證
- validateEmail(email): ValidationResult
- validateUrl(url): ValidationResult
- isEmpty(value): boolean
- isInRange(value, min, max): boolean
```

#### `composables/useImageProcessing.ts` - 圖片處理 Composable
```typescript
// 響應式狀態
- isProcessing: Ref<boolean>
- processingProgress: Ref<number>
- processedImages: Ref<GalleryItem[]>

// 分類邏輯
- categorizeFocalLength(focalLength): string
- categorizeAperture(aperture): string
- categorizeISO(iso): string

// 智能標籤生成
- generateSmartTags(exif, filename): string[]
- getPrimaryTag(image): string | null

// 標題和描述生成
- generateTitleAndDescription(filename): {title, description}
- getDisplayTitle(image): string

// EXIF 數據處理
- extractCaptureTime(exif): Date
- normalizeExifData(exif): ExifData

// 批量處理
- batchProcessImages(images): Promise<GalleryItem[]>
```

#### `composables/useEventManagement.ts` - 事件管理 Composable
```typescript
// 響應式狀態
- events: Ref<Record<string, PhotoEvent>>
- currentEvent: Ref<PhotoEvent | null>
- isLoading: Ref<boolean>

// 計算屬性
- allEventNames: ComputedRef<string[]>
- eventsByYear: ComputedRef<Record<string, PhotoEvent[]>>
- recentEvents: ComputedRef<PhotoEvent[]>
- eventStats: ComputedRef<EventStats>

// 事件查找
- findEventByFilename(filename): PhotoEvent | null
- findEventByDate(dateKey): PhotoEvent | null
- findEvent(dateKey, filename): PhotoEvent | null
- inferEventFromTime(time, category): PhotoEvent

// 事件管理
- createEvent(name, description, location): PhotoEvent
- addEvent(event, dateKey?): void
- updateEvent(dateKey, event): boolean
- removeEvent(dateKey): boolean

// 搜尋和篩選
- searchEvents(query): PhotoEvent[]
- filterEventsByYear(year): PhotoEvent[]
- filterEventsByLocation(location): PhotoEvent[]
```

#### `utils/types.ts` - 通用類型定義
```typescript
interface ValidationResult {
  valid: boolean
  error?: string
}

interface MultiValidationResult {
  valid: boolean
  errors: string[]
}

interface FileValidationResult extends MultiValidationResult {
  fileSize?: number
  mimeType?: string
}

// 更多工具類型...
```

### 優化的現有文件

#### `utils/galleryUtils.ts` - 專注畫廊邏輯
- 移除重複的格式化函數 → 引用 `formatters.ts`
- 保留畫廊特定的業務邏輯
- 專注於分組、篩選、排序功能

#### `utils/eventUtils.ts` - 事件工具保持不變
- 提供預定義事件庫
- 事件查找和推斷邏輯
- 與 `useEventManagement` composable 配合使用

#### `utils/imageUtils.ts` - 保留核心圖片工具
- 移除重複的格式化函數 → 使用 `formatters.ts`
- 保留 `generateImageId` 等獨特函數
- 與 `useImageProcessing` composable 配合使用

#### `utils/index.ts` - 統一導出入口
```typescript
// 提供所有工具函數的統一導出
export * from './formatters'
export * from './validators'
export * from './galleryUtils'
export * from './eventUtils'

// 便利的組合對象
export const DateFormatters = { short, full, key }
export const Validators = { file, event, image, email, url }
export const PhotoFormatters = { shutterSpeed, aperture, iso }
```

## 📊 重構成果

### 代碼重複消除
- ✅ 統一了 `formatDate` 函數（之前在多個文件中重複）
- ✅ 合併了攝影相關格式化函數
- ✅ 統一了驗證邏輯
- ✅ 消除了 EXIF 處理重複代碼

### 職責分離
- ✅ **純函數** → `utils/` 目錄
- ✅ **響應式邏輯** → `composables/` 目錄
- ✅ **全局狀態** → `stores/` 目錄

### 可維護性提升
- ✅ 統一的導出入口 (`utils/index.ts`)
- ✅ 清晰的類型定義 (`utils/types.ts`)
- ✅ 詳細的 JSDoc 註釋
- ✅ 一致的錯誤處理模式

### 開發體驗改善
- ✅ 更好的代碼補全和類型檢查
- ✅ 便利的組合對象 (`DateFormatters`, `Validators`)
- ✅ 統一的 API 設計
- ✅ 更清晰的依賴關係

## 🔄 使用指南

### 導入工具函數
```typescript
// 方式1：從統一入口導入
import { formatDateFull, validateFile } from '~/utils'

// 方式2：從具體文件導入（更明確）
import { formatDateFull } from '~/utils/formatters'
import { validateFile } from '~/utils/validators'

// 方式3：使用便利對象
import { DateFormatters, Validators } from '~/utils'
const date = DateFormatters.full(new Date())
const result = Validators.file(file)
```

### 使用 Composables
```typescript
// 圖片處理
const {
  generateSmartTags,
  batchProcessImages,
  analyzeImageCollection
} = useImageProcessing()

// 事件管理
const {
  findEvent,
  createEvent,
  eventStats
} = useEventManagement()
```

## 🎉 總結

這次重構成功地：

1. **消除了代碼重複**：統一了格式化、驗證等通用函數
2. **建立了清晰架構**：純函數 vs 響應式邏輯 vs 全局狀態
3. **提升了可維護性**：統一接口、類型安全、清晰文檔
4. **改善了開發體驗**：便利的導入方式、更好的代碼補全

未來添加新功能時，請遵循這個架構原則：
- 無狀態的純函數 → `utils/`
- 有狀態的業務邏輯 → `composables/`
- 需要跨組件共享的狀態 → `stores/`