import { writeFileSync } from 'fs';
import { escapeCSV } from './csv-utils.js';

/**
 * Analyze similarity from a LocalIndex and documents
 * @param {LocalIndex} index - Vectra LocalIndex instance
 * @param {Array} documents - Array of document objects with filename, topic, subtopic
 * @param {Map} vectorMap - Map of document ID to vector (for similarity-analysis.js, pass null for vectors)
 * @param {Array} vectors - Array of vectors (for similarity.js, pass null for vectorMap)
 * @returns {Promise<Array>} Array of similarity objects
 */
export async function computePairwiseSimilarities(index, documents, vectorMap = null, vectors = null) {
  // Validate that exactly one of vectorMap or vectors is provided
  if ((vectorMap === null && vectors === null) || (vectorMap !== null && vectors !== null)) {
    throw new Error('Must provide exactly one of vectorMap or vectors, not both or neither');
  }
  
  const similarities = [];
  
  for (let i = 0; i < documents.length; i++) {
    // Get the vector for document i (either from vectorMap or vectors array)
    const queryVector = vectorMap ? vectorMap.get(i) : vectors[i];
    
    if (!queryVector) {
      console.error(`Warning: No vector found for document ${i} (${documents[i].filename})`);
      continue;
    }
    
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
  
  return similarities;
}

/**
 * Print similarity summary to console
 * @param {Array} similarities - Array of similarity objects
 * @param {Array} documents - Array of document objects
 */
export function printSimilaritySummary(similarities, documents) {
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
}

/**
 * Export similarity results to CSV
 * @param {Array} similarities - Array of similarity objects
 * @param {string} outputPath - Path to output CSV file
 */
export function exportSimilarityResultsToCSV(similarities, outputPath) {
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
  writeFileSync(outputPath, similarityContent, 'utf-8');
  console.log(`Similarity results exported to ${outputPath} (${similarities.length} document pairs)`);
}
