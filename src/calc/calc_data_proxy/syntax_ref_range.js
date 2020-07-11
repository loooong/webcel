import { AA, COL_NAME, REF_TYPE, SHEET_NAME, SYN_SPLIT_MARK } from '../calc_utils/config';
import { BaseSyntaxUnitProxy, SyntaxStructureBuilder } from '../../internal_module/syntax_builder_core';
import { CellColNameParser } from './syntax_number_parser';
import { SingleCellRefer } from './syntax_ref_cell';
import { ERROR_REF } from '../calc_utils/error_config';

/**
 * @property {CellColNameParser} firstRef
 * @property {CellColNameParser} secondRef
 * @property {BaseSyntaxUnitProxy} sheetNameSyntaxUnit
 */
export class AARangeRefer { // 不支持Excel的average(1:4)这样的语法。
  constructor(aStr, typeArray) {
    this.aStr = aStr;  //  A:B, sheet1!A:B
    this.typeArray = typeArray;
    this.sheetNameSyntaxUnit = { wholeStr: '' }; // 对应一个语法单元
    this.syntaxUnitBuilder = new SyntaxStructureBuilder(BaseSyntaxUnitProxy);
    this.firstRef = null; // 对应与A
    this.secondRef = null; // 对应与B
  }

  getLocStr(isAddRefType = true) {
    let locInSheet = [this.firstRef.getNumber(), this.secondRef.getNumber()].join('_');
    return isAddRefType ? AA + '_' + locInSheet : locInSheet;
  }

  getSheetName() {
    return this.sheetNameSyntaxUnit.wholeStr;
  }

// 解析时会交换位置
  parseRefString() {
    let splitArray = this.aStr.split('!');
    let col_name_array;
    if (splitArray.length > 1) {
      this.sheetNameSyntaxUnit = this.syntaxUnitBuilder.addStringToCurUnit(splitArray[0], [SHEET_NAME]);
      this.syntaxUnitBuilder.addStringToCurUnit('!', [SYN_SPLIT_MARK]);
      col_name_array = splitArray[1].split(':');
    } else {
      col_name_array = this.aStr.split(':');
    }
    let cellColNameProxyArray = col_name_array.map(colStr => CellColNameParser.fromStrMayWith$(colStr));
    if (cellColNameProxyArray[0].getNumber() > cellColNameProxyArray[1].getNumber()) { // B:A -> A:B
      cellColNameProxyArray.reverse();
    }
    this.firstRef = cellColNameProxyArray[0];
    this.secondRef = cellColNameProxyArray[1];
    this.dealColRefStr(cellColNameProxyArray[0]);
    this.syntaxUnitBuilder.addStringToCurUnit(':', [SYN_SPLIT_MARK]);
    this.dealColRefStr(cellColNameProxyArray[1]);
  }

  /**
   *
   * @param {CellColNameParser}cellColNameProxy
   */

  dealColRefStr(cellColNameProxy) {
    if (cellColNameProxy.isAbsoluteRef === true) {
      this.syntaxUnitBuilder.addStringToCurUnit('$');
    }
    this.syntaxUnitBuilder.addParserToCurUnit(cellColNameProxy, cellColNameProxy.aName, [COL_NAME]);
  }

  // ======== 重构逻辑 =========

  updateStrByTwoFunc(funcForFirstRef, funcForSecondRef, inplace = false) {
    let res = this.syntaxUnitBuilder.rootUnit.childrenSynUnit.map(synUnit => {
        if (synUnit.pstID === this.firstRef.syntaxUnit.pstID) {
          return funcForFirstRef(this.firstRef);
        } else if (synUnit.pstID === this.secondRef.syntaxUnit.pstID) {
          return funcForSecondRef(this.secondRef);
        } else {
          return synUnit.wholeStr;
        }
      }
    )
      .join('');
    this.aStr = inplace ? res : this.aStr;
    return res;
  }

  updateStrByNewLoc(newColArray, inplace = false) { // newCol应该是2元素
    newColArray.sort((a,b) => a-b); // 按照从小到大排序
    if(newColArray[0] < 0){
      this.aStr = inplace ? ERROR_REF : this.aStr;
      return ERROR_REF
    }
    return this.updateStrByTwoFunc(
      firstRef => firstRef.getNameByNumber(newColArray[0], inplace),
      secondRef => secondRef.getNameByNumber(newColArray[1], inplace), inplace
    );
  }
  updateStrByRangeIndexArray(indexArray, inplace = true) {
    return this.updateStrByNewLoc([indexArray[1], indexArray[3]], inplace);
  }


  updateStrByShiftArray(shiftArray, inplace = false) {
    let newColArray = [this.firstRef.updateNumberByShift(shiftArray[1], false),
      this.secondRef.updateNumberByShift(shiftArray[1], false)];

    return this.updateStrByNewLoc(newColArray, inplace);
  }


  dealInplace(inplace) {
    let res = this.syntaxUnitBuilder.rootUnit.getWholeString();
    this.aStr = inplace ? res : this.aStr;
    return res;
  }

  updateStrByRenameSheet(oldSheetName, newSheetName) {
    if (this.sheetNameSyntaxUnit.wholeStr === oldSheetName) {
      this.sheetNameSyntaxUnit.wholeStr = newSheetName;
      return this.dealInplace(true);
    }
    return ''; // 没有发生变更
  }

}

