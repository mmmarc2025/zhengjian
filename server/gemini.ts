/**
 * Gemini API Service Module
 * Provides functions for AI-powered content generation and search
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

/**
 * Call Gemini API with a prompt
 */
export async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data: GeminiResponse = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("No response from Gemini API");
  }

  return text;
}

/**
 * Search for latest news about a candidate
 */
export async function searchCandidateNews(candidateName: string, county: string): Promise<{
  title: string;
  summary: string;
  source: string;
}[]> {
  const prompt = `搜尋關於「${candidateName}」（${county}）的最新選舉新聞。
請以 JSON 格式回傳最多 3 則新聞，格式如下：
[
  {
    "title": "新聞標題",
    "summary": "新聞摘要（約 100 字）",
    "source": "新聞來源"
  }
]
只回傳 JSON，不要有其他文字。如果找不到相關新聞，回傳空陣列 []。`;

  try {
    const response = await callGemini(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error searching candidate news:", error);
    return [];
  }
}

/**
 * Generate policy summary for a candidate
 */
export async function generatePolicySummary(candidateName: string, county: string, position: string): Promise<{
  category: string;
  title: string;
  content: string;
}[]> {
  const prompt = `請搜尋「${candidateName}」參選 ${county} ${position} 的政見主張。
請以 JSON 格式回傳主要政見，格式如下：
[
  {
    "category": "政見類別（如：交通建設、教育文化、經濟發展、社會福利、環境保護、都市規劃、醫療衛生、治安司法）",
    "title": "政見標題",
    "content": "政見內容（約 150 字）"
  }
]
只回傳 JSON，不要有其他文字。如果找不到政見資料，回傳空陣列 []。`;

  try {
    const response = await callGemini(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error generating policy summary:", error);
    return [];
  }
}

/**
 * Search for latest election news
 */
export async function searchElectionNews(): Promise<{
  title: string;
  summary: string;
  source: string;
  relatedCandidates: string[];
}[]> {
  const prompt = `搜尋 2026 台灣九合一地方選舉的最新新聞動態。
請以 JSON 格式回傳最多 5 則新聞，格式如下：
[
  {
    "title": "新聞標題",
    "summary": "新聞摘要（約 150 字）",
    "source": "新聞來源",
    "relatedCandidates": ["相關候選人姓名"]
  }
]
只回傳 JSON，不要有其他文字。`;

  try {
    const response = await callGemini(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error searching election news:", error);
    return [];
  }
}

/**
 * Search for latest news about a candidate with topic classification
 * Used for the "Latest News" tab on candidate detail page
 * Returns news with topic to avoid duplicates
 */
export async function searchCandidateLatestNews(candidateName: string, county: string): Promise<{
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  topic: string;
}[]> {
  const prompt = `搜尋關於「${candidateName}」（${county}）的最新選舉相關新聞。
請以 JSON 格式回傳最多 3 則最新新聞，格式如下：
[
  {
    "title": "新聞標題",
    "summary": "新聞摘要（約 100-150 字，包含重點內容）",
    "source": "新聞來源（如：聯合報、自由時報、中時新聞網等）",
    "sourceUrl": "新聞連結（如果有的話）",
    "topic": "新聞主題分類（如：政見發表、選情分析、民調、造勢活動、政策辯論、爭議事件等）"
  }
]

注意事項：
1. 每則新聞的 topic 必須是獨特的，不要重複相同主題
2. 優先選擇最新的新聞
3. 只回傳 JSON，不要有其他文字
4. 如果找不到相關新聞，回傳空陣列 []`;

  try {
    const response = await callGemini(prompt);
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error searching candidate latest news:", error);
    return [];
  }
}

/**
 * Search for candidate photo URL suggestion
 */
export async function suggestCandidatePhoto(candidateName: string, party: string): Promise<string | null> {
  const prompt = `請提供「${candidateName}」（${party}）的官方照片或新聞照片的搜尋建議關鍵字。
只回傳一個最佳的搜尋關鍵字，不要有其他文字。`;

  try {
    const response = await callGemini(prompt);
    return response.trim();
  } catch (error) {
    console.error("Error suggesting candidate photo:", error);
    return null;
  }
}
