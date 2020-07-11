"use strict";
import { CellVTypeObj, FORMULA_STATUS, MARK_OBJ } from '../calc_utils/config';
import { RawValue } from './exp_raw_value.js';
import {SUnitRefValue} from './exp_ref_value';
import { SUnitRangeRef } from './exp_range_value.js';
import {
    errorMsgArr,
    errorObj,
    ERROR_SYNTAX,
    ERROR_VALUE,
    ERROR_ERROR
} from '../calc_utils/error_config';
import {
    CellVDateTime,
    CellVEmpty, CellVError, CellVNumber} from '../../internal_module/basic_cell_value';
import { TwoArgOperatorColl } from './operator_coll';
import {MatrixValue} from './basic_matrix';
import {UserFnExecutor} from './exp_fn_executor';
import { CellVArray, convertToCellV } from '../cell_value_type/complex_celll_value';
import { myLog, PRINT_LEVEL3 } from '../../log/new_log';

let exp_id = 0; // 全局变量
/**
 * @property {CalcCell} calcCell
 */
export class StructuralExp {
    // 代表语法树上面的一个节点。这个几点的args是代表树枝，
    // 可以为RawValue，SUnitRefValue，LazyValue或字符或FormulaExp; 存在括号的时候，会把括号内的表达式构造为FormulaExp
    constructor(calcCell) {
        this.id = ++exp_id;   // id 是一个递增序列，其中root_exp的id为1
        this.args = []; // 一个表达式下面的多个平行的节点。例如“1+average(A1:A5)-23 * 123” 有4个平行节点
        this.name = 'Expression';
        this.calcCell = calcCell;
        this.last_arg = "";
        this.twoArgOperator = new TwoArgOperatorColl()
        this.isRoot = false
    }

    isEmpty(value) {
        return value === undefined || value === null || value === "";
    }

    hasSolveExpressionMethod(obj) {
        let res = typeof obj.solveExpression === 'function'
        console.log(typeof obj.solveExpression)
        return res
    }
    execCalcMethod(obj){
        if(this.hasSolveExpressionMethod(obj)){
            return obj.solveExpression()
        }
        else {
            throw errorObj.ERROR_SYNTAX
        }
    }

    exeOperatorForArrayAndSingle(a,b,op){ // 如果是矩阵参与运算做特殊处理
        let arg, newArg
        let hasMatrix = false
        for(arg of [a,b]) { // 有任何一个是矩阵，会执行矩阵运算
            if (arg instanceof Array || arg instanceof MatrixValue || arg instanceof CellVArray) {
                // newArg = new CellVArray(arg)
                hasMatrix = true
                break
            }
        }
        // 矩阵运算的分支
        if(hasMatrix){
            return new CellVArray(a).exeElementOperator(new CellVArray(b), op) // 都转换为cellVArray
        }
        // 单值函数的分支
        let theFunc = this.twoArgOperator.getFunc(op)
        let res = new UserFnExecutor(theFunc, [a,b]).solveExpression()
        return res// todo： 需要修改

    }

    execOperatorsWith2Args(operators, args) { // 优先级一样的运算符按照从左到右的顺序运算
        for (let i = 0; i < args.length; i++) {
            if (operators.includes(args[i])) {
                try {
                    let preSolution = this.execCalcMethod(args[i-1])
                    let postSolution = this.execCalcMethod(args[i+1])
                    let r = this.exeOperatorForArrayAndSingle(preSolution, postSolution,args[i]);// 这里存在递归
                    args.splice(i - 1, 3, new RawValue(r));
                    i--;
                } catch (e) { // 上面一旦出现错误，就直接跳出了
                    console.log("execOperatorsWith2Args 计算错误",e);
                    throw e
                }
            }
        }
    }

    exec_minus(args) { // =1.1^-12；=1.1*-12 在负号之前有其他运算符
        for (let i = args.length; i--;) {
            if (args[i] === '-') {
                // 首个字符就是负号或者在负号之前有其他运算符(args[i - 1] === 'string')
                if(i === 0 || (i > 0 && typeof args[i - 1] === 'string')) {
                    let nextSolution = this.execCalcMethod(args[i+1])
                    args.splice(i, 2, new RawValue( -nextSolution));// 替换2个原有arg
                }
            }
        }
    }

