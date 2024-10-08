import { LitElement, css, html } from 'lit'
import { customElement } from 'lit/decorators.js'
import { createRef, ref } from 'lit/directives/ref.js';
import { render, Descriptor } from 'dynamo';
import json from './demo.json';
import counter from './counter.json';
import jsonScope from './scope.json';
import jsonForm from './form.json';
import jsonDynamicForm from './dynamic-form.json';

@customElement('dynamo-demo')
export class DynamoDemo extends LitElement {
  renderUI(json: Descriptor, el?: Element) {
    if (el) {
      render(json, el as HTMLElement);
    }
  }

  render() {
    return html`
      <div ${ref(this.renderUI.bind(this, json as unknown as Descriptor))}></div>
      <div ${ref(this.renderUI.bind(this, jsonScope as unknown as Descriptor))}></div>
      <div ${ref(this.renderUI.bind(this, counter as unknown as Descriptor))}></div>
      <div ${ref(this.renderUI.bind(this, jsonForm as unknown as Descriptor))}></div>
      <div ${ref(this.renderUI.bind(this, jsonDynamicForm as unknown as Descriptor))}></div>
    `;
  }
  static styles = css`
    :host {
      padding: 10px;
    }
  `
}

export const examples = [
  {
    name: 'DynamoDemo',
    label: 'Dynamo demo',
    element: 'dynamo-demo',
    width: 800,
    height: 600,
  },
];

declare global {
  interface HTMLElementTagNameMap {
    'dynamo-demo': DynamoDemo;
  }
}
