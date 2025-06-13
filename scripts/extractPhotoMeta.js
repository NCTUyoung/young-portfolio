import fs from 'fs';
import path from 'path';
import exifr from 'exifr';

// 事件定義 - 可以手動編輯添加事件
const EVENTS = {
  '2024-12-13': {
    name: '2024新北耶誕城',
    description: '新北市耶誕城燈光秀拍攝',
    location: '新北市板橋區'
  },
  '2025-05-17': {
    name: '春日街拍',
    description: '城市日常生活紀錄',
    location: '台北市'
  }
  // 可以繼續添加更多事件...
};

async function extractPhotoMetadata() {
  const photographyDir = './galleryImg/photography';
  const outputFile = './public/photographyList.json';

  try {
    // 讀取攝影目錄中的所有檔案
    const files = fs.readdirSync(photographyDir)
      .filter(file => file.match(/\.(jpg|jpeg|png|tiff)$/i));

    console.log(`找到 ${files.length} 張照片`);

    const photoData = [];

    for (const filename of files) {
      const filePath = path.join(photographyDir, filename);

      try {
        // 讀取 EXIF 資料
        const exif = await exifr.parse(filePath);

        let captureTime = null;
        let title = filename.replace(/\.[^/.]+$/, ""); // 移除副檔名作為預設標題

        // 嘗試從不同的 EXIF 欄位取得拍攝時間
        if (exif && exif.DateTimeOriginal) {
          captureTime = exif.DateTimeOriginal;
        } else if (exif && exif.DateTime) {
          captureTime = exif.DateTime;
        } else if (exif && exif.CreateDate) {
          captureTime = exif.CreateDate;
        } else {
          // 如果沒有 EXIF 時間，使用檔案修改時間
          const stats = fs.statSync(filePath);
          captureTime = stats.mtime;
        }

        // 格式化時間
        const formattedTime = formatDate(captureTime);
        const dateKey = formatDateKey(captureTime);

        // 根據檔名生成簡單標題和描述
        const { generatedTitle, description } = generateTitleAndDescription(filename);

        // 基於拍攝參數產生智能標籤
        const tags = generateSmartTags(exif, filename);

        // 查找對應的事件
        const event = findEvent(dateKey, filename);

        photoData.push({
          filename: filename,
          time: formattedTime,
          title: generatedTitle,
          content: description,
          tags: tags,
          event: event,
          camera: exif?.Make || 'Unknown',
          model: exif?.Model || 'Unknown',
          focalLength: exif?.FocalLength || null,
          aperture: exif?.FNumber || null,
          iso: exif?.ISO || null,
          shutterSpeed: exif?.ExposureTime || null
        });

        const eventInfo = event ? ` - 事件: ${event.name}` : '';
        console.log(`✓ 處理完成: ${filename} - 拍攝時間: ${formattedTime} - 標籤: ${tags.join(', ')}${eventInfo}`);

      } catch (error) {
        console.error(`處理 ${filename} 時發生錯誤:`, error.message);

        // 如果無法讀取 EXIF，使用檔案時間
        const stats = fs.statSync(filePath);
        photoData.push({
          filename: filename,
          time: formatDate(stats.mtime),
          title: filename.replace(/\.[^/.]+$/, ""),
          content: "攝影作品",
          tags: ["攝影"],
          event: null
        });
      }
    }

    // 按時間排序（新到舊）
    photoData.sort((a, b) => new Date(b.time) - new Date(a.time));

    // 統計事件
    const eventStats = {};
    photoData.forEach(photo => {
      if (photo.event) {
        if (!eventStats[photo.event.name]) {
          eventStats[photo.event.name] = 0;
        }
        eventStats[photo.event.name]++;
      }
    });

    // 建立 JSON 結構
    const result = {
      totalNumber: photoData.length.toString(),
      category: "photography",
      eventStats: eventStats,
      Img: photoData
    };

    // 寫入檔案
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');

    console.log(`\n✅ 成功更新 ${outputFile}`);
    console.log(`📸 總共處理了 ${photoData.length} 張照片`);

    // 顯示事件統計
    if (Object.keys(eventStats).length > 0) {
      console.log('\n📅 事件統計:');
      Object.entries(eventStats).forEach(([eventName, count]) => {
        console.log(`  ${eventName}: ${count} 張照片`);
      });
    }

  } catch (error) {
    console.error('處理過程中發生錯誤:', error);
  }
}

// 格式化日期
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${year} ${monthNames[d.getMonth()]} ${day}`;
}

// 格式化日期鍵（用於匹配事件）
function formatDateKey(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 根據檔名生成標題和描述
function generateTitleAndDescription(filename) {
  // 分析檔名中的模式
  if (filename.includes('DSC_')) {
    const number = filename.match(/DSC_(\d+)/)?.[1];
    return {
      generatedTitle: `攝影作品 #${number}`,
      description: "數位單眼相機拍攝作品"
    };
  }

  if (filename.includes('編輯')) {
    return {
      generatedTitle: "後製攝影",
      description: "經過後製處理的攝影作品"
    };
  }

  return {
    generatedTitle: filename.replace(/\.[^/.]+$/, "").replace(/-/g, ' '),
    description: "攝影作品"
  };
}

// 基於拍攝參數產生智能標籤
function generateSmartTags(exif, filename) {
  const tags = [];

  // 基於焦距判斷鏡頭類型
  if (exif?.FocalLength) {
    const focal = exif.FocalLength;
    if (focal <= 24) tags.push('廣角');
    else if (focal <= 50) tags.push('標準');
    else if (focal <= 85) tags.push('人像');
    else tags.push('望遠');
  }

  // 基於光圈判斷景深效果
  if (exif?.FNumber) {
    const aperture = exif.FNumber;
    if (aperture <= 2.8) tags.push('淺景深');
    else if (aperture >= 8) tags.push('深景深');
  }

  // 基於ISO判斷光線條件
  if (exif?.ISO) {
    const iso = exif.ISO;
    if (iso <= 200) tags.push('日光');
    else if (iso <= 800) tags.push('室內');
    else tags.push('夜拍');
  }

  // 基於快門速度判斷拍攝類型
  if (exif?.ExposureTime) {
    const shutter = exif.ExposureTime;
    if (shutter >= 1) tags.push('長曝光');
    else if (shutter <= 1/500) tags.push('高速快門');
  }

  // 基於檔名判斷後製狀態
  if (filename.includes('編輯')) {
    tags.push('後製');
  }

  // 如果沒有任何標籤，至少加上基本標籤
  if (tags.length === 0) {
    tags.push('攝影');
  }

  return tags;
}

// 查找對應的事件
function findEvent(dateKey, filename) {
  // 優先根據日期匹配事件
  if (EVENTS[dateKey]) {
    return EVENTS[dateKey];
  }

  // 也可以根據檔名關鍵字匹配（未來可擴展）
  // 例如：if (filename.includes('christmas')) return { name: '耶誕節拍攝', ... }

  return null;
}

// 執行腳本
extractPhotoMetadata();