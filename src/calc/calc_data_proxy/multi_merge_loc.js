import { RangeLocProxy } from './loc_range_loc';
import { FAIL_OBJ_INTERSECT_MERGE, MSG, FAIL_OBJ_SELECT } from '../calc_utils/error_config';
import { CellRangeProxy } from '../../internal_module/cell_range';

export class MultiMergeLoc {
  sheetID2mergeFullLoc: {[key:number]: Array<string>}
  constructor(workbookEditor, sheetID2mergeFullLoc = {}) {
    this.workbookEditor = workbookEditor;
    this.sheetID2mergeFullLoc = sheetID2mergeFullLoc;
  }
  clearContent(){
    this.sheetID2mergeFullLoc = {}
  }

  // ==== 查询  ====
  getMergeLocBySheetID(sheetID) {
    return this.sheetID2mergeFullLoc[sheetID];
  }

  // 转化为sheet1-> ["A1:A2", ,"A2:A5"] 这样的形式
  getSheetName2MergeRange() {
    let sheetName2MergeRange = {};
    for (let [sheetID, mergeFullLoc] of Object.entries(this.sheetID2mergeFullLoc)) {
      let sheetName = this.workbookEditor.multiSheet.getNameByID(sheetID);
      sheetName2MergeRange[sheetName] =
        mergeFullLoc.map(fullLoc => new RangeLocProxy(fullLoc).getA1A2Str());
    }
    return sheetName2MergeRange;
  }

  getMultiCoreRangeBySheetName(sheetName):Array<CellRangeProxy>{
    let theSheetID = this.workbookEditor.multiSheet.getIDByName(sheetName)
    let mergeFullLoc = this.sheetID2mergeFullLoc[theSheetID]
    return mergeFullLoc.map(fullLoc => new CellRangeProxy(...new RangeLocProxy(fullLoc).indexArray));
  }


  // ==== 变更数值 ====
  simpleUpdateBySheetID2mergeFullLoc(newSheetID2mergeFullLoc:{[key: number]: Array<string>}){
    Object.assign(this.sheetID2mergeFullLoc, newSheetID2mergeFullLoc)
  }

  deleteBySheetID(delSheetID) {
    delete this.sheetID2mergeFullLoc[delSheetID];
  }

  /**
   *
   * @param theSheetID
   * @param reqRangeProxy
   * @param dealFunc: (nonOrCrossOrInclude, mergeFullLoc) => ...
   * @return {*}
   */
  applySheetID2mergeFullLoc(theSheetID, reqRangeProxy, dealFunc) {
    let newMergeArray = [];
    let res = {};
    if(this.sheetID2mergeFullLoc.hasOwnProperty(theSheetID) === false){ // 没有任何合并单元格
      return {}
    }
    for (let mergeFullLoc of this.sheetID2mergeFullLoc[theSheetID]) {
      let preRangeProxy = new RangeLocProxy(mergeFullLoc);
      let nonOrCrossOrInclude = preRangeProxy.isNonOrCrossOrInclude(reqRangeProxy);
      res = dealFunc(nonOrCrossOrInclude, mergeFullLoc);
      if (typeof res !== 'undefined' && typeof res.msg === 'string') { // 此时报错了
        return res;
      }
      if (res === '') { // 删除
      } else if (typeof res === 'string') {
        newMergeArray.push(res); // 更新
      } else {
        newMergeArray.push(mergeFullLoc); // 不变
      }
    }
    if (newMergeArray.length > 0) {
      this.sheetID2mergeFullLoc[theSheetID] = newMergeArray;
    } else {
      delete this.sheetID2mergeFullLoc[theSheetID];
    }
    return {};
  }

  getMergeArrayInRange(sheetID, rangeProxy:RangeLocProxy) {
    let mergeArray = [];
    if (this.sheetID2mergeFullLoc.hasOwnProperty(sheetID)) {
      let newMergeFullLocArray = [];
      this.applySheetID2mergeFullLoc(sheetID, rangeProxy,
        (nonOrCrossOrInclude, mergeFullLoc) => {
          if (nonOrCrossOrInclude === 2) {
            mergeArray.push(mergeFullLoc);
          }
        });
    }
    return mergeArray;
  }
  getMergeLocByLeftTopRiCi(sheetID, ri,ci){
    for (let mergeFullLoc of this.sheetID2mergeFullLoc[sheetID]) {
      let preRangeProxy = new RangeLocProxy(mergeFullLoc);
      if(( preRangeProxy.indexArray[0] === ri)&&(preRangeProxy.indexArray[1] === ci)){
        return mergeFullLoc
      }
    }
  }

  pasteMergeManyTime(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy, shiftDownArray, shiftRightArray) {
    // 删除原有的合并
    let delMerge = this.deleteMergeInRange(dstSheetID, dstRangeProxy, 1);
    if(delMerge.hasOwnProperty(MSG)){ // 存在cross,有错误
      return delMerge
    }

    // 批量添加合并
    let mergeArray = this.getMergeArrayInRange(oriSheetID, oriRangeProxy);
    for(let i =0; i<shiftDownArray.length; i++){
      for(let j=0; j< shiftRightArray.length; j++){
        let shiftArray = [shiftDownArray[i], shiftRightArray[j]]
        let dstMergeArray = mergeArray.map((rangeLoc) => {
          let rangeProxy = new RangeLocProxy(rangeLoc);
          return rangeProxy.updateByShiftArray(shiftArray);
        });
        // 添加合并
        this.simpleAddMergeByMergeArray(dstSheetID, dstMergeArray)
      }
    }
  }
  cutPasteMergeRange(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy) {
    // 删除dstRange的合并
    let delMerge = this.deleteMergeInRange(dstSheetID, dstRangeProxy, 1);
    if(delMerge.hasOwnProperty(MSG)){ // 存在cross,有错误
      return delMerge
    }

    // 获取需要添加的合并
    let mergeArray = this.getMergeArrayInRange(oriSheetID, oriRangeProxy);
    // 删除oriRange合并
    this.deleteMergeInRange(oriSheetID, oriRangeProxy)

    // 添加合并到dstRange中去
    let shiftArray = oriRangeProxy.getShiftArrayToOther(dstRangeProxy);
    let dstMergeArray = mergeArray.map((rangeLoc) => {
      let rangeProxy = new RangeLocProxy(rangeLoc);
      return rangeProxy.updateByShiftArray(shiftArray);
    });
    this.simpleAddMergeByMergeArray(dstSheetID, dstMergeArray)
  }


