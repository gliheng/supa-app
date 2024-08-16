import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('sp-data-grid-cell')
export class DataGridCellElement extends LitElement {
  @property({
    attribute: false,
  })
  data: any;

  @property({
    attribute: false,
  })
  hResize = false;

  @property({
    attribute: false,
  })
  vResize = false;

  startPos = 0;
  dragDir = '';
  dragging = false;

  startResize(evt: PointerEvent) {
    evt.preventDefault();
    const target = evt.currentTarget!;
    const ds = target.dataset;
    const deltas = this.getRootNode().host.deltas;
    if ('vertical' in ds) {
      const now = deltas.row[this.data.row] ?? 0;
      this.startPos = evt.clientY - now;
      this.dragDir = 'v';
    } else if ('horizontal' in ds) {
      const now = deltas.col[this.data.col] ?? 0;
      this.startPos = evt.clientX - now;
      this.dragDir = 'h';
    }
    this.setPointerCapture(evt.pointerId);
    this.addEventListener('pointermove', this.move);
    this.addEventListener('pointerup', this.stopResize);
  }

  move = (evt: PointerEvent) => {
    if (
      !this.dragging && (
        this.dragDir == 'h' && evt.movementX ||
        this.dragDir == 'v' && evt.movementY
      )
    ) {
      this.dragging = true;
    }
    if (this.dragging) {
      let detail;
      if (this.dragDir == 'h') {
        detail = {
          dir: 'h',
          n: this.data.col,
          value: evt.clientX - this.startPos,
        };
      } else if (this.dragDir == 'v') {
        detail = {
          dir: 'v',
          n: this.data.row,
          value: evt.clientY - this.startPos,
        };
      }
      const event = new CustomEvent('resize', { composed: true, bubbles: true, detail });
      this.dispatchEvent(event);
    }
  }

  stopResize = () => {
    this.dragging = false;
    this.dragDir = '';
    this.startPos = 0;
    this.removeEventListener('pointermove', this.move);
    this.removeEventListener('pointerup', this.stopResize);
  }

  createRenderRoot() {
    return this;
  }

  render() {
    const { data } = this;
    let content;
    if (data.render) {
      content = data.render();
    } else {
      content = data.formatted ?? data.data;
    }

    let hResizer;
    if (this.hResize) {
      hResizer = html`
        <div class="data-grid-h-resizer"
          data-horizontal
          @pointerdown=${this.startResize}
        ></div>`;
    }
    let vResizer;
    if (this.vResize) {
      vResizer = html`
        <div class="data-grid-v-resizer"
          data-vertical
          @pointerdown=${this.startResize}
        ></div>`;
    }
    return html`
      <div class="data-grid-cell">${ content }</div>
      ${hResizer}
      ${vResizer}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-data-grid-cell': DataGridCellElement;
  }
}
