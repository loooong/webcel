import {Dropdown} from './dropdown';
import Icon from '../basic_unit/icon';
import { h } from '../basic_unit/element';
import { calc } from '../../calc';
// import { allFnObj } from '../calc/calc_cmd/mock_calc';

import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

export default class DropdownFormula extends Dropdown {
  constructor() {
    const nformulas = calc.allFnObj.map(it => h('div', `${CSS_PREFIX}-item`)
      .on('click', () => {
        this.hide();
        this.change(it);
      })
      .appendChildByStrOrEl(it.key));
    super(new Icon('cellFormulaProxy'), '180px', true, 'bottom-left', {type: false}, ...nformulas );
  }
}
