/* global window */
export const CSS_PREFIX = 'fin-cell';
export const look = ['*悬浮查看*', '*HYPERLINK*', '*MULTIPLECELLS*'];
export const look2 = '#CHECK！';
export const filterFormula = ['CITY'];
export const OFFSET_LEFT = 60;
export const OFFSET_TOP = 70;

// export const edgeRight = 30;
// export const getDevicePixelRatio = window.devicePixelRatio  || 1;
// export const getDevicePixelRatio = 1;


// ==== 这里是所有的会对calc产生影响的前端事件 ========
export const EVENT_INPUT_FORMULA = 1
export const EVENT_DATA_FORMAT = 2
export const EVENT_RANGE_FORMULA = 3
export const EVENT_MERGE_RANGE = 4
export const EVENT_UN_MERGE_RANGE = 5
export const EVENT_INSERT_RANGE = 6
export const EVENT_DEL_RANGE = 7
export const EVENT_COPY_PASTE = 8
export const EVENT_CUT_PASTE = 9
export const EVENT_INSERT_COPY_PASTE = 10
export const EVENT_INSERT_CUT_PASTE = 11
export const EVENT_DEL_SHEET = 20
export const EVENT_RENAME_SHEET = 21
export const EVENT_ADD_SHEET = 22
export const EVENT_UNDO = 30
export const EVENT_REDO = 31
export const EVENT_NAME_MOUSE_MOVE = 'mousemove';
export const EVENT_NAME_MOUSE_DOWN = 'mousedown';
export const EVENT_MOUSEWHEEL_STOP = 'mousewheel.stop';
export const EVENT_SCROLL_STOP = 'scroll.stop';
export const VERTICAL_SCROLLBAR_BORDER_WIDTH = 1;
export const VERTICAL_SCROLLBAR_WIDTH = 12;
export const VERTICAL_SCROLLBAR_UP_DOWN_MARGIN_HEIGHT = 15;
export const CSS_HEIGHT = 'height';
export const CSS_WIDTH = 'width';
export const VERTICAL_SCROLL_BAR_TOTAL_WIDTH = VERTICAL_SCROLLBAR_BORDER_WIDTH * 2 + VERTICAL_SCROLLBAR_WIDTH;
export const EVENT_WIN_RESIZE = 'resize';
export const EVENT_COPY = 'copy';
export const EVENT_CUT = 'cut';
export const EVENT_PASTE = 'paste';
export const DEFAULT_FOOTER_CONTAINER_HEIGHT = 85;
export const TOOL_BAR_HEIGHT = 41;
export const DEFAULT_ROW_HEADER_HEIGHT = 25;
export const DEFAULT_ROW_HEIGHT = 25;
export const DEFAULT_HEADER_WIDTH = 60;
export const BORDER_STYLE_MEDIUM = 'medium';
export const BORDER_STYLE_THICK = 'thick';
export const BORDER_STYLE_DASHED = 'dashed';
export const BORDER_STYLE_DOTTED = 'dotted';
export const BORDER_STYLE_DOUBLE = 'double';
export const SORT_VALUE_TYPE_EMPTY = 3;
export const SORT_VALUE_TYPE_STR = 2;
export const SORT_VALUE_TYPE_NUM = 1;
export const TABLE_RIGHT_MARGIN = 100;
//       scroll: coreScrollBarProxy,

// 方向
export const DIRECTION_UP = 0;
export const DIRECTION_DOWN = 1;
export const DIRECTION_LEFT = 2;
export const DIRECTION_RIGHT = 3;
export const EVENT_PASTE_VALUE = 'paste-value';
export const EVENT_PASTE_FORMAT = 'paste-format';
export const EVENT_INSERT_ROW = 'changeInsertRowOrCol-row';
export const EVENT_INSERT_COL = 'changeInsertRowOrCol-column';
export const EVENT_DEL_ROW = 'delete-row';
export const EVENT_DEL_COL = 'delete-column';
export const EVENT_DEL_CELL_TEXT = 'delete-cell-text';
export const EVENT_VALIDATION = 'validation';
export const ITEM_DIVIDE = 'divider';
export const RESIZER_DISTANCE = 5;
