import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { Ref, createRef, ref } from 'lit/directives/ref.js';
import { AppConfig } from './config';
import { when } from 'lit/directives/when.js';

type SnapPoints = { x: number[]; y: number[] };
const defaultSnapPoints: SnapPoints = { x: [], y: [] };
const SNAP_THRESHOLD = 10;

@customElement('sp-window-frame')
export class WindowFrameElement extends LitElement {
  @property()
  id!: string;

  snapPoints?: (id: string) => SnapPoints;
  _snapPoints = defaultSnapPoints;

  @property({
    type: Boolean,
  })
  pinned = false;

  applySnapPoints(dir: 'x' | 'y', val: number): number {
    let points;
    if (dir == 'x') {
      points  = this._snapPoints.x;
    } else if (dir == 'y') {
      points  = this._snapPoints.y;
    }

    // find smallest distance
    let minIndex = 0;
    for (let i = 1; i < points!.length; i++ ) {
      if (Math.abs(val - points![i]) < Math.abs(val - points![minIndex])) {
        minIndex = i;
      }
    }

    if (Math.abs(points![minIndex] - val) < SNAP_THRESHOLD) {
      return points![minIndex];
    }

    return val;
  }

  _x = 0;
  set x(val: number) {
    val = this.applySnapPoints('x', val);
    val = this.applySnapPoints('x', val + this.width) - this.width;
    this._x = val;
    this.style.left = `${val}px`;
  }
  get x() {
    return this._x;
  }

  _y = 0;
  set y(val: number) {
    val = this.applySnapPoints('y', val);
    val = this.applySnapPoints('y', val + this.height) - this.height;
    this._y = val;
    this.style.top = `${val}px`;
  }
  get y() {
    return this._y;
  }

  _width = 0;
  set width(val: number) {
    val = Math.max(Math.min(val, this._containerWidth - this.x), 0);
    val = this.applySnapPoints('x', this.x + val) - this.x;
    this._width = val;
    this.style.width = `${val}px`;
  }
  get width() {
    return this._width;
  }

  _height = 0;
  set height(val: number) {
    val = Math.max(Math.min(val, this._containerHeight - this.y), 0);
    val = this.applySnapPoints('y', this.y + val) - this.y;
    this._height = val;
    this.style.height = `${val}px`;
  }
  get height() {
    return this._height;
  }

  oldRect: any;

  @state()
  controlled = false;

  rect?: DOMRect;

  setRect(rect: DOMRect) {
    // This may cause suprises without it!
    this.updateContainerSize();
    if (!this.controlled) {
      this.oldRect = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
    }
    this.controlled = true;
    this.x = rect.x;
    this.y = rect.y;
    this.width = rect.width;
    this.height = rect.height;
    this.setAttribute('data-controlled', '');
  }

  clearRect() {
    if (!this.controlled) return;
    this.controlled = false;
    this.x = this.oldRect.x;
    this.y = this.oldRect.y;
    this.width = this.oldRect.width;
    this.height = this.oldRect.height;
    this.removeAttribute('data-controlled');
  }

  _config!: AppConfig;
  set config(val: AppConfig) {
    this._config = val;
  }
  get config() {
    return this._config;
  }

  elChanged(el?: Element) {
    if (el) {
      if (!el.firstChild) {
        el.appendChild(document.createElement(this.config.element));
      }
    }
  }

  _startX = 0;
  _startY = 0;
  _containerWidth = 0;
  _containerHeight = 0;
  _originalX = 0;
  _originalY = 0;
  _originalWidth = 0;
  _originalHeight = 0;

  @state()
  isExpand = false;

  expand() {
    this.isExpand = !this.isExpand;
    if (this.isExpand) {
      this.setAttribute('data-expanded', '');
    } else {
      this.style.top = `${this.y}px`;
      this.style.left = `${this.x}px`;
      this.style.width = `${this.width}px`;
      this.style.height = `${this.height}px`;
      this.removeAttribute('data-expanded');
    }
  }

  startDrag = (evt: PointerEvent) => {
    if (evt.button != 0) return;
    if (this.isExpand) return;
    if (this.controlled) return;
    
    evt.preventDefault();
    
    this.updateContainerSize();
    if (this.snapPoints) {
      this._snapPoints = this.snapPoints(this.id);
    }
    this._startX = evt.clientX;
    this._startY = evt.clientY;
    this._originalX = this.x;
    this._originalY = this.y;
    const el = evt.currentTarget as HTMLElement;
    el.setPointerCapture(evt.pointerId);
    el.addEventListener('pointermove', this.move);
  }

