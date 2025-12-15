import { env } from '@xenova/transformers';

/**
 * Configure Transformers.js environment for persistent model caching
 * 
 * This module sets up filesystem caching for transformer models to avoid
 * re-downloading on each run. The cache location can be controlled via
 * the TRANSFORMERS_CACHE_DIR environment variable.
 */

// Configure cache directory
// Default to project-local .cache/transformers directory
const cacheDir = process.env.TRANSFORMERS_CACHE_DIR || './.cache/transformers';

// Enable filesystem cache for Node.js
env.useFSCache = true;
env.cacheDir = cacheDir;

// Allow remote models (needed to download from HuggingFace)
env.allowRemoteModels = true;

// Also allow local models in case they're already cached
env.allowLocalModels = true;

console.log(`Transformers.js cache configured at: ${cacheDir}`);

// Export env for testing/inspection purposes
export { env };
