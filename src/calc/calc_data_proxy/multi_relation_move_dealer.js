import { RefLocStrProxy } from './loc_full_loc';

/**
 * options.rangeProxy, options.shiftNumber, options.rightOrDownOrBothOrNon
 * 当为Both选项的时候，不会判定specialContain
 * @property {RangeDealerOption}options
 */
export class MoveRangeRelationDealer {
  constructor(multiRelation, options) {
    this.multiRelation = multiRelation;
    this.options = options;
  }

  getResInfoObj(curFullLocProxy) {
    let resInfo = curFullLocProxy.getNewFullLocByShift(this.multiRelation.workbookEditor,
      this.options.rangeProxy, this.options.shiftNumber, this.options.rightOrDownOrBothOrNon);
    return resInfo;
  }

  isReplaceFullLocAfterMove(resInfo) {
    if (this.options.rightOrDownOrBothOrNon === 0) {
      return [0, 1].includes(resInfo.rowContainOrContainOrOverlapOrNon);
    } else if (this.options.rightOrDownOrBothOrNon === 1) {
      return [0, 1].includes(resInfo.colContainOrContainOrOverlapOrNon);
    } else if (this.options.rightOrDownOrBothOrNon === 2) {
      return [0].includes(resInfo.containOrOverlapOrNon);
    }
  }

  isRecalculateAfterMove(resInfo) {
    if (this.options.rightOrDownOrBothOrNon === 0) {
      return [0, 2].includes(resInfo.rowContainOrContainOrOverlapOrNon);
    } else if (this.options.rightOrDownOrBothOrNon === 1) {
      return [0, 2].includes(resInfo.colContainOrContainOrOverlapOrNon);
    } else if (this.options.rightOrDownOrBothOrNon === 2) {
      return [1].includes(resInfo.containOrOverlapOrNon);
    }
  }

  updateRelationByMove() {
// 5. 【引用变化】toShiftRange与fullLocRange的分为：specialContain, Contain, Overlap, non 这四种情况
    // 更新 fullLocStr2CellID2PstID; 获取
    // 5.1 Contain，更新formulaString，获取toChangeFormulaCellID2Ref与beginCellIDArray。
    let beginCellIDArray = [];
    let toChangeFormulaCellID2Ref = this.multiRelation.applyFullLoc2CellID2PstID(
      fullLocStr => {
        let curFullLocProxy = new RefLocStrProxy(fullLocStr);
        let resInfo = this.getResInfoObj(curFullLocProxy);
        if (this.isReplaceFullLocAfterMove(resInfo)) { // rowContain与contain替代fullLocStr
          let cellID2RefID = this.multiRelation.fullLocStr2CellID2PstID[fullLocStr];
          this.multiRelation.workbookEditor.multiCalcCell.updateCellFormulaByRangeIndexArray(cellID2RefID, resInfo.indexArray);
          return resInfo.fullLocStr;
        }
        if (this.isRecalculateAfterMove(resInfo)) { //rowContain与overlap 需要重新计算
          let toAddCellIDArray = this.multiRelation.fullLocStr2CellID2PstID[fullLocStr];
          beginCellIDArray = beginCellIDArray.concat(Object.keys(toAddCellIDArray));
        }
      }
    );
    return beginCellIDArray;
  }
}
