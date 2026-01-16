export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // LINE OAuth - 直接使用硬編碼憑證（繞過 Manus 系統環境變數）
  lineChannelId: "2008905096",
  lineChannelSecret: "6307397ba05cbfe045fdac532abe6290",
  // Google OAuth - 直接使用硬編碼憑證（繞過 Manus 系統環境變數）
  googleClientId: "878681000682-1f8bhpgssr78ihmgog3d99s8l870kk8g.apps.googleusercontent.com",
  googleClientSecret: "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",
};
