import { expr2xy, xy2expr } from '../global_utils/alphabet';

/**
 * 处理"0_1" 这样的单元格位置的类
 */
export class CellLocStrProxy {
  cellLocStr: string
  rowID: number
  colID: number
  constructor(cellLocStr) {
    this.cellLocStr = cellLocStr;
    this.rowID = -1;
    this.colID = -1;
    this.parseStr();
  }
  static cellName2CellLoc(cellName){
    let rici = expr2xy(cellName).reverse()
    return rici.join("_")
  }

  static fromCellName(cellName){
    let rici = expr2xy(cellName).reverse()
    return new CellLocStrProxy(rici.join("_"))
  }


  getCellName(){
    return xy2expr(this.colID, this.rowID)
  }

  parseStr() {
    let rowCol = this.cellLocStr.split('_') // "0_0".split("_").map(parseInt) = [0, NaN]
      .map(x => +x);
    this.rowID = rowCol[0];
    this.colID = rowCol[1];
  }

  getNewLocStr(newRowID, newColID) {
    let theRowID = typeof newRowID === -1 ? this.rowID : newRowID;
    let theColID = typeof newColID === -1 ? this.colID : newColID;
    return theRowID + '_' + theColID;
  }

  isRightToABound(colIndex, minRowIndex, maxRowIndex) {
    return this.colID > colIndex && this.rowID >= minRowIndex && this.rowID <= maxRowIndex;
  }

  isDownToABound(rowIndex, minColIndex, maxColIndex) {
    return this.rowID > rowIndex && this.colID >= minColIndex && this.colID <= maxColIndex;
  }

  getNewStrByDeleteRange(rangeArray, isMoveToLeft = true){
    let [minRowID,  minColID, maxRowID, maxColID] = rangeArray
    if(isMoveToLeft){
      return this.isRightToABound(maxColID, minRowID, maxRowID)? this.getNewLocStr(-1,
        this.colID - (maxColID - minColID +1)): false
    }
    else{ // 下方的单元格向上移动
      return this.isDownToABound(maxRowID, minColID, maxColID)? this.getNewLocStr(
        this.rowID - (maxRowID - minRowID +1),-1): false
    }
  }
  getNewStrByInsertRange(rangeArray, isMoveToRight = true){
    let [minRowID,  minColID, maxRowID, maxColID] = rangeArray
    if(isMoveToRight){
      return this.isRightToABound(minColID-1, minRowID, maxRowID)? this.getNewLocStr(-1,
        this.colID + (maxColID - minColID +1)): false
    }
    else{ // 下方的单元格向下移动
      return this.isDownToABound(minRowID-1, minColID, maxColID)? this.getNewLocStr(
        this.rowID + (maxRowID - minRowID +1),-1): false
    }
  }
  //  ============== 更新 ==============

  updateCellLocByShiftArray(shiftArray){
    this.rowID += shiftArray[0]
    this.colID += shiftArray[1]
    return this.refreshCellLocStr()
  }
  refreshCellLocStr(){
    this.cellLocStr = [this.rowID, this.colID].join("_")
    return this.cellLocStr
  }
  updateByColIDRowID(colID = this.colID, rowID = this.rowID){
    this.rowID = rowID
    this.colID = colID
    this.refreshCellLocStr()
  }
}

