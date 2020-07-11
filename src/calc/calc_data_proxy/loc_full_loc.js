import { isBetween } from '../calc_utils/helper';
import { RangeLocProxy } from './loc_range_loc';
import { A1, A1A2, AA } from '../calc_utils/config';

export class RefLocStrProxy {
  constructor(refLocStr) { // 1!A1_0_2, 2!A1A2_0_2_3_4, 3!AA_1_2
    this.refLocStr = refLocStr;
    this.refType = '';
    this.refSheetID = -1;
    this.indexArray = [];
    this.parseStr();
  }


  static fromRefTypeAndRangeIndexArray(sheetID, refType, rangeIndexArray):RefLocStrProxy{
    let refString
    if (refType === A1) {
      refString =  sheetID + '!' + [refType, rangeIndexArray[0], rangeIndexArray[1]].join('_');
    } else if (refType === A1A2) {
      refString =  sheetID + '!' + [refType].concat(rangeIndexArray).join('_');
    } else {
      refString =  sheetID + '!' + [refType, rangeIndexArray[1], rangeIndexArray[2]].join('_');
    }
    return  new RefLocStrProxy(refString)
  }


  parseStr() {
    let arr1 = this.refLocStr.split('!');
    this.refSheetID = parseInt(arr1[0]);
    let arr2 = arr1[1].split('_');
    this.refType = arr2[0];
    this.indexArray = arr2.splice(1)
      .map(f => parseInt(f)); // 参数列表

  }

  getLocStrInSheet() {
    return this.indexArray.join('_');
  }

  isRightToACol(colIndex, sheetID) { // 是否在某一列的右边
    if (this.refSheetID === sheetID) {
      return this.refType === AA ? this.indexArray[0] >= colIndex : this.indexArray[1] >= colIndex;
    }
    return false;
  }

  isRightSplitByABound() {

  }

  isRightToABound(colIndex, minRowIndex, maxRowIndex, sheetID) {// 是否在某个边界的右边
    if (this.refSheetID === sheetID) {
      if (this.refType === A1) {
        return this.indexArray[1] > colIndex && this.indexArray[0] >= minRowIndex
          && this.indexArray[0] <= maxRowIndex;
      } else if (this.refType === A1A2) {
        return this.indexArray[1] > colIndex && this.indexArray[0] >= minRowIndex
          && this.indexArray[2] <= maxRowIndex;
      }
    }
    return false;
  }

  isDownToABound(rowIndex, minColIndex, maxColIndex, sheetID) {// 是否在某个边界的下方
    if (this.refSheetID === sheetID) {
      if (this.refType === A1) {
        return this.indexArray[0] > rowIndex && this.indexArray[1] >= minColIndex
          && this.indexArray[1] <= maxColIndex;
      } else if (this.refType === A1A2) {
        return this.indexArray[0] > rowIndex && this.indexArray[1] >= minColIndex
          && this.indexArray[3] <= maxColIndex;
      }
    }
    return false;
  }


  isDownToARow(rowIndex, sheetID) { // 是否在某一行的下边
    if (this.refSheetID === sheetID) {
      return this.refType === AA ? false : this.indexArray[0] >= rowIndex;
    }
    return false;
  }

  toA1A2Str() { // 2!A1_0_2 --> 2!A1A2_0_2_0_2

  }

  isInteractWithRange(rangeLocArray, sheetID) { // 与某个range是否有交叉
    let [minRowID, minColID, maxRowID, maxColID] = rangeLocArray;
    if (this.refSheetID === sheetID) {
      if (this.refType === A1) {
        return isBetween(this.indexArray[0], minRowID, maxRowID) &&
          isBetween(this.indexArray[1], minColID, maxColID);
      } else if (this.refType === A1A2) { // 在范围内
        return (isBetween(this.indexArray[0], minRowID, maxRowID) &&
          isBetween(this.indexArray[1], minColID, maxColID)) ||
          (isBetween(minRowID, this.indexArray[0], this.indexArray[2]) &&
            isBetween(minColID, this.indexArray[1], this.indexArray[3]));
      } else if (this.refType === AA) { // 在列范围内
        return (minColID <= this.indexArray[1] && maxColID >= this.indexArray[0]);
      }
    }
    return false;
  }

  /**
   *
   * @param workbookEditor
   * @return {*[]|Array} 如果是AA类型的引用的话，会利用maxEditableRow来做转化
   */
  getRangeLocArray(workbookEditor) {
    if (this.refType === A1) {
      return this.indexArray.concat(this.indexArray);
    } else if (this.refType === A1A2) {
      return this.indexArray;
    } else {
      let theSheet = workbookEditor.multiSheet.getSheetByID(this.refSheetID);
      if (typeof theSheet === 'undefined') {
        throw new Error('type of AA!!'); // A类型无法转化为RangeLocArray的形式
      }
      return [0, this.indexArray[0], theSheet.maxEditableRow, this.indexArray[1]];
    }
  }

  getRangeLocStr(workbookEditor) {
    let rangeLocArray = this.getRangeLocArray(workbookEditor);
    return rangeLocArray.join('_');
  }

  getFullLocStrByRangIndexArray(rangeIndexArray) {
    let newInstance = RefLocStrProxy.fromRefTypeAndRangeIndexArray(this.refSheetID, this.refType, rangeIndexArray)
    return this.refLocStr = newInstance.refLocStr
  }

  /**
   *
   * @param workbookEditor
   * @param {RangeLocProxy} shiftRangeProxy
   * @param shiftNumber
   * @param rightOrDownOrBothOrNon
   */
  getNewFullLocByShift(workbookEditor, shiftRangeProxy, shiftNumber, rightOrDownOrBothOrNon = 0) {
    let selfRangeLocArray = this.getRangeLocArray(workbookEditor);
    let selfRangeLocProxy = new RangeLocProxy(selfRangeLocArray.join('_'));
    let res =shiftRangeProxy.getNewIndexArrayByShift(selfRangeLocProxy, shiftNumber, rightOrDownOrBothOrNon)
    res.fullLocStr = this.getFullLocStrByRangIndexArray(res.indexArray);
    return res;
  }



}
