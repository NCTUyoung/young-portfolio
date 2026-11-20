# 2025 角色重製與匯入契約

第一順序是 **孤独 → 鏡 → Cosplayer**，再依本輪美術驗收處理鑽石與紅黑雙人。五房的去角色底場景、原取景灰模和拆除清單在既有 2025 場景證據的 `角色重製/<slug>/base`。先核對角色原作，再用提供的 Tripo 原始檔建候選場景。

| 場景 | 舊模高風險與新模驗收 | 初始對位，Blender Z-up、米 |
|---|---|---|
| 孤独 | 舊模端坐正視，抬手離下巴，雙腿在正面疊成一束。新本體斜坐仰頭，一手撐座、一手近下巴，一膝外伸、另一腿收折。灰白帽、頸掛耳機、寬鬆外套、摺裙與薄襪鞋在側站保持輪廓。淺包、雨棚與長椅從場景沿用。 | 以臀底定在 `[-.34,-.11,.628]`。向 `-Y` 後偏轉 19°，全高約 2.02，至少一隻著地鞋底接到人行道 `Z=.14`。 |
| 鏡 | 原手指像尖塊，支撐臂停在腰前，外套接褲管處有穿插。新本體上身前傾、抬手至嘴鼻附近，另一手可由畫外補成支撐檯面。保留靛藍長髮、頭頂墨鏡、圓耳飾、近黑翻領與淺高領。只收一人。 | 雙足下緣中點 `[.33,-.90,0]`，面向鏡面，偏轉 193°，全高約 2.65。指尖留在拱孔前方，程式以 `Y=.288` 反射同一份網格及材質。 |
| Cosplayer | 舊模雙膝等距、頭腰直挺、腕掌懸空，觀眾重複。低坐轉肩與頭，一手屈腕近下巴，另一手落在腿側或座面。保留斜展長耳、圓眼鏡、雙束髮、紙白膚髮、石墨服飾、網襪與高跟鞋。 | 臀底 `[0,.132,.823]`，偏轉 −9°、含雙耳全高約 2.98，至少一腳可靠接觸踏台或地坪。手機留在右前方。左近、右中、後遠各一處可選攝影者，方向都朝主角，應用不同人物或姿勢。 |
| 鑽石 | 舊模兩腳對稱開蹲，肩髖缺乏扭轉。新本體半跪回頭、露肩，一膝抬起一腿折低。保留帶珠白結、冷白藍紫裁面、放射裙片與白色帶跟短靴。劍為同 GLB 內可獨立選取的網格，握柄與掌指分開。 | 著地足對位台面 `[.25,.04,.138]`，偏轉 −16°，含頭結全高約 3.00。劍尖及結冠各存一個檢查點。圓盤、台座、紫藍空間光保留。 |
| 36-編輯-1 | 舊雙人直立，交疊前臂像一束。前低髮髻單眼遮擋和後高長辮分別出檔。兩人靠近，掌指落在彼此肩臂，側視分得出前後。保留藍帽、制服翻領和原有手銬鏈列。 | 前位 `[-.50,-.18,.18]`，偏轉 15°、全高 2.46。後位 `[.46,.22,.18]`，偏轉 −21°、全高 2.78。雙腳踩漆台。 |

## 原始 GLB

把原始檔放在既定的 `畫界-Tripo-重製` 內。建議命名如下，實際檔名可在對位清單指定。

```text
tripo/2025/solitude/hero.glb
tripo/2025/mirror/hero.glb
tripo/2025/cosplayer/hero.glb
tripo/2025/2025-36/front-bun.glb
tripo/2025/2025-36/rear-braid.glb
tripo/2025/diamond/hero.glb
```

使用 GLB 2.0。灰模可先驗姿勢；有材質貼圖時請內嵌。保留靜止的預定姿勢、服裝與角色配件。主角各自出檔，畫面背景、海報文字、取景介面、重複的鏡像、房間道具和自帶底座勿隨角色出檔。先保留原始匯出與原始比例，匯入後再量同一套三維座標及必要的材質微調。

角色清單以房間 slug 為索引，第二層是角色名。下例說明欄位，示例數字需以該 GLB 匯入 Blender 的實際量測替換。

```json
{
  "solitude": {
    "hero": {
      "file": "tripo/2025/solitude/hero.glb",
      "forward": "-Y",
      "anchor": [0.0, 0.12, 0.49],
      "soles": [[0.21, -0.39, 0.0]],
      "landmarks": {
        "face": [-0.03, -0.07, 1.28],
        "chinHand": [0.1, -0.16, 1.03],
        "supportHand": [-0.37, 0.08, 0.48]
      }
    }
  }
}
```

