import { h } from './element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { t } from '../../locale/locale';

const patterns = {
  number: /(^\d+$)|(^\d+(\.\d{0,4})?$)/,
  date: /^\d{4}-\d{1,2}-\d{1,2}$/,
};

// rule: { required: false, type, pattern: // }
export default class FormField {
  constructor(input, rule, label, labelWidth) {
    this.label = '';
    this.rule = rule;
    if (label) {
      this.label = h('label', 'label').css('width', `${labelWidth}px`).updateInnerHtml(label);
    }
    this.tip = h('div', 'tip').appendChildByStrOrEl('tip').hide();
    this.input = input;
    this.input.vchange = () => this.validate();
    this.el = h('div', `${CSS_PREFIX}-form-field`)
      .children(this.label, input.el, this.tip);
  }

  isShow() {
    return this.el.css('display') !== 'none';
  }

  show() {
    this.el.updateDisplayToBlock();
  }

  hide() {
    this.el.hide();
    return this;
  }

  val(v) {
    return this.input.val(v);
  }

  hint(hint) {
    this.input.hint(hint);
  }

  validate() {
    const {
      input, rule, tip, el,
    } = this;
    const v = input.val();
    if (rule.required) {
      if (/^\s*$/.test(v)) {
        tip.updateInnerHtml(t('validation.required'));
        el.addClass('error');
        return false;
      }
    }
    if (rule.type || rule.pattern) {
      const pattern = rule.pattern || patterns[rule.type];
      if (!pattern.test(v)) {
        tip.updateInnerHtml(t('validation.notMatch'));
        el.addClass('error');
        return false;
      }
    }
    el.removeClass('error');
    return true;
  }
}
