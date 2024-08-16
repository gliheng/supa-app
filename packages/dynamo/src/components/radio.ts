import { consume, provide } from '@lit/context';
import { LitElement, RenderOptions, css, html, nothing } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import { when } from 'lit/directives/when.js';
import { dataContext, DataController, formContext, FormController } from '../context';

@customElement('sl-ext-radio')
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
    type: Boolean
  })
  button = false;

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
    const name = this.getAttribute('name');
    if (name) {
      this.ctrl.update(name, evt.target.value);
    }
  }

  _renderOptions() {
    return html`${this.options.map(e =>
      this.button
        ? html`<sl-radio-button value=${e.value}>${e.label}</sl-radio-button>`
        : html`<sl-radio value=${e.value}>${e.label}</sl-radio>`
    )}`;
  }

  render() {
    const name = this.getAttribute('name');
    let value;
    if (name) {
      value = this.ctrl.get(name);
    }
    return html`
      <sl-radio-group
        label=${this.label ?? nothing}
        placeholder=${this.placeholder ?? nothing}
        value=${value}
        @input=${this.onInput}
      >
        ${this._renderOptions()}
      </sl-radio-group>
    `;
  }

  static styles = css`
    :host {
      display: inline-block;
    }
  `
}
