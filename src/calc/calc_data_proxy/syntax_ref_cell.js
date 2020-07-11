import {
  A1,
  ABSOLUTE_MARK,
  COL_NAME,
  ROW_NAME,
  SHEET_NAME,
  SYN_SPLIT_MARK
} from '../calc_utils/config';
import { BaseSyntaxUnitProxy, SyntaxStructureBuilder } from '../../internal_module/syntax_builder_core';
import { CellColNameParser, CellRowNameParser } from './syntax_number_parser';
import { ERROR_REF } from '../calc_utils/error_config';

export class SingleCellRefer { // 对应一个对单元格的引用，考虑绝对引用与相对应用; 用状态模式
  constructor(aStr, typeArray) {
    this.aStr = aStr;
    this.typeArray = typeArray; // A1 or sheet1!A1
    this.syntaxUnitBuilder = new SyntaxStructureBuilder(BaseSyntaxUnitProxy);
    this.buff = '';
    this.char = '';
    this.state = this.normalState;
    this.isAbosulte = false;
    this.cellRowNameParser = null;
    this.cellColNameParser = null;
    // 对应一个语法单元;空字符代表只想的sheet是本sheet，不为空字符代表指向具体的一个sheetName
    this.sheetNameSyntaxUnit = {wholeStr:""}
  }
  isLeftTopToOther(other){
    return this.cellRowNameParser.getNumber() < other.cellRowNameParser.getNumber() && this.cellColNameParser.getNumber() < other.cellColNameParser.getNumber()
  }
  getSheetName(){
    return this.sheetNameSyntaxUnit.wholeStr
  }

  getRootUnit() {
    return this.syntaxUnitBuilder.rootUnit;
  }
  isBuffEmptyAfterTrim(){
    return this.buff.trim() === ""
  }

  getRowID(){
    return this.cellRowNameParser.getNumber()
  }

  getColID(){
    return this.cellColNameParser.getNumber()
  }

  getLocStr(isAddRefType = true){
    let locInSheet = [this.getRowID(), this.getColID()].join("_")
    return isAddRefType? A1 + "_" + locInSheet:locInSheet
  }

  normalState(char) {
    if (char === '$') {
      if (this.isBuffEmptyAfterTrim()===false) {
        this.addColNameProxy();
      }
      this.isAbosulte = true;
      this.syntaxUnitBuilder.addStringToCurUnit(char, [ABSOLUTE_MARK]);
    } else if (/[0-9]/.test(char)) {
      if (this.isBuffEmptyAfterTrim()===false) {
        this.addColNameProxy();
      }
      this.state = this.insideRowName;
      this.buff += char;
    } else {
      this.buff += char;
    }
  }

  insideRowName(char) {
    this.buff += char;
  }

  addRowNameProxy() {
    this.cellRowNameParser = new CellRowNameParser(this.buff, this.isAbosulte);
    this.syntaxUnitBuilder.addParserToCurUnit(this.cellRowNameParser, this.buff, [ROW_NAME]);
    this.buff = ""
  }

  addColNameProxy() {
    this.cellColNameParser = new CellColNameParser(this.buff, this.isAbosulte);
    this.syntaxUnitBuilder.addParserToCurUnit(this.cellColNameParser, this.buff, [COL_NAME]);
    this.buff = ""
    this.isAbosulte = false
  }

  parseRefString() {
    let beginIndex = this.aStr.indexOf("!") // 感叹号的位置
    if(beginIndex !== -1){ // 如果含有感叹号
      this.sheetNameSyntaxUnit = this.syntaxUnitBuilder.addStringToCurUnit(this.aStr.slice(0,beginIndex), [SHEET_NAME]);
      this.syntaxUnitBuilder.addStringToCurUnit(this.aStr[beginIndex], [SYN_SPLIT_MARK]);
    }
    for (let i = beginIndex+1; i < this.aStr.length; i++) {
      this.state(this.aStr[i]);
    }
    this.addRowNameProxy();
  }

  // ==== 重构逻辑 ====
  dealInplace(inplace) {
    let res = this.syntaxUnitBuilder.rootUnit.getWholeString();
    this.aStr = inplace ? res : this.aStr;
    return res;
  }

  updateStrByTwoFunc(funcForColName, funcForRowName, inplace = false){
    let res = this.syntaxUnitBuilder.rootUnit.childrenSynUnit.map(synUnit =>
      {
        if(synUnit.pstID === this.cellColNameParser.syntaxUnit.pstID){
          return funcForColName(this.cellColNameParser)
        }
        else if(synUnit.pstID === this.cellRowNameParser.syntaxUnit.pstID){
          return funcForRowName(this.cellRowNameParser)
        }
        else {
          return synUnit.wholeStr
        }
      }
    ).join("")
    this.aStr = inplace ? res : this.aStr;
    return res;
  }

  /**
   * 这个写法才能够真正的支持inplace = false
   * @param newCol
   * @param newRow
   * @param inplace 是否替换原值
   */
  updateStrByNewLoc(newCol, newRow, inplace = false) { // 用户剪切，插入或删除单元格会变化引用的单元格位置变化
    if(newCol < 0 || newRow <0){
      this.aStr = inplace ? ERROR_REF : this.aStr;
      return ERROR_REF
    }
    return this.updateStrByTwoFunc(
      colNameParser => colNameParser.getNameByNumber(newCol, inplace),
      rowNameParser => rowNameParser.getNameByNumber(newRow, inplace),inplace
    );
  }

  updateStrByRangeIndexArray(indexArray, inplace = true){
    return this.updateStrByNewLoc(indexArray[1], indexArray[0], inplace)
  }

  updateStrByShiftArray(shiftArray, inplace = false){
    return this.updateStrByNewLoc(
      this.cellColNameParser.updateNumberByShift(shiftArray[1], inplace),
      this.cellRowNameParser.updateNumberByShift(shiftArray[0], inplace),inplace
    );
  }

  updateStrByRenameSheet(oldSheetName, newSheetName){
    if(this.sheetNameSyntaxUnit.wholeStr === oldSheetName){
      this.sheetNameSyntaxUnit.wholeStr = newSheetName
      return this.dealInplace(true)
    }
    return "" // 没有发生变更
  }
}


