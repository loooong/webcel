/* global document */

import * as helper from '../../global_utils/dataproxy_helper';
import { cloneDeep, isNumber } from '../../global_utils/dataproxy_helper';
import { isHave } from '../../global_utils/check_value';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { expr2xy, xy2expr } from '../../global_utils/alphabet';
import { PaintFormat } from './paint_format';
import {
    CELL_PROP_ALIGN,
    CELL_PROP_ALL,
    CELL_PROP_BG_COLOR,
    CELL_PROP_BORDER,
    CELL_PROP_CELL_FORMULA,
    CELL_PROP_COLOR,
    CELL_PROP_FLEXIBLE,
    CELL_PROP_FONT_BOLD,
    CELL_PROP_FONT_ITALIC,
    CELL_PROP_FONT_NAME,
    CELL_PROP_FONT_SIZE,
    CELL_PROP_FORMAT,
    CELL_PROP_MERGE,
    CELL_PROP_STRIKE,
    CELL_PROP_TEXT_WRAP,
    CELL_PROP_UNDERLINE,
    CELL_PROP_VERTICAL_ALIGN,
    CHANGE_PASTE,
    SHEET_PROP_AUTO_FILTER,
    SHEET_PROP_CHART,
    SHEET_PROP_COLS,
    SHEET_PROP_FLEX,
    SHEET_PROP_FREEZE,
    SHEET_PROP_MERGES,
    SHEET_PROP_PIC,
    SHEET_PROP_ROWS,
    SHEET_PROP_VALIDATION,
    STATE_END,
    STATE_FINISHED,
    STATE_FORMULAS,
    STATE_INPUT,
    STATE_STYLE,
    TYPE_COL,
    TYPE_ROW
} from '../core_utils/config';
import { DELETE, INSERT } from '../../global_utils/config_for_calc_and_core';
import { isCalcResError } from '../../global_utils/func_for_calc_core';
import { BaseCoreSheet } from './core_sheet_proxy';
import { ChangeDataDetail } from './change_data_detail';
import { t } from '../../locale/locale';
import { Recast } from './recast';
import { isLegal } from '../../component/comp_cell_editor/ref_selector_control_old';
import { h } from '../../component/basic_unit/element';
import { formatNumberRender } from '../old_1/format';
import { isFormula } from '../core_utils/func_for_rows';
import { changeFormat, dateDiff, formatDate } from '../../global_utils/date';

/**
 * 处于核心位置的服务
 * 暂时只支持单个sheet
 * @property {Array<Object>} styles
 * @property {WorkbookEditor} calcWorkbookEditor // 指向calc的workbook类，之后可以用来做更新
 */
export class CoreSheet extends BaseCoreSheet{ // todo: 之后把合并单元格的变化信息传递给calc，然后获取结果



    // ======= 单元格数据更新 ============
    editUpdateBySortingRow(sortedRowMap){
        // 首先更新multiRows
        this.coreRows.multiCoreRow.updateByOldRowID2NewRowIDMap(sortedRowMap)
        // 更新calc
        this.calcWorkbookEditor.editUpdateByOldRowID2NewRowIDMap(this.coreSheetID, sortedRowMap)
    }
    afterChange(){
        this.coreSortFilter.applyFilterAndSortToRows();
    }

    // state: input | finished
    changeFormulaOfSelectedCell(text, state = STATE_INPUT) { // 此方法已经优化了； 可以设置formula,dataFormat,
        const { riOfEditingCell, ciOfEditingCell } = this.coreSelector;
        this.setCellText(riOfEditingCell, ciOfEditingCell, { text }, state);
        this.afterChange()
    }

    // state: input | finished
    setSelectedCell(text, state = STATE_INPUT, formulas, ri, ci) {
        this.setCellAll(ri, ci, text, formulas, state);
        this.afterChange()
    }

    // state: input | finished
    setCellAll(ri, ci, text, formulas, state) { // 更新cell的多个属性
        const {coreRows, history, validations} = this;
        if (state === STATE_FINISHED) {
            coreRows.setCellAll(ri, ci, '', '');
            history.add(this.getWorkbookServerObj());
            coreRows.setCellAll(ri, ci, text, formulas);
        } else {
            coreRows.setCellAll(ri, ci, text, formulas);
            // this.change(this.getData());
        }
        // validator
        validations.validate(ri, ci, text, formulas);
    }

