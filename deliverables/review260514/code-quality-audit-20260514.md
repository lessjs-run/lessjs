# LessJS Framework - Code Quality Audit Report

**Date:** 2026-05-14  
**Auditor:** software-engineer-v2  
**Scope:** Comprehensive code quality review of LessJS framework

---

## Executive Summary

The LessJS framework demonstrates a well-architected codebase with strong adherence to Web Standards and good separation of concerns. The code quality is generally high with proper TypeScript usage, comprehensive documentation, and security-conscious design decisions. However, there are several areas that require attention to improve robustness and maintainability.

**Overall Code Quality Score: 7.5/10**

---

## 1. Code Quality Strengths

### 1.1 Architecture & Design
- **Modular Monorepo Structure**: Clean separation between runtime (`@lessjs/core`) and build-time (`@lessjs/adapter-vite`, `@lessjs/adapter-lit`) code
- **Web Standards Alignment**: Proper use of URLPattern, Navigation API, Declarative Shadow DOM, and Custom Elements
- **Framework Agnostic**: Core is not tied to any specific UI framework
- **Plugin Architecture**: Well-designed Vite plugin system with proper hook ordering

### 1.2 TypeScript Usage
- Comprehensive type definitions in `packages/core/src/types.ts`
- Proper use of branded types (`SafeHtml`, `UnsafeHtml`) for HTML escaping contracts
- Good interface segregation (e.g., `DsdComponent`, `RenderAdapter`, `LessRenderer`)

### 1.3 Documentation
- Excellent JSDoc coverage with examples
- Clear module-level documentation explaining architecture decisions
- ADR (Architecture Decision Records) referenced in code comments

### 1.4 Error Handling
- Type-safe error hierarchy with `LessError` base class
- Errors include error codes and HTTP status codes
- Proper serialization via `toJSON()` method

---

## 2. Issues Found

### Critical Severity 🔴

#### 2.1 XSS Vector in `headExtras` Injection
**File:** `packages/core/src/html-escape.ts:65-142`  
**Description:** The `wrapInDocument()` function injects `headExtras` directly into HTML without sanitization. While this is documented as `@dangerous` in types.ts, there is no runtime validation.

**Risk:** If `headExtras` accidentally contains user-supplied content, it creates an XSS vulnerability.

**Recommendation:**
```typescript
// Add runtime validation in wrapInDocument()
if (headExtras && /<\s*script[\s>]/i.test(headExtras)) {
  if (!options.allowUnsafeScripts) {
    throw new LessError('headExtras contains <script> tags without explicit allowUnsafeScripts flag', 'UNSAFE_HEAD_EXTRAS', 400, true);
  }
}
```

**Location:** `packages/core/src/html-escape.ts:65-90`

---

### High Severity 🟠

#### 2.2 Potential ReDoS in `matchRoute()`
**File:** `packages/core/src/navigation.ts:158-165`  
**Description:** The fallback regex construction from route patterns could be exploited with carefully crafted input to cause ReDoS (Regular Expression Denial of Service).

**Code:**
```typescript
const regexStr = pattern.path.replace(/:([^/]+)/g, '(?<$1>[^/]+)');
const regex = new RegExp(`^${regexStr}$`);
```

**Risk:** If `pattern.path` contains user-controlled input and special regex characters, it could cause catastrophic backtracking.

**Recommendation:**
- Escape regex special characters in `pattern.path` before conversion
- Add timeout/complexity limits for regex matching

**Location:** `packages/core/src/navigation.ts:158-165`

#### 2.3 Inconsistent `any` Type Usage
**File:** Multiple files  
**Description:** Several places use `any` type with `deno-lint-ignore no-explicit-any` comment, bypassing type safety.

**Examples:**
- `packages/core/src/types.ts:242` - `LessMiddleware` type
- `packages/core/src/navigation.ts:51` - Navigation API declarations
- `packages/core/src/island.ts:119` - Property assignment

