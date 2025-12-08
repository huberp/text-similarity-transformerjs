/**
 * CSV utility functions
 */

/**
 * Escape CSV fields to handle special characters
 * @param {*} field - Field value to escape
 * @returns {string} Escaped field value
 */
export function escapeCSV(field) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
