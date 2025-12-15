import { pipeline } from '@xenova/transformers';
import './transformersEnv.js'; // Configure persistent caching

let cachedExtractor = null;

/**
 * Get or create embedding model pipeline
 * @returns {Promise} Pipeline for feature extraction
 */
export async function getEmbeddingModel() {
  if (!cachedExtractor) {
    console.log('Loading embedding model...');
    cachedExtractor = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', {
      dtype: 'q8'
    });
    console.log('Model loaded successfully!');
  }
  return cachedExtractor;
}

/**
 * Compute embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} Embedding vector
 */
export async function computeEmbedding(text) {
  const extractor = await getEmbeddingModel();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}
