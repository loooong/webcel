/* global describe, it */
import {Dropdown} from './dropdown';
import Icon from '../basic_unit/icon';
import ColorPalette from '../comp_single_file/color_palette';

export default class DropdownColor extends Dropdown {
  constructor(iconName, color) {
    const icon = new Icon(iconName)
      .css('height', '16px')
      .css('border-bottom', `3px solid ${color}`);
    const colorPalette = new ColorPalette();
    colorPalette.change = (v) => {
      this.setTitle(v);
      this.change(v);
    };
    super(icon, 'auto', false, 'bottom-left', {type: false}, colorPalette.el);
    this.colorPalette = colorPalette;  // 测试用例有用到
  }

  setTitle(color) {
    this.title.css('border-color', color);
    this.hide();
  }
}
