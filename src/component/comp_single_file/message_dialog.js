import Modal from '../basic_unit/modal';
import { h } from '../basic_unit/element';
import Button from '../basic_unit/button';
import { t } from '../../locale/locale';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import Icon from '../basic_unit/icon';

// todo: 这块感觉要优化; 需要重写一个Error dialog
export class ErrorMsgDialog extends Modal {
    msg: string
    constructor() {
        let tip = h('span', '').updateInnerHtml("您输入的公式好像至少缺少一个左括号");
        super(t('contextmenu.showErrorMsgDialog'), [
            h('div', `${CSS_PREFIX}-form-fields`).children(
                tip,
            ),
            h('div', `${CSS_PREFIX}-form-fields`),
            h('div', `${CSS_PREFIX}-buttons`).children(
                new Button('ok', 'primary')
                    .on('click', () => this.btnClick('ok')),
            ),
        ]);
        this.tip = tip;
    }

    showMsg(msg){
        this.tip.updateInnerHtml(msg);
        super.show();
    }

    btnClick(action) {
        if (action === 'ok') {
            this.hide();
        }
    }

}

// 这个似乎是myliang写的
export function showMsgBox(boxTitle, innerHtml) {
    const el = h('div', `${CSS_PREFIX}-toast`);
    const dimmer = h('div', `${CSS_PREFIX}-dimmer active`);
    const remove = () => {
        document.body.removeChild(el.el);
        document.body.removeChild(dimmer.el);
    };

    el.children(
      h('div', `${CSS_PREFIX}-toast-header`)
        .children(
          new Icon('close').on('click.stop', () => remove()),
          boxTitle,
        ),
      h('div', `${CSS_PREFIX}-toast-content`)
        .updateInnerHtml(innerHtml),
    );
    document.body.appendChild(el.el);
    document.body.appendChild(dimmer.el);
    // set offset
    const { width, height } = el.box();
    const { clientHeight, clientWidth } = document.documentElement;
    el.updateElLTWH({
        left: (clientWidth - width) / 2,
        top: (clientHeight - height) / 3,
    });
}
