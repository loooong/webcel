// 这个类只包含cellID，sheetID，cellLoc；不包含sheetName，cellName
import { MySet } from './basic_myset';
import { TO_DELETE } from '../calc_utils/config';
import { RefLocStrProxy } from './loc_full_loc';
import {
  DeleteRangeRelationDealer, DeleteSheetRelationDealer} from './multi_relation_delete_dealer';
import { MoveRangeRelationDealer } from './multi_relation_move_dealer';
import { RangeDealerOption, SheetDealerOption } from './multi_relation_options';

export class MultiRelation{
  constructor(workbookEditor, fullLocStr2CellID2PstID = {}){
    this.workbookEditor = workbookEditor
    this.fullLocStr2CellID2PstID = fullLocStr2CellID2PstID
  }
  // ============ 查询 ===============

  clearContent(){
    this.fullLocStr2CellID2PstID = {}
  }
  /***
   * 找到依赖preSet的所有的单元格集合，组成toAddSet
   * @param {MySet} preSet, 内部是// 1!A1_0_2, 2!A1A2_0_2_3_4, 3!AA_1_2
   * @return {MySet}
   */
  getDependentCellID2RefUnitArray(preSet: MySet|Array) :{number: Array<number>}{
    let self = this;
    let preRefProxyArray = Array.from(preSet)
      .map((refStr) =>
        new RefLocStrProxy(refStr)
      );
    let cellID2PstID = this.applyFullLoc2CellID2PstID((refStr) => {
      let aRefStrProxy = new RefLocStrProxy(refStr);
      for (let refLocProxy of preRefProxyArray) {
        let rangeLocArray = refLocProxy.getRangeLocArray(this.workbookEditor); // rangeLocArray是被改动的单元格范围
        if (aRefStrProxy.isInteractWithRange(rangeLocArray, refLocProxy.refSheetID)) {
          return '';
        }
      }
    });
    return cellID2PstID;
  }

  getToCellID2PstIDByFromSheetID(sheetID){
    return this.applyFullLoc2CellID2PstID(
      fullLocStr => {
        if (new RefLocStrProxy(fullLocStr).refSheetID === sheetID) {
          return '';
        }
      }
    );
  }
  // =========== 编辑修改的逻辑 ============
  /**
   * remove指定的cellID； remove前缀的方法，不会考虑对引用了这些单元格的单元格的影响
   * （1）workbookRelation.sheetID2CellLoc2CellID; （2）calcSheet.initName2CellProxy
   * （3）workbookRelation.cellID2CalcCell,(4)在fullLoc2CellID中注册的引用
   * @param toDelCellIDArray
   */
  removeRelationByToCellIDArray(toDelCellIDArray) {
    // 在fullLocStr2CellID2RefUnit中删除所有的toDelCellArray
    let self = this;
    this.applyFullLoc2CellID2PstID(
      fullLocStr => {
        toDelCellIDArray.forEach(
          cellID => {
            delete self.fullLocStr2CellID2PstID[fullLocStr][cellID];
          }
        );
        if (Object.keys(self.fullLocStr2CellID2PstID[fullLocStr]).length === 0) {
          delete self.fullLocStr2CellID2PstID[fullLocStr];
        }
      }
    );
  }

