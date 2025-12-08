/**
 * Test script for the TF-IDF vector search functionality
 * This tests the query tool without requiring the embedding model
 */
import { createTFIDFVector } from './lib/tfidf-vector.js';
import { LocalIndex } from 'vectra';

const TFIDF_INDEX_PATH = './tfidf-vector-index';
const TFIDF_DATA_PATH = './tfidf-data';

async function testTFIDFQuery() {
  console.log('='.repeat(80));
  console.log('TEST: TF-IDF SIMILARITY SEARCH');
  console.log('='.repeat(80));
  
  // Test sentences covering different topics
  const testSentences = [
    "What are the properties of matrices in linear algebra?",
    "How do I calculate derivatives and integrals?",
    "Tell me about citrus fruits like oranges and lemons",
    "What is a large language model and how does it work?"
  ];
  
  // Load TF-IDF index
  const index = new LocalIndex(TFIDF_INDEX_PATH);
  if (!(await index.isIndexCreated())) {
    console.error('ERROR: TF-IDF index not found! Run: npm run tfidf-vectors');
    process.exit(1);
  }
  
  for (const sentence of testSentences) {
    console.log('\n' + '-'.repeat(80));
    console.log(`Query: "${sentence}"`);
    console.log('-'.repeat(80));
    
    // Create TF-IDF vector for the sentence
    const tfidfResult = createTFIDFVector(sentence, TFIDF_DATA_PATH);
    
    console.log(`\nStemmed: "${tfidfResult.stemmedText}"`);
    console.log(`Total terms: ${tfidfResult.totalTerms}`);
    console.log(`Known terms found: ${tfidfResult.foundTerms.length}`);
    
    if (tfidfResult.foundTerms.length > 0) {
      console.log('\nTop found terms with TF-IDF weights:');
      tfidfResult.foundTerms
        .sort((a, b) => b.tfidf - a.tfidf)
        .slice(0, 5)
        .forEach(t => {
          console.log(`  - ${t.term}: TF=${t.tf}, IDF=${t.idf.toFixed(4)}, TF-IDF=${t.tfidf.toFixed(4)}`);
        });
    }
    
    // Query for similar documents
    const results = await index.queryItems(tfidfResult.vector, 5);
    
    console.log('\nTop 5 similar documents:');
    for (let i = 0; i < results.length; i++) {
      const { score, item } = results[i];
      const scorePercent = (score * 100).toFixed(2);
      const { metadata } = item;
      console.log(`  ${i + 1}. [${scorePercent}%] ${metadata.filename} (${metadata.topic}/${metadata.subtopic})`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

testTFIDFQuery().catch(console.error);
