import { LitElement, css, html, svg } from 'lit'
import { customElement, state } from 'lit/decorators.js'

const PADDING = 20;
const CELL_HEIGHT = 10;

@customElement('layout-grid')
export class LayoutGridElement extends LitElement {
  @state()
  size: number[] | null = null

  async connectedCallback() {
    super.connectedCallback();
    await this.updateComplete;
    this.size = [this.clientWidth, this.clientHeight]
  }

  render() {
    if (this.size) {
      const [width, height] = this.size;

      const lines = [];
      let w = width - 2*PADDING;
      let h = height - 2*PADDING;
      let originX = PADDING, originY = PADDING;
      let x = originX, y = originY;
      const bg = svg`
        <rect
          x="0"
          y="0"
          width=${w}
          height=${h}
        ></rect>`;
      y = CELL_HEIGHT;
      for (; y < h; y += CELL_HEIGHT) {
        lines.push(svg`<line x1="0" y1=${y} x2=${w} y2=${y}></line>`);
      }
      const cellWidth = w / 12;
      x = cellWidth;
      for (; x < w; x += cellWidth) {
        lines.push(svg`<line x1=${x} y1="0" x2=${x} y2=${h}></line>`);
      }

      return html`
        <svg version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          width=${width}
          height=${height}
        >
          <g transform=${`translate(${originX}, ${originY})`} stroke="silver" fill="none">
            ${bg}
            ${lines}
          </g>
        </svg>
      `;
    }
  }
}
