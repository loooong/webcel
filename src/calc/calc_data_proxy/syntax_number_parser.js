import { indexAt, stringAt } from '../../global_utils/alphabet';

/**
 * @property {BaseSyntaxUnitProxy|null} syntaxUnit
 */
class BaseNameParser { // 可以用来重构的类， 对应$A,A,$1这样可能带有$符号的坐标标志
  constructor(aName, isAbsoluteRef) {
    this.aName = aName;
    this.aNumber = this.getNumber();
    this.isAbsoluteRef = isAbsoluteRef;
    this.syntaxUnit = null; //关联的语法单元
  }

  getNumber() { // 需要被子类重写的方法
    return -999;
  }
  getNameWithAbsoluteRef(){
    return this.isAbsoluteRef? "$" + this.aName : this.aName
  }
  getNameWithAbsoluteRefByNumber(index, inplace = false) {
    let aName = this.getNameByNumber(index, inplace)
    return this.isAbsoluteRef? "$" + aName : aName;
  }


  dealInplace(res, inplace) {
    if (inplace) {
      this.syntaxUnit.wholeStr = res; // 更新
    }
    return res;
  }

  getNameByNumber(index, inplace = false) {
    return '';
  }

  associateWithSyntaxUnit(aSyntaxUnit) {
    this.syntaxUnit = aSyntaxUnit;
  }

  updateByShift(aShift, inplace = false) {
    if (this.isAbsoluteRef === true) { // 绝对引用不会发生变更
      return this.aName;
    }
    let res = this.getNameByNumber(this.getNumber() + aShift, inplace);
    return this.dealInplace(res, inplace);
  }

  updateNumberByShift(shiftNumber, inplace = false) {
    let newNumber = this.isAbsoluteRef ? this.aNumber : this.aNumber + shiftNumber;
    if (inplace) {
      this.getNameByNumber(newNumber, true);
    }
    return newNumber;
  }
}

export class CellColNameParser extends BaseNameParser {
  static fromStrMayWith$(aStr) { // 类似python的class method
    let aColName;
    if (aStr[0] === '$') {
      aColName = new CellColNameParser(aStr.slice(1), true);
    } else {
      aColName = new CellColNameParser(aStr, false);
    }
    return aColName;
  }

  getNumber() {
    return indexAt(this.aName);
  }

  getNameByNumber(index, inplace = false) {
    let aStr = stringAt(index);
    if (inplace === true) {
      this.aName = aStr;
    }
    return this.dealInplace(aStr, inplace);
  }

}

export class CellRowNameParser extends BaseNameParser {
  static fromStrMayWith$(aStr) { // 类似python的class method
    let aColName;
    if (aStr[0] === '$') {
      aColName = new CellRowNameParser(aStr.slice(1), true);
    } else {
      aColName = new CellRowNameParser(aStr, false);
    }
    return aColName;
  }

  getNumber() {
    return parseInt(this.aName) - 1; // A1 对应rowid为0
  }

  getNameByNumber(index, inplace) {
    let aStr = String(index + 1);
    if (inplace === true) {
      this.aName = aStr;
    }
    return this.dealInplace(aStr, inplace);
  }
}
