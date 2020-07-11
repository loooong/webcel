import {
  ABS_SINGLE_REF_PATTERN,
  BLANK_PATTERN,
  COL_ABS_SINGLE_REF_PATTERN,
  OPERATOR_PATTERN,
  RANGE_REF_PATTERN,
  ROW_ABS_SINGLE_REF_PATTERN,
  SINGLE_REF_PATTERN,
  str2Re
} from '../../global_utils/config_reg_pattern';
import { CoreSheet } from '../../core/core_data_proxy/core_sheet_change';
import { EditingCalcCell } from '../../calc/calc_data_proxy/calc_cell';
import { A1 } from '../../calc/calc_utils/config';

export class EditingCellProxy{ // 之后放到core_data_proxy中去
  wholeFormula: string
  coreSheet: CoreSheet
  editingCalcCell: EditingCalcCell
  constructor(wholeFormula, ri, ci, coreSheet) {
    this.coreSheet = coreSheet
    this.sheetName = this.coreSheet.name
    this.ri = ri
    this.ci = ci
    this.updateRefArrayByNewStr(wholeFormula)
  }

  getRefUnitArrayByType(refType = A1){
    return  this.refUnitArrayObj[refType]
  }

  getRefStrArrayByType(refType){
    let theUnitArray = this.getRefUnitArrayByType(refType)
    return theUnitArray.map(theUnit => theUnit.wholeStr)
  }

  updateRefArrayByNewStr(wholeFormula) {
    this.wholeFormula = wholeFormula
    this.editingCalcCell = this.coreSheet.calc.calcWorkbookProxy.createAEditingCell(
      this.sheetName,this.ri, this.ci, wholeFormula)
    this.editingCalcCell.execFormula()
    this.refUnitArrayObj = this.editingCalcCell.rootSyntaxUnit.getRefUnitArrayObj() // 引用语法单元
  }
}

export function getUniqueRefStrArray(wholeStr, filter = false, f = false) {
  wholeStr = wholeStr + ''; // wholeStr 转化为string
  wholeStr = wholeStr.toUpperCase(); // str转化为大写
  if (wholeStr[0] !== '=') { // 如果第一个字符不是 = ， 直接退出
    return [];
  }

  // 把空格去除的原因是因为 => A   1 这种情况不应该被包含在内
  // wholeStr = wholeStr.replace(/\s/g, "");
  let splitByOperatorArray = wholeStr.split(str2Re(OPERATOR_PATTERN)); // 使用运算符进行切割

  // 去除字符串两端的空格
  for (let i = 0; i < splitByOperatorArray.length; i++) {
    splitByOperatorArray[i] = splitByOperatorArray[i].replace(str2Re(BLANK_PATTERN), '');
  }

  // 后面的splitByOperatorArray的元素中不含有空格
  let uniqueRefStrArray = [];
  let index = 0;
  splitByOperatorArray.filter(splitStr => {
    let isOutsideParent = true;
    if (splitByOperatorArray.length > index + 1) {
      let s2 = splitByOperatorArray[index + 1];
      if (s2.includes('(')) {
        isOutsideParent = false;
      }
    }

    // if(ri.search(str2Re(letterOperatorIgnoreBracket)) === -1) {
    if (f && isOutsideParent) {
      splitStr = splitStr.replace(/\$/g, '');// 去掉&符号
      if (splitStr.search(str2Re(SINGLE_REF_PATTERN)) !== -1
        || splitStr.search(str2Re(RANGE_REF_PATTERN)) !== -1) {
        if (uniqueRefStrArray.includes(splitStr) === false) {
          uniqueRefStrArray.push(splitStr);
        }
      }
    } else if (isOutsideParent) {
      if (splitStr.search(str2Re(SINGLE_REF_PATTERN)) !== -1 || splitStr.search(str2Re(ABS_SINGLE_REF_PATTERN)) !== -1
        || splitStr.search(str2Re(ROW_ABS_SINGLE_REF_PATTERN)) !== -1 || splitStr.search(str2Re(COL_ABS_SINGLE_REF_PATTERN)) !== -1) {
        if (uniqueRefStrArray.indexOf(splitStr) === -1 || filter === true) {
          uniqueRefStrArray.push(splitStr);
        }
      } else {
        let is = splitStr.replace(/\$/g, '');
        if (is.search(str2Re(RANGE_REF_PATTERN)) !== -1) {
          uniqueRefStrArray.push(splitStr);
        }
      }
    }
    // }
    index = index + 1;
  });

  return uniqueRefStrArray;
}

