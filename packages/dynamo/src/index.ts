import './components';

const typeRegistry = {
  'page': 'sl-ext-page',
  'button': 'sl-button',
  'form': 'sl-ext-form',
  'service': 'sl-ext-service',
  'input': 'sl-ext-input',
  'text': 'sl-ext-text',
  'card': 'sl-card',
  'icon-button': 'sl-icon-button',
  'button-group': 'sl-button-group',
  'details': 'sl-details',
  'color-picker': 'sl-color-picker',
  'select': 'sl-ext-select',
  'tab-group': 'sl-tab-group',
  'tab': 'sl-tab',
  'tab-panel': 'sl-tab-panel',
  'textarea': 'sl-ext-textarea',
  'radio': 'sl-ext-radio',
  'checkbox': 'sl-ext-checkbox',
};

export type Descriptor = {
  type: string;
  children?: Descriptor[] | Descriptor;
  class?: string;
  id?: string;
  props?: Record<string, any>;
  data?:  Record<string, any>;
  style?: Record<string, any>;
} & Record<string, any> | string;

declare global {
  interface HTMLElement {
    contextData?: Record<string, any>;
  }
}

export function render(desc: Descriptor, container: HTMLElement) {
  if (typeof desc == 'string') {
    const txt = document.createTextNode(desc);
    container.appendChild(txt);
    return;
  }

  const { type, children, id, class: className, style, data, props = {}, ...rest } = desc;

  const el = document.createElement(typeRegistry[type as keyof typeof typeRegistry] ?? type);
  for (const [prop, value] of Object.entries(Object.assign(rest, props))) {
    if (typeof value == 'boolean') {
      value && el.setAttribute(prop, '');
    } else if (typeof value == 'object') {
      (el as any)[prop] = value;
    } else {
      el.setAttribute(prop, value);
    }
  }
  if (id) {
    el.id = id;
  }
  if (className) {
    el.className = className;
  }
  if (style) {
    for (const key in style) {
      el.style[key] = style[key];
    }
  }
  if (data && el.contextData) {
    Object.assign(el.contextData, data);
  }
  
  if (Array.isArray(children)) {
    for (const c of children) {
      render(c, el);
    }
  } else if (children) {
    render(children, el);
  }
  container.appendChild(el);
}
