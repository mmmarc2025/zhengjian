/**
 * Gemini API with Google Search Grounding
 * Provides real-time web search capabilities for accurate news and candidate information
 * 
 * Strategy: Two-phase approach
 * 1. Use Google Search Grounding to get real sources
 * 2. Use regular Gemini call to parse and format results
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SEARCH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    groundingMetadata?: GroundingMetadata;
  }>;
}

/**
 * Call Gemini API with Google Search Grounding enabled
 * Returns both the text response and the grounding sources
 */
async function callGeminiWithSearch(prompt: string): Promise<{
  text: string;
  sources: Array<{ uri: string; title: string }>;
  searchQueries: string[];
}> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(`${GEMINI_SEARCH_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      tools: [
        {
          google_search: {},
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const metadata = data.candidates?.[0]?.groundingMetadata;

  const sources = (metadata?.groundingChunks || [])
    .filter((chunk): chunk is { web: { uri: string; title: string } } => !!chunk.web)
    .map((chunk) => ({
      uri: chunk.web.uri,
      title: chunk.web.title,
    }));

  return {
    text,
    sources,
    searchQueries: metadata?.webSearchQueries || [],
  };
}

/**
 * Call Gemini API without search (for JSON parsing)
 */
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(`${GEMINI_SEARCH_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data: GeminiResponse = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/**
 * Political parties in Taiwan
 */
export const TAIWAN_PARTIES = [
  "中國國民黨",
  "民主進步黨",
  "台灣民眾黨",
  "時代力量",
  "台灣基進",
  "新黨",
  "親民黨",
  "綠黨",
  "社會民主黨",
  "台灣團結聯盟",
  "無黨籍",
  "其他",
] as const;

/**
 * Taiwan counties/cities for 2026 nine-in-one elections
 */
export const TAIWAN_COUNTIES = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市",
  "基隆市", "新竹市", "嘉義市",
  "新竹縣", "苗栗縣", "彰化縣", "南投縣", "雲林縣", "嘉義縣", "屏東縣",
  "宜蘭縣", "花蓮縣", "台東縣", "澎湖縣", "金門縣", "連江縣",
] as const;

/**
 * Position types
 */
export const POSITION_TYPES = {
  mayor: "縣市長",
  councilor: "縣市議員",
  township_mayor: "鄉鎮市長",
  representative: "鄉鎮市民代表",
  village_chief: "村里長",
} as const;

interface CandidateSearchResult {
  name: string;
  party: string;
  county: string;
  district?: string;
  positionType: keyof typeof POSITION_TYPES;
  sourceUrl?: string;
  sourceName?: string;
  summary?: string;
}

/**
 * Search for new candidates in a specific county and position
 * Uses two-phase approach: search for info, then parse to JSON
 */
export async function searchNewCandidates(
  county: string,
  positionType: keyof typeof POSITION_TYPES
): Promise<CandidateSearchResult[]> {
  const positionName = POSITION_TYPES[positionType];
  
  // Phase 1: Search for information with grounding
  const searchPrompt = `請搜尋 2026 台灣九合一地方選舉 ${county} ${positionName} 的最新參選人。
列出已經正式宣布參選的候選人，包含姓名、政黨、選區。`;

  const { text: searchResult, sources } = await callGeminiWithSearch(searchPrompt);
  
  if (!searchResult || searchResult.length < 20) {
    console.log(`[GeminiSearch] No search results for ${county} ${positionName}`);
    return [];
  }

  // Phase 2: Parse the search result to JSON
  const parsePrompt = `根據以下搜尋結果，提取候選人資訊並以 JSON 格式回傳。

搜尋結果：
${searchResult}

請以 JSON 格式回傳候選人資訊，格式如下：
[
  {
    "name": "候選人姓名",
    "party": "政黨名稱（如：中國國民黨、民主進步黨、台灣民眾黨、時代力量、台灣基進、新黨、親民黨、無黨籍）",
    "district": "選區（如適用）",
    "summary": "簡短介紹（約 50 字）"
  }
]

注意：
1. 只提取明確提到的候選人
2. 政黨必須準確，無黨籍請標註為「無黨籍」
3. 如果無法確定，請省略該候選人
4. 回傳有效的 JSON 陣列，開頭是 [ 結尾是 ]`;

  try {
    const parseResult = await callGemini(parsePrompt);
    
    // Extract JSON from response
    const jsonMatch = parseResult.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`[GeminiSearch] Failed to parse JSON for ${county} ${positionName}`);
      return [];
    }

    const candidates = JSON.parse(jsonMatch[0]) as Array<{
      name: string;
      party: string;
      district?: string;
      summary?: string;
    }>;

    return candidates.map((c) => ({
      name: c.name,
      party: c.party,
      county,
      district: c.district,
      positionType,
      sourceUrl: sources[0]?.uri,
      sourceName: sources[0]?.title,
      summary: c.summary,
    }));
  } catch (error) {
    console.error(`Error parsing candidates for ${county} ${positionName}:`, error);
    return [];
  }
}

