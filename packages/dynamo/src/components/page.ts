import { provide } from '@lit/context';
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { dataContext, DataController } from '../context';

@customElement('sl-ext-page')
export class PageElement extends LitElement {
  @provide({ context: dataContext })
  dataCtrl = new DataController(this);

  @property()
  title = ''

  render() {
    return html`
      ${when(this.title, () => html`<h1>${this.title}</h1>`)}
      <slot></slot>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
    h1 {
      font-size: 1.2rem;
      border-bottom: 1px solid silver;
    }
  `
}
