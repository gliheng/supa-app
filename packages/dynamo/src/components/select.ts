import { consume, provide } from '@lit/context';
import { LitElement, css, html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { dataContext, DataController, formContext, FormController } from '../context';

@customElement('sl-ext-select')
export class SelectElement extends LitElement {
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
  placeholder: string;

  @property({
    type: String
  })
  label: string;

  @property({
    type: Array,
  })
  options: {label: string; value: any}[] = [];

  onInput(evt: InputEvent) {
    console.log('input',evt);
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
      <sl-select
        label=${this.label ?? nothing}
        placeholder=${this.placeholder ?? nothing}
        value=${value}
        @input=${this.onInput}
      >
        ${this.options.map(e => html`<sl-option value=${e.value}>${e.label}</sl-option>`)}
      </sl-select>
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
    }
  `
}
