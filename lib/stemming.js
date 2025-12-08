import natural from 'natural';

/**
 * Preprocess text with stemming to match tiny-tfidf's processing
 * @param {string} text - Text to stem
 * @returns {string} Stemmed text
 */
export function stemText(text) {
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
