import { myLog, PRINT_LEVEL3 } from '../log/new_log';


export function distinct(arr) {
    return [...new Set(arr)];
}


function angleFunc(start, end) {
    let diff_x = end.x - start.x,
        diff_y = end.y - start.y;
    return 360 * Math.atan(diff_y / diff_x) / (2 * Math.PI);
}

const positionAngle = (x1, x2, y1, y2) => {
    let angle = 0;
    let af = Math.abs(angleFunc({x: x1, y: y1}, {x: x2, y: y2}));

    if (x1 < x2 && y1 < y2) {
        angle = 1;
    } else if (x1 > x2 && y1 < y2) {
        angle = 2;
    } else if (x1 < x2 && y1 > y2) {
        angle = 3;
    } else if (x1 > x2 && y1 > y2) {
        angle = 4;
    }

    if (angle === 1 && af < 45) {
        angle = 3;
        return angle;
    } else if (angle === 2 && af > 30) {
        angle = 1;
        return angle;
    } else if (angle === 3 && af > 30) {
        angle = 4;
        return angle;
    } else if (angle === 4 && af < 45) {
        angle = 2;
        return angle;
    }

    // if (angle === 2) {
    //     let s1 = h('div', '').css('border', '1px solid').css('height', '1px').css('width', '1px');
    //     let s2 = h('div', '').css('border', '1px solid').css('height', '1px').css('width', '1px');
    //     document.body.appendChild(s1.el);
    //     document.body.appendChild(s2.el);
    //     debugger
    // }
    return angle;
};


function deepCopyObj(obj) {
    myLog.myPrint(PRINT_LEVEL3, obj)
    let result = Array.isArray(obj) ? [] : {};
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                result[key] = deepCopyObj(obj[key]);
            } else {
                result[key] = obj[key];
            }
        }
    }
    return result;
}

export {
    positionAngle,
    deepCopyObj,
}
