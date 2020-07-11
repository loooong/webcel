import { CalcWorkbookProxy } from './calc_workbook';

/**
 * @property {CalcWorkbookProxy} calcWorkbookProxy
 */
export class Calc { // 整个模块对外服务的类
  constructor() {
    this.calcWorkbookProxy  =  new CalcWorkbookProxy({})
    this.workbookEditor = this.calcWorkbookProxy.workbookEditor // 方便未来的调用
  }

  /**
   * @param {CoreSheet} coreSheet
   * @param {PreAction} changeDetail
   * @return {undefined}
   */
  updateByCoreWorkbookAndChangeDetail(coreSheet, changeDetail) { // 计算陶涛那边给到的rows
    return this.calcWorkbookProxy.updateWorkbookServerByChangeDetail(coreSheet, changeDetail) // 根据preAction来更新获得更新后的值
  }
  // 使用当前状态，来更新workbookServer中的值
  copyDataToWorkbookServer(){

  }

  calculateWorkbook(workbookObj){ // 计算测试用例中直接给到的workbook; 是一次性的初始化
    return this.calcWorkbookProxy.updateByWorkbookObj(workbookObj)  // 发生更新的单元格列表
  }

}

export function easyCalcWorkbook(workbook) {
  let aCalc = new Calc()
  aCalc.calculateWorkbook(workbook)
}

