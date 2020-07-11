/* global window */
import { FinElement, h } from '../basic_unit/element';
import { bind } from '../utils/event_helper';
import tooltip from '../basic_unit/tooltip';
import DropdownFont from '../comp_drop_down/dropdown_font';
import DropdownFontSize from '../comp_drop_down/dropdown_fontsize';
import DropdownFormat from '../comp_drop_down/dropdown_format';
import DropdownColor from '../comp_drop_down/dropdown_color';
import DropdownAlign from '../comp_drop_down/dropdown_align';
import DropdownBorder from '../comp_drop_down/dropdown_border';
import { Dropdown } from '../comp_drop_down/dropdown';
import Icon from '../basic_unit/icon';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { t } from '../../locale/locale';
import DropdownAction from '../comp_drop_down/dropdown_action';
import { PreAction } from '../../core/core_data_proxy/pre_action';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { myLog, PRINT_LEVEL2 } from '../../log/new_log';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';

class DropdownMore extends Dropdown {
    constructor() {
        const icon = new Icon('ellipsis');
        const moreBtns = h('div', `${CSS_PREFIX}-toolbar-more`);
        super(icon, 'auto', false, 'bottom-right', false,  moreBtns);
        this.moreBtns = moreBtns;
        this.contentEl.css('max-width', '420px');
    }
}


export class ToolbarComp {
    sheetComp: SheetComp
    coreSheet: CoreSheet
    btnChildren: Array<FinElement>
    constructor(data, isShow = true, sheetComp) {
        this.data = data;
        this.sheetComp = sheetComp
        this.coreSheet = this.sheetComp.coreSheet
        const style = this.coreSheet.coreSheetSetting.toolBarStyle
        this.ddFormat = new DropdownFormat();
        this.ddFont = new DropdownFont();
        // this.ddFormula = new DropdownFormula();
        this.ddFontSize = new DropdownFontSize();
        this.ddTextColor = new DropdownColor('text-color', style.color);
        this.ddFillColor = new DropdownColor('fill-color', style.bgcolor);
        this.ddAlign = new DropdownAlign(['left', 'center', 'right'], style.align);
        this.ddVAlign = new DropdownAlign(['top', 'middle', 'bottom'], style.valign);
        this.ddBorder = new DropdownBorder();
        this.ddMore = new DropdownMore();
        this.undoEl = new DropdownAction('undo',  () => this.change('undo'), (v) => this.change('undoList', v));
        this.redoEl = new DropdownAction('redo',  () => this.change('redo'), (v) => this.change('redoList', v));
        this.createButtonArray();
        this.el = h('div', `${CSS_PREFIX}-toolbar`);
        this.btns = h('div', `${CSS_PREFIX}-toolbar-btns`).children(...this.btnChildren);
        this.el.appendChildByStrOrEl(this.btns);
        if (isShow === false) this.el.hide();
        this.bindDropdownChange();
        this.reset();
        setTimeout(() => {
            this.initBtns2();
            this.handelResize();
        }, 0);
        bind(window, 'resize', () => { // 屏幕宽度调整会跟着辩护
            this.handelResize();
        });
    }
    initBtns2() {
        this.btns2 = this.btnChildren.map((it) => {
            const rect = it.box();
            const {marginLeft, marginRight} = it.computedStyle();
            return [it, rect.width + parseInt(marginLeft, 10) + parseInt(marginRight, 10)];
        });
    }


