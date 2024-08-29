import { consume } from '@lit/context';
import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js';
import { layoutContext, LayoutManager } from './layout-context';
import { when } from 'lit/directives/when.js';

@customElement('sp-tile-panel')
export class TilePanel extends LitElement {
  @consume({ context: layoutContext })
  @property({ attribute: false })
  public manager!: LayoutManager;
  
  @property()
  id: string = ''

  @property()
  element: string = ''

  @property({
    type: Boolean,
  })
  static = false

  @property({
    type: Boolean,
  })
  closable = false

  _resizing = false
  _newWidth = 0
  _newHeight = 0

  _panning = false
  _offsetLeft = 0
  _offsetTop = 0
  _startLeft = 0
  _startTop = 0

  onPanStart(evt: PointerEvent) {
    if (this.static) return;

    evt.preventDefault();
    document.body.addEventListener('pointermove', this.onPanMove);
    (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
    this._panning = true;
    this._offsetLeft = 0;
    this._offsetTop = 0;
    this._startLeft = this.offsetLeft;
    this._startTop = this.offsetTop;
    this.style.transform = `translate(${this._offsetLeft}px, ${this._offsetTop}px)`;
    this.style.zIndex = `1`;
    this.manager.prepare(this.id);
  }

  onPanMove = (evt: PointerEvent) => {
    this._offsetLeft += evt.movementX * 0.8;
    this._offsetTop += evt.movementY * 0.8;
    this.style.transform = `translate(${this._offsetLeft}px, ${this._offsetTop}px)`;
    this.manager.onPan(this._offsetLeft + this._startLeft, this._offsetTop + this._startTop);
  }

  onPanEnd() {
    document.body.removeEventListener('pointermove', this.onPanMove);
    this._panning = false;
    this._offsetLeft = 0;
    this._offsetTop = 0;
    this._startLeft = 0;
    this._startTop = 0;
    this.style.transform = '';
    this.style.zIndex = '';
    this.manager.finalize();
  }

  onResizeStart(evt: PointerEvent) {
    if (this.static) return;

    evt.preventDefault();
    evt.stopPropagation();
    document.body.addEventListener('pointermove', this.onResizeMove);
    (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
    this._resizing = true;
    this._newWidth = this.clientWidth;
    this._newHeight = this.clientHeight;
    this.style.position = 'absolute';
    this.style.zIndex = '1';
    this.style.width = `${this._newWidth}px`;
    this.style.height = `${this._newHeight}px`;
    this.manager.prepare(this.id);
  }

  onResizeMove = (evt: PointerEvent) => {
    this._newWidth = Math.max(this._newWidth + evt.movementX * 0.8, 0);
    this._newHeight = Math.max(this._newHeight + evt.movementY * 0.8, 0);
    this.style.width = `${this._newWidth}px`;
    this.style.height = `${this._newHeight}px`;
    this.manager.onResize(this._newWidth, this._newHeight);
  }

  onResizeEnd() {
    document.body.removeEventListener('pointermove', this.onResizeMove);
    this._resizing = false;
    this._newWidth = 0;
    this._newHeight = 0;
    this.style.position = '';
    this.style.zIndex = '';
    this.style.width = '';
    this.style.height = '';
    this.manager.finalize();
  }

  stopPropagation(evt: PointerEvent) {
    evt.stopPropagation();
  }

  onClose() {
    this.manager.close(this.id);
  }

  render() {
    return html`
      <div class="tile-panel"
        @pointerdown=${this.onPanStart}
        @pointerup=${this.onPanEnd}
        ${ref((el) => {
          if (el && el.children.length == 0 && this.element) {
            el.appendChild(document.createElement(this.element));
          }
        })}
      ></div>
      ${when(this.closable, () => html`
        <sl-icon-button
          class="close-btn"
          name="x-lg"
          label="Close"
          @pointerdown=${this.stopPropagation}
          @click=${this.onClose}
        ></sl-icon-button>
      `)}
      ${when(!this.static, () => html`
        <div class="tile-resize"
          @pointerdown=${this.onResizeStart}
          @pointerup=${this.onResizeEnd}
        ></div>
      `)}
    `;
  }

  static styles = css`
    :host {
      display: flex;
      position: relative;
    }
    .tile-panel {
      flex: 1;
      display: flex;
    }
    .close-btn {
      position: absolute;
      top: 0;
      right: 0;
      color: var(--sl-color-neutral-200);
      font-size: var(--sl-font-size-x-small);
    }
    .tile-resize {
      position: absolute;
      cursor: se-resize;
      border: var(--tile-resize-border-width, 2px) solid var(--sl-color-neutral-300);
      border-left: none;
      border-top: none;
      right: 1px;
      bottom: 1px;
      width: var(--tile-resize-size, 6px);
      height: var(--tile-resize-size, 6px);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-tile-panel': TilePanel,
  }
}
