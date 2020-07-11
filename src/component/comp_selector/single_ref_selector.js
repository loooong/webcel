import { h } from '../basic_unit/element';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { expr2xy } from '../../global_utils/alphabet';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { bindMouseMoveThenUpFunc } from '../utils/event_helper';
import {
    cuttingByPos,
    getCurSyntaxUnitUpperCase,
    isAbsoluteValue
} from '../comp_cell_editor/ref_selector_control_old';
import { SheetComp } from '../a_top_comp/sheet_comp';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { POINT_EVENTS_NONE } from '../utils/config';

function find(str, cha) {

    return str.lastIndexOf(cha);
}

export class SingleRefSelector {
    sheetComp: SheetComp
    coreSheet: CoreSheet
    constructor(boxinner, data, sheet, selector) {
        this.l = h('div', `${CSS_PREFIX}-selector-box-l-move-l`);
        this.r = h('div', `${CSS_PREFIX}-selector-box-l-move-r`);
        this.t = h('div', `${CSS_PREFIX}-selector-box-l-move-t`);
        this.b = h('div', `${CSS_PREFIX}-selector-box-l-move-b`);
        this.data = data;
        this.sheetComp = sheet;
        this.coreSheet = this.sheetComp.coreSheet
        this._selector = selector;

        this.event(this.l, 1);
        this.event(this.r, 2);
        this.event(this.t, 3);
        this.event(this.b, 4);
        this.boxinner = boxinner;
        this.boxinner.children(
            this.l,
            this.r,
            this.t,
            this.b,
        );
    }

