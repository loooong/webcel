import {FinElement} from './element';
import {CSS_PREFIX} from '../../global_utils/config_for_core_and_component';
import {t} from '../../locale/locale';

export default class Button extends FinElement {
    // type: primary
    constructor(title, className = '') {
        super('div', `${CSS_PREFIX}-button ${className}`);
        this.appendChildByStrOrEl(t(`button.${title}`));
    }
}
