import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ============ Candidate Router ============
const candidateRouter = router({
  list: publicProcedure
    .input(z.object({
      county: z.string().optional(),
      party: z.string().optional(),
      positionType: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return db.getCandidates({
        ...input,
        isActive: true,
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const candidate = await db.getCandidateById(input.id);
      if (!candidate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Candidate not found" });
      }
      return candidate;
    }),

  compare: publicProcedure
    .input(z.object({ ids: z.array(z.number()).min(2).max(4) }))
    .query(async ({ input }) => {
      const candidates = await db.getCandidatesForComparison(input.ids);
      const policiesMap: Record<number, Awaited<ReturnType<typeof db.getPoliciesByCandidateId>>> = {};
      
      for (const c of candidates) {
        policiesMap[c.id] = await db.getPoliciesByCandidateId(c.id);
      }
      
      return { candidates, policiesMap };
    }),

  // Admin operations
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      photoUrl: z.string().optional(),
      party: z.string().optional(),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]),
      county: z.string().min(1),
      district: z.string().optional(),
      constituency: z.string().optional(),
      age: z.number().optional(),
      education: z.string().optional(),
      experience: z.string().optional(),
      contact: z.string().optional(),
      website: z.string().optional(),
      socialMedia: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        line: z.string().optional(),
      }).optional(),
      isIncumbent: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createCandidate(input);
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      photoUrl: z.string().optional(),
      party: z.string().optional(),
      positionType: z.enum(["mayor", "councilor", "township_mayor", "representative", "village_chief"]).optional(),
      county: z.string().optional(),
      district: z.string().optional(),
      constituency: z.string().optional(),
      age: z.number().optional(),
      education: z.string().optional(),
      experience: z.string().optional(),
      contact: z.string().optional(),
      website: z.string().optional(),
      socialMedia: z.object({
        facebook: z.string().optional(),
        instagram: z.string().optional(),
        youtube: z.string().optional(),
        line: z.string().optional(),
      }).optional(),
      isIncumbent: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateCandidate(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteCandidate(input.id);
      return { success: true };
    }),
});

// ============ Policy Router ============
const policyRouter = router({
  getByCandidateId: publicProcedure
    .input(z.object({ candidateId: z.number() }))
    .query(async ({ input }) => {
      return db.getPoliciesByCandidateId(input.candidateId);
    }),

  getByCategory: publicProcedure
    .input(z.object({ categoryId: z.number() }))
    .query(async ({ input }) => {
      return db.getPoliciesByCategory(input.categoryId);
    }),

  search: publicProcedure
    .input(z.object({
      query: z.string().min(1),
      categoryId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return db.searchPolicies(input.query, input.categoryId);
    }),

  create: adminProcedure
    .input(z.object({
      candidateId: z.number(),
      categoryId: z.number().optional(),
      title: z.string().min(1),
      summary: z.string().optional(),
      content: z.string().optional(),
      source: z.string().optional(),
      isHighlight: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createPolicy(input);
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      source: z.string().optional(),
      isHighlight: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updatePolicy(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deletePolicy(input.id);
      return { success: true };
    }),
});

// ============ News Router ============
const newsRouter = router({
  list: publicProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return db.getNews({
        ...input,
        isPublished: true,
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await db.getNewsById(input.id);
      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "News not found" });
      }
      return item;
    }),

  // Admin operations
  listAll: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      return db.getNews(input);
    }),

  create: adminProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      title: z.string().min(1),
      summary: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceName: z.string().optional(),
      publishedAt: z.date().optional(),
      isPublished: z.boolean().default(true),
      isPinned: z.boolean().default(false),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createNews(input);
      return { id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      candidateId: z.number().optional(),
      title: z.string().optional(),
      summary: z.string().optional(),
      content: z.string().optional(),
      imageUrl: z.string().optional(),
      sourceUrl: z.string().optional(),
      sourceName: z.string().optional(),
      isPublished: z.boolean().optional(),
      isPinned: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateNews(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteNews(input.id);
      return { success: true };
    }),
});

// ============ Comment Router ============
const commentRouter = router({
  list: publicProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      policyId: z.number().optional(),
      newsId: z.number().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getComments({
        ...input,
        status: "approved",
      });
    }),

  create: protectedProcedure
    .input(z.object({
      candidateId: z.number().optional(),
      policyId: z.number().optional(),
      newsId: z.number().optional(),
      parentId: z.number().optional(),
      content: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await db.createComment({
        ...input,
        userId: ctx.user.id,
        status: "approved", // Auto-approve for now
      });
      return { id };
    }),

  // Admin operations
  listAll: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected", "hidden"]).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return db.getComments(input);
    }),

  updateStatus: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "rejected", "hidden"]),
    }))
    .mutation(async ({ input }) => {
      await db.updateCommentStatus(input.id, input.status);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteComment(input.id);
      return { success: true };
    }),
});

// ============ Category Router ============
const categoryRouter = router({
  list: publicProcedure.query(async () => {
    return db.getIssueCategories();
  }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      icon: z.string().optional(),
      description: z.string().optional(),
      sortOrder: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createIssueCategory(input);
      return { id };
    }),
});

// ============ Statistics Router ============
const statsRouter = router({
  get: publicProcedure.query(async () => {
    return db.getStatistics();
  }),

  seed: adminProcedure.mutation(async () => {
    await db.seedIssueCategories();
    return { success: true };
  }),
});

// ============ Main Router ============
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  candidate: candidateRouter,
  policy: policyRouter,
  news: newsRouter,
  comment: commentRouter,
  category: categoryRouter,
  stats: statsRouter,
});

export type AppRouter = typeof appRouter;
