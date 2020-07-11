import { h } from '../basic_unit/element';
import { CellRangeProxy } from '../../internal_module/cell_range';
import { CSS_PREFIX } from '../../global_utils/config_for_core_and_component';
import { WinResizeBhv } from '../external/resize';
import { CoreTableProxy } from '../../core/core_data_proxy/table_proxy';
import { WinDragBhv } from '../external/drag';
import { SheetComp } from '../a_top_comp/sheet_comp';

export class ResizeOption{
  onBegin(data) {
  }

  onEnd(data) {

  }
  onResize(data, self) {
    let img = self.copyBhv.getChooseImg();
    if (!img) {
      return;
    }

    img.img2.style['width'] = img.img.el.style['width'];
    img.img2.style['height'] = img.img.el.style['height'];
  }

}
export class DragOption{
  onBegin(data) {
  }
  onEnd(data, sheetComp: SheetComp) { // todo: 感觉有问题，需要优化
    let { left, top } = data;
    let img =  sheetComp.copyBhv.getChooseImg();
    if (!img) {
      return;
    }
    // img.leftSpanElIndex = leftSpanElIndex + 70;
    // img.top = top + 31;

    if (top - 31 < 0) {
      top = 0;
    } else if (left - 60 < 0) {
      left = 0;
    }

    let range = sheetComp.coreSheet.tableViewForEvent.getCellPstDetailByClickXY(left, top);
    range.sri = range.ri;
    range.sci = range.ci;
    range.eri = range.ri;
    range.eci = range.ci;
    let offsetLeft = left - range.left + 50;
    let offsetTop = top - range.top + 21;

    img.offsetLeft = offsetLeft;
    img.offsetTop = offsetTop;
    img.range = range;
    if (typeof img.lastCi !== 'undefined' && typeof img.lastRi !== 'undefined') {
      img.ri = img.lastRi;
      img.ci = img.lastCi;
    }
    img.lastCi = range.ci;
    img.lastRi = range.ri;

    // sheetComp.data.history.addPic(deepCopy(sheetComp.data.pasteDirectionsArr), "delete");
  }
  onDrag(data) {
  }
}
export class PasteBhv {
  constructor(sheetComp) {
    this.sheetComp = sheetComp;
  }

  spanDomPackage(spanDom, tableDom) {
    let table = h('component_table.js', '');
    let tbody = h('tbody', '');

    let textArr = spanDom.innerText.split('\n');
    for (let i = 0; i < textArr.length; i++) {
      let text = textArr[i];
      let tr = h('tr', '');
      let td = h('td', '');
      td.updateInnerHtml(text);
      td.css('background', spanDom.style['background']);
      td.css('font-weight', spanDom.style['font-weight']);
      td.css('color', spanDom.style['color']);
      tr.appendChildByStrOrEl(td);
      tbody.appendChildByStrOrEl(tr);
    }

    table.appendChildByStrOrEl(tbody);
    tableDom = table.el;

    return tableDom;
  }

  process(tableDom, styleDom = '') {
    let { el, data } = this;
    // data.history.add(data.getData());
    el.appendChildByStrOrEl(tableDom);
    this.GetInfoFromTable(tableDom);
    tableDom.parentNode.removeChild(tableDom);
    if (styleDom) {
      styleDom.parentNode.removeChild(styleDom);
    }
    this.sheetComp.sheetReset(this);
  }

