import { FinElement, h } from './element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

export default class Icon extends FinElement {
  constructor(name) {
    super('div', `${CSS_PREFIX}-icon`);
    this.iconNameEl = h('div', `${CSS_PREFIX}-icon-img ${name}`);
    this.appendChildByStrOrEl(this.iconNameEl);
  }

  setName(name) {
    this.iconNameEl.className(`${CSS_PREFIX}-icon-img ${name}`);
  }
}
