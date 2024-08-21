import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { WindowManagerMixin } from './window-context';
import { when } from 'lit/directives/when.js';

interface DividerInfo {
  showHorizontal: boolean;
  showVertical: boolean;
  hStart: number;
  hEnd: number;
  hPos: number;
  hEdge: FlexEdge;
  vStart: number;
  vPos: number;
  vEnd: number;
  vEdge: FlexEdge;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LayoutConfig {
  rows: number;
  cols: number;
  slots: {
    x: number;
    y: number;
    w: number;
    h: number;
  }[];
}

interface Edge {
  pos: number;
  start: number;
  end: number;
  raw: FlexEdge;
}

// pos, start, end
type FlexEdge = [number, number, number];

const THRESTHOLD = 4;

enum DividerMode {
  horizontal,
  vertical,
  diagnal,
}

@customElement('sp-layout-grid')
export class LayoutGridElement extends WindowManagerMixin(LitElement, ['layout']) {
  @property({
    type: Number,
  })
  padding = 3;

  // Row sizes (flex value)
  @state()
  rowSizes: number[] = [];

  // Col sizes (flex value)
  @state()
  colSizes: number[] = [];

  // Row sizes accumulated from top (flex value)
  @state()
  rowSizes2: number[] = [];

  // Col sizes accumulated from top (flex value)
  @state()
  colSizes2: number[] = [];

  @state()
  dividerInfo?: DividerInfo;

  // Cached width
  width = 0;
  // Cached height
  height = 0;
  // Cached x
  offsetX = 0;
  // Cached y
  offsetY = 0;

  // Rects for each slot (pixel value)
  @state()
  layoutInfo?: {
    x: number;
    y: number;
    width: number;
    height: number;
  }[];

  hEdges: Edge[] = [];
  vEdges: Edge[] = [];
  hEdgeSet = new Set<string>();
  vEdgeSet = new Set<string>();

