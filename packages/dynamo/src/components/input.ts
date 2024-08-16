import { consume, provide } from '@lit/context';
import { LitElement, css, html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { dataContext, DataController, formContext, FormController } from '../context';

@customElement('sl-ext-input')
export class InputElement extends LitElement {
  @consume({ context: dataContext })
  @property({ attribute: false })
  private ctrl?: DataController;

  @consume({ context: formContext })
  @property({ attribute: false })
  private formCtrl?: FormController;

  connectedCallback() {
    super.connectedCallback();
    this.formCtrl?.register(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.formCtrl?.unregister(this);
  }

  @property({
    type: String
  })
  type: string;

  @property({
    type: String
  })
  placeholder: string;

  @property({
    type: String
  })
  label: string;

  onInput(evt: InputEvent) {
    const name = this.getAttribute('name');
    if (name) {
      this.ctrl.update(name, evt.target.value);
    }
  }

  render() {
    const name = this.getAttribute('name');
    let value;
    if (name) {
      value = this.ctrl.get(name);
    }
    return html`
      <sl-input
        type=${this.type ?? nothing}
        label=${this.label ?? nothing}
        placeholder=${this.placeholder ?? nothing}
        value=${value}
        @input=${this.onInput}
      ></sl-input>
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
    }
  `
}
