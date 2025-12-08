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

#### TF-IDF Results:
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

#### Transformer Embedding Results:
```
Embedding dimension: 768

Top 5 similar documents:
  1. [82.45%] math_01.md (Math/Linear Algebra)
  2. [68.32%] math_07.md (Math/Geometry)
  3. [65.18%] math_08.md (Math/Discrete Math)
  4. [63.91%] math_02.md (Math/Calculus)
  5. [62.74%] math_04.md (Math/Number Theory)
```

#### Comparison:
- **TF-IDF**: Strong match (46.84%) based on exact keyword matches ("matric", "linear", "algebra")
- **Embeddings**: Even stronger match (82.45%) capturing semantic meaning of mathematical structures
- **TF-IDF**: Sharp drop-off after top match (7.26% for second result) - limited by keyword overlap
- **Embeddings**: More gradual decline (68.32% for second) - understands related mathematical concepts
- **Winner**: Both correctly identify math_01.md, but embeddings show better understanding of related math topics

### Example 2: Math Query - Calculus

**Query:** `"How do I calculate derivatives and integrals?"`

#### TF-IDF Results:
```
Stemmed: "how do i calcul deriv and integr"
Total terms: 7
Known terms found: 1

Found terms with TF-IDF weights:
  - deriv: TF=1, IDF=2.5649, TF-IDF=2.5649

Top 5 similar documents:
  1. [44.36%] math_02.md (Math/Calculus)
  2. [6.70%] math_08.md (Math/Discrete Math)
  3. [0.00%] fruit_01.md (Fruit/Citrus)
  4. [0.00%] fruit_02.md (Fruit/Berries)
  5. [0.00%] fruit_03.md (Fruit/Tropical)
```

#### Transformer Embedding Results:
```
Embedding dimension: 768

Top 5 similar documents:
  1. [87.23%] math_02.md (Math/Calculus)
  2. [71.45%] math_01.md (Math/Linear Algebra)
  3. [68.87%] math_06.md (Math/Statistics)
  4. [64.92%] math_08.md (Math/Discrete Math)
  5. [61.33%] math_03.md (Math/Probability)
```

#### Comparison:
- **TF-IDF**: Only matched "deriv" (derivatives) - missed "integr" (integrals) due to vocabulary limitations
- **Embeddings**: Understands both concepts semantically even without exact word matches
- **TF-IDF**: Massive gap between top result (44.36%) and second (6.70%) - vulnerable to vocabulary gaps
- **Embeddings**: Top result is very strong (87.23%) with good secondary matches showing understanding of mathematical relationships
- **Winner**: Embeddings clearly superior here - demonstrates robustness to vocabulary variations

### Example 3: Fruit Query

**Query:** `"Tell me about citrus fruits like oranges and lemons"`

#### TF-IDF Results:
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

#### Transformer Embedding Results:
```
Embedding dimension: 768

Top 5 similar documents:
  1. [91.34%] fruit_01.md (Fruit/Citrus)
  2. [76.89%] fruit_03.md (Fruit/Tropical)
  3. [73.21%] fruit_02.md (Fruit/Berries)
  4. [71.56%] fruit_08.md (Fruit/Exotic Varieties)
  5. [69.42%] fruit_04.md (Fruit/Stone Fruits)
```

#### Comparison:
- **TF-IDF**: Excellent match (61.62%) with specific terms ("citru", "lemon", "orang")
- **Embeddings**: Outstanding match (91.34%) understanding the semantic concept of citrus fruits
- **TF-IDF**: Shows keyword-based ranking - tropical fruits rank high due to word overlap
- **Embeddings**: Better clustering of fruit types - berries rank higher than in TF-IDF due to conceptual similarity
- **Winner**: Both perform well, but embeddings show superior semantic understanding with higher confidence

### Example 4: LLM Query

**Query:** `"What is a large language model and how does it work?"`

#### TF-IDF Results:
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

#### Transformer Embedding Results:
```
Embedding dimension: 768

Top 5 similar documents:
  1. [84.67%] llm_01.md (LLM/Model Architecture)
  2. [79.23%] llm_06.md (LLM/Model Constraints)
  3. [76.54%] llm_02.md (LLM/Prompt Design)
  4. [74.88%] llm_04.md (LLM/RAG Systems)
  5. [72.31%] llm_07.md (LLM/Learning Paradigms)
```

#### Comparison:
- **TF-IDF**: Low confidence scores (10.17% top match) - generic terms like "model" and "languag" appear everywhere
- **Embeddings**: High confidence (84.67%) understanding the semantic intent about model architecture
- **TF-IDF**: Relatively flat distribution across LLM documents - hard to distinguish without distinctive keywords
- **Embeddings**: Clear ranking based on conceptual relevance - "architecture" correctly identified as most relevant
- **Winner**: Embeddings dramatically superior - demonstrates strength with abstract queries and common terminology

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

### When Each Approach Excels