  pasteMergeRange(oriSheetID, oriRangeProxy, dstSheetID, dstRangeProxy) {
    // 删除原有的合并
    let delMerge = this.deleteMergeInRange(dstSheetID, dstRangeProxy, 1);
    if(delMerge.hasOwnProperty(MSG)){ // 存在cross,有错误
      return delMerge
    }

    // 获取需要添加的合并
    let mergeArray = this.getMergeArrayInRange(oriSheetID, oriRangeProxy);
    let shiftArray = oriRangeProxy.getShiftArrayToOther(dstRangeProxy);
    let dstMergeArray = mergeArray.map((rangeLoc) => {
      let rangeProxy = new RangeLocProxy(rangeLoc);
      return rangeProxy.updateByShiftArray(shiftArray);
    });
    // 添加合并
    this.simpleAddMergeByMergeArray(dstSheetID, dstMergeArray)
  }
  // simple前缀的都是一些原子操作
  simpleAddMergeByMergeArray(sheetID, mergeArray) {
    if(this.sheetID2mergeFullLoc.hasOwnProperty(sheetID) === false){
      this.sheetID2mergeFullLoc[sheetID] = []
    }
    this.sheetID2mergeFullLoc[sheetID] = this.sheetID2mergeFullLoc[sheetID].concat(mergeArray)
  }


  deleteMergeInRange(theSheetID, reqRangeProxy, errorOrDeleteOrNonIfCross = 0) {
    let delMergeFullLocArray = [];
    // 寻找Range内有交叉的合并单元格，更新sheetID2mergeFullLoc
    if (this.sheetID2mergeFullLoc.hasOwnProperty(theSheetID)) {
      let newMergeFullLocArray = [];
      this.applySheetID2mergeFullLoc(theSheetID, reqRangeProxy,
        (nonOrCrossOrInclude, mergeFullLoc) => {
          if (nonOrCrossOrInclude === 0) {
            newMergeFullLocArray.push(mergeFullLoc);
          }
          else if(nonOrCrossOrInclude === 1){
            if(errorOrDeleteOrNonIfCross === 0){ // 报错
              return FAIL_OBJ_INTERSECT_MERGE
            }
            else if(errorOrDeleteOrNonIfCross === 2){ // 不处理
              newMergeFullLocArray.push(mergeFullLoc);
            }
          }
          else {
            delMergeFullLocArray.push(mergeFullLoc);
          }
        });
      this.sheetID2mergeFullLoc[theSheetID] = newMergeFullLocArray; // 允许为空列表
    }
    return delMergeFullLocArray;
  }

  // 删除range内的合并单元格，增加本次合并单元格range范围
  addMergeRange(theSheetID, toMergeRangeProxy) {
    // 2. 更新sheetID2mergeFullLoc; 删除range内的合并单元格，增加本次合并单元格range范围
    if (this.sheetID2mergeFullLoc.hasOwnProperty(theSheetID)) {
      let newMergeFullLoc = [];
      let res = this.applySheetID2mergeFullLoc(theSheetID, toMergeRangeProxy,
        (nonOrCrossOrInclude, mergeFullLoc) => {
          if (nonOrCrossOrInclude === 1) {
            return FAIL_OBJ_SELECT; // 与其他合并单元格有交叉，报错，这个是依据google sheet的逻辑
          } else if (nonOrCrossOrInclude === 0) {
            newMergeFullLoc.push(mergeFullLoc);
          }
        });
      if (typeof res.msg === 'string') { // 此时报错：FAIL_OBJ_SELECT
        return res;
      }
      newMergeFullLoc.push(toMergeRangeProxy.rangeLocStr);
      this.sheetID2mergeFullLoc[theSheetID] = newMergeFullLoc;
    } else {
      this.sheetID2mergeFullLoc[theSheetID] = [toMergeRangeProxy.rangeLocStr];
    }
    return {};
  }

  // 移动
  updateMergeFullLocAfterMove(theSheetID, shiftNumber, toShiftRangeProxy, rightOrDown = 0) {
    return this.applySheetID2mergeFullLoc(theSheetID, toShiftRangeProxy, (nonOrCrossOrInclude, mergeFullLoc) => {
        if (nonOrCrossOrInclude === 1) { // 不合法
          return FAIL_OBJ_INTERSECT_MERGE;
        } else if (nonOrCrossOrInclude === 2) { // 需要移动
          return this.moveMergeRange(mergeFullLoc, shiftNumber, rightOrDown); // 替换
        }
      }
    );
  }

  moveMergeRange(mergeFullLoc, shiftNumber, rightOrDown = 0) {
    let mergeRangeProxy = new RangeLocProxy(mergeFullLoc);
    if (rightOrDown === 0) {
      mergeRangeProxy.updateByMoveRight(shiftNumber);
    } else {
      mergeRangeProxy.updateByMoveDown(shiftNumber);
    }
    return mergeRangeProxy.rangeLocStr; // 替换
  }


}
