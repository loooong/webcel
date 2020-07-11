import {Dropdown} from './dropdown';
import { h } from '../basic_unit/element';
import { fontSizes } from '../../core/core_utils/font';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

export default class DropdownFontSize extends Dropdown {
  constructor() {
    const nfontSizes = fontSizes.map(it => h('div', `${CSS_PREFIX}-item`)
      .on('click', () => {
        this.setTitle(`${it.pt}`);
        this.change(it);
      })
      .appendChildByStrOrEl(`${it.pt}`));
    super('10', '60px', true, 'bottom-left', {type: false}, ...nfontSizes );
  }
}
