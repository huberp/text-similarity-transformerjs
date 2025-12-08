# text-similarity-transformerjs

A practical demonstration of text similarity analysis using modern NLP techniques. This repository compares transformer-based embeddings with classical TF-IDF approaches for semantic document similarity.

## Overview

This project helps you understand how different NLP techniques detect semantic similarity between documents. It includes a test corpus of 25 documents across three topics (LLM, Math, Fruit) and provides ready-to-use scripts for:

- **Transformer-based Analysis**: Using state-of-the-art sentence embeddings to find semantically similar documents
- **Classical NLP Analysis**: Using TF-IDF for term-based document comparison
- **Vector Storage**: Local vector databases for efficient similarity search
- **Automated Workflows**: GitHub Actions for continuous analysis and testing

**Perfect for**: Learning about text similarity, comparing NLP approaches, experimenting with embeddings, or building semantic search systems.

## Requirements

- Node.js 20 or higher
- npm

## Quick Start

```bash
# Install dependencies
npm install

# Run transformer-based similarity analysis
npm run similarity

# Run TF-IDF analysis
npm run tfidf

# Build TF-IDF vector store
npm run tfidf-vectors
```

## Test Corpus

The repository includes 25 sample documents (max 400 words each) organized into three topics:

- **LLM** (8 documents): Large Language Models - architecture, prompting, tokenization, RAG, evaluation, etc.
- **Math** (8 documents): Linear algebra, calculus, probability, number theory, graph theory, etc.
- **Fruit** (9 documents): Citrus, berries, tropical fruits, stone fruits, apples, melons, grapes, etc.

See [corpus_index.md](corpus_index.md) for the complete document list.

## Features & Functionality

### 1. Transformer-Based Similarity Analysis

Uses modern deep learning to detect semantic similarity between documents.

