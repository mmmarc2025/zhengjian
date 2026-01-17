# 政見 ZhengJian - Project TODO

## Core Features

### Database & Schema
- [x] Design candidate table (basic info, party, position, district)
- [x] Design policy/platform table (linked to candidates)
- [x] Design news/updates table
- [x] Design comments table (with moderation status)
- [x] Design issue categories table
- [x] Push database migrations

### Backend API (tRPC)
- [x] Candidate CRUD procedures
- [x] Policy CRUD procedures
- [x] News/updates CRUD procedures
- [x] Comments CRUD procedures (with moderation)
- [x] Search & filter procedures (by county, party, issue)
- [x] Candidate comparison procedure
- [x] Admin-only procedures for content management

### Frontend - Public Pages
- [x] Homepage with hero section and quick search
- [x] Candidate listing page with filters
- [x] Candidate detail page (profile, policies, news)
- [x] Policy search page (integrated in candidate pages)
- [x] News/updates wall
- [x] Candidate comparison page
- [x] Comment/discussion section on candidate pages

### Frontend - Admin Dashboard
- [x] Admin login and role check
- [x] Candidate management (add/edit/delete)
- [x] Policy management
- [x] News management
- [x] Comment moderation panel

### Design & UX
- [x] Dark theme with impactful hero
- [x] Responsive design for mobile
- [ ] Taiwan map visualization (optional)
- [x] Party color coding

## Data Structure

### Position Types (九合一選舉)
- 縣市長 (County/City Mayor)
- 縣市議員 (County/City Councilor)
- 鄉鎮市長 (Township/District Mayor)
- 鄉鎮市民代表 (Township/District Representative)
- 村里長 (Village/Borough Chief)

### Counties/Cities (22)
- 六都: 台北市, 新北市, 桃園市, 台中市, 台南市, 高雄市
- 縣市: 基隆市, 新竹市, 新竹縣, 苗栗縣, 彰化縣, 南投縣, 雲林縣, 嘉義市, 嘉義縣, 屏東縣, 宜蘭縣, 花蓮縣, 台東縣, 澎湖縣, 金門縣, 連江縣

### Major Parties
- 中國國民黨 (KMT)
- 民主進步黨 (DPP)
- 台灣民眾黨 (TPP)
- 時代力量
- 台灣基進
- 無黨籍

### Issue Categories
- 交通建設
- 教育文化
- 經濟發展
- 社會福利
- 環境保護
- 都市規劃
- 醫療衛生
- 治安司法


## Updates - 2026/01/16

- [x] Update website name to "政見 politics.now"
- [x] Search and collect 2026 announced candidates
- [x] Import candidate data sorted by position type

- [x] Change website name from "politics.now" to "political.now"


## Updates - 2026/01/16 (Phase 2)

### Candidate Photos
- [x] Search and upload photos for confirmed candidates (11 key candidates)
- [x] Use silhouette placeholder for test candidates
- [ ] Implement auto-search photo feature for new candidates

### Gemini API Integration
- [x] Integrate Gemini API for automated content updates
- [x] Daily auto-search and update candidate policies (admin trigger)
- [x] Daily auto-search and update election news (admin trigger)
- [ ] Auto-search candidate photos when not available


## Updates - 2026/01/16 (Phase 3)

### Update All Candidate Photos
- [x] Query all candidates from database
- [x] Search photos for all candidates without photos
- [x] Upload and update photos in database

- [x] Add theme switcher feature (white contour style with blue/red/black colors)

- [x] Update 謝龍介 photo with user-provided URL


## Updates - 2026/01/16 (Phase 5)

- [x] Add LINE login integration
- [x] Add floating donation/sponsor heart button (bottom-right corner)

- [x] Set white contour theme as default


## Updates - 2026/01/16 (Phase 6)

