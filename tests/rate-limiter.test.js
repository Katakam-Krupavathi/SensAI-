import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, clearRateLimits } from "../lib/rate-limiter";

describe("Sliding-Window Rate Limiter", () => {
  beforeEach(() => {
    clearRateLimits();
    process.env.AI_RATE_LIMIT_MAX_REQUESTS = "3";
    process.env.AI_RATE_LIMIT_WINDOW_MINUTES = "30";
  });

  it("allows requests within configured quota", async () => {
    const userId = "user_test_1";

    const res1 = await checkRateLimit(userId, "quiz");
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = await checkRateLimit(userId, "quiz");
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = await checkRateLimit(userId, "quiz");
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("throws clear error when quota is exceeded", async () => {
    const userId = "user_test_2";

    await checkRateLimit(userId, "cover letter");
    await checkRateLimit(userId, "cover letter");
    await checkRateLimit(userId, "cover letter");

    await expect(checkRateLimit(userId, "cover letter")).rejects.toThrow(
      /You've hit your cover letter limit of 3 requests per 30 minutes/
    );
  });

  it("isolates rate limits between different users", async () => {
    const userA = "user_A";
    const userB = "user_B";

    await checkRateLimit(userA, "interview");
    await checkRateLimit(userA, "interview");
    await checkRateLimit(userA, "interview");

    // userA is exhausted
    await expect(checkRateLimit(userA, "interview")).rejects.toThrow();

    // userB still has full quota
    const resB = await checkRateLimit(userB, "interview");
    expect(resB.success).toBe(true);
    expect(resB.remaining).toBe(2);
  });

  it("throws Unauthorized if userId is missing", async () => {
    await expect(checkRateLimit(null)).rejects.toThrow("Unauthorized");
  });
});
