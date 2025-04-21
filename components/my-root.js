import { elementConfig, partsDataRecord } from '../lib/sh.js';
import { attributeRecord } from '../lib/element-config.js';
import config from './my-root.def.json' with { type: 'json' };

export default class MyRoot extends elementConfig({ attributes: attributeRecord(config), elementCallbackConfig: partsDataRecord(config) }) {
  static {
    this.lifecycleCallbacks({
      connectedCallback() {
        const { titleEl, randomNumber } = this.elementParts();
        titleEl.forEach(el => {
          el.textContent = this.attrValue('title-text') ?? this.defaultTitle;
        });
        randomNumber.forEach(el => {
          el.textContent = (Math.random() * 100).toFixed(2);
        });
        this.disconnectSignal.addEventListener('abort', () => {
          console.debug(`Disconnected ${this.tagName}`);
        });
      },
    });
    this.register(config.name);
  }

  defaultTitle = 'Default Title';
}
