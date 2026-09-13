import { describe, it, expect } from "vitest";
import { atsScoreResponseSchema } from "../app/lib/schema";
import { parseJsonResponse } from "../lib/ai/parseJsonResponse";

describe("ATS Scoring Engine (Pure Logic & Schema)", () => {
  it("validates a complete job-match ATS evaluation payload", async () => {
    const mockAnalysisPayload = JSON.stringify({
      atsScore: 85,
      summary: "Strong candidate match for Full-Stack Developer position.",
      matchedKeywords: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      missingKeywords: ["GraphQL", "Docker"],
      strengths: [
        "Extensive experience building Next.js web applications",
        "Clear quantifiable project achievements",
      ],
      improvements: [
        "Add experience with container orchestration (Docker/K8s)",
        "Highlight API design skills in work history",
      ],
      formattingFeedback: [
        "Section headers follow standard ATS naming conventions",
      ],
    });

    const validated = await parseJsonResponse(
      mockAnalysisPayload,
      atsScoreResponseSchema
    );

    expect(validated.atsScore).toBe(85);
    expect(validated.matchedKeywords).toContain("React");
    expect(validated.missingKeywords).toContain("Docker");
    expect(validated.strengths).toHaveLength(2);
    expect(validated.improvements).toHaveLength(2);
  });

  it("validates general ATS readiness score boundaries (0-100)", async () => {
    const validBoundaryPayload = JSON.stringify({
      atsScore: 100,
      summary: "Flawless resume structure and formatting.",
      matchedKeywords: ["Leadership", "Architecture"],
      missingKeywords: [],
      strengths: ["Clean typography", "Action verbs in every bullet"],
      improvements: ["Keep certifications updated"],
      formattingFeedback: ["ATS parseability is optimal"],
    });

    const validated = await parseJsonResponse(
      validBoundaryPayload,
      atsScoreResponseSchema
    );

    expect(validated.atsScore).toBe(100);
  });

  it("rejects invalid score out of bounds", async () => {
    const invalidScorePayload = JSON.stringify({
      atsScore: 150, // Out of bounds > 100
      summary: "Invalid score",
      matchedKeywords: [],
      missingKeywords: [],
      strengths: [],
      improvements: ["Fix score"],
      formattingFeedback: [],
    });

    await expect(
      parseJsonResponse(invalidScorePayload, atsScoreResponseSchema)
    ).rejects.toThrow(/JSON schema validation failed/);
  });
});
