import { writeFileSync } from 'fs';
import { escapeCSV } from './csv-utils.js';

/**
 * Export embeddings to CSV file
 * @param {Array} documents - Array of document objects with filename, topic, subtopic
 * @param {Array<Array<number>>} vectors - Array of embedding vectors
 * @param {string} filepath - Path to output CSV file
 * @returns {void}
 */
export function exportEmbeddingsToCSV(documents, vectors, filepath = 'embeddings.csv') {
  const csvRows = [];
  
  // Create header row
  if (!vectors || vectors.length === 0) {
    console.log('Warning: No embeddings to export\n');
    return;
  }
  
  if (!vectors[0] || !Array.isArray(vectors[0])) {
    console.log('Warning: Invalid embedding data\n');
    return;
  }
  
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
      ? vector.map((v, idx) => {
          if (typeof v !== 'number' || isNaN(v)) {
            console.warn(`Warning: Invalid value at dimension ${idx} for ${doc.filename}, replacing with 0`);
            return 0;
          }
          return v;
        })
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
  writeFileSync(filepath, csvContent, 'utf-8');
  console.log(`Embeddings exported to ${filepath} (${documents.length} documents, ${embeddingDimensions} dimensions)\n`);
}
