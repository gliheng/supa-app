import { LitElement, css, html } from 'lit'
import { customElement, property, state, eventOptions } from 'lit/decorators.js'
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { provide } from '@lit/context';
import mitt from 'mitt';
import { bisect } from './utils';
import './data-grid-view';
import { dataGridConfigContext, dataGridDataContext, DataManager } from './context';

enum Side {
  top = 'top',
  left = 'left',
  right = 'right',
  bottom = 'bottom',
}

@customElement('sp-data-grid')
export class DataGridElement extends LitElement {
  constructor() {
    super();
    this.manager.emitter.on('load', (yes) => {
      this.loading = yes;
    });
    this.manager.emitter.on('update', () => {
    });
  }

  @provide({ context: dataGridDataContext })
  manager = new DataManager();

  async start() {
    await this.manager.load();
    const { cols, rows } = this.manager;
    this.cols = cols;
    this.rows = rows;
    const el = this.elRef.value as HTMLElement;
    if (el) {
      this.setView(el.offsetWidth, el.offsetHeight);
    }  
  }

  set dataSource(v) {
    this.manager.setSource(v);
    this.start();
  }

  @provide({ context: dataGridConfigContext })
  _config = {
    cellWidth: 120,
    cellHeight: 24,
    viewCacheCount: 4,
    borderWidth: 1,
  };

  get config() {
    return this._config;
  }

  set config(v) {
    Object.assign(this._config, v);
    this.style.setProperty('--data-grid-border-width', `${this._config.borderWidth}px`);
    this.requestUpdate();
  }

  @state({ type: Boolean })
  loading = false;

  @state({ type: Number })
  cols = 0;
  
  @state({ type: Number })
  rows = 0;

  @state()
  scrollLeft = 0;
  
  @state()
  scrollTop = 0;
  
  // Displayed data within bound [rowStart, rowEnd)
  @state()
  rowStart = 0;

  @state()
  rowEnd = 0;

  @state()
  rowCacheStart = 0;

  @state()
  rowCacheEnd = 0;

  // Displayed data within bound [colstart, colEnd)
  @state()
  colStart = 0;

  @state()
  colEnd = 0;

  @state()
  colCacheStart = 0;

  @state()
  colCacheEnd = 0;

  @state()
  deltas: {
    row: number[],
    col: number[],
  } = {
    row: [],
    col: [],
  }

  @state()
  fixedSizes = true;
  rowSizes: number[];
  colSizes: number[];

  getColWidth(n: number) {
    const { cellWidth, borderWidth } = this.config;
    return this.fixedSizes ? n * (cellWidth + borderWidth) : this.colSizes[n - 1] ?? 0;
  }

  getRowHeight(n: number) {
    const { cellHeight, borderWidth } = this.config;
    return this.fixedSizes ? n * (cellHeight + borderWidth) : this.rowSizes[n - 1] ?? 0;
  }

  get totalWidth() {
    return this.getColWidth(this.cols);
  }

  get totalHeight() {
    return this.getRowHeight(this.rows);
  }

  elRef = createRef();

