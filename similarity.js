import './lib/transformersEnv.js'; // Configure persistent caching
import { readCorpusDocuments } from './lib/corpus-loader.js';
import { computeEmbedding } from './lib/embeddings.js';
import { createOrOpenIndex, insertDocumentEmbeddings } from './lib/vector-index.js';
import { exportEmbeddingsToCSV } from './lib/embeddings-export.js';
import { computePairwiseSimilarities, printSimilaritySummary, exportSimilarityResultsToCSV } from './lib/similarity-report.js';

async function detectTextSimilarities() {
  // Read all markdown files from test_corpus directory
  const corpusDir = './test_corpus';
  const documents = readCorpusDocuments(corpusDir);
  
  console.log(`Found ${documents.length} documents in test corpus\n`);
  
  console.log('Computing embeddings for all documents...');
  
  // Initialize Vectra LocalIndex
  const index = await createOrOpenIndex('./vector-index');
  
  // Generate embeddings and store them in the index
  // Also keep vectors in memory for querying
  const vectors = [];
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const vector = await computeEmbedding(doc.content);
    vectors.push(vector);
  }
  
  // Insert all embeddings into the index
  await insertDocumentEmbeddings(index, documents, vectors);
  
  console.log('Embeddings computed and stored in index successfully!\n');
  
  // Export embeddings to CSV
  console.log('Exporting embeddings to CSV...');
  
  exportEmbeddingsToCSV(documents, vectors, 'embeddings.csv');
  
  // Calculate similarity matrix and find most similar pairs
  const similarities = await computePairwiseSimilarities(index, documents, null, vectors);
  
  // Print similarity summary
  printSimilaritySummary(similarities, documents);
  
  // Export similarity results to CSV
  exportSimilarityResultsToCSV(similarities, 'similarity_results.csv');
}

// Run the analysis
detectTextSimilarities().catch(console.error);
