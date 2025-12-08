# Query Tool Examples

This document shows examples of using the interactive query tool to search for similar documents.

## Prerequisites

Before using the query tool, build the required vector stores:

```bash
npm run tfidf          # Generate TF-IDF data
npm run tfidf-vectors  # Build TF-IDF vector store
npm run embeddings     # Build embedding vector store (optional)
```

## Running the Query Tool

Start the interactive query tool:

```bash
npm run query
```

The tool will prompt you to enter sentences. It searches using both approaches:
1. **Transformer Embeddings** - Deep learning based semantic similarity
2. **TF-IDF Vectors** - Classical term-based similarity

Type `quit` to exit.

## Example Queries and Results

### Example 1: Math Query - Linear Algebra

**Query:** `"What are the properties of matrices in linear algebra?"`

**TF-IDF Results:**
```
Stemmed: "what ar the properti of matric in linear algebra"
Total terms: 9
Known terms found: 5

Found terms with TF-IDF weights:
  - matric: TF=1, IDF=3.2581, TF-IDF=3.2581
  - linear: TF=1, IDF=2.5649, TF-IDF=2.5649
  - algebra: TF=1, IDF=2.1595, TF-IDF=2.1595
  - properti: TF=1, IDF=1.8718, TF-IDF=1.8718
  - ar: TF=1, IDF=0.9555, TF-IDF=0.9555

Top 5 similar documents:
  1. [46.84%] math_01.md (Math/Linear Algebra)
  2. [7.26%] math_07.md (Math/Geometry)
  3. [4.63%] math_08.md (Math/Discrete Math)
  4. [3.16%] math_06.md (Math/Statistics)
  5. [2.68%] math_05.md (Math/Graph Theory)
```

**Key Insights:**
- The query successfully identified key terms: "matric" (matrices), "linear", "algebra"
- TF-IDF weighted "matric" highest because it's most distinctive
- Top result is math_01.md (Linear Algebra) with 46.84% similarity
- Other math topics also matched but with lower scores

### Example 2: Math Query - Calculus

**Query:** `"How do I calculate derivatives and integrals?"`

**TF-IDF Results:**
```
Stemmed: "how do i calcul deriv and integr"
Total terms: 7
Known terms found: 1

Found terms with TF-IDF weights:
  - deriv: TF=1, IDF=2.5649, TF-IDF=2.5649

Top 5 similar documents:
  1. [44.36%] math_02.md (Math/Calculus)
  2. [6.70%] math_08.md (Math/Discrete Math)
  3. [0.00%] (other documents with no matching terms)
```

**Key Insights:**
- Only found "deriv" (derivatives) as a known term
- "integr" (integrals) wasn't in the vocabulary (might appear as different form)
- Still correctly identified math_02.md (Calculus) as top match with 44.36%
- Shows TF-IDF can work well even with partial term matches

### Example 3: Fruit Query

**Query:** `"Tell me about citrus fruits like oranges and lemons"`

**TF-IDF Results:**
```
Stemmed: "tell me about citru fruit like orang and lemon"
Total terms: 9
Known terms found: 5

Found terms with TF-IDF weights:
  - citru: TF=1, IDF=3.2581, TF-IDF=3.2581
  - lemon: TF=1, IDF=3.2581, TF-IDF=3.2581
  - orang: TF=1, IDF=1.8718, TF-IDF=1.8718
  - fruit: TF=1, IDF=1.0609, TF-IDF=1.0609
  - like: TF=1, IDF=1.0609, TF-IDF=1.0609

Top 5 similar documents:
  1. [61.62%] fruit_01.md (Fruit/Citrus)
  2. [11.01%] fruit_03.md (Fruit/Tropical)
  3. [9.94%] fruit_04.md (Fruit/Stone Fruits)
  4. [6.77%] fruit_08.md (Fruit/Exotic Varieties)
  5. [2.48%] fruit_06.md (Fruit/Melons)
```

**Key Insights:**
- Very high match (61.62%) for fruit_01.md (Citrus)
- Found specific terms: "citru", "lemon", "orang"
- Distinctive terms (citru, lemon) have high IDF weights
- Generic term "fruit" has lower IDF weight (appears in many docs)

### Example 4: LLM Query

**Query:** `"What is a large language model and how does it work?"`

