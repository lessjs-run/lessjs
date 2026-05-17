/**
 * Media Chrome Showcase — Vanilla adapter demo (ssr: false)
 *
 * Renders Media Chrome's native Web Components (video player controls)
 * as a client-only island. Media Chrome directly manipulates real DOM
 * in connectedCallback(), so it cannot be SSR-rendered (ADR-0028).
 *
 * With `less.ssr: false`, the SSG pipeline skips this island's SSR
 * rendering and emits an empty custom element tag. The browser then
 * upgrades it on the client side.
 *
 * CEM note (v0.18.0): media-chrome does not ship a custom-elements.json,
 * so CEM auto-detection returns no results. It falls through to the
 * explicit `vite.config.ts` configuration. This is the typical case
 * for browser-only WC packages in today's ecosystem.
 *
 * SSR Safety: This module is imported by route components, so it evaluates
 * in the SSR module runner where globalThis.HTMLElement may be undefined.
 * - We use a safe base class pattern (fallback to plain class in SSR)
 * - We load media-chrome dynamically on the client only (it accesses DOM APIs)
 *
 * @lessjs/app island — auto-detected by adapter-vite.
 */
import { WithDsdHydration } from '@lessjs/adapter-vanilla';

// SSR-safe base class: WithDsdHydration(HTMLElement) requires HTMLElement.
// Fallback to a plain class to avoid "Class extends value undefined" crash.
const MediaChromeBase = typeof globalThis.HTMLElement !== 'undefined'
  ? WithDsdHydration(globalThis.HTMLElement)
  : class {};

export const tagName = 'media-chrome-showcase';

// less.ssr: false — skip SSR rendering, client-only upgrade.
// Media Chrome manipulates real DOM in connectedCallback() and has no
// render(): string method. See ADR-0028 for the DOM simulation path.
export const less = { ssr: false };

export default class MediaChromeShowcase extends MediaChromeBase {
  private _mcLoaded = false;

  override connectedCallback(): void {
    // Ensure shadow root exists so the mixin's connectedCallback
    // can detect it and invoke render() to populate content.
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    super.connectedCallback();
    // Load media-chrome dynamically on the client only.
    // This avoids SSR crashes from browser-only DOM APIs.
    if (!this._mcLoaded && typeof globalThis.HTMLElement !== 'undefined') {
      this._mcLoaded = true;
      import('media-chrome').catch(() => {/* media-chrome not available */});
    }
  }

  render(): string {
    return `
      <style>
        :host { display: block; }
        .mc-wrap {
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
          max-width: 480px;
        }
        media-controller {
          width: 100%;
          aspect-ratio: 16 / 9;
          --media-control-background: rgba(20, 20, 20, 0.9);
          --media-control-hover-background: rgba(40, 40, 40, 0.9);
          --media-icon-color: #e0e0e0;
          --media-range-thumb-color: #6366f1;
          --media-range-bar-color: #6366f1;
        }
        video { width: 100%; height: 100%; object-fit: cover; }
        .mc-label {
          color: #a1a1aa;
          font-size: 11px;
          margin-top: 6px;
          line-height: 1.5;
        }
      </style>
      <div class="mc-wrap">
        <media-controller>
          <video slot="media"
            src="https://stream.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBstwaxU/low.mp4"
            preload="none"
            crossorigin
            playsinline>
          </video>
          <media-poster-image slot="poster"
            src="https://image.mux.com/VZtzUzGRv02OhRnZCxcNg49OilvolTqdnFLEqBstwaxU/thumbnail.webp?time=0">
          </media-poster-image>
          <media-control-bar>
            <media-play-button></media-play-button>
            <media-time-range></media-time-range>
            <media-time-display show-duration></media-time-display>
            <media-mute-button></media-mute-button>
            <media-volume-range></media-volume-range>
            <media-fullscreen-button></media-fullscreen-button>
          </media-control-bar>
        </media-controller>
      </div>
      <div class="mc-label">Media Chrome — pure vanilla Web Components via @lessjs/adapter-vanilla</div>
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, MediaChromeShowcase);
} catch { /* already defined */ }
