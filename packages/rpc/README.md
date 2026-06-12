# @openelement/rpc

Small Fetch API RPC helpers for archived/advanced openElement use cases.

> v0.40 surface: archive-candidate. The package remains published and tested,
> but ordinary API route docs start from Hono plus platform Request/Response
> APIs. Reopening RPC as a v1 product requires a later ADR.

`@openelement/rpc` is intentionally framework-light: it owns request state,
retry, cancellation, and typed call helpers, but it does not own routing,
database access, or application auth.

## Archived Advanced Usage

New application code should normally use `@openelement/app` for pages and
islands, and Hono or platform Request/Response APIs for API routes. Existing
advanced consumers may keep using `RpcController` inside a low-level element
when a client request needs loading/error state tied to the host lifecycle.

```tsx
import { RpcController, RpcError } from '@openelement/rpc';
import { DsdElement } from '@openelement/runtime';

class PostLoader extends DsdElement {
  static props = { endpoint: String };

  endpoint = '/api/posts';
  rpc = new RpcController(this);

  async loadPosts() {
    try {
      return await this.rpc.call((signal) =>
        fetch(this.endpoint, { signal }).then((r) => r.json())
      );
    } catch (err) {
      if (err instanceof RpcError) {
        console.error(`API error (${err.status}): ${err.message}`);
      }
    }
  }

  render() {
    if (this.rpc.loading) return <button disabled>Loading</button>;
    if (this.rpc.error) return <p>Error: {this.rpc.error.message}</p>;
    return <button onClick={() => this.loadPosts()}>Load posts</button>;
  }
}

customElements.define('post-loader', PostLoader);
```

## Features

- Fetch-based calls with typed request and response shapes.
- AbortController cancellation for in-flight requests.
- Optional retry with custom delay calculation.
- No ORM, auth provider, or server runtime dependency.

## License

MIT
