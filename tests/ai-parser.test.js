import { describe, it, expect, vi } from "vitest";
import { extractJsonString, parseJsonResponse } from "../lib/ai/parseJsonResponse";
import {
  industryInsightSchema,
  quizResponseSchema,
  atsScoreResponseSchema,
} from "../app/lib/schema";

describe("AI JSON Parser & Zod Validator", () => {
  describe("extractJsonString", () => {
    it("extracts plain JSON objects cleanly", () => {
      const input = '{"name": "Developer", "level": "Senior"}';
      expect(extractJsonString(input)).toBe(input);
    });

    it("strips markdown code fences", () => {
      const input = '```json\n{"salary": 120000}\n```';
      expect(extractJsonString(input)).toBe('{"salary": 120000}');
    });

    it("extracts JSON embedded in conversational prose", () => {
      const input =
        'Here is the analysis you requested:\n\n{"role": "Engineer", "skills": ["React", "Node"]}\n\nHope this helps!';
      expect(extractJsonString(input)).toBe(
        '{"role": "Engineer", "skills": ["React", "Node"]}'
      );
    });

    it("handles nested brackets and strings containing braces", () => {
      const input =
        'Note: {"message": "hello {nested} world", "data": [1, 2, 3]} end of report';
      expect(extractJsonString(input)).toBe(
        '{"message": "hello {nested} world", "data": [1, 2, 3]}'
      );
    });

    it("extracts JSON arrays embedded in text", () => {
      const input = 'The options are: [{"id": 1}, {"id": 2}] as requested.';
      expect(extractJsonString(input)).toBe('[{"id": 1}, {"id": 2}]');
    });
  });

  describe("parseJsonResponse", () => {
    it("parses valid JSON without schema", async () => {
      const raw = '{"success": true, "count": 42}';
      const result = await parseJsonResponse(raw);
      expect(result).toEqual({ success: true, count: 42 });
    });

    it("validates valid industry insight response against Zod schema", async () => {
      const validIndustryJson = JSON.stringify({
        salaryRanges: [
          { role: "Software Engineer", min: 90000, max: 180000, median: 130000, location: "US" },
        ],
        growthRate: 15.2,
        demandLevel: "High",
        topSkills: ["TypeScript", "Next.js"],
        marketOutlook: "Positive",
        keyTrends: ["Server Actions", "AI Integration"],
        recommendedSkills: ["Prisma", "Tailwind CSS"],
      });

      const result = await parseJsonResponse(validIndustryJson, industryInsightSchema);
      expect(result.growthRate).toBe(15.2);
      expect(result.salaryRanges[0].role).toBe("Software Engineer");
    });

    it("triggers retry callback when initial response is malformed JSON", async () => {
      const malformedInput = "Invalid JSON { missing quotes ";
      const fixedJson = '{"questions": [{"question": "Q1", "options": ["A", "B"], "correctAnswer": "A", "explanation": "Exp"}]}';

      const retryFn = vi.fn().mockResolvedValue(fixedJson);

      const result = await parseJsonResponse(malformedInput, quizResponseSchema, retryFn);

      expect(retryFn).toHaveBeenCalledTimes(1);
      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].correctAnswer).toBe("A");
    });

    it("throws a descriptive error when schema validation fails and no retry succeeds", async () => {
      const schemaMismatch = JSON.stringify({
        salaryRanges: [], // Schema requires .min(1)
        growthRate: 5,
        demandLevel: "High",
        topSkills: [],
        marketOutlook: "Positive",
        keyTrends: [],
        recommendedSkills: [],
      });

      await expect(
        parseJsonResponse(schemaMismatch, industryInsightSchema)
      ).rejects.toThrow(/JSON schema validation failed/);
    });
  });
});
