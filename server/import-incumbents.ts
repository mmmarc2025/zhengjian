/**
 * Import Incumbents Service
 * 匯入現任縣市長和議員資料
 */

import * as db from "./db";
import { callGeminiWithSearch, TAIWAN_COUNTIES } from "./gemini-search";

// 匯入狀態
interface ImportStatus {
  isRunning: boolean;
  progress: number;
  currentStep: string;
  candidatesImported: number;
  errors: string[];
  startTime?: number;
  elapsedTime?: number;
}

let importStatus: ImportStatus = {
  isRunning: false,
  progress: 0,
  currentStep: "",
  candidatesImported: 0,
  errors: [],
};

// 縣市列表
const COUNTIES = [
  "台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市",
  "基隆市", "新竹市", "新竹縣", "苗栗縣", "彰化縣", "南投縣",
  "雲林縣", "嘉義市", "嘉義縣", "屏東縣", "宜蘭縣", "花蓮縣",
  "台東縣", "澎湖縣", "金門縣", "連江縣"
];

// 政黨對應
const PARTY_MAP: Record<string, string> = {
  "國民黨": "中國國民黨",
  "民進黨": "民主進步黨",
  "民眾黨": "台灣民眾黨",
  "時代力量": "時代力量",
  "台灣基進": "台灣基進",
  "無黨籍": "無黨籍",
  "無黨": "無黨籍",
  "獨立": "無黨籍",
};

function normalizeParty(party: string): string {
  for (const [key, value] of Object.entries(PARTY_MAP)) {
    if (party.includes(key)) {
      return value;
    }
  }
  return party || "無黨籍";
}

export function getImportStatus(): ImportStatus {
  if (importStatus.startTime && importStatus.isRunning) {
    importStatus.elapsedTime = Math.floor((Date.now() - importStatus.startTime) / 1000);
  }
  return { ...importStatus };
}

