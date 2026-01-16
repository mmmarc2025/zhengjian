// Taiwan Counties/Cities (22 total)
export const COUNTIES = [
  // 六都 (6 Special Municipalities)
  { id: "taipei", name: "台北市", type: "municipality" },
  { id: "new_taipei", name: "新北市", type: "municipality" },
  { id: "taoyuan", name: "桃園市", type: "municipality" },
  { id: "taichung", name: "台中市", type: "municipality" },
  { id: "tainan", name: "台南市", type: "municipality" },
  { id: "kaohsiung", name: "高雄市", type: "municipality" },
  // 縣市 (16 Counties/Cities)
  { id: "keelung", name: "基隆市", type: "city" },
  { id: "hsinchu_city", name: "新竹市", type: "city" },
  { id: "hsinchu_county", name: "新竹縣", type: "county" },
  { id: "miaoli", name: "苗栗縣", type: "county" },
  { id: "changhua", name: "彰化縣", type: "county" },
  { id: "nantou", name: "南投縣", type: "county" },
  { id: "yunlin", name: "雲林縣", type: "county" },
  { id: "chiayi_city", name: "嘉義市", type: "city" },
  { id: "chiayi_county", name: "嘉義縣", type: "county" },
  { id: "pingtung", name: "屏東縣", type: "county" },
  { id: "yilan", name: "宜蘭縣", type: "county" },
  { id: "hualien", name: "花蓮縣", type: "county" },
  { id: "taitung", name: "台東縣", type: "county" },
  { id: "penghu", name: "澎湖縣", type: "county" },
  { id: "kinmen", name: "金門縣", type: "county" },
  { id: "lienchiang", name: "連江縣", type: "county" },
] as const;

// Major Political Parties
export const PARTIES = [
  { id: "kmt", name: "中國國民黨", shortName: "國民黨", color: "#0055A4" },
  { id: "dpp", name: "民主進步黨", shortName: "民進黨", color: "#1B9431" },
  { id: "tpp", name: "台灣民眾黨", shortName: "民眾黨", color: "#28C8C8" },
  { id: "npp", name: "時代力量", shortName: "時力", color: "#FBBE01" },
  { id: "tsp", name: "台灣基進", shortName: "基進", color: "#C8161D" },
  { id: "pfp", name: "親民黨", shortName: "親民黨", color: "#FF6310" },
  { id: "np", name: "新黨", shortName: "新黨", color: "#FFFF00" },
  { id: "independent", name: "無黨籍", shortName: "無黨籍", color: "#808080" },
] as const;

// Position Types (九合一選舉)
export const POSITION_TYPES = [
  { id: "mayor", name: "縣市長", description: "直轄市長、縣市長" },
  { id: "councilor", name: "縣市議員", description: "直轄市議員、縣市議員" },
  { id: "township_mayor", name: "鄉鎮市長", description: "鄉長、鎮長、縣轄市長" },
  { id: "representative", name: "鄉鎮市民代表", description: "鄉民代表、鎮民代表、市民代表" },
  { id: "village_chief", name: "村里長", description: "村長、里長" },
] as const;

// Issue Categories
export const ISSUE_CATEGORIES = [
  { id: "transportation", name: "交通建設", icon: "Car" },
  { id: "education", name: "教育文化", icon: "GraduationCap" },
  { id: "economy", name: "經濟發展", icon: "TrendingUp" },
  { id: "welfare", name: "社會福利", icon: "Heart" },
  { id: "environment", name: "環境保護", icon: "Leaf" },
  { id: "urban", name: "都市規劃", icon: "Building" },
  { id: "healthcare", name: "醫療衛生", icon: "Stethoscope" },
  { id: "security", name: "治安司法", icon: "Shield" },
] as const;

// Helper functions
export function getCountyName(id: string): string {
  return COUNTIES.find(c => c.id === id)?.name || id;
}

export function getPartyInfo(name: string) {
  return PARTIES.find(p => p.name === name || p.shortName === name);
}

export function getPartyColor(name: string): string {
  return getPartyInfo(name)?.color || "#808080";
}

export function getPositionName(id: string): string {
  return POSITION_TYPES.find(p => p.id === id)?.name || id;
}

export type CountyId = typeof COUNTIES[number]["id"];
export type PartyId = typeof PARTIES[number]["id"];
export type PositionTypeId = typeof POSITION_TYPES[number]["id"];
export type IssueCategoryId = typeof ISSUE_CATEGORIES[number]["id"];
