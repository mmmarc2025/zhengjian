import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("candidate.list", () => {
  it("returns an array of candidates for public users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidate.list({ limit: 10 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("supports filtering by county", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidate.list({ 
      county: "台北市",
      limit: 10 
    });

    expect(Array.isArray(result)).toBe(true);
    // All returned candidates should be from 台北市
    result.forEach(candidate => {
      expect(candidate.county).toBe("台北市");
    });
  });

  it("supports filtering by position type", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.candidate.list({ 
      positionType: "mayor",
      limit: 10 
    });

    expect(Array.isArray(result)).toBe(true);
    result.forEach(candidate => {
      expect(candidate.positionType).toBe("mayor");
    });
  });
});

describe("candidate.create", () => {
  it("allows admin to create a candidate", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newCandidate = {
      name: "測試候選人",
      party: "中國國民黨",
      positionType: "mayor" as const,
      county: "台北市",
      district: "第一選區",
      isIncumbent: false,
    };

    const result = await caller.candidate.create(newCandidate);

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("number");
  });

  it("rejects candidate creation from non-admin users", async () => {
    const ctx = createUserContext();
    const caller = appRouter.createCaller(ctx);

    const newCandidate = {
      name: "非法候選人",
      party: "民主進步黨",
      positionType: "mayor" as const,
      county: "新北市",
    };

    await expect(caller.candidate.create(newCandidate)).rejects.toThrow();
  });

  it("rejects candidate creation from unauthenticated users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const newCandidate = {
      name: "匿名候選人",
      positionType: "councilor" as const,
      county: "台中市",
    };

    await expect(caller.candidate.create(newCandidate)).rejects.toThrow();
  });
});

describe("candidate.getById", () => {
  it("throws error for non-existent candidate", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.candidate.getById({ id: 999999 })).rejects.toThrow("Candidate not found");
  });
});

describe("stats.get", () => {
  it("returns statistics object", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stats.get();

    expect(result).toBeDefined();
    expect(typeof result.totalCandidates).toBe("number");
    expect(typeof result.totalPolicies).toBe("number");
    expect(typeof result.totalComments).toBe("number");
    expect(result.totalCandidates).toBeGreaterThanOrEqual(0);
    expect(result.totalPolicies).toBeGreaterThanOrEqual(0);
    expect(result.totalComments).toBeGreaterThanOrEqual(0);
  });
});

describe("candidate.compare", () => {
  it("returns comparison data for valid candidate ids", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First create some candidates as admin
    const adminCtx = createAdminContext();
    const adminCaller = appRouter.createCaller(adminCtx);

    const candidate1 = await adminCaller.candidate.create({
      name: "比較候選人A",
      positionType: "mayor",
      county: "高雄市",
    });

    const candidate2 = await adminCaller.candidate.create({
      name: "比較候選人B",
      positionType: "mayor",
      county: "高雄市",
    });

    const result = await caller.candidate.compare({ 
      ids: [candidate1.id, candidate2.id] 
    });

    expect(result).toBeDefined();
    expect(result.candidates).toBeDefined();
    expect(Array.isArray(result.candidates)).toBe(true);
    expect(result.policiesMap).toBeDefined();
  });
});
