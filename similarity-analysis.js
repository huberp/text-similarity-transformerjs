import { readFileSync, readdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LocalIndex } from 'vectra';

async function analyzeSimilarity() {
  // Helper function to escape CSV fields
  const escapeCSV = (field) => {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
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
  const files = readdirSync(corpusDir)
    .filter(file => file.endsWith('.md'))
    .sort();
  
  console.log(`Found ${files.length} documents in test corpus\n`);
  
  // Read file contents and extract topic information
  const documents = [];
  for (const file of files) {
    const filePath = join(corpusDir, file);
    const content = readFileSync(filePath, 'utf-8');
    
    // Extract topic from markdown
    const topicMatch = content.match(/\*\*Topic:\*\*\s*(.+)/);
    const subtopicMatch = content.match(/\*\*Sub-Topic:\*\*\s*(.+)/);
    
    const topic = topicMatch ? topicMatch[1].trim() : 'Unknown';
    const subtopic = subtopicMatch ? subtopicMatch[1].trim() : 'Unknown';
    
    documents.push({
      filename: file,
      content,
      topic,
      subtopic
    });
  }
  
  // List all items in the index to get vectors
  const allItems = await index.listItems();
  console.log(`Loaded ${allItems.length} embeddings from LocalIndex\n`);
  
  // Create a map of vectors by ID for efficient lookup
  const vectorMap = new Map();
  for (const item of allItems) {
    vectorMap.set(item.metadata.id, item.vector);
  }
  
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
    // Get the pre-computed vector for document i
    const queryVector = vectorMap.get(i);
    
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
analyzeSimilarity().catch(console.error);
