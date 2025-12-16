import { existsSync } from 'fs';
import { LocalIndex } from 'vectra';
import { readCorpusDocuments } from './lib/corpus-loader.js';
import { computePairwiseSimilarities, printSimilaritySummary, exportSimilarityResultsToCSV } from './lib/similarity-report.js';

async function analyzeSimilarity() {
  console.log('Checking for pre-computed embeddings...');
  
  // Check if LocalIndex exists
  const indexPath = './vector-index';
  if (!existsSync(indexPath)) {
    console.error('ERROR: LocalIndex not found at ./vector-index/');
    console.error('Please run embeddings computation first (npm run embeddings)');
    console.error('Or trigger the "000 PREPPROC / embeddings-vectors" workflow');
    process.exit(1);
  }
  
  // Initialize Vectra LocalIndex
  const index = new LocalIndex(indexPath);
  
  // Check if index is created
  if (!(await index.isIndexCreated())) {
    console.error('ERROR: LocalIndex exists but is not initialized');
    console.error('Please run embeddings computation first (npm run embeddings)');
    process.exit(1);
  }
  
  console.log('LocalIndex found! Loading embeddings...\n');
  
  // Read all markdown files from test_corpus directory
  const corpusDir = './test_corpus';
  const documents = readCorpusDocuments(corpusDir);
  
  console.log(`Found ${documents.length} documents in test corpus\n`);
  
  // List all items in the index to get vectors
  const allItems = await index.listItems();
  console.log(`Loaded ${allItems.length} embeddings from LocalIndex\n`);
  
  // Create a map of vectors by ID for efficient lookup
  const vectorMap = new Map();
  for (const item of allItems) {
    vectorMap.set(item.metadata.id, item.vector);
  }
  
  // Calculate similarity matrix and find most similar pairs
  const similarities = await computePairwiseSimilarities(index, documents, vectorMap);
  
  // Print similarity summary
  printSimilaritySummary(similarities, documents);
  
  // Export similarity results to CSV
  exportSimilarityResultsToCSV(similarities, 'similarity_results.csv');
}

// Run the analysis
analyzeSimilarity().catch(console.error);
