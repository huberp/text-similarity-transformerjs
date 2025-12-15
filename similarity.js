import './lib/transformersEnv.js'; // Configure persistent caching
import { writeFileSync } from 'fs';
import { readCorpusDocuments } from './lib/corpus-loader.js';
import { computeEmbedding } from './lib/embeddings.js';
import { createOrOpenIndex, insertDocumentEmbeddings } from './lib/vector-index.js';
import { exportEmbeddingsToCSV } from './lib/embeddings-export.js';
import { escapeCSV } from './lib/csv-utils.js';

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
  console.log('='.repeat(80));
  console.log('TEXT SIMILARITY ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  // Group by topics
  const topicGroups = {};
  documents.forEach(doc => {
    if (!topicGroups[doc.topic]) {
      topicGroups[doc.topic] = [];
    }
    topicGroups[doc.topic].push(doc.filename);
  });
  
  console.log('Documents by Topic:');
  console.log('-'.repeat(80));
  for (const [topic, files] of Object.entries(topicGroups)) {
    console.log(`${topic}: ${files.length} documents`);
    console.log(`  ${files.join(', ')}`);
  }
  console.log();
  
  // Find top similar pairs across all documents using LocalIndex queries
  const similarities = [];
  for (let i = 0; i < documents.length; i++) {
    // Use the already computed vector for document i
    const queryVector = vectors[i];
    
    // Query similar items (will include itself)
    // Use documents.length to get all results for complete similarity matrix
    const results = await index.queryItems(queryVector, documents.length);
    
    // Process results, skipping self and documents we've already compared
    for (const result of results) {
      const j = result.item.metadata.id;
      
      // Skip self-similarity and pairs we've already processed
      if (j <= i) continue;
      
      similarities.push({
        doc1: documents[i],
        doc2: documents[j],
        similarity: result.score
      });
    }
  }
  
  // Sort by similarity (highest first)
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  // Show top 20 most similar pairs
  console.log('Top 20 Most Similar Document Pairs:');
  console.log('-'.repeat(80));
  for (let i = 0; i < Math.min(20, similarities.length); i++) {
    const sim = similarities[i];
    const sameTopic = sim.doc1.topic === sim.doc2.topic ? '✓' : '✗';
    console.log(`${(sim.similarity * 100).toFixed(2)}% ${sameTopic} | ${sim.doc1.filename} (${sim.doc1.topic}/${sim.doc1.subtopic})`);
    console.log(`           ${sim.doc2.filename} (${sim.doc2.topic}/${sim.doc2.subtopic})`);
  }
  console.log();
  
  // Calculate average similarity within and across topics
  const withinTopicSims = {};
  const acrossTopicSims = {};
  
  for (const sim of similarities) {
    if (sim.doc1.topic === sim.doc2.topic) {
      if (!withinTopicSims[sim.doc1.topic]) {
        withinTopicSims[sim.doc1.topic] = [];
      }
      withinTopicSims[sim.doc1.topic].push(sim.similarity);
    } else {
      const key = [sim.doc1.topic, sim.doc2.topic].sort().join('-');
      if (!acrossTopicSims[key]) {
        acrossTopicSims[key] = [];
      }
      acrossTopicSims[key].push(sim.similarity);
    }
  }
  
  console.log('Average Similarity Within Topics:');
  console.log('-'.repeat(80));
  for (const [topic, sims] of Object.entries(withinTopicSims)) {
    const avg = sims.reduce((a, b) => a + b, 0) / sims.length;
    console.log(`${topic}: ${(avg * 100).toFixed(2)}% (${sims.length} pairs)`);
  }
  console.log();
  
  console.log('Average Similarity Across Topics:');
  console.log('-'.repeat(80));
  for (const [key, sims] of Object.entries(acrossTopicSims)) {
    const avg = sims.reduce((a, b) => a + b, 0) / sims.length;
    console.log(`${key}: ${(avg * 100).toFixed(2)}% (${sims.length} pairs)`);
  }
  console.log();
  
  console.log('='.repeat(80));
  console.log('Analysis complete!');
  console.log('='.repeat(80));
  
  // Export similarity results to a tabular format (CSV)
  console.log('\nExporting similarity results to CSV...');
  
  const similarityRows = [];
  
  // Create header
  similarityRows.push(['document1_filename', 'document1_topic', 'document1_subtopic', 
                       'document2_filename', 'document2_topic', 'document2_subtopic',
                       'similarity_score', 'same_topic'].join(','));
  
  // Add all similarity pairs (sorted by score)
  for (const sim of similarities) {
    const sameTopic = sim.doc1.topic === sim.doc2.topic ? 'true' : 'false';
    const row = [
      escapeCSV(sim.doc1.filename),
      escapeCSV(sim.doc1.topic),
      escapeCSV(sim.doc1.subtopic),
      escapeCSV(sim.doc2.filename),
      escapeCSV(sim.doc2.topic),
      escapeCSV(sim.doc2.subtopic),
      sim.similarity.toFixed(6),
      sameTopic
    ];
    similarityRows.push(row.join(','));
  }
  
  // Write similarity results CSV
  const similarityContent = similarityRows.join('\n');
  writeFileSync('similarity_results.csv', similarityContent, 'utf-8');
  console.log(`Similarity results exported to similarity_results.csv (${similarities.length} document pairs)`);
}

// Run the analysis
detectTextSimilarities().catch(console.error);
