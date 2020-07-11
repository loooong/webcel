import { expr2xy, xy2expr } from '../../global_utils/alphabet';
import { A1, FORMULA_STATUS } from '../calc_utils/config';
import { BaseRefactorProxy } from './syntax_refactor';
import { ERROR_REF, ERROR_SYNTAX } from '../calc_utils/error_config';
import { StructuralExpressionBuilder } from '../calc_deal/structural_expression/deal_structural_expression';
import { SimpleExpressionBuilder } from '../calc_deal/simple_expression/deal_simple_expression';
import { DefaultCellVToText } from '../../internal_module/cellv_to_text_default';
import { MultiSyntaxUnitProxy } from '../../internal_module/syntax_builder_core';
import { CalcWorkbookProxy } from '../calc_cmd/calc_workbook';
import { isHave } from '../../global_utils/check_value';
import { myLog } from '../../log/new_log';
import { CellVError } from '../../internal_module/basic_cell_value';

/**
 * CalcCell需要calcSheet类来创建
 * @property {CalcWorkbookProxy} workbookProxy 本workbook
 * @property {CalcSheet}  calcSheet
 * @property {Object} cellObj
 * @property {String}celName 本cell的名字，例如A1
 * @property {String}cellStatus 状态
 */
export class CalcCell {
  cellObj: {f: string, v: any, text:string}
  rootSyntaxUnit: MultiSyntaxUnitProxy
  workbookProxy: CalcWorkbookProxy
  valueToTextBhv: DefaultCellVToText
  celName: string
  formulaString: string
  constructor(workbookProxy, calcSheet, cellObj, celName, cellStatus) {
    this.workbookProxy = workbookProxy;
    this.calcSheet = calcSheet;
    this.cellObj = cellObj;  // .f属性未来不会更新
    this.celName = celName; // 所在的位置
    this.cellStatus = cellStatus;
    this.cellID = this.wkCreateCellID()
    this.formulaString = this.getFormulaString();// 公式字符串,可能为空
    // === 语法树相关
    this.rootSyntaxUnit = null; // 语法树解析结果
    this.rootExp = null;
    this.fullLocStr2refID = {}; // 用来记录依赖关系
  }
  get valueToTextBhv(){
    return this.workbookProxy.workbookEditor.multiValue2TextSetting.getValueToTextBhv(this.calcSheet.sheetID, this.getCellLoc())
  }

  getFormulaString() {
    return this.cellObj.f || '';// 公式字符串,可能为空
  }

  getNameSheet1A1() {
    return this.calcSheet.theSheetName + '!' + this.celName;
  }

  getRiCi() {  // A1 => 0,0
    return expr2xy(this.celName)
      .reverse();
  }

  /**
   * 为core模块传递的数值在这里; cellObj可能直接是formatCell
   * @return {{v: *, formulas: *, text: *}}
   */
  updateCellObj() {
    // 转化为 text
    this.cellObj.formulas = this.formulaString
    try{ // 例如用日期来显示"sfsdf"会发生错误
      this.cellObj.text = this.valueToTextBhv.convertCellVToText(this.cellObj.v)
    }
    catch(error) {
      this.cellObj.text = this.cellObj.v.toString()
    }
    return this.cellObj
  }

  getCellProperty(propertyName) {
    return this.cellObj[propertyName];
  }

  isStructuralFormula() {
    // 根据第一个字符是否是等号来判定是是否是simple类型还是normal类型
    return this.formulaString.startsWith('=') && this.formulaString.length > 1;
  }

  isFormulaValid() {
    return typeof this.formulaString !== 'undefined';
  }

  isEmpty() { // cell 是否为空
    return typeof this.cellObj === 'undefined' || this.cellObj === null;
  }

  check_valid() {
    return typeof this.formulaString === 'string';
  }

  /**
   * 获取 0!A1_0_1这样的字符串
   */
  getFullLocStr() {
    let rici = this.getRiCi();
    let sheetID = this.calcSheet.sheetID;
    return sheetID + '!' + A1 + '_' + rici.join('_');
  }

  getCellLoc() {
    return this.getRiCi()
      .join('_');
  }

  // ============ 以下是变更数据 =========
  addSingleRelation(fullLocStr, refID) { // 添加一个依赖关系
    if (this.fullLocStr2refID.hasOwnProperty(fullLocStr)) {
      this.fullLocStr2refID[fullLocStr].push(refID);
    } else {
      this.fullLocStr2refID[fullLocStr] = [refID];
    }
  }
  updateCellNameByRiCi(ri, ci){
    return  this.celName = xy2expr(ci, ri);
  }

  /**
   *
   * @param shiftArray
   */
  updateCelNameByShiftArray(shiftArray) {
    // 增加现在的位置
    let rici = this.getRiCi();
    rici[0] = rici[0] + shiftArray[0];
    rici[1] = rici[1] + shiftArray[1];
    this.celName = xy2expr(rici[1], rici[0]);
    return this.celName
  }

