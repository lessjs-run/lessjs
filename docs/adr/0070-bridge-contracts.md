# ADR-0070: 涓夊眰妗ユ帴鍙俊鍖?鈥?浠庡瓧绗︿覆鎷兼帴鍒?AST 濂戠害

- **鐘舵€?*锛氭彁妗?- **鏃ユ湡**锛?026-05-31
- **鏇夸唬**锛氭棤锛堟柊鏋舵瀯鑳藉姏锛?

---

## 鍔ㄦ満

LessJS 鐨勪笁灞傛灦鏋勶紙缁勪欢妯″瀷+淇″彿銆丏SD 娓叉煋绠＄嚎銆丅uilder 绠＄嚎锛夊湪鐞嗚涓婄畝娲佷紭缇庛€備絾涓夊眰涔嬮棿鐨勪袱涓ˉ鎺ョ偣鍏ㄩ儴渚濊禆杩愯鏃跺瓧绗︿覆鎿嶄綔鍜?try/catch锛屽鑷存ˉ姊佽剢寮便€侀敊璇笉鍙銆佷慨澶嶄笉鍙潬銆?

### 褰撳墠妗ユ帴闂娓呭崟

| 妗?                       | 褰撳墠瀹炵幇                                               | 闂                                                   |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| Builder 鈫?Render         | `lines.push('return \`<open-layout>${c}</open-layout>\`')` | 瀛楃涓叉嫾鎺ョ敓鎴?JS 浠ｇ爜锛岀己澶?await 涓嶆姤閿?  |
| Component 鈫?Render       | `renderDsd()` call `render()` 鈫?try/catch 鍏滃簳          | 娴忚鍣?API 璋冪敤鍦?SSR 鐐镐簡琚潤榛樺悶鎺?          |
| Render 鈫?Render (鍐呴儴) | `visitedKey = "${tagName}@${depth}"`                       | 5 涓?`<open-code-block>` 娣卞害=1锛屽悗4涓璇垽寰幆 |

---

## 鍐崇瓥

鐢ㄤ笁涓嫭绔嬩絾浜掕ˉ鐨勬満鍒讹紝鎶婃ˉ鎺ヤ粠杩愯鏃惰瘯鎺㈠崌绾т负闈欐€佸彲楠岃瘉鐨勫绾︼細

### 妗?锛欱uilder 鈫?Render 鈥?鐢熸垚浠ｇ爜 鈫?鐪熷疄鍑芥暟

*_涓嶇敓鎴愪唬鐮併€傚鍏ョ湡瀹炲嚱鏁般€?_

```
涔嬪墠锛歟ntry-renderer.ts 鐢熸垚瀛楃涓?鈫?鎷兼垚 .js 鈫?杩愯鏃舵墽琛?涔嬪悗锛歟ntry-renderer.ts 鐢熸垚 import 璇彞 鈫?瀵煎叆 packages/core/src/entry-bridge.ts
```

`entry-bridge.ts` 鏄竴涓?*琚?TypeScript 绫诲瀷妫€鏌ヨ鐩栫殑鏅€氬嚱鏁?*锛?

```ts
// packages/core/src/entry-bridge.ts
export async function wrapAppShell(
  content: string,
  routePath: string,
  options: {
    navSections: NavSection[];
    headerNav: HeaderNavLink[];
    locales: string[];
    defaultLocale: string;
  },
): Promise<string> {
  // 鍑芥暟浣撳唴鎵€鏈夐€昏緫鍙?TypeScript 妫€鏌?  // await 缂哄け 鈫?缂栬瘧閿欒锛屼笉鏄繍琛屾椂 [object Promise]
}
```

**entry-renderer.ts 鐨勮鑹插彉鍖?*锛氫粠"浠ｇ爜鐢熸垚鍣?闄嶇骇涓?import + 鍙傛暟鎷兼帴鍣?銆?

### 妗?锛欳omponent 鈫?Render 鈥?try/catch 鈫?SSR Context

*_涓嶇粰缁勪欢 try/catch 褰撳畨鍏ㄧ綉銆傜粰缁勪欢 SSR Context銆?_

