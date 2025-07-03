import { createWrapper } from 'supa-app/utils';

createWrapper({
  name: 'react-template',
  type: 'react',
  css: import('react-template/style.css?inline'),
  component: import('react-template'),
});

export const examples = [
  {
    name: 'ReactTemplate',
    label: 'React template',
    element: 'react-template',
    width: 500,
    height: 300,
  },
];
