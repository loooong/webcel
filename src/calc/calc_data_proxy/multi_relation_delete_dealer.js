import { RangeLocProxy } from './loc_range_loc';
import { RefLocStrProxy } from './loc_full_loc';
import { ERROR_REF } from '../calc_utils/error_config';


/**
 * 对multiRelation 的处理逻辑的封装
 */
export class DeleteRangeRelationDealer {
  constructor(multiRelation, options) {
    this.multiRelation = multiRelation;
    this.options = options; // 选项
  }

  /**
   *    * 判定curFullLocProxy与toDelRangeProxy的关系。情况类型的编号是从复杂到困难。
   * 如果curFullLocProxy与toDelRangeProxy的差集为矩形，locStr = 差集对应的fullLoc，且需要加入beginSet  0
   * 如果toDelRangeProxy包含curFullLocProxy，locStr = #REF!，且需要加入beginSet 1
   * 如果curFullLocProxy与toDelRangeProxy不符合上述情况，有交集 locStr 不变，且需要加入beginSet  2
   * 如果curFullLocProxy与toDelRangeProxy没有交集，locStr不变 3
   * @param curFullLocProxy
   */
  getResInfoObjByDelete(curFullLocProxy) {
    let selfRangeLocArray = curFullLocProxy.getRangeLocArray(this.multiRelation.workbookEditor);
    let selfRangeLocProxy = new RangeLocProxy(selfRangeLocArray.join('_'));
    let res = this.options.rangeProxy.getNewIndexArrayByRemove(selfRangeLocProxy);
    res.fullLocStr = curFullLocProxy.getFullLocStrByRangIndexArray(res.indexArray);
    return res;
  }


  isReplaceFullLocAfterDelete(resInfo) {
    return [0].includes(resInfo.rectDiffOrContainOrOverlapOrNon);
  }

  isRefErrorAfterDelete(resInfo) { // 变为#REF，且重新计算
    return [1].includes(resInfo.rectDiffOrContainOrOverlapOrNon);
  }

  isRecalculateAfterDelete(resInfo) { // 重新计算
    return [0, 1, 2].includes(resInfo.rectDiffOrContainOrOverlapOrNon);
  }

  updateRelationByDelete() {
    // [更新引用单元格] 遍历fullLoc2CellID2RefID：如果是contain的关系，reqUnit变为#REF!,加入beginSet;
    let multiRelation = this.multiRelation;
    let beginCellIDArray = [];
    let toChangeFormulaCellID2Ref = multiRelation.applyFullLoc2CellID2PstID(
      fullLocStr => {
        let curFullLocProxy = new RefLocStrProxy(fullLocStr);
        let resInfo = this.getResInfoObjByDelete(curFullLocProxy);
        if (this.isReplaceFullLocAfterDelete(resInfo)) { //替代fullLocStr
          let cellID2RefID = multiRelation.fullLocStr2CellID2PstID[fullLocStr];
          multiRelation.workbookEditor.multiCalcCell.updateCellFormulaByRangeIndexArray(cellID2RefID, resInfo.indexArray);
          return resInfo.fullLocStr;
        }
        if (this.isRecalculateAfterDelete(resInfo)) { //需要重新计算
          let toAddCellIDArray = multiRelation.fullLocStr2CellID2PstID[fullLocStr];
          beginCellIDArray = beginCellIDArray.concat(Object.keys(toAddCellIDArray));
        }
        if (this.isRefErrorAfterDelete(resInfo)) { // 引用错误
          let toAddCellIDArray = multiRelation.fullLocStr2CellID2PstID[fullLocStr];
          beginCellIDArray = beginCellIDArray.concat(Object.keys(toAddCellIDArray));
          let cellID2RefID = multiRelation.fullLocStr2CellID2PstID[fullLocStr];
          multiRelation.workbookEditor.multiCalcCell.updateCellFormulaByNewStr(cellID2RefID, ERROR_REF);
          // return TO_DELETE;
        }
      }
    );
    return beginCellIDArray;
  }
}

export class DeleteSheetRelationDealer extends DeleteRangeRelationDealer{
  /**
   *    * 判定curFullLocProxy与toDelRangeProxy的关系。情况类型的编号是从复杂到困难。
   * 如果curFullLocProxy与toDelRangeProxy的差集为矩形，locStr = 差集对应的fullLoc，且需要加入beginSet  0
   * 如果toDelRangeProxy包含curFullLocProxy，locStr = #REF!，且需要加入beginSet 1
   * 如果curFullLocProxy与toDelRangeProxy不符合上述情况，有交集 locStr 不变，且需要加入beginSet  2
   * 如果curFullLocProxy与toDelRangeProxy没有交集，locStr不变 3
   * @param {RefLocStrProxy} curFullLocProxy
   */
  getResInfoObjByDelete(curFullLocProxy) {
    let isRefError = curFullLocProxy.refSheetID === this.options.toDealSheetID
    return {isRefError: isRefError};
  }


  isReplaceFullLocAfterDelete(resInfo) {
    return false;
  }

  isRefErrorAfterDelete(resInfo) {
    return resInfo.isRefError;
  }

  isRecalculateAfterDelete(resInfo) {
    return false;
  }


}
