/**
 * Extracts a balanced JSON substring ({...} or [...]) from text that may contain
 * markdown code blocks or conversational prose before/after.
 */
export function extractJsonString(rawText) {
  if (typeof rawText !== "string") {
    throw new Error("Input to extractJsonString must be a string");
  }

  let text = rawText.trim();

  // Strip markdown code fences if wrapped
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const fenceMatch = text.match(fenceRegex);
  if (fenceMatch && fenceMatch[1]) {
    text = fenceMatch[1].trim();
  }

  // Find first opening brace or bracket
  const firstBrace = text.indexOf("{");
  const firstBracket = text.indexOf("[");

  let startIdx = -1;
  let openChar = "";
  let closeChar = "";

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    openChar = "{";
    closeChar = "}";
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    openChar = "[";
    closeChar = "]";
  } else {
    return text;
  }

  let depth = 0;
  let inString = false;
  let isEscaped = false;

  for (let i = startIdx; i < text.length; i++) {
    const char = text[i];

    if (isEscaped) {
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === openChar) {
        depth++;
      } else if (char === closeChar) {
        depth--;
        if (depth === 0) {
          return text.slice(startIdx, i + 1);
        }
      }
    }
  }

  return text.slice(startIdx);
}

/**
 * Parses raw LLM text into JSON, validates against an optional Zod schema,
 * and executes a retry callback once if parsing or schema validation fails.
 *
 * @param {string} rawText - The raw string from Gemini model
 * @param {import('zod').ZodTypeAny} [schema] - Optional Zod schema to validate against
 * @param {Function} [retryFn] - Optional async function to call on failure to retry generation
 * @returns {Promise<any>}
 */
export async function parseJsonResponse(rawText, schema = null, retryFn = null) {
  const attemptParse = (input) => {
    const jsonString = extractJsonString(input);
    const parsed = JSON.parse(jsonString);
    if (schema) {
      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        const errorMsg = validated.error.issues
          ?.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
          .join(", ");
        throw new Error(`JSON schema validation failed: ${errorMsg}`);
      }
      return validated.data;
    }
    return parsed;
  };

  try {
    return attemptParse(rawText);
  } catch (initialError) {
    if (typeof retryFn === "function") {
      try {
        const retryPrompt = `Your last response was not valid JSON or did not match the required schema (${initialError.message}). Please return ONLY the raw JSON object matching the required structure without markdown fences or any prose.`;
        const retryResult = await retryFn(retryPrompt);
        const retryText =
          typeof retryResult === "string"
            ? retryResult
            : retryResult?.response?.text?.() || retryResult?.text || "";
        return attemptParse(retryText);
      } catch (retryError) {
        throw new Error(
          `AI output validation failed after retry: ${retryError.message}`
        );
      }
    }
    throw new Error(`AI output parsing failed: ${initialError.message}`);
  }
}
