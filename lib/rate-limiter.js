/**
 * In-memory sliding-window rate limiter for AI-generation server actions.
 * Tracks timestamps per user to prevent API quota abuse.
 */

// Global in-memory cache of user request timestamps
const userRequestTimestamps = globalThis.userRateLimitMap || new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.userRateLimitMap = userRequestTimestamps;
}

const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MINUTES = 60;

/**
 * Checks if a user has exceeded their AI generation rate limit.
 * Throws a descriptive error message if the limit has been reached.
 *
 * @param {string} userId - The user's unique identifier (e.g. Clerk userId)
 * @param {string} [actionName='AI generation'] - Optional action name
 * @returns {Promise<{ success: boolean, remaining: number, resetTime: Date }>}
 */
export async function checkRateLimit(userId, actionName = "AI generation") {
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const maxRequests = parseInt(
    process.env.AI_RATE_LIMIT_MAX_REQUESTS || String(DEFAULT_MAX_REQUESTS),
    10
  );
  const windowMinutes = parseInt(
    process.env.AI_RATE_LIMIT_WINDOW_MINUTES || String(DEFAULT_WINDOW_MINUTES),
    10
  );
  const windowMs = windowMinutes * 60 * 1000;
  const now = Date.now();

  const timestamps = userRequestTimestamps.get(userId) || [];

  // Filter timestamps outside the sliding window
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    const oldestTimestamp = recentTimestamps[0];
    const resetTime = oldestTimestamp + windowMs;
    const remainingMinutes = Math.max(1, Math.ceil((resetTime - now) / 60000));

    throw new Error(
      `You've hit your ${actionName} limit of ${maxRequests} requests per ${windowMinutes} minutes. Please try again in ${remainingMinutes} minute${
        remainingMinutes > 1 ? "s" : ""
      }.`
    );
  }

  // Record timestamp
  recentTimestamps.push(now);
  userRequestTimestamps.set(userId, recentTimestamps);

  return {
    success: true,
    remaining: maxRequests - recentTimestamps.length,
    resetTime: new Date(recentTimestamps[0] + windowMs),
  };
}

/**
 * Utility to clear rate limit store (useful for automated testing)
 */
export function clearRateLimits() {
  userRequestTimestamps.clear();
}