**How it works:**
- Loads the [bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5) model (768-dimensional embeddings with 8-bit quantization)
- Generates [sentence embeddings](https://www.geeksforgeeks.org/nlp/what-is-text-embedding/) for each document
- Computes [cosine similarity](https://www.freecodecamp.org/news/how-does-cosine-similarity-work/) between document pairs
- Stores vectors in a local index using [Vectra](https://github.com/Stevenic/vectra)

**Technology:**
- [Transformer.js](https://huggingface.co/docs/transformers.js/index) - Run transformer models in Node.js without a backend
- BGE model - State-of-the-art sentence embeddings from BAAI
- Cosine similarity - Direction-based similarity metric ideal for embeddings

**Run:** `npm run similarity`

**Outputs:**
- Console analysis with top similar pairs and topic-based statistics
- `embeddings.csv` - Document embeddings (filename, topic, subtopic, dim_0...dim_767)
- `similarity_results.csv` - All document pair similarities with scores

### 2. Classical TF-IDF Analysis

Uses traditional NLP to identify distinctive terms in each document.

**How it works:**
- Computes [TF-IDF scores](https://en.wikipedia.org/wiki/Tf%E2%80%93idf) (Term Frequency-Inverse Document Frequency)
- Applies Porter Stemmer for term normalization
- Identifies distinctive terms that characterize each document
- Generates sparse and dense matrix formats

**Technology:**
- tiny-tfidf - Minimal TF-IDF implementation
- natural - Porter Stemmer for term normalization

**Run:** `npm run tfidf`

**Outputs (in `tfidf-data/`):**
- `tf.csv` - Term frequency matrix (wide format)
- `tf_sparse.csv` - Term frequency (sparse format for efficiency)
- `idf.csv` - Inverse document frequency scores
- `document_index.csv` - Document ID mappings
- `term_index.csv` - Term ID mappings
- `term_documents.csv` - Inverted index (term → documents)

### 3. TF-IDF Vector Store

Builds a queryable vector database from TF-IDF data.

**How it works:**
- Reads TF-IDF data from `tfidf-data/`
- Creates normalized TF-IDF vectors for each document (L2 normalization)
- Builds a LocalIndex for similarity queries
- Enables comparison with transformer-based embeddings

**Run:** `npm run tfidf-vectors`

**Outputs:**
- `tfidf-vector-index/` - LocalIndex for similarity search
- `tfidf_vectors.csv` - Normalized TF-IDF vectors

### 4. Split Workflow: Embeddings + Similarity

The repository also supports a two-step workflow for larger projects:

**Step 1:** `npm run embeddings` - Computes and stores embeddings in `vector-index/`  
**Step 2:** `npm run similarity-analysis` - Analyzes pre-computed embeddings

This separation is useful when embeddings are expensive to compute and you want to run multiple analyses.

## Output Files

All scripts generate CSV files for further analysis in Jupyter, Pandas, Excel, or other tools. See [OUTPUT_EXAMPLES.md](OUTPUT_EXAMPLES.md) for detailed usage examples.

### Transformer Analysis Outputs

| File | Description | Format |
|------|-------------|--------|
| `embeddings.csv` | Document embeddings with metadata | `filename, topic, subtopic, dim_0...dim_767` |
| `similarity_results.csv` | Pairwise document similarity scores | `doc1, doc2, score, same_topic` |

### TF-IDF Analysis Outputs

| File | Description | Format |
|------|-------------|--------|
| `tf.csv` | Term frequency matrix | Documents × Terms (wide format) |
| `tf_sparse.csv` | Term frequency (sparse) | `document_id, term_id, frequency` |
| `idf.csv` | IDF scores for all terms | `term, idf_weight, collection_frequency` |
| `document_index.csv` | Document ID mappings | `document_id, filename, topic, subtopic` |
| `term_index.csv` | Term ID mappings | `term_id, term, idf_weight` |
| `term_documents.csv` | Inverted index | `term_id, term, document_ids` |

### TF-IDF Vector Store Outputs

| File | Description | Format |
|------|-------------|--------|
| `tfidf_vectors.csv` | Normalized TF-IDF vectors | `filename, topic, subtopic, term_0...term_N` |

## GitHub Actions Workflows

The repository includes automated workflows for continuous analysis and quality assurance:

### CI Workflow (`000 CI`)

Runs on every push and pull request:
- **Linting**: ESLint code quality checks
- **Security Audit** (PR only): Detects dependency vulnerabilities when `package.json` changes
- **Conditional Testing** (PR only): Runs similarity analysis when relevant files change

### Preprocessing Workflows

Run automatically on push to main branch:

| Workflow | Name | Purpose |
|----------|------|---------|
| `embeddings-vectors.yml` | `010 PREPROC / embeddings-vectors` | Computes and commits embeddings to `vector-index/` |
| `corpus-similarity-analysis.yml` | `011 PREPROC / Corpus Similarity Analysis` | Analyzes pre-computed embeddings |
| `tfidf.yml` | `TF-IDF Analysis` | Generates TF-IDF data files |
| `tfidf-vectors.yml` | `013 PREPROC / TF-IDF Vector Store` | Builds TF-IDF vector index |

### Manual Workflow

| Workflow | Name | Purpose |
|----------|------|---------|
| `text-similarity.yml` | `020 Helper / Manual Text Similarity Analysis` | One-shot embedding + similarity analysis (workflow_dispatch only) |

**Accessing Results**: Download generated CSV files from the "Artifacts" section of workflow runs (90-day retention).

## Project Structure

```
.
├── test_corpus/              # 25 test documents (LLM, Math, Fruit topics)
├── tfidf-data/              # TF-IDF analysis outputs (CSV files)
├── vector-index/            # Transformer embeddings LocalIndex
├── tfidf-vector-index/      # TF-IDF vectors LocalIndex
├── corpus_index.md          # Document catalog with topics/subtopics
├── similarity.js            # Main: embeddings + similarity (one-shot)
├── embeddings.js            # Step 1: compute embeddings only
├── similarity-analysis.js   # Step 2: analyze pre-computed embeddings
├── tfidf.js                 # TF-IDF analysis script
├── tfidf-vectors.js         # TF-IDF vector store builder
├── package.json             # Dependencies and npm scripts
└── .github/workflows/       # CI and automation workflows
```

## Learning Resources

Want to learn more about the techniques used?

- **Text Embeddings**: [What is Text Embedding?](https://www.geeksforgeeks.org/nlp/what-is-text-embedding/) - Introduction to vector representations of text
- **TF-IDF**: [Understanding TF-IDF](https://en.wikipedia.org/wiki/Tf%E2%80%93idf) - Classical term weighting for information retrieval
- **Cosine Similarity**: [How Does Cosine Similarity Work?](https://www.freecodecamp.org/news/how-does-cosine-similarity-work/) - Mathematical explanation for comparing vectors
- **Transformer.js**: [Official Documentation](https://huggingface.co/docs/transformers.js/index) - Run transformer models in JavaScript
- **BGE Model**: [bge-base-en-v1.5](https://huggingface.co/BAAI/bge-base-en-v1.5) - State-of-the-art sentence embeddings from BAAI
- **Vectra**: [GitHub Repository](https://github.com/Stevenic/vectra) - Local vector database for Node.js

## Contributing

This project uses labels to categorize issues and PRs:

- **bug** - Something isn't working
- **enhancement** - New features or improvements  
- **documentation** - Documentation updates
- **good first issue** - Good for newcomers
- **help wanted** - Extra attention needed
- **question** - Further information requested
- **dependencies** - Dependency updates

## License

MIT