    // state: input | finished
    setCellText(ri, ci, {text, style}, state) { // 更新cell的text属性
        // text = text.replace(/\"/g)
        const {coreRows, history, validations} = this;
        if (state === STATE_FINISHED) {
            coreRows.setCellText(ri, ci, {text: ''});
            history.add(this.getWorkbookServerObj());
            coreRows.setCellText(ri, ci, {text});
        } else {
            if (state === STATE_END) {
                coreRows.setCellAll(ri, ci, text);
            } else if (state === STATE_FORMULAS) {
                coreRows.setCellAll(ri, ci, text, "-");
            } else if (state === STATE_STYLE) {
                coreRows.setCellText(ri, ci, {text, style}, STATE_STYLE);
            } else {
                coreRows.setCellText(ri, ci, {text});
                // coreRows.
            }
            // 不应该没打开一个单元格就 change一次
            this.postChangeData(this.getWorkbookServerObj());
        }
        // validator

        validations.validate(ri, ci, text);
    }
    // ======= 所有的需要调用 this.changeData的方法, 会使用change做前缀 ============

    /**
     * 数据变更都会调用这个方法，会把每个变化都放到撤销列表中去
     * @param dataChangeFunc
     * @param {ChangeDataDetail} changeDataDetail
     * @param {boolean} isNotifyCalc
     */
    changeData(dataChangeFunc, changeDataDetail = {}, isNotifyCalc = false) {
        if (this.coreSheetSetting.showEditor === false) { // 如果不显示editor的话直接返回错误
            return;
        }

        // 获取新的属性
        changeDataDetail.range = this.coreSelector.selectedCoreRange
        changeDataDetail.oldMergesData = this.multiCoreMerge.getA1A2StrArray();// 获取之前的合并单元格数据

        // == 获取oldCell数值
        // if (changeDataDetail.cellRange !== "") { // cellRange不为空
        //     changeDataDetail.oldCell = this.multiPreAction.eachRange(changeDataDetail.cellRange);
        // }

        // == 再执行calculateRows来改动数据； 如果执行失败怎么办？
        let calcRes
        if(isNotifyCalc){
            calcRes = this.calc.updateByCoreWorkbookAndChangeDetail(this, changeDataDetail) // 得到结果
        }
        if(isCalcResError(calcRes)){ // 需要弹窗提示
            console.log("此处需要弹窗提示 src/core/core_cmd/workbook_server.js")
            return calcRes
        }

        // == 先执行dataChangeFunc改动数据
        dataChangeFunc();

        // == 记录变更历史
        changeDataDetail.newData = this.getWorkbookServerObj()

        // 执行postChangeData事件函数
        this.postChangeData(this.getWorkbookServerObj());
    }

    /**
     * 增加数据验证
     * @param mode
     * @param ref
     * @param validator
     */
    changeAddValidation(mode, ref, validator) {
        this.changeData(() => {
            this.validations.add(mode, ref, validator);
        });
    }

    /**
     * 删除数据验证
     */
    changeRemoveValidation() {
        const {selectedCoreRange} = this.coreSelector;
        this.changeData(() => {
            this.validations.remove(selectedCoreRange);
        });
    }
    // 设置行高
    changeSetRowHeight(ri, height) {
        this.changeData(() => {
            const row = this.coreRows.multiCoreRow.ensureGetSingleRowByRowID(ri);
            row.height = height;
        }, {type: 3, ri: ri});
    }
    // 设置列宽
    changeSetColWidth(ci, width) {
        this.changeData(() => {
            this.coreCols.setWidth(ci, width);
        }, {type: 4, ci: ci});
    }
    // 设置冻结单元格
    changeSetFreeze(ri, ci) {
        this.changeData(() => {
            this.freeze = [ri, ci];
        });
    }
    // 这个应该是点击筛选按钮之后的操作
    changeRunAutoFilter() { // 变动autofiler
        const { coreSelector} = this;
        this.changeData(() => {
            if (this.coreSortFilter.isHaveRefRange()) { // 清除
                this.coreSortFilter.clearSortFilter(); // 清空cancvas
                this.exceptRowSet = new Set();
            } else { // 获取筛选范围，（1）如果选中的范围的行数为1或2的时候，行会自动扩张。（2）否则，直接按照选中范围作为筛选范围
                if(this.coreSelector.selectedCoreRange.getRowColCount()[0] > 2 ){
                    this.coreSortFilter.refA1A2Str = this.coreSelector.selectedCoreRange.toA1A2OrA1Str();
                }
                else{

                }
                let refStr = coreSelector.selectedCoreRange.toA1A2OrA1Str();
                let eri = coreSelector.selectedCoreRange.eri;
                const {coreRows} = this;

                for (let i = coreSelector.selectedCoreRange.sci; i <= coreSelector.selectedCoreRange.eci; i++) {
                    let curSingleColRange = new CellRangeProxy(coreSelector.selectedCoreRange.sri, i, coreSelector.selectedCoreRange.sri, i);
                    curSingleColRange = coreRows.autoFilterRef(refStr, curSingleColRange);
                    if (eri < curSingleColRange.eri) {
                        eri = curSingleColRange.eri;
                    }
                }
                let range = new CellRangeProxy(coreSelector.selectedCoreRange.sri, coreSelector.selectedCoreRange.sci, eri, coreSelector.selectedCoreRange.eci);
                this.coreSortFilter.refA1A2Str = range.toA1A2OrA1Str();
            }
        });
    }
    changeShowFormula() {
        const {coreSelector, coreRows} = this;

        this.changeData(() => {
            coreSelector.selectedCoreRange.applyEveryRiCi((i, j) => {
                const cell = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(i, j);
                if (cell && cell.getText() && cell.formulas) {
                    coreRows.setCellAll(i, j, cell.getText(), cell.getText());
                }
            });
        });
    }
    changeClickAutofillNew() {
        console.log("执行autofill！")
    }


