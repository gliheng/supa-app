import { LitElement, css, html } from 'lit'
import { customElement, property, state, eventOptions } from 'lit/decorators.js'
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { consume } from '@lit/context';
import { dataGridConfigContext, dataGridDataContext, DataManager } from './context';
import './data-grid-cell';

@customElement('sp-data-grid-view')
export class DataGridViewElement extends LitElement {
  @consume({ context: dataGridDataContext })
  @property({ attribute: false })
  private manager?: DataManager;

  @consume({ context: dataGridConfigContext })
  @property({ attribute: false })
  private config?: any;

  @property({
    type: Number,
    attribute: 'row-start',
  })
  rowStart = 0;

  @property({
    type: Number,
    attribute: 'row-end',
  })
  rowEnd = 0;

  @property({
    type: Number,
    attribute: 'col-start',
  })
  colStart = 0;

  @property({
    type: Number,
    attribute: 'col-end',
  })
  colEnd = 0;

  cellMap = {}
  rowMap = {}
  colMap = {}

  cellCallback(cellData: any, el: HTMLElement) {
    const { row, col } = cellData;
    const key = `${row}:${col}`;
    if (el) {
      this.cellMap[key] = cellData;
      // this.rowMap[row] = el;
      // this.colMap[col] = el;
    } else {
      delete this.cellMap[key];
    }
  }

  @property({
    type: Object,
    attribute: false,
  })
  deltas;
  
  getGridTemplate(rowStart: number, rowEnd: number, colStart: number, colEnd: number) {
    const { cellWidth, cellHeight } = this.config;
    let rows: number[] = [];
    let cols: number[] = [];
    for (let i = rowStart; i < rowEnd; i++) {
      rows.push(cellHeight + (this.deltas.row[i] ?? 0));
    }
    for (let i = colStart; i < colEnd; i++) {
      cols.push(cellWidth + (this.deltas.col[i] ?? 0));
    }
    return [
      rows.map(e => `${e}px`).join(' '),
      cols.map(e => `${e}px`).join(' '),
    ];
  }

  render() {
    const { rowStart, rowEnd, colStart, colEnd } = this;
    const [ rowTmpl, colTmpl ] = this.getGridTemplate(rowStart, rowEnd, colStart, colEnd);
    const iter = this.manager.iterateCells(this.rowStart, this.rowEnd, this.colStart, this.colEnd);
    return html`
      <div
        class="data-grid-view"
        style=${styleMap({
          gridTemplateRows: rowTmpl,
          gridTemplateColumns: colTmpl,
        })}
      >
        ${repeat(iter, e => `${e.row}:${e.col}`, (e, id) => {
          const style = {
            gridArea: `${e.row + 1 - rowStart}/${e.col + 1 - colStart}`,
          };
          return html`
            <sp-data-grid-cell
              ${ref(this.cellCallback.bind(this, e))}
              style=${styleMap(style)}
              .data=${e}
              .hResize=${e.hResize}
              .vResize=${e.vResize}
            ></sp-data-grid-cell>`;
        })}
      </div>
    `;
  }

  static styles = css`
    :host {
      position: absolute;
    }
    .data-grid-view {
      display: grid;
      grid-gap: var(--data-grid-border-width);
      background: var(--data-grid-border-color);
    }
    data-grid-cell {
      position: relative;
    }
    .data-grid-cell {
      padding: 0 4px;
      height: 100%;
      background: white;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      display: flex;
      align-items: center;
    }
    .data-grid-h-resizer {
      position: absolute;
      right: 0;
      top: 2px;
      bottom: 2px;
      width: 3px;
      background-color: var(--data-grid-resizer-color);
      cursor: ew-resize;
    }
    .data-grid-v-resizer {
      position: absolute;
      left: 2px;
      right: 2px;
      bottom: 0;
      height: 3px;
      background-color: var(--data-grid-resizer-color);
      cursor: ns-resize;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-data-grid-view': DataGridViewElement;
  }
}