- `forward` 在 Blender 匯入後量，使用 `-Y`、`+Y`、`-X` 或 `+X`。所有 `anchor`、`soles`、`landmarks` 同樣用模型匯入後尚未移動的 Blender Z-up 世界座標。
- 坐姿的 `anchor` 取臀底接觸點，站姿取兩鞋底之間的中央落地點，低踞可取主要承重鞋底。只標實際著地的腳，抬腳用側檢確認。對位表列的是初始落點；程式用場內實際座椅與地面幾何查接觸。
- 對位可依實際源檔在角色條目提供 `target`、`yaw`、`height`。使用單一比例縮放，保持原姿態。新件過寬、手勢差太多或衣、手焊在一起時，先修該源件再匯入。
- `landmarks` 必填項見 [placements.json](placements.json)。每個主角另標 `face`。Cosplayer 的 `crowd-left`、`crowd-right`、`crowd-rear` 可獨立增補，三處採不同來源，遠處保留相機與輪廓即可。
- 網頁輸出自 Blender 轉為 glTF Y-up，對應 `(x,y,z) → (x,z,-y)`。角色採源檔的材質槽、UV、色點和貼圖，照明取現場。灰模可先入場檢查比例，正式候選應核對與原畫的大色塊。

## 執行

在 worktree 根目錄啟動 Blender 5.3。先把來源根目錄和證據根目錄設定成兩個不同路徑。

```powershell
$b = 'C:/Program Files/Blender Foundation/Blender 5.3/blender.exe'
$proposal = 'C:/Users/jimmy/Documents/development/young-portfolio-設計提案'
$evidence = Join-Path $proposal '畫界-2024-2026/2025-場景證據'
$raw = Join-Path $proposal '畫界-Tripo-重製'
$placementsFile = Join-Path $evidence '角色重製/placements.local.json'
$script = 'scripts/painted-worlds/2025/tripo_actors.py'
& $b --background --factory-startup --python-exit-code 1 --python $script -- prepare --evidence $evidence
& $b --background --factory-startup --python-exit-code 1 --python $script -- candidate --evidence $evidence --source-root $raw --manifest $placementsFile --only solitude
```

候選場景寫在證據目錄的 `角色重製/<slug>/candidate`，包含 Blender 源檔、GLB、桌機雙站、手機雙站、側後檢和臉、手、足局部檢查圖。逐張核對臉、手、衣、腳、重心和輪廓，鏡室特別核對手、鏡面及台面間隙。匯出前保留源 GLB，視需要再做貼圖或網格縮減。通過檢查後用同一命令的 `install --evidence $evidence --only <slug>` 寫入該房公開的 GLB 和四張定格；程式校驗原套件雜湊、候選檔雜湊和 2.5 MB 預算。整合入口使用現有的 `room.json`。

## 孤独、鏡的實際 Tripo 源檔

兩件使用 `tripo/solitude.glb`、`tripo/mirror.glb`。原始兩件均為單網格、無貼圖。程式保留約 15.5 萬面的角色審查副本，網頁版本以原畫色塊手工分區並嵌入頂點色。孤独改用貼地座沿配合原網格的側坐支點，保留街景長椅、雨棚和放低的淺包。《鏡》的妝台右端縮短以讓出站位，拱框前後用同一份減面網格和材質。

```powershell
$stage = 'scripts/painted-worlds/2025/finish_two.py'
& $b --background --factory-startup --python-exit-code 1 --python $stage -- inspect --evidence $evidence --source-root (Join-Path $raw 'tripo')
& $b --background --factory-startup --python-exit-code 1 --python $stage -- fit --evidence $evidence
& $b --background --factory-startup --python-exit-code 1 --python $stage -- final --evidence $evidence
& $b --background --factory-startup --python-exit-code 1 --python $stage -- install --evidence $evidence
```

`raw` 保留六面灰模與來源 SHA-256。`fit` 保留正式站位、側後檢和接觸局部。`final` 保留 Blender 源檔、兩對 fallback、側後檢、更新後的 room.json、網格及接觸驗證。正式站位只在這兩房各自的 room.json 更新。

《鏡》第一站獨立重拍時，以 `mirror-closeup --evidence $evidence` 讀取已對位的 Blender 場景，輸出 `鏡` 的 `closeup` 證據。確認桌機和手機構圖後，用 `install-mirror-closeup --evidence $evidence` 寫入第一站的兩張 fallback 與 room.json。此操作由現行場景 GLB 雜湊確認 Blender 來源，第二站繼續使用原有檯面取景。
