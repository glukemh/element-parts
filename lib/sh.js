class ShRoot extends HTMLElement {
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

/**
 * @template
 */
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

export class ShData extends HTMLElement {
  async hydrate() {
    const parts = this.querySelectorAll("[sh-part]:not(sh-root *)");
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
      for (const part of parts.split(" ")) {
        if (!part) continue;
        const elements = partsMap.get(part);
        if (!elements) continue;
        for (const el of elements) {
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


customElements.define('sh-def', ShDef);
customElements.define('sh-root', ShRoot);

