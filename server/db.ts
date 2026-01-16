import { eq, and, like, or, desc, asc, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  candidates, InsertCandidate, Candidate,
  policies, InsertPolicy, Policy,
  news, InsertNews, News,
  comments, InsertComment, Comment,
  commentLikes, InsertCommentLike,
  issueCategories, InsertIssueCategory, IssueCategory
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ User Functions ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ Candidate Functions ============
export async function getCandidates(filters?: {
  county?: string;
  party?: string;
  positionType?: string;
  search?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters?.county) {
    conditions.push(eq(candidates.county, filters.county));
  }
  if (filters?.party) {
    conditions.push(eq(candidates.party, filters.party));
  }
  if (filters?.positionType) {
    conditions.push(eq(candidates.positionType, filters.positionType as any));
  }
  if (filters?.search) {
    conditions.push(
      or(
        like(candidates.name, `%${filters.search}%`),
        like(candidates.district, `%${filters.search}%`)
      )
    );
  }
  if (filters?.isActive !== undefined) {
    conditions.push(eq(candidates.isActive, filters.isActive));
  }

  let query = db.select().from(candidates);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  // Order by position type priority: mayor > councilor > township_mayor > representative > village_chief
  query = query.orderBy(
    sql`FIELD(${candidates.positionType}, 'mayor', 'councilor', 'township_mayor', 'representative', 'village_chief')`,
    asc(candidates.county),
    asc(candidates.name)
  ) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return query;
}

export async function getCandidateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(candidates).where(eq(candidates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCandidate(data: InsertCandidate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(candidates).values(data);
  return result[0].insertId;
}

export async function updateCandidate(id: number, data: Partial<InsertCandidate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(candidates).set(data).where(eq(candidates.id, id));
}

export async function deleteCandidate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(candidates).where(eq(candidates.id, id));
}

export async function getCandidatesForComparison(ids: number[]) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(candidates).where(inArray(candidates.id, ids));
}

// ============ Policy Functions ============
export async function getPoliciesByCandidateId(candidateId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(policies).where(eq(policies.candidateId, candidateId)).orderBy(desc(policies.isHighlight), desc(policies.createdAt));
}

export async function getPoliciesByCategory(categoryId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(policies).where(eq(policies.categoryId, categoryId));
}

export async function searchPolicies(search: string, categoryId?: number) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [
    or(
      like(policies.title, `%${search}%`),
      like(policies.content, `%${search}%`)
    )
  ];
  
  if (categoryId) {
    conditions.push(eq(policies.categoryId, categoryId));
  }

  return db.select().from(policies).where(and(...conditions));
}

export async function createPolicy(data: InsertPolicy) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(policies).values(data);
  return result[0].insertId;
}

export async function updatePolicy(id: number, data: Partial<InsertPolicy>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(policies).set(data).where(eq(policies.id, id));
}

export async function deletePolicy(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(policies).where(eq(policies.id, id));
}

// ============ News Functions ============
export async function getNews(filters?: {
  candidateId?: number;
  isPublished?: boolean;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters?.candidateId) {
    conditions.push(eq(news.candidateId, filters.candidateId));
  }
  if (filters?.isPublished !== undefined) {
    conditions.push(eq(news.isPublished, filters.isPublished));
  }

  let query = db.select().from(news);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(news.isPinned), desc(news.publishedAt)) as any;
  
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }

  return query;
}

export async function getNewsById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(news).where(eq(news.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createNews(data: InsertNews) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(news).values(data);
  return result[0].insertId;
}

export async function updateNews(id: number, data: Partial<InsertNews>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(news).set(data).where(eq(news.id, id));
}

export async function deleteNews(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(news).where(eq(news.id, id));
}

// ============ Comment Functions ============
export async function getComments(filters: {
  candidateId?: number;
  policyId?: number;
  newsId?: number;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  
  if (filters.candidateId) {
    conditions.push(eq(comments.candidateId, filters.candidateId));
  }
  if (filters.policyId) {
    conditions.push(eq(comments.policyId, filters.policyId));
  }
  if (filters.newsId) {
    conditions.push(eq(comments.newsId, filters.newsId));
  }
  if (filters.status) {
    conditions.push(eq(comments.status, filters.status as any));
  }

  let query = db.select({
    comment: comments,
    user: {
      id: users.id,
      name: users.name,
    }
  }).from(comments).leftJoin(users, eq(comments.userId, users.id));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  query = query.orderBy(desc(comments.createdAt)) as any;
  
  if (filters.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters.offset) {
    query = query.offset(filters.offset) as any;
  }

  return query;
}

export async function createComment(data: InsertComment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(comments).values(data);
  return result[0].insertId;
}

export async function updateCommentStatus(id: number, status: "pending" | "approved" | "rejected" | "hidden") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(comments).set({ status }).where(eq(comments.id, id));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(comments).where(eq(comments.id, id));
}

// ============ Issue Category Functions ============
export async function getIssueCategories() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(issueCategories).orderBy(asc(issueCategories.sortOrder));
}

export async function createIssueCategory(data: InsertIssueCategory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(issueCategories).values(data);
  return result[0].insertId;
}

// ============ Statistics Functions ============
export async function getStatistics() {
  const db = await getDb();
  if (!db) return { totalCandidates: 0, totalPolicies: 0, totalComments: 0 };

  const [candidateCount] = await db.select({ count: sql<number>`count(*)` }).from(candidates).where(eq(candidates.isActive, true));
  const [policyCount] = await db.select({ count: sql<number>`count(*)` }).from(policies);
  const [commentCount] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.status, "approved"));

  return {
    totalCandidates: candidateCount?.count || 0,
    totalPolicies: policyCount?.count || 0,
    totalComments: commentCount?.count || 0,
  };
}

// ============ Seed Data Functions ============
export async function seedIssueCategories() {
  const db = await getDb();
  if (!db) return;

  const categories = [
    { name: "交通建設", slug: "transportation", icon: "Car", sortOrder: 1 },
    { name: "教育文化", slug: "education", icon: "GraduationCap", sortOrder: 2 },
    { name: "經濟發展", slug: "economy", icon: "TrendingUp", sortOrder: 3 },
    { name: "社會福利", slug: "welfare", icon: "Heart", sortOrder: 4 },
    { name: "環境保護", slug: "environment", icon: "Leaf", sortOrder: 5 },
    { name: "都市規劃", slug: "urban", icon: "Building", sortOrder: 6 },
    { name: "醫療衛生", slug: "healthcare", icon: "Stethoscope", sortOrder: 7 },
    { name: "治安司法", slug: "security", icon: "Shield", sortOrder: 8 },
  ];

  for (const cat of categories) {
    try {
      await db.insert(issueCategories).values(cat).onDuplicateKeyUpdate({ set: { name: cat.name } });
    } catch (e) {
      // Ignore duplicate errors
    }
  }
}
