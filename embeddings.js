import { pipeline } from '@xenova/transformers';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { LocalIndex } from 'vectra';

async function computeEmbeddings() {
  // Helper function to escape CSV fields
  const escapeCSV = (field) => {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  console.log('Loading embedding model...');
  
  // Use a sentence embedding model for text similarity
  const extractor = await pipeline('feature-extraction', 'Xenova/bge-base-en-v1.5', {
    dtype: 'q8'
  });
  
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
  // Also keep vectors in memory for export
  const vectors = [];
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const output = await extractor(doc.content, { pooling: 'mean', normalize: true });
    const vector = Array.from(output.data);
    vectors.push(vector);
    
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
  
  // Export embeddings to CSV
  console.log('Exporting embeddings to CSV...');
  
  const csvRows = [];
  
  // Create header row
  if (!vectors || vectors.length === 0) {
    console.log('Warning: No embeddings to export\n');
  } else if (!vectors[0] || !Array.isArray(vectors[0])) {
    console.log('Warning: Invalid embedding data\n');
  } else {
    const embeddingDimensions = vectors[0].length;
    const headerColumns = ['filename', 'topic', 'subtopic'];
    for (let i = 0; i < embeddingDimensions; i++) {
      headerColumns.push(`dim_${i}`);
    }
    csvRows.push(headerColumns.join(','));
    
    // Add data rows
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      const vector = vectors[i];
      // Ensure vector values are numeric
      const numericVector = Array.isArray(vector) 
        ? vector.map(v => (typeof v === 'number' && !isNaN(v)) ? v : 0)
        : [];
      const row = [
        escapeCSV(doc.filename),
        escapeCSV(doc.topic),
        escapeCSV(doc.subtopic),
        ...numericVector
      ];
      csvRows.push(row.join(','));
    }
    
    // Write CSV file
    const csvContent = csvRows.join('\n');
    writeFileSync('embeddings.csv', csvContent, 'utf-8');
    console.log(`Embeddings exported to embeddings.csv (${documents.length} documents, ${embeddingDimensions} dimensions)\n`);
  }
  
  console.log('='.repeat(80));
  console.log('EMBEDDINGS COMPUTATION COMPLETE');
  console.log('='.repeat(80));
  console.log();
  console.log(`LocalIndex stored at: ./vector-index/`);
  console.log(`Ready for similarity analysis!`);
}

// Run the embeddings computation
computeEmbeddings().catch(console.error);