    changeClickAutofill(srcRange, cellRange, what, error = () => {
    }) {
        if (!this.canPaste( srcRange, cellRange, error)) return false;
        this.changeData(() => {
            this.copyPaste( srcRange, cellRange, what, true);
        });
        return true;
    }

    // ======= 需要与calc有交互的方法 =======
    getChangeDataToCalc() {
        let {multiPreAction} = this;
        if (multiPreAction.undoItems.length <= 0) {
            return null;
        }
        let lastStep = multiPreAction.undoItems[multiPreAction.undoItems.length - 1];
        if (!isHave(lastStep)) {
            return null;
        }

        return lastStep;
    }

    changeCutPaste(srcCellRange, dstCellRange, cleard = true) {
        const { coreClipSelector, rows, multiCoreMerge } = this;
        this.coreRows.cutPaste(srcCellRange, dstCellRange);
        multiCoreMerge.move(srcCellRange,
          dstCellRange.sri - srcCellRange.sri,
          dstCellRange.sci - srcCellRange.sci);
        if (cleard) {
            this.coreClipSelector.clear(); // 清空cancvas
        }
    }
    // 初始化的时候，设定数据 todo; 为什么显示不出来？
    setData(coreSheetSetting, sheet = "", out = false) {

        Object.keys(coreSheetSetting).forEach((property) => {
            // this.judgeAutoWidth(coreSheetSetting.coreRows);
            if (property === SHEET_PROP_MERGES
              || property === SHEET_PROP_COLS || property === SHEET_PROP_VALIDATION || property === SHEET_PROP_CHART) {
                this[property].setData(coreSheetSetting[property]);
            } else if (property === SHEET_PROP_FLEX) {
                throw new Error("不再支持！")
            } else if (property === SHEET_PROP_ROWS) {
                this[property].setData(coreSheetSetting[property], sheet, out, this.coreSheetSetting.rowsInit);
            } else if (property === SHEET_PROP_FREEZE) {
                const [x, y] = expr2xy(coreSheetSetting[property]);
                this.freeze = [y, x];
            } else if (property === SHEET_PROP_PIC) {
                if (coreSheetSetting[property]) {
                    this.processPasteDirectionsArr( coreSheetSetting[property], 'from', sheet);
                }
            } else if (property === SHEET_PROP_AUTO_FILTER) {
                if (coreSheetSetting[property] && coreSheetSetting[property].refA1A2Str) {
                    this.coreSortFilter.refA1A2Str = coreSheetSetting[property].refA1A2Str;
                    this.coreSortFilter.coreFilterArray = coreSheetSetting[property].coreFilterArray;
                    this.coreSortFilter.coreSort = coreSheetSetting[property].coreSort;
                }
            } else if (coreSheetSetting[property] !== undefined) {
                this[property] = coreSheetSetting[property];
            }
        });
        return this;
    }
    // 删除单元格
    canUnmerge() {
        const {
            sri, sci, eri, eci,
        } = this.coreSelector.selectedCoreRange;
        const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(sri, sci);
        if (cell && cell.merge) {
            const [rn, cn] = cell.merge;
            if (sri + rn === eri && sci + cn === eci) return true;
        }
        return false;
    }

    mergeCellRange() { // 合并单元格
        const {coreSelector, coreRows} = this;
        if (this.isSignleSelected()) return;
        const [rn, cn] = coreSelector.selectedCoreRange.getRowColCount();
        if (rn > 1 || cn > 1) {
            const {sri, sci} = coreSelector.selectedCoreRange;
            const cell = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(sri, sci);
            cell.merge = [rn - 1, cn - 1];
            this.multiCoreMerge.addMergeRange(coreSelector.selectedCoreRange);
            // delete merge cells
            this.coreRows.deleteCells(coreSelector.selectedCoreRange);
            this.coreRows.setCell(sri, sci, cell);
        }
    }

    changeDeleteCell(what = 'all') {
        const {coreSelector} = this;
        this.changeData(() => {
            this.coreRows.deleteCells(coreSelector.selectedCoreRange, what);
            if (what === CELL_PROP_ALL || what === CELL_PROP_FORMAT) {
                this.multiCoreMerge.deleteWithin(coreSelector.selectedCoreRange);
            }
        }, {type: 2});
    }

