# v0.26.0 — Framework-Vite Decoupling

> **版本主题**: 框架层零构建工具依赖
> **状态**: 📋 Planned | **ADR**: ADR-0061
> **预估**: ~24h（3 个工作日）

## 架构图

```
当前 (v0.25.0)                         目标 (v0.26.0)
─────────────────                      ─────────────────
┌───────────────────┐                  ┌───────────────────┐
│   路由文件 (55)     │                  │   路由文件 (55)     │
│  import from       │                  │  import from       │
│  virtual:less-nav  │←── Vite耦合       │  @lessjs/content   │←── 框架自身
│  virtual:less-blog │                  │  /nav /blog-data   │
└───────┬───────────┘                  └───────┬───────────┘
        │                                      │
   Vite virtual                         纯 ESM import
   插件注入                                  │
        │                              ┌───────┴───────────┐
┌───────┴───────────┐                  │   @lessjs/content  │
│  @lessjs/content   │                  │   nav scanner →    │
│  (扫描器)          │                  │   写入_generated   │
└───────────────────┘                  │   .ts 文件          │
                                       └───────────────────┘
                                               │
                                       Vite 只做 alias 映射
                                       不注入数据
```

## SOP 列表

### Framework Decoupling (ADR-0061)

| SOP | 主题                  | 优先级 | 预估 | 依赖        |
| --- | --------------------- | ------ | ---- | ----------- |
| 001 | Virtual Modules 移除  | P0     | 8h   | —           |
| 002 | Entry Renderer 清理   | P0     | 3h   | SOP-001     |
| 003 | Island Transform 提取 | P1     | 3.5h | SOP-001     |
| 004 | Dev Server 零 Bundler | P1     | 5h   | SOP-001     |
| 005 | Adapter 清理 + 验证   | P1     | 4h   | SOP-001→004 |

### Reactive Pragmatic (ADR-0059)

| ID    | 主题                       | 优先级 | 预估 | 依赖 |
| ----- | -------------------------- | ------ | ---- | ---- |
| TG-01 | `this.params` SPA-reactive | P0     | 6h   | —    |
| TG-02 | `data-keep-alive` DOM 保留 | P1     | 3h   | —    |
| TG-03 | `computed()` 文档          | P2     | 2h   | —    |

## 依赖关系

```
TG-01 (params) ──┐
TG-02 (keep-alive)┼── 可并行 ──┐
TG-03 (computed)──┘            │
                                ├── SOP-005 (全量回归)
SOP-001 (virtual 移除) ────────┤
 ├── SOP-002 (entry-renderer) ─┤
 ├── SOP-003 (island) ─────────┤
 └── SOP-004 (dev:fast) ───────┘
```

```
SOP-001 (virtual 移除, 基础)
 ├── SOP-002 (entry-renderer 清理)
 ├── SOP-003 (island-transform 提取) ← 可并行 SOP-002
 ├── SOP-004 (dev server 零 bundler)
 └── SOP-005 (adapter 清理 + 全量回归)
```

## 关键设计决策

| 决策     | 选择                                               | 依据                                         |
| -------- | -------------------------------------------------- | -------------------------------------------- |
| 数据传递 | 构建时写入 `_generated-nav.ts` 等文件              | 与 ADR 0010 一致，普通 ESM 导入              |
| I/O 抽象 | 薄抽象（仅封装 `Deno.readTextFile`）               | 不引入跨运行时复杂度                         |
| Vite HMR | 保留为可选增强                                     | `dev:fast` 零 bundler 是默认，`dev:hmr` 可选 |
| 向后兼容 | v0.26 同时支持旧 virtual 导入 + 新路径，v0.27 移除 | 避免一次性爆破                               |

## 成功标准 (DoD)

1. ✅ 60 个路由文件不包含 `import from 'virtual:'`
2. ✅ `deno check` 零 bundler 通过所有路由文件
3. ✅ SSG smoke test 通过
4. ✅ fmt / lint / typecheck 全绿
5. ✅ 943+ tests pass
6. ✅ `deno task dev:fast` 冷启动 < 1s
7. ✅ npm create 模板不依赖 Vite 虚拟模块
8. ✅ docs 更新反映新 import 路径

## 风险矩阵

| 风险                | 概率 | 影响 | 缓解                                  |
| ------------------- | ---- | ---- | ------------------------------------- |
| 55 文件迁移引入错误 | 中   | 中   | codemod 脚本 + CI                     |
| dev:fast 性能不达标 | 低   | 低   | 渐进优化                              |
| JSR 发布顺序问题    | 低   | 高   | 先发 content/i18n → 后发 adapter-vite |