  /**
   *
   * @param shiftNumber 负号代表向左移动
   */
  updateCelNameByShiftRight(shiftNumber) {
    return this.updateCelNameByShiftArray([0, shiftNumber])
  }

  /**
   *
   * @param shiftNumber 负号代表向上移动
   */
  updateCelNameByShiftDown(shiftNumber) {
    return this.updateCelNameByShiftArray([shiftNumber, 0])
  }

  updateByCellObj(newCellObj) { // 更新之后改变状态 todo: 只有要维护dependent的状态
    Object.assign(this.cellObj, newCellObj);
    this.formulaString = this.getFormulaString();// 公式字符串,可能为空
    this.cellStatus = FORMULA_STATUS.created;
  }


  // 改变数值的方法
  buildExpression() {
    let builder;
    if (this.isStructuralFormula()) {
      builder = new StructuralExpressionBuilder(this, this.workbookProxy.multiCollExpFn);
      /**
       * @type {StructuralExpressionBuilder} builder
       */
      return builder.parseFormula();
    } else {
      builder = new SimpleExpressionBuilder(this);
      return builder.parseFormula();
    }
  }


  execFormula() {
    if (this.cellStatus === FORMULA_STATUS.solved) {
      return this.cellObj.v;
    }
    let isFormulaChanged = this.cellStatus === FORMULA_STATUS.created;
    this.cellStatus = FORMULA_STATUS.working; // 当前的状态是working
    if(this.cellID === 110){

      console.log(this.cellID)
    }
    if (isFormulaChanged) {
      this.wkDeleteAllDependentRelation(); // 因为需要重新计算，所以需要删除所有依赖的单元格
      this.rootSyntaxUnit = null; // 清空之前的解析结果
      this.rootExp = this.buildExpression();
    }
    /**
     * @type {StructuralExp} root_exp
     */
    this.rootExp.update_cell_value();
    if(isHave(this.cellObj.v) === false){
      this.cellObj.v =  new CellVError(new Error(ERROR_SYNTAX))// 语法错误
    }
    this.cellObj.v.valueToTextBhv = this.valueToTextBhv // 放到cellV的属性里面去，未来可以调用
    this.cellStatus = FORMULA_STATUS.solved; // 更新了之后，状态变为done
    if(this.isStructuralFormula()&& this.rootSyntaxUnit) // 出现语法错误的时候，this.rootSyntaxUnit为null
      this.refreshFormulaString() //   解析的时候会把中文字符替换为英文字符，refresh之后会把formulaString中相应的字符变更掉
    if (isFormulaChanged ) {
      this.addAllRefSyntaxUnitArray(); // 把最新的依赖关系告知给workbook
    }
    this.updateCellObj() // 更新cellObj中的formula与text属性
  }

  isError(errorMsg = ERROR_REF) {
    if (this.cellObj.v.hasOwnProperty('err')) {
      return this.cellObj.v.err.message === ERROR_REF;
    }
    return false;
  }

  // ==== 与workbook关联关系的处理,都会有wk作为前缀 ============
  wkCreateCellID(){
    return this.workbookProxy.workbookEditor.multiCalcCell.addCellToMultiCell(this); // 获取cellID, 注册到multiCell中去了
  }

  wkUpdateMultiRelation() {
    this.workbookProxy.workbookEditor.multiRelation.addRelationByLoc2PstID(this.fullLocStr2refID, this.cellID);
  }

  wkDeleteAllDependentRelation() { // 清空所有的依赖关系
    let fullLocArray = Object.getOwnPropertyNames(this.fullLocStr2refID);
    if (fullLocArray.length > 0) {
      this.workbookProxy.workbookEditor.multiRelation.removeRelationByFullLocArrayAndCellID(fullLocArray, this.cellID);
      this.fullLocStr2refID = {}; // 自身的属性也要更新
    }
  }
  /**
   * 在三个地方删除自己：cellID2calcCell, sheetID2cellLoc2CalcCell, fullLoc2CellID2PstID
   */
  wkRemoveSelf(){
    if (this.isStructuralFormula()) {
      this.wkDeleteAllDependentRelation(); // 因为需要重新计算，所以需要删除所有依赖的单元格
    } // 从依赖关系中删除掉
    this.workbookProxy.workbookEditor.multiCalcCell.simpleRemoveCellIDArray([this.cellID])
    // 从位置关系上删除掉
  }
  // ==== 对语法单元的处理 ============

