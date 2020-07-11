import { CoreSheetSetting } from '../core/core_data_proxy/core_sheet_proxy';
import {
  SORT_ASC,
  SortFilterSetting,
  TEXT_FILTER_IN
} from '../core/core_data_proxy/core_sort_filter';
import {
  TEXT_TO_VALUE_DATE_TIME,
  TEXT_TO_VALUE_NUMBER,
  TEXT_TO_VALUE_PERCENTAGE
} from './config_for_calc_and_core';
import { sampleRowID2RowObj, sampleRowID2RowObjJust2 } from './sampleRowID2RowObj';


const sampleStyles = [{ // ID = 0
  'bgcolor': 'rgb(197,217,241)',
  'textwrap': true,
  'color': 'rgb(255,0,255)',
  'underline': true,
  'strike': true,
  fontConfig: {
    'name': '微软雅黑',
    'size': 9.0,
    'bold': true,
    'italic': false
  },
  'border': {
    topBorder: {
      style: 'dash',
      color: 'green'
    }
  },
  'valign': 'middle'
},
  {// ID = 1
    'bgcolor': 'rgb(197,217,241)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '"Helvetica Neue", PingFangSC-Regular, "Microsoft YaHei", "Helvetica Neue", "Myriad Pro", "Hiragino Sans GB", "Lucida Grande", sans-serif',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {
      leftBorder: {
        style: 'dash',
        color: 'rgb(255,123,255'
      }
    },
    'align': 'center',
    'valign': 'middle'
  },
  {// ID = 2
    'bgcolor': 'rgb(197,217,241)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': 'Helvetica Neue',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': 'Helvetica Neue',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(252,213,180)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(252,213,180)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(252,213,180)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(252,213,180)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(141,180,226)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'center',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(197,217,241)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(196,215,155)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(197,217,241)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': true,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'right',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'right',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'align': 'right',
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
  {
    'bgcolor': 'rgb(255,255,255)',
    'textwrap': false,
    'color': 'rgb(0,0,0)',
    'underline': false,
    'strike': false,
    fontConfig: {
      'name': '微软雅黑',
      'size': 9.0,
      'bold': false,
      'italic': false
    },
    'border': {},
    'valign': 'middle'
  },
];
const sampleCols = {
  0: { 'width': 78 },
  1: { 'width': 107 },
  2: { 'width': 138 },
  3: { 'width': 118 },
  4: { 'width': 108 },
  5: { 'width': 109 },
  6: { 'width': 120 },
  7: { 'width': 104 },
  8: { 'width': 99 },
  9: { 'width': 101 },
  10: { 'width': 106 },
  11: { 'width': 99 },
  12: { 'width': 92 },
  13: { 'width': 100 }
};

const sampleMergeLocArray = ['11_1_13_1', '9_2_10_3', '10_4_11_5'];
const sampleSortFilterSetting = new SortFilterSetting(
  {
    refA1A2Str: 'A1:H9',
    filterArray: [{
      filterColID: 2,
      filterExpr: TEXT_FILTER_IN,
      allowValues: ['0.25', '剩余期限','25%','17.0521','9.71233']
    }],
    sortConfig: {
      sortColID: 1,
      sortOrder: SORT_ASC
    }
  }
);
const sampleRowConfig = {
  len: 100,
  headerHeight: 22,
  defaultRowHeight: 25,
  minHeight: 20
};

const sampleCellLoc2TextToValueConfig = {
  '1_0': {
    valueToTextType: TEXT_TO_VALUE_DATE_TIME,
    nonOrMinuteOrSecond: 1,
    hour12: false,
  },

  '1_1': {
    valueToTextType: TEXT_TO_VALUE_PERCENTAGE,
    digitNumber: 2, // 小数点位数
    hasComma: false, // 无，或千分位，或百分比
    isMinusAsParen: true, // 负号是否用括号表示
    prefix: '￥',// 货币符号
    nonOrMinuteOrSecond: 1,
    hour12: false,
  },
  '1_2': {
    valueToTextType: TEXT_TO_VALUE_PERCENTAGE,
    digitNumber: 0, // 小数点位数
  },
  '3_3': {
    valueToTextType: TEXT_TO_VALUE_PERCENTAGE,
    digitNumber: 3, // 小数点位数
  },
  '5_3': {
    valueToTextType: TEXT_TO_VALUE_NUMBER,
    digitNumber: 3, // 小数点位数
    prefix: '￥',// 货币符号
  },
  '6_3': {
    valueToTextType: TEXT_TO_VALUE_NUMBER,
    digitNumber: 1, // 小数点位数
    prefix: '$',// 货币符号
    isMinusAsParen: true, // 负号是否用括号表示
  },
  '7_3': {
    valueToTextType: TEXT_TO_VALUE_NUMBER,
    digitNumber: 3, // 小数点位数
    prefix: 'RMB',// 货币符号
  },
  '5_11':{
    valueToTextType: TEXT_TO_VALUE_NUMBER,
    digitNumber: 1, // 小数点位数
    prefix: '$',// 货币符号
    isMinusAsParen: true, // 负号是否用括号表示

  }




};
export const sampleCoreSheetSetting = new CoreSheetSetting();
const sampleSettingID = 0

if(sampleSettingID === 0){
  sampleCoreSheetSetting.cellStyleArray = sampleStyles;
  sampleCoreSheetSetting.rowID2RowObj = sampleRowID2RowObj;
  sampleCoreSheetSetting.colID2ColObj = sampleCols;
  sampleCoreSheetSetting.mergeLocArray = sampleMergeLocArray;
  sampleCoreSheetSetting.sortFilterSetting = sampleSortFilterSetting;
  sampleCoreSheetSetting.rowConfig = sampleRowConfig;
  sampleCoreSheetSetting.cellLoc2TextToValueConfig = sampleCellLoc2TextToValueConfig;
} else{
  sampleCoreSheetSetting.cellStyleArray = sampleStyles;
  sampleCoreSheetSetting.rowID2RowObj = sampleRowID2RowObjJust2;
  sampleCoreSheetSetting.colID2ColObj = sampleCols;
  sampleCoreSheetSetting.mergeLocArray = sampleMergeLocArray;
  sampleCoreSheetSetting.sortFilterSetting = new SortFilterSetting();
  sampleCoreSheetSetting.rowConfig = sampleRowConfig;
  sampleCoreSheetSetting.cellLoc2TextToValueConfig = sampleCellLoc2TextToValueConfig;
}


export const freezeSettings = {
  freezeRiCi: [1, 1],
  showFreeze: true,
  showEditor: true,
  rowsInit: true,
  footerContainerHeight: 85,
  showGrid: true,
  showToolbar: true,
  minus: false,

  styles: sampleStyles,
  rows: sampleRowID2RowObj,
  cols: sampleCols
};
