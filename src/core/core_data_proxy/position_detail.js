//      l: rangeLeft,
//       t: rangeTop,
//       leftSpanElIndex: rangeViewLeft,
//       top: rangeViewTop,
//       height: rangeHeight,
//       width: rangeWidth,
import {
  DIRECTION_DOWN,
  DIRECTION_LEFT,
  DIRECTION_RIGHT,
  DIRECTION_UP,
  RESIZER_DISTANCE
} from '../../global_utils/config_for_core_and_component';
import { LeftTopWidthHeight } from './view_table_view';

export class RangePstDetail {
  constructor(scrollPstProxy, rangeLeft = 0, rangeTop = 0, rangeViewLeft = 0, rangeViewTop = 0, rangeHeight = 0, rangeWidth = 0 ) {
    this.scrollPstProxy = scrollPstProxy;
    this.rangeLeft = rangeLeft;
    this.rangeTop = rangeTop;
    this.rangeViewLeft = rangeViewLeft;
    this.rangeViewTop = rangeViewTop;
    this.rangeHeight = rangeHeight;
    this.rangeWidth = rangeWidth;
  }

  getLTWH():LeftTopWidthHeight {
    return new LeftTopWidthHeight({
      left: this.rangeViewLeft,
      top: this.rangeViewTop,
      width: this.rangeWidth,
      height: this.rangeHeight,
    });
  }
  // 获取
  getAdjustTypeByRelativePst(relativePst: RelativePstDetail): {adjustDirection: 0|1|2|3, value:number}{
    let adjustValue = [
      {adjustDirection: DIRECTION_UP, value:this.rangeViewTop - relativePst.yRelativeToTop}, // 向上调整
      {adjustDirection: DIRECTION_DOWN, value:relativePst.yRelativeToTop - this.rangeViewTop - this.rangeHeight},  // 向下调整
      {adjustDirection: DIRECTION_LEFT, value: this.rangeViewLeft - relativePst.xRelativeToLeft}, // 向左调整
      {adjustDirection: DIRECTION_RIGHT, value: relativePst.xRelativeToLeft - this.rangeViewLeft - this.rangeWidth}, // 向右调整
    ]
    adjustValue.sort((a,b) => a.value - b.value)
    return adjustValue[3]
  }

  updateByShiftArray(shiftArray){
    this.rangeLeft += shiftArray[0];
    this.rangeTop += shiftArray[1];
    this.rangeViewLeft  += shiftArray[0];
    this.rangeViewTop += shiftArray[1];
  }
  getViewBottomY(){
    return this.rangeViewTop + this.rangeHeight
  }
  getViewRightX(){
    return this.rangeViewLeft + this.rangeWidth
  }


}

export class CellPstDetail {
  mousePstX: number
  mousePstY: number
  ri: number
  ci: number
  left: number
  top: number
  width: number
  height: number
  constructor(ri,ci,left=0,top=0,width=0,height=0) {
    this.ri = ri
    this.ci = ci
    this.left = left
    this.top = top
    this.width = width
    this.height = height
  }
  isMousePstInRightBottom(allowWidth=20, allowHeight = 20){
    return this.left + this.width - allowWidth < this.mousePstX && this.top + this.height - allowHeight < this.mousePstY;
  }
  isOnRowResizer() {
    return (this.ri >= 0 && this.ci === -1 && this.top + this.height - this.mousePstY < RESIZER_DISTANCE)
  }

  isOnColResizer() {
    return (this.ci >= 0 && this.ri === -1 && this.left + this.width - this.mousePstX < RESIZER_DISTANCE)
  }

  updateLeftTopByScrollXY(scrollX, scrollY){
    this.left = this.left - scrollX
    this.top = this.top - scrollY
  }
}

// 鼠标相对位置
export class RelativePstDetail {
  constructor(xRelativeToLeft, yRelativeToTop, xRelativeToRight, yRelativeToBottom, isRelativeToTable =false) {
    this.xRelativeToLeft = xRelativeToLeft;
    this.yRelativeToTop = yRelativeToTop;
    this.xRelativeToRight = xRelativeToRight;
    this.yRelativeToBottom = yRelativeToBottom;
    this.isRelativeToTable = isRelativeToTable // 相对于tableContent还是相对于table
  }

  get rightStep() { // 这两个是计算属性
    if (this.xRelativeToRight > 0) {
      return 1;
    } else if (this.xRelativeToLeft < 0) {
      return -1;
    }
    return 0;
  }

  get downStep() {
    if (this.yRelativeToBottom > 0) {
      return 1;
    } else if (this.yRelativeToTop < 0) {
      return -1;
    }
    return 0;
  }

  getRelativeOrientArray() {
    return [this.rightStep, this.downStep];
  }

  getNewDetailByShift(shiftArray){
    return new RelativePstDetail(this.xRelativeToLeft + shiftArray[0]
      , this.yRelativeToTop + shiftArray[1]
    , this.xRelativeToRight + shiftArray[0]
    ,this.yRelativeToBottom + shiftArray[1], this.isRelativeToTable)
  }
  // 可以用来获取相对于tableContent的坐标
  getNewPstDetailByAdjustLeftTop(headerWidth, headerHeight){
    if(this.isRelativeToTable){
      return new RelativePstDetail(this.xRelativeToLeft - headerWidth
        , this.yRelativeToTop - headerHeight
        , this.xRelativeToRight
        ,this.yRelativeToBottom)
    }
    else {
      return this
    }

  }
}