```ts
// dsd-element.ts
export interface SsrContext {
  path: string;
  locale: string;
  params: Record<string, string>;
}

export class DsdElement extends _HTMLElement {
  // renderDsd() 鍦ㄨ皟鐢?render() 鍓嶈缃鍊?  #ssrContext: SsrContext | null = null;

  // 缁勪欢闇€瑕佽矾寰勬椂浣跨敤姝ゆ柟娉曪紝鑰屼笉鏄?Router
  protected get currentPath(): string {
    return this.#ssrContext?.path ?? this.routing?.path ?? '/';
  }
}
```

**鍏抽敭鍙樺寲**锛?

- `renderDsd()` 鍦?injectProps 涔嬪悗銆乺ender() 涔嬪墠娉ㄥ叆 `#ssrContext`
- Router 涓嶅啀琚?render() 璋冪敤锛坮ender 璧?ssrContext锛?- Router 鍙湪 connectedCallback 涔嬪悗浣跨敤锛圕SR 瀹夊叏锛?- 涓嶅啀闇€瑕?try/catch 鍏滃簳鈥斺€旀病璺緞淇℃伅灏变紭闆呴檷绾у埌 `/`锛屼笉浼氭姏寮傚父

### 妗?锛歊ender 鍐呴儴 鈥?tagName@depth 鈫?node identity

*_涓嶇敤 tag+depth 鍒ゆ柇寰幆銆傜敤 parse5 node 鐨勮韩浠姐€?_

````ts
// render-nested.ts
// 涔嬪墠锛?const visitedKey = `${tagName}@${depth}`; // 5 涓?less-code-block 鍏变韩鍚屼竴涓?key

// 涔嬪悗锛?let occurrenceIndex = 0;
const visitedNodes = new WeakMap<P5Element, number>();
// 鐢?parse5 鑺傜偣寮曠敤浣滀负韬唤锛屼笉闈?tagName+depth 鐚?```

浣?parse5 鑺傜偣姣忔 `parseFragment()` 閮藉垱寤烘柊瀵硅薄锛屾棤娉曠敤瀵硅薄寮曠敤杩借釜璺ㄨ皟鐢ㄥ惊鐜€傜湡姝ｇ殑鏂规鏄細

**涓嶉潬 key 鍘婚噸銆傞潬 parent-child 鍏崇郴鍒ゅ畾鐪熸寰幆銆?*

```ts
function isAncestor(child: P5Element, ancestor: P5Element): boolean {
  let current = child.parentNode;
  while (current) {
    if (current === ancestor) return true;
    current = (current as P5Element).parentNode;
  }
  return false;
}

// 鍦ㄦ覆鏌撻摼璺腑锛?// 鍙烦杩?render() 杈撳嚭涓寘鍚嚜宸?tag 鐨勭粍浠?锛堢湡姝ｇ殑寰幆锛?// 涓嶈烦杩?鍏勫紵鑺傜偣涓悓绫诲瀷鐨勭粍浠?锛坒alse positive锛?```

**瑙勫垯鍙樻洿**锛?
- 鏃э細`visited.has("less-code-block@1")` 鈫?skip锛堝厔寮熶篃璺宠繃锛?- 鏂帮細妫€鏌?render() 杈撳嚭鐨?AST 涓槸鍚﹀寘鍚浉鍚?tag 鍦ㄦ洿娣辩殑灞傜骇 鈫?鍙烦杩囪嚜寮曠敤寰幆

---

## 瀹炵幇璺嚎

### Phase 1锛氬缓妗?锛堟渶灏忔敼鍔紝鏈€澶ф敹鐩婏級

**鏀?`render-nested.ts` 鐨?cycle detection**锛?
- 鍒犻櫎 `${tagName}@${depth}` visited Set
- 鍦?`renderDsd()` 杈撳嚭瑙ｆ瀽鍚庯紝妫€鏌?render() 杈撳嚭涓槸鍚﹀寘鍚悓鍚?tag 鈫?鍙湪鐪熷惊鐜椂璺宠繃
- 棰勪及锛殈30 琛屾敼鍔?
### Phase 2锛氬缓妗?锛堝姞鍥?bridge1 鐨勫墠鎻愶級

