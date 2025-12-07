# text-similarity-transformerjs

A GitHub repository demonstrating text similarity analysis using Transformer.js. This project uses embeddings from transformer models to detect similarities between documents in a test corpus.

## Overview

This repository contains:
- **Test Corpus**: 25 markdown documents across 3 topics (Math, Fruit, LLM)
- **Corpus Index**: A table listing all documents with their topics and subtopics
- **Similarity Script**: Node.js script using Transformer.js to compute document similarities
- **GitHub Workflow**: Automated workflow that runs similarity analysis

## Test Corpus

The test corpus contains 25 short text documents (max 400 words each) organized by topic:

- **LLM** (8 documents): Documents about Large Language Models covering various subtopics like architecture, prompting, tokenization, RAG, evaluation, constraints, learning paradigms, and safety
- **Math** (8 documents): Mathematical topics including linear algebra, calculus, probability, number theory, graph theory, statistics, geometry, and discrete mathematics  
- **Fruit** (9 documents): Various fruit categories including citrus, berries, tropical fruits, stone fruits, apples, melons, grapes, exotic varieties, and pomegranates

See [corpus_index.md](corpus_index.md) for the complete list with topics and subtopics.

## How It Works

The similarity analysis uses:
1. **Transformer.js** (`@xenova/transformers`) - Run transformer models in Node.js
2. **Sentence Embeddings** - Uses the `all-MiniLM-L6-v2` model to generate embeddings
3. **Cosine Similarity** - Computes similarity scores between document embeddings

The script analyzes:
- Top most similar document pairs
- Average similarity within each topic
- Average similarity across different topics

## Installation

```bash
npm install
```

## Usage

Run the similarity analysis locally:

```bash
npm run similarity
```

The script will:
1. Load the embedding model
2. Read all documents from the test_corpus directory
3. Generate embeddings for each document
4. Calculate similarity scores between all document pairs
5. Display analysis results including top similar pairs and topic-based statistics

## GitHub Workflow

The repository includes a GitHub Actions workflow (`.github/workflows/text-similarity.yml`) that automatically runs the similarity analysis on:
- Push to main/master branch
- Pull requests
- Manual trigger (workflow_dispatch)

## Project Structure

```
.
├── test_corpus/           # Test documents organized by topic
│   ├── llm_01.md         # LLM documents
│   ├── math_01.md        # Math documents
│   └── fruit_01.md       # Fruit documents
├── corpus_index.md        # Table of all documents
├── similarity.js          # Main similarity analysis script
├── package.json          # Node.js dependencies
└── .github/
    └── workflows/
        └── text-similarity.yml  # GitHub Actions workflow
```

## Requirements

- Node.js 20 or higher
- npm

## Contributing

This project uses the following labels to categorize issues and pull requests:

- **bug** - Something isn't working correctly
- **enhancement** - New feature or improvement request
- **documentation** - Improvements or additions to documentation
- **good first issue** - Good for newcomers to the project
- **help wanted** - Extra attention is needed
- **question** - Further information is requested
- **dependencies** - Updates to project dependencies

## License

MIT
