import assert from 'assert';
import { describe, it } from 'mocha';
import { getUniqueRefStrArray } from '../../src/component/comp_cell_editor/ref_selector_control_old';

describe('format', () => {
    describe('#render()', () => {
        it('date', function() {
            console.log("...")
        });



        it('test cut', () => {
            // console.log("...")
            let arr = getUniqueRefStrArray("=A1+A2+ADD(A3, A4)+'A7'+1");
            console.log("arr: ", arr);
            let a = ['A1', 'A2', 'A3', 'A4'];
            assert.deepStrictEqual(arr, a);
        });
    });
});
