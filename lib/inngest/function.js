import { db } from "@/lib/prisma";
import { inngest } from "./client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseJsonResponse } from "@/lib/ai/parseJsonResponse";
import { industryInsightSchema } from "@/app/lib/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export const generateIndustryInsights = inngest.createFunction(
  {
    name: "Generate Industry Insights",
    retries: 3,
  },
  { cron: "0 0 * * 0" }, // Run every Sunday at midnight
  async ({ event, step }) => {
    const industries = await step.run("Fetch industries", async () => {
      return await db.industryInsight.findMany({
        select: { industry: true },
      });
    });

    const results = {
      successful: [],
      failed: [],
    };

    for (const { industry } of industries) {
      const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

      try {
        await step.run(`Generate and update insights for ${industry}`, async () => {
          const res = await model.generateContent(prompt);
          const text = res?.response?.text?.() || "";

          const insights = await parseJsonResponse(
            text,
            industryInsightSchema,
            async (retryPrompt) => await model.generateContent(retryPrompt)
          );

          await db.industryInsight.update({
            where: { industry },
            data: {
              ...insights,
              lastUpdated: new Date(),
              nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
          });
        });

        results.successful.push(industry);
      } catch (error) {
        console.error(
          `[Industry Insights Cron] Failed to process industry "${industry}":`,
          error.message
        );
        results.failed.push({
          industry,
          error: error.message,
        });
      }
    }

    console.log(
      `[Industry Insights Cron] Completed run. Succeeded: ${results.successful.length}, Failed: ${results.failed.length}`,
      results.failed.length > 0 ? { failures: results.failed } : ""
    );

    return results;
  }
);
