# @lessjs/rpc

Lit ReactiveController 风格的 RPC - 基于 Fetch API + AbortController，零框架依赖。

## 安装

```bash
deno add jsr:@lessjs/rpc
```

## 功能

- **`RpcController`**：Lit ReactiveController，自动管理 loading/error 状态并触发 host 重渲染
- **自动重试**：可配置重试次数 + 指数退避，仅对网络错误和 5xx 重试
- **请求取消**：通过 AbortController 取消进行中的请求（hostDisconnected 自动清理）
- **类型安全**：TypeScript 泛型推导请求/响应类型
- **零依赖**：纯 `fetch` + `AbortController`，无 Lit 依赖

## 使用

```ts
import { RpcController, RpcError } from '@lessjs/rpc';

class MyElement extends LitElement {
  private rpc = new RpcController(this);

  async loadData() {
    try {
      const data = await this.rpc.call(() => fetch('/api/posts').then((r) => r.json()));
      this.data = data;
    } catch (err) {
      if (err instanceof RpcError) {
        console.error(`API error (${err.status}): ${err.message}`);
      }
    }
  }

  connectedCallback() {
    this.loadData();
  }
}
```

### 重试配置

```ts
// 最多重试 2 次，退避延迟
const rpc = new RpcController(this, {
  maxRetries: 2,
  retryDelay: (attempt) => Math.pow(2, attempt) * 1000, // 2s, 4s
});
```

### 失败时数据流

```ts
render() {
  if (this.rpc.loading) return html`<p>加载中...</p>`;
  if (this.rpc.error) return html`<p>错误: ${this.rpc.error.message}</p>`;
  return html`<p>${this.data}</p>`;
}
```

## 许可

MIT
