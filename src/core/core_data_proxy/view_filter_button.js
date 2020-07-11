import { DrawBoxDetail } from './view_box_detail';
import { TEXT_FILTER_ALL } from './core_sort_filter';
import {
  DROPDOWN_FUNNER_COLOR,
  DROPDOWN_TRIANGLE_COLOR,
  TableCanvasDealer
} from '../../component/comp_table/table_canvas_comp';

export class FilterHeaderButton {
  drawBox: DrawBoxDetail;
  filterStatus: string;
  sortAscOrDesc: number

  constructor(drawBox, filterStatus = TEXT_FILTER_ALL,sortAscOrDesc) {
    this.drawBox = drawBox;
    this.filterStatus = filterStatus;
    this.sortAscOrDesc = sortAscOrDesc // 标记sort状态
  }

  drawAutoFilterButton(tableCanvasDealer: TableCanvasDealer) {
    tableCanvasDealer.ctx.save();
    // 画矩形
    tableCanvasDealer.ctx.beginPath();
    this.drawFilterBackgroundRect(tableCanvasDealer, this.drawBox.formatCell.getStyleSetting().bgcolor);
    tableCanvasDealer.ctx.restore();
    tableCanvasDealer.ctx.save();
    tableCanvasDealer.ctx.beginPath();
    if (this.filterStatus === TEXT_FILTER_ALL) {
      // 画下三角形
      this.drawDownwardTriangle(tableCanvasDealer);
    } else {
      // 对于存在筛选的，需要画漏斗形
      this.drawFunnel(tableCanvasDealer);
    }
    this.drawSortArrow(tableCanvasDealer) // 画sort方向
    tableCanvasDealer.restore();
  }

  drawFilterBackgroundRect(tableCanvasDealer, fillStyle) {
    const {
      x, y, width, height,
    } = this.drawBox;
    tableCanvasDealer.ctx.rect(x, y, width - this.drawBox.padding, height - this.drawBox.padding);
    tableCanvasDealer.ctx.fillStyle = fillStyle;
    tableCanvasDealer.ctx.fill();
  }

  drawFunnel(tableCanvasDealer, fillStyle = DROPDOWN_FUNNER_COLOR) { // 花筛选框
    const {
      x, y, width, height,
    } = this.drawBox;
    tableCanvasDealer.ctx.fillStyle = fillStyle;
    tableCanvasDealer.ctx.moveTo(x + 0.2 * width, y + 0.25 * height);
    tableCanvasDealer.ctx.lineTo(x + 0.8 * width, y + 0.25 * height);
    tableCanvasDealer.ctx.lineTo(x + 0.55 * width, y + 0.5 * height);
    tableCanvasDealer.ctx.lineTo(x + 0.55 * width, y + 0.8 * height);
    tableCanvasDealer.ctx.lineTo(x + 0.45 * width, y + 0.8 * height);
    tableCanvasDealer.ctx.lineTo(x + 0.45 * width, y + 0.5 * height);
    tableCanvasDealer.ctx.closePath();
    tableCanvasDealer.ctx.fill();
  }

  drawDownwardTriangle(tableCanvasDealer, fillStyle = DROPDOWN_TRIANGLE_COLOR) {
    const {
      x, y, width, height,
    } = this.drawBox;
    tableCanvasDealer.ctx.strokeStyle = fillStyle;
    tableCanvasDealer.drawHorizonLine(y + 0.3 * height, x + 0.2 * width, x + 0.8 * width);
    tableCanvasDealer.drawHorizonLine(y + 0.5 * height, x + 0.3 * width, x + 0.7 * width);
    tableCanvasDealer.drawHorizonLine(y + 0.7 * height, x + 0.4 * width, x + 0.6 * width);
  }
  drawSortArrow(tableCanvasDealer, fillStyle = DROPDOWN_TRIANGLE_COLOR){
    const { x, y, width, height, } = this.drawBox;
    tableCanvasDealer.ctx.fillStyle = fillStyle;
    if(this.sortAscOrDesc === 0){ // 向上的箭头
      tableCanvasDealer.ctx.moveTo(x + 0.8 * width, y + 0.4 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.9 * width, y + 0.4 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.9 * width, y + 0.6 * height);
      tableCanvasDealer.ctx.lineTo(x + 1 * width, y + 0.6 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.85 * width, y + 0.8 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.7 * width, y + 0.6 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.8 * width, y + 0.6 * height);
    }
    else if(this.sortAscOrDesc === 1){ // 向下的箭头
      tableCanvasDealer.ctx.moveTo(x + 0.8 * width, y + 0.8 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.9 * width, y + 0.8 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.9 * width, y + 0.6 * height);
      tableCanvasDealer.ctx.lineTo(x + 1 * width, y + 0.6 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.85 * width, y + 0.4 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.7 * width, y + 0.6 * height);
      tableCanvasDealer.ctx.lineTo(x + 0.8 * width, y + 0.6 * height);
    }
    tableCanvasDealer.ctx.closePath();
    tableCanvasDealer.ctx.fill();

  }

}
