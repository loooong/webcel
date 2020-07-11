import { expr2xy, xy2expr } from '../global_utils/alphabet';
import { getSortedArray } from '../global_utils/func_for_calc_core';
// calc模块与core模块都会引用这个类
export class CellRangeProxy { // todo: 改造这个数据结构
  sri: number;
  sci: number;
  eri: number;
  eci: number;
  w: number; // 猜测是宽度，但似乎这个属性应该不要用
  h: number;

  constructor(sri = 0, sci = 0, eri = 0, eci = 0, w = 0, h = 0) {
    this.sri = sri;
    this.sci = sci;
    this.eri = eri;
    this.eci = eci;
    this.w = w;
    this.h = h;
  }

  static fromRangeExpr(ref) {
    // B1:B8, B1 => 1 x 1 cell range
    const refs = ref.split(':');
    const [sci, sri] = expr2xy(refs[0]);
    let [eri, eci] = [sri, sci];
    if (refs.length > 1) {
      [eci, eri] = expr2xy(refs[1]);
    }
    return new CellRangeProxy(sri, sci, eri, eci);
  }
  get cellRangeIndexArray(){
    return [this.sri, this.sci, this.eri, this.eci]
  }

  isEndLargerThanStart() { // 一般要保证这个
    return this.eri - this.sri > 0 || this.eci - this.sci > 0;
  }

  isOverlapWithRowID(rowID){
    return rowID >= this.sri && rowID <= this.eri
  }
  isOverlapWithColID(colID){
    return colID >= this.sci && colID <= this.eci
  }

  // 与某个cell之间的关系
  // cell-index: ri, ci
  // cell-ref: A10
  includes(...exprOrRiCi) {
    let [ri, ci] = [0, 0];
    if (exprOrRiCi.length === 1) {
      [ci, ri] = expr2xy(exprOrRiCi[0]);
    } else if (exprOrRiCi.length === 2) {
      [ri, ci] = exprOrRiCi;
    }
    const {
      sri, sci, eri, eci,
    } = this;
    return sri <= ri && ri <= eri && sci <= ci && ci <= eci;
  }


  isCellPstInside(ri, ci) {
    const {
      sri, sci, eri, eci,
    } = this;

    return sri <= ri && eri >= ri && sci <= ci && eci >= ci;
  }

  applyEveryRiCi(riCiFunc, rowFilterFunc = () => true) {
    const {
      sri, sci, eri, eci,
    } = this;
    for (let curRowID = sri; curRowID <= eri; curRowID += 1) {
      if (rowFilterFunc(curRowID)) {
        for (let curColID = sci; curColID <= eci; curColID += 1) {
          riCiFunc(curRowID, curColID);
        }
      }
    }
  }


  // ========== 与其他的coreRange的关系 ====================
  isIncludeOther(other: CellRangeProxy) {
    return this.sri <= other.sri
      && this.sci <= other.sci
      && this.eri >= other.eri
      && this.eci >= other.eci;
  }

  // within
  isIncludedBy(other) {
    return this.sri >= other.sri
      && this.sci >= other.sci
      && this.eri <= other.eri
      && this.eci <= other.eci;
  }

  // disjoint
  notOverlapWith(other) {
    return !this.isOverlapWith(other);
  }

  // intersects
  isOverlapWith(other) {
    return this.sri <= other.eri
      && this.sci <= other.eci
      && other.sri <= this.eri
      && other.sci <= this.eci;
  }

  getScrollOrientArrayNew(ri, ci): Array {
    let { sri, sci, eri, eci } = this;
    let nonOrRightOrLeft,
      nonOrDownOrUp;
    if (ci > eci) {
      nonOrRightOrLeft = 1;
    } else {
      nonOrRightOrLeft = ci < sci ? 2 : 0;
    }
    if (ri > eri) {
      nonOrDownOrUp = 1;
    } else {
      nonOrDownOrUp = ri < sri ? 2 : 0;
    }
    return [nonOrRightOrLeft, nonOrDownOrUp];
  }

  //获取母区域：母区域会包含this与other两个区域
  getMotherCellRange(other) {
    return new CellRangeProxy(
      Math.min(other.sri, this.sri), Math.min(other.sci, this.sci),
      Math.max(other.eri, this.eri), Math.max(other.eci, this.eci)
    );
  }


  getRowColCount() {
    return [this.eri - this.sri + 1, this.eci - this.sci + 1,];
  }

  toA1A2OrA1Str() { // 这个逻辑好奇怪
    const {
      sri, sci, eri, eci,
    } = this;
    let ref = xy2expr(sci, sri);
    if (this.isEndLargerThanStart()) {
      ref = `${ref}:${xy2expr(eci, eri)}`;
    }
    return ref;
  }