const cutting = (str) => {
  let express = [];
  for (let i = 0; i < str.length; i++) {
    if (str[i]) { // 非空就会加入数组
      express.push(str[i]);
    }
  }
  return express;
};
const isSheetVale = (str) => {
  str = str.toUpperCase();
  if (str.search(/[\u4E00-\u9FA50-9a-zA-Z]+![A-Za-z]+\$\d+/) !== -1) {
    return true;
  }
  if (str.search(/[\u4E00-\u9FA50-9a-zA-Z]+!\$[A-Za-z]+\d+/) !== -1) {
    return true;
  }
  if (str.search(/[\u4E00-\u9FA50-9a-zA-Z]+!\$[A-Za-z]+\$\d+/) !== -1) {
    return true;
  }
  // if (str.search(/[\u4E00-\u9FA50-9a-zA-Z]+![A-Za-z]+\d+/) !== -1)
  //     return true;
  return str.search(/[\u4E00-\u9FA50-9a-zA-Z]+![A-Za-z]+\d+/) !== -1;
};
const isAbsoluteValue = (str, rule = 1) => {
  str = str.toUpperCase();
  if (rule === 1) {
    if (str.search(/^\$[A-Z]+\$\d+$/) !== -1) {
      return 3;
    }
    if (str.search(/^\$[A-Z]+\d+$/) !== -1) {
      return 1;
    }
    if (str.search(/^[A-Z]+\$\d+$/) !== -1) {
      return 2;
    }
    return false;
  } else if (rule === 3) {
    if (str.search(/^\$[A-Z]+\$\d+$/) !== -1) {
      return true;
    }
    if (str.search(/^[A-Z]+\d+$/) !== -1) {
      return true;
    }
    if (str.search(/^\$[A-Z]+\d+$/) !== -1) {
      return true;
    }

    return str.search(/^[A-Z]+\$\d+$/) !== -1;
  } else if (rule === 4) {
    if (str.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) {
      return true;
    }
  } else if (rule === 5) {
    if (str.search(/^[A-Z]+\d+:\$[A-Z]+\d+$/) !== -1) {
      return 8;
    }
    if (str.search(/^[A-Z]+\d+:[A-Z]+\$\d+$/) !== -1) {
      return 9;
    }
    if (str.search(/^[A-Z]+\$\d+:[A-Z]+\d+$/) !== -1) {
      return 10;
    }
    if (str.search(/^\$[A-Z]+\d+:[A-Z]+\d+$/) !== -1) {
      return 11;
    }
    if (str.search(/^\$[A-Z]+\$\d+$/) !== -1) {
      return 3;
    }
    if (str.search(/^[A-Z]+\d+$/) !== -1) {
      return 12;
    }
    if (str.search(/^[A-Z]+\d+:[A-Z]+\d+$/) !== -1) {
      return 13;
    }
    if (str.search(/^\$[A-Z]+\d+$/) !== -1) {
      return 1;
    }
    if (str.search(/^[A-Z]+\$\d+$/) !== -1) {
      return 2;
    }
    if (str.search(/^[A-Z]+\$\d+:[A-Z]+\$\d+$/) !== -1) {
      return 4;
    }
    if (str.search(/^[A-Z]+\$\d+:\$[A-Z]+\d+$/) !== -1) {
      return 5;
    }
    if (str.search(/^\$[A-Z]+\d+:[A-Z]+\$\d+$/) !== -1) {
      return 6;
    }
    if (str.search(/^\$[A-Z]+\d+:\$[A-Z]+\d+$/) !== -1) {
      return 7;
    }
    return false;
  } else if (rule === 6) {
    str = str.replace(/\$/g, '');
    return str.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1;
  } else {
    if (str.search(/^[A-Za-z]+\d+$/) !== -1) {
      return true;
    }

    return str.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1;
  }
};
const splitStr = (str) => {
  let arr = str.split(/([(-\/,+，*\s=^&])/);
  let arr2 = [];
  for (let i = 0; i < arr.length; i++) {
    let enter = 1;
    if (arr.length > i + 1) {
      let s2 = arr[i + 1];
      if (arr[i] === '(') {
        enter = 3;
      } else if (s2.indexOf('(') !== -1) {
        enter = 2;
      }
    }

    if (enter !== 3) {
      if (enter === 2) {
        arr2.push(arr[i] + '(');
      } else {
        arr2.push(arr[i]);
      }
    }
  }


  return arr2;
};
const cutting2 = (str) => {
  let arr = str.split(/([(-\/,+，*\s=^&])/);

  let color = 0;
  let express = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      express.push(arr[i]);
    }
  }

  let colors = [];
  for (let i = 0; i < express.length; i++) {
    let s = express[i].toUpperCase();
    let enter = true;
    if (express.length > i + 1) {
      let s2 = express[i + 1];
      if (s2.indexOf('(') !== -1) {
        enter = false;
      }
    }

    if ((s.search(/^[A-Z]+\d+$/) !== -1
      || s.search(/^\$[A-Z]+\$\d+$/) !== -1
      || s.search(/^[A-Z]+\$\d+$/) !== -1 || s.search(/^\$[A-Z]+\d+$/) !== -1
      || s.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1) && enter) {
      for (let i2 = 0; i2 < express[i].length; i2++) {
        colors.push({
          'code': color,
          'data': express[i][i2],
        });
      }
      color = color + 1;
    } else {
      let sc = s.replace(/\$/g, '');
      if (sc.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) !== -1 && enter) {
        for (let i2 = 0; i2 < express[i].length; i2++) {
          colors.push({
            'code': color,
            'data': express[i][i2],
          });
        }
        color = color + 1;
      } else {
        for (let i2 = 0; i2 < express[i].length; i2++) {
          colors.push({
            "code": -1,
            "data": express[i][i2],
          });
        }
      }
    }

  }

  return colors;
};
export { cutting2 };
export { splitStr };
export { isAbsoluteValue };
export { isSheetVale };
export { cutting };// A1 => A1:A1
// 存在的原因是 不过滤 空格
const operator = [
  '+', '-', '*', '/', '&', '^', '(', ',', '=', ' ', ' ', '，'
];
const operator3 = [
  '+', '-', '*', '/', '&', '^', '(', ',', '=', ' ', '，'
];
const operator2 = [
  '+', '-', '*', '/', '&', '^', '(', ',', '=', ')', '，'
];
const isOperator = (s) => {
  let isInclude = operator.includes(s);
  return isInclude ? 1 : 0;
};
const operation3 = (s) => {
  for (let i = 0; i < operator.length; i++) {
    if (operator3[i] === s) {
      return 1;
    }
  }
  return 0;
};
const operation2 = (s) => {
  for (let i = 0; i < operator2.length; i++) {
    if (operator2[i] === s) {
      return 1;
    }
  }
  return 0;
};
const value2absolute = (str) => {
  let s1 = '',
    enter = false;
  for (let i = 0; i < str.length; i++) {
    if (enter === false && str[i] * 1 >= 0 && str[i] * 1 <= 9) {
      s1 += '$';
      enter = true;
    }
    s1 += str[i];
  }

  return {
    s1: s1,
    s2: '$' + str,
    s3: '$' + s1
  };
};