  move = (evt: PointerEvent) => {
    let x = evt.clientX - this._startX + this._originalX,
      y = evt.clientY - this._startY + this._originalY;
    // Prevent frame from moving outof bounds
    // x = Math.max(
    //   Math.min(
    //     x,
    //     this._containerWidth - this.width,
    //   ),
    //   0,
    // );
    // y = Math.max(
    //   Math.min(
    //     y,
    //     this._containerHeight - this.height,
    //   ),
    //   0,
    // );
    this.x = x;
    this.y = y;
  }

  stopDrag(evt: PointerEvent) {
    this._snapPoints = defaultSnapPoints;
    const el = evt.currentTarget as HTMLElement;
    el.removeEventListener('pointermove', this.move);
    el.releasePointerCapture(evt.pointerId);
  }

  private resizeSide: string = '';
  startResize = (evt: PointerEvent) => {
    if (evt.button != 0) return;

    evt.preventDefault();
    this.updateContainerSize();
    if (this.snapPoints) {
      this._snapPoints = this.snapPoints(this.id);
    }
    this._startX = evt.clientX;
    this._startY = evt.clientY;
    this._originalX = this.x;
    this._originalY = this.y;
    this._originalWidth = this.width;
    this._originalHeight = this.height;

    const side = (evt.target as HTMLElement).dataset.side!;
    this.resizeSide = side;
    
    document.body.addEventListener('pointermove', this.resizeMove);
    (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
  }

  resizeMove = (evt: PointerEvent) => {
    const { resizeSide } = this;
    const minWidth = this.config.minWidth ?? 100;
    const minHeight = this.config.minHeight ?? 100;
    // vertical resize
    if (resizeSide.indexOf('s') != -1) {
      let h = evt.clientY - this._startY + this._originalHeight;
      h = Math.max(h, minHeight);
      this.height = h;
    } else if (resizeSide.indexOf('n') != -1) {
      let y = Math.max(evt.clientY - this._startY + this._originalY, 0);
      // limit by min height
      y = Math.min(this._originalY + this._originalHeight - minHeight, y);
      this.y = y;
      this.height = this._originalY + this._originalHeight - this.y;
    }
    // horizontal resize
    if (resizeSide.indexOf('e') != -1) {
      let w = evt.clientX - this._startX + this._originalWidth;
      w = Math.max(w, minWidth);
      this.width = w;
    } else if (resizeSide.indexOf('w') != -1) {
      let x = Math.max(evt.clientX - this._startX + this._originalX, 0);
      // limit by min width
      x = Math.min(this._originalX + this._originalWidth - minWidth, x);
      this.x = x;
      this.width = this._originalX + this._originalWidth - this.x;
    }
  }

  updateContainerSize() {
    const area = (this.getRootNode() as ShadowRoot).host;
    this._containerWidth = area.clientWidth;
    this._containerHeight = area.clientHeight;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.updateContainerSize();

    this.width = this.config.width ?? 800;
    this.height = this.config.height ?? 600;
    if (this.config.expanded) {
      this.expand();
    }
    this.x = (this._containerWidth - this.width) / 2;
    this.y = (this._containerHeight - this.height) / 2;
    // If the initial layout is set, component will be already controlled
    if (this.controlled) {
      this.oldRect = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
      };
    }
  }

  stopResize(evt: PointerEvent) {
    this.resizeSide = '';
    this._snapPoints = defaultSnapPoints;
    document.body.removeEventListener('pointermove', this.resizeMove);
    (evt.currentTarget as HTMLElement).releasePointerCapture(evt.pointerId);
  }

  activate() {
    const event = new Event('activate', { composed: true });
    this.dispatchEvent(event);
  }

  pin() {
    const event = new Event('pin', { composed: true });
    this.dispatchEvent(event); 
  }

  close() {
    const event = new Event('close', { composed: true });
    this.dispatchEvent(event);
  }

  stopPropagation(evt: PointerEvent) {
    evt.stopPropagation();
  }

  elRef = createRef();

