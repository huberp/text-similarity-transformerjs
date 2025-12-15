import { Corpus } from 'tiny-tfidf';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { stemText } from './lib/stemming.js';
import { readCorpusDocuments } from './lib/corpus-loader.js';
import { escapeCSV } from './lib/csv-utils.js';

// Constants for CSV formatting
const IDF_DECIMAL_PLACES = 6;
const OUTPUT_DIR = './tfidf-data';

function computeTFIDF() {
  
  console.log('='.repeat(80));
  console.log('TF-IDF ANALYSIS');
  console.log('='.repeat(80));
  console.log();
  
  // Create output directory if it doesn't exist
  mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Output directory: ${OUTPUT_DIR}\n`);
  
  // Read all markdown files from test_corpus directory
  const corpusDir = './test_corpus';
  const documents = readCorpusDocuments(corpusDir);
  
  console.log(`Found ${documents.length} documents in test corpus\n`);
  
  // Prepare arrays for tiny-tfidf
  const documentNames = [];
  const documentTexts = [];
  
  for (const doc of documents) {
    documentNames.push(doc.filename);
    // Apply stemming to document text before adding to corpus
    documentTexts.push(stemText(doc.content));
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
  const tfPath = join(OUTPUT_DIR, 'tf.csv');
  writeFileSync(tfPath, tfContent, 'utf-8');
  console.log(`TF report exported to ${tfPath} (${documents.length} documents, ${allTerms.length} terms)\n`);
  
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
  const idfPath = join(OUTPUT_DIR, 'idf.csv');
  writeFileSync(idfPath, idfContent, 'utf-8');
  console.log(`IDF report exported to ${idfPath} (${allTerms.length} terms, sorted by idf_weight)\n`);
  
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
  const docIndexPath = join(OUTPUT_DIR, 'document_index.csv');
  writeFileSync(docIndexPath, docIndexContent, 'utf-8');
  console.log(`Document index exported to ${docIndexPath} (${documents.length} documents)\n`);
  
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
  const termIndexPath = join(OUTPUT_DIR, 'term_index.csv');
  writeFileSync(termIndexPath, termIndexContent, 'utf-8');
  console.log(`Term index exported to ${termIndexPath} (${idfData.length} terms)\n`);
  
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
  const termDocsPath = join(OUTPUT_DIR, 'term_documents.csv');
  writeFileSync(termDocsPath, termDocsContent, 'utf-8');
  console.log(`Term-documents inverted index exported to ${termDocsPath} (${idfData.length} terms)\n`);
  
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
  const tfSparsePath = join(OUTPUT_DIR, 'tf_sparse.csv');
  writeFileSync(tfSparsePath, tfSparseContent, 'utf-8');
  console.log(`TF sparse format exported to ${tfSparsePath} (more efficient for large corpora)\n`);
  
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
  console.log(`\nGenerated files in ${OUTPUT_DIR}:`);
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
