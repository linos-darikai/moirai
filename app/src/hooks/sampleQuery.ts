// Helper for hooks that serve sample data (src/data) until the match program exists. Going through
// TanStack Query now means pages already handle loading and error states, and switching a hook to
// a chain read later only changes its queryFn.

/** Resolves sample data asynchronously, like a network read would. */
export function sampleQueryFn<T>(data: T): () => Promise<T> {
  return () => Promise.resolve(data);
}

/** Query-key prefix for every sample-data query, so they are easy to find and remove later. */
export const SAMPLE_KEY = "sample";
