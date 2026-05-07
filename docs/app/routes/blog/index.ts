/**
 * Blog Index Page — LessJS Framework Blog
 */
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class BlogIndexPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .blog-list {
        list-style: none;
        padding: 0;
        margin: 1.5rem 0;
      }
      .blog-item {
        padding: 1rem 1.25rem;
        /* 0.5px: reduced to match less-ui spec */
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        margin-bottom: 0.75rem;
        transition: border-color 0.15s;
        display: block;
        text-decoration: none;
        color: inherit;
      }
      .blog-item:hover {
        border-color: var(--less-text-primary);
      }
      .blog-item h2 {
        font-size: 0.9375rem;
        margin: 0 0 0.25rem;
        font-weight: 500;
        color: var(--less-text-primary);
      }
      .blog-item .meta {
        font-size: 0.75rem;
        color: var(--less-text-muted);
        margin: 0;
      }
      .blog-item p {
        font-size: 0.8125rem;
        color: var(--less-text-secondary);
        margin: 0.5rem 0 0;
      }
    `,
  ];

  override render() {
    return html`
      <less-layout currentPath="/blog">
        <div class="container">
          <h1>博客</h1>
          <p class="subtitle">LessJS 框架的设计思考、架构决策和发展路线。</p>

          <div class="blog-list">
            <a href="/blog/v0-8-0" class="blog-item">
              <h2>
                v0.8.0 — 功能完善 + Island Manifest + Blog 启动 <span
                  style="font-size:0.7rem;color:var(--less-accent)"
                >NEW</span>
              </h2>
              <p class="blog-desc">
                Signal 原生切换 · Island Upgrade Manifest · @lessjs/blog 包 · render-dsd.ts 拆分 · 390 测试通过
              </p>
              <span class="blog-date">2026-05-08</span>
            </a>

            <a href="/blog/v0-5-alpha1" class="blog-item">
              <h2>v0.5-alpha1 — 全量架构审计与精准修复</h2>
              <p class="blog-desc">
                3 agent 扫描 13k 行源码 · CSS 注入修复 · Island 升级修复 · 6 条新设计原则 · 配置精简
              </p>
              <span class="blog-date">2026-05-03</span>
            </a>

            <a href="/blog/v0-5-0" class="blog-item">
              <h2>LessJS v0.5-alpha-0 — 架构精简</h2>
              <p class="blog-desc">零框架运行时 Core · 原生 RPC · OpenProps + Lit · 单 deno.json</p>
              <span class="blog-date">2026-05-02</span>
            </a>

            <a href="/blog/v0-4-0" class="blog-item">
              <h2>LessJS v0.4.0 — Serverless Integration Milestone</h2>
              <p class="meta">2026-04-30 · 版本发布</p>
              <p>
                Serverless API 部署成功、全站统一 0.5px 视觉风格、零 lint 零 type
                errors。从"能跑起来"到"真正能用"的里程碑。
              </p>
            </a>
            <a href="/blog/less-compiler" class="blog-item">
              <h2>.less Compiler — 可选零框架运行时组件</h2>
              <p class="meta">2026-04-30 · 架构决策</p>
              <p>
                一个可选编译器将声明式 .less 文件编译为原生 Custom Elements，让 Lit 从必选路线变成
                adapter。
              </p>
            </a>
          </div>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-blog-index', BlogIndexPage);
export default BlogIndexPage;
export const tagName = 'page-blog-index';
