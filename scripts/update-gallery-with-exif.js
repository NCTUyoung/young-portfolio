import fs from 'fs';
import path from 'path';
import exifr from 'exifr';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 根據時間生成年份事件名稱
function getYearEvent(date) {
  const year = date.getFullYear();
  return `${year}年電繪作品`;
}

// 格式化日期
function formatDate(date) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getFullYear()} ${monthNames[date.getMonth()]} ${date.getDate()}`;
}

// 生成標題
function generateTitle(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename));

  if (nameWithoutExt.includes('全身自創')) {
    return '全身角色創作';
  } else if (nameWithoutExt.includes('自創')) {
    return '原創角色設計';
  } else if (nameWithoutExt.startsWith('E-')) {
    return `練習作品 #${nameWithoutExt.substring(2)}`;
  } else if (/^\d{2}-\d{2}$/.test(nameWithoutExt)) {
    return `電繪作品 ${nameWithoutExt}`;
  } else {
    return nameWithoutExt;
  }
}

// 使用 PowerShell 獲取 Windows 檔案的真正建立時間
async function getWindowsFileCreationDate(filePath) {
  try {
    const command = `Get-ItemProperty "${filePath}" | Select-Object CreationTime | ConvertTo-Json`;
    const { stdout } = await execAsync(`powershell -Command "${command}"`);
    const result = JSON.parse(stdout);

    if (result.CreationTime) {
      // 處理 .NET JSON 序列化的日期格式 "/Date(1750338175496)/"
      let creationTime;

      if (typeof result.CreationTime === 'string' && result.CreationTime.startsWith('/Date(')) {
        // 解析 .NET JSON 日期格式
        const timestamp = parseInt(result.CreationTime.match(/\/Date\((\d+)\)\//)[1]);
        creationTime = new Date(timestamp);
      } else {
        // 嘗試直接解析
        creationTime = new Date(result.CreationTime);
      }

      console.log(`🕒 ${path.basename(filePath)}: Windows 建立時間 ${creationTime.toLocaleDateString('zh-TW')} ${creationTime.toLocaleTimeString('zh-TW')}`);
      return creationTime;
    }
  } catch (error) {
    console.warn(`⚠️ 無法讀取 Windows 建立時間: ${error.message}`);
  }

  // 備選方案：使用 Node.js fs stats
  const stats = fs.statSync(filePath);
  const creationTime = stats.birthtime || stats.mtime;
  console.log(`📁 ${path.basename(filePath)}: 使用 Node.js 時間 ${creationTime.toLocaleDateString('zh-TW')} ${creationTime.toLocaleTimeString('zh-TW')}`);
  return creationTime;
}

// 主函數
async function updateGalleryWithExif() {
  const galleryPath = './public/galleryList.json';
  const collectionDir = './public/images/gallery/電繪collection';

  // 讀取現有的 galleryList.json
  let galleryData;
  try {
    const jsonContent = fs.readFileSync(galleryPath, 'utf-8');
    galleryData = JSON.parse(jsonContent);
  } catch (error) {
    console.error('無法讀取 galleryList.json:', error);
    return;
  }

  // 過濾出非電繪collection的作品
  const otherWorks = galleryData.Img.filter(img => !img.filename.includes('電繪collection'));

  // 掃描電繪collection目錄
  const files = fs.readdirSync(collectionDir);
  const digitalWorks = [];
  const eventStats = {};

  for (const filename of files) {
    if (filename.endsWith('.jpg') || filename.endsWith('.png')) {
      const filePath = path.join(collectionDir, filename);
      let creationDate;

      try {
        // 優先嘗試從 EXIF 讀取資料
        const exifData = await exifr.parse(filePath);

        if (exifData && (exifData.DateTimeOriginal || exifData.CreateDate || exifData.ModifyDate)) {
          // 優先使用 EXIF 中的日期
          creationDate = new Date(
            exifData.DateTimeOriginal ||
            exifData.CreateDate ||
            exifData.ModifyDate
          );
          console.log(`✅ ${filename}: 從 EXIF 讀取到日期 ${formatDate(creationDate)}`);
        } else {
          // 沒有 EXIF 日期，使用 Windows 系統的建立時間
          creationDate = await getWindowsFileCreationDate(filePath);
          console.log(`🗂️ ${filename}: 使用檔案系統日期 ${formatDate(creationDate)}`);
        }
      } catch {
        // EXIF 讀取失敗，使用 Windows 系統的建立時間
        creationDate = await getWindowsFileCreationDate(filePath);
        console.log(`❌ ${filename}: EXIF 讀取失敗，使用檔案系統日期 ${formatDate(creationDate)}`);
      }

      const yearEvent = getYearEvent(creationDate);
      const title = generateTitle(filename);

      // 更新事件統計
      if (!eventStats[yearEvent]) {
        eventStats[yearEvent] = 0;
      }
      eventStats[yearEvent]++;

      // 隨機選擇顏色
      const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'amber'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      digitalWorks.push({
        filename: `gallery/電繪collection/${filename}`,
        time: formatDate(creationDate),
        title: title,
        content: '',
        color: color,
        event: {
          name: yearEvent,
          description: `${creationDate.getFullYear()}年創作的電繪作品集`,
          location: ''
        }
      });
    }
  }

  // 按日期排序（新到舊）
  digitalWorks.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  // 合併所有作品
  galleryData.Img = [...otherWorks, ...digitalWorks];
  galleryData.totalNumber = galleryData.Img.length.toString();

  // 更新事件統計
  if (!galleryData.eventStats) {
    galleryData.eventStats = {};
  }

  // 清除舊的電繪作品事件統計
  Object.keys(galleryData.eventStats).forEach(event => {
    if (event.includes('電繪作品')) {
      delete galleryData.eventStats[event];
    }
  });

  Object.assign(galleryData.eventStats, eventStats);

  // 寫回檔案
  fs.writeFileSync(galleryPath, JSON.stringify(galleryData, null, 2), 'utf-8');

  console.log('\n✅ 成功更新電繪作品！');
  console.log(`- 保留了 ${otherWorks.length} 個其他作品`);
  console.log(`- 更新了 ${digitalWorks.length} 個電繪作品`);
  console.log('\n📊 事件統計：');
  Object.entries(eventStats).forEach(([event, count]) => {
    console.log(`  - ${event}: ${count} 張`);
  });

  console.log('\n📋 電繪作品詳細資訊：');
  digitalWorks.forEach(work => {
    console.log(`  - ${work.title}: ${work.time} [${work.event.name}]`);
  });
}

// 執行腳本
updateGalleryWithExif();