import { LitElement, html, css } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { provide } from '@lit/context';
import { when } from 'lit/directives/when.js';
import { repeat } from 'lit/directives/repeat.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ref, createRef } from 'lit/directives/ref.js';
import { layoutContext, LayoutManager } from './layout-context';
import type { Preset } from './types';
import './tile-panel';
import './tile-guide';

@customElement('sp-tile-layout')
export class TileLayoutElement extends LitElement {
  @provide({ context: layoutContext })
  manager = new LayoutManager(
    this,
    () => {
      let unitCellEl = this._unitCellRef.value!;
      return [unitCellEl.clientWidth, unitCellEl.clientHeight];  
    },
  );

  @property({
    type: Number,
  })
  cols = 12

  @property({
    type: Number,
  })
  rowHeight = 100

  _preset?: Preset
  @property({
    attribute: false,
  })
  set preset(val: Preset | undefined) {
    this._preset = val;
    if (val) {
      this.manager.loadPreset(val);
    }
  }

  get preset() {
    return this._preset;
  }

  @property({
    type: Number,
  })
  gap = 4

  @property({
    type: Boolean,
  })
  compress = true

  @property({
    attribute: 'storage-key',
  })
  storageKey?: string

  @property({
    attribute: 'storage-ver',
  })
  storageVer?: string

  _unitCellRef = createRef()

  renderLayout() {
    const { layoutInfo, guideBox } = this.manager;

    return html`
      <div class="tile-layout"
        style=${styleMap({
          'grid-template-columns': `repeat(${this.cols}, 1fr)`,
          'grid-auto-rows': `${this.rowHeight}px`,
          'gap': `${this.gap}px`,          
        })}
      >
        <div class="tile-layout-unit-cell" ${ref(this._unitCellRef)}></div>
        ${
          repeat(layoutInfo!, e => e.id, e => {
            const { x, y, w, h } = e;
            return html`
              <sp-tile-panel
                id=${e.id}
                element=${ifDefined(e.use)}
                ?closable=${e.closable}
                ?static=${e.static}
                style=${styleMap({
                  'grid-area': `${y + 1}/${x + 1}/span ${h}/span ${w}`,
                })}
              >
              </sp-tile-panel>
            `;
          })
        }
        ${when(guideBox, () => {
          const { x, y, w, h } = guideBox!;
          return html`
            <sp-tile-guide x=${x} y=${y} w=${w} h=${h}></sp-tile-guide>
          `;
        })}
      </div>
    `;
  }

  render() {
    return html`
      ${when(
        this.manager.layoutInfo,
        () => this.renderLayout(),
        () => html`<slot name="placeholder"></slot>`
      )}
    `;
  }

  static styles = css`
    :host {
      flex: 1;
      display: flex;
    }
    .tile-layout {
      flex: 1;
      display: grid;
      grid-auto-flow: row;
      position: relative;
      overflow-x: hidden;
    }
    .tile-layout-unit-cell {
      pointer-events: none;
      opacity: 0;
      grid-area: 1 / 1;
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-tile-layout': TileLayoutElement
  }
}
