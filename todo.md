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
