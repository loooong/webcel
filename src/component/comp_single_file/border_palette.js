import { h } from '../basic_unit/element';
import Icon from '../basic_unit/icon';
import DropdownColor from '../comp_drop_down/dropdown_color';
import DropdownLineType from '../comp_drop_down/dropdown_linetype';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

function buildTable(...trs) {
  return h('component_table.js', '').appendChildByStrOrEl(
    h('tbody', '').children(...trs),
  );
}

function buildTd(iconName) {
  let item =  h('div', `${CSS_PREFIX}-border-palette-cell`);
  this.items.push(item);
  return h('td', '').appendChildByStrOrEl(
    item.appendChildByStrOrEl(
      new Icon(`border-${iconName}`),
    ).on('click', () => {
      this.mode = iconName;
      const { mode, style, color } = this;
      this.change({ mode, style, color });
    }),
  );
}

export default class BorderPalette {
  constructor() {
    this.color = '#000';
    this.style = 'thin';
    this.mode = 'all';
    this.change = () => {};
    this.ddColor = new DropdownColor('line-color', this.color);
    this.ddColor.change = (color) => {
      this.color = color;
    };
    this.ddType = new DropdownLineType(this.style);
    this.ddType.change = ([s]) => {
      this.style = s;
    };
    this.el = h('div', `${CSS_PREFIX}-border-palette`);
    this.items = [];

    const table = buildTable(
      h('tr', '').children(
        h('td', `${CSS_PREFIX}-border-palette-left`).appendChildByStrOrEl(
          buildTable(
            h('tr', '').children(
              ...['all', 'inside', 'horizontal', 'vertical', 'outside'].map(it => buildTd.call(this, it)),
            ),
            h('tr', '').children(
              ...['left', 'top', 'right', 'bottom', 'none'].map(it => buildTd.call(this, it)),
            ),
          ),
        ),
        h('td', `${CSS_PREFIX}-border-palette-right`).children(
          h('div', `${CSS_PREFIX}-toolbar-btn`).appendChildByStrOrEl(this.ddColor.el),
          h('div', `${CSS_PREFIX}-toolbar-btn`).appendChildByStrOrEl(this.ddType.el),
        ),
      ),
    );
    this.el.appendChildByStrOrEl(table);
  }
}