    // type: row | column
    /**
     *
     * @param rowOrColumn
     * @param n
     * @param begin
     */
    changeInsertRowOrCol(rowOrColumn, n = 1, begin = -1) {
        const {sri, sci} = this.coreSelector.selectedCoreRange;
        const {coreRows, multiCoreMerge, coreCols} = this;
        if(begin === -1){
            begin = rowOrColumn === TYPE_ROW? sri:sci
        }
        let changeDataDetail = new ChangeDataDetail()
        changeDataDetail.type = 13
        changeDataDetail.data = this.getWorkbookServerObj()
        changeDataDetail.ri = begin !== -1 ? begin : sri //ri, ci是左上角的坐标
        changeDataDetail.ci = begin !== -1 ? begin : sci
        changeDataDetail.len = 1
        changeDataDetail.property = rowOrColumn === TYPE_ROW ? INSERT.ROW : INSERT.COL
        // 方案1： dataChangeFunc直接设置为calc.calcRows，calcRows中完成对coreRows,coreCols, merges这三个属性的变更
        this.changeData(() => {
            if (rowOrColumn === TYPE_ROW) {
                coreRows.insertNRow(begin, n); // 加入N行
            } else if (rowOrColumn === TYPE_COL) {
                coreRows.insertNColumn(begin, n); // 加入N列
                coreCols.len += n;
            }
            multiCoreMerge.shift(rowOrColumn, begin, n, (ri, ci, rn, cn) => { // 合并单元格变化
                const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
                cell.merge[0] += rn;
                cell.merge[1] += cn;
            });
        }, changeDataDetail, true);
    }

    // type: row | column
    changeDelete(type) {
        const {
            coreRows, multiCoreMerge, coreSelector, coreCols,
        } = this;

        const {range} = coreSelector;
        const {
            sri, sci, eri, eci,
        } = coreSelector.selectedCoreRange;

        this.changeData(() => {
            const [rsize, csize] = coreSelector.selectedCoreRange.getRowColCount();
            let si = sri;
            let size = rsize;
            if (type === TYPE_ROW) {
                coreRows.delete(sri, eri);
            } else if (type === TYPE_COL) {
                coreRows.deleteColumn(sci, eci);
                si = range.sci;
                size = csize;
                coreCols.len -= 1;
            }
            multiCoreMerge.shift(type, si, -size, (ri, ci, rn, cn) => {
                const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
                cell.merge[0] += rn;
                cell.merge[1] += cn;
                if (cell.merge[0] === 0 && cell.merge[1] === 0) {
                    delete cell.merge;
                }
            });
        }, {
            type: 14,
            data: this.getWorkbookServerObj(),
            ri: sri,
            ci: sci,
            len: 1,
            property: type === TYPE_ROW ? `${DELETE.ROW}` : `${DELETE.COL}`
        });
    }


    changeUnMerge() {
        const {coreSelector} = this;
        if (!this.isSignleSelected()) return;
        const {sri, sci} = coreSelector.selectedCoreRange;
        this.changeData(() => {
            this.coreRows.deleteCell(sri, sci, 'merge');
            this.multiCoreMerge.deleteWithin(coreSelector.selectedCoreRange);
        });
    }

    // 这个是改变cell的各个属性
    changeSetSelectedCellAttr(property, value) {
        this.changeData(() => {
            const {coreSelector, cellStyleArray, coreRows} = this;
            if (property === CELL_PROP_MERGE) {
                if (value) this.mergeCellRange();
                else this.changeUnMerge();
            } else if (property === CELL_PROP_BORDER) {
                this.setStyleBorders(value);
            } else if (property === CELL_PROP_CELL_FORMULA) {
                const cell = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(coreSelector.riOfEditingCell, coreSelector.ciOfEditingCell); // 获取选中的cell
                cell.formulas = `=${value}()`;
            } else {
                coreSelector.selectedCoreRange.applyEveryRiCi((ri, ci) => {
                    let cell = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(ri, ci);

                    let cstyle = {};
                    if (isHave(cell.cellStyleID)) {
                        cstyle = helper.cloneDeep(cellStyleArray[cell.cellStyleID]);
                    }
                    if (property === CELL_PROP_FORMAT) {
                        cstyle.format = value;
                        // cell.text = cell.text.replace("¥", "");
                        // cell.formulas = cell.formulas.replace("¥", "");
                        coreRows.setCellText(ri, ci, {
                            style: this.addStyle(cstyle)
                        }, CELL_PROP_FORMAT);
                        // this.coreRows.name2SheetProxy.change(ri, ci, cell, deepCopy(cell), 'change');
                    } else if (property === CELL_PROP_FONT_BOLD || property === CELL_PROP_FONT_ITALIC
                      || property === CELL_PROP_FONT_NAME || property === CELL_PROP_FONT_SIZE) {
                        const nfont = {};
                        nfont[property.split('-')[1]] = value;
                        cstyle.font = Object.assign(cstyle.font || {}, nfont);
                        cell.cellStyleID = this.addStyle(cstyle); // 记录的是style对象在workbookServer.styles中的位置
                    } else if (property === CELL_PROP_FLEXIBLE) {
                        if (this.exceptRowSet.has(ri + 1) && this.exceptRowSet.has(ri + 2) && !this.exceptRowSet.has(ri + 3)) {
                            this.exceptRowSet.delete(ri);
                            this.exceptRowSet.delete(ri + 1);
                            this.exceptRowSet.delete(ri + 2);
                        } else {
                            this.exceptRowSet.add(ri);
                            this.exceptRowSet.add(ri + 1);
                            this.exceptRowSet.add(ri + 2);
                        }
                        cstyle[property] = value;
                        cell.cellStyleID = this.addStyle(cstyle);
                    } else if ( property === CELL_PROP_TEXT_WRAP) {
                        this.textWrapHeight( ri, ci);

                        cstyle[property] = value;
                        cell.cellStyleID = this.addStyle(cstyle);
                    } else if (property === CELL_PROP_STRIKE
                      || property === CELL_PROP_UNDERLINE
                      || property === CELL_PROP_ALIGN || property === CELL_PROP_VERTICAL_ALIGN
                      || property === CELL_PROP_COLOR || property === CELL_PROP_BG_COLOR) {
                        cstyle[property] = value;
                        cell.cellStyleID = this.addStyle(cstyle);
                    }
                });
            }
        }, {type: 11, cellRange: this.coreSelector.selectedCoreRange, property, value});
    }

