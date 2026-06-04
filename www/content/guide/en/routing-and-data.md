---
title: 'Routing and Data'
section: 'Guide'
label: 'Routing and Data'
order: 3
---

# Routing and Data

Files in `app/routes` become routes. The route module exports a page component,
usually created with `definePage()`.

## Static Page

```tsx
import { definePage } from '@openelement/app';

export default definePage(() => <main>Home</main>);
```

## Page Metadata

```tsx
export default definePage({
  title: 'Posts',
  description: 'Latest posts',
  render() {
    return <main>Posts</main>;
  },
});
```

## Load Data

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

`load()` receives route params, the request, and runtime context. Its result is
passed to the page as `data`.

## Rendering Intent

Page descriptors can declare future rendering intent:

```tsx
export default definePage({
  rendering: 'ssg',
  revalidate: 300,
  render: () => <main>Cached page</main>,
});
```

v0.31 introduces the application contract. v0.32 productizes SSR, ISR, streaming
DSD, and cache adapters.
