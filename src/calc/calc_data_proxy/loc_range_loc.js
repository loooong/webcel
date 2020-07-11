import { isBetween } from '../calc_utils/helper';
import { xy2expr } from '../../global_utils/alphabet';

// 判定两个array是否相同, array的元素也可以是array
export function isArrayEqual(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] instanceof Array && array2[i] instanceof Array) {
      if(isArrayEqual(array1[i], array2[i]) === false){
        return false // 递归
      }
    } else if (array1[i] !== array2[i]) {
      return false;
    }
  }
  return true;
}

export class RangeLocProxy {
  /**
   * @param rangeLocStr 0_1_2_2这样形式的字符串
   */
  constructor(rangeLocStr:string) {
    this.rangeLocStr = rangeLocStr;
    this.indexArray = this.getIndexArray();
    if (this.indexArray.length !== 4) {
      return new Error('rangeLocStr is not valid', rangeLocStr);
    }
  }
  static fromIndexArray(indexArray){
    return new RangeLocProxy(indexArray.join("_"))
  }

  // ======= 判定或获取数值 ===========
  getLeftTopCellLoc() {
    return this.indexArray[0] + '_' + this.indexArray[1];
  }

  getIndexArray() {
    return this.rangeLocStr.split('_')
      .map(aStr => parseInt(aStr));
  }

  isSingleCell() {
    return (this.indexArray[0] === this.indexArray[2]) && (this.indexArray[1] === this.indexArray[3]);
  }

  // 转化为A1:A2这样的形式
  getA1A2Str() {
    return xy2expr(this.indexArray[1], this.indexArray[0]) + ':' +
      xy2expr(this.indexArray[3], this.indexArray[2]);
  }

  /**
   * 获取从自己这个range到达右边界的rangeLoc
   * @param maxColNum
   * @param isIncludeSelf， 新获取的Range是否保存本Range
   */
  getRangeLocToRight(maxColNum, isIncludeSelf = true) {
    let minRow = this.indexArray[0];
    let maxRow = this.indexArray[2];
    let minCol = isIncludeSelf ? this.indexArray[1] : this.indexArray[3] + 1;
    return [minRow, minCol, maxRow, maxColNum].join('_');
  }

  getRangeProxyToBottomOrRight(theCalcSheet, isIncludeSelf = true, right2Down = 0){
    let rangeLoc = right2Down === 1? this.getRangeLocToBottom(theCalcSheet.maxEditableRow, isIncludeSelf):
      this.getRangeLocToRight(theCalcSheet.maxEditableCol, isIncludeSelf)
    return new RangeLocProxy(rangeLoc)
  }

  /**
   * 获取从自己这个range到达下边界的rangeLoc
   * @param maxRowNum
   * @param isIncludeSelf， 新获取的Range是否保存本Range
   */
  getRangeLocToBottom(maxRowNum, isIncludeSelf = true) {
    let minCol = this.indexArray[1];
    let maxCol = this.indexArray[3];
    let minRow = isIncludeSelf ? this.indexArray[0] : this.indexArray[2] + 1;
    return [minRow, minCol, maxRowNum, maxCol].join('_');
  }

  getRowNumber() {
    return this.indexArray[2] - this.indexArray[0] + 1;
  }

  getColNumber() {
    return this.indexArray[3] - this.indexArray[1] + 1;
  }

  // ========= 更新数值 ==========
  updateByMoveRight(rightNumber) {
    this.indexArray[1] += rightNumber;
    this.indexArray[3] += rightNumber;
    this.rangeLocStr = this.indexArray.join('_');
    return this.rangeLocStr;
  }

  updateByMoveDown(downNumber) {
    this.indexArray[0] += downNumber;
    this.indexArray[2] += downNumber;
    this.rangeLocStr = this.indexArray.join('_');
    return this.rangeLocStr;
  }

  updateByShiftArray(shiftArray, inplace = true) {
    let newIndexArray = this.indexArray.concat();
    newIndexArray[1] += shiftArray[1];
    newIndexArray[3] += shiftArray[1];
    newIndexArray[0] += shiftArray[0];
    newIndexArray[2] += shiftArray[0];
    let newRangeLocStr = newIndexArray.join('_');
    if (inplace) {
      this.indexArray = newIndexArray;
      this.rangeLocStr = newRangeLocStr;
    }
    return newRangeLocStr;
  }

