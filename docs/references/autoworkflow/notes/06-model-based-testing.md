# 6. Model-Based Testing：从状态模型生成测试

> Utting & Legeard. "Practical Model-Based Testing." 2006.
> fast-check 库：https://fast-check.dev/docs/advanced/model-based-testing/

## 传统测试 vs 基于模型的测试

### 传统单元测试

```typescript
Deno.test('dep bump: 0.33 → 0.34', () => {
  // 手动写：bump 前是 0.33，bump 后是 0.34
});
```

问题：**你只能测试你想到的路径。** 10 个 package 的版本号，能有多少种不一致的状态？你能写多少个测试覆盖所有组合？

### 基于模型的测试

```typescript
const model = {
  states: ['aligned', 'drifted', 'partial'],
  transitions: [
    { from: 'aligned', to: 'drifted', when: 'version mismatch' },
    { from: 'drifted', to: 'aligned', when: 'fix applied' },
  ],
};

// 框架自动生成所有合法路径的测试
for (const path of generatePaths(model)) {
  test(`path: ${path}`, () => {
    simulate(path);
    expect(finalState).toMatch(model.expectedState(path));
  });
}
```

关键：**不是你写测试，是你定义模型，框架生成测试。**

## 对 openElement 的贡献

### 测试 Cell 状态机

我们的 Cell 状态机有 6 个状态和约 15 条合法转换：

```
planned → branched → executing → harness → merging → merged
                                  ↘ failed → planned
                                     (retry)
```

手动写测试：6×15 = 90 个测试。而且每次加新状态都要手动加测试。

Model-Based Testing 的角度：

```typescript
const cellModel = {
  initial: 'planned',
  states: ['planned', 'branched', 'executing', 'harness', 'merging', 'merged', 'failed'],
  legalTransitions: cellStateMachine.transitions,
};

// 自动生成所有合法路径和非法路径的测试
testGeneratedPaths(cellModel);
```

### 测试版本号对齐

```
Model: 19 packages, 1 expected version
States: aligned / drifted / partial
Transitions: bump_one / bump_all / mismatch_one
```

框架自动生成：19 个包×3 种状态×N 种操作 = 几千个测试场景。手动写不了，模型可以。

### 测试 DAG 依赖

```
cell-02 depends on cell-01
cell-03 depends on cell-01
cell-04 depends on cell-02 AND cell-03

场景:
- cell-01 成功 → 02,03 继续 → 04 继续 ✅
- cell-01 失败 → 02,03 cancel → 04 cancel ✅
- cell-02 成功但 cell-03 失败 → 04 应该 cancel ✅
```

Model-Based Testing 自动生成所有 DAG 执行路径，验证级联逻辑。

## fast-check 的具体用法

fast-check 的 `modelBased` 是一个现成的实现：

```typescript
import fc from "npm:fast-check";

// 定义命令（操作）
class BumpVersionCommand {
  check(model) { return model.packages.some(p => p.version !== target); }
  run(model, real) {
    // 执行 bump
  }
  toString() { return "bump"; }
}

// 定义模型
const versionModel = {
  packages: [{ version: "0.33" }, ...19个],
};

// fast-check 自动生成命令序列并验证模型
fc.assert(
  fc.property(
    fc.commands([BumpVersionCommand]),
    (cmds) => {
      const model = { ...versionModel };
      fc.modelRun(() => ({ model, real: {} }), cmds);
    }
  )
);
```

## 关键限制

Model-Based Testing 适用于**状态空间可枚举**的系统。我们的 Cell 状态机、版本对齐、DAG 依赖恰好都是可枚举的。

不适用于"AI 写的代码是否有 bug"——这需要语义理解，不是状态枚举。但对于 fmt/lint/typecheck/test 这类确定性门禁，Model-Based Testing 完美覆盖。