  getCopy() {
    const {
      sri, sci, eri, eci, w, h,
    } = this;
    return new CellRangeProxy(sri, sci, eri, eci, w, h);
  }

  isEqualWithOther(other) {
    return this.eri === other.eri
      && this.eci === other.eci
      && this.sri === other.sri
      && this.sci === other.sci;
  }

  getRiInside(ri){
    if(ri > this.eri) {
      return this.eri
    }
    else{
      return ri < this.sri? this.sri: ri
    }
  }

  getCiInside(ci){
    if(ci > this.eci) {
      return this.eci
    }
    else{
      return ci < this.sci? this.sci: ci
    }
  }

  // =========== 需要修改的函数 ===============
  getDiffWithOther_Old(other) { // todo: 需要重构
    const resArray = [];
    const addRet = (sri, sci, eri, eci) => {
      resArray.push(new CellRangeProxy(sri, sci, eri, eci));
    };// 加入ret结合
    const {
      sri, sci, eri, eci,
    } = this;
    const dsr = other.sri - sri;
    const dsc = other.sci - sci;
    const der = eri - other.eri;
    const dec = eci - other.eci;
    if (dsr > 0) {
      addRet(sri, sci, other.sri - 1, eci);
      if (der > 0) {
        addRet(other.eri + 1, sci, eri, eci);
        if (dsc > 0) {
          addRet(other.sri, sci, other.eri, other.sci - 1);
        }
        if (dec > 0) {
          addRet(other.sri, other.eci + 1, other.eri, eci);
        }
      } else {
        if (dsc > 0) {
          addRet(other.sri, sci, eri, other.sci - 1);
        }
        if (dec > 0) {
          addRet(other.sri, other.eci + 1, eri, eci);
        }
      }
    } else if (der > 0) {
      addRet(other.eri + 1, sci, eri, eci);
      if (dsc > 0) {
        addRet(sri, sci, other.eri, other.sci - 1);
      }
      if (dec > 0) {
        addRet(sri, other.eci + 1, other.eri, eci);
      }
    }
    if (dsc > 0) {
      addRet(sri, sci, eri, other.sci - 1);
      if (dec > 0) {
        addRet(sri, other.eri + 1, eri, eci);
        if (dsr > 0) {
          addRet(sri, other.sci, other.sri - 1, other.eci);
        }
        if (der > 0) {
          addRet(other.sri + 1, other.sci, eri, other.eci);
        }
      } else {
        if (dsr > 0) {
          addRet(sri, other.sci, other.sri - 1, eci);
        }
        if (der > 0) {
          addRet(other.sri + 1, other.sci, eri, eci);
        }
      }
    } else if (dec > 0) {
      addRet(eri, other.eci + 1, eri, eci);
      if (dsr > 0) {
        addRet(sri, sci, other.sri - 1, other.eci);
      }
      if (der > 0) {
        addRet(other.eri + 1, sci, eri, other.eci);
      }
    }
    return resArray;
  }


  // 1 * n  /  n * 1 / n * n
  getType_Old() {  // todo: 本方法需要优化
    let {
      sri, sci, eri, eci,
    } = this;

    if (sri === eri && sci !== eci) {
      return 1;
    } else if (sri !== eri && sci === eci) {
      return 2;
    } else if (sri !== eri && sci !== eci) {
      return 3;
    } else if (sri === eri && sci === eci) {
      return 1;
    }
    console.error('未知情况');
    return 4;
  }


  getLocationArray_Old(sarr) {
    let darr = [];
    let index = 0;
    this.applyEveryRiCi((i, j) => {
      darr.push({
        ri: i,
        ci: j,
        v: sarr[index % sarr.length].tmp,
        type: sarr[index % sarr.length].type
      });
      index = index + 1;
    });

    return darr;
  }

  // =========== 更新 ===============
  // 会自动调整顺序
  updateByFirstSelectAndSecondSelectRiCi(firstRi, firstCi, secondRi, secondCi) {
    [this.sci, this.eci] = getSortedArray([firstCi, secondCi]);
    [this.sri, this.eri] = getSortedArray([firstRi, secondRi]);
  }

  updateByStartRiCi(newSri, newSci) {
    this.eri = newSri + (this.eri - this.sri);
    this.eci = newSci + (this.eci - this.sci);
    this.sri = newSri;
    this.sci = newSci;
  }

  updateByStartAndEndRiCI(ri, ci, eri, eci) {
    this.sri = ri;
    this.sci = ci;
    this.eri = eri;
    this.eci = eci;
  }

}

