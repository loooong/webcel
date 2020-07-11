import { h } from './element';
import {SuggestComp} from '../comp_cell_editor/suggest';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';

export default class FormSelect {
  constructor(key, items, width, getTitle = it => it, change = () => {}) {
    this.key = key;
    this.getTitle = getTitle;
    this.vchange = () => {};
    this.el = h('div', `${CSS_PREFIX}-form-select`);
    this.suggest = new SuggestComp(items.map(it => ({ key: it, title: this.getTitle(it) })), (it) => {
      this.itemClick(it.key);
      change(it.key);
      this.vchange(it.key);
    }, width, this.el);
    this.el.children(
      this.itemEl = h('div', 'input-text').updateInnerHtml(this.getTitle(key)),
      this.suggest.el,
    ).on('click', () => this.show());
  }

  show() {
    this.suggest.searchAndShowByKeyWord('');
  }

  itemClick(it) {
    this.key = it;
    this.itemEl.updateInnerHtml(this.getTitle(it));
  }

  val(v) {
    if (v !== undefined) {
      this.key = v;
      this.itemEl.updateInnerHtml(this.getTitle(v));
      return this;
    }
    return this.key;
  }
}
