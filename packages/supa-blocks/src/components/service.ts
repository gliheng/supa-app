import { consume, provide } from '@lit/context';
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { dataContext, DataController } from '../context';

@customElement('sl-ext-service')
export class ServiceElement extends LitElement {
  @provide({ context: dataContext })
  dataCtrl = new DataController(this);

  @consume({ context: dataContext })
  parentDataCtrl = null;

  render() {
    return html`
      <slot></slot>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
  `
}
