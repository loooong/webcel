
import { toUpperCase } from '../../global_utils/func_for_component';
import {
    cuttingByPos,
    isAbsoluteValue,
    value2absolute
} from '../../component/comp_cell_editor/ref_selector_control_old';

export class EditorTextProxyOLD {
    preFormatCell: {text:string, formulas: string}
    inputText: string
    constructor() {
        this.inputText = "";
        this.preFormatCell = {};
        this.ri = -1;
        this.ci = -1;
    }

    setText(text) {
        this.inputText = text;
        return this.getText();
    }

    getText() {
        return this.inputText;
    }
    getTextLength(){
        return this.inputText.length
    }

    recordPreFormatCell(oldCell, {ri = -1, ci = -1} = -1) {
        this.preFormatCell = oldCell;
        this.ri = ri;
        this.ci = ci;
        return this.getOldCell();
    }

    // setRICI(ri, ci) {
    //    this.ri = ri;
    //     this.ci = ci;
    // }

    getOldCell() {
        return this.preFormatCell;
    }

    getRICI() {
        return {
            "ri": this.ri,
            "ci": this.ci,
        };
    }

    isFormula() {
        let inputText = this.getText();

        return inputText.lastIndexOf("=") === 0;
    }

    f4ShortcutKey(pos) {
        let inputText = this.setText(toUpperCase(this.inputText));
        let value = cuttingByPos(inputText, pos, true);
        let value2 = inputText.slice(pos)
        let type = isAbsoluteValue(value, 5);
        let d = "";
        let n = value.split(":")[1];
        if (n) {
            type = isAbsoluteValue(n, 5);
            type = type === 3 ? 6 : type;
            type = type === 12 ? 9 : type;
            type = type === 1 ? 7 : type;
            type = type === 2 ? 8 : type;
        }

        if (type !== false) {
            switch (type) {
                case 13:
                    n = value.split(":")[1];
                    d = value2absolute(n.replace(/\$/g, "")).s1;
                    let text_b = inputText.substring(0, inputText.lastIndexOf(n));
                    inputText = this.setText(text_b + d);
                    break;
                case 12:
                    n = value;
                    d = value2absolute(n.replace(/\$/g, "")).s3;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(n)) + d);
                    break;
                case 11:
                case 10:
                    n = value.split(":")[1];
                    d = value2absolute(n.replace(/\$/g, "")).s3;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(n)) + d);
                    break;
                case 9:
                    n = value.split(":")[1];
                    d = value2absolute(n.replace(/\$/g, "")).s2;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(n)) + d);
                    break;
                case 8:
                    n = value.split(":")[1];
                    d = n.replace(/\$/g, "");
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(n)) + d);
                    break;
                case 7:
                    n = value.split(":")[1];
                    d = value2absolute(n.replace(/\$/g, "")).s1;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(n)) + d);
                    break;
                case 6:
                    n = value.split(":")[1];
                    d = value2absolute(n.replace(/\$/g, "")).s2;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(n)) + d);
                    break;
                case 5:
                    d = value2absolute(value.split(":")[1].replace(/\$/g, "")).s1;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(value)) + d);
                    break;
                case 4:
                    d = value2absolute(value.split(":")[1].replace(/\$/g, "")).s2;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(value)) + d);
                    break;
                case 3:
                    d = value2absolute(value.replace(/\$/g, "")).s2;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(value)) + d);
                    break;
                case 2:
                    d = value.replace(/\$/g, "");
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(value)) + d);
                    break;
                case 1:
                    d = value2absolute(value.replace(/\$/g, "")).s1;
                    inputText = this.setText(inputText.substring(0, inputText.lastIndexOf(value)) + d);
                    break;
            }
        }
        let newPos = inputText.length;
        inputText = this.setText(inputText + value2);
        return {
            "pos": newPos,
            "inputText": inputText
        };
    }
}