**TF-IDF Results:**
```
Stemmed: "what is a larg languag model and how doe it work"
Total terms: 11
Known terms found: 4

Found terms with TF-IDF weights:
  - work: TF=1, IDF=2.1595, TF-IDF=2.1595
  - languag: TF=1, IDF=1.1787, TF-IDF=1.1787
  - larg: TF=1, IDF=0.8602, TF-IDF=0.8602
  - model: TF=1, IDF=0.8602, TF-IDF=0.8602

Top 5 similar documents:
  1. [10.17%] llm_06.md (LLM/Model Constraints)
  2. [9.47%] llm_01.md (LLM/Model Architecture)
  3. [9.23%] llm_04.md (LLM/RAG Systems)
  4. [7.00%] llm_05.md (LLM/Performance Assessment)
  5. [6.82%] llm_08.md (LLM/AI Safety)
```

**Key Insights:**
- Found 4 known terms from the LLM domain
- Matches are more evenly distributed (10-7%) across LLM documents
- "work" has highest IDF weight (more distinctive)
- "model" and "larg" are common across corpus (lower IDF)

## How the Query Tool Works

### TF-IDF Search Process

1. **Stemming**: Input sentence is stemmed using Porter Stemmer
   - "calculating" → "calcul"
   - "derivatives" → "deriv"
   - "matrices" → "matric"

2. **Term Matching**: Stemmed terms are looked up in the vocabulary
   - Only terms that appear in the corpus are used
   - Unknown terms are ignored

3. **Vector Creation**: TF-IDF vector is created
   - TF (Term Frequency): Count of each term in the query
   - IDF (Inverse Document Frequency): Pre-computed from corpus
   - TF-IDF = TF × IDF for each term

4. **Normalization**: Vector is L2-normalized to unit length

5. **Similarity Search**: Cosine similarity with all corpus documents
   - Uses LocalIndex for efficient search
   - Returns top N most similar documents

### Embedding Search Process

1. **Embedding Generation**: Input sentence is converted to 768-dimensional vector
   - Uses transformer model (bge-base-en-v1.5)
   - Captures semantic meaning

2. **Similarity Search**: Cosine similarity with pre-computed embeddings
   - Compares semantic similarity, not just term overlap
   - Better at understanding context and meaning

3. **Results**: Returns top N most similar documents with scores

## Comparing TF-IDF vs Embeddings

| Aspect | TF-IDF | Embeddings |
|--------|--------|------------|
| **Basis** | Term matching | Semantic meaning |
| **Vocabulary** | Limited to corpus terms | Understands unseen words |
| **Synonyms** | Doesn't recognize | Recognizes similar meanings |
| **Context** | Term-based only | Understands context |
| **Speed** | Very fast | Slower (model inference) |
| **Setup** | Just statistics | Requires model download |
| **Explainability** | Shows matched terms | Black box |

## Tips for Best Results

1. **Use specific terms**: TF-IDF works best with distinctive vocabulary
   - Good: "transformer architecture attention mechanism"
   - Less effective: "tell me about technology"

2. **Natural language**: Embeddings handle full sentences better
   - Good: "How do neural networks learn from data?"
   - TF-IDF may only match a few key terms

3. **Domain vocabulary**: Use terms that appear in your corpus
   - Check found terms to see what matched
   - Low matches = terms not in vocabulary

4. **Compare approaches**: Run both and compare results
   - TF-IDF: Good for keyword-based search
   - Embeddings: Good for semantic/conceptual search

## Library Usage

You can also use the library functions programmatically:

```javascript
import { createTFIDFVector } from './lib/tfidf-vector.js';
import { computeEmbedding } from './lib/embeddings.js';
import { LocalIndex } from 'vectra';

// TF-IDF search
const tfidfResult = createTFIDFVector("your query", './tfidf-data');
const tfidfIndex = new LocalIndex('./tfidf-vector-index');
const tfidfMatches = await tfidfIndex.queryItems(tfidfResult.vector, 10);

// Embedding search
const embedding = await computeEmbedding("your query");
const embeddingIndex = new LocalIndex('./vector-index');
const embeddingMatches = await embeddingIndex.queryItems(embedding, 10);
```

See [lib/README.md](lib/README.md) for more details on the library API.