    exec_plus(args){
        if (args[0] === '+') { // 第一个运算符符就是加号
            let r = this.execCalcMethod(args[1]); // 这里存在递归
            args.splice(0, 2, new RawValue(r));
        }
    }

    /**
     * 预处理refValue类型的数值
     * @return {*|Error}
     */
    dealAllRefValue(){
        let self = this;
        let args = self.args.concat(); // 应该使用来做个浅复制
        try {
            for (let i = 0; i < args.length; i++) { // 遍历所有的参数
                if (args[i] instanceof SUnitRefValue) { // 属于引用的字符串
                    //=A0形式参数报错
                    if (args[i].str_expression.slice(1, args[i].str_expression.length) === '0') {
                        return errorObj.ERROR_NAME;
                    }
                }
            }
        } catch (e) {
            console.log(e)
            throw e
        }
    }

    // :,%这两个运算符在解析的时候就执行了
    exeAllTwoArgOperator(args) { // 根据优先级顺序来计算
        this.execOperatorsWith2Args(['^'], args);
        this.execOperatorsWith2Args(['/',"*"], args);
        this.execOperatorsWith2Args(['+','-'], args);
        this.execOperatorsWith2Args(['&'], args);
        this.execOperatorsWith2Args(['<','>','>=','<=','<>','='], args);
    }

    calcLastArg(arg){
        if(typeof arg === "string"){ // 所有的operator都已经处理完毕，因此这里arg不应该存在string 类型
            return  new Error(ERROR_SYNTAX)
        }
        if (typeof (arg.solveExpression) !== 'function' || arg.cellStatus === FORMULA_STATUS.solved) {
            /**
             * @type {CalcCell} arg
             */
            return arg.cellObj.v;
        } else {
            let res = arg.solveExpression()
            return this.convertToFinalValue(res)
        }
    }

    convertToFinalValue(res){
        let res2 = convertToCellV(res); // 确保返回的都是封装过的值
        // 最终单元格返回的值中需要转化CellVEmpty
        if(this.isRoot === true && res2.cellVTypeName === CellVTypeObj.CellVEmpty){
            res2 = new CellVNumber(0)
        }
        return res2
    }

    solveExpression() { // 核心方法
        let self = this;
        this.dealAllRefValue()
        self.workingArgs = self.args.concat(); // 应该使用来做个浅复制
        try{
            // 以下是依次执行各个运算符，最优先的运算符在最上面
            this.exec_minus(self.workingArgs); // 执行负号运算
            this.exec_plus(self.workingArgs); // 执行第一个加号
            this.exeAllTwoArgOperator(self.workingArgs); // 负号在这一步会有问题
            if(this.calcCell.cellID === 110){
                // debugger
                console.log("")
            }
            if (self.workingArgs.length === 1) {
                myLog.myPrint(PRINT_LEVEL3, self.workingArgs)
                return this.calcLastArg(self.workingArgs[0]) // 计算最后一个值; 返回的都是CellV
            }
        }
        catch (e) {
            return new CellVError(new Error(ERROR_ERROR)) // 计算遇到错误就范围ERROR_ERROR错误
        }
    };

    isDirectUseRangeRef(){
        return Array.isArray(this.args) //  "=A1:A2" 这样的公式，直接使用区域引用
        && this.args.length === 1
        && this.args[0] instanceof SUnitRangeRef
    }

    update_cell_value() { // 这个方法是用来更新cellObj.v，而solve_expression只会获取运算结果而不会赋值
        let self = this;
        let curCellObj = this.calcCell.cellObj;
        try {
            if (this.isDirectUseRangeRef()) {
                curCellObj.v = new CellVError(new Error(ERROR_VALUE))
            }
            else{
                curCellObj.v = self.solveExpression(); // 计算数值
            }

            if (typeof (curCellObj.v) === 'string') {
                curCellObj.t = 's';
            } else if (typeof (curCellObj.v) === 'number') {
                curCellObj.t = 'n';
            }
        } catch (e) {
            if (errorMsgArr.indexOf(e.message) !== -1) {
                curCellObj.t = 'e';
                curCellObj.w = e.message; // todo: 把.w 属性改为  .text属性， cell使用calcCell实例而不是单纯的obj
                curCellObj.v = new CellVError(new Error(ERROR_VALUE)); // 出错的话，v属性应该没有用了把
            } else {
                throw e;
            }
        }
    }
}

