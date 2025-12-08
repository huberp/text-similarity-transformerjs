# Library Functions

This directory contains reusable utility functions for text similarity analysis.

## Modules

### `corpus-loader.js`

Functions for reading and parsing corpus documents.

**Functions:**
- `readCorpusDocuments(corpusDir)` - Read all markdown files from corpus directory with metadata

### `csv-utils.js`

CSV formatting utilities.

**Functions:**
- `escapeCSV(field)` - Escape CSV fields to handle special characters

### `embeddings.js`

Transformer-based embedding utilities.

**Functions:**
- `getEmbeddingModel()` - Get or create cached embedding model pipeline
- `computeEmbedding(text)` - Compute embedding vector for input text

### `stemming.js`

Text preprocessing and stemming utilities.

**Functions:**
- `stemText(text)` - Apply Porter Stemmer to text (matching tiny-tfidf's processing)

### `tfidf-vector.js`

TF-IDF vector creation utilities.

**Functions:**
- `createTFIDFVector(text, tfidfDataDir)` - Create normalized TF-IDF vector for input text
  - Returns: `{ vector, foundTerms, stemmedText, totalTerms }`

## Usage Examples

### Computing an embedding

```javascript
import { computeEmbedding } from './lib/embeddings.js';

const embedding = await computeEmbedding("What is linear algebra?");
console.log(`Embedding dimension: ${embedding.length}`);
```

### Creating a TF-IDF vector

```javascript
import { createTFIDFVector } from './lib/tfidf-vector.js';

const result = createTFIDFVector("What is linear algebra?", './tfidf-data');
console.log(`Stemmed: ${result.stemmedText}`);
console.log(`Known terms: ${result.foundTerms.length}`);
```

### Loading corpus documents

```javascript
import { readCorpusDocuments } from './lib/corpus-loader.js';

const documents = readCorpusDocuments('./test_corpus');
console.log(`Loaded ${documents.length} documents`);
```

### Stemming text

```javascript
import { stemText } from './lib/stemming.js';

const stemmed = stemText("calculating derivatives and integrals");
console.log(stemmed); // "calcul deriv and integr"
```