    createButtonArray() {
        this.btnChildren = [
            // this.undoEl = this.buildButtonWithIcon(`${t('toolbar.undo')} (Ctrl+Z)`, 'undo', () => this.change('undo')),

            // this.printEl = this.buildButtonWithIcon('Print (Ctrl+P)', 'print', () => this.change('print')),
            this.buildButton(`${t('toolbar.undo')}`)
              .appendChildByStrOrEl(this.undoEl.el),
            this.buildButton(`${t('toolbar.redo')}`)
              .appendChildByStrOrEl(this.redoEl.el),
            this.paintformatEl = this.buildButtonWithIcon(`${t('toolbar.paintformat')}`, 'paintformat', () => this.toggleChange('paintformat')),
            // this.clearformatEl = this.buildButtonWithIcon(`${t('toolbar.clearformat')}`, 'clearformat', () => this.change('clearformat')),
            this.buildDivider(),
            this.buildButton(`${t('format')}`)
              .appendChildByStrOrEl(this.ddFormat.el),
            this.buildDivider(),
            this.buildButton(`${t('font')}`)
              .appendChildByStrOrEl(this.ddFont.el),
            this.buildButton(`${t('toolbar.fontSize')}`)
              .appendChildByStrOrEl(this.ddFontSize.el),
            this.buildDivider(),
            this.fontBoldEl = this.buildButtonWithIcon(`${t('toolbar.fontBold')} (Ctrl+B)`, 'bold', () => this.toggleChange('font-bold')),
            this.fontItalicEl = this.buildButtonWithIcon(`${t('toolbar.fontItalic')} (Ctrl+I)`, 'italic', () => this.toggleChange('font-italic')),
            this.underlineEl = this.buildButtonWithIcon(`${t('toolbar.underline')} (Ctrl+U)`, 'underline', () => this.toggleChange('underline')),
            // this.flexibleEl = this.buildButtonWithIcon(`${t('toolbar.flexibleEl')} `, 'flexible', () => this.toggleChange( 'flexible')),
            this.strikeEl = this.buildButtonWithIcon(`${t('toolbar.strike')}`, 'strike', () => this.toggleChange('strike')),
            this.buildButton(`${t('toolbar.textColor')}`)
              .appendChildByStrOrEl(this.ddTextColor.el),
            this.buildDivider(),
            this.buildButton(`${t('toolbar.fillColor')}`)
              .appendChildByStrOrEl(this.ddFillColor.el),
            this.buildButton(`${t('toolbar.border')}`)
              .appendChildByStrOrEl(this.ddBorder.el),
            this.mergeEl = this.buildButtonWithIcon(`${t('merge')}`, 'merge', () => this.toggleChange('merge')),
            this.buildDivider(),
            this.buildButton(`${t('toolbar.align')}`)
              .appendChildByStrOrEl(this.ddAlign.el),
            this.buildButton(`${t('toolbar.valign')}`)
              .appendChildByStrOrEl(this.ddVAlign.el),
            this.textwrapEl = this.buildButtonWithIcon(`${t('toolbar.textwrap')}`, 'textwrap', () => this.toggleChange('textwrap')),
            this.buildDivider(),
            // this.linkEl = this.buildButtonWithIcon('Insert link', 'link'),
            // this.chartEl = this.buildButtonWithIcon('Insert chart', 'chart'),
            this.freezeEl = this.buildButtonWithIcon(`${t('toolbar.freeze')}`, 'freeze', () => this.toggleChange('freeze')),
            this.addEl = this.buildButtonWithIcon(`${t('toolbar.add')}`, 'add', () => this.toggleChange('add')),
            this.closeEl = this.buildButtonWithIcon(`${t('toolbar.calc')}`, 'close', () => this.toggleChange('close')),
            this.autofilterEl = this.buildButtonWithIcon(`${t('toolbar.autofilter')}`, 'autofilter', () => this.toggleChange('autofilter')),
            // this.throwFormulaEl = this.buildButtonWithIcon(`${t('toolbar.throwFormula')}`, 'chevron-right', () => this.toggleChange('throwFormula')),
            this.chartEl = this.buildButtonWithIcon(`${t('toolbar.chart')}`, 'chart', () => this.toggleChange('chart')),
            // this.buildButton(`${t('toolbar.date_formula')}`).appendChildByStrOrEl(this.ddFormula.el),
            // this.buildDivider(),
            this.moreEl = this.buildButton(`${t('toolbar.more')}`)
              .appendChildByStrOrEl(this.ddMore.el)
              .hide(),
        ];
    }

