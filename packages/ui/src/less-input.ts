/**
 * @lessjs/ui - less-input
 *
 * Minimal input field following Swiss International Style.
 * Clean borders, subtle focus states.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 *
 * Features:
 * - Form-associated: participates in native <form> submission
 * - Supports label, placeholder, error, disabled, required
 * - Dispatches 'less-input' custom event on value change
 *
 * @csspart wrapper â€?The outer input-wrapper div
 * @csspart label â€?The label element
 * @csspart control â€?The input/textarea/select element
 * @csspart error â€?The error message small element
 *
 * Usage:
 * ```html
 * <less-input placeholder="Enter text"></less-input>
 * <less-input type="email" label="Email"></less-input>
 * <form onsubmit="console.log(new FormData(this))">
 *   <less-input name="username" label="Username"></less-input>
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */

import { DsdElement, StyleSheet, type HydrateEventDescriptor } from '@lessjs/core';

export const tagName = 'less-input';

const sheet = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: var(--size-2);
  }

  label {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    color: var(--gray-6);
    letter-spacing: 0.02em;
  }

  .input {
    width: 100%;
    padding: var(--size-2) var(--size-3);
    font-family: var(--font-sans);
    font-size: var(--font-size-1);
    color: var(--gray-9);
    background: var(--gray-0);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
  }

  .input::placeholder {
    color: var(--gray-5);
  }

  .input:hover {
    border-color: var(--gray-5);
  }

  .input:focus {
    border-color: var(--brand, var(--indigo-6));
    box-shadow: 0 0 0 1px var(--brand, var(--indigo-6));
  }

  .input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-1);
  }

  .input--error {
    border-color: #e55;
  }

  :host(:state(disabled)) .input {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--gray-1);
  }

  :host(:state(invalid)) .input {
    border-color: #e55;
  }

  .error-message {
    font-size: var(--font-size-00);
    color: #e55;
  }
`);

export class LessInput extends DsdElement {
  static override styles = sheet;
  static override formAssociated = true;
  static override delegatesFocus = true;
  static override observedAttributes = ['type', 'placeholder', 'label', 'value', 'name', 'disabled', 'required', 'error'];

  static override hydrateEvents: HydrateEventDescriptor[] = [
    { selector: 'input, textarea, select', event: 'input', method: '_handleInput' },
    { selector: 'input, textarea, select', event: 'change', method: '_handleChange' },
    { selector: 'input, textarea, select', event: 'focus', method: '_handleFocus' },
    { selector: 'input, textarea, select', event: 'blur', method: '_handleBlur' },
  ];


  override render(): string {
    const type = this.getAttribute('type') || 'text';
    const placeholder = this._escAttr(this.getAttribute('placeholder') || '');
    const label = this.getAttribute('label') || '';
    const value = this._escAttr(this.getAttribute('value') || '');
    const name = this._escAttr(this.getAttribute('name') || '');
    const d = this.hasAttribute('disabled');
    const r = this.hasAttribute('required');
    const error = this.getAttribute('error') || '';
    const errorClass = error ? ' input--error' : '';

    const labelHtml = label
      ? `<label for="input" part="label">${this._esc(label)}${r ? ' *' : ''}</label>`
      : '';

    const errorHtml = error
      ? `<small id="input-error" role="alert" class="error-message" part="error">${this._esc(error)}</small>`
      : '';

    const ariaAttrs = error
      ? 'aria-invalid="true" aria-describedby="input-error" aria-errormessage="input-error"'
      : '';

    return `<div class="input-wrapper" part="wrapper">
      ${labelHtml}
      <input
        id="input"
        class="input${errorClass}"
        part="control"
        type="${type}"
        placeholder="${placeholder}"
        value="${value}"
        name="${name}"
        ${d ? 'disabled' : ''}
        ${r ? 'required' : ''}
        ${ariaAttrs}
      />
      ${errorHtml}
    </div>`;
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'disabled' || name === 'error') {
      this._syncDOM();
      this._updateStates();
    } else if (name === 'value') {
      this._syncDOM();
      if (this._internals) {
        this._internals.setFormValue(val || '');
      }
    } else {
      this._syncDOM();
    }
  }

  private _syncDOM(): void {
    const input = this.shadowRoot?.querySelector('input, textarea, select') as HTMLInputElement | null;
    if (!input) return;
    input.disabled = this.hasAttribute('disabled');
    const val = this.getAttribute('value');
    if (val !== null && input.value !== val) {
      input.value = val;
    }
  }

  private _updateStates(): void {
    if (!this._internals?.states) return;
    if (this.hasAttribute('disabled')) {
      this._internals.states.add('disabled');
      this._internals.states.delete('enabled');
    } else {
      this._internals.states.delete('disabled');
      this._internals.states.add('enabled');
    }
    if (this.getAttribute('error')) {
      this._internals.states.add('invalid');
    } else {
      this._internals.states.delete('invalid');
    }
  }

  private _handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.setAttribute('value', input.value);
    this._internals?.setFormValue(input.value);
    this.dispatchEvent(new CustomEvent('less-input', {
      detail: { value: input.value },
      bubbles: true,
      composed: false,
    }));
  }

  private _handleChange(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(new CustomEvent('less-change', {
      detail: { value: input.value },
      bubbles: true,
      composed: false,
    }));
  }

  private _handleFocus(): void {
    this.dispatchEvent(new CustomEvent('less-focus', { bubbles: true, composed: false }));
  }

  private _handleBlur(): void {
    this.dispatchEvent(new CustomEvent('less-blur', { bubbles: true, composed: false }));
  }

  formResetCallback(): void {
    this.setAttribute('value', '');
    this.removeAttribute('error');
    this._internals?.setFormValue('');
    this._syncDOM();
  }

  formDisabledCallback(disabled: boolean): void {
    if (disabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  private _esc(s: string): string {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  private _escAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}

// Guard: idempotent across SSR paths
if (!customElements.get(tagName)) customElements.define(tagName, LessInput);
