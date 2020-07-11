'use strict';

import { getSanitizedSheetName } from '../calc_utils/get_sheetname.js';
import * as error_cf from '../calc_utils/error_config.js';
import { A1, FORMULA_STATUS, SYN_SINGLE_REF, SYN_SPLIT_MARK } from '../calc_utils/config';
import { expr2xy } from '../../global_utils/alphabet';
import { ERROR_REF } from '../calc_utils/error_config';

/**
 *@property {CalcCell} calcCell
 *@property {String} str_expression 已经把绝对引用符号去掉了
 */
export class SUnitRefValue {
  constructor(str_expression, calcCell) {
    this.name = 'SUnitRefValue';
    this.str_expression = str_expression; // str_expression是初始化的时候用的，可能之后不再正确
    this.calcCell = calcCell;
    this.unitType = SYN_SINGLE_REF;
    this.refCalcCell = undefined
    this.updateRefCalcCell()
  }

  /**
   *初始化的时候，设定了refCalcCell，当sheet重命名，或者这个calcCell移动的之后，重新计算，值不会发生变化
   * @return {CalcCell}
   */
  updateRefCalcCell() { //
    let self = this;
    /**
     * @type {CalcCell}
     */
    let calcCell = this.calcCell;
    let str_expression = this.str_expression;
    let calcSheet,
      sheet_name,
      cell_name;
    if (str_expression.indexOf('!') !== -1) { // sheet1!A1的形式
      let aux = str_expression.split('!');
      sheet_name = getSanitizedSheetName(aux[0]);
      calcSheet = calcCell.workbookProxy.workbookEditor.getSheetByName(sheet_name);
      cell_name = aux[1];
    } else {// A1的形式
      calcSheet = calcCell.calcSheet;
      sheet_name = calcCell.calcSheet.theSheetName;
      cell_name = str_expression;
    }
    if (!calcSheet) { // 找不到这个sheet
      console.log('Sheet ' + sheet_name + ' not found.', "syntax_unit_ref_value.js\n")
      this.refCalcCell = new Error(ERROR_REF) // 引用错误
      return ;
    }
    this.refCalcCell = this.calcCell.workbookProxy.workbookEditor.ensureGetCellByName(sheet_name, cell_name);
  };

  solveExpression() {
    let self = this;
    let refCalcCell = this.refCalcCell
    if(refCalcCell instanceof Error){
      return refCalcCell
    }

    if (!refCalcCell.cellObj) { // 获取这个cell，如果为空的话返回Null
      return null;
    }
    if ([FORMULA_STATUS.created, FORMULA_STATUS.recalculate].includes(refCalcCell.cellStatus) ) { // 如果发现这个公式还没有被计算出来，那么去计算这个公式
      refCalcCell.execFormula(); // 碰到了还没有解出来的公式。这里存在着递归。
      if (refCalcCell.cellObj.t === 'e') { //  如果self对应的单元格得到的结果是错误。t属性代表类型，如果为e 代表error
        console.log('ref is an error at', refCalcCell);
        throw new Error(refCalcCell.cellObj.w);
      }
      return refCalcCell.cellObj.v;
    } else if (refCalcCell.cellStatus === FORMULA_STATUS.working) {// 循环依赖
      throw new Error(error_cf.ERROR_CIRCULAR);
    } else if (refCalcCell.cellStatus === FORMULA_STATUS.solved) {
      if (refCalcCell.cellObj.t === 'e') {
        console.log('ref is an error after cellFormulaProxy eval');
        throw new Error(refCalcCell.cellObj.w);
      }
      return refCalcCell.cellObj.v;
    }
  }
}