    changePaste(cellRange) {
        this.changeData(() => {

        }, {type: CHANGE_PASTE, cellRange: cellRange});
    }

    // what: all | text | format
    // paste(what = 'all', error = () => {
    // }) {
    //
    //     // const {coreClipSelector, selector} = this;
    //     // if (coreClipSelector.isClear()) return false;
    //     // if (!canPaste.call(this, coreClipSelector.range, selector.range, error)) return false;
    //     //
    //     // this.changeData(() => {
    //     //     if (coreClipSelector.isCopy()) {
    //     //         copyPaste.call(this, coreClipSelector.range, selector.range, what);
    //     //     } else if (coreClipSelector.isCut()) {
    //     //         cutPaste.call(this, coreClipSelector.range, selector.range);
    //     //     }
    //     // });
    //     return true;
    // }

    changePaintFormat(cb) {
        this.changeData(() => {
            let {coreClipSelector, coreSelector} = this;
            let {range} = coreClipSelector;
            let sri = coreSelector.riOfEditingCell;
            let sci = coreSelector.ciOfEditingCell;

            let dsri = sri - range.sri;
            let dsci = sci - range.sci;
            let darr = this.makeCellPropArr(range, dsri, dsci);

            if (coreSelector.selectedCoreRange.eri - coreSelector.selectedCoreRange.sri === 0 && coreSelector.selectedCoreRange.eci - coreSelector.selectedCoreRange.sci === 0) {
                this.setCellByCellProp(darr, cb);
            } else {
                let paintFormat = new PaintFormat(range, coreSelector.selectedCoreRange);
                let paintType = paintFormat.getPaintType();
                let pArr = paintFormat.makePaintArr(paintType, darr);

                this.setCellByCellProp(pArr, cb);
            }
        }, {type: 12, cellRange: this.coreSelector.selectedCoreRange});
    }
    // ======= 与撤销回退有关
    canUndo() {
        return this.multiPreAction.getItems(1).length > 0;
        // return this.history.canUndo();
    }

    canRedo() {
        return this.multiPreAction.getItems(2).length > 0;
    }

    undo() {
        this.multiPreAction.undo();
        this.changeDataForCalc = this.getChangeDataToCalc();
        // this.history.undo(this.getData(), (d) => {
        //     this.setData(d);
        // }, belongSheet);
    }

    historyList(item) {
        return this.multiPreAction.getItems(item);
    }

    redo() {
        this.multiPreAction.redo();
        this.changeDataForCalc = this.getChangeDataToCalc();
        // this.history.redo(this.getData(), (d) => {
        //     this.setData(d);
        // });
    }


    canPaste(src: CellRangeProxy, dst:CellRangeProxy, error = () => { // 已经转移
    }) {
        if (!dst) {
            return false;
        }
        const { multiCoreMerge } = this;
        const cellRange = dst.getCopy();
        const [srn, scn] = src.getRowColCount();
        const [drn, dcn] = dst.getRowColCount();
        if (srn > drn) {
            cellRange.eri = dst.sri + srn - 1;
        }
        if (scn > dcn) {
            cellRange.eci = dst.sci + scn - 1;
        }
        if (multiCoreMerge.isOverlapWith(cellRange)) {
            error(t('error.pasteForMergedCell'));
            return false;
        }
        return true;
    }

