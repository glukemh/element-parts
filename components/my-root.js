/** @import {ElementCallbackConfig} from "../lib/sh.js" */
import { define, shDataRecord } from '../lib/sh.js';
import { attributeRecord } from '../lib/element-config.js';
import config from './my-root.def.json' with { type: 'json' };

class MyRoot extends define().shDataConfig(shDataRecord(config)).attributes(attributeRecord(config)).tag(config.name).class() {
  static {
    this.lifecycleCallbacks({
      connectedCallback() {
        console.debug(`Connected ${MyRoot.tag}`);
        this.hydrate();
      },
      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title-text') {
          if (newValue === 'Web Page') {
          }
        }
      }
    }).shDataCallbacks({
      titleEl(el) {
        el.textContent = this.attrValue('title-text') ?? 'Default Title';
      },
      randomNumber(el) {
        el.textContent = (Math.random() * 100).toFixed(2);
      }
    });
    this.register();
  }
}
