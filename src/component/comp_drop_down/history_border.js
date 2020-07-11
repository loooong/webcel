import {h} from "../basic_unit/element";
import {CSS_PREFIX} from "../../global_utils/config_for_core_and_component";

export default class HistoryBorder {
    constructor() {
        this.el = h('div', `${CSS_PREFIX}-history-border`);
        this.history = h('div', `${CSS_PREFIX}-history-content`).updateInnerHtml('暂无内容');
        this.el.appendChildByStrOrEl( this.history);
    }

    setContent(items) {
        items = items.slice(items.length - 100 < 0 ? 0 : items.length, items.length);
        this.el.updateInnerHtml('');
        let els = [];
        for(let i = items.length - 1; i >= 0; i--) {
            let d = h('div', '');
            let {action} = items[i];
            d.updateInnerHtml(action);
            els.push(d);
        }

        this.el.children(...els);
    }
}
