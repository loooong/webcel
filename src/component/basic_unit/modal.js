/* global document */
/* global window */
import { h } from './element';
import Icon from './icon';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { bind, unbind } from '../utils/event_helper';
import { KEY_CODE_ESC } from '../utils/config';

export default class Modal {
  open: boolean
  constructor(title, content, width = '600px') {
    this.title = title;
    this.el = h('div', `${CSS_PREFIX}-modal`).css('width', width).children(
      h('div', `${CSS_PREFIX}-modal-header`).children(
        new Icon('close').on('click.stop', () => this.hide()),
        this.title,
      ),
      h('div', `${CSS_PREFIX}-modal-content`).children(...content),
    ).hide();
      this.open = false;
  }

  show() {
    // dimmer
    this.dimmer = h('div', `${CSS_PREFIX}-dimmer active`);
    document.body.appendChild(this.dimmer.el);
    const { width, height } = this.el.updateDisplayToBlock().box();
    const { clientHeight, clientWidth } = document.documentElement;
    this.el.updateElLTWH({
      left: (clientWidth - width) / 2,
      top: (clientHeight - height) / 3,
    });
    window.xkeydownEsc = (evt) => {
      if (evt.keyCode === KEY_CODE_ESC) {
        this.hide();
      }
    };
      this.open = true;
      bind(window, 'keydown', window.xkeydownEsc);
  }

  hide() {
    this.el.hide();
      this.open = false;
      document.body.removeChild(this.dimmer.el);
    unbind(window, 'keydown', window.xkeydownEsc);
    delete window.xkeydownEsc;
  }
}