**Recommendation:**
- Replace `any` with `unknown` and proper type guards
- Use generic types where appropriate
- Add proper TypeScript declarations for Navigation API

**Location:** Throughout codebase

#### 2.4 Missing Input Validation in `island()` Wrapper
**File:** `packages/core/src/island.ts:247-328`  
**Description:** The `island()` function validates tag names but doesn't validate `componentClass` or `options` thoroughly.

**Risk:** Passing invalid inputs could cause silent failures or unexpected behavior.

**Recommendation:**
```typescript
if (typeof componentClass !== 'function') {
  throw new Error('[LessJS] island() requires a constructor function');
}
```

**Location:** `packages/core/src/island.ts:256-261`

---

### Medium Severity 🟡

#### 2.5 Logger Implementation
**File:** `packages/core/src/logger.ts:40-76`  
**Description:** The `LessLogger` class directly uses `console.log/warn/error/debug` without support for:
- Log aggregation/transport
- Structured JSON output
- Log rotation
- Custom log levels per module

**Recommendation:**
- Add support for custom log transports
- Implement proper log level filtering
- Add request ID correlation for SSR logs

**Location:** `packages/core/src/logger.ts:40-76`

#### 2.6 Silent Error Recovery
**File:** Multiple files  
**Description:** Several error handlers catch exceptions and continue silently (just logging), which might hide bugs in development.

**Examples:**
- `packages/core/src/island.ts:119-128` - read-only property assignment
- `packages/core/src/render-dsd.ts:133-144` - property assignment failures
- `packages/core/src/render-dsd.ts:189-200` - style extraction failures

**Recommendation:**
- Add a "strict mode" that throws errors in development
- Use `log.warn()` instead of `log.debug()` for recoverable errors
- Consider aggregating warnings for CI environments

**Location:** Multiple files

#### 2.7 Magic Strings & Constants
**File:** Multiple files  
**Description:** Several magic strings are used without constants:

**Examples:**
- `'[LessJS]'` prefix in logger
- `'core'`, `'ssg'`, `'blog'` scope names
- `'dsd-static'`, `'dsd-interactive'`, `'pure-island'` layer names

**Recommendation:**
```typescript
// Create constants file
export const LAYER = {
  DSD_STATIC: 'dsd-static',
  DSD_INTERACTIVE: 'dsd-interactive',
  PURE_ISLAND: 'pure-island',
} as const;
```

**Location:** Throughout codebase

---

### Low Severity 🟢

#### 2.8 Inconsistent Formatting
**File:** `packages/adapter-vite/src/index.ts`  
**Description:** Some files have inconsistent indentation and line breaks compared to the rest of the codebase.

**Examples:**
- Mixed tab/space usage in some generated code
- Inconsistent quote style in some template literals

**Recommendation:**
- Run `deno fmt` before commits
- Add pre-commit hook for formatting

**Location:** `packages/adapter-vite/src/index.ts`

#### 2.9 Missing Null Checks
**File:** `packages/core/src/render-nested.ts`  
**Description:** Some parse5 AST traversals don't check for `null`/`undefined` properly.

**Example:**
```typescript
// Line 272 - assumes childNodes exists
ceNode.childNodes = [];
```

**Recommendation:**
- Add proper null checks or use optional chaining
- Add unit tests for malformed HTML input

**Location:** `packages/core/src/render-nested.ts:271-293`

#### 2.10 Complex Function in `less()` Plugin
**File:** `packages/adapter-vite/src/index.ts:202-438`  
**Description:** The `less()` function is 236 lines long and handles too many responsibilities.

**Recommendation:**
- Extract validation logic to separate functions
- Split plugin creation into smaller functions
- Use builder pattern for plugin configuration

**Location:** `packages/adapter-vite/src/index.ts:202-438`

---

## 3. Code Duplication Analysis

### 3.1 Duplicated HTML Escaping Logic
**Files:** 
- `packages/core/src/html-escape.ts:32-52`
- `packages/core/src/html-escape.ts:105-109`

