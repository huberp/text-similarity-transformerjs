import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Read all markdown files from corpus directory
 * @param {string} corpusDir - Path to corpus directory
 * @returns {Array} Array of document objects with filename, content, topic, subtopic
 */
export function readCorpusDocuments(corpusDir = './test_corpus') {
  const files = readdirSync(corpusDir)
    .filter(file => file.endsWith('.md'))
    .sort();
  
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
  
  return documents;
}