interface NewsSearchResult {
  title: string;
  summary: string;
  sourceUrl: string;
  sourceName: string;
  topic: string;
  publishedDate?: string;
}

/**
 * Search for latest news about a candidate with real sources
 * Uses two-phase approach: search for info, then parse to JSON
 */
export async function searchCandidateNewsWithSources(
  candidateName: string,
  county: string
): Promise<NewsSearchResult[]> {
  // Phase 1: Search for news with grounding - ask for detailed information
  const searchPrompt = `請搜尋關於「${candidateName}」（${county}）的最新選舉相關新聞。

請列出最近 3-5 則新聞，每則包含：
1. 新聞標題
2. 新聞內容摘要（100-150 字）
3. 新聞來源
4. 發布日期（如有）`;

  const { text: searchResult, sources } = await callGeminiWithSearch(searchPrompt);
  
  if (!searchResult || searchResult.length < 20) {
    console.log(`[GeminiSearch] No news found for ${candidateName}`);
    return [];
  }

  // Phase 2: Parse the search result to JSON
  const parsePrompt = `根據以下搜尋結果，提取新聞資訊並以 JSON 格式回傳。

搜尋結果：
${searchResult}

請以 JSON 格式回傳最多 5 則新聞，格式如下：
[
  {
    "title": "新聞標題",
    "summary": "新聞摘要（約 100-150 字）",
    "topic": "新聞主題分類（如：政見發表、選情分析、民調、造勢活動、政策辯論、爭議事件等）",
    "publishedDate": "發布日期（如有，格式：YYYY-MM-DD）"
  }
]

注意：
1. 每則新聞的 topic 必須是獨特的
2. 只提取明確提到的新聞
3. 回傳有效的 JSON 陣列，開頭是 [ 結尾是 ]`;

  try {
    const parseResult = await callGemini(parsePrompt);
    
    // Extract JSON from response
    const jsonMatch = parseResult.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`[GeminiSearch] Failed to parse news JSON for ${candidateName}`);
      return [];
    }

    const newsItems = JSON.parse(jsonMatch[0]) as Array<{
      title: string;
      summary: string;
      topic: string;
      publishedDate?: string;
    }>;

    // Map sources to news items
    return newsItems.map((item, index) => ({
      title: item.title,
      summary: item.summary,
      topic: item.topic,
      publishedDate: item.publishedDate,
      sourceUrl: sources[index]?.uri || sources[0]?.uri || "",
      sourceName: sources[index]?.title || sources[0]?.title || "網路新聞",
    }));
  } catch (error) {
    console.error(`Error parsing news for ${candidateName}:`, error);
    return [];
  }
}

/**
 * Detect party from news content using AI
 */
