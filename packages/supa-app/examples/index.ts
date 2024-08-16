import { createWrapper } from 'supa-app/utils';

createWrapper({
  name: 'vue-template',
  type: 'vue',
  css: import('vue-template/style.css?inline'),
  component: import('vue-template'),
});

createWrapper({
  name: 'react-template',
  type: 'react',
  css: import('react-template/style.css?inline'),
  component: import('react-template'),
});

export const examples = [
  {
    name: 'VueTemplate',
    label: 'Vue template',
    element: 'vue-template',
    width: 500,
    height: 300,
  },
  {
    name: 'ReactTemplate',
    label: 'React template',
    element: 'react-template',
    width: 500,
    height: 300,
  },
];
