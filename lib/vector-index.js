import { LocalIndex } from 'vectra';

/**
 * Create or open a LocalIndex at the specified path
 * @param {string} indexPath - Path to the vector index directory
 * @returns {Promise<LocalIndex>} Initialized LocalIndex instance
 */
export async function createOrOpenIndex(indexPath) {
  const index = new LocalIndex(indexPath);
  
  // Check if index exists, if not create it
  if (!(await index.isIndexCreated())) {
    await index.createIndex();
  }
  
  return index;
}

/**
 * Insert document embeddings into the index
 * @param {LocalIndex} index - Vector index instance
 * @param {Array} documents - Array of document objects with filename, topic, subtopic
 * @param {Array<Array<number>>} vectors - Array of embedding vectors
 * @returns {Promise<void>}
 */
export async function insertDocumentEmbeddings(index, documents, vectors) {
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const vector = vectors[i];
    
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
}