**Description:** HTML escaping logic is repeated in `escapeHtml()` and inline in `wrapInDocument()`.

**Recommendation:** Extract a common escaping utility and reuse it.

### 3.2 Similar Error Handling Patterns
**Files:** Multiple files  

**Description:** Similar try-catch-log patterns are repeated throughout the codebase.

**Recommendation:** Create error handling utilities:
```typescript
export async function tryOrLog<T>(
  fn: () => Promise<T>,
  context: string,
): Promise<T | undefined> { ... }
```

---

## 4. Performance Analysis

### 4.1 Potential Performance Issues

#### 4.1.1 Repeated `customElements.get()` Calls
**File:** `packages/core/src/render-nested.ts:212`  
**Description:** In the recursive rendering loop, `customElements.get(tagName)` is called multiple times for the same tag.

**Recommendation:** Cache registry lookups in a Map during single render pass.

#### 4.1.2 Parse5 AST Traversal Overhead
**File:** `packages/core/src/render-nested.ts:193-221`  
**Description:** Full AST traversal happens for every component render, even for simple HTML.

**Recommendation:** 
- Skip parsing for HTML without hyphens (no custom elements)
- Consider streaming/chunked rendering for large pages

#### 4.1.3 JSON.parse() in Hot Path
**File:** `packages/core/src/render-nested.ts:57-64`  
**Description:** `JSON.parse()` is called for every attribute that looks like JSON.

**Recommendation:** Lazy parsing or compile-time optimization.

---

## 5. Security Analysis

### 5.1 HTML Escaping ✅
**File:** `packages/core/src/html-escape.ts`  
**Status:** Properly implemented with branded types (`SafeHtml`, `UnsafeHtml`).

**Strengths:**
- Covers all critical characters (`&`, `<`, `>`, `"`, `'`)
- Separate functions for HTML content vs attributes
- Type system enforces correct usage

### 5.2 CSP Support ✅
**File:** `packages/core/src/types.ts:168-175`  
**Status:** Good CSP configuration support with nonce support.

### 5.3 URL Validation ✅
**File:** `packages/adapter-vite/src/index.ts:207-234`  
**Status:** Proper URL validation for `inject.stylesheets` and `inject.scripts`.

**Strength:** Blocks `javascript:`, `data:`, `vbscript:`, `file:` protocols.

### 5.4 Remaining Security Concerns

#### 5.4.1 `headExtras` XSS Risk (see 2.1)

#### 5.4.2 `innerHTML` Usage
**Status:** No direct `innerHTML` usage found in core framework.  
**Note:** parse5 serialization is safe as it doesn't evaluate scripts.

---

## 6. Configuration Management Analysis

### 6.1 `deno.json` Configuration ✅
**File:** `deno.json`  
**Status:** Well-structured centralized configuration.

**Strengths:**
- Workspace configuration for monorepo
- Centralized import map
- Consistent formatting/linting rules
- Task definitions for common operations

**Recommendation:**
- Add `"strict": true` to `compilerOptions` if not already set
- Consider splitting test tasks by package

### 6.2 TypeScript Configuration
**Status:** Good `compilerOptions` in `deno.json`:
```json
{
  "strict": true,
  "module": "ESNext",
  "moduleResolution": "bundler"
}
```

---

## 7. Recommendations Summary

### High Priority 🔴
1. Add runtime validation for `headExtras` to prevent XSS
2. Fix ReDoS vulnerability in `matchRoute()` regex construction
3. Replace `any` types with `unknown` and type guards

### Medium Priority 🟡
1. Enhance logger with transport support and structured output
2. Change silent error recovery to warn/throw in strict mode
3. Extract magic strings to constants
4. Add comprehensive input validation

### Low Priority 🟢
1. Run `deno fmt` and add pre-commit hooks
2. Add null checks in parse5 AST traversal
3. Refactor large functions into smaller pieces
4. Add unit tests for edge cases

