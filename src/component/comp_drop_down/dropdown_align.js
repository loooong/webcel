import {Dropdown} from './dropdown';
import { h } from '../basic_unit/element';
import Icon from '../basic_unit/icon';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

function buildItemWithIcon(iconName) {
  return h('div', `${CSS_PREFIX}-item`).appendChildByStrOrEl(new Icon(iconName));
}

export default class DropdownAlign extends Dropdown {
  constructor(aligns, align) {
    const icon = new Icon(`align-${align}`);
    const naligns = aligns.map(it => buildItemWithIcon(`align-${it}`)
      .on('click', () => {
        this.setTitle(it);
        this.change(it);
      }));
    super(icon, 'auto', true, 'bottom-left',  {type: false}, ...naligns );
  }

  setTitle(align) {
    this.title.setName(`align-${align}`);
    this.hide();
  }
}
