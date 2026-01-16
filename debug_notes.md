# Debug Notes - 2026/01/17

## 問題發現
搜尋結果 Dialog 只顯示：
- vertexaisearch (來源名稱)
- cna.com.tw (網址)
- 查看原文 (連結)
- 新增 (按鈕)

缺少：
- 新聞標題
- 日期
- 摘要

## 原因分析
1. Gemini API 回傳的 JSON 可能沒有被正確解析
2. 或者 fallback 到了 grounding sources，只有 URL 沒有內容
3. 需要檢查 API 回傳的實際資料
