import { readFileSync } from 'fs'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const category = query.category as string || 'gallery' // 'gallery' 或 'photography'

    // 選擇對應的JSON檔案
    const jsonFileName = category === 'photography' ? 'photographyList.json' : 'galleryList.json'
    const jsonPath = `./public/${jsonFileName}`

    const jsonContent = readFileSync(jsonPath, 'utf-8')
    const categoryData = JSON.parse(jsonContent)

    // 確保圖片按時間排序（新到舊）
    if (categoryData.Img && Array.isArray(categoryData.Img)) {
      categoryData.Img.sort((a: any, b: any) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime()
      })
    }

    return {
      success: true,
      category,
      data: categoryData
    }
  } catch (error) {
    console.error('Get gallery error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '獲取圖庫資料失敗'
    })
  }
})