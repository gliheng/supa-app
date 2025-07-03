import { createWrapper } from 'supa-app/utils';

createWrapper({
  name: 'vue-template',
  type: 'vue',
  css: import('vue-template/style.css?inline'),
  component: import('vue-template'),
});

export const examples = [
  {
    name: 'VueTemplate',
    label: 'Vue template',
    element: 'vue-template',
    width: 500,
    height: 300,
  },
];
