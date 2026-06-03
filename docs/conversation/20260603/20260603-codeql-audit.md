# 2026-06-03 CodeQL Audit for v0.29.3

## 审计触发

v0.29.1 大规模简化后，对 GitHub CodeQL security scanning 结果进行全面审计，确认剩余 open 告警的真实性。

## 审计结果

### Open alerts: 16

| 类型 | 数量 | 真实？ | 处理 |
|---|---|---|---|
| Unused variable `loc` (guide templates) | 8 | ❌ | 渲染引擎占位符，假阳性 |
| Superfluous trailing arguments | 1 | ❌ | 预先存在的 JS 语法问题，无害 |
| innerHTML / Exception text as HTML | 3 | ✅ | `dsd-element.ts` 回退路径，信任边界已明确 |
| Unused variable `pkgRoute` | 1 | ✅ | 死变量，删除 |
| Useless assignment `hasError` | 1 | ✅ | catch 块中赋值后立即 return，未使用 |
| Type comparison quirk | 1 | ✅ | `typeof null === 'object'` 判断顺序问题 |
| SVG element creation | 1 | ❌ | `createElementNS` 假阳性，VNode tag 非用户输入 |

### Fixed alerts: 14

- 4 个 roadmap.tsx JSX 语法错误（v0.29.2 修复）
- 3 个已删除文件 `jsx-render-string.ts` 的告警
- 7 个 CodeQL 重扫后判定为假阳性

## 修复决策

### render-dsd.ts
- `hasError = true` on catch path → use `hasError` variable in metrics instead of hardcoded `true`
- `typeof value !== 'object' || value === null` → flip order to `value === null || typeof value !== 'object'`

### dsd-element.ts
- Two innerHTML assignments in fallback/render paths → wrap with `trustRenderHtml()` to mark explicit trust boundary

### registry component
- Delete unused `pkgRoute` variable

### Not fixed
- `loc` variables in guide templates (design pattern)
- `superfluous trailing arguments` in scroll-reveal (pre-existing, not related)
- SVG `createElement` (false positive)
