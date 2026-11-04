/**
 * Safely escape any special regular expression characters to prevent
 * ReDoS attacks and regex syntax errors in MongoDB / JavaScript queries.
 */
export function escapeRegex(text: string): string {
  if (!text) return '';
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
