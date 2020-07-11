import {
  SYN_CONTAINER,
  SYN_EXP_FN,
  SYN_OPERATOR,
  SYN_RAW_VALUE_NUM,
  SYN_SPLIT_MARK,
  SYN_USELESS, SYN_VAR_NAME
} from '../calc/calc_utils/config';
import { isArrayBeginWithOther } from '../calc/calc_utils/helper';
import { isHave } from '../global_utils/check_value';
export class SyntaxCharPstDetail{
  synUnit: BaseSyntaxUnitProxy
  isAtEnd: boolean
  synUnitRightPartLength: number
  synUnitIndex:number
  constructor(aObj = {}) {
    Object.assign(this, aObj)
  }
  get isAtEnd(){
    return this.synUnitRightPartLength === 0
  }
  hasSynUnit(){
    return isHave(this.synUnit)
  }
  allowAddReferUnit(){
    return this.isAtEnd === true && this.synUnit.isAllowFollowedByReferUnit()
  }
  isAllowExpFn(){
    return this.hasSynUnit() && this.synUnit.typeProxy.isIncludeAnyType(SYN_VAR_NAME,SYN_EXP_FN)
  }
  getLeftPartOfSynUnit() {
    return this.synUnit.wholeStr.slice(0, this.synUnit.wholeStr.length - this.synUnitRightPartLength)
  }
  getRightPartOfSynUnit() {
    return this.synUnit.wholeStr.slice(this.synUnit.wholeStr.length - this.synUnitRightPartLength)
  }

  getLeftPartLength(){
    return this.synUnit.wholeStr.length - this.synUnitRightPartLength
  }


}

class SyntaxRangeDetail{
  startPst:number
  endPst:number
  synUnitArray: Array<BaseSyntaxUnitProxy>
  constructor(startPst, endPst, synUnitArray = []) {
    this.startPst = startPst
    this.endPst = endPst
    this.synUnitArray = synUnitArray
  }
  isSynUnitArrayEmpty(){
    return this.synUnitArray.length === 0
  }

}

export class TypeArrayProxy { // 对应一个类型
  constructor(aArray) {
    this.aArray = aArray;
  }

  isIncludeType(aType) {
    return this.aArray.includes(aType);
  }

  /**
   *
   * @param {Array} aTypeArray
   * @return {*}
   */
  isMarchTypeArray(aTypeArray) {
    return isArrayBeginWithOther(this.aArray, aTypeArray);
  }
  isIncludeAnyType(...typeArray){
    for(let aType of typeArray){
      if(this.isIncludeType(aType)){
        return true
      }
    }
    return false
  }

}

export class MultiSyntaxUnitProxy { // 复合型节点
  constructor(childrenSynUnit = []) {
    this.typeArray = []; //归属的类别,因为存在一级，二级目录，所以是一个array
    this.childrenSynUnit = this.sortChildren(childrenSynUnit); // 含有的子语法点, 根据pstID的顺序排列
    this.parentSynUnit = null; // 所属的父语法点
    this.pstID = -1;
  }

  sortChildren(childrenSynUnit) { // 对节点进行排序
    childrenSynUnit.sort((a, b) => a.pstID - b.pstID);
    return childrenSynUnit;
  }

  updatePstID(newChildPstID) {
    this.pstID = this.pstID === -1 || newChildPstID < this.pstID ? newChildPstID : this.pstID;
  }

  addChild(childSynUnit) { // 根据pstID插入到指定位置中
    childSynUnit.parentSynUnit = this;
    this.childrenSynUnit.push(childSynUnit);
    this.sortChildren(this.childrenSynUnit);
    this.updatePstID(childSynUnit.pstID);
  }

  getWholeString() {
    let acc = '';
    this.childrenSynUnit.map((child) => acc += child.getWholeString());
    return acc;
  }

  getAllBaseSyntaxUnit(isSort = true): Array<BaseSyntaxUnitProxy> { // 获取所有基本单元
    let syntaxUnitArray = [];
    this.childrenSynUnit.map(child => {
      if (child instanceof MultiSyntaxUnitProxy) {
        syntaxUnitArray = syntaxUnitArray.concat(child.getAllBaseSyntaxUnit());
      } else {
        syntaxUnitArray.push(child);
      }
    });
    if (isSort) {
      syntaxUnitArray.sort((a, b) => a.pstID - b.pstID);
    }
    return syntaxUnitArray;
  }

