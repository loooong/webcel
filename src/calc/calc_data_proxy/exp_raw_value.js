"use strict";

import { SYN_RAW_VALUE_NUM } from '../calc_utils/config';

export class RawValue{
    constructor(value){
        this.value = value
        this.unitType = SYN_RAW_VALUE_NUM
    };
    setValue(v) {
        this.value = v;
    };
    solveExpression() {
        return this.value;
    };
};

