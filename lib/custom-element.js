
export { define };
/**
 * @template {CustomElementConstructor} B
 */
class ElementBuilder {
  /**
   * @template {CustomElementConstructor} B
   * @overload
   * @param {B} Base
   * @returns {ElementBuilder<B>}
   */
  /**
   * @overload
   * @returns {ElementBuilder<typeof HTMLElement>}
   */
  /**
   * @param {CustomElementConstructor} [Base]
   * @returns {ElementBuilder<CustomElementConstructor>}
   */
  static define(Base) {
    return new ElementBuilder(Base ?? HTMLElement);
  }

  #elementClass;

  /** @param {B} baseConstructor */
  constructor(baseConstructor) {
    this.#elementClass = baseConstructor;
  }

  /**
   * @template {AttributeRecord} A
   * @param {A} attributes
   */
  attributes(attributes) {
    class AttributesElement extends this.#elementClass {
      static #attributeRecord = attributes;
      static get attributeRecord() {
        return this.#attributeRecord;
      }
      static #observedAttributes = /** @type {(keyof ObservedAttributes<A>)[]} */(Object.entries(attributes).filter(([, v]) => v.observe).map(([k]) => k));
      static get observedAttributes() {
        return this.#observedAttributes;
      }
      /**
       * Set configured attribute value.
       * @template {keyof A} T
       * @overload
       * @param {T} name - Attribute name.
       * @param {AttributeRecordValues<A, T>} value - Set attribute value or remove with null.
       * @returns {void}
       */
      /**
       * Get configured attribute value.
       * @template {keyof A} T
       * @overload
       * @param {T} name - Attribute name.
       * @returns {AttributeRecordValues<A, T> | null}
       */
      /**
       * Get or set configured attribute value.
       * @param {string} name
       * @param {string | null} [value]
       * @returns {string | null | void}
       */
      attrValue(name, value) {
        if (value === undefined) {
          return this.getAttribute(name);
        } else if (value === null) {
          this.removeAttribute(name);
        } else {
          this.setAttribute(name, value);
        }
      }
    }

    return new ElementBuilder(AttributesElement);
  }

  /**
   * Attach shadow if shadow root doesn't already exist.
   * @param {Partial<ShadowRootInit>} [init] - 'mode' defaults to 'open'.
   */
  shadow(init = {}) {
    class ShadowElement extends this.#elementClass {
      #shadow = this.shadowRoot ?? this.attachShadow({ ...init, mode: init.mode ?? 'open' });
      get shadow() {
        return this.#shadow;
      }
    }
    return new ElementBuilder(ShadowElement);
  }

  /**
   * Associate element to forms like input elements.
   */
  formAssociated() {
    class FormAssociatedElement extends this.#elementClass {
      static get formAssociated() {
        return /** @type {const} */(true);
      }

      /** 
       * @template {typeof FormAssociatedElement} T
       * @this {T}
       * @param {Partial<FormRelatedMethods<InstanceType<T>>>} methods
       */
      static formCallbacks(methods) {
        Object.assign(this.prototype, methods);
        return this;
      }
    }
    return new ElementBuilder(FormAssociatedElement);
  }

  /**
   * Attach internals and add default ARIA values.
   * @param {Partial<ARIAMixin>} [aria]
   */
  internals(aria = {}) {
    class InternalsElement extends this.#elementClass {
      #internals = this.attachInternals();
      constructor(...args) {
        super(...args);
        Object.assign(this.internals, aria);
      }
      get internals() {
        return this.#internals;
      }
    }
    return new ElementBuilder(InternalsElement);
  }

  /**
   * Set custom element name to use when registering.
   * @param {string} name
   */
  tag(name) {
    class NamedElement extends this.#elementClass {
      static get tag() {
        return name;
      }
      static register() {
        if (!customElements.get(this.tag)) {
          customElements.define(this.tag, this);
        }
      }
    }
    return new ElementBuilder(NamedElement);
  }

  class() {
    /** @typedef {B extends { attributeRecord: infer A } ? (A extends AttributeRecord ? A : {}) : {}} Attributes */

    class CustomElementClass extends this.#elementClass {
      /** 
       * @template {typeof CustomElementClass} T
       * @this {T}
       * @param {Partial<LifecycleMethods<Attributes, InstanceType<T>>>} methods
       */
      static lifecycleCallbacks(methods) {
        Object.assign(this.prototype, methods);
        return this;
      }
    }
    return CustomElementClass;
  }
}

const { define } = ElementBuilder;

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
 * @prop {(this: U, ...params: AttributeChangedCallbackParams<A, keyof ObservedAttributes<A>>) => void} attributeChangedCallback
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
 * @typedef {null | (A[T]['values'] extends Array<infer V> ? (V extends string ? V : never) : never)} AttributeRecordValues
*/
/**
 * @typedef {Record<string, { values: string[], observe?: boolean }>} AttributeRecord
 */
