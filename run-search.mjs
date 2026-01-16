import { searchNewCandidates } from './server/gemini-search.ts';

async function main() {
  console.log('搜尋台中市西屯區議員候選人...');
  try {
    const candidates = await searchNewCandidates('台中市', 'councilor');
    console.log('找到候選人:', JSON.stringify(candidates, null, 2));
  } catch (error) {
    console.error('搜尋失敗:', error);
  }
}

main();
