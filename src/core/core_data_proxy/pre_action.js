import { deepCopyObj, distinct } from '../../global_utils/operator';
import { isHave } from '../../global_utils/check_value';
import { expr2xy, xy2expr } from '../../global_utils/alphabet';
import { CHANGE_PASTE } from '../core_utils/config';


function getDependOfDepend(dependList, changeArr) {
    if (!dependList || dependList.length <= 0) {
        return {
            "status": false,
        };
    }
    let {data} = this;
    let status = false;

    for (let i = 0; i < dependList.length; i++) {
        let depend = dependList[i];

        let [ci, ri] = expr2xy(depend);
        let cell = data.coreRows.multiCoreRow.getFormatCellByRowIDColID(ri, ci);
        if (isHave(cell) && isHave(cell['depend']) && cell['depend'].length > 0) {
            for(let j = 0; j < cell['depend'].length; j++) {
                if(changeArr.indexOf(cell['depend'][j]) === -1) {
                    changeArr.push(cell['depend'][j]);
                    status = true;
                }
            }
        }
    }
    return {
        "state": status,
    }
}

export class PreAction {
    constructor({type = -1, action = "", ri = -1, ci = -1, oldData = "", len = -1, newData = "", expr = "", oldStep = "", cellRange = "", cells = {}, height = -1, width = -1, oldCell = {}, newCell = {}, newMergesData = "", oldMergesData = "", property = "", value = ""}, data) {
        this.type = type;
        this.action = action;
        this.ri = ri;
        this.ci = ci;
        this.expr = expr;
        this.cellRange = cellRange;
        this.cells = cells;
        this.height = height;
        this.width = width;
        this.len = len;
        this.oldCell = oldCell;
        this.newCell = newCell; // 一个Object记录，更新的值
        this.oldMergesData = oldMergesData;
        this.newMergesData = newMergesData;
        this.property = property;
        this.value = value;
        this.oldStep = oldStep;
        this.oldData = oldData;
        this.newData = newData;
        this.data = data;
    }

    /**
     * 获取所有需要计算的单元格列表
     * @returns {Array}
     */
    isRefresh() { // jobs; 我加的，判定是否是全量更新
        return this.type === 999;
    }

    isDelete() {
        return this.type === 2 // jobs; 我加的，判定是否是删除
    }

    findAllNeedCalcCell() {
        let changeArr = [];
        let {oldCell, newCell, ri, ci} = this; // 应该得到多个sheet的变更结果
        changeArr.push(...getCellDepend(oldCell));
        changeArr.push(...getCellDepend(newCell));
        if (ri !== -1 && ci !== -1) {
            changeArr.push(xy2expr(ci, ri));
        }
        changeArr = distinct(changeArr);
        let args = getDependOfDepend.call(this, changeArr, changeArr);
        while (args['status']) {
            args = getDependOfDepend.call(this, args['data'], changeArr);
        }
        return changeArr;
    }

    restore(data, sheet, isRedo) {
        let {type} = this;

        if (type === 1) { // shuru
            let {oldCell, newCell} = this;
            let _cell = "";
            // redo 1  undo 2
            if (isRedo === 1) {
                _cell = deepCopyObj(oldCell);
            } else {
                _cell = deepCopyObj(newCell);
            }
            for (let i = 0; i < _cell.length; i++) {
                let {cell, ri, ci} = _cell[i];
                data.coreRows.setCellText(ri, ci, cell, 'cell');
            }

        } else if (type === 13 || type === 14) {
            let {oldData, newData} = this;
            let _data = "";
            if (isRedo === 1) {
                _data = deepCopyObj(newData);
            } else {
                _data = deepCopyObj(oldData);
            }

            data.setData(_data); // 恢复上一个状态
        }  else if (type === 2 || type === 5 || type === CHANGE_PASTE || type === 11 || type === 12) {
            let {newCell, oldCell, oldMergesData, newMergesData, cellRange, property, value} = this;
            let _cells = "";
            if (isRedo === 1) {
                _cells = deepCopyObj(oldCell);
            } else {
                _cells = deepCopyObj(newCell);
            }

            if (property === 'merge') {
                if (isRedo === 1) {
                    this.data.multiCoreMerge.setData(oldMergesData);
                } else {
                    this.data.multiCoreMerge.setData(newMergesData);
                }
            }

            for (let i = 0; i < _cells.length; i++) {
                let {cell, ri, ci} = _cells[i];

                data.coreRows.setCellText(ri, ci, cell, 'cell');
            }
        } else if (type === 3) {
            let {ri, height, oldStep} = this;
            if (isRedo === 1) {
              const row = data.coreRows.multiCoreRow.ensureGetSingleRowByRowID(ri);
              row.height = oldStep.height;
            } else {
              const row = data.coreRows.multiCoreRow.ensureGetSingleRowByRowID(ri);
              row.height = height;
            }
        } else if (type === 4) {
            let {ci, width, oldStep} = this;
            if (isRedo === 1) {
                data.coreCols.setWidth(ci, oldStep.width);
            } else {
                data.coreCols.setWidth(ci, width);
            }

        }
    }
}
