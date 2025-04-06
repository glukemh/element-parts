import { ShData } from '../lib/sh.js';
import { attributeRecord } from '../lib/element-config.js';
import { define } from '../lib/custom-element.js';
import config from './my-root.json' with { type: 'json' };

class MyRoot extends define().attributes(attributeRecord(config)).tag(config.name).class() {
  static {
    this.lifecycleCallbacks({
      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'title') {
          if (newValue === 'Web Page') {
          }
        }
      }
    });
  }
}


export default {
  'title-part': (el) => {
    el.textContent = '~Dynamic~';
  }
};