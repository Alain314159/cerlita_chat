/**
 * Strict sanitization utility to strip HTML/scripts before sending messages.
 * Prevents XSS and malicious injections.
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  // 1. Strip script tags and their content: <script>...</script>
  let sanitized = text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');
  
  // 2. Strip all other HTML tags: <br>, <div>, etc.
  sanitized = sanitized.replace(/<[^>]*>?/gm, '');
  
  // 3. Remove excess whitespace and trim
  return sanitized.trim();
};
