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

# Build the vector stores (required for query tool)
npm run tfidf                # Generate TF-IDF data
npm run tfidf-vectors        # Build TF-IDF vector store
npm run embeddings           # Build embedding vector store (optional - requires network)

# Interactive Query Tool (recommended for exploring the corpus)
npm run query

# Or run individual analyses
npm run similarity           # Run transformer-based similarity analysis
```

## Model Caching

The transformer models are **automatically cached** to disk to avoid re-downloading on each run.

### Cache Location

By default, models are cached in `./.cache/transformers` (project-local directory). You can customize the cache location using the `TRANSFORMERS_CACHE_DIR` environment variable:

```bash
# Use a custom cache directory
TRANSFORMERS_CACHE_DIR=/path/to/cache npm run embeddings

# Use a shared cache across multiple projects
TRANSFORMERS_CACHE_DIR=~/.cache/transformers npm run embeddings
```

### How It Works

- **First run**: Downloads the model from HuggingFace (~300MB for bge-base-en-v1.5 with 8-bit quantization)
- **Subsequent runs**: Reuses the cached model (no download needed)
- **In-memory caching**: The pipeline is also cached in memory for the lifetime of the Node process
- **GitHub Actions**: Workflows use GitHub Actions cache to persist models between runs, significantly speeding up CI

### Clearing the Cache

To force re-download of models (e.g., to get model updates):

```bash
# Remove the cache directory
rm -rf ./.cache/transformers

# Or remove a custom cache location
rm -rf /path/to/your/cache
```

### Offline Usage

After the initial download, you can run the tools offline as long as the cache directory is intact.

## Test Corpus

The repository includes 25 sample documents (max 400 words each) organized into three topics:

- **LLM** (8 documents): Large Language Models - architecture, prompting, tokenization, RAG, evaluation, etc.
- **Math** (8 documents): Linear algebra, calculus, probability, number theory, graph theory, etc.
- **Fruit** (9 documents): Citrus, berries, tropical fruits, stone fruits, apples, melons, grapes, etc.

See [corpus_index.md](corpus_index.md) for the complete document list.

## Features & Functionality

### 1. Interactive Query Tool

**NEW!** Search for similar documents using your own sentences.

**How it works:**
- Enter any sentence interactively
- The tool automatically:
  1. Computes transformer-based embedding and searches the embedding vector store
  2. Stems the sentence, creates a TF-IDF vector, and searches the TF-IDF vector store
- Compare results from both approaches side-by-side
- Shows found terms, weights, and top matching documents

**Technology:**
- Reusable library functions for embeddings, stemming, and TF-IDF vector creation
- LocalIndex queries for both vector stores

**Run:** `npm run query`

**Requirements:**
- Run `npm run embeddings` first to create the embedding vector store
- Run `npm run tfidf` and `npm run tfidf-vectors` to create the TF-IDF vector store

**Example queries:**
- "What are the properties of matrices in linear algebra?"
- "How do I calculate derivatives and integrals?"
- "Tell me about citrus fruits like oranges and lemons"
- "What is a large language model and how does it work?"

### 2. Transformer-Based Similarity Analysis

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

### 3. Classical TF-IDF Analysis

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

### 4. TF-IDF Vector Store

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

### 5. Split Workflow: Embeddings + Similarity

The repository also supports a two-step workflow for larger projects:

**Step 1:** `npm run embeddings` - Computes and stores embeddings in `vector-index/`  
**Step 2:** `npm run similarity-analysis` - Analyzes pre-computed embeddings

This separation is useful when embeddings are expensive to compute and you want to run multiple analyses.

## Output Files

All scripts generate CSV files for further analysis in Jupyter, Pandas, Excel, or other tools.

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

### Workflow Architecture

The workflows use a **two-tier architecture** with separate data preparation and data consumption stages:

#### Data Preparation Workflows (Generate & Persist)

These workflows compute intermediate results and store them in GitHub Releases for indefinite persistence:

| Workflow | Name | Purpose | Release Asset |
|----------|------|---------|---------------|
| `embeddings-vectors.yml` | `010 PREPROC / embeddings-vectors` | Computes embeddings and creates LocalIndex | `vector-index.zip` |
| `tfidf.yml` | `TF-IDF Analysis` | Generates TF-IDF data files | `tfidf-data.zip` |

**Release Storage:**
- Assets are uploaded to GitHub Release tagged `data-latest` (always current)
- Each run also creates a versioned tag: `data-v<YYYYMMDD-HHMMSS>`
- Persists indefinitely (no 90-day expiration like artifacts)

#### Data Consumption Workflows (Download & Process)

These workflows download intermediate data from releases and perform analysis:

| Workflow | Name | Purpose | Required Asset |
|----------|------|---------|----------------|
| `corpus-similarity-analysis.yml` | `011 PREPROC / Corpus Similarity Analysis` | Analyzes pre-computed embeddings | `vector-index.zip` |
| `tfidf-vectors.yml` | `013 PREPROC / TF-IDF Vector Store` | Builds TF-IDF vector index | `tfidf-data.zip` |

**Important:** Data consumption workflows will fail with a clear error message if the required release assets don't exist. You must run the corresponding preparation workflow first.

### Manual Workflow

| Workflow | Name | Purpose |
|----------|------|---------|
| `text-similarity.yml` | `020 Helper / Manual Text Similarity Analysis` | One-shot embedding + similarity analysis (workflow_dispatch only) |

### Accessing Results

- **Intermediate Data**: Available in GitHub Releases (tag `data-latest`)
- **Analysis Outputs**: Download CSV files from the "Artifacts" section of workflow runs (90-day retention)

## Project Structure

```
.
├── lib/                     # Shared library functions
│   ├── corpus-loader.js     # Corpus document reading utilities
│   ├── csv-utils.js         # CSV formatting helpers
│   ├── embeddings.js        # Embedding model and computation
│   ├── stemming.js          # Text stemming with Porter Stemmer
│   └── tfidf-vector.js      # TF-IDF vector creation
├── test_corpus/             # 25 test documents (LLM, Math, Fruit topics)
├── tfidf-data/              # TF-IDF analysis outputs (generated locally, not in repo)
├── vector-index/            # Transformer embeddings LocalIndex (generated locally, not in repo)
├── tfidf-vector-index/      # TF-IDF vectors LocalIndex (generated locally)
├── corpus_index.md          # Document catalog with topics/subtopics
├── query.js                 # Interactive query tool (NEW!)
├── similarity.js            # Main: embeddings + similarity (one-shot)
├── embeddings.js            # Step 1: compute embeddings only
├── similarity-analysis.js   # Step 2: analyze pre-computed embeddings
├── tfidf.js                 # TF-IDF analysis script
├── tfidf-vectors.js         # TF-IDF vector store builder
├── package.json             # Dependencies and npm scripts
└── .github/workflows/       # CI and automation workflows
```

**Note:** The `vector-index/` and `tfidf-data/` directories are generated by scripts and excluded from git. In CI/CD workflows, these directories are stored in GitHub Releases as zip archives for persistent, cross-workflow access.

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
