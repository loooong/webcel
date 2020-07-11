import { h } from './element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

export default class FormInput {
  constructor(width, hint) {
    this.vchange = () => {};
    this.el = h('div', `${CSS_PREFIX}-form-input`);
    this.input = h('input', '').css('width', width)
      .on('input', evt => this.vchange(evt))
      .updateAttrByKeyValue('placeholder', hint);
    this.el.appendChildByStrOrEl(this.input);
  }

  hint(v) {
    this.input.updateAttrByKeyValue('placeholder', v);
  }

  val(v) {
    return this.input.val(v);
  }
}
