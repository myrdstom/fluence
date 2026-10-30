import { ConvexError } from "convex/values";

/** Convex hides unexpected server errors, so only ConvexError messages are safe to show. */
export function getErrorMessage(error: unknown) {
  if (error instanceof ConvexError && typeof error.data === "string") {
    return error.data;
  }
  return "Something went wrong. Please try again.";
}