  // ==== 与其他range的关系判定 ====
  // 获取与其他range的交集的时候，得到新的indexArray，不存在交集的时候返回[]
  getInteract(other) {
    let otherIndexArray = other.indexArray;
    let newMinRow = Math.max(this.indexArray[0], otherIndexArray[0]);
    let newMinCol = Math.max(this.indexArray[1], otherIndexArray[1]);
    let newMaxRow = Math.min(this.indexArray[2], otherIndexArray[2]);
    let newMaxCol = Math.min(this.indexArray[3], otherIndexArray[3]);
    if (newMinRow <= newMaxRow && newMinCol <= newMaxCol) {
      return [newMinRow, newMinCol, newMaxRow, newMaxCol];
    } else {
      return [];
    }
  }

  getCornerArrayInRange(indexArray) { // 有哪些顶点在indexArray范围内
    // 四个顶点的顺序如下:
    //   0    1
    //   2    3
    let cornerInRangeArray = [];
    for (let rowIndex of [this.indexArray[0], this.indexArray[2]]) {
      for (let colIndex of [this.indexArray[1], this.indexArray[3]]) {
        if (this.isPointInRange(rowIndex, colIndex, indexArray)) {
          cornerInRangeArray.push([rowIndex, colIndex]);
        }
      }
    }
    return cornerInRangeArray;
  }

  // 两个范围的关系，没有交集 or 有交集不包含 or 包含
  isNonOrCrossOrInclude(other) {
    let interact = this.getInteract(other);
    if (interact.length > 0) {
      let newRangeLoc = interact.join('_');
      return (newRangeLoc !== other.rangeLocStr) && (newRangeLoc !== this.rangeLocStr) ? 1 : 2;
    }
    return 0;
  }

  // this 包含other 或 有部分交集 或 没有交集
  isContainOrOverlapOrNon(other) {
    let interact = this.getInteract(other);
    if (interact.length > 0) {
      let interactRangeLoc = interact.join('_');
      return (interactRangeLoc === other.rangeLocStr) ? 0 : 1;
    }
    return 2;
  }

  getACornerPoint(cornerIndex = 0) {
    // 四个顶点的顺序如下:
    //   0    1
    //   2    3
    if (cornerIndex === 0) {
      return [this.indexArray[0], this.indexArray[1]];
    } else if (cornerIndex === 1) {
      return [this.indexArray[0], this.indexArray[3]];
    } else if (cornerIndex === 2) {
      return [this.indexArray[2], this.indexArray[1]];
    } else {
      return [this.indexArray[2], this.indexArray[3]];
    }
  }

  getCornerArrayInMargin(upOrDownOrLeftOrRight = 0) {
    let cornerIndexArray = [];
    // 向上移动判定corner 0,1
    if (upOrDownOrLeftOrRight === 0) {
      cornerIndexArray = [0, 1];
    }
    // 向下移动判定corner 2,3
    else if (upOrDownOrLeftOrRight === 1) {
      cornerIndexArray = [2, 3];
    }
    // 向左移动判定corner 0,2
    else if (upOrDownOrLeftOrRight === 2) {
      cornerIndexArray = [0, 2];
    }
    // 向右移动判定corner 1,3
    else if (upOrDownOrLeftOrRight === 3) {
      cornerIndexArray = [1, 3];
    }
    let cornerArrayInMargin = cornerIndexArray.map(index => this.getACornerPoint(index));
    return cornerArrayInMargin;
  }

  /**
   * 判定情况是不是要去更新formula的情况，
   * @param cornerArrayInOtherRange
   * @param upOrDownOrLeftOrRight
   */
  isSpecialContain(cornerArrayInOtherRange, upOrDownOrLeftOrRight = 0) {
    if (cornerArrayInOtherRange.length !== 2) {
      return false;
    }
    let cornerArray = this.getCornerArrayInMargin(upOrDownOrLeftOrRight);
    return isArrayEqual(cornerArrayInOtherRange, cornerArray);
  }

