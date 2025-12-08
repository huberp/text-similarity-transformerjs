import { readFileSync } from 'fs';
import { join } from 'path';
import { stemText } from './stemming.js';

// Cache for term index data to avoid repeated file I/O
const termIndexCache = new Map();

/**
 * Parse a CSV line properly handling quoted fields
 * @param {string} line - CSV line to parse
 * @returns {Array<string>} Array of field values
 */
function parseCSVLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  
  // Add the last field
  fields.push(currentField);
  
  return fields;
}

/**
 * Load and cache term index from TF-IDF data directory
 * @param {string} tfidfDataDir - Directory containing TF-IDF data
 * @returns {Object} Object with terms array and termToIndex map
 */
function loadTermIndex(tfidfDataDir) {
  // Check cache first
  if (termIndexCache.has(tfidfDataDir)) {
    return termIndexCache.get(tfidfDataDir);
  }
  
  // Read term index to get term IDs and IDF weights
  const termIndexPath = join(tfidfDataDir, 'term_index.csv');
  const termIndexContent = readFileSync(termIndexPath, 'utf-8');
  const termIndexLines = termIndexContent.trim().split('\n').slice(1); // Skip header
  
  const terms = termIndexLines.map(line => {
    const fields = parseCSVLine(line);
    const [id, term, idfWeight] = fields;
    return {
      id: parseInt(id, 10),
      term,
      idfWeight: parseFloat(idfWeight)
    };
  });
  
  // Create term to index mapping
  const termToIndex = new Map();
  for (const term of terms) {
    termToIndex.set(term.term, term);
  }
  
  // Cache the result
  const result = { terms, termToIndex };
  termIndexCache.set(tfidfDataDir, result);
  
  return result;
}

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
  
  // Load term index (cached after first call)
  const { terms, termToIndex } = loadTermIndex(tfidfDataDir);
  
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
  if (norm === 0) {
    return {
      vector,
      foundTerms,
      stemmedText,
      totalTerms: stemmedWords.length
    };
  }
  
  const normalizedVector = vector.map(val => val / norm);
  
  return {
    vector: normalizedVector,
    foundTerms,
    stemmedText,
    totalTerms: stemmedWords.length
  };
}