  /**
   *  去掉某个cellID依赖的那些fullLocStrArray。
   * @param {Array} fullLocStrArray
   * @param cellID
   */
  removeRelationByFullLocArrayAndCellID(fullLocStrArray, cellID) {
    for (let fullLocStr of fullLocStrArray) {
      if(this.fullLocStr2CellID2PstID.hasOwnProperty(fullLocStr) && // 存在依赖关系的时候再删除
        this.fullLocStr2CellID2PstID[fullLocStr].hasOwnProperty(cellID))
        if (Object.keys(this.fullLocStr2CellID2PstID[fullLocStr]).length === 1){ // 只有一个
          delete this.fullLocStr2CellID2PstID[fullLocStr]
        }
      else {
          delete this.fullLocStr2CellID2PstID[fullLocStr][cellID];
        }
    }
  }
  removeRelationByFullLocArray(toDelFullLocStr) {
    // fullLocStr2CellID2refID对应delSheet的中的那些fullLoc需要删除掉
    let self = this;
    toDelFullLocStr.forEach(fullLoc =>
      delete self.fullLocStr2CellID2PstID[fullLoc]);
  }
  /**
   * 遍历所有的引用关系，获取满足条件的引用
   * @param singleLocFunc 返回 ''代表只获取，不替换，返回非空字符串代表获取并且替换；返回TO_DELETE代表把这个引用删除
   * @param cellID2RefSyntaxUnit 外界需要的结果
   */
  applyFullLoc2CellID2PstID(singleLocFunc, cellID2RefSyntaxUnit = {}) { // 获取{234->[0,12]}这样所有引用了本sheetID的东西。
    let theObj = this.fullLocStr2CellID2PstID;
    let allRefStrArray = Object.getOwnPropertyNames(theObj);
    let toUpdateObj = {}

    for (let fullLocStr of allRefStrArray) {
      let newRefLocStr = singleLocFunc(fullLocStr); // 返回空字符串代表不替换，返回false 代表不符合筛选条件
      if (typeof newRefLocStr === 'string') { // 做替换
        let curCellID2RefSyntaxUnit = theObj[fullLocStr];
        if (newRefLocStr !== '') { // 非空字符会删除之前的引用
          if(newRefLocStr !== TO_DELETE){
            toUpdateObj[newRefLocStr] = curCellID2RefSyntaxUnit;
          }
          delete theObj[fullLocStr];
        }
        for (let cellID of Object.getOwnPropertyNames(curCellID2RefSyntaxUnit)) {
          let curRefSyntaxArray = cellID2RefSyntaxUnit[cellID];
          cellID2RefSyntaxUnit[cellID] = cellID2RefSyntaxUnit.hasOwnProperty(cellID) ?
            curRefSyntaxArray.concat(curCellID2RefSyntaxUnit[cellID]) : curCellID2RefSyntaxUnit[cellID];
        }
      }
    }
    Object.assign(theObj, toUpdateObj) // 最后再一次性替换
    return cellID2RefSyntaxUnit;
  }


  /**
   * 新增依赖关系
   * @param locStr2PstID 2!A1_0_1 -> [1,3] cellID的语法单元的依赖关系
   * @param cellID 某个cellID的变更
   */
  addRelationByLoc2PstID(locStr2PstID, cellID) {
    for (let curLocStr of Object.getOwnPropertyNames(locStr2PstID)) {
      if (this.fullLocStr2CellID2PstID.hasOwnProperty(curLocStr)) {
        this.fullLocStr2CellID2PstID[curLocStr][cellID] = locStr2PstID[curLocStr];
      } else {
        this.fullLocStr2CellID2PstID[curLocStr] = {};
        this.fullLocStr2CellID2PstID[curLocStr][cellID] = locStr2PstID[curLocStr];
      }
    }
  }

  /**
   * 因为某个区域被删除，而导致的引用这个区域的其他单元格需要更新公式，重新计算
   * @param fromRangeProxy 被删除的区域
   * @return {Array} beginArray
   */
  updateFormulaByDeleteRange(fromRangeProxy){
    let deleteRangeRelationDealer = new DeleteRangeRelationDealer(this, new RangeDealerOption(fromRangeProxy))
    return deleteRangeRelationDealer.updateRelationByDelete()
  }
  // shiftRangeProxy 要么toBottom要么toRight
  updateFormulaByShiftRangeToMargin(shiftRangeProxy, shiftRightNumber = 0, shiftDownNumber = 0){
    let rangeDealOption =  new RangeDealerOption(shiftRangeProxy,shiftRightNumber, shiftDownNumber)
    let moveRangeRelationDealer = new MoveRangeRelationDealer(this,rangeDealOption)
    return moveRangeRelationDealer.updateRelationByMove()
  }

  updateFormulaByDeleteSheet(toDealSheetID){
    let dealer = new DeleteSheetRelationDealer(this, new SheetDealerOption(toDealSheetID))
    return dealer.updateRelationByDelete()
  }

  /**
   *
   * @param oriSheetID
   * @param oriRangeProxy
   * @param dstSheetID
   * @param dstRangeProxy
   */
  updateFormulaByCutPasteRange(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy){
    let shiftArray = oriRangeProxy.getShiftArrayToOther(dstRangeProxy);

    // 删除dstRange导致的引用变化
    let deleteRangeRelationDealer = new DeleteRangeRelationDealer(this, new RangeDealerOption(dstRangeProxy))
    let beginCellIDReferDstRange = deleteRangeRelationDealer.updateRelationByDelete()

   // 移动oriRange到dstRange导致的变化
    let rangeDealOption = new RangeDealerOption(oriRangeProxy,shiftArray[1], shiftArray[0], oriSheetID!== dstSheetID)
    let moveRangeRelationDealer = new MoveRangeRelationDealer(this, rangeDealOption)
    let beginCellIDReferOriRange = moveRangeRelationDealer.updateRelationByMove()
    return beginCellIDReferOriRange.concat(beginCellIDReferDstRange)
  }
}


