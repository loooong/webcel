/* eslint-disable no-param-reassign */
export function cloneDeep(obj) {

    return JSON.parse(JSON.stringify(obj));
}

// export function isEqualWithUpperCase(v1, v2) {
//     v1 = v1 + "";
//     v2 = v2 + "";
//     v1 = v1.toUpperCase();
//     v2 = v2.toUpperCase();
//
//     return v1 === v2;
// }

export const mergeDeep = (object = {}, ...sources) => {
    sources.forEach((source) => {
        if (source !== null && source !== undefined) {
            Object.keys(source).forEach((key) => {
                const v = source[key];
                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                    object[key] = v;
                } else if (typeof v !== 'function' && !Array.isArray(v) && v instanceof Object) {
                    object[key] = object[key] || {};
                    mergeDeep(object[key], v);
                } else {
                    object[key] = v;
                }
            });
        }
    });
    return object;
};

export function find(arr, str) {
    for (let i = 0; i < arr.length; i++) {
        if (str.indexOf(arr[i]) !== -1) {
            return true;
        }
    }
    return false;
}


export function isOutsideViewRange(y, x, dy, dx, orient) {
    if (orient === 44 && dy - y + 100 > 0) {
        return true;
    } else if (orient === 11 && dx - 100 < 0) {
        return true;
    } else if (orient === 33 && dx - x + 100 > 0) {
        return true;
    } else if (orient === 22 && dy - 100 < 0) {
        return true;
    }
    return false;
}

export function isObjEquals(obj1, obj2) {
    const keys = Object.keys(obj1);
    if (keys.length !== Object.keys(obj2).length) return false;
    for (let i = 0; i < keys.length; i += 1) {
        const k = keys[i];
        const v1 = obj1[k];
        const v2 = obj2[k];
        if (v2 === undefined) return false;
        if (typeof v1 === 'string' || typeof v1 === 'number' || typeof v1 === 'boolean') {
            if (v1 !== v2) return false;
        } else if (Array.isArray(v1)) {
            if (v1.length !== v2.length) return false;
            for (let ai = 0; ai < v1.length; ai += 1) {
                if (!isObjEquals(v1[ai], v2[ai])) return false;
            }
        } else if (typeof v1 !== 'function' && !Array.isArray(v1) && v1 instanceof Object) {
            if (!isObjEquals(v1, v2)) return false;
        }
    }
    return true;
}

export function isValueValid(param) {
    if (typeof param === "undefined") {
        return false;
    }

    if (param === null) {
        return false;
    }

    return param !== null;
}

/*
  objOrAry: obejct or Array
  cb: (value, index | key) => { return value }
*/
export const sum = (objOrAry, cb = value => value) => {
    let total = 0;
    let size = 0;
    Object.keys(objOrAry).forEach((key) => {
        total += cb(objOrAry[key], key);
        size += 1;
    });
    return [total, size];
};

export function rangeReduceIf(minInt, maxInt, initSum, initValue, stopValue, getValueFunc) {
    let curSum = initSum;
    let curValue = initValue;
    let curInt = minInt;
    for (; curInt < maxInt; curInt += 1) {
        if (curSum > stopValue) break;
        curValue = getValueFunc(curInt);
        curSum += curValue;
    }
    // [行ID，行的top值，本行的行高] 或 [列ID，列的left值，本列的宽度]
    return [curInt, curSum - curValue, curValue];
}

export function rangeSum(min, max, getv) {
    let s = 0;
    for (let i = min; i < max; i += 1) {
        s += getv(i);
    }
    return s;
}

export function isNumber(inputData) {
    // if (parseFloat(inputData).toString() === "NaN") {
    //     return false;
    // } else {
    //     return parseFloat(inputData).toString() === "NaN";
    // }
    return parseFloat(inputData).toString() !== "NaN";
}

// function rangeEach(min, max, cb) {
//     for (let i = min; i < max; i += 1) {
//         cb(i);
//     }
// }

export function arrayEquals(a1, a2) {
    if (a1.length === a2.length) {
        for (let i = 0; i < a1.length; i += 1) {
            if (a1[i] !== a2[i]) return false;
        }
    } else return false;
    return true;
}
export function merge(...sources){
    return mergeDeep({}, ...sources)
}