  getRefUnitArrayObj(): { A1: Array, A1A2: Array, AA: Array } {
    let baseSyntaxArray = this.getAllBaseSyntaxUnit();
    let A1RefArray = baseSyntaxArray.filter(syntaxUnit => syntaxUnit.isA1Unit());
    let AARefArray = baseSyntaxArray.filter(syntaxUnit => syntaxUnit.isAAUnit());
    let A1A2RefArray = baseSyntaxArray.filter(syntaxUnit => syntaxUnit.isA1A2Unit());
    return {
      A1: A1RefArray,
      A1A2: A1A2RefArray,
      AA: AARefArray
    };
  }

  // 根据字符位置来获取位置特征信息
  getCharPstDetail(charPst): SyntaxCharPstDetail{
    let pstDetail = new SyntaxCharPstDetail()
    if(charPst < 0){
      return pstDetail
    }
    let totalCharNumber =  charPst + 1 // 从0到charPst的所有字符个数
    let preCharPast = totalCharNumber// 从0到charPst的所有字符个数
    let nextCharPst = preCharPast;
    let baseSyntaxArray = this.getAllBaseSyntaxUnit();
    let synUnitIndex = 0
    for (let synUnit: BaseSyntaxUnitProxy of baseSyntaxArray) {
      nextCharPst = preCharPast - synUnit.getWholeString().length;
      if(nextCharPst <= 0){
        pstDetail.synUnit = synUnit
        pstDetail.synUnitRightPartLength = -nextCharPst
        pstDetail.synUnitIndex = synUnitIndex
        return pstDetail
      }
      else {
        synUnitIndex += 1
        preCharPast = nextCharPst;
      }
    }
  }
  // charPst为最右边
  getLastCharPstDetail():SyntaxCharPstDetail{
    let baseSyntaxArray = this.getAllBaseSyntaxUnit();
    let pstDetail = new SyntaxCharPstDetail()
    pstDetail.synUnit = baseSyntaxArray[baseSyntaxArray.length-1]
    pstDetail.synUnitRightPartLength = 0
  }

  // 通过起始与结束位置来获取语法单元
  getSynUnitRangeDetailByStartEndPst(startPst, endPst):SyntaxRangeDetail {
    let syntaxRangeDetail = new SyntaxRangeDetail(startPst, endPst)
    let startChartPstDetail = this.getCharPstDetail(startPst)
    if(startChartPstDetail.hasSynUnit() === false){
      return syntaxRangeDetail
    }
    let endChartPstDetail = this.getCharPstDetail(endPst)
    if(endChartPstDetail.hasSynUnit() === false){
      return syntaxRangeDetail
    }
    syntaxRangeDetail.synUnitArray = this.getAllBaseSyntaxUnit().slice(startChartPstDetail.synUnitIndex, endChartPstDetail.synUnitIndex+1)
    return syntaxRangeDetail
  }
  // =============== 更新数据 =======================
  /**
   * 不更新获取
   * @param shiftArray
   * @param inplace
   */
  updateSynUnitByShiftArray(shiftArray, inplace = false) {
    let acc = '';
    this.childrenSynUnit.forEach((child) => acc += child.updateSynUnitByShiftArray(shiftArray, inplace));
    return acc;
  }

  updateByNewLoc(newCol, newRow) {
    this.childrenSynUnit.map((child) => child.updateByNewLoc(newCol, newRow));
  }



}


export class BaseSyntaxUnitProxy {
  wholeStr: string
  constructor(pstID, wholeStr, aTypeArray) {
    this.pstID = pstID;
    this.wholeStr = wholeStr;
    this.typeProxy = new TypeArrayProxy(aTypeArray); //归属的类别,因为存在一级，二级目录，所以是一个array
    this.pairUnit = null; // 配对的unit的属性,例如大小括号配对等
    this.parentSynUnit = null; // 所属的父语法点
    // 对应的RawValue, Range, RefValue等； 具备计算功能，但不具备公式字符串修改功能
    this.assciatedValue = null;
    // 可以用来做公式字符串修改，但是不具备计算功能
    this.syntaxParser = this.getParser();

  }
  isAllowFollowedByReferUnit(){
    return this.typeProxy.isIncludeType(SYN_OPERATOR) || this.typeProxy.isIncludeType(SYN_SPLIT_MARK) ||
      (this.typeProxy.isIncludeType(SYN_CONTAINER) && this.wholeStr === "(") // container之中，只有container可以跟引用单元
  }


  getParser() {
    return null;
  }


  addPair(pairUnit) {
    this.pairUnit = pairUnit;
    // pairUnit.pairUnit = this;
  }


  getLength() {
    return this.wholeStr.length;
  }

