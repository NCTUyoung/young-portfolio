/**
 * Utils 通用類型定義
 */

// ==================== 驗證相關類型 ====================

/**
 * 通用驗證結果
 */
export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * 多錯誤驗證結果
 */
export interface MultiValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * 檔案驗證結果
 */
export interface FileValidationResult extends MultiValidationResult {
  fileSize?: number
  mimeType?: string
}

// ==================== 格式化相關類型 ====================

/**
 * 格式化選項
 */
export interface FormatOptions {
  locale?: string
  precision?: number
  showUnit?: boolean
}

/**
 * 日期格式化選項
 */
export interface DateFormatOptions extends FormatOptions {
  format?: 'short' | 'full' | 'key' | 'custom'
  customFormat?: string
}

// ==================== 工具函數相關類型 ====================

/**
 * 範圍檢查選項
 */
export interface RangeOptions {
  min: number
  max: number
  inclusive?: boolean
}

/**
 * 搜尋選項
 */
export interface SearchOptions {
  caseSensitive?: boolean
  exactMatch?: boolean
  searchFields?: string[]
}

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc'

/**
 * 排序選項
 */
export interface SortOptions {
  field: string
  direction: SortDirection
}