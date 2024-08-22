import { LitElement, css, html } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';
import './layout-grid';

const MAX_SCALE = 150;
const MIN_SCALE = 50;
const PADDING = 100;

@customElement('layout-canvas')
export class LayoutCanvasElement extends LitElement {
  canvas = createRef()

  @state()
  scale = 100

  @state()
  size = [800, 600]

  @state()
  showGrid = false

  onZoomIn() {
    this.scale = Math.min(MAX_SCALE, this.scale + 10);
  }

  onZoomOut() {
    this.scale = Math.max(MIN_SCALE, this.scale - 10);
  }

  onDragenter(evt: DragEvent) {
    evt.preventDefault();
    this.showGrid = true;
    console.log('dragenter', evt);
  }

  onDragleave(evt: DragEvent) {
    this.showGrid = false;
  }

  onDragover(evt: DragEvent) {
    evt.preventDefault();
    console.log('dragover', evt);
  }

  onDrop(evt: DragEvent) {
    evt.preventDefault();
    this.showGrid = false;
    const material = evt.dataTransfer?.getData("material");
    console.log('drop', material);
  }

  render() {
    return html`
      <div class="viewport">
        <div class="canvas"
          style=${styleMap({
            width: `${this.size[0]*this.scale/100 + 2*PADDING}px`,
            height: `${this.size[1]*this.scale/100 + 2*PADDING}px`,
          })}
        >
          <div class="canvas-inner"
            ${ref(this.canvas)}
            @dragenter=${this.onDragenter}
            @dragleave=${this.onDragleave}
            @dragover=${this.onDragover}
            @drop=${this.onDrop}
            style=${styleMap({
              width: `${this.size[0]}px`,
              height: `${this.size[1]}px`,
              transform: `translate(100px, 100px) scale(${this.scale}%)`,
            })}
          >
            ${when(this.showGrid, () => {
              return html`
                <layout-grid></layout-grid>
              `;
            })}
            Canvas!
          </div>
        </div>
      </div>
      <div class="zoomer">
        <sl-icon-button
          name="dash-lg"
          label="zoom out"
          @click=${this.onZoomOut}
          ?disabled=${this.scale <= MIN_SCALE}
        ></sl-icon-button>
        ${this.scale}%
        <sl-icon-button
          name="plus-lg"
          label="zoom in"
          @click=${this.onZoomIn}
          ?disabled=${this.scale >= MAX_SCALE}
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
    }
    .canvas-inner {
      will-change: transform;
      transform-origin: 0 0;
      background: white;
      position: relative;
    }
    layout-grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
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
