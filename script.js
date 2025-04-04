// @ts-check

class Shade extends HTMLElement {
  /** @type {Promise<unknown> | null} */
  static dataPromise = null;
  /** @type {Record<string, () => void> | null} */
  data = null;
  /** @type {Map<string, Set<Element>>} */
  elementMap = new Map();
  slotEl = document.createElement('slot');
  shadow = this.attachShadow({ mode: 'open' });
  constructor() {
    super();
    this.shadow.append(this.slotEl);
    new.target.dataPromise?.then((data) => {
      this.data = /** @type {any} */(data);
      this.hydrate();
    });
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

    for (const el of this.querySelectorAll('[sh-]')) {
      const key = el.getAttribute('sh-');
      if (!key) continue;
      let current = this.elementMap.get(key);
      if (!current) {
        current = new Set();
        this.elementMap.set(key, current);
      }
      current.add(el);
    }

    root.append(...this.childNodes);
    this.hydrate();
  }

  async hydrate() {
    if (!this.data) return;
    for (let { name, value } of this.attributes) {
      if (!value) value = name;
      for (const key of value.split(' ')) {
        if (!key) continue;
        try {
          this.elementMap.get(key)?.forEach(this.data[name]);
        } catch (e) {
          console.error(`Error in ${this.tagName}:`, e);
        }
      }
    }
  }
}

class ShDef extends HTMLElement {
  static observedAttributes = ['names', 'base', 'suffix'];

  /** 
   * @param {string} name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'names' && newValue) {
      const base = this.getAttribute('base') || '/';
      const suffix = this.getAttribute('suffix') || '.js';
      for (const name of newValue.split(' ')) {
        if (!name || customElements.get(name)) continue;
        const path = base + name + suffix;
        customElements.define(name, class extends Shade {
          static dataPromise = import(path).then(({ default: data }) => data).catch(e => {
            console.error(`Error loading ${path}:`, e);
          });
        });
      }
    }
  }
}

customElements.define('sh-def', ShDef);