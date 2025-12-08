import { LocalIndex } from 'vectra';
import { existsSync } from 'fs';
import { createInterface } from 'readline';
import { computeEmbedding } from './lib/embeddings.js';
import { createTFIDFVector } from './lib/tfidf-vector.js';

// Constants
const SIMILARITY_INDEX_PATH = './vector-index';
const TFIDF_INDEX_PATH = './tfidf-vector-index';
const TFIDF_DATA_PATH = './tfidf-data';
const TOP_RESULTS = 10;

/**
 * Query the similarity vector store with an embedding
 */
async function queryEmbeddingSimilarity(sentence) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TRANSFORMER EMBEDDING SIMILARITY SEARCH');
  console.log('='.repeat(80));
  
  // Check if index exists
  if (!existsSync(SIMILARITY_INDEX_PATH)) {
    console.error('\nERROR: Similarity vector index not found!');
    console.error('Please run: npm run embeddings');
    return;
  }
  
  // Load index
  const index = new LocalIndex(SIMILARITY_INDEX_PATH);
  if (!(await index.isIndexCreated())) {
    console.error('\nERROR: Similarity index is not initialized!');
    console.error('Please run: npm run embeddings');
    return;
  }
  
  console.log('\nComputing embedding for input sentence...');
  const embedding = await computeEmbedding(sentence);
  console.log(`Embedding dimension: ${embedding.length}`);
  
  console.log('\nSearching for similar documents...');
  const results = await index.queryItems(embedding, TOP_RESULTS);
  
  console.log(`\nTop ${Math.min(TOP_RESULTS, results.length)} most similar documents:\n`);
  console.log('-'.repeat(80));
  
  for (let i = 0; i < results.length; i++) {
    const { score, item } = results[i];
    const scorePercent = (score * 100).toFixed(2);
    const { metadata } = item;
    console.log(`${i + 1}. [${scorePercent}%] ${metadata.filename}`);
    console.log(`   Topic: ${metadata.topic} / ${metadata.subtopic}`);
  }
}

/**
 * Query the TF-IDF vector store with a stemmed sentence vector
 */
async function queryTFIDFSimilarity(sentence) {
  console.log(`\n${'='.repeat(80)}`);
  console.log('TF-IDF VECTOR SIMILARITY SEARCH');
  console.log('='.repeat(80));
  
  // Check if TF-IDF data and index exist
  if (!existsSync(TFIDF_DATA_PATH)) {
    console.error('\nERROR: TF-IDF data not found!');
    console.error('Please run: npm run tfidf');
    return;
  }
  
  if (!existsSync(TFIDF_INDEX_PATH)) {
    console.error('\nERROR: TF-IDF vector index not found!');
    console.error('Please run: npm run tfidf-vectors');
    return;
  }
  
  // Load TF-IDF index
  const index = new LocalIndex(TFIDF_INDEX_PATH);
  if (!(await index.isIndexCreated())) {
    console.error('\nERROR: TF-IDF index is not initialized!');
    console.error('Please run: npm run tfidf-vectors');
    return;
  }
  
  console.log('\nStemming and analyzing input sentence...');
  const tfidfResult = createTFIDFVector(sentence, TFIDF_DATA_PATH);
  
  console.log(`Stemmed text: "${tfidfResult.stemmedText}"`);
  console.log(`Total terms: ${tfidfResult.totalTerms}`);
  console.log(`Known terms found: ${tfidfResult.foundTerms.length}`);
  
  if (tfidfResult.foundTerms.length > 0) {
    console.log('\nFound terms with TF-IDF weights:');
    tfidfResult.foundTerms
      .sort((a, b) => b.tfidf - a.tfidf)
      .slice(0, 10)
      .forEach(t => {
        console.log(`  - ${t.term}: TF=${t.tf}, IDF=${t.idf.toFixed(4)}, TF-IDF=${t.tfidf.toFixed(4)}`);
      });
  } else {
    console.log('\nNo known terms found in the corpus vocabulary.');
    console.log('This sentence may not match well with corpus documents.');
  }
  
  console.log('\nSearching for similar documents...');
  const results = await index.queryItems(tfidfResult.vector, TOP_RESULTS);
  
  console.log(`\nTop ${Math.min(TOP_RESULTS, results.length)} most similar documents:\n`);
  console.log('-'.repeat(80));
  
  for (let i = 0; i < results.length; i++) {
    const { score, item } = results[i];
    const scorePercent = (score * 100).toFixed(2);
    const { metadata } = item;
    console.log(`${i + 1}. [${scorePercent}%] ${metadata.filename}`);
    console.log(`   Topic: ${metadata.topic} / ${metadata.subtopic}`);
  }
}

/**
 * Main interactive query loop
 */
async function runQueryTool() {
  console.log('='.repeat(80));
  console.log('TEXT SIMILARITY QUERY TOOL');
  console.log('='.repeat(80));
  console.log('\nThis tool searches for similar documents using two approaches:');
  console.log('1. Transformer Embeddings - Deep learning based semantic similarity');
  console.log('2. TF-IDF Vectors - Classical term-based similarity');
  console.log();
  console.log('Requirements:');
  console.log('  - Run "npm run embeddings" to create the embedding vector store');
  console.log('  - Run "npm run tfidf" to create TF-IDF data');
  console.log('  - Run "npm run tfidf-vectors" to create TF-IDF vector store');
  console.log();
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));
  
  while (true) {
    console.log('='.repeat(80));
    const sentence = await askQuestion('\nEnter a sentence to search (or "quit" to exit): ');
    
    if (!sentence || sentence.trim().toLowerCase() === 'quit') {
      console.log('\nGoodbye!');
      rl.close();
      break;
    }
    
    const trimmedSentence = sentence.trim();
    if (trimmedSentence.length === 0) {
      console.log('Please enter a valid sentence.');
      continue;
    }
    
    console.log(`\nSearching for: "${trimmedSentence}"\n`);
    
    // Query both similarity approaches
    try {
      await queryEmbeddingSimilarity(trimmedSentence);
    } catch (error) {
      console.error('\nError in embedding similarity search:', error.message);
    }
    
    try {
      await queryTFIDFSimilarity(trimmedSentence);
    } catch (error) {
      console.error('\nError in TF-IDF similarity search:', error.message);
    }
  }
}

// Run the query tool
runQueryTool().catch(console.error);
