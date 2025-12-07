import { Corpus } from 'tiny-tfidf';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Constants for CSV formatting
const IDF_DECIMAL_PLACES = 6;

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
    documentTexts.push(content);
  }
  
  console.log('Computing TF-IDF scores for all documents...');
  
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
  
  // Add data rows - one row per term
  for (const term of allTerms) {
    const idfWeight = corpus.getCollectionFrequencyWeight(term);
    const collectionFreq = corpus.getCollectionFrequency(term);
    
    const row = [term, idfWeight.toFixed(IDF_DECIMAL_PLACES), collectionFreq];
    idfRows.push(row.map(escapeCSV).join(','));
  }
  
  // Write IDF CSV file
  const idfContent = idfRows.join('\n');
  writeFileSync('idf.csv', idfContent, 'utf-8');
  console.log(`IDF report exported to idf.csv (${allTerms.length} terms)\n`);
  
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
  console.log('  - tf.csv: Term frequency matrix');
  console.log('  - idf.csv: Inverse document frequency scores');
}

// Run the analysis
try {
  computeTFIDF();
} catch (error) {
  console.error(error);
}
