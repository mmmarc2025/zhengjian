import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function isProductionHost(req: Request): boolean {
  const host = req.get("host") || req.hostname || "";
  return host.includes("political.now") || host.includes(".run.app") || host.includes(".manus.");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const isProduction = isProductionHost(req);
  
  // 在正式環境中，強制使用 secure: true
  // 因為 Manus 代理可能不正確傳遞 x-forwarded-proto
  const secure = isProduction ? true : isSecureRequest(req);
  
  // 設定 domain 以確保 cookie 在正確的 domain 上生效
  let domain: string | undefined = undefined;
  if (hostname && hostname.includes("political.now")) {
    domain = ".political.now";
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: secure,
    domain: domain,
  };
}
