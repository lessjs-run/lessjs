/**
 * 404 Not Found Page
 */
import { navSections, headerNav } from 'virtual:less-nav';
import { css, html, LitElement } from 'lit';
import { pageStyles } from '../components/page-styles.js';
import '@lessjs/ui/less-layout';

export class NotFoundPage extends LitElement {
  static override styles = [
    pageStyles,
    css`
      .error-code {
        font-size: 5rem;
        font-weight: 800;
        letter-spacing: -0.06em;
        color: var(--less-text-primary);
        margin: 2rem 0 0.5rem;
        line-height: 1;
      }
      .error-message {
        color: var(--less-text-tertiary);
        font-size: 0.9375rem;
        margin-bottom: 2rem;
      }
      .home-link {
        display: inline-block;
        padding: 0.5rem 1.25rem;
        /* 0.5px: reduced to match less-ui spec */
        border: 0.5px solid var(--less-border);
        border-radius: 4px;
        color: var(--less-text-primary);
        text-decoration: none;
        font-size: 0.8125rem;
        transition: border-color 0.15s;
      }
      .home-link:hover {
        border-color: var(--less-text-primary);
      }
    `,
  ];

  override render() {
    return html`
      <less-layout .navItems="${navSections}" .headerNav="${headerNav}">
        <div class="container" style="text-align:center;padding-top:4rem">
          <div class="error-code">404</div>
          <p class="error-message">
            This page does not exist — or has moved to a different route.
          </p>
          <a href="/" class="home-link">&larr; Back to home</a>
        </div>
      </less-layout>
    `;
  }
}

customElements.define('page-not-found', NotFoundPage);
export default NotFoundPage;
export const tagName = 'page-not-found';
