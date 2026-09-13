"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateAIInsights } from "./dashboard";

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    // 1. Check if industry exists outside transaction (plain read)
    let industryInsight = await db.industryInsight.findUnique({
      where: {
        industry: data.industry,
      },
    });

    // 2. If industry doesn't exist, call Gemini LLM OUTSIDE any transaction
    let insights = null;
    if (!industryInsight) {
      insights = await generateAIInsights(data.industry);
    }

    // 3. Short transaction doing only DB writes using tx client exclusively
    const result = await db.$transaction(
      async (tx) => {
        let currentInsight = industryInsight;

        // Upsert industry insight if not already present
        if (!currentInsight && insights) {
          try {
            currentInsight = await tx.industryInsight.upsert({
              where: {
                industry: data.industry,
              },
              create: {
                industry: data.industry,
                ...insights,
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              },
              update: {},
            });
          } catch (upsertError) {
            // Fallback in case of race condition / unique constraint collision (P2002)
            if (upsertError.code === "P2002") {
              currentInsight = await tx.industryInsight.findUnique({
                where: {
                  industry: data.industry,
                },
              });
            } else {
              throw upsertError;
            }
          }
        }

        // Update the user record using tx client
        const updatedUser = await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            industry: data.industry,
            experience: data.experience,
            bio: data.bio,
            skills: data.skills,
          },
        });

        return { updatedUser, industryInsight: currentInsight };
      },
      {
        timeout: 10000,
      }
    );

    revalidatePath("/");
    return result.updatedUser;
  } catch (error) {
    console.error("Error updating user and industry:", error.message);
    throw new Error("Failed to update profile");
  }
}

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const user = await db.user.findUnique({
      where: {
        clerkUserId: userId,
      },
      select: {
        industry: true,
      },
    });

    return {
      isOnboarded: !!user?.industry,
    };
  } catch (error) {
    console.error("Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}
