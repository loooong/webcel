import { createDefaultFnCollection } from '../calc_utils/factory_func';

let defaultFnColl = createDefaultFnCollection();
export const allFnObj = defaultFnColl.getAllFnObj() // { abs: ...} -> [{key: "abs"}, {}]
export const emptyWorkbook = {sheets: {sheet1: {A1: {}}}}
export const fnNameArrayWithKey = Object.getOwnPropertyNames(allFnObj).map(f => {return {key: f, title: f}}) // 公式说明
