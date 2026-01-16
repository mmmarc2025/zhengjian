const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_SEARCH_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

async function callGeminiWithSearch(prompt) {
  console.log('API Key exists:', !!GEMINI_API_KEY);
  console.log('Prompt:', prompt);
  
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
    console.error('API Error:', error);
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  console.log('Full response:', JSON.stringify(data, null, 2));
  return data;
}

async function main() {
  const prompt = `請搜尋 2026 台灣九合一地方選舉 台中市 縣市議員 的最新參選人。
列出已經正式宣布參選的候選人，包含姓名、政黨、選區。`;
  
  try {
    await callGeminiWithSearch(prompt);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
