import {FinElement, h} from '../basic_unit/element';
// import {CSS_PREFIX} from '../../global_utils/config_for_core_and_component';
const CSS_PREFIX = 'fin-cell';
export class Dropdown extends FinElement {
    constructor(title, width, showArrow, placement, {type, change, arrowChange, historyBorder}, ...children) {
        super('div', `${CSS_PREFIX}-dropdown ${placement}`);

        this.title = title;
        this.change = () => {
        };
        if (typeof title === 'string') {
            this.title = h('div', `${CSS_PREFIX}-dropdown-title`).appendChildByStrOrEl(title);
        } else if (showArrow) {
            this.title.addClass('arrow-left');
        }
        this.contentEl = h('div', `${CSS_PREFIX}-dropdown-content`)
            .children(...children)
            .css('width', width)
            .hide();

        if (type) {
            this.headerEl = h('div', `${CSS_PREFIX}-dropdown-header`).on('click', change);
            this.headerEl.children(
                this.title,
                showArrow ? h('div', `${CSS_PREFIX}-icon arrow-right_d`).appendChildByStrOrEl(
                    h('div', `${CSS_PREFIX}-icon-img arrow-down`).on('click.stop', (evt) => {
                        arrowChange(historyBorder);
                        if (this.contentEl.css('display') !== 'block') {
                            this.updateDisplayToBlock();
                        } else {
                            this.hide();
                        }
                    }),
                ) : '',
            );
            this.children(this.headerEl, this.contentEl);
        } else {
            this.headerEl = h('div', `${CSS_PREFIX}-dropdown-header`);
            this.headerEl.on('click', () => {
                if (this.contentEl.css('display') !== 'block') {
                    this.updateDisplayToBlock();
                } else {
                    this.hide();
                }
            }).children(
                this.title,
                showArrow ? h('div', `${CSS_PREFIX}-icon arrow-right`).appendChildByStrOrEl(
                    h('div', `${CSS_PREFIX}-icon-img arrow-down`),
                ) : '',
            );
            this.children(this.headerEl, this.contentEl);
        }
    }

    setTitle(title) {
        this.title.updateInnerHtml(title);
        this.hide();
    }

    updateDisplayToBlock() {
        const {contentEl} = this;
        contentEl.updateDisplayToBlock();
        this.parent().active();
        this.parent().bindClickOutside(() => {
            this.hide();
        });
    }

    hide() {
        this.parent().active(false);
        this.contentEl.hide();
        this.parent().unbindClickoutside();
    }
}
