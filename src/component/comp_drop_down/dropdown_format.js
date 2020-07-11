import {Dropdown} from './dropdown';
import {h} from '../basic_unit/element';
import {baseFormats} from '../../core/old_1/format';
import {CSS_PREFIX} from '../../global_utils/config_for_core_and_component';

export default class DropdownFormat extends Dropdown {
    constructor() {
        let nformats = baseFormats.slice(0);
        nformats.splice(1, 0, {key: 'divider'});
        nformats.splice(5, 0, {key: 'divider'});
        nformats = nformats.map((it) => {
            const item = h('div', `${CSS_PREFIX}-item`);
            if (it.key === 'divider') {
                item.addClass('divider');
            } else {
                item.appendChildByStrOrEl(it.title())
                    .on('click', () => {
                        this.setTitle(it.title());
                        this.change(it);
                    });
                if (it.label) item.appendChildByStrOrEl(h('div', 'label').updateInnerHtml(it.label));
            }
            return item;
        });
        super('Normal', '220px', true, 'bottom-left', {type: false}, ...nformats );
    }

    setTitle(key) {
        for (let i = 0; i < baseFormats.length; i += 1) {
            if (baseFormats[i].key === key) {
                this.title.updateInnerHtml(baseFormats[i].title);
            }
        }
        this.hide();
    }
}
