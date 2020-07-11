import {Dropdown} from './dropdown';
import Icon from '../basic_unit/icon';
import BorderPalette from '../comp_single_file/border_palette';

export default class DropdownBorder extends Dropdown {
  constructor() {
    const icon = new Icon('border-all');
    const borderPalette = new BorderPalette();
    borderPalette.change = (v) => {
      this.change(v);
      this.hide();
    };
    super(icon, 'auto', false, 'bottom-left', {type: false}, borderPalette.el );
    this.borderPalette = borderPalette;
  }
}