**缁?DsdElement 鍔?`#ssrContext`**锛?
- 鏂板 `SsrContext` 鎺ュ彛
- `renderDsd()` 娉ㄥ叆 ssrContext
- `LessLayout._currentPath()` 鏀逛负璇?ssrContext
- 鍒犻櫎 Router 鐩稿叧鐨?try/catch 浠ｇ爜
- 棰勪及锛殈50 琛屾敼鍔紝褰卞搷 3 涓枃浠?
### Phase 3锛氬缓妗?锛堥暱鏈熶俊浠伙級

**鎻愬彇 `entry-bridge.ts`**锛?
- 鏂板缓 `packages/core/src/entry-bridge.ts`
- `wrapAppShell()` 浠?lines.push 瀛楃涓?鈫?鐪熷疄鍑芥暟
- `entry-renderer.ts` 绠€鍖栦负 import + 鍙傛暟鎷兼帴
- `renderNestedCustomElements` 鍦ㄥ嚱鏁板唴璋冪敤锛岀被鍨嬪畨鍏?- 棰勪及锛殈80 琛屾柊澧?+ ~30 琛屽垹闄?
---

## 褰卞搷鐨勫寘

| 鍖?                       | 鍙樻洿                                                    |
| ------------------------- | ------------------------------------------------------- |
| @openelement/core         | 鏂板 entry-bridge.ts, SsrContext, 淇敼 render-nested.ts |
| @openelement/ui           | LessLayout._currentPath() 涓嶅啀渚濊禆 Router               |
| @openelement/adapter-vite | entry-renderer.ts 绠€鍖?                                 |
| @openelement/router       | 涓嶅彈褰卞搷锛堜粎 CSR 浣跨敤锛?                                |

---

## 椋庨櫓涓庡彇鑸?
| 椋庨櫓                                             | 缂撹В                                                     |
| ------------------------------------------------ | -------------------------------------------------------- |
| entry-bridge.ts 鍦?core 涓鍔?deno.json imports | core 宸叉湁 render-nested 渚濊禆 parse5锛宐ridge 涓嶅鍔犳柊渚濊禆 |
| SsrContext 鏆撮湶鍐呴儴鎺ュ彛                          | 鏍囪涓?`@internal`锛屼笉瀵煎嚭鍒?public API                  |
| AST 寰幆妫€娴嬫€ц兘                                 | parse5 鏍戦亶鍘嗘槸 O(depth)锛屼竴椤垫渶澶氬嚑鐧捐妭鐐癸紝闆跺奖鍝?      |

---

## 涓嶅仛浠€涔?
1. 涓嶅紩鍏?Babel/SWC 缂栬瘧姝ラ锛堜繚鎸侀浂缂栬瘧锛?2. 涓嶆妸 Router 鏀规垚 SSR 鎰熺煡锛圧outer 鏄函 CSR 缁勪欢锛?3. 涓嶆敼鍙?render() 绛惧悕锛堜繚鎸?`render(): string | VNode`锛?
---

## 闄勫綍锛氫慨澶嶅悗鐨勬暟鎹祦
````

Builder (entry-renderer)
鈹?涓嶅啀 lines.push 鐢熸垚浠ｇ爜
鈹?鏀逛负: import { wrapAppShell } from '@openelement/core/entry-bridge'
鈹?鐒跺悗: content = await wrapAppShell(content, routePath, {...})
鈹? 鈹? 鈫?绫诲瀷瀹夊叏鐨勫嚱鏁拌皟鐢? 鈹?缁勪欢妯″瀷 (DsdElement)
鈹?renderDsd() 娉ㄥ叆 #ssrContext.path
鈹?render() 閫氳繃 this.currentPath 鑾峰彇璺緞
鈹?涓嶈皟鐢?Router銆佷笉璁块棶 location
鈹? 鈹? 鈫?涓嶆姏寮傚父銆佷笉 try/catch
鈹?DSD 娓叉煋 (renderNested)
鈹?寰幆妫€娴嬶細妫€鏌?output AST 涓悓鍚?tag 鐨勭鍏堥摼
鈹?鍏勫紵鑺傜偣姝ｇ‘娓叉煋
鈹? 鈹? 鈫?闆惰鏉€
鈹?鏈€缁?HTML锛堝畬鏁淬€佹纭級

```
```
