import { CellVTypeObj, NOT_CONVERT, TO_PARA_TYPE } from '../calc_utils/config';
import { ERROR_VALUE, isValueError } from '../calc_utils/error_config';
import { isValueValid } from '../../global_utils/dataproxy_helper';

// 不能依赖cellV

export class BaseExpFunction { // 默认行为; 如果不符合默认行为的函数，需要继承这个类，然后写相关逻辑。
  constructor(user_function) {
    this.isAllowErrorArg = this.getIsAllowErrorArg();
    this.expFnArgConfig = this.getExpFnArgConfig();
    this.user_function = user_function;
  }

  getIsAllowErrorArg() {
    return false;
  }

  getExpFnArgConfig() { // 默认没有任何配置

  }

  expresionFunc(args) { // 需要实现这个方法
    return this.user_function(...args);
  }

  updateArgArray(args) {
    this.errorArg = undefined // 清空报错信息
    let curArg,
      toTypeName,
      newArgs = [];
    let self = this;
    let solvedArgs = args.map(f => {
      if (typeof f.solveExpression === 'function') {
        return f.solveExpression();
      } else {
        return f;
      }
    }); // 求解参数
    // 对参数进行类型转化
    let newArg
    if (typeof this.expFnArgConfig === 'undefined') { // 没有类型转换方式配置
      newArgs = solvedArgs.map(arg => {
        if (isValueError(arg)) { // 错误的话直接处理
          self.errorArg = arg;
          return arg;
        } else {
          newArg = this.defaultConvert(arg);
          if (newArg instanceof Error === true) {
            self.errorArg = newArg;
          }
          return newArg;
        }
      }); // 默认是把所有的arg转化为数字或字符串
    } else if (this.expFnArgConfig instanceof Array) {// 有类型转化方式配置
      let i = 0,
        curArgConfig;
      for (; i++; i < this.expFnArgConfig.length) {
        curArg = solvedArgs[i];
        curArgConfig = this.expFnArgConfig[i];
        newArg = this.convertCellValueType(curArgConfig, curArg.cellVTypeName, curArg);
        if (newArg instanceof Error === true) {
          self.errorArg = newArg;
        }
        newArgs.push(newArg);
      }
      for (; i++; i < args.length) { // 其他没有配置的参数不做转换
        newArgs.push(args[i]);
      }
    } else {
      throw new Error('expFnArgConfig');
    }
    // 如果newArgs中可能错在错误类型
    return newArgs;
  }

  convertCellValueType(curArgConfig, cellVTypeName, curArg) {
    let newArg,
      toTypeName;
    if (curArgConfig === NOT_CONVERT) { // 设置为不转换
      return curArg;
    }
    if (typeof curArgConfig === 'object') {
      toTypeName = curArgConfig[curArg.cellVTypeName];
    } else if ((typeof curArgConfig === 'string')) {
      toTypeName = curArgConfig;
    } else {
      throw Error('arg_config has wrong type!');
    }
    if (toTypeName === TO_PARA_TYPE.date) {
      newArg = curArg.toDate();
    } else if (toTypeName === TO_PARA_TYPE.number) {
      newArg = curArg.toNumber();
    } else if (toTypeName === TO_PARA_TYPE.string) {
      newArg = curArg.toString();
    } else {
      newArg = curArg;
    }
    return newArg;
  }

  defaultConvert(arg) {
    return this.convertToStringAndNumber(arg);
  }

  convertToStringAndNumber(arg) { // 这个是函数参数默认转换方式; 可以被改写
    let self = this;
    if(typeof arg === "undefined"){
      throw  new Error("arg 类型不正确！")
    }
    if (['string', 'number'].includes(typeof arg)) {
      return arg;
    } else if (arg instanceof Array) {
      return arg.map((elm) => self.convertToStringAndNumber(elm));
    } else {
      return arg.toNumberOrString(); // 转换; 如果遇到其他的一些数据类型会报错
    }
  }

  checkFuncArg(newArgArray) { // 默认状态没有额外检查
    return null;
  }

  isError() {
    if (typeof this.errorArg === 'undefined') {
      return false;
    }
    return (this.errorArg instanceof Error) || (this.errorArg.cellVTypeName === CellVTypeObj.CellVError);
  }

// todo: ['ISBLANK','ISERROR',"ifError"]处理error不返回所碰到的错误
  solveExpression(args) { // 核心的对外接口
    let self = this;
    let newArgArray = self.updateArgArray(args);// 每个arg元素需要调用他的solveExpression方法
    this.checkFuncArg(newArgArray);
    if (this.isError() === false || this.isAllowErrorArg) { // 参数中没有错误的处理
      return this.expresionFunc(newArgArray);
    } else {
      return this.errorArg; // 参数中存在参数一般直接报错
    }
  }
}

export class AllowErrorExpFunction extends BaseExpFunction {
  getIsAllowErrorArg() {
    return true;
  }
}

export class NotConvertExpFunction extends BaseExpFunction {
  defaultConvert(arg) {
    return arg;
  }

  getIsAllowErrorArg() {
    return true;
  }
}


export class StringExpFunction extends BaseExpFunction {
  defaultConvert(arg) {
    if (typeof arg === 'number') {
      return String(arg);
    } else if (typeof arg === 'string') {
      return arg;
    } else if (arg.cellVTypeName === CellVTypeObj.CellVError) {
      return arg;
    }
    return arg.toString(); // 参数需要都转换为string 类型
  }
}

export class NotConvertEmptyExpFunction extends BaseExpFunction { // 空类型不转换，其他按照默认行为来
  defaultConvert(arg) {
    if (arg.cellVTypeName === CellVTypeObj.CellVEmpty) {
      return arg;
    } else if (arg.cellVTypeName === CellVTypeObj.CellVArray) {
      // Excel中对于数组中的CellVBool当成空来处理，但是对于参数中的CellVBool会转化为1，AVERAGE({TRUE,14},TRUE) 结果为 7.5
      return arg.convertToStringAndNumberExceptEmptyBool();
    }
    return this.convertToStringAndNumber(arg);
  }
}

// 只允许纯数字参数
export class OnlyNumberExpFunction extends BaseExpFunction {
  checkFuncArg(newArgArray) {
    if(isValueError(this.errorArg)){ // 已经存在错误了
      return;
    }
    for (let arg of newArgArray) {
      if (typeof arg !== 'number') {
        this.errorArg = new Error(ERROR_VALUE);
      }
    }
  }
}

// 试图转化数字，如果不是数字的话则返回ERROR_VALUE
export class TryConvertToNumberExpFunction extends OnlyNumberExpFunction {
  defaultConvert(arg) {
    let newArg;
    if (arg.isCellV === true) {
      newArg = arg.toNumber()
    }
    else if(typeof arg == "string"){
      newArg = +arg
    }
    else {
      newArg = arg
    }
    return newArg
  }
}
