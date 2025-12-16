import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { escapeCSV } from './lib/csv-utils.js';
import { createOrOpenIndex, insertVectors } from './lib/vector-index.js';

// Constants
const TFIDF_DATA_DIR = './tfidf-data';
const TFIDF_INDEX_DIR = './tfidf-vector-index';
const OUTPUT_CSV = 'tfidf_vectors.csv';

async function buildTFIDFVectorStore() {
  console.log('='.repeat(80));
  console.log('TF-IDF VECTOR STORE BUILDER');
  console.log('='.repeat(80));
  console.log();

  // Step 1: Read TF-IDF data from tfidf-data folder
  console.log('Step 1: Loading TF-IDF data...');
  
  const documentIndexPath = join(TFIDF_DATA_DIR, 'document_index.csv');
  const termIndexPath = join(TFIDF_DATA_DIR, 'term_index.csv');
  const tfSparsePath = join(TFIDF_DATA_DIR, 'tf_sparse.csv');

  // Read document index
  const documentIndexContent = readFileSync(documentIndexPath, 'utf-8');
  const documentIndexLines = documentIndexContent.trim().split('\n').slice(1); // Skip header
  const documents = documentIndexLines.map(line => {
    const [id, filename, topic, subtopic] = line.split(',');
    return { id: parseInt(id), filename, topic, subtopic };
  });
  console.log(`  Loaded ${documents.length} documents`);

  // Read term index
  const termIndexContent = readFileSync(termIndexPath, 'utf-8');
  const termIndexLines = termIndexContent.trim().split('\n').slice(1); // Skip header
  const terms = termIndexLines.map(line => {
    const [id, term, idfWeight, collectionFrequency] = line.split(',');
    return {
      id: parseInt(id),
      term,
      idfWeight: parseFloat(idfWeight),
      collectionFrequency: parseInt(collectionFrequency)
    };
  });
  console.log(`  Loaded ${terms.length} terms`);

  // Read TF sparse data
  const tfSparseContent = readFileSync(tfSparsePath, 'utf-8');
  const tfSparseLines = tfSparseContent.trim().split('\n').slice(1); // Skip header
  
  // Build TF data structure: Map<documentId, Map<termId, frequency>>
  const tfData = new Map();
  for (const line of tfSparseLines) {
    const [docId, termId, frequency] = line.split(',').map(Number);
    if (!tfData.has(docId)) {
      tfData.set(docId, new Map());
    }
    tfData.get(docId).set(termId, frequency);
  }
  console.log(`  Loaded ${tfSparseLines.length} TF entries\n`);

  // Step 2: Build TF-IDF vectors for each document
  console.log('Step 2: Computing TF-IDF vectors...');
  
  const tfidfVectors = [];
  for (const doc of documents) {
    // Initialize dense vector with zeros for all terms
    const vector = new Array(terms.length).fill(0);
    
    // Get TF data for this document
    const docTf = tfData.get(doc.id) || new Map();
    
    // Compute TF-IDF score for each term
    for (const [termId, tf] of docTf.entries()) {
      const term = terms[termId];
      if (term && term.idfWeight !== undefined) {
        // TF-IDF = TF * IDF
        vector[termId] = tf * term.idfWeight;
      }
    }
    
    tfidfVectors.push(vector);
  }
  console.log(`  Computed ${tfidfVectors.length} TF-IDF vectors (dimension: ${terms.length})\n`);

  // Step 3: Normalize vectors to unit size (L2 normalization)
  console.log('Step 3: Normalizing vectors to unit size...');
  
  const normalizedVectors = tfidfVectors.map((vector, idx) => {
    // Calculate L2 norm (Euclidean norm)
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    // Normalize: divide each component by the norm
    // Handle zero vectors (documents with no terms)
    if (norm === 0) {
      console.warn(`  Warning: Document ${documents[idx].filename} has zero vector, skipping normalization`);
      return vector;
    }
    
    return vector.map(val => val / norm);
  });
  console.log(`  Normalized ${normalizedVectors.length} vectors\n`);

  // Step 4: Build LocalIndex with normalized TF-IDF vectors
  console.log('Step 4: Building LocalIndex vector store...');
  
  // Create output directory if it doesn't exist
  mkdirSync(TFIDF_INDEX_DIR, { recursive: true });
  
  // Initialize Vectra LocalIndex (uses shared helper)
  const index = await createOrOpenIndex(TFIDF_INDEX_DIR);
  
  // Insert normalized vectors with metadata (uses shared helper)
  await insertVectors(index, documents, normalizedVectors, (doc) => ({
    id: doc.id,
    filename: doc.filename,
    topic: doc.topic,
    subtopic: doc.subtopic
  }));
  
  console.log(`  LocalIndex created at: ${TFIDF_INDEX_DIR}`);
  console.log(`  Stored ${documents.length} normalized TF-IDF vectors\n`);

  // Step 5: Export normalized vectors to CSV for analysis
  console.log('Step 5: Exporting normalized vectors to CSV...');
  
  const csvRows = [];
  
  // Create header row
  const headerColumns = ['filename', 'topic', 'subtopic'];
  for (let i = 0; i < terms.length; i++) {
    headerColumns.push(`term_${i}`);
  }
  csvRows.push(headerColumns.join(','));
  
  // Add data rows
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const vector = normalizedVectors[i];
    const row = [
      escapeCSV(doc.filename),
      escapeCSV(doc.topic),
      escapeCSV(doc.subtopic),
      ...vector
    ];
    csvRows.push(row.join(','));
  }
  
  // Write CSV file
  const csvContent = csvRows.join('\n');
  writeFileSync(OUTPUT_CSV, csvContent, 'utf-8');
  console.log(`  Normalized vectors exported to ${OUTPUT_CSV}`);
  console.log(`  (${documents.length} documents, ${terms.length} dimensions)\n`);

  // Display statistics
  console.log('='.repeat(80));
  console.log('STATISTICS');
  console.log('='.repeat(80));
  console.log();
  console.log(`Total documents:        ${documents.length}`);
  console.log(`Total terms:            ${terms.length}`);
  console.log(`Vector dimensions:      ${terms.length}`);
  console.log(`Index location:         ${TFIDF_INDEX_DIR}`);
  console.log(`CSV export:             ${OUTPUT_CSV}`);
  
  // Verify normalization by checking vector magnitudes
  console.log();
  console.log('Verification: Vector magnitudes (should be ~1.0 for normalized vectors):');
  console.log('-'.repeat(80));
  for (let i = 0; i < Math.min(5, documents.length); i++) {
    const doc = documents[i];
    const vector = normalizedVectors[i];
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    console.log(`  ${doc.filename}: ${magnitude.toFixed(6)}`);
  }
  if (documents.length > 5) {
    console.log(`  ... (showing first 5 of ${documents.length} documents)`);
  }

  console.log();
  console.log('='.repeat(80));
  console.log('TF-IDF VECTOR STORE BUILD COMPLETE!');
  console.log('='.repeat(80));
  console.log();
  console.log('Next steps:');
  console.log(`  - Use the LocalIndex at ${TFIDF_INDEX_DIR} for similarity queries`);
  console.log(`  - Analyze the normalized vectors in ${OUTPUT_CSV}`);
  console.log('  - Compare TF-IDF based similarities with transformer-based embeddings');
}

// Run the vector store builder
buildTFIDFVectorStore().catch(console.error);