    copyPaste(srcCellRange, dstCellRange, what, autofill = false) { // 已经转移
        const { rows, multiCoreMerge } = this;
        // delete dest merge
        if (what === 'all' || what === 'format') {
            this.coreRows.deleteCells(dstCellRange, what);
            multiCoreMerge.deleteWithin(dstCellRange);
        }
        this.coreRows.copyPaste(srcCellRange, dstCellRange, what, autofill, (ri, ci, cell) => {
            if (cell && cell.merge) {
                const [rn, cn] = cell.merge;
                if (rn <= 0 && cn <= 0) return;
                multiCoreMerge.addMergeRange(new CellRangeProxy(ri, ci, ri + rn, ci + cn));
            }
        });
    }

    setStyleBorder(ri, ci, bss) { // 已经转移
        const { cellStyleArray, rows } = this;
        const cell = this.coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(ri, ci);
        let cstyle = {};
        if (isHave(cell.cellStyleID)) {
            cstyle = cloneDeep(cellStyleArray[cell.cellStyleID]);
        }

        Object.assign(cstyle, { border: bss });
        cell.cellStyleID = this.addStyle(cstyle);
    }

    selectorCellText(ri, ci, text, event_type) {// 已经转移
        if (ri === -1 || ci === -1) {
            return {
                'state': true,
                'msg': '单元格坐标有误'
            };
        }
        if (event_type !== 'style' && (!text || text[0] !== '=')) {
            return {
                'state': false,
                'msg': '正确'
            };
        }

        // state
        let args = this.checkErrorOfFormula(text);
        return args
    }

    checkErrorOfFormula(text):{msg:string,isError: boolean} { // 已经转移
        let enter = false;
        let msg = '';
        try {
            let recast = new Recast(text);
            recast.parse();
        } catch (e) {
            msg = '您输入的公式存在问题，请更正, 错误原因: ' + e.description;
            enter = true;
        }

        if (enter === true) {
            if (isLegal(text) === false) {
                msg = '缺少左括号或右括号';
                enter = true;
            }
        }
        return {
            state: enter,
            msg: msg,
            isError: enter,
        };
    } // 似乎已经有了

    processPasteDirectionsArr(pasteDirectionsArr, type = 'to', sheetComp) { // 处理截图； todo: 后续需要重写
        if (type === 'to') {
            let arr = [];
            for (let i = 0; i < pasteDirectionsArr.length; i++) {
                let item = pasteDirectionsArr[i];
                let newItem = {
                    src: item.img2.src,
                    ri: item.riOfEditingCell,
                    ci: item.ci,
                    top: item.top,
                    left: item.left,
                    range: item.range,
                    offsetLeft: item.offsetLeft,
                    offsetTop: item.offsetTop,
                    nextLeft: item.nextLeft,
                    nextTop: item.nextTop,
                    img: item.img,
                    arr: item.arr,
                    img2: item.img2
                };

                arr.push(newItem);
            }

            return arr;
        } else if (type === 'from') {
            if (typeof sheetComp === 'string') {
                return;
            }
            for (let i = 0; i < pasteDirectionsArr.length; i++) {
                let item = pasteDirectionsArr[i];
                let img = h('img', '');
                img.el.src = item.src;
                sheetComp.pasteBhv.mountImg(img.el, true, item.riOfEditingCell, item.ci, item.range);
            }
        }
    }

    clickCopyPasteHelp(ri, lci) { // 已经转移
        let { coreRows } = this;
        let lri = ri + 1;
        let enter = true;
        while (enter) {
            let lcell = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(lri, lci);
            if (!lcell || !lcell.text) {
                enter = false;
            } else {
                lri = lri + 1;
            }
        }

        return lri;
    }