function changeFormula(cut) {
  for (let i = 0; i < cut.length; i++) {
    let c = cut[i];
    if (c.search(/^[A-Za-z]+\d+:[A-Za-z]+\d+$/) === -1) {
      cut[i] = `${c}:${c}`;
    }
  }
  return cut;
}

export function isLegal(str) {
  const left = 0;
  const right = 1;
  const other = 2;
  //判断括号是左边还是右边，或者其他
  let verifyFlag = function (char) {
    if (char === '(' || char === '[' || char === '{' || char === '/*') {
      return left;
    } else if (char === ')' || char === ']' || char === '}' || char === '*/') {
      return right;
    } else {
      return other;
    }
  };
  //判断左右括号是否匹配
  let matches = function (char1, char2) {
    return (char1 === '(' && char2 === ')')
      || (char1 === '{' && char2 === '}')
      || (char1 === '[' && char2 === ']')
      || (char1 === '/*' && char2 === '*/');
  };
  //入口
  let leftStack = [];
  if (str !== null || str !== '' || str !== undefined) {
    for (let i = 0; i < str.length; i++) {
      //处理字符
      let char = str.charAt(i);
      if (verifyFlag(char) === left) {
        leftStack.push(char);
      } else if (verifyFlag(char) === right) {
        //如果不匹配，或者左括号栈已经为空，则匹配失败
        if (leftStack.length === 0 || !matches(leftStack.pop(), char)) {
          return false;
        }
      } else {
      }
    }
    //循环结束，如果左括号栈还有括号，也是匹配失败

    return leftStack.length === 0;
  }
}

const cutFirst = (str) => {
  let s = '';
  for (let i = 0; i < str.length; i++) {
    if (operation2(str[i])) {
      return s;
    }
    s += str[i];
  }
  return s;
};
const cuttingByPos = (str, pos, space = true) => {
  let value = '';
  let end = false;
  for (let i = pos - 1; i > 0 && end === false; i--) {
    if (space === false) {
      end = operation3(str[i]) === 1;
    } else {
      end = isOperator(str[i]) === 1;
    }
    if (end === false) {
      value += str[i];
    }
  }
  if (space) {
    value = value.replace(/\s/g, '');
  }
  value = value.split('')
    .reverse()
    .join('');
  return value.toUpperCase();
};
const cuttingByPos2 = (str, pos, space = true) => {
  let value = '';
  let end = false;
  for (let i = pos - 1; i > 0 && end === false; i--) {
    if (space === false) {
      end = operation3(str[i]) === 1;
    } else {
      end = isOperator(str[i]) === 1;
    }
    if (end === false) {
      value += str[i];
    }
  }
  if (space) {
    value = value.replace(/\s/g, '');
  }
  value = value.split('')
    .reverse()
    .join('');
  return value;
};
const getCurSyntaxUnitUpperCase = (wholeStr, pos) => {
  let value = '';
  let end = false;
  for (let i = pos - 1; i < wholeStr.length && end === false; i++) {
    end = isOperator(wholeStr[i]) === 1; // end是一个标志位，推测是代表一个语法单位是否结束
    if (end === false && wholeStr[i] !== ')') { // todo： 这个右括号可能不对
      value += wholeStr[i];
    }
  }
  return value.toUpperCase();
};
export { getCurSyntaxUnitUpperCase };
export { cuttingByPos2 };
export { cuttingByPos };
export { cutFirst };
export { changeFormula };
export { value2absolute };
export { operation3 };
export { isOperator };
export { operator };