    change(type, value){
        return this.handleToolBarChange(type, value)
    }

    paintformatActive() {
        return this.paintformatEl.hasClass('active');
    }

    paintformatToggle() {
        this.paintformatEl.toggle();
    }

    trigger(type) {
        this.toggleChange(type);
    }

    reset() { // 在construct的时候就会被调用
        this.undoEl.disabled(!this.coreSheet.canUndo());
        this.redoEl.disabled(!this.coreSheet.canRedo());
        this.mergeEl.active(this.coreSheet.canUnmerge())
            .disabled(!this.coreSheet.coreSelector.selectedCoreRange.isEndLargerThanStart());
        this.autofilterEl.active(!this.coreSheet.canAutofilter());
        // this.mergeEl.disabled();
        this.addEl.active(this.coreSheet.equationIsActive());
        this.closeEl.active(false);
        this.chartEl.active(false);
        this.updateByCurSelectedCell()
    }

    updateByCurSelectedCell(){
        const style = this.coreSheet.getSelectedCellStyle();
        const cell = this.coreSheet.tableViewForEvent.getSelectedCell();
        this.ddFont.setTitle(style.fontConfig.name);
        this.ddFontSize.setTitle(style.fontConfig.size);
        this.fontBoldEl.active(style.fontConfig.bold);
        this.fontItalicEl.active(style.fontConfig.italic);
        this.underlineEl.active(style.underline);
        // this.flexibleEl.active(style.flexible);
        this.strikeEl.active(style.strike);
        this.ddTextColor.setTitle(style.color);
        this.ddFillColor.setTitle(style.bgcolor);
        this.ddAlign.setTitle(style.align);
        this.ddVAlign.setTitle(style.valign);
        this.textwrapEl.active(style.textwrap);
        // this.throwFormulaEl.active(false);
        this.freezeEl.active(this.coreSheet.tableViewForEvent.isFreezeActive());
        if (cell) {
            if (cell.format) {
                this.ddFormat.setTitle(cell.format);
            }
        }
    }

   // =============== handel 函数 =================

    /**
     * 格式刷
     */
    handleToolbarChangePaintformatPaste() {
        const { data } = this;
        if (this.paintformatActive()) {
            // paste.call(this, 'format');
            data.changePaintFormat((ri, ci) => {
                this.sheetComp.selectorSet(true, ri, ci, true, true);
            });
            this.sheetComp.clearInnerClipboard();
            this.paintformatToggle();
            this.reset();
        }
    }

    /**
     * 变化toolbar
     * @param type
     * @param value
     */
    handleToolBarChange(type, value) { // 这里为何没有merge？
        const { data } = this;
        if (type === 'undo') {
            this.sheetComp.undo();
        } else if (type === 'undoList') {
            value.setContent(data.historyList(1));
        } else if (type === 'redoList') {
            value.setContent(data.historyList(2));
        } else if (type === 'redo') {
            this.redo();
        } else if (type === 'print') {
            // print
        } else if (type === 'paintformat') {
            if (value === true) {
                this.sheetComp.copy();
            } else {
                this.sheetComp.clearInnerClipboard();
            }
        } else if (type === 'chart') {
            console.log("not support ")
        } else if (type === 'clearformat') {
            this.sheetComp.insertDeleteRowColumn('delete-cell-format');
        } else if (type === 'link') {
            // link
        } else if (type === 'autofilter') {
            // filter
            this.sheetComp.sheetEventDealer.autofilter();
        } else if (type === 'throwFormula') {
            this.sheetComp.sheetEventDealer.showAllFormula();
        } else if (type === 'close') {
            let { mri, mci } = data.getMax();

            data.changeDataForCalc = new PreAction({
                type: 999,
                action: '重新计算',
                ri: -1,
                ci: -1,
                oldCell: {},
                newCell: data.coreRows.eachRange(new CellRangeProxy(0, 0, mri, mci))
            }, this.data);
            this.sheetComp.sheetReset();
            // loadFormula.call(this, true);
        } else if (type === 'freeze') {
            let { showFreeze } = data.coreSheetSetting;
            if (value && showFreeze === true) {
                const { riOfEditingCell, ciOfEditingCell } = data.coreSelector;
                this.sheetComp.freeze(riOfEditingCell, ciOfEditingCell);
            } else {
                this.sheetComp.freeze(0, 0);
            }
        } else if (type === 'add') {
            data.showEquation = !data.showEquation;
            this.sheetComp.sheetReset();
        } else {
            //format percent 473
            data.changeSetSelectedCellAttr(type, value);
            if (type === 'border') {
                this.sheetComp.selectorContainerComp.primeSelectorComp.updateAreaElBorder('none');
            }
            if (type === 'cellFormulaProxy') {
                // 双击单元格，会弹出Editor组件； 选中range的时候输入也会执行
                this.sheetComp.sheetOperationDealer.sheetComp.cellEditorComp.dealBeginEditFromOldCell()
            }
            this.sheetComp.sheetReset();
        }
    }

