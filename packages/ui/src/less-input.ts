/**
 * @lessjs/ui - less-input
 *
 * Minimal input field following Swiss International Style.
 * Clean borders, subtle focus states.
 *
 * Features:
 * - Form-associated: participates in native <form> submission
 * - Supports label, placeholder, error, disabled, required
 * - Dispatches 'less-input' custom event on value change
 *
 * Usage:
 * ```html
 * <less-input placeholder="Enter text"></less-input>
 * <less-input type="email" label="Email"></less-input>
 * <less-input type="password" label="Password" required></less-input>
 * <form onsubmit="console.log(new FormData(this))">
 *   <less-input name="username" label="Username"></less-input>
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * LessJS Architecture (S — Semantic):
 * Form-associated custom elements integrate with native <form>,
 * maintaining progressive enhancement and semantic correctness.
 */

import { css, type CSSResult, html, nothing, type TemplateResult } from 'lit';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { lessDesignTokens } from './design-tokens.js';

export const tagName = 'less-input';

export class LessInput extends DsdLitElement {
  /** Enable form association for native <form> participation */
  static formAssociated = true;

  /** DSD: delegates focus to the input element inside shadow DOM */
  static delegatesFocus = true;

  /** Element internals for form participation */
  private _internals?: ElementInternals;

  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: block;
      }

      .input-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--less-size-2);
      }

      label {
        font-size: var(--less-font-size-sm);
        font-weight: var(--less-font-weight-medium);
        color: var(--less-text-tertiary);
        letter-spacing: var(--less-letter-spacing-wide);
      }

      .input {
        width: 100%;
        padding: var(--less-size-2) var(--less-size-3);
        font-family: var(--less-font-sans);
        font-size: var(--less-font-size-md);
        color: var(--less-text-primary);
        background: var(--less-bg-base);
        border: 0.5px solid var(--less-border);
        border-radius: var(--less-radius-md);
        transition:
          border-color var(--less-transition-normal),
          box-shadow var(--less-transition-normal);
        outline: none;
      }

      .input::placeholder {
        color: var(--less-text-muted);
      }

      .input:hover {
        border-color: var(--less-border-hover);
      }

      .input:focus {
        border-color: var(--less-accent);
        box-shadow: 0 0 0 1px var(--less-accent);
      }

      .input:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--less-bg-surface);
      }

      .input--error {
        border-color: var(--less-error, #e55);
      }

      /* :state() pseudo-class support — CSS custom states via ElementInternals */
      :host(:state(disabled)) .input {
        opacity: 0.5;
        cursor: not-allowed;
        background: var(--less-bg-surface);
      }

      :host(:state(invalid)) .input {
        border-color: var(--less-error, #e55);
      }

      .error-message {
        font-size: var(--less-font-size-xs);
        color: var(--less-error, #e55);
      }
    `,
  ];

  static override properties = {
    type: { type: String },
    placeholder: { type: String },
    label: { type: String },
    value: { type: String },
    name: { type: String },
    disabled: { type: Boolean, reflect: true },
    required: { type: Boolean },
    error: { type: String },
  };

  /** Input type: 'text', 'email', 'password', 'number', or 'url' (default: 'text') */
  declare type: 'text' | 'email' | 'password' | 'number' | 'url';
  /** Placeholder text shown when input is empty */
  declare placeholder: string | undefined;
  /** Label text displayed above the input */
  declare label: string | undefined;
  /** Current value of the input */
  declare value: string | undefined;
  /** Name attribute for form submission */
  declare name: string | undefined;
  /** Whether the input is disabled */
  declare disabled: boolean;
  /** Whether the input is required (shows * after label) */
  declare required: boolean;
  /** Error message displayed below the input (also applies error styling) */
  declare error: string | undefined;

  constructor() {
    super();
    this.type = 'text';
    this.placeholder = undefined;
    this.label = undefined;
    this.value = undefined;
    this.name = undefined;
    this.disabled = false;
    this.required = false;
    this.error = undefined;
  }

  override connectedCallback() {
    super.connectedCallback();
    // Initialize ElementInternals for form participation
    this._internals = this.attachInternals();
    this._internals.setFormValue(this.value ?? '');
    this._updateStates();
  }

  /** Update :state() pseudo-classes via ElementInternals */
  private _updateStates(): void {
    if (!this._internals?.states) return;
    if (this.disabled) {
      this._internals.states.add('disabled');
      this._internals.states.delete('enabled');
    } else {
      this._internals.states.delete('disabled');
      this._internals.states.add('enabled');
    }
  }

  override updated(changed: Map<string, unknown>): void {
    super.updated(changed);
    if (changed.has('disabled') || changed.has('error')) {
      this._updateStates();
    }
  }

  /** Called by the browser when the form is reset */
  formResetCallback() {
    this.value = '';
    this.error = undefined;
    this._internals?.setFormValue('');
  }

  /** Called by the browser when the form's disabled state changes */
  formDisabledCallback(disabled: boolean) {
    this.disabled = disabled;
  }

  /** When DSD hydrated, return nothing — the shadow DOM already has content. */
  override render(): TemplateResult | typeof nothing {
    if (this._dsdHydrated) return nothing;
    // LessJS S-constraint: use aria-describedby + aria-errormessage for
    // accessible error association; <small role="alert"> is semantic.
    const errorId = this.error ? 'input-error' : undefined;
    return html`
      <div class="input-wrapper">
        ${this.label
          ? html`
            <label for="input">${this.label}${this.required ? ' *' : ''}</label>
          `
          : ''}
        <input
          id="input"
          class="input ${this.error ? 'input--error' : ''}"
          type="${this.type}"
          placeholder="${this.placeholder}"
          .value="${this.value ?? ''}"
          name="${this.name}"
          ?disabled="${this.disabled}"
          ?required="${this.required}"
          aria-invalid="${this.error ? 'true' : nothing}"
          aria-describedby="${errorId || nothing}"
          aria-errormessage="${errorId || nothing}"
          @input="${(e: Event) => this._handleInput(e)}"
        />
        ${this.error
          ? html`
            <small id="input-error" role="alert" class="error-message">${this.error}</small>
          `
          : ''}
      </div>
    `;
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.value = input.value;
    // Sync form value for native <form> submission
    this._internals?.setFormValue(input.value);
    // LessJS I-constraint: composed:false keeps events within Shadow DOM.
    // Parent islands must listen via `addEventListener('less-input', ...)` on
    // the <less-input> host element — NOT by capturing from the light DOM.
    this.dispatchEvent(
      new CustomEvent('less-input', {
        detail: { value: input.value },
        bubbles: true,
        composed: false,
      }),
    );
  }
}

// Guard: idempotent across SSR paths
if (!customElements.get(tagName)) customElements.define(tagName, LessInput);