export async function detectPartyFromContent(
  candidateName: string,
  newsContent: string
): Promise<string> {
  const prompt = `根據以下新聞內容，判斷「${candidateName}」的政黨屬性。

新聞內容：
${newsContent}

可能的政黨選項：
- 中國國民黨（藍營）
- 民主進步黨（綠營）
- 台灣民眾黨（白營）
- 時代力量
- 台灣基進
- 新黨
- 親民黨
- 無黨籍
- 其他（請說明）

請只回傳政黨名稱，不要有其他文字。如果無法判斷，回傳「無法判斷」。`;

  try {
    const text = await callGemini(prompt);
    const party = text.trim();
    
    // Normalize party name
    if (party.includes("國民黨")) return "中國國民黨";
    if (party.includes("民進黨") || party.includes("民主進步黨")) return "民主進步黨";
    if (party.includes("民眾黨")) return "台灣民眾黨";
    if (party.includes("時代力量")) return "時代力量";
    if (party.includes("台灣基進") || party.includes("基進黨")) return "台灣基進";
    if (party.includes("新黨")) return "新黨";
    if (party.includes("親民黨")) return "親民黨";
    if (party.includes("無黨籍") || party.includes("無黨")) return "無黨籍";
    if (party.includes("無法判斷")) return "無黨籍";
    
    return party;
  } catch (error) {
    console.error(`Error detecting party for ${candidateName}:`, error);
    return "無黨籍";
  }
}

/**
 * Search for candidate policies with real sources
 * Uses two-phase approach: search for info, then parse to JSON
 */
export async function searchCandidatePolicies(
  candidateName: string,
  county: string,
  positionType: keyof typeof POSITION_TYPES
): Promise<Array<{
  category: string;
  title: string;
  content: string;
  sourceUrl?: string;
}>> {
  const positionName = POSITION_TYPES[positionType];
  
  // Phase 1: Search for policies with grounding
  const searchPrompt = `請搜尋「${candidateName}」參選 ${county} ${positionName} 的政見主張。
列出主要政見內容。`;

  const { text: searchResult, sources } = await callGeminiWithSearch(searchPrompt);
  
  if (!searchResult || searchResult.length < 20) {
    console.log(`[GeminiSearch] No policies found for ${candidateName}`);
    return [];
  }

  // Phase 2: Parse the search result to JSON
  const parsePrompt = `根據以下搜尋結果，提取政見資訊並以 JSON 格式回傳。

搜尋結果：
${searchResult}

請以 JSON 格式回傳主要政見，格式如下：
[
  {
    "category": "政見類別（如：交通建設、教育文化、經濟發展、社會福利、環境保護、都市規劃、醫療衛生、治安司法）",
    "title": "政見標題",
    "content": "政見內容（約 100-200 字）"
  }
]

注意：
1. 只提取明確提到的政見
2. 每個類別最多一條政見
3. 回傳有效的 JSON 陣列，開頭是 [ 結尾是 ]`;

  try {
    const parseResult = await callGemini(parsePrompt);
    
    // Extract JSON from response
    const jsonMatch = parseResult.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log(`[GeminiSearch] Failed to parse policies JSON for ${candidateName}`);
      return [];
    }

    const policies = JSON.parse(jsonMatch[0]) as Array<{
      category: string;
      title: string;
      content: string;
    }>;

    return policies.map((p) => ({
      ...p,
      sourceUrl: sources[0]?.uri,
    }));
  } catch (error) {
    console.error(`Error parsing policies for ${candidateName}:`, error);
    return [];
  }
}

/**
 * Run full auto-update cycle
 */
export async function runAutoUpdate(options: {
  counties?: string[];
  positionTypes?: Array<keyof typeof POSITION_TYPES>;
  updateNews?: boolean;
  updatePolicies?: boolean;
}): Promise<{
  newCandidates: CandidateSearchResult[];
  newsUpdated: number;
  policiesUpdated: number;
  errors: string[];
}> {
  const counties = options.counties || ["台北市", "新北市", "台中市", "高雄市"];
  const positionTypes = options.positionTypes || ["mayor", "councilor"];
  const errors: string[] = [];
  const newCandidates: CandidateSearchResult[] = [];
  let newsUpdated = 0;
  let policiesUpdated = 0;

  // Search for new candidates
  for (const county of counties) {
    for (const positionType of positionTypes) {
      try {
        const candidates = await searchNewCandidates(county, positionType);
        newCandidates.push(...candidates);
      } catch (error) {
        const msg = `Error searching ${county} ${positionType}: ${error}`;
        console.error(msg);
        errors.push(msg);
      }
    }
  }

  return {
    newCandidates,
    newsUpdated,
    policiesUpdated,
    errors,
  };
}
