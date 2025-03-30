/**
 * Calculates the similarity between two strings based on the Levenshtein distance.
 * Returns a score between 0 (completely different) and 1 (identical).
 *
 * @param {string} str1 The first string.
 * @param {string} str2 The second string.
 * @returns {number} A similarity score between 0 and 1.
 */
export default function calculateSimilarity(str1, str2) {
  // Ensure inputs are strings
  str1 = String(str1);
  str2 = String(str2);

  const len1 = str1.length;
  const len2 = str2.length;

  // Handle empty strings
  if (len1 === 0 && len2 === 0) return 1; // Both empty, considered identical

  if (len1 === 0 || len2 === 0) return 0; // One is empty, the other isn't, completely different

  // Create a matrix to store distances
  // matrix[i][j] will store the Levenshtein distance between the first i characters of str1
  // and the first j characters of str2
  const matrix = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(null));

  // Initialize the first row and column
  // Distance from empty string to prefix of length i/j is i/j insertions/deletions
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      // Check if the characters are the same
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1; // 0 if match, 1 if substitution needed

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion from str1
        matrix[i][j - 1] + 1, // Insertion into str1
        matrix[i - 1][j - 1] + cost // Substitution or match
      );
    }
  }

  // The Levenshtein distance is in the bottom-right corner
  const distance = matrix[len1][len2];

  // Calculate similarity score
  // Max possible distance is the length of the longer string
  const maxLength = Math.max(len1, len2);
  const similarity = 1 - distance / maxLength;

  return similarity;
}
