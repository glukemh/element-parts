import { elementConfig as customElementConfig } from "./custom-element.js";

const partAttribute = 'part-of';

/**
 * @template {Parameters<typeof customElementConfig>[0]} A
 * @template {ElementCallbackConfig} T
 * @param {{ attributes: A, elementCallbackConfig: T }} config
 */
export function elementConfig(config) {
  class PartsElement extends customElementConfig(config.attributes) {
    // /** 
    //  * @template {HTMLElement} U
    //  * @this {{ new(): U }}
    //  * @param {ElementCallbackMethods<U, T>} methods
    //  */
    // static elementPartCallbacks(methods) {
    //   Object.assign(this.prototype, methods);
    // }
    elementParts() {
      return elementParts(this, config.elementCallbackConfig);
    }
  }
  return PartsElement;
}

/**
 * @template {ElementCallbackConfig} T
 * @param {HTMLElement} el
 * @param {T} config
 */
function elementParts(el, config) {
  /** @type {Record<string, Set<string>>} */
  const partNames = {};
  /** @type {Record<string, Set<string>>} */
  const tagFilters = {};
  /** @type {Record<string, Set<Element>> } */
  const partsElements = {};
  for (const [partKey, partsStr = ""] of Object.entries(el.dataset)) {
    for (const partName of partsStr.split(" ")) {
      if (!partName) continue;
      partNames[partName] ??= new Set();
      partNames[partName].add(partKey);
    }
    partsElements[partKey] = new Set();
    tagFilters[partKey] = new Set(config[partKey]?.expect ?? []);
  }

  const queriedPartElements = el.querySelectorAll(`[${partAttribute}]:not(${PartsRoot.tag} *)`);
  for (const queriedEl of queriedPartElements) {
    const partNamesStr = queriedEl.getAttribute(partAttribute) ?? "";
    for (const part of partNamesStr.split(' ')) {
      if (!part) continue;
      const partKeys = partNames[part];
      if (!partKeys) continue;
      for (const key of partKeys) {
        if (tagFilters[key].size && !tagFilters[key].has(queriedEl.localName)) continue;
        partsElements[key].add(queriedEl);
      }
    }
  }

  return /** @type {ElementParts<T>} */(partsElements);
}

/**
 * @template T
 * @typedef {{
 *  [K in keyof T]: Set<HTMLElementTagNameMap[T[K] extends { expect: (infer U)[] } ? (U extends keyof HTMLElementTagNameMap ? U : any) : any]>
 * }} ElementParts
 */

class PartsRoot extends HTMLElement {
  static tag = 'parts-root';

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
 * @template {PartDataAttributes} A
 * @param {PartsDataConfig<A>} config
 */
export function partsDataRecord(config) {
  const record = Object.fromEntries(Object.entries(config['part-data-attributes']).map(([name, { expect }]) => {
    const parts = name.split('-');
    let camelCase = parts.shift() ?? '';
    for (const part of parts) {
      const first = part.charAt(0);
      if (!first) continue;
      camelCase += first.toUpperCase() + part.slice(1);
    }
    return [camelCase, { expect: expect ? Object.keys(expect) : [] }];
  }));
  return /** @type {PartDataAttributesToCallbackRecord<A>} */(record);
}


customElements.define(PartsRoot.tag, PartsRoot);

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
 * @template {PartDataAttributes} D
 * @typedef PartsDataConfig
 * @prop {string} name - The custom element tag name.
 * @prop {string} [description] - The description of the custom element.
 * @prop {D} `part-data-attributes` - The attributes with their values and description.
 */
/**
 * @typedef {Record<string, { description?: string, expect?: Record<string, string> }>} PartDataAttributes
 */
/**
 * @template {PartDataAttributes} D
 * @typedef {{
 *  [K in keyof D as K extends string ? KebabToCamel<K> : never]: D[K] extends { expect: infer U } ? { expect: (keyof U)[] } : { expect: ['any element']}
 * }} PartDataAttributesToCallbackRecord
 */
/**
 * @template {string} S
 * @typedef {S extends `${infer T}-${infer U}` ? `${T}${Capitalize<KebabToCamel<U>>}` : S} KebabToCamel
 */