  // 是否包含了所有的行(0),包含了other(1),还是仅交叉不contain (2),还是说没有任何交集 (3)
  /**
   *
   * @param refRangeProxy 被引用的区域
   * @param isShiftToRight 向右移动还是向左移动
   * @return {number}
   */
  isRowContainOrContainOrOverlapOrNon(refRangeProxy, isShiftToRight = true) { // 要判定shiftNumber的正负号
    let cornerArrayInShiftRange = refRangeProxy.getCornerArrayInRange(this.indexArray);
    if (cornerArrayInShiftRange.length === 0) {
      return 3;
    }
    if (cornerArrayInShiftRange.length === 4) {
      return 1;
    }
    let upOrDownOrLeftOrRight = isShiftToRight ? 3 : 2;
    if (refRangeProxy.isSpecialContain(cornerArrayInShiftRange, upOrDownOrLeftOrRight)) {
      return 0;
    }
    return 2;
  }

  // 是否包含了所有的列(0),包含了other(1),还是仅交叉不contain (2),还是说没有任何交集
  /**
   *
   * @param refRangeProxy
   * @param isShiftDown 向下移动还是向上移动
   * @return {number}
   */
  isColContainOrContainOrOverlapOrNon(refRangeProxy, isShiftDown = true) {
    let cornerArrayInShiftRange = refRangeProxy.getCornerArrayInRange(this.indexArray);
    if (cornerArrayInShiftRange.length === 0) {
      return 3;
    }
    if (cornerArrayInShiftRange.length === 4) {
      return 1;
    }
    let upOrDownOrLeftOrRight = isShiftDown ? 1 : 0;
    if (refRangeProxy.isSpecialContain(cornerArrayInShiftRange, upOrDownOrLeftOrRight)) {
      return 0;
    }
    return 2;
  }

  getNewIndexArrayByShift(other, shiftNumber, rightOrDownOrBothOrNon) {
    let res = {};
    if (rightOrDownOrBothOrNon === 0) {
      return this.getNewIndexArrayByShiftRight(other, shiftNumber);
    } else if (rightOrDownOrBothOrNon === 1) {
      return this.getNewIndexArrayByShiftDown(other, shiftNumber);
    } else if (rightOrDownOrBothOrNon === 2) {
      return this.getNewIndexArrayByShiftBoth(other, shiftNumber);
    }
  }

  getNewIndexArrayByShiftBoth(other, shiftNumber) { // 两个方向同时移动，shiftNumber是一个Array
    let containOrOverlapOrNon = this.isContainOrOverlapOrNon(other);
    let newIndexArray = other.indexArray.concat();
    if (containOrOverlapOrNon === 0) {
      newIndexArray[0] += shiftNumber[0];// minRow会增加
      newIndexArray[1] += shiftNumber[1];// maxRow会增加
      newIndexArray[2] += shiftNumber[0];// minCol会增加
      newIndexArray[3] += shiftNumber[1];// maxCol会增加
    }
    return {
      indexArray: newIndexArray,
      containOrOverlapOrNon: containOrOverlapOrNon
    };
  }

  getNewIndexArrayByShiftRight(other, shiftNumber) {
    let rowContainOrContainOrOverlapOrNon = this.isRowContainOrContainOrOverlapOrNon(other, shiftNumber > 0);
    let newIndexArray = other.indexArray.concat();
    if (rowContainOrContainOrOverlapOrNon === 0) {
      if (shiftNumber > 0) {
        newIndexArray[3] += shiftNumber;// maxCol会增加
      } else {
        newIndexArray[1] += shiftNumber;// minCol会减少
      }
    } else if (rowContainOrContainOrOverlapOrNon === 1) { // contain
      newIndexArray[1] += shiftNumber;// minCol会增加
      newIndexArray[3] += shiftNumber;// maxCol会增加
    }
    return {
      indexArray: newIndexArray,
      rowContainOrContainOrOverlapOrNon: rowContainOrContainOrOverlapOrNon
    };
  }

  getNewIndexArrayByShiftDown(other, shiftNumber) {
    let colContainOrContainOrOverlapOrNon = this.isColContainOrContainOrOverlapOrNon(other, shiftNumber > 0);
    let newIndexArray = other.indexArray.concat();
    if (colContainOrContainOrOverlapOrNon === 0) {
      if (shiftNumber > 0) {
        newIndexArray[2] += shiftNumber;// maxRow会增加
      } else {
        newIndexArray[0] += shiftNumber;// minRow会减小
      }

    } else if (colContainOrContainOrOverlapOrNon === 1) { // contain
      newIndexArray[0] += shiftNumber;// minRow会增加
      newIndexArray[2] += shiftNumber;// maxRow会增加
    }
    return {
      indexArray: newIndexArray,
      colContainOrContainOrOverlapOrNon: colContainOrContainOrOverlapOrNon
    };
  }

