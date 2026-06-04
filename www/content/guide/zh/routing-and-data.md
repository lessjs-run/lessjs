---
title: '路由与数据'
section: '指南'
label: '路由与数据'
order: 3
---

# 路由与数据

`app/routes` 下的文件会成为路由。路由模块导出页面组件，通常由 `definePage()` 创建。

## 静态页面

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => <main>Home</main>);
```

## 页面 metadata

```tsx
export default definePage({
  title: 'Posts',
  description: 'Latest posts',
  render() {
    return <main>Posts</main>;
  },
});
```

## 加载数据

```tsx
import { definePage } from '@openelement/app';

export default definePage({
  async load() {
    return { posts: await fetchPosts() };
  },
  render({ data }) {
    return (
      <main>
        {data.posts.map((post) => <article>{post.title}</article>)}
      </main>
    );
  },
});
```

`load()` 会收到 route params、request 和运行时上下文。返回值会作为 `data` 传给页面。

## 渲染意图

页面 descriptor 可以声明后续渲染意图：

```tsx
export default definePage({
  rendering: 'ssg',
  revalidate: 300,
  render: () => <main>Cached page</main>,
});
```

v0.31 建立应用契约。v0.32 会继续产品化 SSR、ISR、streaming DSD 和 cache adapters。
