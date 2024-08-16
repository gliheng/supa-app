import { consume, provide } from '@lit/context';
import { LitElement, css, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { dataContext, DataController, formContext, FormController } from '../context';

@customElement('sl-ext-form')
export class FormElement extends LitElement {
  @provide({ context: formContext })
  formCtrl = new FormController(this);

  @provide({ context: dataContext })
  dataCtrl = new DataController(this);
  
  @consume({ context: dataContext })
  parentDataCtrl = null;

  render() {
    return html`
      <form>
        <slot></slot>
      </form>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }
  `
}
