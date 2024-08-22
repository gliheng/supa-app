import { Descriptor } from './types';

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

function _compile(desc: Descriptor, code: string[]) {
  if (typeof desc == 'string') {
    code.push(desc);
    return;
  }

  const { type, children, style, props = {}, ...rest } = desc;
  const tag = typeRegistry[type as keyof typeof typeRegistry] ?? type;
  code.push(`<${tag}`);
  const attrs: string[] = [];
  if (style) {
    attrs.push('style="' + Object.entries(style).map(([k, v]) => `${k}:${v}`).join(';') + '"');
  }
  for (const [prop, value] of Object.entries(Object.assign(rest, props))) {
    if (prop.startsWith('on')) {
      attrs.push(`@${prop.substring(2).toLowerCase()}=\${(evt) => { const ctrl = getDataCtrl(evt); ctrl && ctrl.eval(\`${value}\`) }}`)
    } else if (typeof value == 'boolean') {
      value && attrs.push(prop);
    } else if (prop == 'data' || typeof value == 'object') {
      attrs.push(`.${prop}=\${${JSON.stringify(value)}}`)
    } else {
      attrs.push(`${prop}="${String(value)}"`);
    }
  }
  if (attrs.length) {
    code.push(' ' + attrs.join(' '));
  }
  code.push(`>`);

  if (Array.isArray(children)) {
    for (const c of children) {
      _compile(c, code);
    }
  } else if (children) {
    _compile(children, code);
  }

  code.push(`</${tag}>`);
}

export function compile(desc: Descriptor) {
  const code: string[] = [];
  _compile(desc, code);
  console.log('code?', code.join(''));
  return 'html`' + code.join('') + '`';
}
