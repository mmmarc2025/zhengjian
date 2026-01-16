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
 * Extract source name from URL
 */
export function extractSourceName(url: string): string {
  const sourceMap: Record<string, string> = {
    'udn.com': '聯合新聞網',
    'ltn.com': '自由時報',
    'chinatimes.com': '中時新聞網',
    'ettoday.net': 'ETtoday',
    'tvbs.com.tw': 'TVBS',
    'setn.com': '三立新聞',
    'mirrormedia.mg': '鏡週刊',
    'cna.com.tw': '中央社',
    'storm.mg': '風傳媒',
    'newtalk.tw': '新頭殼',
    'nownews.com': 'NOWnews',
    'nextapple.com': '壹蘋新聞網',
    'yahoo.com': 'Yahoo新聞',
    'msn.com': 'MSN新聞',
    'businesstoday.com.tw': '今周刊',
    'wealth.com.tw': '財訊',
    'ctee.com.tw': '工商時報',
    'rti.org.tw': '央廣',
    'pts.org.tw': '公視',
    'ftv.com.tw': '民視',
    'ttv.com.tw': '台視',
    'ctitv.com.tw': '中天',
    'ebc.net.tw': '東森',
  };
  
  for (const [domain, name] of Object.entries(sourceMap)) {
    if (url.includes(domain)) return name;
  }
  
  // Try to extract domain name
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return '網路新聞';
  }
}

/**
 * Search for latest positive news about a candidate
 * Uses two-phase approach:
 * 1. Use Search Grounding to find real news sources
 * 2. Use regular Gemini to parse and summarize the results
 * Returns structured news data with title, date, summary, and source URL
 */
export async function searchCandidateNewsWithSources(
  candidateName: string,
  county: string,
  count: number = 5
): Promise<NewsSearchResult[]> {
  try {
    console.log(`[GeminiSearch] Searching news for ${candidateName}...`);
    
    // Phase 1: Search for news with grounding to get real sources and content
    const searchPrompt = `請搜尋 ${count} 則「${candidateName}」的正面新聞報導（政績、爭取經費、服務選民等）。
請列出每則新聞的標題、日期、內容摘要和來源。`;
    
    const { text: searchResult, sources } = await callGeminiWithSearch(searchPrompt);
    
    console.log(`[GeminiSearch] Search result length: ${searchResult.length}`);
    console.log(`[GeminiSearch] Sources count: ${sources.length}`);
    
    // Log the actual search result for debugging
    console.log(`[GeminiSearch] Raw search result:`, searchResult.substring(0, 1000));
    
    if (!searchResult || searchResult.trim().length === 0) {
      console.log(`[GeminiSearch] No search results for ${candidateName}`);
      return [];
    }
    
    // Phase 2: Parse the search result to structured JSON
    const parsePrompt = `根據以下搜尋結果，提取新聞資訊並以 JSON 格式回傳。

搜尋結果：
${searchResult}

請以 JSON 格式回傳，格式如下：
[
  {
    "title": "新聞標題",
    "date": "YYYY/MM/DD",
    "summary": "內容摘要（100-150字）",
    "sourceUrl": "新聞連結",
    "sourceName": "來源名稱（如：中央社、聯合新聞網、自由時報）"
  }
]

注意：
1. 只提取明確提到的新聞
2. 摘要必須基於搜尋結果中的實際內容
3. 如果沒有明確的連結，請留空
4. 回傳有效的 JSON 陣列，開頭是 [ 結尾是 ]`;
    
    const parseResult = await callGemini(parsePrompt);
    
    // Extract JSON from response
    const jsonMatch = parseResult.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const newsItems = JSON.parse(jsonMatch[0]) as Array<{
          title: string;
          date?: string;
          summary: string;
          sourceUrl: string;
          sourceName: string;
        }>;
        
        console.log(`[GeminiSearch] Parsed ${newsItems.length} news items`);
        
        // Try to match with grounding sources for better URLs
        return newsItems.map((item) => {
          // Find matching source from grounding metadata
          const matchingSource = sources.find(s => 
            s.title.includes(item.title.substring(0, 10)) || 
            item.title.includes(s.title.substring(0, 10))
          );
          
          return {
            title: item.title,
            summary: item.summary,
            sourceUrl: matchingSource?.uri || item.sourceUrl || "",
            sourceName: item.sourceName || extractSourceName(matchingSource?.uri || item.sourceUrl || ""),
            topic: "新聞報導",
            publishedDate: item.date,
          };
        });
      } catch (parseError) {
        console.error(`[GeminiSearch] JSON parse error:`, parseError);
      }
    }
    
    // Fallback: use grounding sources directly
    console.log(`[GeminiSearch] Falling back to grounding sources`);
    if (!sources || sources.length === 0) {
      return [];
    }
    
    // Filter out non-news sources
    const newsSourcePatterns = [
      'udn.com', 'ltn.com', 'chinatimes.com', 'ettoday.net', 'tvbs.com.tw',
      'setn.com', 'mirrormedia.mg', 'cna.com.tw', 'storm.mg', 'newtalk.tw',
      'nownews.com', 'appledaily.com', 'nextapple.com', 'yahoo.com', 'msn.com',
      'businesstoday.com.tw', 'wealth.com.tw', 'ctee.com.tw', 'rti.org.tw',
      'pts.org.tw', 'ftv.com.tw', 'ttv.com.tw', 'ctitv.com.tw', 'ebc.net.tw'
    ];
    
    const newsSources = sources.filter(s => 
      newsSourcePatterns.some(pattern => s.uri.includes(pattern))
    );
    const finalSources = newsSources.length > 0 ? newsSources : sources;
    
    return finalSources.slice(0, count).map((source) => ({
      title: source.title,
      summary: "",
      topic: "新聞報導",
      publishedDate: undefined,
      sourceUrl: source.uri,
      sourceName: extractSourceName(source.uri),
    }));
  } catch (error) {
    console.error(`Error searching news for ${candidateName}:`, error);
    return [];
  }
}

