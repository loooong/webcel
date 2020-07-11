import {h} from '../basic_unit/element';
import {CSS_PREFIX} from '../../global_utils/config_for_core_and_component';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { SheetComp } from '../a_top_comp/sheet_comp';

export class Advice {
    coreSheet: CoreSheet
    sheetComp: SheetComp
    constructor(data, sheetComp) {
        this.el = h('div', `${CSS_PREFIX}-advice`)
            .children(
                this.save = h('div', `${CSS_PREFIX}-advice-style`)
                    .css('border-bottom', '1px solid'),
                this.text = h('div', `${CSS_PREFIX}-advice-style`),
            )
            .hide();
        this.save.children(
            this.saveCheck = h('span', 'check').hide('visibility', 'hidden'),
            h('span', '').updateInnerHtml('保留样式'),
        );
        this.text.children(
            this.textCheck = h('span', 'check').hide('visibility', 'hidden'),
            h('span', '').updateInnerHtml('仅文本'),
        );
        this.data = data;
        this.coreSheet = data
        this.sheetComp = sheetComp;
        this.left = 0;
        this.top = 0;

        this.save.on('mousedown.stop', () => {
            this.saveCheck.updateDisplayToBlock('visibility', 'initial');
            this.textCheck.hide('visibility', 'hidden');
            this.sheetComp.setCellRange(this.reference, this.tableProxy, true);
            this.sheetComp.sheetReset()
        });

        this.text.on('mousedown.stop', () => {
            this.sheetComp.setCellRange(this.reference, this.tableProxy, false);
            this.saveCheck.updateDisplayToBlock('visibility', 'hidden');
            this.textCheck.hide('visibility', 'initial');
            this.sheetComp.sheetReset()
        });
    }

    show(left, top, type = 1, reference, tableProxy ) {
        this.el.css('left', `${left}px`);
        this.el.css('top', `${top}px`);
        if (type === 1) {
            this.saveCheck.updateDisplayToBlock('visibility', 'initial');
            this.textCheck.hide('visibility', 'hidden');
        }
        this.left = parseInt(left);
        this.top = parseInt(top);
        this.tableProxy = tableProxy;
        this.reference = reference;
        this.el.updateDisplayToBlock();
    }
}
