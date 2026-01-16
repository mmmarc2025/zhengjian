import type { Express, Request, Response } from "express";
import * as db from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";

// Google OAuth 2.0 設定
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

// 生成 Google 登入 URL
export function getGoogleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ENV.googleClientId,
    redirect_uri: redirectUri,
    state: state,
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

// 用授權碼換取 access token
async function exchangeCodeForToken(code: string, redirectUri: string): Promise<{
  access_token: string;
  id_token?: string;
  refresh_token?: string;
}> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: ENV.googleClientId,
      client_secret: ENV.googleClientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Google OAuth] Token exchange failed:", error);
    throw new Error(`Google token exchange failed: ${error}`);
  }

  return response.json();
}

// 取得 Google 用戶資料
async function getGoogleProfile(accessToken: string): Promise<{
  id: string;
  email: string;
  name: string;
  picture?: string;
}> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Google OAuth] Profile fetch failed:", error);
    throw new Error(`Google profile fetch failed: ${error}`);
  }

  return response.json();
}

export function registerGoogleOAuthRoutes(app: Express) {
  // Google 登入起始點
  app.get("/api/auth/google", (req: Request, res: Response) => {
    // 使用固定的 political.now domain，而不是依賴 request.get_host()
    const redirectUri = `https://political.now/api/auth/google/callback`;
    const state = Buffer.from(JSON.stringify({ 
      returnUrl: getQueryParam(req, "returnUrl") || "/",
      timestamp: Date.now() 
    })).toString("base64");
    
    const authUrl = getGoogleAuthUrl(redirectUri, state);
    console.log("[Google OAuth] Redirecting to:", authUrl);
    res.redirect(302, authUrl);
  });

  // Google OAuth callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const error = getQueryParam(req, "error");
    const errorDescription = getQueryParam(req, "error_description");

    if (error) {
      console.error("[Google OAuth] Auth error:", error, errorDescription);
      res.redirect(302, `/login?error=${encodeURIComponent(errorDescription || error)}`);
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      // 使用固定的 political.now domain
      const redirectUri = `https://political.now/api/auth/google/callback`;
      
      // 解析 state 取得 returnUrl
      let returnUrl = "/";
      if (state) {
        try {
          const stateData = JSON.parse(Buffer.from(state, "base64").toString());
          returnUrl = stateData.returnUrl || "/";
        } catch (e) {
          console.error("[Google OAuth] Failed to parse state:", e);
        }
      }

      // 交換 code 取得 token
      const tokenData = await exchangeCodeForToken(code, redirectUri);
      console.log("[Google OAuth] Token received");

      // 取得用戶資料
      const profile = await getGoogleProfile(tokenData.access_token);
      console.log("[Google OAuth] Profile:", profile.email);

      // 使用 Google ID 作為 openId（加上前綴以區分來源）
      const openId = `google_${profile.id}`;

      // 建立或更新用戶
      await db.upsertUser({
        openId,
        name: profile.name,
        email: profile.email,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // 取得用戶資料
      const user = await db.getUserByOpenId(openId);

      if (!user) {
        console.error("[Google OAuth] Failed to get user after upsert");
        res.redirect(302, `/login?error=user_creation_failed`);
        return;
      }

      console.log("[Google OAuth] User logged in:", user.id);

      // 建立 session token
      const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.name,
        expiresInMs: ONE_YEAR_MS,
      });

      // 設定 cookie
      const COOKIE_NAME = "session";
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      console.log("[Google OAuth] Login successful, redirecting to:", returnUrl);
      res.redirect(302, returnUrl);

    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect(302, `/login?error=callback_failed`);
    }
  });
}
