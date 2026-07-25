/**
 * ml-config.ts — ML service timing constants for MomDigital.
 *
 * All values are read from environment variables so they can be tuned
 * on Railway without a code deploy. Defaults are sized for Railway Hobby
 * (sleep-enabled, <100 concurrent users).
 *
 * To adjust at runtime, set the corresponding env var in the Railway
 * API service environment variables panel.
 */

/**
 * Timeout (ms) for the full RAG query: POST /query
 *
 * This is the longest operation — it may include a Railway sleep wake-up
 * (~60–90s) plus the Groq LLM call. Set to 90s so the first query after
 * a cold-start does not time out before the ML service has fully loaded.
 *
 * // Reserved for production scaling (>100 active users):
 * // Disable Railway sleep (sleepApplication = false in ml_service/railway.toml)
 * // and reduce ML_QUERY_TIMEOUT to 30_000 for a snappier user experience.
 */
export const ML_QUERY_TIMEOUT =
  Number(process.env.ML_QUERY_TIMEOUT) || 90_000;

/**
 * Timeout (ms) for NER entity extraction: POST /extract
 *
 * Extraction is purely local (spaCy, no LLM, no RAG), so it completes
 * quickly even after a cold start. 8s is generous.
 */
export const ML_EXTRACT_TIMEOUT =
  Number(process.env.ML_EXTRACT_TIMEOUT) || 8_000;

/**
 * Timeout (ms) for the ML health check: GET /health
 *
 * The Flask /health endpoint responds immediately from an in-memory state dict
 * — it does NOT wait for ChromaDB to finish loading. When the ML service is
 * sleeping, Railway returns a 502 instantly, so 10s is more than enough.
 * Keep this conservative to prevent the status indicator from hanging.
 */
export const ML_HEALTH_TIMEOUT =
  Number(process.env.ML_HEALTH_TIMEOUT) || 10_000;

/**
 * Default timeout (ms) for the global HttpModule.
 *
 * Applied to all outbound HTTP requests that do not specify their own timeout.
 * Kept conservative — individual ML call sites override this with the
 * specific constants above.
 *
 * // Reserved for production scaling (>100 active users):
 * // Increase if integrating additional slow third-party APIs.
 */
export const HTTP_DEFAULT_TIMEOUT =
  Number(process.env.HTTP_DEFAULT_TIMEOUT) || 25_000;

/**
 * ML startup / retry constants.
 *
 * Currently documented for future use in a startup probe that pre-warms
 * the ML service before the first real user request arrives.
 *
 * // Reserved for production scaling (>100 active users):
 * // Implement a startup probe in main.ts that polls ML /health at
 * // ML_RETRY_INTERVAL until ready or ML_STARTUP_TIMEOUT is exceeded.
 * // Disable Railway sleep before enabling this to avoid circular waits.
 */
export const ML_STARTUP_TIMEOUT =
  Number(process.env.ML_STARTUP_TIMEOUT) || 90_000;

export const ML_RETRY_INTERVAL =
  Number(process.env.ML_RETRY_INTERVAL) || 3_000;
