/** @import {ElementCallbackConfig} from "../lib/sh.js" */
import { define } from '../lib/sh.js';
import { attributeRecord } from '../lib/element-config.js';
import config from './my-root.def.json' with { type: 'json' };

/** @satisfies {ElementCallbackConfig} */
const dataConfig = /** @type {const} */({
  titleEl: {
    expect: ['h1', 'h2', 'span'],
  },
  randomNumber: {
    expect: ['div', 'span'],
  }
});

class MyRoot extends define().shDataConfig(dataConfig).attributes(attributeRecord(config)).tag(config.name).class() {
  static {
    console.debug(`Registering ${this.tag}`);
    this.lifecycleCallbacks({
      connectedCallback() {
        console.debug(`Connected ${MyRoot.tag}`);
        this.hydrate();
      },
      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title') {
          if (newValue === 'Web Page') {
          }
        }
      }
    }).shDataCallbacks({
      titleEl(el) {
        el.textContent = this.attrValue('title') ?? 'Default Title';
      },
      randomNumber(el) {
        el.textContent = (Math.random() * 100).toFixed(2);
      }
    });
    this.register();
  }
}
