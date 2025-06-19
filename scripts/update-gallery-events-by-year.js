import fs from 'fs';
import path from 'path';

// 根據時間生成年份事件名稱
function getYearEvent(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  return `${year}年電繪作品`;
}

// 生成事件描述
function getEventDescription(year) {
  return `${year}年創作的電繪作品集`;
}

// 移動檔案到新的年份資料夾
function moveFileToYearFolder(oldPath, year, filename) {
  const galleryDir = './public/images/gallery';
  const yearFolder = path.join(galleryDir, `${year}年電繪作品`);
  const newPath = path.join(yearFolder, filename);

  // 確保年份資料夾存在
  if (!fs.existsSync(yearFolder)) {
    fs.mkdirSync(yearFolder, { recursive: true });
    console.log(`📁 創建資料夾: ${yearFolder}`);
  }

  // 移動檔案
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`📦 移動檔案: ${filename} → ${year}年電繪作品/`);
    return `gallery/${year}年電繪作品/${filename}`;
  } else {
    console.warn(`⚠️ 檔案不存在: ${oldPath}`);
    return null;
  }
}

// 主函數
async function updateGalleryEventsByYear() {
  const galleryPath = './public/galleryList.json';
  const galleryImagesDir = './public/images/gallery';

  console.log('🚀 開始更新電繪作品事件和移動檔案...\n');

  // 讀取現有的 galleryList.json
  let galleryData;
  try {
    const jsonContent = fs.readFileSync(galleryPath, 'utf-8');
    galleryData = JSON.parse(jsonContent);
    console.log(`📖 讀取到 ${galleryData.Img.length} 個作品`);
  } catch (error) {
    console.error('❌ 無法讀取 galleryList.json:', error);
    return;
  }

  // 統計更新前的狀態
  console.log('\n📊 更新前的事件統計：');
  const beforeStats = {};
  galleryData.Img.forEach(img => {
    if (img.filename.includes('gallery/')) {
      const eventName = img.event?.name || '無事件';
      beforeStats[eventName] = (beforeStats[eventName] || 0) + 1;
    }
  });
  Object.entries(beforeStats).forEach(([event, count]) => {
    console.log(`  - ${event}: ${count} 張`);
  });

  // 更新電繪作品的事件
  const updatedCount = {
    total: 0,
    byYear: {}
  };

  galleryData.Img.forEach(img => {
    // 處理所有電繪作品 (gallery/ 開頭)
    if (img.filename.startsWith('gallery/')) {
      const year = new Date(img.time).getFullYear();
      const newEventName = getYearEvent(img.time);
      const newEventDescription = getEventDescription(year);

      // 處理檔案移動
      const filename = path.basename(img.filename);
      // 從 'gallery/電繪collection/01-14.jpg' 轉換為 './public/images/gallery/電繪collection/01-14.jpg'
      const relativePath = img.filename.replace('gallery/', '');
      const currentPath = path.join(galleryImagesDir, relativePath);

      console.log(`🔍 處理檔案: ${img.filename}`);
      console.log(`📂 當前路徑: ${currentPath}`);

      // 移動檔案到年份資料夾
      const newFilename = moveFileToYearFolder(currentPath, year, filename);

      if (newFilename) {
        // 更新檔案路徑
        img.filename = newFilename;
      }

      // 更新事件資訊
      img.event = {
        name: newEventName,
        description: newEventDescription,
        location: ''
      };

      updatedCount.total++;
      updatedCount.byYear[year] = (updatedCount.byYear[year] || 0) + 1;

      console.log(`✅ ${img.title}: ${img.time} → ${newEventName}`);
    }
  });

  // 重新計算事件統計
  const newEventStats = {};
  galleryData.Img.forEach(img => {
    if (img.event && img.event.name) {
      const eventName = img.event.name;
      newEventStats[eventName] = (newEventStats[eventName] || 0) + 1;
    }
  });

  // 更新 galleryData 的事件統計
  galleryData.eventStats = newEventStats;

  // 寫回檔案
  try {
    fs.writeFileSync(galleryPath, JSON.stringify(galleryData, null, 2), 'utf-8');
    console.log('\n💾 成功寫入 galleryList.json');
  } catch (error) {
    console.error('❌ 寫入檔案失敗:', error);
    return;
  }

  // 顯示更新結果
  console.log('\n🎉 更新完成！');
  console.log(`📝 總共更新了 ${updatedCount.total} 個電繪作品`);

  console.log('\n📊 按年份分組：');
  Object.entries(updatedCount.byYear).sort().forEach(([year, count]) => {
    console.log(`  - ${year}年: ${count} 張作品`);
  });

  console.log('\n📊 更新後的事件統計：');
  Object.entries(newEventStats).forEach(([event, count]) => {
    console.log(`  - ${event}: ${count} 張`);
  });

  console.log('\n✨ 所有電繪作品的事件和檔案位置已按年份重新組織！');

  // 檢查是否可以刪除空的電繪collection資料夾
  const collectionPath = path.join(galleryImagesDir, '電繪collection');
  if (fs.existsSync(collectionPath)) {
    const remainingFiles = fs.readdirSync(collectionPath);
    if (remainingFiles.length === 0) {
      fs.rmdirSync(collectionPath);
      console.log('\n🗑️ 已刪除空的電繪collection資料夾');
    } else {
      console.log(`\n📋 電繪collection資料夾還有 ${remainingFiles.length} 個檔案未處理`);
    }
  }
}

// 執行腳本
updateGalleryEventsByYear().catch(console.error);