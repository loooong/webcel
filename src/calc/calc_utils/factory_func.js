import { FnCollection, MultiCollExpFn } from '../calc_data_proxy/exp_fn_collection';
import { fnObjArray } from '../expression_fn/normal_fn';
import * as rawFnObj from '../old_1/raw_fn';

/**
 *
 * @return {MultiCollExpFn}
 */
export function createDefaultFnCollection() { // 创建默认的exp_fn collection类
  let normal_fn_coll = new FnCollection();
  normal_fn_coll.addFnObjArray(fnObjArray);
  let normalFnObj = normal_fn_coll.fnObj; // 从expression_fn/normal_fn获取normalFnObj

  let raw_fn_coll = new FnCollection();
  raw_fn_coll.addFnObj(rawFnObj);
  let resRawFnObj = raw_fn_coll.fnObj; // 从expression_fn/raw_fn获取rawFnObj

  let multiCollExpFn = new MultiCollExpFn(normal_fn_coll, raw_fn_coll);
  return multiCollExpFn;
}