  mountPaste(e, cb) {
    let cbd = e.clipboardData;
    let p = false;

    for (let i = 0; i < cbd.items.length; i++) {
      let item = cbd.items[i];
      if (item.kind === 'string') {
        item.getAsString((str) => {
          let textDom = h('head', '');
          let d = h('span', '');
          if ((str.indexOf('<span') === -1 && str.indexOf('span>') === -1) && (str.indexOf('<table') === -1 && str.indexOf('table>') === -1)) {
            d.updateInnerHtml(str);
            textDom.appendChildByStrOrEl(d.el);
            textDom = textDom.el;
          } else {
            textDom.updateInnerHtml(str);
            textDom = textDom.el;
          }
          let imgDom = textDom.getElementsByTagName('img')[0];
          let styleDom = textDom.getElementsByTagName('style')[0];
          let tableDom = textDom.getElementsByTagName('component_table.js')[0];
          let spanDom = textDom.getElementsByTagName('span')[0];
          if (imgDom && !styleDom) {
            this.mountImg(imgDom);
            p = true;
          } else {
            if (!tableDom) {
              setTimeout(() => {
                if (p) {
                  return;
                }
                if (spanDom) {
                  tableDom = this.spanDomPackage(spanDom, tableDom);
                }
                if (styleDom) {
                  let { el } = this;
                  el.appendChildByStrOrEl(styleDom);
                }

                if (tableDom && p === false) {
                  let { el } = this;
                  el.appendChildByStrOrEl(tableDom);
                  this.GetInfoFromTable(tableDom);
                  tableDom.parentNode.removeChild(tableDom);
                  if (styleDom) {
                    styleDom.parentNode.removeChild(styleDom);
                  }
                  this.sheetComp.sheetReset(this);
                  p = true;
                }
              }, 100);
            } else {
              if (styleDom) {
                let { el } = this;
                el.appendChildByStrOrEl(styleDom);
              }

              if (tableDom && p === false) {
                this.process(tableDom, styleDom);
                p = true;
              }
            }
          }
        });
      } else if (item.kind === 'file' && !p) {
        let f = item.getAsFile();
        let reader = new FileReader();
        reader.onload = (evt) => {
          // let {x, y, overlayerEl} = this;
          // let {pasteDirectionsArr} = this.data;
          let img = h('img', 'paste-img');
          img.el.src = evt.target.result;

          setTimeout(() => {
            if (p) {
              return;
            }
            p = true;
            this.mountImg(img.el);
          }, 0);
        };

        if (!f) {
          return;
        }
        reader.readAsDataURL(f);
      }
    }
    setTimeout(() => {
      if (!p) {
        cb();
      } else {
        this.sheetComp.coreSheet.postChangeData(this.sheetComp.coreSheet.getWorkbookServerObj());
      }
    });
  }

// function processImg(item) {
//     let f = item.getAsFile();
//     let reader = created FileReader();
//     reader.onload = (evt) => {
//         // let {x, y, overlayerEl, pasteDirectionsArr} = this;
//         let img = h('img', 'paste-img');
//         img.el.src = evt.target.result;
//
//         setTimeout(() => {
//             if (p) {
//                 return;
//             }
//             p = true;
//             mountImg.call(this, img.el);
//         }, 0);
//     };
//
//     reader.readAsDataURL(f);
// }

// function moveArr(top, leftSpanElIndex) {
//     let {pasteDirectionsArr} = this.data;
//     for (let i = 0; i < pasteDirectionsArr.length; i++) {
//         let p = pasteDirectionsArr[i];
//         p.img.css("top", `${top }px`)
//             .css("leftSpanElIndex", `${leftSpanElIndex  }px`)
//     }
// }

  getMaxCoord(ri, ci) {
    let top = 0;
    let left = 0;
    let { pasteDirectionsArr } = this.sheetComp.coreSheet;
    let number = 0;
    for (let i = 0; i < pasteDirectionsArr.length; i++) {
      let p = pasteDirectionsArr[i];
      if (p.ri === ri && p.ci === ci) {
        if (left < p.nextLeft) {
          left = p.nextLeft;
        }
        if (top < p.nextTop) {
          top = p.nextTop;
        }
        number++;
      }
    }

    return {
      top: top,
      left: left,
      number: number,
    };
  }


// 删掉了 入参   add = true
  mountImg(imgDom, init = false, sri, sci, range) {
    let image = new Image();
    image.src = imgDom.src;
    image.onload = () => {
      let width = image.width;
      let height = image.height;
      let img = imgDom;
      let data = this.sheetComp.coreSheet;
      let { pasteDirectionsArr } = data;
      // if (add) {
      //     // data.history.addPic(Object.assign([], pasteDirectionsArr), "delete");
      // }

      let { riOfEditingCell, ciOfEditingCell } = data.coreSelector;
      if (init) {
        riOfEditingCell = sri;
        ciOfEditingCell = sci;
      }
      let { pictureOffsetLeft, pictureOffsetTop } = this;

      const rect = data.tableViewForEvent.getRangePstLTHW(new CellRangeProxy(riOfEditingCell, ciOfEditingCell, riOfEditingCell, ciOfEditingCell));
      let left = rect.left + pictureOffsetLeft;
      let top = rect.top + pictureOffsetTop;
      let number = 0;
      let choose = this.sheetComp.pasteBhv.getChooseImg();
      if (choose) {
        let args = this.getMaxCoord(choose.ri, choose.ci);
        left = args.left;
        top = args.top;
        riOfEditingCell = choose.ri;
        ciOfEditingCell = choose.ci;
        number = args.number;
      }

      let div = h('div', `${CSS_PREFIX}-object-container`)
        .css('position', 'absolute')
        .css('top', `${top}px`)
        .css('width', `${width}px`)
        .css('height', `${height}px`)
        .css('z-index', `100000`)
        .css('left', `${left}px`)
        .appendChildByStrOrEl(img);
      this.sheetComp.picContainer.appendChildByStrOrEl(div);
      new WinDragBhv(new DragOption, this.sheetComp).register(div.el);
      setTimeout(() => {
        let directionsArr = new WinResizeBhv(new ResizeOption(), this.sheetComp).register(div.el);
        let index = pasteDirectionsArr.length;

        pasteDirectionsArr.push({
          'src': img.src,
          'state': true,
          'arr': directionsArr,
          'img': div,
          'index': index,
          'img2': img,
          'ri': ri,
          'ci': ciOfEditingCell,
          'offsetLeft': 0,
          'offsetTop': 0,
          'number': number,
          'range': init ? range : data.coreSelector.selectedCoreRange,
          'top': top,
          'left': left,
          'nextLeft': left + 15,
          'nextTop': top + 15,
        });
        if (!init) {
          data.postChangeData(data.getWorkbookServerObj());
        }
        this.direction = true;
        div.css('width', `${img.offsetWidth}px`);
        div.css('height', `${img.offsetHeight}px`);
        this.containerHandlerEvent(directionsArr, index, pasteDirectionsArr, init);
        div.on('mousedown', () => this.containerHandlerEvent(directionsArr, index, pasteDirectionsArr));
      }, 0);
    };
  }