    event(target, dict) {
        let timer = null;
        target.on('mousedown.stop', evt => {
            let {data, sheetComp, _selector} = this;
            let p = -1;
            let _move_selectors = null;
            let {sri, sci, eri, eci, w, h} = this.data.coreSelector.selectedCoreRange;
            let cellRange = new CellRangeProxy(sri, sci, eri, eci, w, h);
            let _cellRange = null;
            let {selectors} = sheetComp;
            let msri = -1, msci = -1, meri = -1, meci = -1;
            // 这里应该是选择某个范围

            bindMouseMoveThenUpFunc(window, (e) => {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    sheetComp.picContainer.css('pointer-events', POINT_EVENTS_NONE);
                    for (let i = 0; i < selectors.length; i++) {
                        let selector = selectors[i];
                        selector.selectorCompInDetail.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_NONE)
                    }
                    let relativeXYDetailC = this.sheetComp.overlayComp.getRelativeXYDetail(e, 1)

                    let {ri, ci} = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
                    if (ri !== -1 && ci !== -1) {
                        let pos = this.sheetComp.cellEditorComp.editorInputComp.cursorPst
                        let inputText = this.sheetComp.cellEditorComp.editorInputComp.editorTextProxy.getText();
                        let _erpx = cuttingByPos(inputText, pos - 1, true);
                        if (inputText.length > pos - 1) {
                            _erpx += getCurSyntaxUnitUpperCase(inputText, pos - 1);
                        }
                        for (let i = 0; i < selectors.length; i++) {
                            let selector = selectors[i];
                            let {className, selectingExpr} = selector;

                            if (erpx === _erpx && className === _selector.className + " clear_selector") {
                                _move_selectors = _move_selectors ? _move_selectors : selector;
                                if (erpx.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) {
                                    let arr = erpx.split(":");
                                    let e1 = expr2xy(arr[0]);
                                    let e2 = expr2xy(arr[1]);
                                    cellRange = new CellRangeProxy(e1[1], e1[0], e2[1], e2[0], w, h);
                                    cellRange.updateByStartRiCi(ri, ci);
                                    const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                    _move_selectors.selectorCompInDetail.range = cellRange;
                                    _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                } else {
                                    _move_selectors.selectorCompInDetail.set(ri, ci, true);
                                }
                                break;
                            } else if (erpx !== _erpx && className === _selector.className + " clear_selector") {
                                p = p !== -1 ? p : find(inputText, selector.selectingExpr);
                                this.sheetComp.cellEditorComp.editorInputComp.coreSheet.coreInputEditor.startCursorPst = p + selector.selectingExpr.length;
                                this.sheetComp.cellEditorComp.editorInputComp.updateCursorPstAtTextEl();
                                _move_selectors = _move_selectors ? _move_selectors : selector;

                                if (selector.selectingExpr.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) {
                                    let arr = erpx.split(":");
                                    let e1 = expr2xy(arr[0]);
                                    let e2 = expr2xy(arr[1]);
                                    cellRange = new CellRangeProxy(e1[1], e1[0], e2[1], e2[0], w, h);
                                    if (_cellRange === null) {
                                        _cellRange = cellRange;
                                    }
                                    if (dict === 4) {
                                        let args = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
                                        cellRange.updateByStartAndEndRiCI(e1[1], e1[0], args.ri, args.ci);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    } else if (dict === 1) {
                                        let args = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
                                        cellRange.updateByStartAndEndRiCI(e1[1], args.ci, args.ri, e2[0]);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    } else if (dict === 3) {
                                        let args = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
                                        cellRange.updateByStartAndEndRiCI(args.ri, args.ci, e2[1], e2[0]);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    } else if (dict === 2) {
                                        let args = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
                                        cellRange.updateByStartAndEndRiCI(args.ri, e1[0], e2[1], args.ci);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    }
                                } else {
                                    let e1 = expr2xy(selector.selectingExpr);
                                    let e2 = expr2xy(selector.selectingExpr);
                                    let args = this.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(relativeXYDetailC.xRelativeToLeft, relativeXYDetailC.yRelativeToTop);
                                    if (dict === 4) {
                                        cellRange.updateByStartAndEndRiCI(e1[1], e1[0], args.ri, args.ci);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    } else if (dict === 1) {
                                        cellRange.updateByStartAndEndRiCI(e1[1], args.ci, args.ri, e2[0]);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    } else if (dict === 3) {
                                        cellRange.updateByStartAndEndRiCI(args.ri, args.ci, e2[1], e2[0]);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    } else if (dict === 2) {
                                        cellRange.updateByStartAndEndRiCI(args.ri, e1[0], e2[1], args.ci);
                                        const rect = data.tableViewForEvent.getRangePstLTHW(cellRange);
                                        _move_selectors.selectorCompInDetail.range = cellRange;
                                        _move_selectors.selectorCompInDetail.primeSelectorComp.updateAreaLTWHAndShow(rect);
                                    }
                                }
                                break;
                            }
                        }

                        if (_move_selectors
                            && (msri !== cellRange.sri
                                || msci !== cellRange.sci
                                || meri !== cellRange.eri
                                || meci !== cellRange.eci)) {
                            _move_selectors.selectorCompInDetail.updateAreaBorder(_move_selectors.color, false);
                            this.sheetComp.cellEditorComp.editorInputComp.lockCells( evt, _move_selectors, isAbsoluteValue(_move_selectors.selectingExpr), p);
                        }
                        msri = cellRange.sri;
                        msci = cellRange.sci;
                        meri = cellRange.eri;
                        meci = cellRange.eci;
                    }
                }, 6);
            }, () => {
                clearTimeout(timer);
                let {selectors} = this.sheetComp;
                sheetComp.picContainer.css('pointer-events', POINT_EVENTS_AUTO);
                for (let i = 0; i < selectors.length; i++) {
                    let selector = selectors[i];
                    selector.selectorCompInDetail.primeSelectorComp.updateBoxinnerPointEvents(POINT_EVENTS_AUTO)
                }
                p = -1;
                if (_move_selectors && _move_selectors.selectorCompInDetail)
                    _move_selectors.selectorCompInDetail.updateAreaBorder(_move_selectors.color, true);
                _move_selectors = null;
            })
        });
    }
}
