import { describe, it, expect } from "vitest";

describe("Google OAuth Configuration", () => {
  it("should have GOOGLE_CLIENT_ID configured", () => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    expect(clientId).toBeDefined();
    expect(clientId).not.toBe("");
    expect(clientId).toContain(".apps.googleusercontent.com");
  });

  it("should have GOOGLE_CLIENT_SECRET configured", () => {
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    expect(clientSecret).toBeDefined();
    expect(clientSecret).not.toBe("");
    expect(clientSecret?.startsWith("GOCSPX-")).toBe(true);
  });
});
