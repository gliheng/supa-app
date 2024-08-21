import { examples as examples1 } from 'supa-app/examples';
import { examples as examples2 } from 'tile-layout/examples';
import { examples as examples3 } from 'flex-layout/examples';
import { examples as examples4 } from 'data-grid/examples';
import { examples as examples5 } from 'supa-blocks/examples';
import 'app-creator';

export const library = [
  {
    name: 'AppCreator',
    label: 'App Creator',
    element: 'app-creator',
    width: 800,
    height: 600,
    expanded: true,
  },
  ...examples1,
  ...examples2,
  ...examples3,
  ...examples4,
  ...examples5,
];
