import { drizzle } from "drizzle-orm/mysql2";
import { candidates } from "../drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

// 2026 九合一選舉已宣布參選候選人資料（依職位排序：縣市長優先）
const candidatesData = [
  // === 縣市長 (Mayor) - 六都 ===
  {
    name: "蔣萬安",
    party: "中國國民黨",
    positionType: "mayor",
    county: "台北市",
    isIncumbent: true,
    bio: "現任台北市長，依據地方制度法第55條第1項，直轄市長連選得連任一屆。自今年元旦後積極布局，不僅到偏綠的大同區辦座談，還從中山區開始舉辦「市長與里長有約」，試圖拉近和里長們的距離。",
  },
  {
    name: "蘇巧慧",
    party: "民主進步黨",
    positionType: "mayor",
    county: "新北市",
    isIncumbent: false,
    bio: "現任新北市第五選舉區立委、民進黨新北市黨部主任委員。民進黨中執會通過徵召參選新北市長，表示會盡120分的努力，接受挑戰，相信更好的新北，將會成就更好的台灣。",
  },
  {
    name: "黃國昌",
    party: "台灣民眾黨",
    positionType: "mayor",
    county: "新北市",
    isIncumbent: false,
    bio: "現任民眾黨主席、全國不分區立委。去年8月便宣布投入新北市長選舉，今年1月11日後援會正式成軍。強調新北市是全國人口最多的城市，需要一位有執行力、有效率、敢承擔的新北市長。",
  },
  {
    name: "張善政",
    party: "中國國民黨",
    positionType: "mayor",
    county: "桃園市",
    isIncumbent: true,
    bio: "現任桃園市長。去年7月26日大罷免中，桃園市六位立委皆成功守住席次，讓連任之路更加明朗。TVBS民調指出，上任三年以來，整體而言61%桃園市民表示滿意。",
  },
  {
    name: "何欣純",
    party: "民主進步黨",
    positionType: "mayor",
    county: "台中市",
    isIncumbent: false,
    bio: "現任台中市第七選舉區立委。民進黨中執會已通過提名參選台中市長，感謝總統賴清德、立委蔡其昌，表示如果能有服務更多市民朋友的機會，會全力以赴。",
  },
  {
    name: "陳亭妃",
    party: "民主進步黨",
    positionType: "mayor",
    county: "台南市",
    isIncumbent: false,
    bio: "現任台南市第三選區立委。民進黨公布2026年台南市長初選民調結果，以60.8557%擊敗對手立委林俊憲，預計1月21日召開中執會正式提名。有望成為府城400年來首位女市長。",
  },
  {
    name: "謝龍介",
    party: "中國國民黨",
    positionType: "mayor",
    county: "台南市",
    isIncumbent: false,
    bio: "現任全國不分區立委。2022年曾參選第四屆台南市長，雖然最終輸給爭取連任的黃偉哲，但也緊咬票數。直言不論民進黨最後派出誰，都將迎來一場不好打的硬仗。",
  },
  {
    name: "賴瑞隆",
    party: "民主進步黨",
    positionType: "mayor",
    county: "高雄市",
    isIncumbent: false,
    bio: "現任高雄市第八選區立委。曾任高雄市新聞局長、海洋局長，連續三屆高票當選立委。強調將推動智慧治理、發揚地方特色，縮短城鄉差距，讓東高雄成繁榮的永續宜居城市。",
  },
  {
    name: "柯志恩",
    party: "中國國民黨",
    positionType: "mayor",
    county: "高雄市",
    isIncumbent: false,
    bio: "現任全國不分區立委。2022年首次參選高雄市長得票率突破40%，外界認為成績斐然、雖敗猶榮。2025年10月正式宣布代表國民黨角逐高雄市長寶座。",
  },

  // === 縣市長 (Mayor) - 其他縣市 ===
  {
    name: "謝國樑",
    party: "中國國民黨",
    positionType: "mayor",
    county: "基隆市",
    isIncumbent: true,
    bio: "現任基隆市長。在2024年10月13日挺過罷免案，去年10月鬆口有意爭取市長連任，希望能再有四年時間，為市民做更多的事。",
  },
  {
    name: "童子瑋",
    party: "民主進步黨",
    positionType: "mayor",
    county: "基隆市",
    isIncumbent: false,
    bio: "基隆市議會議長，是首位民進黨籍基隆議長。民進黨中執會去年12月31日徵召參選基隆市長。出身地方世家，深耕地方相當有實力。",
  },
  {
    name: "高虹安",
    party: "無黨籍",
    positionType: "mayor",
    county: "新竹市",
    isIncumbent: true,
    bio: "現任新竹市長。涉嫌於立委任內詐領助理費，一審遭判七年四個月，市長職位因此停職；但二審出現逆轉，貪污部分改判無罪，復職回歸並全力爭取連任。國民黨已定調禮讓參選。",
  },
  {
    name: "何志勇",
    party: "中國國民黨",
    positionType: "mayor",
    county: "新竹市",
    isIncumbent: false,
    bio: "國民黨前發言人。雖然國民黨已決定禮讓高虹安參選，但仍堅持選到底，稱除非民眾黨承諾2028年總統大選禮讓國民黨，他就立刻退選。",
  },
  {
    name: "鍾東錦",
    party: "中國國民黨",
    positionType: "mayor",
    county: "苗栗縣",
    isIncumbent: true,
    bio: "現任苗栗縣長。2022年因違紀參選遭國民黨開除黨籍，直到去年9月恢復黨籍，國民黨主席鄭麗文也提名競選連任。宣布前民眾黨立委賴香伶將出任副縣長，被認為是為明年大選「藍白合」率先鋪路。",
  },
  {
    name: "陳品安",
    party: "民主進步黨",
    positionType: "mayor",
    county: "苗栗縣",
    isIncumbent: false,
    bio: "現任苗栗縣議員。民進黨中執會已拍板徵召參選。提到苗栗是民進黨在西部地區未曾執政過的縣市，相信有突圍可能，希望透過不一樣的組織方式找到所有認真生活的人。",
  },
  {
    name: "陳素月",
    party: "民主進步黨",
    positionType: "mayor",
    county: "彰化縣",
    isIncumbent: false,
    bio: "現任彰化縣第四選區立法委員。民進黨已確定徵召參選2026年的彰化縣長。表示將全力以赴，認為民進黨內共識很重要，將針對彰化縣發展願景拜會各領域專業人士。",
  },
  {
    name: "許淑華",
    party: "中國國民黨",
    positionType: "mayor",
    county: "南投縣",
    isIncumbent: true,
    bio: "現任南投縣長。施政滿意度高，今年拚連任聲勢持續看旺。被問及綠營對手温世政時，坦言民進黨的人選讓她驚豔，期待和温世政來一場君子之爭。",
  },
  {
    name: "温世政",
    party: "民主進步黨",
    positionType: "mayor",
    county: "南投縣",
    isIncumbent: false,
    bio: "新北市牙醫師公會理事長。曾拿下國考牙醫榜首，有超強學經歷。透露是深藍家庭出身，決定回南投回饋鄉親「打有意義的人生下半場」，提出「顧老、顧少、顧腹肚」政策三箭。",
  },
  {
    name: "張嘉郡",
    party: "中國國民黨",
    positionType: "mayor",
    county: "雲林縣",
    isIncumbent: false,
    bio: "現任全國不分區立委。出身雲林張榮味家族，張家政治實力近年已在雲林形塑難以撼動的政治版圖。展現決心率先提出政策，稱如果當選縣長會推動國中小學童的營養午餐免費。",
  },
  {
    name: "劉建國",
    party: "民主進步黨",
    positionType: "mayor",
    county: "雲林縣",
    isIncumbent: false,
    bio: "現任雲林縣第二選區立委。獲民進黨中執會提名參選2026年雲林縣長選舉。面對張家在雲林縣的龐大勢力，選情艱困，表示不畏懼任何對手，會全力以赴。",
  },
  {
    name: "王美惠",
    party: "民主進步黨",
    positionType: "mayor",
    county: "嘉義市",
    isIncumbent: false,
    bio: "現任嘉義市立委。兩屆立委選舉都拿下過半超高票數，成為不二人選。民進黨中執會已決議由王美惠代表參選嘉義市長，表示這是黨的肯定，是責任，更是一份對嘉義的使命。",
  },
  {
    name: "張啓楷",
    party: "台灣民眾黨",
    positionType: "mayor",
    county: "嘉義市",
    isIncumbent: false,
    bio: "前民眾黨立委。民眾黨提名出線嘉義市長選舉，決定投入地方選戰。",
  },
  {
    name: "蔡易餘",
    party: "民主進步黨",
    positionType: "mayor",
    county: "嘉義縣",
    isIncumbent: false,
    bio: "現任嘉義縣第一選舉區立委。自2016年蟬聯三屆立委至今，更曾擔任立法院民進黨團書記長。民進黨公布初選民調，以26個百分點的差距壓倒性獲勝，將接棒現任縣長翁章梁參選。",
  },
  {
    name: "周春米",
    party: "民主進步黨",
    positionType: "mayor",
    county: "屏東縣",
    isIncumbent: true,
    bio: "現任屏東縣長。民進黨在屏東縣執政逾20年，2022年綠營初選競爭激烈，最終由周春米出線。經過三年經營，決定於2026年縣長選舉力拚連任。",
  },
  {
    name: "蘇清泉",
    party: "中國國民黨",
    positionType: "mayor",
    county: "屏東縣",
    isIncumbent: false,
    bio: "現任全國不分區立委。國民黨中常會通過代表國民黨參選屏東縣長。回應「屏東縣到了該改變的時候了」，深知縣政有許多進步的空間，接受徵召將勤跑基層。",
  },
  {
    name: "林國璋",
    party: "民主進步黨",
    positionType: "mayor",
    county: "宜蘭縣",
    isIncumbent: false,
    bio: "律師，土生土長宜蘭人。受民進黨徵召參選。表示宜蘭正站在關鍵的轉捩點，面對產業升級、交通建設、社會照顧及世代傳承等重要課題。承諾若當選會讓公務人員知道什麼是依法行政。",
  },
  {
    name: "吳秀華",
    party: "中國國民黨",
    positionType: "mayor",
    county: "台東縣",
    isIncumbent: false,
    bio: "現任台東縣議會議長、國民黨台東縣黨部主委。國民黨已徵召代表參選2026年台東縣長。表示長期站在基層，很清楚台東人真正需要的是什麼，也知道台東下一步該往哪裡走。",
  },
  {
    name: "陳瑩",
    party: "民主進步黨",
    positionType: "mayor",
    county: "台東縣",
    isIncumbent: false,
    bio: "現任平地原住民選舉區立委。民進黨中執會通過提名參選台東縣長。坦言過去台東選情對綠營而言確實一直難以看好，但相信自己的參選一定可為民進黨帶來一道曙光。",
  },
  {
    name: "陳光復",
    party: "民主進步黨",
    positionType: "mayor",
    county: "澎湖縣",
    isIncumbent: true,
    bio: "現任澎湖縣長。2022年經民進黨徵召參選澎湖縣長，入主縣府後著重社會福利政策。總統賴清德去年到澎湖參香時，責成交通部長協助解決機位一票難求的民怨，外界分析此舉也是替陳光復拚連任。",
  },
  {
    name: "葉竹林",
    party: "無黨籍",
    positionType: "mayor",
    county: "澎湖縣",
    isIncumbent: false,
    bio: "曾任兩屆馬公市長。2022年參選澎湖縣長未能當選，但沒有退出地方舞台，持續耕耘基層。雖以無黨籍身分參選，但不排除和藍白在野合作。",
  },
  {
    name: "陳盡川",
    party: "無黨籍",
    positionType: "mayor",
    county: "澎湖縣",
    isIncumbent: false,
    bio: "海洋保育志工。在澎湖地方上以「敢言」、「行動派」作風聞名，長期參與取締非法捕魚和維護海洋生態等公共議題。宣布參選被外界解讀是期望藉選舉平台推廣生態保育理念。",
  },
];

async function seedCandidates() {
  console.log("開始匯入候選人資料...");
  
  for (const candidate of candidatesData) {
    try {
      await db.insert(candidates).values(candidate);
      console.log(`✓ 已匯入: ${candidate.name} (${candidate.county} ${candidate.positionType})`);
    } catch (error) {
      console.error(`✗ 匯入失敗: ${candidate.name}`, error.message);
    }
  }
  
  console.log(`\n匯入完成！共 ${candidatesData.length} 筆候選人資料`);
  process.exit(0);
}

seedCandidates();
