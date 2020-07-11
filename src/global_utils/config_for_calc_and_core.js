// calc与core两个模块共享的配置项目
// 这是是所有的数据格式
export const TEXT_TO_VALUE_DEFAULT= "default"
export const TEXT_TO_VALUE_NUMBER = "number"
export const TEXT_TO_VALUE_PERCENTAGE = "percentage"
export const TEXT_TO_VALUE_SCI = "scientific"
export const TEXT_TO_VALUE_DATE_TIME = "datetime"
// export const TEXT_TO_VALUE_DATE = "date"
export const TEXT_TO_VALUE_TIME = "time"

export const DELETE = {
  COL: 'DELETE COL',
  ROW: 'DELETE ROW',
};
export const INSERT = {
  COL: 'INSERT COL',
  ROW: 'INSERT ROW',
};
export const CSS_BOTTOM = 'bottom';
/*
 * {
 *  name: ''
 *  freeze: [0, 0],
 *  formats: [],
 *  styles: [
 *    {
 *      bgcolor: '',
 *      align: '',
 *      valign: '',
 *      textwrap: false,
 *      strike: false,
 *      underline: false,
 *      color: '',
 *      format: 1,
 *      border: {
 *        leftSpanElIndex: [style, color],
 *        right: [style, color],
 *        top: [style, color],
 *        bottom: [style, color],
 *      },
 *      font: {
 *        family: 'Helvetica',
 *        size: 10,
 *        bold: false,
 *        italic: false,
 *      }
 *    }
 *  ],
 *  merges: [
 *    'A1:F11',
 *    ...
 *  ],
 *  coreRows: {
 *    1: {
 *      height: 50,
 *      style: 1,
 *      cells: {
 *        1: {
 *          style: 2,
 *          type: 'string',
 *          text: '',
 *          value: '', // cal result
 *        }
 *      }
 *    },
 *    ...
 *  },
 *  coreCols: {
 *    2: { width: 100, style: 1 }
 *  }
 * }
 */
export const FOOTER_CONTAINER_HEIGHT = 80;
