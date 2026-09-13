"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseJsonResponse } from "@/lib/ai/parseJsonResponse";
import { atsScoreResponseSchema } from "@/app/lib/schema";
import { checkRateLimit } from "@/lib/rate-limiter";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Evaluates a resume against a specific target job description.
 * Computes a 0-100 ATS compatibility score, matched/missing keywords, and actionable feedback.
 *
 * @param {Object} params
 * @param {string} params.resumeContent - Markdown/text content of the resume
 * @param {string} params.jobDescription - Text of the target job posting
 */
export async function scoreResumeAgainstJob({ resumeContent, jobDescription }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!resumeContent || resumeContent.trim().length < 50) {
    throw new Error("Resume content is too short to perform ATS analysis");
  }

  if (!jobDescription || jobDescription.trim().length < 30) {
    throw new Error("Please provide a valid job description to score against");
  }

  await checkRateLimit(userId, "ATS job scoring");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
You are an advanced Applicant Tracking System (ATS) and expert resume reviewer.
Analyze the following candidate resume against the provided target job description.

Target Job Description:
"""
${jobDescription}
"""

Candidate Resume Content:
"""
${resumeContent}
"""

Perform a comprehensive ATS audit and return ONLY a valid JSON object matching this exact schema:
{
  "atsScore": number, // 0 to 100 integer representing match compatibility and ATS readiness
  "summary": "string", // 2-3 sentence overview of overall fit and compatibility
  "matchedKeywords": ["string"], // Specific skills/tools/technologies from the job description found in the resume
  "missingKeywords": ["string"], // High-value skills/qualifications required by the job description that are missing or weak
  "strengths": ["string"], // 2-4 strong points of the resume relevant to the role
  "improvements": ["string"], // 3-5 specific, actionable recommendations (quantification gaps, missing keywords, section enhancements)
  "formattingFeedback": ["string"] // Observations on ATS parseability, headers, bullet clarity, and structure
}

IMPORTANT:
- Return ONLY the JSON object without markdown fences, commentary, or prose.
- Be realistic and rigorous with the score (e.g. standard resumes typically range 50-85, exceptionally aligned 85-95+).
- Identify concrete keywords, not generic words.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "";

    const analysis = await parseJsonResponse(
      text,
      atsScoreResponseSchema,
      async (retryPrompt) => await model.generateContent(retryPrompt)
    );

    // Persist ATS score and serialized feedback into Resume row
    await db.resume.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        content: resumeContent,
        atsScore: analysis.atsScore,
        feedback: JSON.stringify(analysis),
      },
      update: {
        atsScore: analysis.atsScore,
        feedback: JSON.stringify(analysis),
      },
    });

    revalidatePath("/resume");
    return analysis;
  } catch (error) {
    console.error("Error scoring resume against job description:", error.message);
    throw new Error(`Failed to calculate ATS score: ${error.message}`);
  }
}

/**
 * Performs a general ATS audit on resume structure, readability, and best practices
 * without requiring a specific job description.
 *
 * @param {Object} params
 * @param {string} params.resumeContent - Markdown/text content of the resume
 */
export async function scoreResumeGeneral({ resumeContent }) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  if (!resumeContent || resumeContent.trim().length < 50) {
    throw new Error("Resume content is too short to perform ATS analysis");
  }

  await checkRateLimit(userId, "general ATS audit");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: { industryInsight: true },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
You are an expert ATS (Applicant Tracking System) parser and resume evaluator.
Conduct a general structural and content audit on this resume for ${user.industry || "general professional"} roles.

Candidate Resume Content:
"""
${resumeContent}
"""

Evaluate the resume on:
1. Standard ATS section structure (Contact, Summary, Experience, Education, Skills).
2. Action verbs and metric-driven quantification (e.g. %, $, numbers in achievement bullets).
3. Clarity, readability, and keyword density.
4. ATS compatibility (no problematic elements).

Return ONLY a valid JSON object matching this exact schema:
{
  "atsScore": number, // 0 to 100 score indicating general ATS readiness
  "summary": "string", // 2-3 sentence overview of formatting and structural readiness
  "matchedKeywords": ["string"], // Strong industry/technical skills identified in the resume
  "missingKeywords": ["string"], // Recommended industry skills/keywords that would enhance profile strength
  "strengths": ["string"], // 2-4 strong qualities of this resume
  "improvements": ["string"], // 3-5 specific recommendations to improve score and pass ATS parsers
  "formattingFeedback": ["string"] // Structural observations (e.g. section headings, bullet length, contact details)
}

IMPORTANT: Return ONLY the JSON object. No markdown fences or conversational text.
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result?.response?.text?.() || "";

    const analysis = await parseJsonResponse(
      text,
      atsScoreResponseSchema,
      async (retryPrompt) => await model.generateContent(retryPrompt)
    );

    // Persist general ATS score and feedback onto Resume
    await db.resume.upsert({
      where: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        content: resumeContent,
        atsScore: analysis.atsScore,
        feedback: JSON.stringify(analysis),
      },
      update: {
        atsScore: analysis.atsScore,
        feedback: JSON.stringify(analysis),
      },
    });

    revalidatePath("/resume");
    return analysis;
  } catch (error) {
    console.error("Error performing general ATS audit:", error.message);
    throw new Error(`Failed to perform general ATS audit: ${error.message}`);
  }
}
