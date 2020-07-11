// gobal var
import { getIntOfDevicePixel, getGridLineWidth } from '../comp_table/table_canvas_comp';

export const CELL_PADDING_WIDTH = 2;
export const TABLE_GRID_STYLE_OBJ = {
  fillStyle: '#fff',
  lineWidth: getGridLineWidth,
  strokeStyle: 'rgb(228,228,229)',
  // strokeStyle: '#e6a75f', // 先用这个颜色

};

// export const TABLE_FIXED_HEADER_BG_COLOR_STYLE = { fillStyle: '#f4f5f8' };
export const TABLE_FIXED_HEADER_BG_COLOR_STYLE = { fillStyle: 'rgb(230,230,230)' };
export const TABLE_LEFT_TOP_TRIANGLE_BG_COLOR_STYLE = { fillStyle: 'rgb(180,180,180)' };


export function TABLE_HEADER_STYLE_OBJ() {
  return {
    textAlign: 'center',
    textBaseline: 'middle',
    // font: `500 ${getIntOfDevicePixel(12)}px Source Sans Pro`,
    font: `500 ${getIntOfDevicePixel(12)}px sans-serif`,
    fillStyle: 'rgb(0,0,0)', // 字体颜色
    lineWidth: getGridLineWidth(),
    strokeStyle: TABLE_HEADER_GRID_COLOR1, // 线条颜色
  };
}
export const TABLE_HEADER_GRID_COLOR1 = 'rgba(0,0,0)' // 宽度是0.5，颜色可能更淡
export const TABLE_HEADER_GRID_COLOR0 = 'rgb(207,207,207)'
export const TABLE_HEADER_GRID_COLOR_SELECTED = 'rgb(120,120,120)'

export const TABLE_HEADER_HIGHLIGHT_STYLE = {
  fillStyle: 'rgb(210,210,210)'
}

export const TABLE_HEADER_HIGHLIGHT_TEXT_STYLE = {
  fillStyle: 'rgb(33,115,70)'
}

export const TABLE_HEADER_IN_FILTER_TEXT_STYLE = {
  fillStyle: 'rgb(0,0,255)'
}
