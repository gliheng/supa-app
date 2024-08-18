import { LitElement, PropertyValues, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js';

const CELL_HEIGHT = 10;

@customElement('layout-grid')
export class LayoutGridElement extends LitElement {
  canvas = createRef<HTMLCanvasElement>();

  drawGrid() {
    const ctx = this.canvas.value!.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 1;
      const w = this.clientWidth;
      for (let i = 0; i < 100; i++) {
        ctx.moveTo(0, i*CELL_HEIGHT);
        ctx.lineTo(w, i*CELL_HEIGHT);
      }
      ctx.stroke();
    }
  }

  firstUpdated() {
    this.drawGrid();
  }
  render() {
    return html`
      <canvas
        width=${this.clientWidth}
        height=${this.clientHeight}
        ${ref(this.canvas)}></canvas>
    `;
  }

  static styles = css`
  canvas {
    width: 100%;
    height: 100%;
  }
  `
}
