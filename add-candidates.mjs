import { drizzle } from 'drizzle-orm/mysql2';
import { eq, and } from 'drizzle-orm';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SEARCH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGeminiWithSearch(prompt) {
  const response = await fetch(`${GEMINI_SEARCH_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      tools: [{ google_search: {} }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
    }),
  });
  
  if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);
  
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const sources = (data.candidates?.[0]?.groundingMetadata?.groundingChunks || [])
    .filter(c => c.web)
    .map(c => ({ uri: c.web.uri, title: c.web.title }));
  
  return { text, sources };
}

async function callGemini(prompt) {
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 8192 },
    }),
  });
  
  if (!response.ok) throw new Error(`Gemini API error: ${await response.text()}`);
  
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function searchAndParseCandidates(county) {
  console.log(`\n========== 搜尋 ${county} 議員候選人 ==========`);
  
  const searchPrompt = `搜尋 2026 台灣九合一地方選舉 ${county} 縣市議員 參選人名單。
請列出所有已宣布參選或傳出有意參選的人，包含：
1. 姓名
2. 政黨
3. 選區（如北屯區、西屯區等）
4. 背景介紹`;

  const { text: searchResult, sources } = await callGeminiWithSearch(searchPrompt);
  
  console.log(`搜尋結果長度: ${searchResult.length} 字元`);
  console.log(`來源: ${sources.slice(0, 3).map(s => s.title).join(', ')}`);
  
  if (!searchResult || searchResult.length < 100) {
    console.log(`無足夠搜尋結果`);
    return [];
  }

  // 直接從搜尋結果解析
  const parsePrompt = `從以下內容中提取所有候選人資訊，輸出純 JSON 陣列：

${searchResult}

輸出格式（只輸出 JSON，不要其他文字）：
[{"name":"姓名","party":"政黨","district":"選區","summary":"介紹"}]

政黨選項：中國國民黨、民主進步黨、台灣民眾黨、時代力量、台灣基進、新黨、親民黨、無黨籍
如果政黨不明確，填「待確認」`;

  try {
    const parseResult = await callGemini(parsePrompt);
    console.log(`解析結果: ${parseResult.substring(0, 200)}...`);
    
    const jsonMatch = parseResult.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log(`無法解析 JSON`);
      return [];
    }

    const candidates = JSON.parse(jsonMatch[0]);
    
    // 過濾掉無效的候選人
    const validCandidates = candidates.filter(c => 
      c.name && 
      c.name !== "候選人姓名" && 
      c.name.length >= 2 && 
      c.name.length <= 10
    );
    
    return validCandidates.map(c => ({
      name: c.name,
      party: c.party || '待確認',
      county,
      district: c.district || null,
      positionType: 'councilor',
      sourceUrl: sources[0]?.uri || null,
      summary: c.summary || null,
    }));
  } catch (error) {
    console.error(`解析錯誤:`, error.message);
    return [];
  }
}

async function addCandidatesToDB(candidates) {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL 未設定');
    return;
  }
  
  const db = drizzle(process.env.DATABASE_URL);
  
  // 動態 import schema
  const { candidates: candidatesTable } = await import('./drizzle/schema.ts');
  
  let added = 0;
  let skipped = 0;
  
  for (const c of candidates) {
    try {
      // 檢查是否已存在
      const existing = await db.select()
        .from(candidatesTable)
        .where(and(
          eq(candidatesTable.name, c.name),
          eq(candidatesTable.county, c.county)
        ))
        .limit(1);
      
      if (existing.length > 0) {
        console.log(`跳過已存在: ${c.name} (${c.county})`);
        skipped++;
        continue;
      }
      
      // 新增候選人
      await db.insert(candidatesTable).values({
        name: c.name,
        party: c.party,
        county: c.county,
        district: c.district,
        positionType: c.positionType,
        sourceUrl: c.sourceUrl,
        summary: c.summary,
      });
      
      console.log(`✓ 新增: ${c.name} (${c.party}) - ${c.county} ${c.district || ''}`);
      added++;
    } catch (error) {
      console.error(`✗ 新增失敗: ${c.name}`, error.message);
    }
  }
  
  console.log(`\n完成: 新增 ${added} 人, 跳過 ${skipped} 人`);
}

async function main() {
  const allCandidates = [];
  
  // 搜尋台中市
  const candidates = await searchAndParseCandidates('台中市');
  console.log(`\n找到 ${candidates.length} 位候選人`);
  
  for (const c of candidates) {
    console.log(`  - ${c.name} (${c.party}) ${c.district || ''}`);
  }
  
  allCandidates.push(...candidates);
  
  if (allCandidates.length > 0) {
    console.log('\n========== 新增到資料庫 ==========');
    await addCandidatesToDB(allCandidates);
  }
}

main().catch(console.error);