    handelResize() { // 已经转移
        const {
            el, btns, moreEl, ddMore, btns2,
        } = this;
        const {moreBtns, contentEl} = ddMore;
        // el.css('width', `${widthFn() - 60}px`); // 设置宽度
        el.css('width', "100%")
        const elBox = el.box();

        let sumWidth = 160;
        let sumWidth2 = 12;
        const list1 = [];
        const list2 = [];
        btns2.forEach(([it, w], index) => {
            sumWidth += w;
            if (index === btns2.length - 1 || sumWidth < elBox.width) {
                list1.push(it);
            } else {
                sumWidth2 += w;
                list2.push(it);
            }
        });
        btns.updateInnerHtml('').children(...list1);
        moreBtns.updateInnerHtml('').children(...list2);
        contentEl.css('width', `${sumWidth2}px`);
        if (list2.length > 0) {
            moreEl.updateDisplayToBlock();
        } else {
            moreEl.hide();
        }
        myLog.myPrint(PRINT_LEVEL2, this);
    }
    // ================== bind 函数 ================

    buildIcon(name) {
        return new Icon(name);
    }

    buildButton(tooltipdata) {
        return h('div', `${CSS_PREFIX}-toolbar-btn`)
          .on('mouseenter', (evt) => {
              tooltip(tooltipdata, evt.target);
          })
          .updateAttrByKeyValue('data-tooltip', tooltipdata);
    }

    buildDivider() {
        return h('div', `${CSS_PREFIX}-toolbar-divider`);
    }

    buildButtonWithIcon(tooltipdata, iconName, change = () => {
    }) {
        return this.buildButton(tooltipdata)
          .appendChildByStrOrEl(this.buildIcon(iconName))
          .on('click', () => change());
    }

    bindDropdownChange() {
        this.ddFormat.change = it => this.change('format', it.key);
        this.ddFont.change = it => this.change('font-name', it.key);
        // this.ddFormula.change = it => this.change('cellFormulaProxy', it.key);
        this.ddFontSize.change = it => this.change('font-size', it.pt);
        this.ddTextColor.change = it => this.change('color', it);
        this.ddFillColor.change = it => this.change('bgcolor', it);
        this.ddAlign.change = it => this.change('align', it);
        this.ddVAlign.change = it => this.change('valign', it);
        this.ddBorder.change = it => this.change('border', it);
        this.undoEl.change = it => this.change('undo', it);
    }


    toggleChange(type) {
        let elName = type;
        const types = type.split('-');
        if (types.length > 1) {
            types.forEach((it, i) => {
                if (i === 0) elName = it;
                else elName += it[0].toUpperCase() + it.substring(1);
            });
        }
        const el = this[`${elName}El`];
        el.toggle();
        this.change(type, el.hasClass('active'));
    }
}
