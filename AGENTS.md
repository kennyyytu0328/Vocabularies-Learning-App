

# 專案規格書：高中英文單字學習小幫手 (Vocabulary Learning Assistant)

## 1\. 專案概述 (Project Overview)

本專案旨在開發一款面向學生的輕量級、高互動性英文單字學習 Web 應用程式。利用 Client-side 資料庫技術實現零延遲體驗，並透過遊戲化機制（填空與測驗）提升使用者的主動回憶與語義辨識能力。

## 2\. 技術架構 (System Architecture)

### 2.1 技術棧 (Tech Stack)

  * **前端核心 (Frontend Core)**: HTML5, CSS3, Vanilla JavaScript (ES6+)。
  * **資料持久層 (Data Persistence)**:
      * **靜態資料庫**: `sql.js` (WebAssembly 版 SQLite)，用於存儲唯讀的 6000 單字庫。
      * **用戶狀態**: `localStorage` (瀏覽器本地存儲)，用於記錄學習進度與答題數據。
  * **部署模式 (Deployment)**: Static Web Hosting (純靜態網頁，無需後端 API 伺服器)。
  * **資料交換: JSON 檔案 (用於匯出/匯入進度)。

### 2.2 資料流 (Data Flow)

1.  **初始化**: App 啟動時，JS 非同步載入 `.sqlite` (或轉換後的 `.json`) 單字檔至記憶體。與 localStorage 用戶進度。
2.  **出題**: 根據使用者選擇的 Level 與演算法，從記憶體中篩選單字並生成題目。
3.  **互動**: 使用者作答，系統即時驗證。
4.  **回饋**: 答對顯示動畫與例句；答錯顯示正確答案。
5.  **存檔**: 更新 `localStorage` 中的 `user_stats` 物件。每次答題結算後，即時寫入 localStorage。
6.  **備份/還原**: 使用者手動觸發 JSON 檔案的下載（序列化）與上傳（反序列化）。

-----

## 3\. 資料結構 (Data Structures)

### 3.1 單字庫 Schema (ReadOnly)

源自 ETL 處理後的 CSV，載入後結構如下：

```json
{
  "id": "integer (PK)",
  "word": "string (e.g., 'ability')",
  "level": "integer (1-6)",
  "pos": "string (e.g., 'n.')",
  "definition": "string (解析 JSON 後的中文定義)",
  "example": "string (解析 JSON 後的英文例句)"
}
```

### 3.2 用戶進度 Schema (LocalStorage)

Key: `vocab_user_progress`

```json
{
  "user_profile": {
    "last_active_level": 3,
    "total_correct": 150,
    "total_attempts": 200
  },
  "word_stats": {
    "word_ability": { "attempts": 5, "correct": 4, "last_review": 1715623456 },
    "word_abandon": { ... }
  }
}
```

-----

## 4\. 功能需求 (Functional Requirements)

### 4.1 登陸與分級選擇 (Landing & Level Selection)

  * **UI**: 顯示 6 個大按鈕，分別代表 Level 1 \~ Level 6。
  * **邏輯**: 點擊按鈕後，設定全域變數 `currentLevel`，並過渡至「學習主畫面」。
  * **顯示資訊**: 每個按鈕上需顯示該級別的單字總量（例如：Level 1 - 1050 Words）。

### 4.2 學習主畫面 (Main Learning Interface)

  * **佈局**: 中央卡片式設計。
  * **模式切換**: 提供 Toggle 或 Tab 切換「拼字填空」與「定義測驗」模式。
  * **進度儀表板**: 畫面頂部或底部顯示 `本次練習題數` 與 `當前正確率`。

### 4.3 模式一：單字填空 (Cloze Mode)

  * **顯示**:
      * 中文定義 (Definition)。
      * 詞性 (POS)。
      * 挖空後的英文單字 (Masked Word)。
  * **核心演算法 (Masking Algorithm)**: **母音優先 (Vowel Prioritization)**
      * 邏輯：將 `a, e, i, o, u` 替換為 `_`。
      * 防護機制 (Guardrail)：若單字長度 $\le$ 3 或挖空後剩餘字母 $<2$，則強制隨機保留部分母音或改為隨機挖一個字母。
  * **互動**: 輸入框 (Input) 供使用者輸入完整單字或僅輸入缺漏字母（建議輸入完整單字以強化記憶）。