  connectedCallback(): void {
    super.connectedCallback();
    document.body.addEventListener('pointermove', this.onPointermove);
    if (this.manager.layoutConfig) {
      this._onLayout();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.body.removeEventListener('pointermove', this.onPointermove);
  }

  doLayout(config: LayoutConfig) {
    const rect = this.getBoundingClientRect();
    let { width, height } = rect;
    width -= this.padding * 2;
    height -= this.padding * 2;

    const { rows, cols, slots } = config;

    const rects = slots.map(e => {
      return {
        x: this.colSizes2[e.x] * width + this.padding,
        y:  this.rowSizes2[e.y] * height + this.padding,
        width: (this.colSizes2[e.x + e.w] - this.colSizes2[e.x]) * width,
        height: (this.rowSizes2[e.y + e.h] - this.rowSizes2[e.y]) * height,
      };
    });

    const hEdges = [];
    const vEdges = [];
    const hEdgeSet = new Set<string>();
    const vEdgeSet = new Set<string>();
    for (let [i, r] of rects.entries()) {
      const slot = slots[i];
      // top edge
      if (slot.y != 0) {
        // add all segments
        for (let i = 0; i < slot.w; i++) {
          hEdgeSet.add(edgeKey([slot.y, slot.x + i]));
        }
        hEdges.push({
          pos: r.y,
          start: r.x,
          end: r.x + r.width,
          raw: [slot.y, slot.x, slot.x + slot.w] as FlexEdge,
        });
      }
      // bottom edge
      if (slot.y + slot.h != rows) {
        // add all segments
        for (let i = 0; i < slot.w; i++) {
          hEdgeSet.add(edgeKey([slot.y + slot.h, slot.x + i]));
        }
        hEdges.push({
          pos: r.y + r.height,
          start: r.x,
          end: r.x + r.width,
          raw: [slot.y + slot.h, slot.x, slot.x + slot.w] as FlexEdge,
        });
      }
      // left edge
      if (slot.x != 0) {
        // add all segments
        for (let i = 0; i < slot.h; i++) {
          vEdgeSet.add(edgeKey([slot.x, slot.y + i]));
        }
        vEdges.push({
          pos: r.x,
          start: r.y,
          end: r.y + r.height,
          raw: [slot.x, slot.y, slot.y + slot.h] as FlexEdge,
        });
      }
      // right edge
      if (slot.x + slot.w != cols) {
        // add all segments
        for (let i = 0; i < slot.h; i++) {
          vEdgeSet.add(edgeKey([slot.x + slot.w, slot.y + i]));
        }
        vEdges.push({
          pos: r.x + r.width,
          start: r.y,
          end: r.y + r.height,
          raw: [slot.x + slot.w, slot.y, slot.y + slot.h] as FlexEdge,
        });
      }
    }
    this.width = width;
    this.height = height;
    this.hEdges = hEdges;
    this.vEdges = vEdges;
    this.hEdgeSet = hEdgeSet;
    this.vEdgeSet = vEdgeSet;
    this.layoutInfo = rects;
  }

  calcAccumulateSizes() {
    let colSizes2: number[] = [0];
    for (let i = 0; i < this.colSizes.length; i++) {
      colSizes2.push(this.colSizes[i] + (colSizes2[i] ?? 0));
    }
    let rowSizes2: number[] = [0];
    for (let i = 0; i < this.rowSizes.length; i++) {
      rowSizes2.push(this.rowSizes[i] + (rowSizes2[i] ?? 0));
    }
    this.colSizes2 = colSizes2;
    this.rowSizes2 = rowSizes2;
  }

  _onLayout = async (reset = true) => {
    const config = this.manager?.layoutConfig;
    if (config) {
      if (reset) {
        this.rowSizes = gridSizes(config.layout.rows, config.layout.rowSizes);
        this.colSizes = gridSizes(config.layout.cols, config.layout.colSizes);
        this.calcAccumulateSizes();
      }
      this.doLayout(config.layout);
      this.manager?.notifier.emit(
        'setRects',
        this.layoutInfo!.map(inset.bind(null, 4)),
      );
    } else {
      this.rowSizes = [];
      this.colSizes = [];
      this.layoutInfo = undefined;
      this.manager?.notifier.emit('clearRects');
    }
  }

  onMouseenter(evt: MouseEvent) {
    const rect = this.getBoundingClientRect();
    this.offsetX = rect.left;
    this.offsetY = rect.top;
  }

  resizing = false;
  onResizeStart() {
    this.resizing = true;
  }
  onResizeStop() {
    this.resizing = false;
  }

  onPointermove = (evt: MouseEvent) => {
    if (!this.manager.layout || this.resizing) return;

    const { clientX, clientY } = evt;
    const [hEdge, vEdge] = edgeByPos(
      clientX - this.offsetX,
      clientY - this.offsetY,
      this.hEdges,
      this.vEdges,
    );
    if (hEdge || vEdge) {
      const dividerInfo: Partial<DividerInfo> = {
        showHorizontal: Boolean(hEdge),
        showVertical: Boolean(vEdge),
      };
      if (hEdge) {
        // expand hEdge
        let [pos, start, end ] = hEdge.raw;
        while (this.hEdgeSet.has(edgeKey([pos, start-1]))) {
          start--;
        }
        while (this.hEdgeSet.has(edgeKey([pos, end]))) {
          end++;
        }
        dividerInfo.hPos = hEdge.pos;
        dividerInfo.hStart = this.colSizes2[start] * this.width + this.padding;
        dividerInfo.hEnd = this.colSizes2[end] * this.width + this.padding;
        dividerInfo.hEdge = [pos, start, end];
      }
      if (vEdge) {
        // expand vEdge
        let [pos, start, end ] = vEdge.raw;
        while (this.vEdgeSet.has(edgeKey([pos, start-1]))) {
          start--;
        }
        while (this.vEdgeSet.has(edgeKey([pos, end]))) {
          end++;
        }
        dividerInfo.vPos = vEdge.pos;
        dividerInfo.vStart = this.rowSizes2[start] * this.height + this.padding;
        dividerInfo.vEnd = this.rowSizes2[end] * this.height + this.padding;
        dividerInfo.vEdge = [pos, start, end];
      }
      this.dividerInfo = dividerInfo as DividerInfo;
    } else {
      this.dividerInfo = undefined;
    }
  }

  resizeObserver?: ResizeObserver;

  updateContainerRef(el: Element | undefined) {
    if (!this.resizeObserver) {
      this.resizeObserver = new ResizeObserver((_entries) => {
        this._onLayout(false);
      });
    }
    if (el) {
      this.resizeObserver.observe(el);
    } else {
      this.resizeObserver.disconnect();
    }
  }

  async onResize(evt: CustomEvent) {
    const { mode, dx, dy, vEdge, hEdge } = evt.detail;
    const newDividerInfo = {
      ...this.dividerInfo as DividerInfo,
    };
    const vPos = vEdge?.[0], hPos = hEdge?.[0];

    // calc new flex values from pixel values
    if (mode == DividerMode.horizontal || mode == DividerMode.diagnal) {
      let v = dy / this.height * 0.8;
      if (v > 0) {
        v = Math.min(this.rowSizes[hPos], v);
      } else if (v < 0) {
        v = Math.max(-this.rowSizes[hPos-1], v);
      }
      newDividerInfo.hPos = v * this.height + newDividerInfo.hPos!;
      this.rowSizes[hPos-1] += v;
      this.rowSizes[hPos] -= v;
    }
    if (mode == DividerMode.vertical || mode == DividerMode.diagnal) {
      let v = dx / this.width * 0.8;
      if (v > 0) {
        v = Math.min(this.colSizes[vPos], v);
      } else if (v < 0) {
        v = Math.max(-this.colSizes[vPos-1], v);
      }
      newDividerInfo.vPos = v * this.width + newDividerInfo.vPos!;
      this.colSizes[vPos-1] += v;
      this.colSizes[vPos] -= v;
    }
    if (newDividerInfo?.showHorizontal && newDividerInfo?.showVertical) {
      newDividerInfo.vStart = this.rowSizes2[vEdge[1]] * this.height + this.padding;
      newDividerInfo.vEnd = this.rowSizes2[vEdge[2]] * this.height + this.padding;
      newDividerInfo.hStart = this.colSizes2[hEdge[1]] * this.width + this.padding;
      newDividerInfo.hEnd = this.colSizes2[hEdge[2]] * this.width + this.padding;
    }
    this.dividerInfo = newDividerInfo;

    this.calcAccumulateSizes();

    this._onLayout(false);
  }

  render() {
    const { layoutInfo } = this;
    let layoutGrid, divider;
    if (layoutInfo) {
      layoutGrid = html`
        <div class="layout-grid"
          @mouseenter=${this.onMouseenter}
          ${ref(this.updateContainerRef)}
        >
          ${layoutInfo.map((e, i) => {
            const { x, y, width, height } = e;
            return html`
              <div
                class="layout-grid-pane"
                style=${styleMap({
                  left: `${x}px`,
                  top: `${y}px`,
                  width: `${width}px`,
                  height: `${height}px`,
                })}
              >
                <div class="layout-grid-pane-inner"><h1>${i + 1}</h1></div>
              </div>`;
          })}
        </div>
      `;
    }
    if (this.dividerInfo) {
      divider = html`
        <sp-layout-grid-divider
          .dividerInfo=${this.dividerInfo}
          @resizestart=${this.onResizeStart}
          @resize=${this.onResize}
          @resizestop=${this.onResizeStop}>
        </sp-layout-grid-divider>
      `;
    }

    return html`
      ${layoutGrid}
      ${divider}
    `;
  }

  static styles = css`
    :host {
      --size: 4px;
      position: absolute;
      inset: 0;
    }
    .layout-grid {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .layout-grid-pane {
      position: absolute;
      padding: calc(var(--size) / 2);
      display: flex;
      box-sizing: border-box;
      overflow: hidden;
    }
    .layout-grid-pane-inner {
      border: 1px solid var(--sl-color-gray-300);
      flex: 1;
    }
    .layout-grid-pane h1 {
      font-size: 50px;
      margin: 0;
      margin-left: 14px;
      color: var(--sl-color-gray-500);
    }
  `;
}

@customElement('sp-layout-grid-divider')
export class LayoutGridDividerElement extends LitElement {
  @property({
    type: Object,
    attribute: false,
  })
  dividerInfo!: DividerInfo;