  // 把最新的依赖关系传递给workbookEditor
  addAllRefSyntaxUnitArray() {
    if (this.rootSyntaxUnit === null) { // 此时是simpleEquation，不需要考虑语法树
      return;
    }
    let refUnitArray = this.getRefSyntaxUnitArray(); // 获取所有的引用类型的语法单元
    let self = this;
    refUnitArray.map(refUnit => {
        let locStr = refUnit.syntaxParser.getLocStr(); // 获取 A1_0_2这样的字符串
        let refSheetName = refUnit.syntaxParser.getSheetName();
        let curSheetID = refSheetName === '' ? this.calcSheet.sheetID :
          this.workbookProxy.workbookEditor.multiSheet.getIDByName(refSheetName);// 获取sheetID
        if(typeof curSheetID !== "undefined"){ // 如果这个sheetName的名字不存在，那么curSheetID就是undefined
          let fulLocStr = curSheetID + '!' + locStr;
          this.addSingleRelation(fulLocStr, refUnit.pstID);
        }
      }
    );
    this.wkUpdateMultiRelation();
  }

  getRefSyntaxUnitArray(isSort = true) {
    let allUnitArray = this.rootSyntaxUnit.getAllBaseSyntaxUnit(isSort);
    let refUnitArray = allUnitArray.filter(aUnit => aUnit.isReferUnit()); // 把引用语法单元放进来
    return refUnitArray;
  }

  getRefSyntaxUnitByRefIDArray(refIDArray) {
    let allUnitArray = this.rootSyntaxUnit.getAllBaseSyntaxUnit();
    let refUnitArray = allUnitArray.filter(aUnit => refIDArray.includes(aUnit.pstID)); // 把引用语法单元放进来
    return refUnitArray;
  }
  // 保留原有的A1，A1A2,AA 的引用形式
  updateByRefIDAndRangeIndexArray(refIDArray, rangeIndexArray) {
    let refUnitArray = this.getRefSyntaxUnitByRefIDArray(refIDArray);
    refUnitArray.forEach(refUnit =>
      refUnit.updateByNewRangIndexArray(rangeIndexArray, true));
    return this.refreshFormulaString();
  }
 // 不会保留保留原有的A1，A1A2,AA 的形式
  updateByRefIDAndNewStr(refIDArray, newStr) {
    this.cellStatus = FORMULA_STATUS.created;  // 之后需要重新解析公式
    let refUnitArray = this.getRefSyntaxUnitByRefIDArray(refIDArray);
    refUnitArray.forEach(refUnit =>
      refUnit.wholeStr = newStr);
    return this.refreshFormulaString();
  }

  updateFormulaStringByShiftArray(shiftArray, inplace = false){
    if(this.isStructuralFormula()){
      let res = this.rootSyntaxUnit.updateSynUnitByShiftArray(shiftArray, inplace)
      return inplace? this.refreshFormulaString(): "=" + res
    }
    else {
      return this.formulaString
    }
  }
  updateFormulaAndCellNameByShiftArray(shiftArray){
    this.updateFormulaStringByShiftArray(shiftArray, true)
    this.updateCelNameByShiftArray(shiftArray)
  }


  refreshFormulaString() {
    let prefix = this.isStructuralFormula() ? '=' : '';
    this.formulaString = prefix + this.rootSyntaxUnit.getWholeString();
    return this.formulaString;
  }

  getFormulaStringByRefactor(aRefactorBhv) {
    let allUnitArray = this.rootSyntaxUnit.getAllBaseSyntaxUnit();
    let theFunc = new BaseRefactorProxy(aRefactorBhv).getTheFunc();
    allUnitArray.map(theFunc);
    return this.rootSyntaxUnit.getWholeString();
  }

  /**
   *  更新所有的refUnit中oldName!A1 -> newName!A1
   * @param oldSheetName
   * @param newSheetName
   * @param changedCellArray
   */
  updateSynUnitByRenameSheet(oldSheetName, newSheetName, changedCellArray) {
    let isChange = false;
    let refUnitArray = this.getRefSyntaxUnitArray(); // 获取所有的引用类型的语法单元
    refUnitArray.forEach(
      refUnit => {
        isChange = refUnit.updateByRenameSheet(oldSheetName, newSheetName) ? true : isChange;
      }
    );
    if (isChange) {
      this.refreshFormulaString(); // 更新公式字符串
      changedCellArray.push(this);
    }

  }
}

const NOT_PROCESS_OBJ = {msg: "不处理"}
// 代表编辑中的calcCell,不会对workbook进行修改
export class EditingCalcCell extends CalcCell{
  // ==== 与workbook关联关系的处理 ============
  wkCreateCellID(){
    return -1
  }

  wkUpdateMultiRelation() {
    return NOT_PROCESS_OBJ
  }

  wkDeleteAllDependentRelation() { // 清空所有的依赖关系
    return NOT_PROCESS_OBJ
  }

  wkRemoveSelf(){
    return NOT_PROCESS_OBJ
  }
}