/**
 * Fetch and summarize news content from a URL using Gemini
 * This reads the actual news content and generates a summary
 */
export async function fetchAndSummarizeNews(newsUrl: string, newsTitle: string): Promise<{
  title: string;
  summary: string;
  sourceName: string;
}> {
  // Use Gemini with search grounding to read the news content
  const prompt = `請閱讀以下新聞連結的內容，並生成摘要：
新聞連結：${newsUrl}
新聞標題：${newsTitle}

請以 JSON 格式回傳：
{
  "title": "新聞標題（使用原始標題或更精確的標題）",
  "summary": "新聞摘要（100-150字，包含重點內容）"
}

注意：
1. 摘要必須基於新聞實際內容
2. 只回傳 JSON，不要有其他文字`;

  try {
    const { text } = await callGeminiWithSearch(prompt);
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        title: result.title || newsTitle,
        summary: result.summary || "",
        sourceName: extractSourceName(newsUrl),
      };
    }
    
    return {
      title: newsTitle,
      summary: "",
      sourceName: extractSourceName(newsUrl),
    };
  } catch (error) {
    console.error(`Error fetching news content for ${newsUrl}:`, error);
    return {
      title: newsTitle,
      summary: "",
      sourceName: extractSourceName(newsUrl),
    };
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
        const msg = `Error searching candidates for ${county} ${positionType}: ${error}`;
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


/**
 * Search for candidate photo using Google Image Search
 */
export async function searchCandidatePhoto(
  candidateName: string,
  party: string,
  county: string
): Promise<{
  photoUrl: string | null;
  searchQuery: string;
  source: string | null;
}> {
  // Use Gemini with search grounding to find photo URLs
  const searchQuery = `${candidateName} ${party} ${county} 候選人 照片`;
  const prompt = `請搜尋「${candidateName}」（${party}，${county}）的官方照片或新聞照片。
請提供一個可用的照片網址。

只回傳 JSON 格式：
{
  "photoUrl": "照片網址（如果找到）",
  "source": "照片來源"
}

如果找不到照片，photoUrl 設為 null。`;

  try {
    const { text, sources } = await callGeminiWithSearch(prompt);
    
    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        photoUrl: result.photoUrl || null,
        searchQuery,
        source: result.source || sources[0]?.title || null,
      };
    }
    
    return {
      photoUrl: null,
      searchQuery,
      source: null,
    };
  } catch (error) {
    console.error(`Error searching photo for ${candidateName}:`, error);
    return {
      photoUrl: null,
      searchQuery,
      source: null,
    };
  }
}

/**
 * Batch search photos for multiple candidates
 */
export async function batchSearchCandidatePhotos(
  candidates: Array<{
    id: number;
    name: string;
    party: string;
    county: string;
  }>
): Promise<Array<{
  candidateId: number;
  candidateName: string;
  photoUrl: string | null;
  searchQuery: string;
  source: string | null;
}>> {
  const results: Array<{
    candidateId: number;
    candidateName: string;
    photoUrl: string | null;
    searchQuery: string;
    source: string | null;
  }> = [];

  for (const candidate of candidates) {
    try {
      const result = await searchCandidatePhoto(
        candidate.name,
        candidate.party,
        candidate.county
      );
      results.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        ...result,
      });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error searching photo for ${candidate.name}:`, error);
      results.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        photoUrl: null,
        searchQuery: `${candidate.name} ${candidate.party} ${candidate.county} 候選人 照片`,
        source: null,
      });
    }
  }

  return results;
}