    setStyleBorders({ mode, style, color }) { // 已经转移； 设置border属性
        let selector = this.coreSelector
        let rows = this.coreRows
        let cellStyleArray = this.cellStyleArray
        const {
            sri, sci, eri, eci,
        } = selector.selectedCoreRange;
        const multiple = !this.isSignleSelected();
        if (!multiple) {
            if (mode === 'inside' || mode === 'horizontal' || mode === 'vertical') {
                return;
            }
        }

        for (let ri = sri; ri <= eri; ri += 1) {
            for (let ci = sci; ci <= eci; ci += 1) {
                this.setStyleBorder(ri, ci, {});
            }
        }

        if (mode === 'outside' && !multiple) {
            this.setStyleBorder(sri, sci, {
                top: [style, color],
                bottom: [style, color],
                left: [style, color],
                right: [style, color],
            });
        } else if (mode === 'none') {
            selector.selectedCoreRange.applyEveryRiCi((ri, ci) => {
                const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
                if (cell && cell.cellStyleID !== undefined) {
                    const ns = cloneDeep(cellStyleArray[cell.cellStyleID]);
                    delete ns.border;
                    // ['bottom', 'top', 'leftSpanElIndex', 'right'].forEach((prop) => {
                    //   if (ns[prop]) delete ns[prop];
                    // });
                    cell.cellStyleID = this.addStyle(ns);
                }
            });
        } else if (mode === 'all' || mode === 'inside' || mode === 'outside'
          || mode === 'horizontal' || mode === 'vertical') {
            const merges = [];
            for (let ri = sri; ri <= eri; ri += 1) {
                for (let ci = sci; ci <= eci; ci += 1) {
                    // jump merges -- deal1Char
                    const mergeIndexes = [];
                    for (let ii = 0; ii < merges.length; ii += 1) {
                        const [mri, mci, rn, cn] = merges[ii];
                        if (ri === mri + rn + 1) mergeIndexes.push(ii);
                        if (mri <= ri && ri <= mri + rn) {
                            if (ci === mci) {
                                ci += cn + 1;
                                break;
                            }
                        }
                    }
                    mergeIndexes.forEach(it => merges.splice(it, 1));
                    if (ci > eci) break;
                    // jump merges -- end
                    const cell = this.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
                    let [rn, cn] = [0, 0];
                    if (cell && cell.merge) {
                        [rn, cn] = cell.merge;
                        merges.push([ri, ci, rn, cn]);
                    }
                    const mrl = rn > 0 && ri + rn === eri;
                    const mcl = cn > 0 && ci + cn === eci;
                    let bss = {};
                    if (mode === 'all') {
                        bss = {
                            bottom: [style, color],
                            top: [style, color],
                            left: [style, color],
                            right: [style, color],
                        };
                    } else if (mode === 'inside') {
                        if (!mcl && ci < eci) bss.right = [style, color];
                        if (!mrl && ri < eri) bss.bottom = [style, color];
                    } else if (mode === 'horizontal') {
                        if (!mrl && ri < eri) bss.bottom = [style, color];
                    } else if (mode === 'vertical') {
                        if (!mcl && ci <= eci) bss.right = [style, color];
                    } else if (mode === 'outside' && multiple) {
                        if (sri === ri) bss.top = [style, color];
                        if (mrl || eri === ri) bss.bottom = [style, color];
                        if (sci === ci) bss.left = [style, color];
                        if (mcl || eci === ci) bss.right = [style, color];
                    }
                    if (Object.keys(bss).length > 0) {
                        this.setStyleBorder(ri, ci, bss);
                    }
                    ci += cn;
                }
            }
        } else if (mode === 'top' || mode === 'bottom') {
            for (let ci = sci; ci <= eci; ci += 1) {
                if (mode === 'top') {
                    this.setStyleBorder(sri, ci, { top: [style, color] });
                    ci += rows.getCellMerge(sri, ci)[1];
                }
                if (mode === 'bottom') {
                    this.setStyleBorder(eri, ci, { bottom: [style, color] });
                    ci += rows.getCellMerge(eri, ci)[1];
                }
            }
        } else if (mode === 'left' || mode === 'right') {
            for (let ri = sri; ri <= eri; ri += 1) {
                if (mode === 'left') {
                    this.setStyleBorder(ri, sci, { left: [style, color] });
                    ri += rows.getCellMerge(ri, sci)[0];
                }
                if (mode === 'right') {
                    this.setStyleBorder(ri, eci, { right: [style, color] });
                    ri += rows.getCellMerge(ri, eci)[0];
                }
            }
        }
    }

    textWrapHeight(ri, ci) { // 已经转移
        let { coreRows } = this;
        let height = coreRows.ensureGetRowHeightByRi(ri);

    }


    makeFormatCell({ text, formula }, { symbol, position }, cb) { // 已经转移
        if (!isHave(text) || !isNumber(text)) {
            return null;
        }

        let cText = cb(formatNumberRender(text, -1));
        formula = isFormula(formula) ? formula : cText;
        if (!isNaN(cText)) {

            return {
                'text': position === 'begin' ? symbol + cText : cText + symbol,
                'value': text,
                'formulas': formula,
            };
        } else {
            return null;
        }
    }

    tryParseToNum(cell, ri, ci) { // 已经转移
        return this.getType(ri, ci, cell);
    }