  hideDirectionArr() {
    let { pasteDirectionsArr } = this.sheetComp.coreSheet;
    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
      for (let i = 0; i < pasteDirectionsArr.length; i++) {
        let arr = pasteDirectionsArr[i].arr;
        if (arr.length > 0) {
          for (let j = 0; j < arr.length; j++) {
            arr[j].style.display = 'none';
          }
        }
        pasteDirectionsArr[i].state = false;
        pasteDirectionsArr[i].img.css('z-index', '10000');
        pasteDirectionsArr[i].img2.style['border'] = 'none';
      }
    }
  }

  deleteImg(d = false) {
    let { pasteDirectionsArr } = this.sheetComp.coreSheet;
    let direction_new = [];
    let direction_delete = [];
    this.direction = false;
    if (pasteDirectionsArr.length > 0) {
      for (let i = 0; i < pasteDirectionsArr.length; i++) {
        if (pasteDirectionsArr[i].state === true || d === true) {
          direction_delete.push(pasteDirectionsArr[i]);
        } else {
          direction_new.push(pasteDirectionsArr[i]);
        }
      }
    }

    Object.keys(direction_delete)
      .forEach(i => {
        direction_delete[i].img.removeEl();
      });

    this.pasteDirectionsArr = direction_new;

    this.sheetComp.coreSheet.pasteDirectionsArr = direction_new;
    this.sheetComp.coreSheet.postChangeData(this.sheetComp.coreSheet.getWorkbookServerObj());
  }

// function deleteAllImg() {
//     let {pasteDirectionsArr} = this.data;
//     let direction_new = [];
//     let direction_delete = [];
//     this.direction = false;
//     if (pasteDirectionsArr.length > 0) {
//         for (let i = 0; i < pasteDirectionsArr.length; i++) {
//             direction_delete.push(pasteDirectionsArr[i]);
//         }
//     }
//
//     Object.keys(pasteDirectionsArr).forEach(i => {
//         direction_delete[i].img.removeEl();
//     });
//
//     this.pasteDirectionsArr = direction_new;
// }

  containerHandlerEvent(directionsArr, index, pasteDirectionsArr, init) {
    this.hideDirectionArr();
    this.direction = true;
    Object.keys(directionsArr)
      .forEach(i => {
        directionsArr[i].style.display = 'block';
      });

    if (!init) {
      this.sheetComp.selectorContainerComp.hide();
      this.sheetComp.cellEditorComp.clear();

      pasteDirectionsArr[index].img.css('z-index', '99999999');
      pasteDirectionsArr[index].state = true;
    } else {
      this.hideDirectionArr();
    }
  }


  GetInfoFromTable(tableObj) { // class ClipboardTableProxy; .tableDom 属性  .dealColSpan() [477~483], dealStyle(), dealReferrence()， 最终得到row2； sheet层面上：（1）增加行与列。（2）setCellRange变更值。（3）给出黏贴选项
    let { data } = this;
    let { riOfEditingCell, ciOfEditingCell } = data.coreSelector;
    let styles = data.cellStyleArray;
    console.time('paste');
    let tableProxy = new CoreTableProxy(data);

    tableProxy.extend(tableObj, {
      riOfFirstSelectCell: ri,
      firstSelectCellCi: ciOfEditingCell
    });
    tableProxy.dealColSpan(tableObj);
    tableProxy.dealStyle(tableObj, {
      riOfFirstSelectCell: ri,
      firstSelectCellCi: ciOfEditingCell
    });
    let { reference } = tableProxy.dealReference(tableObj, {
      riOfFirstSelectCell: ri,
      firstSelectCellCi: ciOfEditingCell
    });
    this.sheetComp.setCellRange(reference, tableProxy, true, tableProxy.parseTableCellRange(tableObj, {
      riOfFirstSelectCell: ri,
      firstSelectCellCi: ciOfEditingCell
    }));
    this.sheetComp.footerContainerReset();
    const rect = data.tableViewForEvent.getRangePstLTHW(data.coreSelector.selectedCoreRange);
    let left = rect.left + rect.width + 60;
    let top = rect.top + rect.height + 31;
    let { advice, cellEditorComp } = this;
    this.sheetComp.cellEditorComp.clear(); // 清空cancvas
    advice.updateDisplayToBlock(left, top, 1, reference, tableProxy);
    console.timeEnd('paste');
    return {
      rows: data.coreRows.rowID2RowObj,
      styles: styles
    };
  }

}
