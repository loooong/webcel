"use strict";
import {getSanitizedSheetName} from '../calc_utils/get_sheetname.js'
import {ERROR_CIRCULAR} from '../calc_utils/error_config.js'
import { A1A2, AA, FORMULA_STATUS, SYN_RANG_REF } from '../calc_utils/config';
import { ColIndexProxy } from './parser_col_index';
import {CellVEmpty} from '../../internal_module/basic_cell_value';
import { getRowNumFromCellName } from '../../global_utils/alphabet';
import { ERROR_REF } from '../calc_utils/error_config';
import { CalcCell } from './calc_cell';

/** 都会指向一个calcSheet变量，不包含sheetName，这样之后sheet重命名的，不需要做任何变化。
 * @property {CalcCell} calcCell
 * @property {CalcSheet} calcSheet
 */
export class SUnitRangeRef{
    calcCell: CalcCell
    constructor(str_expression, calcCell, position_i){ // todo: position_i 之后可以废弃
        let range_expression, sheet_name, sheet;
        this.calcCell = calcCell
        this.str_expression = str_expression // 这个状态是初始化的时候用的，sheet重命名之后可能不正确了
        this.unitType = SYN_RANG_REF;
        this.rangeExpressionType = ""
        this.updateCalcSheetAndRangeExpr()
    }

    updateCalcSheetAndRangeExpr(){
        let sheetName
        if (this.str_expression.indexOf('!') !== -1) {
            let aux = this.str_expression.split('!');
            sheetName = getSanitizedSheetName(aux[0]);
            this.range_expression = aux[1];
        }
        else {
            sheetName = this.calcCell.calcSheet.theSheetName;
            this.range_expression = this.str_expression;
        }
        this.calcSheet = this.calcCell.workbookProxy.workbookEditor.multiSheet.getSheetByName(sheetName);
        if (!this.calcSheet) { // 找不到这个sheet
            console.log('Sheet ' + sheetName + ' not found.', "syntax_unit_range.js")
            this.calcSheet = new Error(ERROR_REF) // 引用错误
        }

    }

    solveExpression(){ // 根据this.calcSheet 与.range_expression来计算出结果。
        if(this.calcSheet instanceof Error){
            return this.calcSheet
        }
        let range_expression = this.range_expression;
        let arr = range_expression.split(':');
        let min_row = getRowNumFromCellName(arr[0]);
        let str_max_row = arr[1].replace(/^[A-Z]+/, '');
        let max_row;
        // the max is 1048576, but TLE
        if(str_max_row === ""){
            max_row = this.calcSheet.getMaxRowNum() // 最大的行号
            this.rangeExpressionType = AA
        }
        else {
            max_row = getRowNumFromCellName(str_max_row)
            this.rangeExpressionType = A1A2
        }

        let min_col = new ColIndexProxy(arr[0]).colNum;
        let max_col = new ColIndexProxy(arr[1]).colNum;
        [min_row, max_row] = [min_row, max_row].sort(); // A10:B4 -> A2:B10
        [min_col, max_col] = [min_col, max_col].sort();


        let matrix = [];
        for (let i = min_row; i <= max_row; i++) { // 这里的i是row index， j 是col index
            let row = [];
            matrix.push(row);
            for (let j = min_col; j <= max_col; j++) {
                let cell_name = new ColIndexProxy(j).colStr + (i+1);
                let refCalcCell = this.calcSheet.getCellByName(cell_name)
                if (refCalcCell) { // 之前就已经存在这个cell了
                    if ([FORMULA_STATUS.created, FORMULA_STATUS.recalculate].includes(refCalcCell.cellStatus)) {
                        refCalcCell.execFormula();
                    }
                    else if (refCalcCell.cellStatus === FORMULA_STATUS.working) {
                        return  new Error(ERROR_CIRCULAR);
                    }
                    if (refCalcCell.cellObj.t === 'e') { // 出现错误
                        row.push(refCalcCell.cellObj);
                    }
                    else {
                        row.push(refCalcCell.cellObj.v);
                    }
                }
                else {
                    row.push(new CellVEmpty());
                }
            }
        }
        return matrix; // 得到一个二维数组
    }
}