    getType(ri, ci, cell) { // 已经转移
        let data = this;
        let { coreRows } = this;
        let cellStyle = data.getCellStyle(ri, ci);
        let { isValid, diff } = dateDiff(cell.getText());

        let format = coreRows.getCellStyleConvert(cellStyle, isValid);
        if (format === 'number') {
            let text = cell.getText(),
              formula = cell.formulas;
            let _cell = {};
            if (isValid) {
                _cell = {
                    'text': diff.toFixed(2),
                    'formulas': formula,
                };
            } else {
                text = formatNumberRender(text, 2);
                _cell = {
                    'text': text,
                    'value': cell.getText(),
                    'formulas': formula,
                };
            }

            if (isHave(_cell.text) && isNumber(_cell.text)) {
                return {
                    'state': true,
                    'style': format,
                    'text': _cell.text,
                    'cell': _cell,
                };
            } else {
                return {
                    'state': false,
                    'style': format,
                    'text': _cell.text,
                    'cell': _cell,
                };
            }
        } else if (format === 'date' || format === 'datetime') {
            let text = cell.getText();

            if (!isValid) {
                let args = formatDate(text);
                let { state, date } = args;
                // minute = args.minute;
                isValid = state;
                diff = cell.getText();
                text = date;
            }

            if (isValid) {
                if (format === 'datetime') {
                    text = changeFormat(formatDate(dateDiff(text).diff).date);
                }

            }

            return {
                'state': isValid,
                'style': format,
                'text': !isHave(cellStyle) ? diff : text,
            };
        } else if (format === 'normal') {
            if (isValid) {
                let text = diff,
                  formula = cell.formulas;
                let _cell = {
                    'formulas': coreRows.toString(formula),
                    'text': coreRows.toString(text),
                };

                return {
                    'state': true,
                    'text': _cell.text,
                    'style': format,
                    'cell': _cell,
                };
            } else {
                let text = cell.getText(),
                  formula = cell.formulas;
                let _cell = {
                    'formulas': formula,
                    'text': text,
                };

                return {
                    'state': true,
                    'style': format,
                    'text': _cell.text,
                    'cell': _cell,
                };
            }
        } else if (format === 'rmb') {
            let text = '',
              formula = '';
            if (isValid) {
                text = diff;
                formula = isFormula(cell.formulas) ? cell.formulas : diff;
            } else {
                text = formatNumberRender(cell.getText(), 0);
                formula = cell.formulas;
            }

            let _cell = this.makeFormatCell({
                text,
                formula
            }, {
                symbol: '￥',
                position: 'begin'
            }, (s) => {
                return s;
            });
            if (_cell) {
                return {
                    'state': true,
                    'style': format,
                    'text': _cell.text,
                    'cell': _cell,
                };
            }
        } else if (format === 'percent') {
            let text = '',
              formula = '';

            if (isValid) {
                text = diff;
                formula = isFormula(cell.formulas) ? cell.formulas : diff;
            } else {
                text = coreRows.useOne(cell.value, cell.getText());
                formula = cell.formulas;
            }
            let _cell = this.makeFormatCell({
                text,
                formula
            }, {
                symbol: '%',
                position: 'end'
            }, (s) => {
                return Number(s * 100)
                  .toFixed(2);
            });
            if (_cell) {
                return {
                    'state': true,
                    'style': format,
                    'text': _cell.text,
                    'cell': _cell,
                };
            }
        }

        return {
            'state': false,
            'style': format,
            'text': cell.getText(),
            'cell': {},
        };
    }
    getWorkbookServerObj() {
        const {
            name,  cellStyleArray, multiCoreMerge, coreRows, coreCols, validations, coreSortFilter, pasteDirectionsArr,
        } = this;
        let freezeRiCi = this.tableViewForEvent
        return {
            editor: this.coreSheetSetting.showEditor,
            name,
            freeze: xy2expr(freezeRiCi[1], freezeRiCi[0]),
            cellStyleArray: cellStyleArray,
            pictures: this.processPasteDirectionsArr(pasteDirectionsArr, 'to'),
            merges: multiCoreMerge.getA1A2StrArray(),
            rows: coreRows.getData(),
            cols: coreCols.getData(),
            validations: validations.getData(),
        };
    }

    clickCopyPaste() {
        let ri = this.coreSelector.selectedCoreRange.eri;
        let ci = this.coreSelector.selectedCoreRange.eci;
        let { coreRows } = this;
        const cell = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(ri, ci);
        const cell2 = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(ri + 1, ci);
        if (!cell || !cell.getText() || (cell2 && cell2.text)) {
            return {
                enter: false
            };
        }

        let left = this.clickCopyPasteHelp(ri, ci - 1);
        let right = this.clickCopyPasteHelp(ri, ci + 1);
        let eri = left < right ? right : left;

        let enter = false;
        for (let i = 1; i < eri && enter === false; i++) {
            let cell3 = coreRows.multiCoreRow.ensureGetFormatCellByRowIDColID(ri + i, ci);

            if (cell3 && cell3.text) {
                eri = ri + i;
                enter = true;
            }
        }


        let dstCellRange = new CellRangeProxy(ri + 1, ci, eri - 1, ci);
        let srcCellRange = new CellRangeProxy(ri, ci, ri, ci);

        return {
            enter: true,
            dstCellRange: dstCellRange,
            srcCellRange: srcCellRange
        };
    }


}

