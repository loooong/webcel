import {Dropdown} from './dropdown';
import { h } from '../basic_unit/element';
import { baseFonts } from '../../core/core_utils/font';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

export default class DropdownFont extends Dropdown {
  constructor() {
    const nfonts = baseFonts.map(it => h('div', `${CSS_PREFIX}-item`)
      .on('click', () => {
        this.setTitle(it.title);
        this.change(it);
      })
      .appendChildByStrOrEl(it.title));
    super(baseFonts[0].title, '160px', true, 'bottom-left', {type: false}, ...nfonts );
  }
}
