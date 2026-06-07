# Security Guide

openElement is secure by default. All text content is HTML-escaped
automatically, and explicit trust boundaries protect against injection
attacks. This guide explains the security model and how to integrate
third-party sanitization when needed.

## Default: Everything Is Escaped

All text rendered through JSX is HTML-escaped automatically:

```tsx
// User input is safely escaped — no XSS possible
const userInput = '<script>alert("xss")</script>';
return <p>{userInput}</p>;
// Output: <p>&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;</p>
```

The escaping functions (`escapeHtml`, `escapeAttr`, `escapeAttrValue`) use
single-pass replacement for performance and cover all dangerous characters:
`& < > " '`.

## Trust Boundary: `trustedHtml`

When you need to inject pre-sanitized HTML (e.g., from a CMS or Markdown
renderer), use the explicit `trustedHtml` marker:

```tsx
import { trustedHtml } from '@openelement/core';

// ONLY use this with content you have already sanitized
const sanitizedContent = sanitizeHtml(markdownOutput);
return <div innerHTML={trustedHtml(sanitizedContent)} />;
```

**Important**: `trustedHtml` is a trust boundary, not a sanitizer. You must
ensure the HTML is safe before passing it. The runtime will log a warning on
first use as a reminder.

## Prototype Pollution Protection

openElement blocks prototype pollution attacks through the `DANGEROUS_KEYS`
set. These keys are rejected during SSR prop injection:

```
__proto__, constructor, prototype, __defineGetter__, __defineSetter__,
__lookupGetter__, __lookupSetter__, hasOwnProperty, isPrototypeOf,
propertyIsEnumerable, toString, toLocaleString, valueOf
```

If a prop with one of these keys is detected during SSR, it is silently
dropped and a warning is logged.

## CSP Nonce Support

openElement supports Content Security Policy (CSP) nonces for inline scripts:

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  route: { path: '/' },
  head: {
    title: 'Secure Page',
    nonce: 'base64-encoded-nonce-value', // Applied to all inline scripts
  },
  render() {
    return <main>Hello</main>;
  },
});
```

The nonce must be a valid base64-encoded string. It is validated before
being applied to `<script>` tags in the rendered output.

## Integrating DOMPurify or sanitize-html

For user-generated content, integrate a sanitization library before
crossing the `trustedHtml` boundary:

### With sanitize-html

```tsx
import sanitizeHtml from 'sanitize-html';
import { trustedHtml } from '@openelement/core';

const clean = sanitizeHtml(userContent, {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
  allowedAttributes: { a: ['href'] },
});

return <div innerHTML={trustedHtml(clean)} />;
```

### With DOMPurify (client-side islands)

```tsx
import DOMPurify from 'dompurify';
import { trustedHtml } from '@openelement/core';

const clean = DOMPurify.sanitize(userContent);
return <div innerHTML={trustedHtml(clean)} />;
```

## headExtras Safety

The `headExtras` API allows injecting additional `<head>` content, but with
restrictions:

- `<script>` tags are blocked (use the nonce API instead)
- `on*` event handler attributes are stripped
- HTML comments are validated for proper nesting

```tsx
export default definePage({
  head: {
    headExtras: [
      '<meta property="og:title" content="My Page">', // ✅ allowed
      // '<script>alert(1)</script>',                  // ❌ blocked
    ],
  },
});
```

## Security Checklist

- [ ] Never pass unsanitized user input to `trustedHtml`
- [ ] Always use a sanitization library for user-generated HTML
- [ ] Enable CSP headers in production with a per-request nonce
- [ ] Review `headExtras` for any dynamic content
- [ ] Keep `@openelement/core` updated for security patches

## Reporting Vulnerabilities

If you discover a security vulnerability in openElement, please report it
responsibly through GitHub Security Advisories on the repository.
