/**
 * Media Chrome Showcase - Vanilla adapter demo (ssr: false)
 *
 * Renders Media Chrome's native Web Components (video player controls)
 * as a client-only island. Media Chrome is a set of vanilla Web Components
 * that provide customizable media player controls.
 *
 * Video source: Date A Live OP1 (1080p, Blu-ray) from AnimeThemes.moe.
 * Media Chrome elements are dynamically imported on the client side
 * to avoid SSR crashes from browser-only DOM APIs.
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
 * @lessjs/app island - auto-detected by adapter-vite.
 */
import { WithDsdHydration } from '@lessjs/adapter-vanilla';

// SSR-safe base class: WithDsdHydration(HTMLElement) requires HTMLElement.
// Fallback to a plain class to avoid "Class extends value undefined" crash.
const MediaChromeBase = typeof globalThis.HTMLElement !== 'undefined'
  ? WithDsdHydration(globalThis.HTMLElement)
  : class {};

export const tagName = 'media-chrome-showcase';

// less.ssr: false - skip SSR rendering, client-only upgrade.
// Media Chrome manipulates real DOM in connectedCallback() and has no
// render(): string method. See ADR-0028 for the DOM simulation path.
export const less = { ssr: false };

export default class MediaChromeShowcase extends MediaChromeBase {
  private _mcLoaded = false;
  private _mcError = false;

  override connectedCallback(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }
    super.connectedCallback();

    // Populate shadow root with render() content immediately so something is visible
    // even before media-chrome library loads.
    if (this.shadowRoot && !this.shadowRoot.childNodes.length) {
      this.shadowRoot.innerHTML = this.render();
    }

    // Load media-chrome dynamically on the client only.
    if (!this._mcLoaded && typeof globalThis.HTMLElement !== 'undefined') {
      this._mcLoaded = true;
      import('media-chrome').then(() => {
        this._mcError = false;
        // Re-render so media-controller elements upgrade with media-chrome registered
        if (this.shadowRoot) {
          this.shadowRoot.innerHTML = this.render();
        }
      }).catch((err: Error) => {
        this._mcError = true;
        console.warn('[media-chrome] failed to load:', err.message);
        // Show error state in the UI
        if (this.shadowRoot) {
          this.shadowRoot.innerHTML = this.render();
        }
      });
    }
  }

  render(): string {
    const label = this._mcError
      ? '⚠️ Media Chrome components failed to load. Try a Chromium-based browser.'
      : 'Media Chrome - pure vanilla Web Components via @lessjs/adapter-vanilla';

    return `
      <style>
        :host { display: block; height: 100%; }
        .mc-wrap {
          background: #000;
          border-radius: 8px;
          overflow: hidden;
          width: 100%;
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
          padding: 4px 0;
        }
        .mc-label.warn { color: #f59e0b; }
        .mc-source {
          font-size: 10px;
          color: #71717a;
          margin-top: 0;
        }
      </style>
      <div class="mc-wrap">
        <media-controller>
          <video
            slot="media"
            preload="metadata"
            playsinline
            controlsList="nodownload"
            ${/* AnimeThemes.moe - Date A Live OP1, 1080p Blu-ray */ ''}
          >
            <source
              src="https://v.animethemes.moe/DateALive-OP1.webm"
              type="video/webm"
            />
          </video>
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
      <div class="mc-label${this._mcError ? ' warn' : ''}">${label}</div>
      <div class="mc-source">🎬 Date A Live OP1 - 1080p (AnimeThemes.moe)</div>
    `;
  }
}

// Guard: idempotent across SSR paths
try {
  customElements.define(tagName, MediaChromeShowcase);
} catch { /* already defined */ }
