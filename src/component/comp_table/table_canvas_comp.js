/* global window */
import { isHave } from '../../global_utils/check_value';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { TableViewDetail } from '../../core/core_data_proxy/view_table_view_detail';
import { CellStyleSettings } from '../../core/core_data_proxy/core_sheet_proxy';
import {
  BORDER_STYLE_DASHED,
  BORDER_STYLE_DOTTED,
  BORDER_STYLE_DOUBLE,
  BORDER_STYLE_MEDIUM,
  BORDER_STYLE_THICK
} from '../../global_utils/config_for_core_and_component';
import { TableComp } from './table_comp';
import { DrawBoxDetail } from '../../core/core_data_proxy/view_box_detail';
import { getFontSizePxByPt } from '../../core/core_utils/font';
import { TABLE_HEADER_HIGHLIGHT_STYLE } from '../utils/component_table_config';

export function getDevicePixelRatio() {
  return window.devicePixelRatio || 1;       // 这个值越大越清晰,后续可以考虑加大
}

export function getGridLineWidth() {
  return getDevicePixelRatio() - 0.5;
}

export function getIntOfDevicePixel(px) {
  let d = px * getDevicePixelRatio() + '';
  return parseInt(d, 10);
}

export function npxLine(px) {
  const n = getIntOfDevicePixel(px);
  return n > 0 ? n - 0.5 : 0.5; // 划线要减去0.5？不知道为什么
}

export function getIntOfDevicePixelNew(px, devicePixelRatio = 1) {
  let d = px * devicePixelRatio + '';
  return parseInt(d, 10);
}


function drawFolderMinus(ctx, sx, sy) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = '#707070';
  ctx.moveTo(sx, sy + 6);
  ctx.lineTo(sx + 12, sy + 6);
  ctx.stroke();

  ctx.strokeRect(sx, sy, 12, 12);
  ctx.clip();
  ctx.fill();
  ctx.restore();
}

function drawFolderPlus(ctx, sx, sy) {
  ctx.save();
  ctx.beginPath();
  ctx.fillStyle = '#707070';
  ctx.moveTo(sx + 6, sy);
  ctx.lineTo(sx + 6, sy + 12);
  ctx.moveTo(sx, sy + 6);
  ctx.lineTo(sx + 12, sy + 6);
  ctx.stroke();

  ctx.strokeRect(sx, sy, 12, 12);
  ctx.clip();
  ctx.fill();
  ctx.restore();
}
export const FILTER_BUTTON_WIDTH = 20
export const DROPDOWN_PADDING = 1
export const FILTER_BUTTON_HEIGHT = 20
export const DROPDOWN_TRIANGLE_COLOR =  'rgb(24,128,56)'
export const DROPDOWN_FUNNER_COLOR =  'rgb(24,128,56)'

export const DROPDOWN_RECT_COLOR =  'rgba(255, 255, 255, 1)'

// 这个类负责封转canvas的行为，并且根据viewDetail渲染出canvas
export class TableCanvasDealer {
  coreSheet: CoreSheet;
  ctx: CanvasRenderingContext2D;
  tableViewDetail: TableViewDetail;

  constructor(ctx, coreSheet) {
    this.ctx = ctx
    this.coreSheet = coreSheet;
    this.updateViewDetailByCoreTableView();
    // this.el.style['background-color'] = 'rgb(248, 248, 248)';
  }

  updateViewDetailByCoreTableView() { // 之后会直接根据this.viewDetail来做渲染
    this.tableViewDetail = this.coreSheet.tableViewForEvent.easyRefreshTableViewDetail();
    this.tableViewDetail.updateAllTextLine(this) // 获取textLine的信息
  }


  resizeByTableWidthHeight(htmlElement: HTMLElement) { // 需要再使用viewDetail的数据
    let width = this.tableViewDetail.tableWidth; // 放到ViewDetailForCanvas
    let height = this.tableViewDetail.tableHeight;// 放到ViewDetailForCanvas
    htmlElement.style.width = `${width}px`;
    htmlElement.style.height = `${height}px`;
    htmlElement.width = this.tableViewDetail.canvasElWidth; // canvas 的宽度高度与px的转换
    htmlElement.height = this.tableViewDetail.canvasElHeight;
    this.ctx.scale(this.tableViewDetail.devicePixelRatio, this.tableViewDetail.devicePixelRatio);// 放到倍数
  }