/**
 * @property
 */
export class RangeRefer {
  constructor(aStr, typeArray) {
    this.aStr = aStr;
    this.typeArray = typeArray; // A1:A2,  sheet1!A1:A2

    this.firstColNameParser = null;
    this.secondColNameParser = null;
    this.firstRowNameParser = null;
    this.secondRowNameParser = null;
    this.sheetName = '';
  }

  getSheetName() {
    return this.sheetName;
  }

  /** 解析时会自动交换位置，
   * B5:A1 -> A1:B5; B1:A5=> A1:B5
   */
  parseRefString() {
    let beginIndex = this.aStr.indexOf('!');
    if (beginIndex !== -1) {
      this.sheetName = this.aStr.slice(0, beginIndex);
    }
    let aArray = this.aStr.slice(beginIndex + 1)
      .split(':');
    let firstRef = new SingleCellRefer(aArray[0]);
    let secondRef = new SingleCellRefer(aArray[1]);
    firstRef.parseRefString();
    secondRef.parseRefString();
    if (firstRef.cellRowNameParser.getNumber() > secondRef.cellRowNameParser.getNumber()) {
      [this.firstRowNameParser, this.secondRowNameParser] = [secondRef.cellRowNameParser, firstRef.cellRowNameParser];

    } else {
      [this.firstRowNameParser, this.secondRowNameParser] = [firstRef.cellRowNameParser, secondRef.cellRowNameParser];

    }
    if (firstRef.cellColNameParser.getNumber() > secondRef.cellColNameParser.getNumber()) { // 交换位置
      [this.firstColNameParser, this.secondColNameParser] = [secondRef.cellColNameParser, firstRef.cellColNameParser];
    } else {
      [this.firstColNameParser, this.secondColNameParser] = [firstRef.cellColNameParser, secondRef.cellColNameParser];
    }
  }


  getRefWholeString() {
    let newCol = [this.firstColNameParser.aNumber, this.secondColNameParser.aNumber]
    let newRow = [this.firstRowNameParser.aNumber, this.secondRowNameParser.aNumber]
    return this.updateStrByNewLoc(newCol, newRow, false)
  }

  getLocStr(isAddRefType = true) { // 0_1_2_1 这样形式的字符串
    let sortedRowArray =  [this.firstRowNameParser.aNumber,this.secondRowNameParser.aNumber].sort()
    let sortedColArray =  [this.firstColNameParser.aNumber,this.secondColNameParser.aNumber].sort()
    let locInSheet = [sortedRowArray[0], sortedColArray[0], sortedRowArray[1], sortedColArray[1]].join("_")
    return isAddRefType ? REF_TYPE.A1A2 + '_' + locInSheet : locInSheet;
  }

  dealInplace(inplace) {
    let res = this.getRefWholeString();
    this.aStr = inplace ? res : this.aStr;
    return res;
  }

  // ========= 重构逻辑=========

// newCol, newRow应该是2元素数组(较小的与较大的)，代表四个边角的单元格
  updateStrByNewLoc(newCol, newRow, inplace = false) {
    if (Math.min(...newCol, ...newRow) < 0){
      this.aStr = inplace ? ERROR_REF : this.aStr;
      return ERROR_REF
    }
    let minColStrWith$,maxColStrWith$,minRowStrWith$,maxRowStrWith$
    let oriColStrArray = [this.firstColNameParser.getNameWithAbsoluteRefByNumber(newCol[0], inplace),
      this.secondColNameParser.getNameWithAbsoluteRefByNumber(newCol[1], inplace)]
    let oriRowStrArray = [this.firstRowNameParser.getNameWithAbsoluteRefByNumber(newRow[0], inplace),
      this.secondRowNameParser.getNameWithAbsoluteRefByNumber(newRow[1], inplace)]
    if(newCol[0] < newCol[1]){
      [minColStrWith$, maxColStrWith$] = oriColStrArray
    }
    else{
      [minColStrWith$, maxColStrWith$] = oriColStrArray.reverse()
    }
    if(newRow[0] < newRow[1]){
      [minRowStrWith$, maxRowStrWith$] = oriRowStrArray
    }
    else{
      [minRowStrWith$, maxRowStrWith$] = oriRowStrArray.reverse()
    }
    let part2Str = minColStrWith$ +minRowStrWith$ + ':' + maxColStrWith$ + maxRowStrWith$
    return this.sheetName === '' ? part2Str : this.sheetName + '!' + part2Str;
  }
  updateStrByRangeIndexArray(indexArray, inplace = true) {
    return this.updateStrByNewLoc([indexArray[1], indexArray[3]],
      [indexArray[0], indexArray[2]], inplace);
  }


  updateStrByShiftArray(shiftArray, inplace = false) {
    let newCol = [this.firstColNameParser, this.secondColNameParser].map(parser =>
      parser.updateNumberByShift(shiftArray[1], false));
    let newRow = [this.firstRowNameParser, this.secondRowNameParser].map(parser =>
      parser.updateNumberByShift(shiftArray[0], false));
    return this.updateStrByNewLoc(newCol, newRow, inplace);
  }


  updateStrByRenameSheet(oldSheetName, newSheetName) {
    if (this.sheetName === oldSheetName) {
      this.sheetName = newSheetName;
      return this.getRefWholeString();
    }
    return ''; // 没有发生变更
  }
}