  isPointInRange(rowIndex, colIndex, indexArray) {
    return isBetween(rowIndex, indexArray[0], indexArray[2]) && isBetween(colIndex, indexArray[1], indexArray[3]);
  }


  /**
   * 判定curFullLocProxy与toDelRangeProxy的关系。情况类型的编号是从复杂到困难。
   * 如果curFullLocProxy与toDelRangeProxy的差集为矩形，locStr = 差集对应的fullLoc，且需要加入beginSet  0
   * 如果toDelRangeProxy包含curFullLocProxy，locStr = #REF!，且需要加入beginSet 1
   * 如果curFullLocProxy与toDelRangeProxy不符合上述情况，有交集 locStr 不变，且需要加入beginSet  2
   * 如果curFullLocProxy与toDelRangeProxy没有交集，locStr不变 3
   * @param {RangeLocProxy} toBeReduceRange
   */
  getNewIndexArrayByRemove(toBeReduceRange) {
    let rectDiffOrContainOrOverlapOrNon,
      newLocStr = '';
    let newIndexArray = toBeReduceRange.indexArray.concat();
    let interact = this.getInteract(toBeReduceRange)
    if(interact.length === 0){ // 没有交叉
      return {
        rectDiffOrContainOrOverlapOrNon: 3,
        indexArray: newIndexArray,
        locStr: newLocStr,
      };
    }

    let cornerInRangeArray = toBeReduceRange.getCornerArrayInRange(this.indexArray); // 顶点在范围中得到数量
    if(cornerInRangeArray.length === 0){
      rectDiffOrContainOrOverlapOrNon = 2 // overlap
    }
    else if (cornerInRangeArray.length === 4) {
      rectDiffOrContainOrOverlapOrNon = 1; // 包含,此时会删除fullLocStr并且有REF错误
    } else if (cornerInRangeArray.length === 2) {
      rectDiffOrContainOrOverlapOrNon = 0;  // 特殊包含： 包含4个角中的两个
      newIndexArray = this.getNewIndexArrayIfMarginContain(cornerInRangeArray, toBeReduceRange);
      newLocStr = newIndexArray.join('_');
    }

    return {
      rectDiffOrContainOrOverlapOrNon: rectDiffOrContainOrOverlapOrNon,
      indexArray: newIndexArray,
      locStr: newLocStr,
    };
  }


  getNewIndexArrayIfMarginContain(cornerInRangeArray, toBeReduceRange) {
    let newIndexArray = toBeReduceRange.indexArray.concat()
    if(isArrayEqual(cornerInRangeArray[0], toBeReduceRange.getACornerPoint(0))){
      if(isArrayEqual(cornerInRangeArray[1], toBeReduceRange.getACornerPoint(1))){
        newIndexArray[0] = this.indexArray[2] + 1 //up,minRow = thisMaxRow + 1
      }
      else {
        newIndexArray[1] = this.indexArray[3] + 1 // leftSpanElIndex minCol = thisMaxCol + 1
      }
    }
    else if(isArrayEqual(cornerInRangeArray[0], toBeReduceRange.getACornerPoint(1))){
      newIndexArray[3] = this.indexArray[1] - 1// right maxCol = thisMinCol - 1
    }
    else if(isArrayEqual(cornerInRangeArray[0], toBeReduceRange.getACornerPoint(2))){
      newIndexArray[2] = this.indexArray[0] - 1 // down maxRow = thisMinRow - 1
    }

    return newIndexArray;
  }

  /**
   * 获取本range与other的左上角单元格的shiftNumber
   * @param other
   */
  getShiftArrayToOther(other) {
    return [other.indexArray[0] - this.indexArray[0], other.indexArray[1] - this.indexArray[1]];
  }


// ==== 遍历 ====
  getCellLocArray() {
    let theArray = [];
    this.forEachCellLoc(cellLoc => theArray.push(cellLoc));
    return theArray;
  }

  forEachCellLoc(aFunc) {
    for (let curRow = this.indexArray[0]; curRow <= this.indexArray[2]; curRow++) {
      for (let curCol = this.indexArray[1]; curCol <= this.indexArray[3]; curCol++) {
        let cellLoc = [curRow, curCol].join('_');
        aFunc(cellLoc);
      }
    }
  }

}
