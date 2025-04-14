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
          console.debug(config);
          const filter = new Set(config[method]?.expect ?? []);
          for (const part of (parts === "" ? [method] : parts.split(" "))) {
            if (!part) continue;
            const elements = partsMap.get(part);
            if (!elements) continue;
            for (const el of elements) {
              if (filter.size && !filter.has(el.localName)) continue;
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

/** 
 * @template {ShDataAttributes} A
 * @param {ShDataConfig<A>} config
 */
export function shDataRecord(config) {
  const record = Object.fromEntries(Object.entries(config['sh-data-attributes']).map(([name, { expect }]) => {
    const parts = name.split('-');
    let camelCase = parts.shift() ?? '';
    for (const part of parts) {
      const first = part.charAt(0);
      if (!first) continue;
      camelCase += first.toUpperCase() + part.slice(1);
    }
    return [camelCase, { expect: expect ? Object.keys(expect) : [] }];
  }));
  return /** @type {ShDataAttributesToCallbackRecord<A>} */(record);
}


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
/**
 * @template {ShDataAttributes} D
 * @typedef ShDataConfig
 * @prop {string} name - The custom element tag name.
 * @prop {string} [description] - The description of the custom element.
 * @prop {D} `sh-data-attributes` - The attributes with their values and description.
 */
/**
 * @typedef {Record<string, { description?: string, expect?: Record<string, string> }>} ShDataAttributes
 */
/**
 * @template {ShDataAttributes} D
 * @typedef {{
 *  [K in keyof D as K extends string ? KebabToCamel<K> : never]: D[K] extends { expect: infer U } ? { expect: (keyof U)[] } : { expect: ['any element']}
 * }} ShDataAttributesToCallbackRecord
 */
/**
 * @template {string} S
 * @typedef {S extends `${infer T}-${infer U}` ? `${T}${Capitalize<KebabToCamel<U>>}` : S} KebabToCamel
 */