### Performance Improvements
1. Cache `customElements.get()` lookups
2. Skip parse5 for HTML without custom elements
3. Lazy JSON parsing in attribute serialization

---

## 8. Detailed File Analysis

### 8.1 `packages/core/src/errors.ts`
**Quality:** High  
**Issues:** None critical  
**Suggestions:**
- Add more specific error subclasses for common scenarios
- Add error code documentation/mapping

### 8.2 `packages/core/src/html-escape.ts`
**Quality:** High (with one critical issue)  
**Issues:** XSS risk in `headExtras` (see 2.1)  
**Suggestions:**
- Add runtime validation for `headExtras`
- Consider adding `escapeUrl()` for URL context

### 8.3 `packages/core/src/context.ts`
**Quality:** High  
**Issues:** None  
**Suggestions:**
- Add input validation for `extractParams()` pattern argument
- Consider caching URLPattern instances

### 8.4 `packages/core/src/types.ts`
**Quality:** High  
**Issues:** `any` type usage (see 2.3)  
**Suggestions:**
- Replace `LessMiddleware` any type with proper type
- Add readonly modifiers to interface properties

### 8.5 `packages/core/src/island.ts`
**Quality:** High  
**Issues:** Missing input validation (see 2.4)  
**Suggestions:**
- Add validation for `componentClass`
- Extract strategy implementations to separate file

### 8.6 `packages/core/src/navigation.ts`
**Quality:** Medium  
**Issues:** ReDoS vulnerability (see 2.2), `any` types (see 2.3)  
**Suggestions:**
- Add proper Navigation API type declarations
- Fix regex construction in `matchRoute()`

### 8.7 `packages/core/src/render-dsd.ts`
**Quality:** High  
**Issues:** Performance concerns (see 4.1)  
**Suggestions:**
- Cache `customElements.get()` lookups
- Add performance metrics collection

### 8.8 `packages/core/src/render-nested.ts`
**Quality:** High  
**Issues:** Missing null checks (see 2.9)  
**Suggestions:**
- Add null checks for parse5 AST nodes
- Add unit tests for malformed HTML

### 8.9 `packages/adapter-vite/src/index.ts`
**Quality:** Medium  
**Issues:** Complex function (see 2.10), inconsistent formatting (see 2.8)  
**Suggestions:**
- Refactor `less()` function
- Run `deno fmt`

---

## 9. Code Quality Metrics

| Metric | Score | Notes |
|--------|--------|-------|
| TypeScript Usage | 8/10 | Good types, some `any` usage |
| Documentation | 9/10 | Excellent JSDoc coverage |
| Error Handling | 7/10 | Good hierarchy, silent recovery |
| Security | 6/10 | XSS risk, ReDoS vulnerability |
| Performance | 7/10 | Some optimization opportunities |
| Code Duplication | 8/10 | Minimal duplication |
| Test Coverage | N/A | Not evaluated in this audit |
| Maintainability | 8/10 | Good structure, some complex functions |

---

## 10. Conclusion

The LessJS framework is a well-designed, modern web framework that adheres to Web Standards and demonstrates good software engineering practices. The codebase is generally high quality with comprehensive documentation and type safety.

**Key Strengths:**
- Excellent architecture with clear separation of concerns
- Good use of TypeScript and Web Standards
- Comprehensive documentation
- Security-conscious design (with one exception)

**Key Weaknesses:**
- One XSS vulnerability in `headExtras` injection
- ReDoS vulnerability in route matching
- Some `any` type usage bypassing type safety
- Silent error recovery hiding potential bugs

**Immediate Action Items:**
1. Fix `headExtras` XSS risk (Critical)
2. Fix `matchRoute()` ReDoS vulnerability (High)
3. Replace `any` types with proper type safety (High)

With these issues addressed, the codebase quality score would improve from **7.5/10** to approximately **8.5/10**.

---

**Audit Completed:** 2026-05-14  
**Auditor:** software-engineer-v2  
**Next Steps:** Review recommendations with team-lead and prioritize fixes
