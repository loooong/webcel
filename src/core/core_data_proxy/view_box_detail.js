import { BorderSetting, CellStyleSettings, DEFAULT_BG_COLOR } from './core_sheet_proxy';
import { FormatCell } from './cell_format_cell';
import { CellProxyForDraw } from './cell_proxy';
import {
  getGridLineWidth,
  getIntOfDevicePixel,
  npxLine, TableCanvasDealer
} from '../../component/comp_table/table_canvas_comp';
export class TextLineDetail{
  adjustPadding: number
  textLineClipWidth: number
  constructor(aObj = {}){
    Object.assign(this, aObj)
  }
}

export class DrawBoxDetail { // 一个对于box的位置与样式信息
  borderSetting: BorderSetting;
  formatCell: FormatCell
  cellStyleSetting: CellStyleSettings
  bgcolor: string
  padding: number
  textLineArray: Array
  textLineDetail: TextLineDetail // 非合并单元格可以溢出到右边的非合并单元格

  constructor(x, y, w, h, padding = 0,formatCell, isMergeRange = false) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
    this.padding = padding;
    this.isMergeRange = isMergeRange
    this.updateByFormatCell(formatCell)
  }
  static fromLeftRightWidthHeight({left, top, width, height}, padding=0, formatCell, isMerge = false){
    return new DrawBoxDetail(left, top, width, height,padding, formatCell, isMerge)
  }
  // ============= 查询 ================

  isHaveFormatCell(){
    return this.formatCell instanceof FormatCell
  }

  get bgcolor(){
    return this.cellStyleSetting.bgcolor
  }
  get borderSetting(){
    return this.cellStyleSetting.border
  }
  get borderDetailArray(){
    return this.getBorderArray()
  }

  get maxTextLineWidth(){
    return this.width - 2 * this.padding
  }

  getBorderArray():Array<{singleBorderSetting: Object, points: Array}>{
    let borderDetailArray = []
    if (this.borderSetting.topBorder) {
      borderDetailArray.push({singleBorderSetting: this.borderSetting.topBorder, points: this.topxys() })
    }
    if (this.borderSetting.rightBorder) {
      borderDetailArray.push({singleBorderSetting: this.borderSetting.rightBorder, points: this.rightxys() })
    }
    if (this.borderSetting.bottomBorder) {
      borderDetailArray.push({singleBorderSetting: this.borderSetting.bottomBorder, points: this.bottomxys() })
    }
    if (this.borderSetting.leftBorder) {
      borderDetailArray.push({singleBorderSetting: this.borderSetting.leftBorder, points: this.leftxys() })
    }
    return borderDetailArray
  }


  getFillAreaXYWH(){
    let borderWidth = getGridLineWidth() // 通常是0.5Px
    if(this.bgcolor === DEFAULT_BG_COLOR){ // 主要用于merge填掉内部框线
      return [getIntOfDevicePixel(this.x), getIntOfDevicePixel(this.y ), getIntOfDevicePixel(this.width-borderWidth ), getIntOfDevicePixel(this.height-borderWidth)]
    }
    else {//填充色会包括周围的border
      return [getIntOfDevicePixel(this.x-borderWidth), getIntOfDevicePixel(this.y - borderWidth), getIntOfDevicePixel(this.width+2*borderWidth), getIntOfDevicePixel(this.height+2*borderWidth)]
    }
  }


  getTextInsideBox(isShowFormat){
    if(this.isHaveFormatCell() === false){
      return ""
    }
    else if(isShowFormat){
      return this.formatCell.formulaInCalcCell
    }
    else {
      return this.formatCell.getText()
    }
  }

  updateBorderSetting(borderSetting: BorderSetting) {
    this.borderSetting = borderSetting;
  }

  getMaxTextLineWidth() { // 获取文本最多占据的宽度
    return this.width - (this.padding * 2);
  }

  innerHeight() {
    return this.height - (this.padding * 2);
  }

  getAnchorXByHorizontalAlign(align) {
    const { width, padding } = this;
    let { x } = this;
    if (align === 'left') {
      x += padding;
    } else if (align === 'center') {
      x += width / 2;
    } else if (align === 'right') {
      x += width - padding;
    }
    return x;
  }

  updateTextLineArray(tableCanvasComp, isShowFormula, adjustPadding = 0){
    this.textLineArray = this.getTextLineArray(tableCanvasComp, isShowFormula,adjustPadding)
    this.textLineClipWidth = 300
    return this.textLineArray
  }
  /**
   *
   * @param tableCanvasComp
   * @param isShowFormula
   * @param adjustPadding 这是因为右下角如果有filter的话需要做调整
   * @return {Array}
   */
  getTextLineArray(tableCanvasComp: TableCanvasDealer, isShowFormula, adjustPadding = 0){
    let drawBox = this
    let adjustWidth = drawBox.width - adjustPadding

    let textInsideBox = this.getTextInsideBox(isShowFormula)
    // 获取textDetail
    let cellStyleSetting = drawBox.cellStyleSetting;
    tableCanvasComp.updateStateByCellStyleSetting(cellStyleSetting); // 先得配置font信息

    let maxTextLineWidth = drawBox.maxTextLineWidth - adjustPadding; // 宽度变小
    // 获取textLineArray
    let textLineArray = [],firstTextLineTop;
    if (drawBox.cellStyleSetting.textwrap === false) {
      // 只有一行
      textLineArray.push({
        textLineString: textInsideBox,
        textLineWidth: tableCanvasComp.getTextTotalWidthNew(textInsideBox),
        textLineAdjustPadding: adjustPadding
      })
    } else {
      let curLineWidth = 0;
      let curLineText = '';
      for (let charIndex = 0; charIndex < textInsideBox.length; charIndex++) {
        let curCharWidth = tableCanvasComp.getTextTotalWidthNew(textInsideBox[charIndex]);
        if (curLineWidth + curCharWidth > maxTextLineWidth) {
          textLineArray.push({
            textLineString: curLineText,
            textLineWidth: curLineWidth
          });
          curLineText = textInsideBox[charIndex]
          curLineWidth = curCharWidth
        } else {
          curLineText = curLineText + textInsideBox[charIndex];
          curLineWidth = curLineWidth + curCharWidth;
        }
      }
      if(curLineText!==""){ // 最后一行
        textLineArray.push({
          textLineString: curLineText,
          textLineWidth: curLineWidth,
          textLineAdjustPadding: adjustPadding
        });
      }

    }
    // 获取第一行的top值
    let fontSizePx = cellStyleSetting.getFontSizePx() // 行高度
    let lineHeightPx = cellStyleSetting.getLineHeightPx()
    if (cellStyleSetting.valign === 'top') { // 向上对齐
      firstTextLineTop = drawBox.padding; // 第一行的top值
    } else if (cellStyleSetting.valign === 'middle') { // 中部对齐
      firstTextLineTop = drawBox.height / 2 - lineHeightPx * textLineArray.length / 2;
    } else if (cellStyleSetting.valign === 'bottom') { // 底部对齐
      firstTextLineTop = drawBox.height - lineHeightPx - drawBox.padding;
    }
    for(let i =0; i <textLineArray.length; i++){
      textLineArray[i].textLineBottomY = firstTextLineTop + (i + 1)* lineHeightPx
    }
    // 得到textLineLeft
    for(let i =0; i <textLineArray.length; i++){
      if (cellStyleSetting.align === 'left') {
        textLineArray[i].textLineLeft = drawBox.padding;
      } else if (cellStyleSetting.align === 'center') {
        textLineArray[i].textLineLeft = (adjustWidth) / 2 - textLineArray[i].textLineWidth /2;
      } else if (cellStyleSetting.align === 'right') {
        textLineArray[i].textLineLeft = adjustWidth - drawBox.padding - textLineArray[i].textLineWidth
      }
    }

    for(let i =0; i <textLineArray.length; i++) {
      let textLineObj = textLineArray[i]
      textLineObj.textLineStrikePoints = [[textLineObj.textLineLeft, textLineObj.textLineBottomY - fontSizePx/2],[textLineObj.textLineLeft+textLineObj.textLineWidth,  textLineObj.textLineBottomY - fontSizePx/2]]
      textLineObj.textLineUnderLinePoints = [[textLineObj.textLineLeft, textLineObj.textLineBottomY],[textLineObj.textLineLeft+textLineObj.textLineWidth,  textLineObj.textLineBottomY]]
    }
    return textLineArray
  }


  topxys() {
    const { x, y, width } = this;
    return [[x, y], [x + width, y]];
  }

  rightxys() {
    const {
      x, y, width, height,
    } = this;
    return [[x + width, y], [x + width, y + height]];
  }

  bottomxys() {
    const {
      x, y, width, height,
    } = this;
    return [[x, y + height], [x + width, y + height]];
  }

  leftxys() {
    const {
      x, y, height,
    } = this;
    return [[x, y], [x, y + height]];
  }
  // ========== 更新数据 =============
  updateByFormatCell(formatCell){
    this.formatCell = formatCell
    if(this.formatCell){
      this.cellStyleSetting = this.formatCell.getStyleSetting()
    }
    else{
      this.cellStyleSetting = new CellStyleSettings()
    }
  }
}