  startDrag(evt: PointerEvent) {
    if (evt.button != 0) return;

    evt.preventDefault();
    document.body.addEventListener('pointermove', this.move);
    (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
    const event = new Event('resizestart', { composed: true });
    this.dispatchEvent(event);
  }

  move = (evt: PointerEvent) => {
    const dx = evt.movementX;
    const dy = evt.movementY;
    const { showHorizontal, showVertical, vEdge, hEdge } = this.dividerInfo;
    let mode;
    if (showHorizontal && showVertical) {
      mode = DividerMode.diagnal;
    } else if (showHorizontal) {
      mode = DividerMode.horizontal;
    } else if (showVertical) {
      mode = DividerMode.vertical;
    }
    const event = new CustomEvent('resize', { composed: true, detail: { mode, dx, dy, vEdge, hEdge } });
    this.dispatchEvent(event);
  }

  stopDrag(evt: PointerEvent) {
    document.body.removeEventListener('pointermove', this.move);
    (evt.currentTarget as HTMLElement).releasePointerCapture(evt.pointerId);
    const event = new Event('resizestop', { composed: true });
    this.dispatchEvent(event);
  }

  render() {
    const {
      showHorizontal,
      showVertical,
      hStart,
      hEnd,
      hPos,
      vStart,
      vPos,
      vEnd,
    } = this.dividerInfo;
    return html`
      ${when(showHorizontal, () => html`
        <div class="layout-grid-divider"
          data-horizontal
          @pointerdown=${this.startDrag}
          @pointerup=${this.stopDrag}
          style=${styleMap({
            left: `${hStart}px`,
            width: `${hEnd - hStart}px`,
            top: `${hPos}px`,
          })}></div>
      `)}
      ${when(showVertical, () => html`
        <div class="layout-grid-divider"
          data-vertical
          @pointerdown=${this.startDrag}
          @pointerup=${this.stopDrag}
          style=${styleMap({
            top: `${vStart}px`,
            height: `${vEnd - vStart}px`,
            left: `${vPos}px`,
          })}></div>
      `)}
      ${when(showHorizontal && showVertical, () => html`
        <div class="layout-grid-divider"
        data-center
        @pointerdown=${this.startDrag}
        @pointerup=${this.stopDrag}
        style=${styleMap({
          top: `${hPos}px`,
          left: `${vPos}px`,
        })}></div>
      `)}
    `;
  }

  static styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      --size: 6px;
    }
    .layout-grid-divider {
      position: absolute;
      transition: background-color 0.3s;
      background-color: tranparent;
      z-index: 1;
    }
    :host(:hover) .layout-grid-divider {
      background-color: var(--sl-color-primary-300);
    }
    .layout-grid-divider[data-vertical] {
      width: var(--size);
      margin-left: calc(-1 * var(--size) / 2);
      cursor: ew-resize;
    }
    .layout-grid-divider[data-horizontal] {
      height: var(--size);
      margin-top: calc(-1 * var(--size) / 2);
      cursor: ns-resize;
    }
    .layout-grid-divider[data-center] {
      width: var(--size);
      height: var(--size);
      margin-left: calc(-1 * var(--size) / 2);
      margin-top: calc(-1 * var(--size) / 2);
      cursor: move;
    }
  `;
}


function gridSizes(n: number, sizes?: number[]) {
  // If sizes if provided, we need to normalize it
  const total = sizes ? sizes.reduce((a, b) => a + b, 0) : n;
  const arr = [];
  for (let i = 0; i < n; i++) {
    if (sizes) {
      arr.push(sizes[i] / total);
    } else {
      arr.push(1 / n);
    }
  }
  return arr;
}

// Get nearest edges for cursor at x, y
function edgeByPos(x: number, y: number, hEdges: Edge[], vEdges: Edge[]) {
  let h: Edge | undefined, v: Edge | undefined;
  for (let edge of hEdges) {
    const { pos, start, end } = edge;
    if (x >= start && x <= end && Math.abs(pos - y) < THRESTHOLD) {
      h = edge;
      break;
    }
  }
  for (let edge of vEdges) {
    const { pos, start, end } = edge;
    if (y >= start && y <= end && Math.abs(pos - x) < THRESTHOLD) {
      v = edge;
      break;
    }
  }
  return [h, v];
}

function inset(v: number, rect: Rect) {
  return {
    x: rect.x + v,
    y: rect.y + v,
    width: rect.width - 2 * v,
    height: rect.height - 2 * v,
  };
}

function edgeKey(edge: number[]) {
  return `${edge[0]}:${edge[1]}`;
}