  clearCanvas0(htmlElement: HTMLElement) {
    const { width, height } = htmlElement;
    this.ctx.clearRect(0, 0, width, height);
    return this;
  }

  updateAttrByName2Value(options) {
    Object.assign(this.ctx, options);
    return this;
  }
  updateStateByCellStyleSetting(cellStyleSetting:CellStyleSettings){
    this.updateAttrByName2Value(cellStyleSetting.getTextLineStyleForCanvas())
  }

  saveAndBeginPath() {
    this.ctx.save();
    this.ctx.beginPath();
    return this;
  }

  restore() {
    this.ctx.restore();
    return this;
  }

  beginPath() {
    this.ctx.beginPath();
    return this;
  }

  translate(x, y) {
    this.ctx.translate(getIntOfDevicePixel(x), getIntOfDevicePixel(y));
    return this;
  }

  clearRect(x, y, w, h) {
    this.ctx.clearRect(x, y, w, h);
    return this;
  }

  fillRect(x, y, w, h) {
    this.ctx.fillRect(getIntOfDevicePixel(x) - 0.5, getIntOfDevicePixel(y) - 0.5, getIntOfDevicePixel(w), getIntOfDevicePixel(h));
    return this;
  }

  fillText(text, x, y) {
    // this.ctx.font.size = 30;
    this.ctx.fillText(text, getIntOfDevicePixel(x), getIntOfDevicePixel(y));
    return this;
  }

  // 获取有多少行
  getLineNumberIfTextWarp(box: DrawBoxDetail, textInsideBox) {
    let textLineNumber = 1;
    const textLine = {
      len: 0,
      start: 0
    };
    let innerWidth = box.width - box.padding * 2;
    for (let i = 0; i < textInsideBox.length; i += 1) { // 遍历每个字符
      if (textLine.len + box.padding >= innerWidth) {
        textLineNumber = textLineNumber + 1;
        textLine.len = 0;
        textLine.start = i; // 这个start参数没有用到
      }
      textLine.len += this.getTextTotalWidthNew(textInsideBox[i]);
    }
    return textLineNumber; // 返回行数量
  }

  getTextTotalWidth(txt, font) { // 获取text的宽度，为分行做准备
    if (isHave(txt) === false || isHave(font) === false || txt.length <= 0) {
      return 0;
    }
    const { ctx } = this;
    ctx.font = `${font.italic ? 'italic' : ''} ${font.bold ? 'bold' : ''} ${getIntOfDevicePixel(font.size)}px ${font.name}`;
    return ctx.measureText(txt).width * font.size / getIntOfDevicePixel(font.size);
  }

  getTextTotalWidthNew(txt) {
    return this.ctx.measureText(txt).width / getDevicePixelRatio();
  }

  /*
    txt: render text
    box: DrawBoxDetail
    updateAttrByName2Value: {
      align: leftSpanElIndex | center | right
      valign: top | middle | bottom
      color: '#333333',
      strike: false,
      font: {
        name: 'Arial',
        size: 14,
        bold: false,
        italic: false,
      }
    }
    textWrap: text wrapping
  */
  drawTextLinesNew(textLineArray, drawBox: DrawBoxDetail){
    this.ctx.save();
    this.translate(drawBox.x, drawBox.y)
    this.updateAttrByName2Value(drawBox.cellStyleSetting.getTextLineStyleForCanvas())
    textLineArray.forEach(
      (textLineObj) =>  {
        // 如果存在filterButton的话（textLineAdjustPadding>0）, textLine不能越过filterButton
        let clipWidth = textLineObj.textLineAdjustPadding>0? drawBox.width - textLineObj.textLineAdjustPadding:drawBox.width
        this.ctx.rect(0,0, clipWidth, drawBox.height)
        this.ctx.clip() // 防止跨越单元格
        this.ctx.beginPath() // 放到这里, 会取消掉之前的rectPath，防止后面的fill与stroke方法。
        this.fillText(textLineObj.textLineString, textLineObj.textLineLeft, textLineObj.textLineBottomY)
        if (drawBox.cellStyleSetting.strike) {
          this.drawLineByPoints(...textLineObj.textLineStrikePoints)
        }
        if (drawBox.cellStyleSetting.underline) {
          this.drawLineByPoints(...textLineObj.textLineUnderLinePoints)
        }
      }
    )
    this.ctx.restore();


  }


