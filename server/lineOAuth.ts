import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

// LINE OAuth 2.0 設定
const LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// 生成 LINE 登入 URL
export function getLineAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.lineChannelId,
    redirect_uri: redirectUri,
    state: state,
    scope: "profile openid email",
  });
  return `${LINE_AUTH_URL}?${params.toString()}`;
}

// 用授權碼換取 access token
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  token_type: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}> {
  const response = await fetch(LINE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUri,
      client_id: ENV.lineChannelId,
      client_secret: ENV.lineChannelSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[LINE OAuth] Token exchange failed:", error);
    throw new Error(`LINE token exchange failed: ${error}`);
  }

  return response.json();
}

// 取得 LINE 用戶資料
async function getLineProfile(accessToken: string): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}> {
  const response = await fetch(LINE_PROFILE_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[LINE OAuth] Profile fetch failed:", error);
    throw new Error(`LINE profile fetch failed: ${error}`);
  }

  return response.json();
}

export function registerLineOAuthRoutes(app: Express) {
  // LINE 登入起始點
  app.get("/api/auth/line", (req: Request, res: Response) => {
    // 使用固定的 political.now domain，而不是依賴 request.get_host()
    const redirectUri = `https://political.now/api/auth/line/callback`;
    const state = Buffer.from(JSON.stringify({ 
      returnUrl: getQueryParam(req, "returnUrl") || "/",
      timestamp: Date.now() 
    })).toString("base64");
    
    const authUrl = getLineAuthUrl(redirectUri, state);
    console.log("[LINE OAuth] Redirecting to:", authUrl);
    res.redirect(302, authUrl);
  });

  // LINE OAuth callback
  app.get("/api/auth/line/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    if (error) {
      console.error("[LINE OAuth] Auth error:", error, errorDescription);
      res.redirect(302, `/login?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // 使用固定的 political.now domain
      const redirectUri = `https://political.now/api/auth/line/callback`;
      
      // 換取 access token
      const tokenData = await exchangeCodeForToken(code, redirectUri);
      console.log("[LINE OAuth] Token obtained successfully");
      
      // 取得用戶資料
      const profile = await getLineProfile(tokenData.access_token);
      console.log("[LINE OAuth] Profile obtained:", profile.displayName);

      // 建立或更新用戶
      const openId = `line_${profile.userId}`;
      await db.upsertUser({
        openId: openId,
        name: profile.displayName,
        email: null, // LINE 基本 profile 不包含 email
        loginMethod: "line",
        lastSignedIn: new Date(),
      });

      // 建立 session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.displayName,
        expiresInMs: ONE_YEAR_MS,
      });

      // 設定 cookie
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // 解析 state 取得返回 URL
      let returnUrl = "/";
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, "base64").toString());
          returnUrl = stateData.returnUrl || "/";
        } catch (e) {
          console.warn("[LINE OAuth] Failed to parse state:", e);
        }
      }

      console.log("[LINE OAuth] Login successful, redirecting to:", returnUrl);
      res.redirect(302, returnUrl);
    } catch (error) {
      console.error("[LINE OAuth] Callback failed:", error);
      res.redirect(302, `/login?error=${encodeURIComponent("LINE 登入失敗，請稍後再試")}`);
    }
  });

}
