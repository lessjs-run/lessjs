/**
 * @lessjs/ui - less-dialog
 *
 * Dialog component using native <dialog> element + popover API.
 * Per WHATWG HTML Living Standard §4.11.4 (dialog) and §6.9.2 (popover).
 *
 * Features:
 * - Native <dialog> for modal behavior (backdrop, focus trap, ESC to close)
 * - popover API for non-modal popover panels
 * - CSS :state() pseudo-classes for open/closed states
 * - inert attribute on background content for accessibility
 * - Form-associated: can participate in <form> as a dialog
 *
 * DSD Hydration:
 * - Layer 2 (DSD Interactive): uses WithDsdHydration Mixin
 * - Declarative hydrateEvents for click/cancel/close binding after DSD upgrade
 * - Direct DOM manipulation for state changes (Lit won't re-render)
 *
 * Usage:
 * ```html
 * <less-dialog>
 *   <button slot="trigger">Open Dialog</button>
 *   <div>Dialog content here</div>
 * </less-dialog>
 * ```
 */

import { css, type CSSResult, html, LitElement, nothing, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';
import { WithDsdHydration } from '@lessjs/adapter-lit';

/** @internal */
const DsdLitElement = WithDsdHydration(LitElement);

export const tagName = 'less-dialog';

/**
 * Dialog component with DSD hydration.
 *
 * Uses WithDsdHydration Mixin for the common DSD pattern:
 *   - Detects pre-populated shadow root from DSD
 *   - Binds events declared in `static hydrateEvents`
 *   - Cleans up listeners on disconnect
 */
export class LessDialog extends DsdLitElement {
  /** DSD: delegates focus for keyboard accessibility */
  static delegatesFocus = true;

  /** Declarative event bindings for DSD hydration */
  static hydrateEvents = [
    { selector: 'slot[name="trigger"]', event: 'click', method: '_handleTrigger' },
    { selector: 'dialog', event: 'cancel', method: '_handleCancel' },
    { selector: 'dialog', event: 'close', method: '_handleClose' },
    { selector: 'button.dialog-close', event: 'click', method: '_handleClose' },
  ];

  /** Form-associated: enables dialog form method */
  static formAssociated = true;

  /** Element internals for form participation + :state() */
  private _internals?: ElementInternals;

  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: inline-block;
      }

      ::slotted([slot="trigger"]) {
        cursor: pointer;
      }

      dialog {
        border: 0.5px solid var(--less-border);
        border-radius: var(--less-radius-lg);
        background: var(--less-bg-elevated);
        color: var(--less-text-primary);
        padding: var(--less-size-6);
        max-width: min(90vw, 480px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        font-family: var(--less-font-sans);
      }

      dialog::backdrop {
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
      }

      dialog[open] {
        animation: dialogFadeIn 0.2s ease-out;
      }

      @keyframes dialogFadeIn {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--less-size-4);
      }

      .dialog-title {
        font-size: var(--less-font-size-lg);
        font-weight: var(--less-font-weight-semibold);
        color: var(--less-text-primary);
        margin: 0;
      }

      .dialog-close {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--less-text-muted);
        font-size: 1.25rem;
        line-height: 1;
        padding: var(--less-size-1);
        border-radius: var(--less-radius-sm);
        transition: color var(--less-transition-fast);
      }

      .dialog-close:hover {
        color: var(--less-text-primary);
        background: var(--less-accent-subtle);
      }

      .dialog-body {
        font-size: var(--less-font-size-md);
        color: var(--less-text-secondary);
        line-height: 1.5;
      }

      .dialog-footer {
        margin-top: var(--less-size-5);
        display: flex;
        justify-content: flex-end;
        gap: var(--less-size-2);
      }

      /* :state() pseudo-class support */
      :host(:state(open)) dialog {
        display: block;
      }
    `,
  ];

  static override properties = {
    open: { type: Boolean, reflect: true },
    label: { type: String },
  };

  declare open: boolean;
  declare label: string | undefined;

  constructor() {
    super();
    this.open = false;
    this.label = undefined;
    this._internals = this.attachInternals();
  }

  override connectedCallback(): void {
    super.connectedCallback(); // Mixin handles _hydrateEvents()
    this._updateStates();
  }

  private _updateStates(): void {
    if (!this._internals?.states) return;
    if (this.open) {
      this._internals.states.add('open');
      this._internals.states.delete('closed');
    } else {
      this._internals.states.delete('open');
      this._internals.states.add('closed');
    }
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('open')) {
      this._updateStates();
      this._syncDialogElement();
      this._syncInert();
    }
  }

  /** Show the dialog (modal) */
  public show(): void {
    this.open = true;
  }

  /** Close the dialog */
  public close(): void {
    this.open = false;
  }

  /** Toggle dialog open/closed */
  public toggle(): void {
    this.open = !this.open;
  }

  /** Sync native <dialog> element with open state */
  private _syncDialogElement(): void {
    const dialog = this.shadowRoot?.querySelector('dialog');
    if (!dialog) return;

    if (this.open && !dialog.open) {
      dialog.showModal();
    } else if (!this.open && dialog.open) {
      dialog.close();
    }
  }

  /** Set inert on siblings when dialog is open (accessibility) */
  private _syncInert(): void {
    if (!this.parentNode) return;
    const parent = this.parentNode as Element;
    if (this.open) {
      for (const child of Array.from(parent.children)) {
        if (child !== this) {
          child.setAttribute('inert', '');
        }
      }
    } else {
      for (const child of Array.from(parent.children)) {
        if (child !== this) {
          child.removeAttribute('inert');
        }
      }
    }
  }

  private _handleClose(): void {
    this.open = false;
    this._updateStates();
    this._syncDialogElement();
    this._syncInert();
    this.dispatchEvent(new CustomEvent('less-dialog-close', { bubbles: true, composed: true }));
  }

  private _handleCancel(e: Event): void {
    e.preventDefault();
    this._handleClose();
  }

  private _handleTrigger(): void {
    this.toggle();
  }

  /** When DSD hydrated, return nothing — the shadow DOM already has content. */
  override render(): TemplateResult | typeof nothing {
    if (this._dsdHydrated) return nothing;
    return html`
      <slot name="trigger" @click="${this._handleTrigger}"></slot>
      <dialog
        ?open="${this.open}"
        aria-label="${this.label || nothing}"
        @cancel="${this._handleCancel}"
        @close="${this._handleClose}"
      >
        <div class="dialog-header">
          <h2 class="dialog-title">${this.label || ''}</h2>
          <button class="dialog-close" @click="${this
            ._handleClose}" aria-label="Close">&times;</button>
        </div>
        <div class="dialog-body">
          <slot></slot>
        </div>
        <div class="dialog-footer">
          <slot name="footer"></slot>
        </div>
      </dialog>
    `;
  }
}

// Guard: idempotent across SSR paths
if (!customElements.get(tagName)) customElements.define(tagName, LessDialog);
