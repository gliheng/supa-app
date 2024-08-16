export interface AppConfig {
  name: string;
  label: string;
  element: string;
  width?: number;
  height?: number;
  expanded?: boolean;
  minWidth?: number;
  minHeight?: number;
  closable?: boolean;
  hideInLauncher?: boolean;
}

export type Library = AppConfig[];

export type Layouts = {
  name: string;
  icon: string;
  layout: {
    cols: number;
    rows: number;
    rowSizes?: number[];
    colSizes?: number[];
    slots: {
      x: number;
      y: number;
      w: number;
      h: number;
    }[];
  };
}[];

export interface Config {
  library: Library;
  layouts: Layouts;
}

const defaultLayouts = [
  {
    name: 'style1',
    icon: 'layout-split',
    layout: {
      cols: 2,
      rows: 1,
      slots: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
      ],
    },
  },
  {
    name: 'style2',
    icon: 'grid-1x2',
    layout: {
      cols: 2,
      rows: 2,
      slots: [
        { x: 0, y: 0, w: 1, h: 2 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 1, y: 1, w: 1, h: 1 },
      ],
    },
  },
  {
    name: 'style3',
    icon: 'grid',
    layout: {
      cols: 2,
      rows: 2,
      slots: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 0, y: 1, w: 1, h: 1 },
        { x: 1, y: 1, w: 1, h: 1 },
      ],
    },
  },
  {
    name: 'style4',
    icon: 'grid-3x3',
    layout: {
      cols: 3,
      rows: 3,
      slots: [
        { x: 0, y: 0, w: 1, h: 1 },
        { x: 1, y: 0, w: 1, h: 1 },
        { x: 2, y: 0, w: 1, h: 1 },
        { x: 0, y: 1, w: 1, h: 1 },
        { x: 1, y: 1, w: 1, h: 1 },
        { x: 2, y: 1, w: 1, h: 1 },
        { x: 0, y: 2, w: 1, h: 1 },
        { x: 1, y: 2, w: 1, h: 1 },
        { x: 2, y: 2, w: 1, h: 1 },
      ],
    },
  },
];

export function getDefaultConfig(): Config {
  return {
    library: [],
    layouts: defaultLayouts,
  };
}