export async function startImport(options: {
  includeMayors: boolean;
  includeCouncilors: boolean;
}): Promise<void> {
  if (importStatus.isRunning) {
    throw new Error("匯入已在執行中");
  }

  // 重置狀態
  importStatus = {
    isRunning: true,
    progress: 0,
    currentStep: "初始化...",
    candidatesImported: 0,
    errors: [],
    startTime: Date.now(),
  };

  try {
    const totalSteps = (options.includeMayors ? 1 : 0) + (options.includeCouncilors ? COUNTIES.length : 0);
    let completedSteps = 0;

    // 匯入縣市長
    if (options.includeMayors) {
      importStatus.currentStep = "匯入縣市長...";
      await importMayors();
      completedSteps++;
      importStatus.progress = Math.floor((completedSteps / totalSteps) * 100);
    }

    // 匯入議員
    if (options.includeCouncilors) {
      for (const county of COUNTIES) {
        importStatus.currentStep = `匯入 ${county} 議員...`;
        await importCouncilors(county);
        completedSteps++;
        importStatus.progress = Math.floor((completedSteps / totalSteps) * 100);
        
        // 每個縣市間隔 2 秒，避免 API 限制
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    importStatus.currentStep = "匯入完成";
    importStatus.progress = 100;
  } catch (error) {
    importStatus.errors.push(error instanceof Error ? error.message : String(error));
    importStatus.currentStep = "匯入失敗";
  } finally {
    importStatus.isRunning = false;
    importStatus.elapsedTime = Math.floor((Date.now() - (importStatus.startTime || Date.now())) / 1000);
  }
}

async function importMayors(): Promise<void> {
  const prompt = `請搜尋台灣 22 個縣市的現任縣市長名單（2022年當選，任期至2026年）。

請以 JSON 格式回傳，格式如下：
{
  "mayors": [
    {
      "name": "縣市長姓名",
      "county": "縣市名稱",
      "party": "政黨名稱"
    }
  ]
}

請確保：
1. 包含所有 22 個縣市（六都：台北市、新北市、桃園市、台中市、台南市、高雄市；其他縣市：基隆市、新竹市、新竹縣、苗栗縣、彰化縣、南投縣、雲林縣、嘉義市、嘉義縣、屏東縣、宜蘭縣、花蓮縣、台東縣、澎湖縣、金門縣、連江縣）
2. 資料為 2022 年九合一選舉當選的現任縣市長
3. 政黨名稱使用全稱（如：中國國民黨、民主進步黨、台灣民眾黨、無黨籍）`;

  try {
    const result = await callGeminiWithSearch(prompt);
    const text = result.text || "";
    
    // 解析 JSON
    const jsonMatch = text.match(/\{[\s\S]*"mayors"[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[ImportIncumbents] No JSON found in mayors response");
      importStatus.errors.push("無法解析縣市長資料");
      return;
    }

    const data = JSON.parse(jsonMatch[0]);
    const mayors = data.mayors || [];

    for (const mayor of mayors) {
      try {
        // 檢查是否已存在
        const existing = await db.getCandidateByNameAndCounty(mayor.name, mayor.county);
        if (existing) {
          console.log(`[ImportIncumbents] Mayor ${mayor.name} already exists`);
          continue;
        }

        // 新增候選人
        await db.createCandidate({
          name: mayor.name,
          party: normalizeParty(mayor.party),
          county: mayor.county,
          district: "",
          positionType: "mayor",
          isIncumbent: true,
          photoUrl: null,
          bio: null,
        });
        
        importStatus.candidatesImported++;
        console.log(`[ImportIncumbents] Added mayor: ${mayor.name} (${mayor.county})`);
      } catch (error) {
        console.error(`[ImportIncumbents] Error adding mayor ${mayor.name}:`, error);
        importStatus.errors.push(`新增 ${mayor.name} 失敗`);
      }
    }
  } catch (error) {
    console.error("[ImportIncumbents] Error importing mayors:", error);
    importStatus.errors.push("匯入縣市長失敗");
  }
}

async function importCouncilors(county: string): Promise<void> {
  const prompt = `請搜尋台灣 ${county} 的現任縣市議員名單（2022年當選，任期至2026年）。

請以 JSON 格式回傳，格式如下：
{
  "councilors": [
    {
      "name": "議員姓名",
      "party": "政黨名稱",
      "district": "選區"
    }
  ]
}

請確保：
1. 包含 ${county} 所有現任議員
2. 資料為 2022 年九合一選舉當選的現任議員
3. 政黨名稱使用全稱（如：中國國民黨、民主進步黨、台灣民眾黨、時代力量、台灣基進、無黨籍）
4. 選區請填寫實際選區名稱（如：第一選區、第二選區等）`;

  try {
    const result = await callGeminiWithSearch(prompt);
    const text = result.text || "";
    
    // 解析 JSON
    const jsonMatch = text.match(/\{[\s\S]*"councilors"[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[ImportIncumbents] No JSON found in ${county} councilors response`);
      importStatus.errors.push(`無法解析 ${county} 議員資料`);
      return;
    }

    const data = JSON.parse(jsonMatch[0]);
    const councilors = data.councilors || [];

    for (const councilor of councilors) {
      try {
        // 檢查是否已存在
        const existing = await db.getCandidateByNameAndCounty(councilor.name, county);
        if (existing) {
          console.log(`[ImportIncumbents] Councilor ${councilor.name} already exists`);
          continue;
        }

        // 新增候選人
        await db.createCandidate({
          name: councilor.name,
          party: normalizeParty(councilor.party),
          county: county,
          district: councilor.district || "",
          positionType: "councilor",
          isIncumbent: true,
          photoUrl: null,
          bio: null,
        });
        
        importStatus.candidatesImported++;
        console.log(`[ImportIncumbents] Added councilor: ${councilor.name} (${county})`);
      } catch (error) {
        console.error(`[ImportIncumbents] Error adding councilor ${councilor.name}:`, error);
        importStatus.errors.push(`新增 ${councilor.name} 失敗`);
      }
    }
  } catch (error) {
    console.error(`[ImportIncumbents] Error importing ${county} councilors:`, error);
    importStatus.errors.push(`匯入 ${county} 議員失敗`);
  }
}
