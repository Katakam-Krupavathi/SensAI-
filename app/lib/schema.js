import { z } from "zod";

export const onboardingSchema = z.object({
  industry: z.string({
    required_error: "Please select an industry",
  }),
  subIndustry: z.string({
    required_error: "Please select a specialization",
  }),
  bio: z.string().max(500).optional(),
  experience: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z
        .number()
        .min(0, "Experience must be at least 0 years")
        .max(50, "Experience cannot exceed 50 years")
    ),
  skills: z.string().transform((val) =>
    val
      ? val
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : undefined
  ),
});

export const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
});

export const entrySchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    organization: z.string().min(1, "Organization is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    current: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (!data.current && !data.endDate) {
        return false;
      }
      return true;
    },
    {
      message: "End date is required unless this is your current position",
      path: ["endDate"],
    }
  );

export const resumeSchema = z.object({
  contactInfo: contactSchema,
  summary: z.string().min(1, "Professional summary is required"),
  skills: z.string().min(1, "Skills are required"),
  experience: z.array(entrySchema),
  education: z.array(entrySchema),
  projects: z.array(entrySchema),
});

export const coverLetterSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobDescription: z.string().min(1, "Job description is required"),
});

// AI Response Schemas
export const salaryRangeSchema = z.object({
  role: z.string().min(1, "Role is required"),
  min: z.number().nonnegative("Minimum salary must be non-negative"),
  max: z.number().nonnegative("Maximum salary must be non-negative"),
  median: z.number().nonnegative("Median salary must be non-negative"),
  location: z.string().optional().nullable(),
});

export const industryInsightSchema = z.object({
  salaryRanges: z
    .array(salaryRangeSchema)
    .min(1, "At least one salary range is required"),
  growthRate: z.number(),
  demandLevel: z.enum(["High", "Medium", "Low"]).or(z.string()),
  topSkills: z.array(z.string()).min(1, "Top skills are required"),
  marketOutlook: z.enum(["Positive", "Neutral", "Negative"]).or(z.string()),
  keyTrends: z.array(z.string()).min(1, "Key trends are required"),
  recommendedSkills: z.array(z.string()).min(1, "Recommended skills are required"),
});

export const quizQuestionSchema = z.object({
  question: z.string().min(1, "Question cannot be empty"),
  options: z.array(z.string()).min(2, "Options array must contain choices"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().min(1, "Explanation is required"),
});

export const quizResponseSchema = z.object({
  questions: z
    .array(quizQuestionSchema)
    .min(1, "At least one question is required"),
});

export const quizQuestionsArraySchema = z
  .array(quizQuestionSchema)
  .min(1, "At least one question is required");

export const improvementTipSchema = z
  .string()
  .min(1, "Improvement tip cannot be empty");

export const atsScoreResponseSchema = z.object({
  atsScore: z.number().min(0).max(100),
  summary: z.string().min(1, "Summary is required"),
  matchedKeywords: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  improvements: z
    .array(z.string())
    .min(1, "At least one improvement suggestion is required"),
  formattingFeedback: z.array(z.string()).default([]),
});


