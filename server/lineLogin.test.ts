import { describe, it, expect } from "vitest";

describe("LINE Login Configuration", () => {
  it("should have LINE_CHANNEL_ID configured", () => {
    const channelId = process.env.LINE_CHANNEL_ID;
    expect(channelId).toBeDefined();
    expect(channelId).not.toBe("");
    expect(channelId).toBe("2008905096");
  });

  it("should have LINE_CHANNEL_SECRET configured", () => {
    const channelSecret = process.env.LINE_CHANNEL_SECRET;
    expect(channelSecret).toBeDefined();
    expect(channelSecret).not.toBe("");
    // Channel secret should be 32 characters
    expect(channelSecret?.length).toBe(32);
  });
});
