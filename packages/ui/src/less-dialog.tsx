/** @jsxImportSource @lessjs/core */
/**
 * @lessjs/ui - less-dialog
 *
 * Dialog component using native <dialog> element + popover API.
 * Per WHATWG HTML Living Standard sections 4.11.4 (dialog) and 6.9.2 (popover).
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 * v0.24.1: Migrated from html`` template to JSX (ADR-0057).
 *
 * @csspart overlay - The dialog backdrop/element
 * @csspart header -The header bar
 * @csspart close -The close button
 * @csspart body -The content area (<slot>)
 * @csspart footer -The optional footer slot
 *
 * Usage:
 * ```html
 * <less-dialog>
 *   <button slot="trigger">Open Dialog</button>
 *   <div>Dialog content here</div>
 * </less-dialog>
 * ```
 */

import { DsdElement } from '@lessjs/core';
import { StyleSheet, type StyleSheetLike } from '@lessjs/style-sheet';
import { openPropsTokenSheet } from './open-props-tokens.js';
import { _esc, _escAttr } from './shared/escape.js';

export const tagName = 'less-dialog';

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: inline-block;
  }

  ::slotted([slot="trigger"]) {
    cursor: pointer;
  }

  dialog {
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-3);
    background: var(--gray-0);
    color: var(--gray-9);
    padding: var(--size-6);
    max-width: min(90vw, 480px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    font-family: var(--font-sans);
  }

  dialog::backdrop {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
  }

  dialog[open] {
    animation: dialogFadeIn 0.2s ease-out;
  }

  @keyframes dialogFadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dialog-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--size-4);
  }

  .dialog-title {
    font-size: var(--font-size-2);
    font-weight: var(--font-weight-6);
    color: var(--gray-9);
    margin: 0;
  }

  .dialog-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--gray-5);
    font-size: var(--font-size-2);
    line-height: var(--font-lineheight-1);
    padding: var(--size-1);
    border-radius: var(--radius-1);
    transition: color 0.15s ease;
  }

  .dialog-close:hover {
    color: var(--gray-9);
    background: rgba(83,74,183,0.06);
  }

  .dialog-body {
    font-size: var(--font-size-1);
    color: var(--gray-7);
    line-height: var(--font-lineheight-3);
  }

  .dialog-footer {
    margin-top: var(--size-5);
    display: flex;
    justify-content: flex-end;
    gap: var(--size-2);
  }

  :host(:state(open)) dialog {
    display: block;
  }
`);

export class LessDialog extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override delegatesFocus = true;
  static override observedAttributes = ['open', 'label'];

  private static _originalInertStates = new WeakMap<Element, boolean>();

  override render(): ReturnType<typeof DsdElement.prototype.render> {
    const label = this._esc(this.getAttribute('label') || '');
    return (
      <>
        <slot name='trigger' onClick={() => this._handleTrigger()}></slot>
        <dialog
          aria-label={this.getAttribute('label') || ''}
          part='overlay'
          onCancel={(e: Event) => this._handleCancel(e)}
          onClose={() => this._handleClose()}
        >
          <div className='dialog-header' part='header'>
            <h2 className='dialog-title'>{label}</h2>
            <button
              type='button'
              className='dialog-close'
              part='close'
              aria-label='Close'
              onClick={() => this._handleClose()}
            >
              &times;
            </button>
          </div>
          <div className='dialog-body' part='body'>
            <slot></slot>
          </div>
          <div className='dialog-footer' part='footer'>
            <slot name='footer'></slot>
          </div>
        </dialog>
      </>
    );
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'open') {
      this._updateStates();
      this._syncDialogElement();
      this._syncInert();
    }
  }

  private _updateStates(): void {
    if (!this._internals?.states) return;
    if (this.hasAttribute('open')) {
      this._internals.states.add('open');
      this._internals.states.delete('closed');
    } else {
      this._internals.states.delete('open');
      this._internals.states.add('closed');
    }
  }

  show(): void {
    this.setAttribute('open', '');
  }

  close(): void {
    this.removeAttribute('open');
  }

  toggle(): void {
    if (this.hasAttribute('open')) this.removeAttribute('open');
    else this.setAttribute('open', '');
  }

  private _syncDialogElement(): void {
    const dialog = this.shadowRoot?.querySelector('dialog');
    if (!dialog) return;
    if (this.hasAttribute('open') && !dialog.open) {
      dialog.showModal();
    } else if (!this.hasAttribute('open') && dialog.open) {
      dialog.close();
    }
  }

  private _syncInert(): void {
    const parent = this.parentNode;
    if (!parent) return;
    const parentEl = parent instanceof ShadowRoot
      ? (parent.host.parentNode as Element)
      : (parent as Element);
    if (!parentEl) return;

    const children = [...parentEl.children];
    const open = this.hasAttribute('open');
    if (open) {
      for (const child of children) {
        if (child !== this) {
          if (!LessDialog._originalInertStates.has(child)) {
            LessDialog._originalInertStates.set(child, child.hasAttribute('inert'));
          }
          child.setAttribute('inert', '');
        }
      }
    } else {
      for (const child of children) {
        if (child !== this) {
          const wasOriginallyInert = LessDialog._originalInertStates.get(child);
          if (wasOriginallyInert) child.setAttribute('inert', '');
          else child.removeAttribute('inert');
          LessDialog._originalInertStates.delete(child);
        }
      }
    }
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.hasAttribute('open')) this._syncInert();
  }

  private _handleClose(): void {
    this.removeAttribute('open');
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

  private _esc = _esc;
  private _escAttr = _escAttr;
}

export default LessDialog;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessDialog);
}
