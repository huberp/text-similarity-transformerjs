import { Corpus } from 'tiny-tfidf';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import natural from 'natural';

// Constants for CSV formatting
const IDF_DECIMAL_PLACES = 6;

// Function to preprocess text with stemming
function stemText(text) {
  // Use the same tokenization pattern as tiny-tfidf's Document class
  const matches = text.match(/[a-zA-ZÀ-ÖØ-öø-ÿ0-9]+/g);
  if (!matches) return '';
  
  const stemmedWords = matches
    .map(word => word.toLowerCase())
    .filter(word => {
      // Apply same filtering as tiny-tfidf Document class
      if (word.length < 2 && !['i', 'a'].includes(word)) {
        return false;
      }
      if (word.match(/^\d+$/)) {
        return false;
      }
      return true;
    })
    .map(word => {
      try {
        return natural.PorterStemmer.stem(word);
      } catch (error) {
        // If stemming fails for any reason, return the original word
        console.warn(`Warning: Failed to stem word "${word}":`, error.message);
        return word;
      }
    });
  
  // Join stemmed words back into a string
  return stemmedWords.join(' ');
}

function computeTFIDF() {
  // Helper function to escape CSV fields
  const escapeCSV = (field) => {
    if (field == null) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  console.log('='.repeat(80));
  console.log('TF-IDF ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  // Read all markdown files from test_corpus directory
  const corpusDir = './test_corpus';
  const files = readdirSync(corpusDir)
    .filter(file => file.endsWith('.md'))
    .sort();
  
  console.log(`Found ${files.length} documents in test corpus\n`);
  
  // Read file contents and extract topic information
  const documents = [];
  const documentNames = [];
  const documentTexts = [];
  
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
    
    documentNames.push(file);
    // Apply stemming to document text before adding to corpus
    documentTexts.push(stemText(content));
  }
  
  console.log('Computing TF-IDF scores for all documents...');
  console.log('Note: Using Porter Stemmer for term normalization\n');
  
  // Create corpus using tiny-tfidf with BM25 weighting scheme
  // K1: Controls term frequency saturation (higher = more influence from term frequency)
  // b: Controls document length normalization (0-1; 1 = penalize long docs, 0 = ignore length)
  const corpus = new Corpus(documentNames, documentTexts, {
    useDefaultStopwords: true,
    customStopwords: [],
    K1: 2.0,
    b: 0.75
  });
  
  console.log('TF-IDF computation complete!\n');
  
  // Get all terms in the corpus
  const allTerms = corpus.getTerms();
  console.log(`Total unique terms (excluding stopwords): ${allTerms.length}\n`);
  
  // Export TF (Term Frequency) scores to CSV
  console.log('Generating TF (Term Frequency) CSV report...');
  
  const tfRows = [];
  
  // Create header row: document, topic, subtopic, term1, term2, ..., termN
  const tfHeader = ['document', 'topic', 'subtopic', ...allTerms];
  tfRows.push(tfHeader.map(escapeCSV).join(','));
  
  // Add data rows - one row per document
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const docName = documentNames[i];
    const docObj = corpus.getDocument(docName);
    
    const row = [doc.filename, doc.topic, doc.subtopic];
    
    // Add term frequency for each term in the corpus
    for (const term of allTerms) {
      const tf = docObj.getTermFrequency(term);
      row.push(tf);
    }
    
    tfRows.push(row.map(escapeCSV).join(','));
  }
  
  // Write TF CSV file
  const tfContent = tfRows.join('\n');
  writeFileSync('tf.csv', tfContent, 'utf-8');
  console.log(`TF report exported to tf.csv (${documents.length} documents, ${allTerms.length} terms)\n`);
  
  // Export IDF (Inverse Document Frequency) scores to CSV
  console.log('Generating IDF (Inverse Document Frequency) CSV report...');
  
  const idfRows = [];
  
  // Create header row: term, idf_weight, collection_frequency
  idfRows.push(['term', 'idf_weight', 'collection_frequency'].map(escapeCSV).join(','));
  
  // Collect all IDF data and sort by idf_weight (descending)
  const idfData = [];
  for (const term of allTerms) {
    const idfWeight = corpus.getCollectionFrequencyWeight(term);
    const collectionFreq = corpus.getCollectionFrequency(term);
    idfData.push({ term, idfWeight, collectionFreq });
  }
  
  // Sort by idf_weight in descending order (most distinctive terms first)
  idfData.sort((a, b) => b.idfWeight - a.idfWeight);
  
  // Add sorted data rows - one row per term
  for (const { term, idfWeight, collectionFreq } of idfData) {
    const row = [term, idfWeight.toFixed(IDF_DECIMAL_PLACES), collectionFreq];
    idfRows.push(row.map(escapeCSV).join(','));
  }
  
  // Write IDF CSV file
  const idfContent = idfRows.join('\n');
  writeFileSync('idf.csv', idfContent, 'utf-8');
  console.log(`IDF report exported to idf.csv (${allTerms.length} terms, sorted by idf_weight)\n`);
  
  // Export Document Index CSV
  console.log('Generating Document Index CSV...');
  
  const docIndexRows = [];
  docIndexRows.push(['document_id', 'document', 'topic', 'subtopic'].map(escapeCSV).join(','));
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    const row = [i, doc.filename, doc.topic, doc.subtopic];
    docIndexRows.push(row.map(escapeCSV).join(','));
  }
  
  const docIndexContent = docIndexRows.join('\n');
  writeFileSync('document_index.csv', docIndexContent, 'utf-8');
  console.log(`Document index exported to document_index.csv (${documents.length} documents)\n`);
  
  // Export Term Index CSV (using sorted idfData order)
  console.log('Generating Term Index CSV...');
  
  const termIndexRows = [];
  termIndexRows.push(['term_id', 'term', 'idf_weight', 'collection_frequency'].map(escapeCSV).join(','));
  
  for (let i = 0; i < idfData.length; i++) {
    const { term, idfWeight, collectionFreq } = idfData[i];
    const row = [i, term, idfWeight.toFixed(IDF_DECIMAL_PLACES), collectionFreq];
    termIndexRows.push(row.map(escapeCSV).join(','));
  }
  
  const termIndexContent = termIndexRows.join('\n');
  writeFileSync('term_index.csv', termIndexContent, 'utf-8');
  console.log(`Term index exported to term_index.csv (${idfData.length} terms)\n`);
  
  // Export Term-Documents Inverted Index CSV
  console.log('Generating Term-Documents Inverted Index CSV...');
  
  const termDocsRows = [];
  termDocsRows.push(['term_id', 'term', 'document_ids'].map(escapeCSV).join(','));
  
  // Pre-load all document objects for performance
  const documentObjects = documents.map((_, i) => corpus.getDocument(documentNames[i]));
  
  // Build inverted index: for each term, find all documents containing it
  for (let termId = 0; termId < idfData.length; termId++) {
    const { term } = idfData[termId];
    const docIds = [];
    
    for (let docId = 0; docId < documents.length; docId++) {
      const tf = documentObjects[docId].getTermFrequency(term);
      
      if (tf > 0) {
        docIds.push(docId);
      }
    }
    
    const row = [termId, term, docIds.join(';')];
    termDocsRows.push(row.map(escapeCSV).join(','));
  }
  
  const termDocsContent = termDocsRows.join('\n');
  writeFileSync('term_documents.csv', termDocsContent, 'utf-8');
  console.log(`Term-documents inverted index exported to term_documents.csv (${idfData.length} terms)\n`);
  
  // Export TF in sparse format (document_id, term_id, frequency)
  console.log('Generating TF Sparse Format CSV...');
  
  const tfSparseRows = [];
  tfSparseRows.push(['document_id', 'term_id', 'frequency'].map(escapeCSV).join(','));
  
  // Create a term to termId mapping for quick lookup
  const termToId = new Map();
  for (let i = 0; i < idfData.length; i++) {
    termToId.set(idfData[i].term, i);
  }
  
  for (let docId = 0; docId < documents.length; docId++) {
    const docObj = documentObjects[docId];
    
    // Get only the unique terms that actually appear in this document
    const uniqueTerms = docObj.getUniqueTerms();
    for (const term of uniqueTerms) {
      const termId = termToId.get(term);
      // Skip terms not in our filtered vocabulary (stopwords, etc.)
      if (termId !== undefined) {
        const tf = docObj.getTermFrequency(term);
        const row = [docId, termId, tf];
        tfSparseRows.push(row.map(escapeCSV).join(','));
      }
    }
  }
  
  const tfSparseContent = tfSparseRows.join('\n');
  writeFileSync('tf_sparse.csv', tfSparseContent, 'utf-8');
  console.log(`TF sparse format exported to tf_sparse.csv (more efficient for large corpora)\n`);
  
  // Display some statistics
  console.log('='.repeat(80));
  console.log('TF-IDF STATISTICS');
  console.log('='.repeat(80));
  console.log();
  
  // Show top terms for each document
  console.log('Top 10 terms for each document:');
  console.log('-'.repeat(80));
  for (const docName of documentNames) {
    const topTerms = corpus.getTopTermsForDocument(docName, 10);
    const doc = documents.find(d => d.filename === docName);
    console.log(`\n${docName} (${doc.topic}/${doc.subtopic}):`);
    topTerms.forEach(([term, weight], idx) => {
      console.log(`  ${idx + 1}. ${term}: ${weight.toFixed(4)}`);
    });
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log('Analysis complete!');
  console.log('='.repeat(80));
  console.log('\nGenerated files:');
  console.log('  - tf.csv: Term frequency matrix (wide format, one row per document)');
  console.log('  - tf_sparse.csv: Term frequency in sparse format (document_id, term_id, frequency)');
  console.log('  - idf.csv: Inverse document frequency scores (sorted by idf_weight)');
  console.log('  - document_index.csv: Document ID to filename mapping');
  console.log('  - term_index.csv: Term ID to term mapping (sorted by idf_weight)');
  console.log('  - term_documents.csv: Inverted index showing which documents contain each term');
}

// Run the analysis
try {
  computeTFIDF();
} catch (error) {
  console.error(error);
}
