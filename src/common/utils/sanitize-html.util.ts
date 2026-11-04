/**
 * Server-side HTML sanitizer for rich-text fields (TipTap editor content).
 * Strips dangerous executable tags, event handlers, and javascript: protocols
 * while preserving standard content styling tags.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  return (
    html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove style tags and their content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove iframe/object/embed/applet tags
      .replace(/<\/?(iframe|object|embed|applet|meta|link|base)[^>]*>/gi, '')
      // Remove on* event handler attributes (e.g. onerror=, onload=, onclick=)
      .replace(/\s*on[a-zA-Z]+\s*=\s*(['\"][^'\"]*['\"]|[^\s>]+)/gi, '')
      // Remove javascript: pseudoprotocol from href/src
      .replace(/(href|src)\s*=\s*(['\"])\s*javascript:[^'\"]*\2/gi, '$1="#"')
      .replace(/(href|src)\s*=\s*javascript:[^\s>]*/gi, '$1="#"')
      // Remove data: text/html base64 injection
      .replace(
        /(href|src)\s*=\s*(['\"])\s*data:text\/html[^'\"]*\2/gi,
        '$1="#"',
      )
  );
}
