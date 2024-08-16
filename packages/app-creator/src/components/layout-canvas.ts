import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';

const MAX_SCALE = 150;
const MIN_SCALE = 10;

@customElement('layout-canvas')
export class LayoutCanvasElement extends LitElement {
  viewport = createRef()

  @state()
  scale = 100

  @state()
  placementX = 100

  @state()
  placementY = 100

  connectedCallback() {
    super.connectedCallback();
  }

  // transform cause scrollbar not properly computed
  fixScroll() {
    const el = this.viewport.value;
    el.style.display = 'none';
    el.offsetHeight;
    el.style.display = '';
  }

  onZoomIn() {
    this.scale = Math.min(MAX_SCALE, this.scale + 10);
    this.fixScroll();
  }

  onZoomOut() {
    this.scale = Math.max(MIN_SCALE, this.scale - 10);
    this.fixScroll();
  }

  render() {
    return html`
      <div class="viewport" ${ref(this.viewport)}>
        <div class="canvas" style=${styleMap({
          transform: `scale(${this.scale}%)`,
        })}>
          <div class="canvas-inner">
            Canvas!
          </div>
        </div>
      </div>
      <div class="zoomer">
        <sl-icon-button
          name="dash-lg"
          label="zoom out"
          @click=${this.onZoomOut}
        ></sl-icon-button>
        ${this.scale}%
        <sl-icon-button
          name="plus-lg"
          label="zoom in"
          @click=${this.onZoomIn}
        ></sl-icon-button>
      </div>
    `;
  }
  static styles = css`
    :host {
      flex: 1;
      background: silver;
      position: relative;
      overflow: hidden;
    }
    .viewport {
      overflow: auto;
      height: 100%;
    }
    .canvas {
      will-change: transform;
      transform-origin: 0 0;
      padding: 100px;
      width: fit-content;
    }
    .canvas-inner {
      min-width: 800px;
      min-height: 600px;
      background: white;    
    }
    .zoomer {
      border-radius: var(--sl-border-radius-small);
      position: absolute;
      bottom: var(--sl-spacing-x-small);
      left: var(--sl-spacing-x-small);
      background: white;
      box-shadow: var(--sl-shadow-medium);
    }
  `;
}
