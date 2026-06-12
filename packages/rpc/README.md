# @openelement/rpc

Small Fetch API RPC helpers for openElement applications and Web Components.

> v0.38 surface: archived/advanced. The package remains published and tested,
> but ordinary API route docs should start from Hono plus platform
> Request/Response APIs. New v1 product positioning for RPC requires a refreshed
> product story.

`@openelement/rpc` is intentionally framework-light: it owns request state,
retry, cancellation, and typed call helpers, but it does not own routing,
database access, or application auth.

## Advanced Usage

Application code should normally use `@openelement/app` for pages and islands.
Use `RpcController` inside a low-level element when a client request needs
loading/error state tied to the host lifecycle.

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