- [x] Add candidate news table to database schema
- [x] Add candidate news API endpoints
- [x] Add "Latest News" tab to candidate detail page
- [x] Integrate Gemini API for daily auto-search candidate news
- [x] Update donation button with Stripe link (https://donate.stripe.com/fZu14ocP837LgY3btO4Ja0i)


## Bug Fixes - 2026/01/16

- [x] Fix homepage SEO issues (title, description, keywords)
- [x] Create custom login page with Google and LINE OAuth support
- [x] Implement LINE OAuth 2.0 backend routes
- [ ] Fix news search quality - ensure real news sources with valid links
- [x] Remove test candidates from database (deleted 9 test candidates)
- [x] Keep "Compare Candidates" feature (restored navigation link)

## Updates - 2026/01/16 (Phase 7)

- [x] Implement standalone Google OAuth 2.0 (not using Manus interface)
- [x] Add logout button to navigation (dropdown menu)
- [x] Add settings button and page
- [x] Fix LINE login Callback URL for production site

### Required Callback URL Settings:
- Google: `https://political.now/api/auth/google/callback`
- LINE: `https://political.now/api/auth/line/callback`

## Bug Fixes - 2026/01/16 (Phase 8)

- [x] Fix Google OAuth using wrong client_id in production (hardcoded credentials)
- [x] Fix LINE OAuth redirect_uri issue in production (hardcoded credentials)

- [x] Fix logout functionality not working (now uses tRPC client correctly)


## Current Issues - 2026/01/16

- [x] Update Google OAuth Client ID to 878681000682-1f8bhpgssr78ihmgog3d99s8l870kk8g
- [ ] Configure redirect_uri for new Google Client ID in Google Cloud Console

- [x] Fix Google OAuth callback_failed error - updated Client Secret to match new Client ID

- [x] Fix Google OAuth returns correctly but user is not logged in (fixed cookie settings for production)


## Auto-Update System - 2026/01/16

- [x] Extend party field to support independent and all other parties
- [x] Create auto-search candidates service (by county, district, position)
- [x] Create auto-update policies service
- [x] Create auto-update news service
- [x] Implement smart party detection from content
- [ ] Reference 2022 election data for context
- [x] Create scheduled task API endpoint (every 6 hours)
- [x] Implement Gemini Search Grounding for real-time web search
- [x] Two-phase search strategy (search with grounding, then parse to JSON)
- [x] Add autoUpdate router with admin-only endpoints
- [x] Unit tests for auto-update service

### Tested Candidates Found (台中市西屯區):
- 劉芩妤 (台灣民眾黨)
- 曾崇芳 (無黨籍)
- 楊大鋐 (中國國民黨)
- 黃馨慧 (中國國民黨)
- 張廖乃綸 (中國國民黨)


## Bug Fixes - 2026/01/16 (Phase 9)

- [x] Fix Google OAuth login not working (wrong COOKIE_NAME: was "session", should be "app_session_id")
- [ ] Fix admin login not working


## UI/UX 大改版 - 2026/01/16 (Phase 10)

### 管理後台修復
- [x] Fix auto-search candidates button not showing in admin panel (already implemented)
- [x] Execute candidate search for 台中市西屯區 and update database (7 candidates added)

### 前端視覺優化 (改用深海軍藍 + 朱紅配色)
- [x] Color palette: Deep Navy Blue (#0A2342) + Crimson Red (#A81C31) accent
- [x] Typography: Montserrat for headings, Inter for body
- [x] Hero section with navy gradient background
- [x] Card-based article layout
- [x] Improved white space and breathing room
- [x] Modern navbar with navy background
- [ ] Reading progress bar for long articles
- [ ] Visual "Related Articles" section
- [x] Category tags with party colors
- [x] New light-navy theme added to ThemeProvider
- [x] Updated ThemeSwitcher component with Anchor icon


## UI 調整 - 2026/01/16 (Phase 11)

- [x] Change to white background design
- [x] Keep Navy Blue (#0A2342) and Crimson (#A81C31) as accent colors
- [x] Adjust Hero section to white/light gradient background
- [x] Adjust Navigation to white background with navy text
- [x] Ensure text readability on light background
- [x] Adjust Footer to light gray background


## 全站調整 - 2026/01/16 (Phase 12)

### 移除測試資料
- [x] Remove test candidates from database
- [x] Remove test news from database (deleted news without sourceUrl)

### 統一頁面配色
- [x] Candidates list page - white background
- [x] Candidate detail page - white background
- [x] News page - white background
- [x] Compare page - white background
- [x] Admin page - white background
- [x] Login page - white background
- [x] Settings page - white background

### 修復新聞連結
- [x] Ensure news items have valid external URLs
- [x] Add clickable links to news cards (opens in new tab if sourceUrl exists)


## 新聞與照片修正 - 2026/01/16 (Phase 13)

### 清理錯誤資料
- [x] Delete all existing news (incorrect data)
- [x] Remove frontend AI search news button (keep admin only)

### 候選人照片
- [x] Create backend API for photo search using Gemini Search
- [x] Add batch photo search UI in admin panel
- [x] Allow admin to preview and confirm photos before saving

### 新聞連結
- [ ] News should link to actual announcement of candidacy
- [ ] Ensure news is relevant to the candidate


## 管理後台候選人功能改進 - 2026/01/16 (Phase 14)

### 候選人列表改進
- [x] Add checkbox selection for each candidate row
- [x] Add status icons after candidate name (Image/Newspaper/ScrollText icons)
- [x] Make candidate name clickable to edit page

### 候選人編輯頁面
- [x] Create AdminCandidateEdit page similar to frontend CandidateDetail
- [x] Add manual policy add/edit functionality
- [x] Add manual news add/edit functionality
- [x] Add AI search for policies and news
- [x] Add route in App.tsx
- [x] Add searchPolicies and searchNews API endpoints
- [x] Add candidateNews.create API endpoint


## 管理後台功能改進 - 2026/01/16 (Phase 15)

### 候選人列表批次操作
- [x] Add batch delete functionality for selected candidates
- [x] Add batch edit dialog for party, county, position type
- [x] Show selected count and action buttons when candidates are selected

### AI 搜尋新聞改進
- [x] Use Gemini Search Grounding to search real news
- [x] AI summarizes news and returns title, summary, source URL
- [x] Ensure news links are validated against grounding metadata sources


## AI 搜尋新聞修正 - 2026/01/16 (Phase 16)

- [x] Modify AI search to only return real news links and titles from Google Search Grounding
- [x] Remove AI-generated summaries (they are fictional)
- [x] Update frontend UI to display news link list for selection
- [x] Allow admin to select which news to add


## 新聞顯示格式修正 - 2026/01/16 (Phase 17)

- [x] Remove "vertexaisearch" and "由 AI 自動搜尋整理" labels
- [x] Show news date and source at the top (e.g., 2026/1/16 · 新頭殼)
- [x] Show news title and summary in the middle
- [x] Show news link at the bottom


## 新聞來源和摘要修正 - 2026/01/17 (Phase 18)

- [x] Fix sourceName in database (replace "vertexaisearch" with actual source name from URL)
- [x] Create news summarization function using Gemini API (fetchAndSummarizeNews)
- [x] Auto-generate title and summary when saving news from URL
- [x] Update existing news with proper source names
- [x] Export extractSourceName function for URL-based source detection


## 新聞搜尋功能改進 - 2026/01/17 (Phase 19)

### Gemini API 新聞搜尋改進
- [x] 修改 searchCandidateNews 函數，直接回傳結構化資料（標題、日期、摘要、連結）
- [x] 使用 prompt 讓 Gemini 搜尋候選人的正面新聞
- [x] 回傳格式包含：title, date, summary, sourceUrl, sourceName
- [x] 更新前端 UI 顯示搜尋結果（包含日期、摘要）
- [x] 支援一鍵批次新增所有搜尋到的新聞（「全部新增」按鈕）


## 新聞卡片顯示修正 - 2026/01/17 (Phase 20)

- [x] 確認 Gemini API 回傳的 JSON 格式正確解析（使用兩階段方式：先搜尋再解析）
- [x] 確保前端新聞搜尋結果正確顯示日期、標題、摘要、來源
- [x] 修正新聞卡片 UI 以完整呈現所有資訊
- [x] 當沒有原文連結時顯示「無原文連結」


## 清除錯誤新聞資料 - 2026/01/17 (Phase 21)

- [ ] 刪除資料庫中 sourceName 為 'vertexaisearch' 的所有新聞
- [ ] 確認前端不再顯示錯誤的來源名稱


## 定期排程系統與新聞搜尋優化 - 2026/01/17 (Phase 22)

### Gemini 模型確認
- [x] 確認 Gemini 模型設定為 gemini-3-flash-preview

### 定期排程系統 (server/scheduler.ts)
- [x] 實作每 6 小時執行的 cron job
- [x] 遍歷資料庫中的候選人，自動更新基本資料與政見
- [x] 自動搜尋並新增新聞

### 新聞搜尋優化 (server/gemini-search.ts)
- [x] 更新 Prompt，明確要求搜尋「正面新聞」與「政績」
- [x] 過濾未經證實的謠言，優先採用最具公信力的媒體來源
- [x] 回應格式包含：標題、AI 摘要（強調具體貢獻）、來源連結

### 伺服器整合
- [x] 伺服器啟動時自動開啟排程器
- [x] 新增手動觸發 API (candidate.triggerUpdate)
