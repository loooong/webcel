import { xy2expr } from '../../global_utils/alphabet';
import { PreAction } from './pre_action';
import { testValid } from '../../global_utils/test';
import {
    CHANGE_ADVANCED_PASTE,
    CHANGE_AUTO_FILL,
    CHANGE_COL_WIDTH,
    CHANGE_DELETE_FORMULA,
    CHANGE_DELETE_INPUT,
    CHANGE_DELETE_RANGE,
    CHANGE_INSERT_RANGE,
    CHANGE_PASTE,
    CHANGE_RANGE_STYLE,
    CHANGE_ROW_HEIGHT
} from '../core_utils/config';

function operationItem(preAction) {
    this.undoItems.push(preAction);
    this.redoItems = [];
}


// todo type管理
export class MultiPreAction {
    constructor(data) {
        this.undoItems = [];
        this.redoItems = [];
        this.data = data;
    }

    addStep({type, action, ri, ci, expr, cellRange, cells, height, width, property, value, oldData}, {oldCell, len, newCell, oldMergesData, newMergesData, oldStep}) {
        let preAction = "";

        if(type === 1) {
            preAction = new PreAction({
                type,
                action, ri, ci, expr, oldCell, newCell
            }, this.data);
            operationItem.call(this, preAction);
        } else if(type === 2 || type === 5 || type === 11 || type === 12 || type === CHANGE_PASTE) {
            preAction = new PreAction({
                type, oldMergesData, property, value, newMergesData,
                action, cellRange,  oldCell, newCell: cells
            }, this.data);
            operationItem.call(this, preAction);
        } else if(type === 13 || type === 14) {
            preAction = new PreAction({
                type, oldData, newData: oldStep.oldData,
                action, property, len, ri, ci
            }, this.data);
            operationItem.call(this, preAction);
        } else if(type === 3) {
            preAction = new PreAction({
                type,
                action, height, ri, oldStep
            }, this.data);
            operationItem.call(this, preAction);
        } else if(type === 4) {
            preAction = new PreAction({
                type,
                action, width, ci, oldStep
            }, this.data);
            operationItem.call(this, preAction);
        }

        testValid.call(this);
    }

    // 根据不同数据变化的情况，得到stepObj； todo: 这块代码可以优化
    getStepObjByChangeDetail(dataChangeType, {ri, ci, expr, text, range, cellRange, property, value}) {
        let str = "";
        let {coreRows, coreCols} = this.data;

        if(dataChangeType === CHANGE_DELETE_INPUT) {
            str = `在${expr}中键入"${text}"`;
            return {
                action: str,
                type: dataChangeType,
                ri, ci, expr
            };
        } else if(dataChangeType === CHANGE_DELETE_FORMULA) {
            let expr1 = xy2expr(range.sci, range.sri);
            let expr2 = xy2expr(range.eci, range.eri);
            expr = expr1 === expr2 ? expr1 : `${expr1}:${expr2}`;
            str = `删除${expr}的单元格内容`;
            return {
                action: str,
                type: dataChangeType,
                cellRange: range,
                cells: this.eachRange(range),
            };
        } else if(dataChangeType === CHANGE_ROW_HEIGHT) {
            let height = coreRows.ensureGetRowHeightByRi(ri);
            str = `行高`;
            return {
                action: str,
                type: dataChangeType,
                height: height,
                ri: ri
            };
        } else if(dataChangeType === CHANGE_COL_WIDTH) {
            let width = coreCols.ensureGetWidthByColID(ci);
            str = `列宽`;
            return {
                action: str,
                type: dataChangeType,
                width: width,
                ci: ci
            };
        } else if(dataChangeType === CHANGE_AUTO_FILL) {
            str = '自动填充';
            return {
                action: str,
                type: dataChangeType,
                cellRange: range,
                cells: this.eachRange(cellRange),
            };
        } else if(dataChangeType === CHANGE_ADVANCED_PASTE) {
            str = '选择性粘贴';
            return {
                action: str,
                type: dataChangeType,
                cellRange: range, property, value,
                cells: this.eachRange(cellRange),
            };
        } else if(dataChangeType === CHANGE_INSERT_RANGE) {
            const EDIT_INSERT_RANGE = '插入单元格'

            return {
                action: EDIT_INSERT_RANGE, property, ri, ci,
                type: dataChangeType, oldData: this.data.getWorkbookServerObj(),
            };
        } else if(dataChangeType === CHANGE_DELETE_RANGE) {
            str = '删除单元格';

            return {
                action: str, property,   ri, ci,
                type: dataChangeType, oldData: this.data.getWorkbookServerObj(),
            };
        } else if(dataChangeType === CHANGE_RANGE_STYLE) {
            if (property === 'font-bold' || property === 'font-italic'
                || property === 'font-name' || property === 'font-size' || property === 'color') {
                str = "字体";
            } else if (property === 'underline') {
                str = "下划线";
            } else if (property === 'bgcolor' || property === 'format') {
                str = "单元格格式";
            } else if (property === 'align') {
                if (value === 'left') {
                    str = "左对齐";
                } else if (value === 'center') {
                    str = "居中";
                } else if (value === 'right') {
                    str = "右对齐";
                }
            } else if (property === 'valign') {
                if (value === 'top') {
                    str = "顶端对齐";
                } else if (value === 'center') {
                    str = "居中";
                } else if (value === 'bottom') {
                    str = "底端对齐";
                }
            } else if (property === 'border') {
                str = "边框";
            } else if (property === 'strike') {
                str = "删除线";
            } else if (property === 'merge') {
                str = '合并单元格';
            }

            return {
                action: str,
                type: dataChangeType,
                cellRange: range, property, value,
                cells: this.eachRange(cellRange),
            };
        } else {
            if(dataChangeType === CHANGE_PASTE) {
                        str = '粘贴';
                        return {
                            action: str,
                            type: dataChangeType,
                            cellRange: range,
                            cells: this.eachRange(cellRange),
                        };
                    }
        }
    }

    undo() {
        let preAction = this.does(this.getItems(1), 1);
        this.redoItems.push(preAction);
    }

    redo() {
        let preAction = this.does(this.getItems(2), 2);
        this.undoItems.push(preAction);
    }

    eachRange(range) {
        let {coreRows} = this.data;

        return coreRows.eachRange(range);
    }

    does(actionItems, actionType) {
        if (!this.data.coreSheetSetting.showEditor) {
            return;
        }

        if (actionItems.length <= 0) {
            return;
        }
        let {data} = this;
        let {sheet} = data;

        let preAction = actionItems.pop();
        preAction.restore(data, sheet, actionType);

        return preAction;
    }

    getItems(type) {
        if (type === 1) {
            return this.undoItems;
        } else {
            return this.redoItems;
        }
    }
}
