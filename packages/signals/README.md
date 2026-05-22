# @lessjs/signals

TC39 Signals polyfill - 信号、计算属性、副作用、Island 生命周期绑定。

## 安装

```bash
deno add jsr:@lessjs/signals
```

## 功能

- **`signal()`**：可写信号，TC39 Signal Proposal polyfill
- **`computed()`**：自动依赖追踪的计算属性
- **`effect()`**：依赖变化自动重跑的副作用
- **`islandEffect()`**：Island 生命周期绑定的 effect，disconnectedCallback 自动清理
- **原生回退**：优先使用 `globalThis.Signal`，不可用时回退 polyfill

## 使用

```ts
import { computed, effect, islandEffect, signal } from '@lessjs/signals';

const count = signal(0);
const doubled = computed(() => count.value * 2);

effect(() => {
  console.log(`Count: ${count.value}, Doubled: ${doubled.value}`);
});

count.value = 1; // 自动触发 effect
```

## 许可

MIT License
