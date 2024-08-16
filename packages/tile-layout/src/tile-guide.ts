import { LitElement, html, css, PropertyValues } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js';

@customElement('sp-tile-guide')
export class TileGuide extends LitElement {  
  @property({
    type: Number,
  })
  x = 0

  @property({
    type: Number,
  })
  y = 0

  @property({
    type: Number,
  })
  w = 0

  @property({
    type: Number,
  })
  h = 0

  @state()
  rect?: { x: number; y: number; w: number; h: number }

  async willUpdate(changed: PropertyValues) {
    if (changed.has('x') || changed.has('y') || changed.has('w') || changed.has('h')) {
      const { x, y, w, h } = this;
      // @ts-ignore
      this.style['grid-area'] = `${y + 1}/${x + 1}/span ${h}/span ${w}`;
      await this.updateComplete;
      this.rect = {
        x: this.offsetLeft,
        y: this.offsetTop,
        w: this.clientWidth,
        h: this.clientHeight,
      };  
    }
  }

  render() {
    let animated;
    if (this.rect) {
      const { x, y, w, h } = this.rect;
      animated = html`
        <div class="animated" style=${styleMap({
          left: `${x}px`,
          top: `${y}px`,
          width: `${w}px`,
          height: `${h}px`,
        })}></div>
      `;
    }
    return html`
      ${ animated }
    `;
  }

  static styles = css`
    :host {
      pointer-events: none;
    }
    .animated {
      position: absolute;
      transition: 0.5s;
      opacity: 0.5;
      background-color: var(--sl-color-neutral-300);
    }
  `
}

declare global {
  interface HTMLElementTagNameMap {
    'sp-tile-guide': TileGuide,
  }
}