  resizeObserver: ResizeObserver;
  connectedCallback() {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.setView(width, height);
      }
    });
    this.resizeObserver.observe(this);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.resizeObserver.disconnect();
  }

  setView(width: number, height: number) {
    const { cellWidth, cellHeight, borderWidth, viewCacheCount } = this.config;
    const cw = cellWidth + borderWidth;
    const ch = cellHeight + borderWidth;
    if (this.fixedSizes) {
      this.rowStart = Math.floor(this.scrollTop / ch);
      this.rowEnd = Math.ceil(height / ch) + this.rowStart;
      this.colStart = Math.floor(this.scrollLeft / cw);
      this.colEnd = Math.ceil(width / cw) + this.colStart;  
    } else {
      const { colSizes, rowSizes } = this;
      this.rowStart = bisect(rowSizes, this.scrollTop);
      this.rowEnd = bisect(rowSizes, this.scrollTop + height);
      this.colStart = bisect(colSizes, this.scrollLeft);
      this.colEnd = bisect(colSizes, this.scrollLeft + width);
    }
    if (this.rowCacheEnd <= this.rowEnd || this.rowCacheStart >= this.rowStart) {
      this.rowCacheStart = Math.max(this.rowStart - viewCacheCount, 0);
      this.rowCacheEnd = Math.min(this.rowEnd + viewCacheCount, this.rows);
    }
    if (this.colCacheEnd <= this.colEnd || this.colCacheStart >= this.colStart) {
      this.colCacheStart = Math.max(this.colStart - viewCacheCount, 0);
      this.colCacheEnd = Math.min(this.colEnd + viewCacheCount, this.cols);
    }
  }

  @eventOptions({ passive: true })
  onScroll(evt: Event) {
    const el = this.elRef.value as HTMLElement;
    if (el) {
      this.scrollLeft = el.scrollLeft;
      this.scrollTop = el.scrollTop;
      this.setView(el.offsetWidth, el.offsetHeight);
    }
  }

  onResize(evt: CustomEvent) {
    const { dir, n, value } = evt.detail;
    if (dir == 'h') {
      this.deltas.col[n] = value
    } else if (dir == 'v') {
      this.deltas.row[n] = value
    }
    this.deltas = {...this.deltas};
    this.fixedSizes = false;
    
    // Calc real sizes using deltas
    const {
      cellWidth,
      cellHeight,
      borderWidth,
    } = this.config;
    const cw = cellWidth + borderWidth;
    const ch = cellHeight + borderWidth;
    let colSizes: number[] = [];
    let prev = 0;
    for (let i = 0; i < this.cols; i++) {
      let v = cw + prev + (this.deltas.col[i] ?? 0);
      colSizes.push(v);
      prev = v;
    }
    prev = 0;
    let rowSizes: number[] = [];
    for (let i = 0; i < this.rows; i++) {
      let v = ch + prev + (this.deltas.row[i] ?? 0);
      rowSizes.push(v);
      prev = v;
    }
    this.rowSizes = rowSizes;
    this.colSizes = colSizes;
  }

  renderStickyShadow() {
    const {
      cellWidth,
      cellHeight,
    } = this.config;

    const {
      topSticky,
      leftSticky,
      rightSticky,
      bottomSticky,
    } = this.manager;

    let top = 0, left = 0, right = 0, bottom = 0;
    if (topSticky) {
      for (let i = 0; i < topSticky; i++) {
        top += (this.deltas.row[i] ?? 0) + cellHeight;
      }
    }
    if (bottomSticky) {
      for (let i = 0; i < bottomSticky; i++) {
        bottom += (this.deltas.row[this.rows - i - 1] ?? 0) + cellHeight;
      }
    }
    if (leftSticky) {
      for (let i = 0; i < leftSticky; i++) {
        left += (this.deltas.col[i] ?? 0) + cellWidth;
      }      
    }
    if (rightSticky) {
      for (let i = 0; i < rightSticky; i++) {
        right += (this.deltas.col[this.cols - i - 1] ?? 0) + cellWidth;
      }
    }

    return html`<div class="data-grid-shadow"
      style=${styleMap({
        top: `${top || -10}px`,
        bottom: `${bottom || -10}px`,
        left: `${left || -10}px`,
        right: `${right || -10}px`,
      })}
    ></div>`;
  }

  renderSticky(left: number, top: number) {
    const {
      topSticky,
      leftSticky,
      rightSticky,
      bottomSticky,
      cols,
      rows,
    } = this.manager;
    if (!topSticky && !leftSticky && !rightSticky && !bottomSticky) {
      return;
    }

    let topStickyPanel, bottomStickyPanel, leftStickyPanel, rightStickyPanel,
      topLeftStickyPanel, topRightStickyPanel, bottomLeftStickyPanel, bottomRightStickyPanel;

    if (topSticky) {
      topStickyPanel = html`
        <sp-data-grid-view
          data-side="top"
          style=${styleMap({
            top: 0,
            left: `${left - this.scrollLeft}px`,
          })}
          row-start=${0}
          row-end=${topSticky}
          col-start=${this.colCacheStart}
          col-end=${this.colCacheEnd}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (bottomSticky) {
      bottomStickyPanel = html`
        <sp-data-grid-view
          data-side="bottom"
          style=${styleMap({
            bottom: 0,
            left: `${left - this.scrollLeft}px`,
          })}
          row-start=${this.rows - bottomSticky}
          row-end=${this.rows}
          col-start=${this.colCacheStart}
          col-end=${this.colCacheEnd}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (leftSticky) {
      leftStickyPanel = html`
        <sp-data-grid-view
          data-side="left"
          style=${styleMap({
            left: 0,
            top: `${top - this.scrollTop}px`,
          })}
          row-start=${this.rowCacheStart}
          row-end=${this.rowCacheEnd}
          col-start=${0}
          col-end=${leftSticky}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (rightSticky) {
      rightStickyPanel = html`
        <sp-data-grid-view
          data-side="right"
          style=${styleMap({
            right: 0,
            top: `${top - this.scrollTop}px`,
          })}
          row-start=${this.rowCacheStart}
          row-end=${this.rowCacheEnd}
          col-start=${cols - rightSticky}
          col-end=${cols}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (leftStickyPanel && topStickyPanel) {
      topLeftStickyPanel = html`
        <sp-data-grid-view
          data-side="top-left"
          style=${styleMap({
            top: 0,
            left: 0,
          })}
          row-start=${0}
          row-end=${topSticky}
          col-start=${0}
          col-end=${leftSticky}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (topStickyPanel && rightStickyPanel) {
      topRightStickyPanel = html`
        <sp-data-grid-view
          data-side="top-right"
          style=${styleMap({
            top: 0,
            right: 0,
          })}
          row-start=${0}
          row-end=${topSticky}
          col-start=${cols-rightSticky}
          col-end=${cols}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (rightStickyPanel && bottomStickyPanel) {
      bottomRightStickyPanel = html`
        <sp-data-grid-view
          data-side="bottom-right"
          style=${styleMap({
            bottom: 0,
            right: 0,
          })}
          row-start=${rows-bottomSticky}
          row-end=${rows}
          col-start=${cols-rightSticky}
          col-end=${cols}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }
    if (bottomStickyPanel && leftStickyPanel) {      
      bottomLeftStickyPanel = html`
        <sp-data-grid-view
          data-side="bottom-left"
          style=${styleMap({
            bottom: 0,
            left: 0,
          })}
          row-start=${rows-bottomSticky}
          row-end=${rows}
          col-start=${0}
          col-end=${leftSticky}
          .deltas=${this.deltas}
        >
        </sp-data-grid-view>
      `;
    }

    return html`
      <div class="data-grid-sticky">
        ${this.renderStickyShadow()}
        ${topStickyPanel}
        ${bottomStickyPanel}
        ${leftStickyPanel}
        ${rightStickyPanel}
        ${topLeftStickyPanel}
        ${topRightStickyPanel}
        ${bottomRightStickyPanel}
        ${bottomLeftStickyPanel}
      </div>
    `;
  }

  renderLoading() {
    return html`
      <div class="data-grid-loading">
        <sl-spinner></sl-spinner>
      </div>`;
  }
  
  render() {
    if (this.loading) {
      return this.renderLoading();
    }

    const dx = Math.abs(this.getColWidth(this.colCacheStart) - this.scrollLeft);
    const dy = Math.abs(this.getRowHeight(this.rowCacheStart) - this.scrollTop);
    const left = this.scrollLeft - dx;
    const top = this.scrollTop - dy;

    return html`
      <div class="data-grid"
        ${ref(this.elRef)}
        @scroll=${this.onScroll}
        @resize=${this.onResize}
      >
        <div class="data-grid-view-wrap" style=${styleMap({
          height: `${this.totalHeight}px`,
          width: `${this.totalWidth}px`,
        })}>
          <sp-data-grid-view
            style=${styleMap({
              top: `${top}px`,
              left: `${left}px`,
            })}
            row-start=${this.rowCacheStart}
            row-end=${this.rowCacheEnd}
            col-start=${this.colCacheStart}
            col-end=${this.colCacheEnd}
            .deltas=${this.deltas}
          >
          </sp-data-grid-view>
        </div>
        ${this.renderSticky(left, top)}
      </div>
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
      position: relative;
      --data-grid-border-width: 1px;
      --data-grid-border-color: silver;
      --data-grid-resizer-color: silver;
      --data-grid-shadow: rgba(0, 0, 0, .3) 0 0 10px 0;
    }
    .data-grid {
      --data-grid-border: var(--data-grid-border-width) solid var(--data-grid-border-color);
      border: var(--data-grid-border);
    }
    .data-grid {
      flex: 1;
      position: relative;
      overflow: scroll;
    }
    .data-grid-view-wrap {
      position: absolute;
      inset: 0;
    }
    .data-grid-sticky {
      position: sticky;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: hidden;
      inset: 0;
    }
    .data-grid-sticky .data-grid-shadow {
      position: absolute;
      box-shadow: var(--data-grid-shadow) inset;
      pointer-events: none;
    }
    .data-grid-sticky > * {
      pointer-events: all;
    }
    .data-grid-sticky data-grid-view {
      position: absolute;
    }
    .data-grid-sticky data-grid-view[data-side="top"] {
      border-bottom: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="bottom"] {
      border-top: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="left"] {
      border-right: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="right"] {
      border-left: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="top-left"] {
      border-right: var(--data-grid-border);
      border-bottom: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="top-right"] {
      border-left: var(--data-grid-border);
      border-bottom: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="bottom-left"] {
      border-right: var(--data-grid-border);
      border-top: var(--data-grid-border);
    }
    .data-grid-sticky data-grid-view[data-side="bottom-right"] {
      border-left: var(--data-grid-border);
      border-top: var(--data-grid-border);
    }
    .data-grid-loading {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 0.3);
      font-size: var(--data-grid-loading-size, 40px);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-data-grid': DataGridElement;
  }
}