### 4.4 模式二：定義三選一 (Definition Quiz Mode)

  * **顯示**: 完整的英文單字。
  * **選項**: 3 個按鈕，包含 1 個正確中文定義，2 個錯誤定義（誘答項）。
  * **核心演算法 (Distractor Algorithm)**: **層次化篩選**
    1.  **Filter**: 從單字庫中篩選出 `Level` 為 `currentLevel` ± 1 且 `POS` (詞性) 相同的候選詞。
    2.  **Select**: 從候選詞中隨機選取 2 個作為誘答項。
    3.  **Shuffle**: 隨機打亂 3 個選項的順序。

### 4.5 回饋與獎勵 (Feedback System)

  * **觸發**: 使用者提交答案後。
  * **正確時 (Correct)**:
      * 顯示綠色打勾動畫。
      * 顯示「好棒棒」、「太神啦」等隨機鼓勵語。
      * **展開顯示**: 該單字的完整 **例句 (Example)**。
  * **錯誤時 (Incorrect)**:
      * 顯示紅色叉叉動畫。
      * 顯示正確答案。
  * **結算**: 更新 `localStorage` 數據，延遲 1.5 秒後自動進入下一題。


### 4.6 資料管理：跨裝置進度同步 (Data Management)

  * **入口**: 在主畫面右上角或「設定」選單中，提供「備份與還原」區塊。

  * **匯出進度 (Export/Backup)**:

     *動作: 點擊「下載進度」按鈕。

     *邏輯: 讀取 localStorage 中的 vocab_user_progress 物件，轉換為 JSON 字串。

     *產出: 自動下載名為 my_vocab_progress_{日期}.json 的檔案。

  * **匯入進度 (Import/Restore)**:

    *動作: 點擊「上傳進度」按鈕，選擇 JSON 檔案。

    *邏輯:

     1. 解析 JSON 檔案。

     2. Schema 驗證: 檢查檔案格式是否正確（防止匯入錯誤檔案導致 App 崩潰）。

     3. 覆蓋/合併: 提示使用者「這將覆蓋目前的進度」，確認後將資料寫入 localStorage 並重新整理頁面。

-----

## 5\. UI/UX 設計規範 (Design Guidelines)

  * **視覺風格 (Style)**: 極簡主義 (Minimalism)，去除不必要的裝飾。
  * **配色 (Color Palette)**:
      * 背景: 柔和的淺灰或米色 (減低視覺疲勞)。
      * 主色調: 活潑的藍色或橙色 (代表學習/活力)。
      * 成功色: 鮮豔的綠色。
      * 錯誤色: 柔和的紅色 (不要太刺眼)。
  * **字體 (Typography)**: 英文使用無襯線字體 (如 Roboto, Open Sans)，單字顯示字體需**特大 (Extra Large)**。
  * **動效 (Animation)**:
      * 卡片切換：淡入淡出 (Fade in/out) 或 滑動 (Slide)。
      * 按鈕回饋：點擊時微縮 (Scale down)。
  * **新增 UI 元素**:
      * 設定/齒輪圖示 (Settings Icon): 置於主畫面角落，點擊展開功能選單。
      * 備份按鈕: 使用「雲端下載」圖示（⬇️）代表匯入，「雲端上傳」圖示（⬆️）代表匯出，符合直覺。

-----

## 6\. 非功能性需求 (Non-Functional Requirements)

1.  **效能 (Performance)**: 題目生成時間需 \< 100ms (感知上即時)。
2.  **離線能力 (Offline Capability)**: 首次載入後，即使斷網也能完整使用所有功能。
3.  **相容性 (Compatibility)**: 支援主流瀏覽器 (Chrome, Safari, Edge) 的桌面與行動版 (Mobile Responsive)。
4.  **錯誤處理 (Error Handling)**: 若匯入的 JSON 格式損毀或版本不符，需彈出友善提示「檔案格式錯誤」，而非讓程式當機。
-----
