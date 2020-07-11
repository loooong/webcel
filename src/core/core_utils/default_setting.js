
export const defaultSettings = {
  view: {
    height: () => document.documentElement.clientHeight,
    width: () => document.documentElement.clientWidth,
  },
  formula: {},
  showGrid: true,
  showToolbar: true,
  showContextmenu: true,
  showEditor: true,
  autoLoad: true,
  ignore: [], // drawBhv中的
  cellWidth: 0, // 行列宽度自适应用到的
  ignoreRi: 0,
  minus: false, // 符号转化为红色的标记
  row: {
    len: 100,
    headerHeight: 25,
  },
  col: {
    len: 26,
    width: 100,
    headerWidth: 60,
    minWidth: 10,
  },
  rowsInit: false,
  style: {
    bgcolor: '#ffffff',
    align: 'left',
    valign: 'middle',
    textwrap: false,
    strike: false,
    flexible: false,
    underline: false,
    autoAdapt: false,
    color: '#0a0a0a',
    font: {
      name: 'Arial',
      size: 10,
      bold: false,
      italic: false,
    },
  },
};
