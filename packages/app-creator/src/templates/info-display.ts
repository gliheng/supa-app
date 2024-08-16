import { LitElement, css, html } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { map } from 'lit/directives/map.js';

@customElement('info-display')
export class InfoDisplayElement extends LitElement {
  @property()
  config = [
    { label: 'Name', value: 'Toy' },
    { label: 'Price', value: '$100' },
  ]

  @state()
  data = {}

  render() {
    return html`
      ${map(this.config, (e) => html`
        <div class="group">
          <div>${e.label}</div>
          <p>${e.value}</p>
        </div>
      `)}
    `;
  }
  static styles = css`
    :host {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      width: 100%;
    }
    .group {
      text-align: center;
      p {
        font-weight: bold;
      }
    }
  `
}
