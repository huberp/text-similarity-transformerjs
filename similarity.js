import { pipeline } from '@xenova/transformers';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { LocalIndex } from 'vectra';

async function detectTextSimilarities() {
  console.log('Loading embedding model...');
  
  // Use a sentence embedding model for text similarity
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  console.log('Model loaded successfully!\n');
  
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
  
  console.log('Computing embeddings for all documents...');
  
  // Initialize Vectra LocalIndex
  const index = new LocalIndex('./vector-index');
  
  // Check if index exists, if not create it
  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }
  
  // Generate embeddings and store them in the index
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const output = await extractor(doc.content, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    
    // Store vector with metadata in LocalIndex
    await index.insertItem({
      vector,
      metadata: {
        id: i,
        filename: doc.filename,
        topic: doc.topic,
        subtopic: doc.subtopic
      }
    });
  }
  
  console.log('Embeddings computed and stored in index successfully!\n');
  
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
    // Get the vector for document i by querying with its own embedding
    const docOutput = await extractor(documents[i].content, { pooling: 'mean', normalize: true });
    const queryVector = Array.from(docOutput.data);
    
    // Query similar items (will include itself)
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
}

// Run the analysis
detectTextSimilarities().catch(console.error);
