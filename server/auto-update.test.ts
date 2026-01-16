/**
 * Auto-Update Service Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the gemini-search module
vi.mock("./gemini-search", () => ({
  TAIWAN_COUNTIES: ["台北市", "新北市", "台中市"],
  TAIWAN_PARTIES: ["中國國民黨", "民主進步黨", "台灣民眾黨", "無黨籍"],
  POSITION_TYPES: {
    mayor: "縣市長",
    councilor: "縣市議員",
  },
  searchNewCandidates: vi.fn().mockResolvedValue([
    {
      name: "測試候選人",
      party: "台灣民眾黨",
      county: "台中市",
      district: "西屯區",
      positionType: "councilor",
      summary: "測試候選人簡介",
    },
  ]),
  searchCandidateNewsWithSources: vi.fn().mockResolvedValue([
    {
      title: "測試新聞標題",
      summary: "測試新聞摘要",
      sourceUrl: "https://example.com/news",
      sourceName: "測試新聞網",
      topic: "政見發表",
    },
  ]),
  searchCandidatePolicies: vi.fn().mockResolvedValue([
    {
      category: "交通建設",
      title: "改善交通",
      content: "測試政見內容",
    },
  ]),
}));

// Mock the db module
vi.mock("./db", () => ({
  getCandidates: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: "測試候選人",
      county: "台中市",
      positionType: "councilor",
    },
  ]),
  getCandidateByNameAndCounty: vi.fn().mockResolvedValue(null),
  createCandidate: vi.fn().mockResolvedValue(1),
  updateCandidate: vi.fn().mockResolvedValue(undefined),
  upsertCandidateNewsByTopic: vi.fn().mockResolvedValue(1),
  getIssueCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "交通建設" },
  ]),
  createPolicy: vi.fn().mockResolvedValue(1),
  logAutoUpdate: vi.fn().mockResolvedValue(undefined),
}));

describe("Auto-Update Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchAndAddCandidates", () => {
    it("should search and add new candidates", async () => {
      const { searchAndAddCandidates } = await import("./auto-update");
      const result = await searchAndAddCandidates("台中市", "councilor");

      expect(result.added).toBe(1);
      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].name).toBe("測試候選人");
      expect(result.candidates[0].party).toBe("台灣民眾黨");
    });

    it("should skip existing candidates", async () => {
      const db = await import("./db");
      vi.mocked(db.getCandidateByNameAndCounty).mockResolvedValueOnce({
        id: 1,
        name: "測試候選人",
        county: "台中市",
      } as any);

      const { searchAndAddCandidates } = await import("./auto-update");
      const result = await searchAndAddCandidates("台中市", "councilor");

      expect(result.added).toBe(0);
      expect(result.candidates).toHaveLength(0);
    });
  });

  describe("updateAllCandidateNews", () => {
    it("should update news for all candidates", async () => {
      const { updateAllCandidateNews } = await import("./auto-update");
      const result = await updateAllCandidateNews();

      expect(result.updated).toBe(1);
      expect(result.details["測試候選人"]).toBe(1);
    });
  });

  describe("updateAllCandidatePolicies", () => {
    it("should update policies for all candidates", async () => {
      const { updateAllCandidatePolicies } = await import("./auto-update");
      const result = await updateAllCandidatePolicies();

      expect(result.updated).toBe(1);
      expect(result.details["測試候選人"]).toBe(1);
    });
  });

  describe("runFullAutoUpdate", () => {
    it("should run full auto-update cycle", async () => {
      const { runFullAutoUpdate } = await import("./auto-update");
      const result = await runFullAutoUpdate({
        counties: ["台中市"],
        positionTypes: ["councilor"],
        skipNews: true,
        skipPolicies: true,
      });

      expect(result.timestamp).toBeInstanceOf(Date);
      expect(result.newCandidatesAdded).toBeGreaterThanOrEqual(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe("Gemini Search Options", () => {
  it("should have correct Taiwan counties", async () => {
    const geminiSearch = await import("./gemini-search");
    expect(geminiSearch.TAIWAN_COUNTIES).toContain("台北市");
    expect(geminiSearch.TAIWAN_COUNTIES).toContain("台中市");
  });

  it("should have correct party options", async () => {
    const geminiSearch = await import("./gemini-search");
    expect(geminiSearch.TAIWAN_PARTIES).toContain("中國國民黨");
    expect(geminiSearch.TAIWAN_PARTIES).toContain("民主進步黨");
    expect(geminiSearch.TAIWAN_PARTIES).toContain("台灣民眾黨");
    expect(geminiSearch.TAIWAN_PARTIES).toContain("無黨籍");
  });

  it("should have correct position types", async () => {
    const geminiSearch = await import("./gemini-search");
    expect(geminiSearch.POSITION_TYPES.mayor).toBe("縣市長");
    expect(geminiSearch.POSITION_TYPES.councilor).toBe("縣市議員");
  });
});