  setStyleByBorderStyleColor({ style, color }) {
    const { ctx } = this;
    ctx.lineWidth = getGridLineWidth;
    ctx.strokeStyle = color;
    if (style === BORDER_STYLE_MEDIUM) {
      ctx.lineWidth = getIntOfDevicePixel(2) - 0.5;
    } else if (style === BORDER_STYLE_THICK) {
      ctx.lineWidth = getIntOfDevicePixel(3);
    } else if (style === BORDER_STYLE_DASHED) {
      ctx.setLineDash([getIntOfDevicePixel(3), getIntOfDevicePixel(2)]);
    } else if (style === BORDER_STYLE_DOTTED) {
      ctx.setLineDash([getIntOfDevicePixel(1), getIntOfDevicePixel(1)]);
    } else if (style === BORDER_STYLE_DOUBLE) {
      ctx.setLineDash([getIntOfDevicePixel(2), 0]);
    }
    return this;
  }
  drawHorizonLine(y, x0, x1){
    this.drawLineByPoints(...[[x0, y], [x1, y]])
  }
  drawVerticalLine(x, y0, y1){
    this.drawLineByPoints(...[[x, y0], [x, y1]])
  }

  // 从起点画直线，画多个直线
  drawLineByPoints(...pointArray) {
    if (pointArray.length > 1) {
      const [x, y] = pointArray[0];
      this.ctx.moveTo(npxLine(x), npxLine(y));
      for (let i = 1; i < pointArray.length; i += 1) {
        const [x1, y1] = pointArray[i];
        this.ctx.lineTo(npxLine(x1), npxLine(y1));
      }
      this.ctx.stroke();
    }
    return this;
  }

  drawBorderDetailArray(borderDetailArray) { // 在box周围画边框
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    for (let borderDetail of borderDetailArray) {
      this.setStyleByBorderStyleColor(borderDetail.singleBorderSetting);
      this.drawLineByPoints(...borderDetail.points);
    }
    ctx.restore();
  }

  error(box) {
    const { ctx } = this;
    const { x, y, width } = box;
    const sx = x + width - 1;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(getIntOfDevicePixel(sx - 8), getIntOfDevicePixel(y - 1));
    ctx.lineTo(getIntOfDevicePixel(sx), getIntOfDevicePixel(y - 1));
    ctx.lineTo(getIntOfDevicePixel(sx), getIntOfDevicePixel(y + 8));
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 0, 0, .65)';
    ctx.fill();
    ctx.restore();
  }
  // contentViewRange, headerColWith, headerRowHeight, -scrollLeft, -scrollTop // 转移到table_canvas_comp
  drawFillRect(x, y, w, h, style = TABLE_HEADER_HIGHLIGHT_STYLE) {
    this.saveAndBeginPath();
    this.updateAttrByName2Value(style)
      .fillRect(x, y, w, h);
    this.restore();
  }


  drawBlankInBox(box: DrawBoxDetail) {
    const { ctx } = this;
    const {
      x, y, width, height
    } = box;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = '#fff';
    ctx.rect(npxLine(x + 1), npxLine(y + 1), getIntOfDevicePixel(width - 2), getIntOfDevicePixel(height - 2));
    ctx.clip();
    ctx.fill();
    ctx.restore();
  }

  drawFillBgColor(box: DrawBoxDetail) {
    const { ctx } = this;
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = box.bgcolor;
    // 设置一个矩形，让afterDrawFunc可以把内容画进去
    ctx.rect(...box.getFillAreaXYWH());
    ctx.clip(); // 设置为当前切片，这样fill的时候可以只fill这块区域
    ctx.fill();
    ctx.restore();
  }
}

export class MockTableCanvas extends  TableCanvasDealer{
  updateAttrByName2Value(name2value){
    return
  }
  updateStateByCellStyleSetting(cellStyleSetting:CellStyleSettings){
    this.fontSizePx = cellStyleSetting.getFontSizePx()
  }
  getTextTotalWidthNew(text:string){ // 简单做法，处理都是中文的字符
    return text.length * this.fontSizePx
  }

}
