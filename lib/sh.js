import ElementBuilder from "./custom-element.js";

export { define, ShElementBuilder };

/**
 * @template {CustomElementConstructor} B
 * @extends {ElementBuilder<B>}
 */
class ShElementBuilder extends ElementBuilder {
  static define() {
    return new ShElementBuilder(HTMLElement);
  }
  /**
   * @template {ElementCallbackConfig} T
   * @param {T} config
   */
  shDataConfig(config) {
    const Base = this.elementClass;
    class ShElement extends Base {
      /** 
       * @template {typeof ShElement} B
       * @this {B}
       * @param {ElementCallbackMethods<InstanceType<B>, T>} methods
       */
      static shDataCallbacks(methods) {
        Object.assign(this.prototype, methods);
        return this;
      }

      hydrate() {
        const parts = this.querySelectorAll(`[sh-part]:not(${ShRoot.tag} *)`);
        /** @type {Map<string, Set<Element>>} */
        const partsMap = new Map();
        for (const el of parts) {
          const partNames = el.getAttribute('sh-part');
          if (!partNames) continue;
          for (const part of partNames.split(' ')) {
            if (!part) continue;
            let current = partsMap.get(part);
            if (!current) {
              current = new Set();
              partsMap.set(part, current);
            }
            current.add(el);
          }
        }
        for (const [method, parts = ""] of Object.entries(this.dataset)) {
          const filter = new Set(config[method]?.expect ?? []);
          for (const part of (parts === "" ? [method] : parts.split(" "))) {
            if (!part) continue;
            const elements = partsMap.get(part);
            if (!elements) continue;
            for (const el of elements) {
              if (!filter.has(el.localName)) continue;
              try {
                this[method](el);
              } catch (e) {
                console.error(`Hydration error calling ${method} on ${this.tagName}:`, e);
              }
            }
          }
        }
      }
    }
    return new ShElementBuilder(ShElement);
  }
}

const { define } = ShElementBuilder;

class ShRoot extends HTMLElement {
  static tag = 'sh-root';

  slotEl = document.createElement('slot');
  shadow = this.attachShadow({ mode: 'open' });
  constructor() {
    super();
    this.shadow.append(this.slotEl);
  }

  connectedCallback() {
    this.slotEl.addEventListener('slotchange', this);
    this.connectRoot();
  }

  disconnectedCallback() {
    this.slotEl.removeEventListener('slotchange', this);
  }

  handleEvent() {
    this.connectRoot();
  }

  connectRoot() {
    const { parentNode } = this;
    if (!parentNode || !this.hasChildNodes()) return;
    let root = parentNode;
    if (parentNode instanceof HTMLElement) {
      root = parentNode.shadowRoot || parentNode.attachShadow({ mode: 'open' });
    }

    root.append(...this.childNodes);
  }
}

class ShDef extends HTMLElement {
  static observedAttributes = ['tags', 'prefix', 'suffix'];

  /** 
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'tags' && newValue) {
      const prefix = this.getAttribute('prefix') || '';
      const suffix = this.getAttribute('suffix') || '';
      for (const tagName of newValue.split(' ')) {
        if (!tagName || customElements.get(tagName)) continue;
        const path = prefix + tagName + suffix;
        import(path).catch(e => {
          console.error(`Error loading ${path}:`, e);
        });
      }
    }
  }
}


customElements.define('sh-def', ShDef);
customElements.define(ShRoot.tag, ShRoot);

/**
 * @template {HTMLElement} B
 * @template {ElementCallbackConfig} T
 * @typedef {{
*  [K in keyof T]: (this: B, el: T[K] extends { expect: Array<infer U> } ? (U extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[U] : Element) : Element) => void;
* }} ElementCallbackMethods
*/
/**
* @typedef {Record<string, { expect: string[] }>} ElementCallbackConfig
*/


