import { z } from "zod";

const baseProblemSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(300),
  description: z.string().min(10, "Description must be at least 10 characters"),
  type: z.enum(["CODING", "MCQ", "WRITTEN"]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).default("MEDIUM"),
  category: z.string().max(200).optional(),
  points: z.number().int().min(1).max(1000).default(10),
  timeLimit: z.number().int().min(1).optional(),
  memoryLimit: z.number().int().min(1).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  expectedAnswer: z.any().optional(),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expectedOutput: z.string(),
        isHidden: z.boolean().default(false),
        order: z.number().int().min(0).default(0),
      }),
    )
    .max(50)
    .optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        isCorrect: z.boolean().default(false),
        order: z.number().int().min(0).default(0),
      }),
    )
    .min(2, "MCQ problems require at least 2 options")
    .max(10)
    .optional(),
});

export const createProblemSchema = z
  .object({ body: baseProblemSchema.strict() })
  .superRefine((value, ctx) => {
    const body = value.body;
    if (body.type === "MCQ") {
      if (!body.options || body.options.length < 2) {
        ctx.addIssue({
          code: "custom",
          path: ["body", "options"],
          message: "MCQ problems require at least 2 options",
        });
      }
      if (
        body.options &&
        !body.options.some((o: { isCorrect: boolean }) => o.isCorrect)
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["body", "options"],
          message: "MCQ problems require exactly one correct option",
        });
      }
    }
    if (body.type === "CODING" && (!body.testCases || body.testCases.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["body", "testCases"],
        message: "CODING problems require at least 1 test case",
      });
    }
    if (body.type === "WRITTEN" && body.expectedAnswer === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["body", "expectedAnswer"],
        message: "WRITTEN problems require an expected answer / evaluation criteria",
      });
    }
  });

export const updateProblemSchema = z.object({
  body: baseProblemSchema.partial().strict(),
});

export const problemQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      sortBy: z
        .enum(["createdAt", "updatedAt", "title", "difficulty", "points", "type"])
        .default("createdAt"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      q: z.string().optional(),
      type: z.enum(["CODING", "MCQ", "WRITTEN"]).optional(),
      difficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional(),
      category: z.string().optional(),
      status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
      tags: z.string().optional(),
    })
    .strict(),
});

export const searchProblemSchema = z.object({
  query: z
    .object({
      q: z.string().min(1, "Search query is required"),
      page: z.coerce.number().int().min(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
    })
    .strict(),
});

export const problemIdParams = z.object({
  params: z.object({ id: z.string().uuid("Invalid problem id") }),
});
