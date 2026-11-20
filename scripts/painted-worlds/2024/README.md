# 畫界 2024｜角色接手

先收 23 的單人 Tripo GLB。原檔放在 `畫界-Tripo-重製/tripo/`，建議以作品 slug 命名。複驗檔獨立輸出到外部證據目錄。

## 第一件 Tripo 姿勢 · 2024-23

[原作大圖](../../../public/images/gallery/2024年電繪作品/23.jpg)

- **單一站姿。** 原作是中左半身、臉朝觀眾、畫面右手掌抬起。接收版需要完整身形與雙鞋。膝蓋自然放鬆，兩腳微錯開，鞋底同高，把重心落在腳掌。角色面向正面稍轉，臉維持原作沉靜、專注的神態。
- **掌、臉留縫。** 開掌位於畫面右側與臉頰錯開，手掌朝第一站，掌心大約在口鼻高度，最高指尖接近眉眼高度。拇指朝臉側自然打開，五指有縫、指節輕彎。手腕回到袖口，肘部在肩胸前稍曲。掌心、袖口和眼睛都有可見間隔。另一手放低靠身，兩站都能追到手臂連接處。
- **髮衣。** 細節優先保短深髮、小白花、青黑毛邊披肩和暖灰臉的辨識度。手掌與臉使用一致且自然的比例。披肩背後有實際厚度，斜側能看出肩線、袖口和掌心的前後差。
- **交付物。** 自成一件、已定姿的 GLB，含衣服、鞋、髮花與內嵌貼圖。模型的來源空間以鞋底中點作為擺位參考。舞台、道具與燈光由既有房間供應。
- **接地與首站。** Blender 場景站位為 `(-0.57, 1.20, -0.003)`，鞋底落在濕石地，角色高 1.84 場景單位，初始偏航 10°。首站進到膝上，看臉、開掌和右側車窗。第二站從車側看袖口、披肩厚度和全身著地。左側暖光只輕托臉與掌。

## 房間盤點

| 房間 | 角色占位 | 替換幾何與遮擋檢查 |
|---|---|---|
| 2024-23 | 中左站姿，抬掌朝首站 | 清除原披衣石塑、底座與附著花件，保留雪點、圓燈、棚肋、車窗。首站先查臉與掌，第二站查手臂接合與地面距離。 |
| 2024-55 | 左側略偏前，`(-1.55, .20, -.001)`，高 3.04 場景單位 | 影印機、機頂疊紙和飛紙分層。紅夾和紙張由角色持握，保留一個酒紅文件夾。從側站看人物、機身和出紙口的間隔。 |
| 2024-18-4 | 左側玫瑰前，`(-1.36, .10, .2875)`，高 2.95 場景單位 | 角色帶白花冠與交叉手套。候選場景會移除吊掛花冠、手套雕塑、支架與底座。保留左側粉玫瑰和右側晶泡。第二站的窄直幅允許裁到後方光盤右緣。 |
| 2024-52 | 圓台中左後方坐姿，`(-.75, .66, .218)`，高 2.65 場景單位 | 角色和原模內的單一方凳整體落在圓台。雙環與支撐後移，一個固定點往外側移，讓方凳、玻璃和氣球都有間隔。首站保留臉和蝴蝶結，第二站檢查座面與圓台。 |

角色高度以既有房間座標設定。候選點的查驗包含桌面和直幅之可見範圍、幾何射線遮擋與現有地材。真實輪廓和手勢會隨 GLB 的實際比例與擺位再確認。

## Blender 5.3 用法

從專案根目錄執行，可讓檔名保有空格與中文。

```powershell
$blender = 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe'
$incoming = 'C:/Users/jimmy/Documents/development/young-portfolio-設計提案/畫界-Tripo-重製'
$evidence = 'C:/Users/jimmy/Documents/development/young-portfolio-設計提案/畫界-2024-2026/2024-character-evidence'
$entry = 'scripts/painted-worlds/2024/build_character_room.py'
$env:PYTHONDONTWRITEBYTECODE = '1'

& $blender --background --factory-startup --python-exit-code 1 --python $entry -- --room 2024-23 --plan --out "$evidence/plan/2024-23"
& $blender --background --factory-startup --python-exit-code 1 --python $entry -- --room 2024-23 --asset "$incoming/tripo/2024-23.glb" --decimate-to 46000 --palette-23 --out "$evidence/2024-23-candidate"
& $blender --background --factory-startup --python-exit-code 1 --python $entry -- --room 2024-55 --asset "$incoming/tripo/2024-55.glb" --decimate-to 46000 --palette-55 --out "$evidence/2024-55-candidate"
& $blender --background --factory-startup --python-exit-code 1 --python $entry -- --room 2024-18-4 --asset "$incoming/tripo/2024-18-4.glb" --decimate-to 27000 --palette-stage --out "$evidence/2024-18-4-candidate"
& $blender --background --factory-startup --python-exit-code 1 --python $entry -- --room 2024-52 --asset "$incoming/tripo/2024-52.glb" --decimate-to 40000 --palette-stage --out "$evidence/2024-52-candidate"
```

候選輸出含 `.blend`、GLB、兩站桌面與手機靜幀、房間 JSON 和 `placement-check.json`。資料會記錄原檔雜湊、接地、原作物件穿插、相機範圍及前景遮擋。手掌伸得較遠時，可用 `--source-contact X Y Z` 指定匯入後、旋轉前的鞋底中點，再用 `--yaw`、`--anchor` 或 `--height` 調整。GLB 匯出使用 Y-up，接地與取景參數使用 Blender Z-up。

`--inspect-only` 可只試匯入與擺位。23 的空場由 `--clear-placeholder` 產生。驗收後可加 `--write-room` 寫入該 slug 的六個交付檔。此模式會檢查場景的 2.5 MB 上限、模型穿插與工作期間的同檔變更。新版角色入口重用首輪場景建模，公開總清單仍由整合組組裝。

`--decimate-to` 約束候選網格面數。三種 `--palette-*` 選項依各自原模雜湊套用局部材質。55 以角色手持的紅夾為主，移除房間獨立文件架與舊紅夾。原始 GLB 保留，候選資料夾按 slug 整理。
