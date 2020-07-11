// 关于矩阵的定义与算法都在这里
import { INVALID_MATRIX, NOT_NUMBER, SHAPE_DIFF } from '../calc_utils/config';
import { TwoArgOperatorColl } from './operator_coll';

export class MatrixValue { // 二维数组
  constructor(aArray) { // 使用
    this.aArray = aArray;
    this.shape = this.getShape(aArray);
    this.twoArgOperator = new TwoArgOperatorColl()
  }

  applyEachElement(func) {
    return this.aArray.map(f => f.map(func));
  }

  convertNumberToMatrix(aNumber) {
    return this.applyEachElement(e => aNumber);
  }

  getACopy() {
    return new MatrixValue(this.aArray.slice());
  }

  repeatCol(num) { // 当col长度为1的时候会重复填充
    if (this.shape[1] === 1 && num > 1) {
      this.aArray = this.aArray.map(f => Array(num)
        .fill(f[0]));
      this.shape[1] = num;
    }
  }

  repeatRow(num) { // 当col长度为1的时候会重复填充
    if (this.shape[0] === 1 && num > 1) {
      this.aArray = Array(num)
        .fill(this.aArray[0]);
      this.shape[0] = num;
    }
  }

  repeatRowOrCol(num, colOrRow) {
    if (colOrRow === 0) {
      this.repeatRow(num);
    } else {
      this.repeatCol(num);
    }
  }


  getShape(aArray) { // 获取矩阵的形状，第一维对应row，第二维对应col
    let isSameLen = true
    let firstLen = aArray[0].length
    let lenArray = aArray.map(f => {isSameLen =  f.length === firstLen ? firstLen:false});
    if (isSameLen) {
      return [aArray.length, firstLen]; // 行，与列的数量
    } else {
      return new Error(INVALID_MATRIX);
    }
  }

  checkAllNumber(aArray) { // 判断一个矩阵是否都是number类型; Excel中允许为string
    aArray.forEach(f => {
      f.forEach(e => {
        if (typeof e !== 'number') {
          return new Error(NOT_NUMBER);
        }
      });
    });
  }

  checkSameShape(other) {
    if (other.shape !== this.shape) {
      return new Error(SHAPE_DIFF);
    }
  }

  convertArgToMatrix(aArg) {
    if (typeof aArg === 'number') {
      return this.convertNumberToMatrix(aArg);
    } else if (aArg instanceof Array) {
      return MatrixValue(aArg);
    } else if (aArg instanceof MatrixValue) {
      return aArg;
    } else {
      return new Error(INVALID_MATRIX);
    }
  }

  getElement(ri, ci) {
    return this.aArray[ri][ci];
  }

  growToLargeShape(other) { // 当成长到一个更大的shape
    for (let rowOrCol of [0, 1]) {
      if (other.shape[rowOrCol] > this.shape[rowOrCol]) {
        this.repeatRowOrCol(other.shape[rowOrCol], rowOrCol);
      } else if (this.shape[rowOrCol] > other.shape[rowOrCol]) {
        other.repeatRowOrCol(this.shape[rowOrCol], rowOrCol);
      }
    }
  }

  /**
   *
   * @param other
   * @param {BaseExpFunction}func
   * @return {any[]}
   */

  exeElementWiseFunc(other, func) {
    let otherMat = this.convertArgToMatrix(other);
    let thisMat = this.getACopy();
    thisMat.growToLargeShape(otherMat); // 形状匹配
    // otherMat.growToLargeShape(thisMat)  // 形状匹配
    let resRowNum = Math.min(thisMat.shape[0], otherMat.shape[0]);
    let resColNum = Math.min(thisMat.shape[1], otherMat.shape[1]);
    let resArray = Array(resRowNum);
    for (let ri = 0; ri < resRowNum; ri++) {
      resArray[ri] = Array(0)
      for (let ci = 0; ci < resColNum; ci++) {
        let res
        if(typeof func.solveExpression !== "undefined"){
          let args = [thisMat.getElement(ri, ci), otherMat.getElement(ri, ci)]
          res = func.solveExpression(args)
        }
        else {
          res = func([thisMat.getElement(ri, ci), otherMat.getElement(ri, ci)])
        }
        resArray[ri].push(res);
      }
    }
    return resArray;
  }
  exeElementWiseOperator(other, operator) { // 核心方法对每个元素进行运算得到结果
    let theFunc =  this.twoArgOperator.getFunc(operator)
    if (theFunc instanceof Error){
      return theFunc
    }
    return this.exeElementWiseFunc(other, theFunc);
  }


}

