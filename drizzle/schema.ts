import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Position types for the nine-in-one elections
 */
export const positionTypeEnum = mysqlEnum("positionType", [
  "mayor",           // 縣市長
  "councilor",       // 縣市議員
  "township_mayor",  // 鄉鎮市長
  "representative",  // 鄉鎮市民代表
  "village_chief",   // 村里長
]);

/**
 * Candidates table - stores all candidate information
 */
export const candidates = mysqlTable("candidates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  photoUrl: text("photoUrl"),
  party: varchar("party", { length: 50 }),
  positionType: positionTypeEnum.notNull(),
  county: varchar("county", { length: 20 }).notNull(),
  district: varchar("district", { length: 50 }),
  constituency: varchar("constituency", { length: 100 }),
  age: int("age"),
  education: text("education"),
  experience: text("experience"),
  contact: text("contact"),
  website: text("website"),
  socialMedia: json("socialMedia").$type<{
    facebook?: string;
    instagram?: string;
    youtube?: string;
    line?: string;
  }>(),
  bio: text("bio"),
  isIncumbent: boolean("isIncumbent").default(false),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = typeof candidates.$inferInsert;

/**
 * Issue categories for policy classification
 */
export const issueCategories = mysqlTable("issue_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type IssueCategory = typeof issueCategories.$inferSelect;
export type InsertIssueCategory = typeof issueCategories.$inferInsert;

/**
 * Policies/Platforms - candidate policy positions
 */
export const policies = mysqlTable("policies", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId").notNull(),
  categoryId: int("categoryId"),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  source: text("source"),
  isHighlight: boolean("isHighlight").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = typeof policies.$inferInsert;

/**
 * News/Updates - latest candidate statements and election news
 */
export const news = mysqlTable("news", {
  id: int("id").autoincrement().primaryKey(),
  candidateId: int("candidateId"),
  title: varchar("title", { length: 300 }).notNull(),
  summary: text("summary"),
  content: text("content"),
  imageUrl: text("imageUrl"),
  sourceUrl: text("sourceUrl"),
  sourceName: varchar("sourceName", { length: 100 }),
  publishedAt: timestamp("publishedAt").defaultNow().notNull(),
  isPublished: boolean("isPublished").default(true).notNull(),
  isPinned: boolean("isPinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type News = typeof news.$inferSelect;
export type InsertNews = typeof news.$inferInsert;

/**
 * Comments - public discussion on candidates/policies
 */
export const comments = mysqlTable("comments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  candidateId: int("candidateId"),
  policyId: int("policyId"),
  newsId: int("newsId"),
  parentId: int("parentId"),
  content: text("content").notNull(),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "hidden"]).default("approved").notNull(),
  likesCount: int("likesCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

/**
 * Comment likes - track user likes on comments
 */
export const commentLikes = mysqlTable("comment_likes", {
  id: int("id").autoincrement().primaryKey(),
  commentId: int("commentId").notNull(),
  userId: int("userId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CommentLike = typeof commentLikes.$inferSelect;
export type InsertCommentLike = typeof commentLikes.$inferInsert;
