#!/bin/bash

# Demonstration script for the interactive query tool
# This shows the complete workflow from data preparation to querying

set -e

echo "======================================================================"
echo "SIMILARITY QUERY WORKFLOW DEMONSTRATION"
echo "======================================================================"
echo ""
echo "This script demonstrates the complete workflow for using the"
echo "interactive similarity query tool."
echo ""

# Step 1: Build TF-IDF data
echo "Step 1: Building TF-IDF data..."
echo "----------------------------------------------------------------------"
npm run tfidf 2>&1 | grep -E "(Found|Computing|complete|Generated)" || true
echo ""

# Step 2: Build TF-IDF vector store
echo "Step 2: Building TF-IDF vector store..."
echo "----------------------------------------------------------------------"
npm run tfidf-vectors 2>&1 | grep -E "(Step|Total|LocalIndex|COMPLETE)" || true
echo ""

# Step 3: Show test results
echo "Step 3: Testing query functionality..."
echo "----------------------------------------------------------------------"
node test-query.js 2>&1 | grep -E "(Query:|Stemmed:|Known terms|similar documents:|^\s+[0-9]\.)" | head -40
echo ""

echo "======================================================================"
echo "WORKFLOW DEMONSTRATION COMPLETE"
echo "======================================================================"
echo ""
echo "To use the interactive query tool, run:"
echo "  npm run query"
echo ""
echo "Note: For embedding-based similarity search, you also need to run:"
echo "  npm run embeddings"
echo ""
