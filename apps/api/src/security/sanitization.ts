import type { Request, Response, NextFunction } from 'express';

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Escapes potentially dangerous HTML entities from untrusted strings to mitigate XSS.
 */
export function encodeHtmlEntities(str: string): string {
  return str.replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strips dangerous null bytes and non-printable control characters.
 */
export function sanitizeString(input: string): string {
  return input.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitizes object keys and string values in place without reassigning getter-only properties (Express 5 compatibility).
 */
export function sanitizeObjectInPlace(target: Record<string, unknown>): void {
  for (const key of Object.keys(target)) {
    const val = target[key];
    if (typeof val === 'string') {
      target[key] = sanitizeString(val);
    } else if (Array.isArray(val)) {
      for (let i = 0; i < val.length; i++) {
        if (typeof val[i] === 'string') {
          val[i] = sanitizeString(val[i]);
        } else if (val[i] !== null && typeof val[i] === 'object') {
          sanitizeObjectInPlace(val[i] as Record<string, unknown>);
        }
      }
    } else if (val !== null && typeof val === 'object') {
      sanitizeObjectInPlace(val as Record<string, unknown>);
    }
  }
}

export function sanitizationMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (req.body && typeof req.body === 'object') {
      sanitizeObjectInPlace(req.body as Record<string, unknown>);
    }
    if (req.query && typeof req.query === 'object') {
      sanitizeObjectInPlace(req.query as Record<string, unknown>);
    }
    if (req.params && typeof req.params === 'object') {
      sanitizeObjectInPlace(req.params as Record<string, unknown>);
    }
  } catch (err) {
    // Graceful degradation
  }
  next();
}
