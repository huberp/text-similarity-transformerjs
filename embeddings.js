import './lib/transformersEnv.js'; // Configure persistent caching
import { readCorpusDocuments } from './lib/corpus-loader.js';
import { computeEmbedding } from './lib/embeddings.js';
import { createOrOpenIndex, insertDocumentEmbeddings } from './lib/vector-index.js';
import { exportEmbeddingsToCSV } from './lib/embeddings-export.js';

async function computeEmbeddings() {
  // Read all markdown files from test_corpus directory
  const corpusDir = './test_corpus';
  const documents = readCorpusDocuments(corpusDir);
  
  console.log(`Found ${documents.length} documents in test corpus\n`);
  
  console.log('Computing embeddings for all documents...');
  
  // Initialize Vectra LocalIndex
  const index = await createOrOpenIndex('./vector-index');
  
  // Generate embeddings and store them in the index
  // Also keep vectors in memory for export
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
  
  console.log('='.repeat(80));
  console.log('EMBEDDINGS COMPUTATION COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log(`LocalIndex stored at: ./vector-index/`);
  console.log(`Ready for similarity analysis!`);
}

// Run the embeddings computation
computeEmbeddings().catch(console.error);
