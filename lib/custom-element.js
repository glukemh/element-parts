

class ElementBase extends HTMLElement {
  static formAssociated = false;

  /**
   * @template {AttributeRecord} A
   * @param {Partial<LifecycleMethods<A, HTMLElement>>} methods
   */
  static lifecycleCallbacks(methods) {
    Object.assign(this.prototype, methods);
  }

  /**
   * Makes the element form-associated in addition to setting form callback methods.
   * @template {HTMLElement} U
   * @this {{ new(): U } & typeof ElementBase }
   * @param {Partial<FormRelatedMethods<U>>} methods 
   */
  static formCallbacks(methods) {
    this.formAssociated = true;
    Object.assign(this.prototype, methods);
  }

  /** @param {string} name */
  static register(name) {
    customElements.define(name, this);
  }

  /** @type {AbortController | null} */
  #disconnectController = null;
  get disconnectSignal() {
    const { signal } = this.#disconnectController ??= new AbortController();
    return signal;
  }

  abortDisconnectSignal() {
    this.#disconnectController?.abort();
    this.#disconnectController = null;
  }

  disconnectedCallback() {
    this.abortDisconnectSignal();
  }

}

/**
 * @template {AttributeRecord} const A
 * @param {A} attributes
*/
export function elementConfig(attributes) {
  const observed = [];
  const values = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value.observe) observed.push(key);
    values[key] = value.values;
  }
  class ConfigElementBase extends ElementBase {
    static get observedAttributes() {
      return /** @type {(keyof ObservedAttributes<A>)[]} */(observed);
    }
    static get attributeValues() {
      return /** @type {{ [K in keyof A]: A[K]['values'] }} */(values);
    }
    /**
     * @template {HTMLElement} U
     * @this {{ new(): U }}
     * @param {Partial<LifecycleMethods<A, U>>} methods
     */
    static lifecycleCallbacks(methods) {
      super.lifecycleCallbacks(methods);
    }

    /**
     * @template {keyof A} T
     * @param {T} name 
     */
    attrValue(name) {
      return /** @type {AttributeRecordValues<A, T>} */(this.getAttribute(/** @type {string} */(name)));
    }

    /**
     * @template {keyof A} T
     * @param {T} name 
     * @param {AttributeRecordValues<A, T>} value
     */
    setAttr(name, value) {
      if (value === null) {
        this.removeAttribute(/** @type {string} */(name));
      } else {
        this.setAttribute(/** @type {string} */(name), value);
      }
    }
  };

  return ConfigElementBase;
}



/**
 * @template {AttributeRecord} A
 * @typedef {{ [K in keyof A as A[K] extends { observe: true } ? K : never]: A[K] }} ObservedAttributes
 */
/**
 * @template {AttributeRecord} A
 * @template {keyof A} T
 * @typedef {{ [K in keyof A]: [K, AttributeRecordValues<A, K>, AttributeRecordValues<A, K>]}[T]} AttributeChangedCallbackParams
 */
/**
 * @template {AttributeRecord} A
 * @template {HTMLElement} U
 * @typedef LifecycleMethods
 * @prop {(this: U, ...params: AttributeChangedCallbackParams<A, keyof ObservedAttributes<A>>) => void } attributeChangedCallback
 * @prop {(this: U, signal: AbortSignal) => void} connectSignalCallback
 * @prop {(this: U) => void} connectedCallback
 * @prop {(this: U) => void} disconnectedCallback
 * @prop {(this: U) => void} adoptedCallback
 */
/**
 * @template {HTMLElement} U
 * @typedef FormRelatedMethods
 * @prop {(this: U, form: HTMLFormElement | null) => void} formAssociatedCallback
 * @prop {(this: U) => void} formResetCallback
 * @prop {(this: U, isDisabled: boolean) => void} formDisabledCallback
 * @prop {(this: U, state: string | File | FormData, reason: 'restore' | 'autocomplete') => void} formStateRestoreCallback
 */
/**
 * @template {AttributeRecord} A
 * @template {keyof A} T
 * @typedef {null | (A[T]['values'] extends infer U ? (U extends readonly [] ? string : (U extends readonly (infer V)[] ? V : never)) : never)} AttributeRecordValues
*/
/**
 * @typedef {{ readonly [K in string]: { readonly values: readonly string[], readonly observe?: boolean } }} AttributeRecord
 */