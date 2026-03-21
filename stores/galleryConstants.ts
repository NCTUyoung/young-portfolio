/**
 * 地圖後備座標（事件 JSON 未帶 lat/lng 時使用）
 */
export const GALLERY_EVENT_COORDS_FALLBACK: Record<string, { lat: number, lng: number }> = {
  '春日街拍': { lat: 25.0478, lng: 121.5319 },
  '2024新北耶誕城': { lat: 25.0119, lng: 121.4657 },
  '2025 桃猿三本柱': { lat: 25.0013, lng: 121.2016 },
  '攝影社 米倉團拍': { lat: 24.7959, lng: 120.9848 },
  '調色測試': { lat: 24.8212, lng: 121.1818 },
  '交大外拍': { lat: 24.7959, lng: 120.9848 },
  '2025 聖誕台北': { lat: 25.0478, lng: 121.5319 },
  '峨嵋湖風鈴木': { lat: 24.6784, lng: 120.9851 },
  'WBC 2026': { lat: 35.7058, lng: 139.7518 }
}
