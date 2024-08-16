import { createContext, consume } from '@lit/context';
import cloneDeep from 'lodash-es/cloneDeep';
import { nanoid } from 'nanoid';
import { getStorage } from './storage';
import { LayoutInfo, NormalizedPreset, Node, Preset, Rect } from './types';
import type { FlexLayout } from '.';

export const layoutContext = createContext<LayoutManager>('flex-layout');

const LAYOUT_KEY = 'layout';

export class LayoutManager {
  constructor(private host: FlexLayout, private update: (ids?: string[]) => void) {}

  presetMap: Record<string, NormalizedPreset> = {}
  preset?: NormalizedPreset
  // layoutInfo is a flat structure, while preset is nested
  // Nested is easy to calc layout
  layoutInfo?: LayoutInfo

  get storage() {
    if (!this.host.storageKey) return;
    return getStorage(this.host.storageKey);
  }

  loadPreset(val: Preset) {
    const saved = this.storage?.read(LAYOUT_KEY);
    if (saved) {
      const { ver, config } = saved;
      if (ver == this.host.storageVer) {
        val = config;
      }
    }

    const [preset, map] = normalizePreset(val);
    this.doLayout(preset);
    this.preset = preset;
    this.presetMap = map;
  }

  saveLayout() {
    this.storage?.save(LAYOUT_KEY, {
      ver: this.host.storageVer,
      config: this.preset,
    });
  }

  relayout() {
    this.doLayout(this.preset);
  }

  doLayout(preset?: NormalizedPreset) {
    const layout: LayoutInfo = [];
    const convert = (p: NormalizedPreset, rect: Rect) => {
      const { use } = p;
      const width = rect.right - rect.left;
      const height = rect.bottom - rect.top;
      let left = rect.left, top = rect.top;
      if (use == '$row' || use == '$col') {
        const totalFlex = p.children?.reduce((acc, e) => acc + (e.flex ?? 1), 0) ?? 0;
        p.children?.forEach(e => {
          let w = width, h = height;
          let newTop = top, newLeft = left;
          if (use == '$row') {
            w = (e.flex ?? 1) / totalFlex * width;
            newLeft += w;
          } else if (use == '$col') {
            h = (e.flex ?? 1) / totalFlex * height;
            newTop += h;
          }
          const newRect = {
            left: left,
            right: left + w,
            top: top,
            bottom: top + h,
          }
          left = newLeft;
          top = newTop;
          convert(e, newRect);
        });
      } else if (use == '$tab') {
        layout.push({
          ...rect,
          id: p.id
        });
      }
    };
    if (preset) {
      convert(preset, {
        left: 0,
        right: 1,
        top: 0,
        bottom: 1,
      });
      this.layoutInfo = layout;
    } else {
      this.layoutInfo = undefined;
    }
    this.update();
  }

  getNode(id: string) {
    return this.presetMap![id];
  }

  removeNode(id: string) {
    let remove = true;
    let needLayout = false;
    let stackId;
    let removed;
    while (remove) {
      const source = this.presetMap![id];
      if (!source.parent) {
        // root panel, remove everything
        this.preset = undefined;
        this.presetMap = {};
        break;
      }
      const parent = this.presetMap![source.parent];
      const idx = parent.children!.findIndex(e => e.id == id);
      const rm = parent.children!.splice(idx, 1);
      if (!removed) {
        // save the first remove
        // It is the panel not container
        removed = rm[0];
      }
      delete this.presetMap![id];
      remove = parent.children?.length == 0;
      if (remove) {
        id = parent.id;
        needLayout = true;
      } else {
        stackId = parent.id;
      }
    }
    if (needLayout) {
      this.relayout();
    } else {
      this.update([stackId!]);
    }
    return removed!;
  }

  movePanel(id: string, targetId: string, insert?: number) {
    const stackId = this.presetMap[id].parent;
    if (!stackId) return;
    const sourceStack = this.presetMap![stackId]
    const panelIdx = sourceStack.children!.findIndex(e => e.id == id);
    const targetStack = this.presetMap![targetId]
    const panel = sourceStack.children!.splice(panelIdx, 1)[0];
    if (insert === undefined) {
      targetStack.children!.push(panel);
    } else {
      targetStack.children!.splice(insert, 0, panel);
    }
    panel.parent = targetStack.id;
    if (sourceStack.children?.length == 0) {
      this.removeNode(stackId);
    }
    this.relayout();
    this.update([stackId, targetId]);
  }

  splitPanel(id: string, side: 'left' | 'right' | 'top' | 'bottom'): Node {
    let target = this.presetMap[id];
    const container = this.presetMap[target.parent];
    let stack = {
      use: '$tab',
      children: [],
    };
    if (container.use == '$col' && (side == 'top' || side == 'bottom')) {
      this.insertNode(container, stack, side == 'top' ? target : this.nextNode(target));
    } else if (container.use == '$row' && (side == 'left' || side == 'right')) {
      this.insertNode(container, stack, side == 'left' ? target : this.nextNode(target));
    } else {
      // Need to insert new container
      let node = {
        use: side == 'left' || side == 'right' ? '$row' : '$col',
        children: [],
      };
      this.wrapNode(target, node);
      this.insertNode(node, stack, side == 'left' || side == 'top' ? target : undefined);
    }
    this.doLayout(this.preset!);
    return stack;
  }

  wrapNode(node: Node, container: Node) {
    const parent = this.parentNode(node);
    if (!parent) return;
    this.insertNode(parent, container, node)
    const removed = this.removeNode(node.id);
    this.insertNode(container, removed);
  }

  insertNode(parent: Node, child: Node, ref?: Node) {
    child.parent = parent.id;
    if (!child.id) {
      child.id = nanoid();
    }
    if (!parent.children) {
      parent.children = [];
    }
    this.presetMap![child.id] = child as NormalizedPreset;
    if (ref) {
      let idx = parent.children.indexOf(ref);
      parent.children.splice(idx, 0, child);
    } else {
      parent.children.push(child);
    }
    child.parent = parent.id;
    this.update([parent.id]);
  }

  parentNode(node: Node) {
    if (!node.parent) return;
    return this.presetMap[node.parent];
  }

  nextNode(node: Node) {
    const parent = this.presetMap[node.parent!];
    if (!parent.children) return;
    let idx = parent.children.findIndex(e => e == node);
    return parent.children[idx + 1];
  }

  prevNode(node: Node) {
    const parent = this.presetMap[node.parent!];
    if (!parent.children) return;
    let idx = parent.children?.findIndex(e => e == node);
    return parent.children[idx - 1];
  }
}

function normalizePreset(val: Preset) {
  const presetMap: Record<string, NormalizedPreset> = {};
  const preset = cloneDeep(val) as NormalizedPreset;
  const convert = (node: NormalizedPreset, parent?: NormalizedPreset) => {
    if (!node.id) {
      node.id = nanoid();
      node.parent = parent?.id;
    }
    presetMap[node.id] = node;
    node.children?.forEach(e => convert(e, node));
  };
  convert(preset);
  return [preset, presetMap] as [NormalizedPreset, Record<string, NormalizedPreset>];
}