  render() {
    return html`
      <div class="window-frame"
        ${ref(this.elRef)}
        data-id=${this.id}
        @pointerdown=${this.activate}
      >
        ${when(!this.controlled, () => html`
          <div class="mouse-region"
            @pointerdown="${this.startResize}"
            @pointerup="${this.stopResize}"
          >
            <div data-side="s"></div>
            <div data-side="n"></div>
            <div data-side="w"></div>
            <div data-side="e"></div>
            <div data-side="nw"></div>
            <div data-side="ne"></div>
            <div data-side="sw"></div>
            <div data-side="se"></div>
          </div>
        `)}
        <header
          @pointerdown="${this.startDrag}"
          @pointerup="${this.stopDrag}"
          @dblclick="${this.expand}"
        >
          <sl-icon-button
            class="pin"
            name=${this.pinned ? 'pin' : 'pin-angle'}
            label="Pin"
            @pointerdown=${this.stopPropagation}
            @click=${this.pin}
          ></sl-icon-button>
          <h1>${this.config?.label}</h1>
          <div class="spacer"></div>
          ${when(!this.pinned && this.config.closable !== false, () => html`
            <sl-icon-button
              class="close"
              name="x-lg"
              label="Close"
              @pointerdown=${this.stopPropagation}
              @click=${this.close}
            ></sl-icon-button>
          `)}
        </header>
        <main ${ref(this.elChanged)}></main>
      </div>
    `;
  }

  static styles = css`
    :host {
      z-index: 0;
      position: absolute;
      --size: 6px;
      box-sizing: border-box;
    }

    :host([data-controlled]):not([data-expanded]) {
      z-index: 0 !important;
    }

    :host([data-expanded]) {
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      padding: 0 !important;
    }

    :host([data-active]) .window-frame {
      outline-color: var(--sl-color-primary-500);
      box-shadow: 0 0 10px rgba(0,0,0,0.3);
    }
    
    .window-frame {
      width: 100%;
      height: 100%;
      outline: 2px solid silver;
      position: relative;
      border-radius: 4px;
      background: white;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .mouse-region {
      width: 100%;
      height: 100%;
      position: absolute;
      padding: var(--size);
      z-index: -1;
      margin-left: calc(var(--size) * -1);
      margin-top: calc(var(--size) * -1);
      pointer-events: none;
    }
    .mouse-region div[data-side="w"],
    .mouse-region div[data-side="e"],
    .mouse-region div[data-side="n"],
    .mouse-region div[data-side="s"],
    .mouse-region div[data-side="nw"],
    .mouse-region div[data-side="ne"],
    .mouse-region div[data-side="sw"],
    .mouse-region div[data-side="se"] {
      position: absolute;
      width: 100%;
      height: 100%;
      background: transparent;
      pointer-events: all;
    }
    .mouse-region div[data-side="w"] {
      top: 0;
      left: 0;
      width: var(--size);
      cursor: ew-resize;
    }
    .mouse-region div[data-side="e"] {
      top: 0;
      right: 0;
      width: var(--size);
      cursor: ew-resize;
    }
    .mouse-region div[data-side="n"] {
      top: 0;
      left: 0;
      height: var(--size);
      cursor: ns-resize;
    }
    .mouse-region div[data-side="s"] {
      bottom: 0;
      left: 0;
      height: var(--size);
      cursor: ns-resize;
    }
    .mouse-region div[data-side="nw"],
    .mouse-region div[data-side="ne"],
    .mouse-region div[data-side="sw"],
    .mouse-region div[data-side="se"] {
      width: var(--size);
      height: var(--size);
    }
    .mouse-region div[data-side="nw"] {
      top: 0;
      left: 0;
      cursor: nwse-resize;
    }
    .mouse-region div[data-side="ne"] {
      top: 0;
      right: 0;
      cursor: nesw-resize;
    }
    .mouse-region div[data-side="sw"] {
      bottom: 0;
      left: 0;
      cursor: nesw-resize;
    }
    .mouse-region div[data-side="se"] {
      bottom: 0;
      right: 0;
      cursor: nwse-resize;
    }

    header {
      cursor: default;
      display: flex;
      align-items: center;
      height: 30px;
      background-color: var(--sl-color-neutral-100);
      user-select: none;
    }

    header h1 {
      font-size: 16px;
      white-space: nowrap;
      min-width: 0;
      text-overflow: ellipsis;
      overflow: hidden;
      margin: 0;
    }

    header .spacer {
      flex: 1;
    }

    main {
      --window-frame-padding: 10px;
      flex: 1;
      position: relative;
    }
    main > * {
      position: absolute;
      overflow: auto;
      inset: 0;
    }
  `;
}
