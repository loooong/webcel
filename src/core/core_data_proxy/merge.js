import { CellRangeProxy } from '../../internal_module/cell_range';
import { CoreSheet } from './core_sheet_change';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';

/**
 * 应该是一个用来表达合并单元格的类
 * 类似这样的数据结构：是coreCellRange的数组
 * @property {Array<CellRangeProxy>} _
 */
export class MultiCoreMerge {
  coreSheet: CoreSheet
  mergeRangeArray: Array<CellRangeProxy>
  constructor(coreSheet) {
    this.coreSheet = coreSheet
  }

  // ========== 查询数据 ==============
  get mergeRangeArray(){
    return  this.coreSheet.coreWorkbook.calcWorkbookEditor.multiMergeLoc.getMultiCoreRangeBySheetName(this.coreSheet.coreSheetName)
  }


  getA1A2StrArray() {
    return this.mergeRangeArray.map(merge => merge.toA1A2OrA1Str());
  }

  getMergeRangeByCellPst(ri, ci):CellRangeProxy{
    const {
      coreRows, coreCols,
    } = this.coreSheet;
    let cellRange = this.getFirstIncludes(ri, ci); // 可能会选中合并单元格
    if (cellRange === null) {
      cellRange = new CellRangeProxy(ri, ci, ri, ci);
      if (ri === -1) { // 这块未来可能会修改
        cellRange.sri = 0;
        cellRange.eri = coreRows.len - 1;
      }
      if (ci === -1) {
        cellRange.sci = 0;
        cellRange.eci = coreCols.len - 1;
      }
    }
    return cellRange
  }

  forEach(cb) {
    this.mergeRangeArray.forEach(cb);
  }

  each(cb) {
      this.mergeRangeArray.forEach(it => cb(it));
  }

  getFirstIncludes(ri, ci) {
    for (let i = 0; i < this.mergeRangeArray.length; i += 1) {
      const it = this.mergeRangeArray[i];
      if (it.includes(ri, ci)) {
        return it;
      }
    }
    return null;
  }

  getOverlapMergeArray(cellRange:CellRangeProxy):Array<CellRangeProxy> {
    return this.mergeRangeArray.filter(it => it.isOverlapWith(cellRange))
  }


  expandToIncludeCrossMergeRange(oriRange):CellRangeProxy {
    let res = this._getMotherCellRangeWithMergeArray(oriRange, this.mergeRangeArray)
    while(true){
      if(res.isUpdate === false){
        return res.newRange
      }
      res = this._getMotherCellRangeWithMergeArray(res.newRange, res.mayExpandMergeArray)
    }
  }

  _getMotherCellRangeWithMergeArray(oriRange, mergeArray: Array<CellRangeProxy>){
    let mayExpandMergeArray = []
    let newRange = oriRange
    let isUpdate = false
    mergeArray.forEach(
      (aMerge)=>{
        if (aMerge.isOverlapWith(oriRange)&& (aMerge.isIncludedBy(oriRange) === false)) {
          newRange = aMerge.getMotherCellRange(newRange);
          isUpdate = true
        }
        else {
          mayExpandMergeArray.push(aMerge)
        }
      }
    )
    return {newRange, mayExpandMergeArray,isUpdate}
  }


  // === 更新数据

  deleteWithin(cr) {
    myLog.myPrint(PRINT_LEVEL3, "本方法需要直接传递给calc！")
    this.mergeRangeArray = this.mergeRangeArray.filter(it => !it.isIncludedBy(cr));
  }


  addMergeRange(cr) {
    myLog.myPrint(PRINT_LEVEL3, "本方法需要直接传递给calc！")
    this.deleteWithin(cr);
    this.mergeRangeArray.push(cr);
  }

  // type: row | column
  shift(type, index, n, cbWithin) {
    myLog.myPrint(PRINT_LEVEL3, "本方法需要直接传递给calc！")

    this.mergeRangeArray.forEach((cellRange) => {
      const {
        sri, sci, eri, eci,
      } = cellRange;
      const range = cellRange;
      if (type === 'row') {
        if (sri >= index) {
          range.sri += n;
          range.eri += n;
        } else if (sri < index && index <= eri) {
          range.eri += n;
          cbWithin(sri, sci, n, 0);
        }
      } else if (type === 'column') {
        if (sci >= index) {
          range.sci += n;
          range.eci += n;
        } else if (sci < index && index <= eci) {
          range.eci += n;
          cbWithin(sri, sci, 0, n);
        }
      }
    });
  }

  move(cellRange, rn, cn) {
    myLog.myPrint(PRINT_LEVEL3, "本方法需要直接传递给calc！")

    this.mergeRangeArray.forEach((it1) => {
      const it = it1;
      if (it.isIncludedBy(cellRange)) {
        it.eri += rn;
        it.sri += rn;
        it.sci += cn;
        it.eci += cn;
      }
    });
  }

}