  isEmpty() {
    return this.wholeStr === '';
  }

  // 推荐写法
  updateSynUnitByFuncForSyntaxParser(funcForSyntaxParser, inplace) {
    let resStr = this.syntaxParser ? funcForSyntaxParser(this.syntaxParser) : this.wholeStr; // todo: this.syntaxParser可能为null
    this.wholeStr = inplace ? resStr : this.wholeStr;
    return resStr;
  }

  updateSynUnitByShiftArray(shiftArray, inplace = false) {
    let res = this.updateSynUnitByFuncForSyntaxParser((syntaxParser) => syntaxParser.updateStrByShiftArray(shiftArray, inplace));
    if(inplace){
      this.wholeStr = res
    }
    return res
  }


  getWholeString() {
    return this.wholeStr;
  }

  // ======= 未来需要优化的写法 ===========
  updateByNewRangIndexArray(rangeIndexArray, inplace = false) {
    let resStr = this.syntaxParser.updateStrByRangeIndexArray(rangeIndexArray, inplace); // todo: this.syntaxParser可能为null
    this.wholeStr = inplace ? resStr : this.wholeStr;
    return resStr;
  }

  updateByNewLoc(args, inplace = false) {
    let resStr = this.syntaxParser.updateStrByNewLoc(...args, inplace); // todo: this.syntaxParser可能为null
    this.wholeStr = inplace ? resStr : this.wholeStr;
    return resStr;
  }


  updateByRenameSheet(oldSheetName, newSheetName) {
    let resStr = this.syntaxParser.updateStrByRenameSheet(oldSheetName, newSheetName);
    if (resStr === '') {
      return false; // 没有发生变化
    } else {
      this.wholeStr = resStr;
      return true; // 发生了变阿虎
    }
  }

}

export class SyntaxStructureBuilder {
  constructor(SyntaxUnitCls) {
    this.rootUnit = new MultiSyntaxUnitProxy();
    this.curUnit = this.rootUnit; // 当前unit
    this.curExpID = -1; // 表达式ID
    this.containerStack = [];
    this.curUnitStack = [this.rootUnit];
    if (typeof SyntaxUnitCls === 'undefined') {
      SyntaxUnitCls = BaseSyntaxUnitProxy;
    }
    this.SyntaxUnitCls = SyntaxUnitCls;
  }

  getAndAddExpId() {
    this.curExpID += 1;
    return this.curExpID;
  }

  getLastUnit() {
    return this.curUnitStack[this.curUnitStack.length - 1];
  }

  createNewStack() { // 新建子节点
    let multiSyntaxUnit = new MultiSyntaxUnitProxy();
    multiSyntaxUnit.parentSynUnit = this.getLastUnit();
    this.getLastUnit()
      .addChild(multiSyntaxUnit);
    this.curUnit = multiSyntaxUnit;
    this.curUnitStack.push(multiSyntaxUnit);
  }

  returnToPreStack() { // 回到父节点
    this.curUnitStack.pop();
    this.curUnit = this.getLastUnit();
  }


  addStringToCurUnit(wholeStr, aTypeArray) {
    let syntaxUnitProxy = new this.SyntaxUnitCls(this.getAndAddExpId(), wholeStr, aTypeArray);
    this.curUnit.addChild(syntaxUnitProxy);
    return syntaxUnitProxy;
  }

  addContainerUnit(wholeStr, aTypeArray, isEnd = false) {
    let syntaxUnitProxy = this.addStringToCurUnit(wholeStr, aTypeArray);
    if (isEnd === true) {
      syntaxUnitProxy.addPair(this.containerStack.pop()); // 减少container栈
    } else {
      this.containerStack.push(syntaxUnitProxy);  // 增加container栈
    }

  }

  addValueToCurUnit(syntaxValue, wholeStr, aTypeArray) {
    let syntaxUnitProxy = this.addStringToCurUnit(wholeStr, aTypeArray);
    syntaxUnitProxy.assciatedValue = syntaxValue;
    return syntaxUnitProxy;
  }

  addParserToCurUnit(syntaxParser, wholeStr, aTypeArray) {
    let syntaxUnitProxy = this.addStringToCurUnit(wholeStr, aTypeArray);
    syntaxUnitProxy.syntaxParser = syntaxParser;
    syntaxParser.associateWithSyntaxUnit(syntaxUnitProxy);
    return syntaxUnitProxy;
  }


  addUseLessUnit(theStr) {
    if (theStr === '') {
      return;
    }
    let syntaxUnitProxy = this.addStringToCurUnit(theStr, [SYN_USELESS]);
  }

}