#### TF-IDF Strengths:
1. **Keyword-rich queries**: When query contains specific, distinctive terms
   - Example: "citrus fruits like oranges and lemons" (61.62% match)
2. **Transparent results**: You can see exactly which terms matched and their weights
3. **Fast execution**: No model inference required
4. **Interpretable**: Easy to debug why a document matched

#### TF-IDF Weaknesses:
1. **Vocabulary limitations**: Only matches terms that appear in the corpus
   - Example: "integr" (integrals) not found, hurting calculus query
2. **Generic terms**: Common words like "model", "work" provide weak signals
   - Example: LLM query only achieved 10.17% top match
3. **No semantic understanding**: Doesn't understand synonyms or related concepts
4. **Steep drop-offs**: High variance between top results and secondary matches

#### Embedding Strengths:
1. **Semantic understanding**: Captures meaning beyond exact word matches
   - Example: Calculus query achieved 87.23% despite missing vocabulary
2. **High confidence**: Generally produces stronger similarity scores (70-90% range)
3. **Robust to phrasing**: Works well with natural language questions
4. **Better secondary matches**: Related documents cluster more naturally

#### Embedding Weaknesses:
1. **Black box**: Can't easily explain why a match occurred
2. **Requires model**: Needs network access to download transformer model (~250MB)
3. **Slower**: Model inference takes more time than simple vector math
4. **Resource intensive**: Higher memory and CPU requirements

### Recommendation

| Use Case | Best Approach | Reason |
|----------|---------------|--------|
| **Keyword search** | TF-IDF | Fast and transparent when you know specific terms |
| **Natural language questions** | Embeddings | Better understanding of semantic intent |
| **Domain-specific corpus** | TF-IDF | Works well when vocabulary is well-defined |
| **General knowledge queries** | Embeddings | Handles variety of phrasing and concepts |
| **Production search** | Both | Use TF-IDF for speed, embeddings for quality |
| **Debugging/analysis** | TF-IDF | Can inspect matched terms and weights |

### Observed Performance Patterns

Based on our test queries:

| Query Type | TF-IDF Top Score | Embedding Top Score | Winner |
|------------|------------------|---------------------|--------|
| Math (Linear Algebra) | 46.84% | 82.45% | Embeddings |
| Math (Calculus) | 44.36% | 87.23% | Embeddings |
| Fruit (Citrus) | 61.62% | 91.34% | Embeddings |
| LLM (General) | 10.17% | 84.67% | Embeddings |

**Key Findings:**
- Embeddings consistently produce higher confidence scores (70-91% vs 10-62%)
- TF-IDF struggles most with generic/abstract queries (LLM example: 10.17%)
- TF-IDF performs best with specific terminology (Citrus example: 61.62%)
- Embeddings show less variance across query types (84-91% vs 10-62%)

## Tips for Best Results

### For TF-IDF Queries:

1. **Use specific, distinctive terms**: 
   - ✅ Good: "citrus fruits oranges lemons"
   - ❌ Less effective: "tell me about some fruit"
   - Why: Distinctive terms like "citrus" have high IDF weights and produce strong matches

2. **Include domain vocabulary**:
   - ✅ Good: "matrices in linear algebra"
   - ❌ Less effective: "math with grids of numbers"
   - Why: TF-IDF only matches terms that exist in the corpus vocabulary

3. **Check matched terms**:
   - The tool shows which terms were found and their weights
   - If few terms match, try rephrasing with more specific vocabulary

4. **Avoid overly generic queries**:
   - ✅ Good: "transformer attention mechanism"
   - ❌ Less effective: "how does AI work?" 
   - Why: Generic terms appear in many documents, weakening signals

### For Embedding Queries:

1. **Use natural language**:
   - ✅ Good: "How do neural networks learn from data?"
   - ✅ Also good: "What's the learning process in deep learning?"
   - Why: Embeddings understand semantic meaning, not just keywords

2. **Ask conceptual questions**:
   - ✅ Good: "What is a large language model and how does it work?"
   - Why: Embeddings excel at understanding abstract concepts

3. **Don't worry about exact phrasing**:
   - Both "derivatives and integrals" and "calculus operations" work well
   - Embeddings are robust to vocabulary variations

4. **Be specific about intent**:
   - Better: "properties of matrices" vs "matrices"
   - More context helps embeddings understand what you're looking for

### Comparing Both Approaches:

1. **Run both searches**: The query tool shows results from both methods
2. **Look for discrepancies**: When results differ, consider:
   - TF-IDF finds keyword matches (good for precision)
   - Embeddings find semantic matches (good for recall)
3. **Evaluate confidence scores**:
   - TF-IDF: 40-60% is strong, 10-20% is weak
   - Embeddings: 80-90% is strong, 60-70% is moderate
4. **Check secondary results**:
   - TF-IDF: Often shows steep drop-offs
   - Embeddings: More gradual ranking reflects related concepts

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
