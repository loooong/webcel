import { h } from '../basic_unit/element';
import { CSS_PREFIX, look } from '../../global_utils/config_for_core_and_component';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { isSpecialWebsite } from '../../core/old_1/special_formula_process';
import { CellEditorComp } from '../comp_cell_editor/editor';

// 这是用来处理超链接的
export class Website {
    cellEditorComp: CellEditorComp
    constructor(data, cellEditorComp) {
        this.data = data;
        this.el = h('div', `${CSS_PREFIX}-hyperlink-tooltip`)
            .hide();

        this.tableEl = h('div', `${CSS_PREFIX}-hyperlink-tooltip`)
            .hide();
        this.cellEditorComp = cellEditorComp;
        this.tableEl.updateAttrByKeyValue('tabindex', 0);
        this.tableEl.css('overflow-y', 'auto');
        this.tableEl.css('max-height', '400px');
        // bind(this.tableEl.el, 'paste', evt => {
        //     evt.stopPropagation();
        // });
        // bind(this.tableEl.el, 'copy', evt => {
        //     evt.stopPropagation();
        // });
        // bind(this.tableEl.el, 'keydown', evt => {
        //     evt.stopPropagation();
        // });
        // bind(this.tableEl.el, 'keyup', evt => {
        //     evt.stopPropagation();
        // });
        this.timer = null;
        this.timer2 = null;
    }

    show(ri, ci) {
        if(this.cellEditorComp.editorInputComp.isTextElVisible()) {
            this.el.hide();
            this.tableEl.hide();

            return;
        }

        let {data} = this;
        let text = data.getCellTextOrDefault(ri, ci) + "";
        clearTimeout(this.timer);
        clearTimeout(this.timer2);

        if (look.indexOf(text.split("!")[0]) === 0) {
            let rect = data.tableViewForEvent.getRangePstLTHW(new CellRangeProxy(ri, ci, ri, ci));
            let left = rect.left + 55;
            let top = rect.top + 50;
            let arr = JSON.parse(text.substring(text.indexOf("!") + 1, text.length));

            this.tableEl.css('left', `${left}px`);
            this.tableEl.css('top', `${top}px`);
            this.tableEl.css('user-select', 'text');

            this.tableEl.updateInnerHtml('');
            let table = h('component_table.js', '');
            table.css('border-spacing', '0px');
            let tr = h('tr', '');
            tr.children(
                h('td', '').css('border', '1px solid black').updateInnerHtml('序号'),
                h('td', '').css('border', '1px solid black').updateInnerHtml('项目名称'),
                h('td', '').css('border', '1px solid black').updateInnerHtml('城市'),
                h('td', '').css('border', '1px solid black').updateInnerHtml('占地面积'),
                h('td', '').css('border', '1px solid black').updateInnerHtml('差额')
            );
            table.children(
                tr
            );

            for (let j = 0; j < arr.length; j++) {
                let {number, name, city, area, value} = arr[j];
                let tr = h('tr', '');
                let td = h('td', '');
                td.updateInnerHtml(number);
                td.css('border', '1px solid black');

                let td2 = h('td', '');
                td2.updateInnerHtml(name);
                td2.css('border', '1px solid black');

                let td3 = h('td', '');
                td3.updateInnerHtml(city);
                td3.css('border', '1px solid black');

                let td4 = h('td', '');
                td4.updateInnerHtml(area);
                td4.css('border', '1px solid black');

                let td5 = h('td', '');
                td5.updateInnerHtml(value);
                td5.css('border', '1px solid black');
                tr.children(
                    td,
                    td2,
                    td3,
                    td4,
                    td5
                );
                table.children(
                    tr
                );
            }

            this.tableEl.children(
                table
            );

            this.timer = setTimeout(() => {
                this.tableEl.updateDisplayToBlock();
                this.el.hide();
            }, 150);
        } else {
            let args = isSpecialWebsite(text);
            if(args.state) {
                text = args.text;
            }
            text = text.substr(0, 3).toLowerCase() === "www" ? "http://" + text : text;
            if (text.substr(0, 7).toLowerCase() !== 'http://' &&
                text.substr(0, 8).toLowerCase() !== 'https://') {
                this.el.hide();
                this.tableEl.hide();
                return;
            }

            let rect = data.tableViewForEvent.getRangePstLTHW(new CellRangeProxy(ri, ci, ri, ci));
            let left = rect.left + 55;
            let top = rect.top + 5;
            this.el.updateInnerHtml('');
            this.el.css('color', 'blue');
            this.el.children(
                h('div', 'aaa').css("border-bottom", "1px solid blue")
                    .on('click', evt => {
                        let iWidth = 650; //弹出窗口的宽度;
                        let iHeight = 500; //弹出窗口的高度;

                        let {screenX, screenY} = evt;
                        window.open(text, "", `width=${iWidth},height=${iHeight},left=${screenX + rect.width},top=${screenY}`);
                    })
                    .updateInnerHtml(text)
            );
            this.el.css('left', `${left}px`);
            this.el.css('top', `${top}px`);

            this.timer2 = setTimeout(() => {
                this.el.updateDisplayToBlock();
                this.tableEl.hide();
            }, 150);
        }
    }
}
