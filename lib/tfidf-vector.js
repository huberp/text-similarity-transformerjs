import { readFileSync } from 'fs';
import { join } from 'path';
import { stemText } from './stemming.js';

/**
 * Create TF-IDF vector for a given text based on pre-computed term index
 * @param {string} text - Input text to vectorize
 * @param {string} tfidfDataDir - Directory containing TF-IDF data
 * @returns {Object} Object with vector array and term information
 */
export function createTFIDFVector(text, tfidfDataDir = './tfidf-data') {
  // Stem the input text
  const stemmedText = stemText(text);
  const stemmedWords = stemmedText.split(' ').filter(w => w.length > 0);
  
  // Read term index to get term IDs and IDF weights
  const termIndexPath = join(tfidfDataDir, 'term_index.csv');
  const termIndexContent = readFileSync(termIndexPath, 'utf-8');
  const termIndexLines = termIndexContent.trim().split('\n').slice(1); // Skip header
  
  const terms = termIndexLines.map(line => {
    const [id, term, idfWeight] = line.split(',');
    return {
      id: parseInt(id),
      term,
      idfWeight: parseFloat(idfWeight)
    };
  });
  
  // Create term to index mapping
  const termToIndex = new Map();
  for (const term of terms) {
    termToIndex.set(term.term, term);
  }
  
  // Count term frequencies in stemmed text
  const termFreq = new Map();
  for (const word of stemmedWords) {
    termFreq.set(word, (termFreq.get(word) || 0) + 1);
  }
  
  // Initialize dense vector with zeros
  const vector = new Array(terms.length).fill(0);
  const foundTerms = [];
  
  // Compute TF-IDF score for each term in the query
  for (const [word, tf] of termFreq.entries()) {
    const termInfo = termToIndex.get(word);
    if (termInfo) {
      // TF-IDF = TF * IDF
      vector[termInfo.id] = tf * termInfo.idfWeight;
      foundTerms.push({ term: word, tf, idf: termInfo.idfWeight, tfidf: tf * termInfo.idfWeight });
    }
  }
  
  // Normalize vector to unit size (L2 normalization)
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  const normalizedVector = norm === 0 ? vector : vector.map(val => val / norm);
  
  return {
    vector: normalizedVector,
    foundTerms,
    stemmedText,
    totalTerms: stemmedWords.length
  };
}
