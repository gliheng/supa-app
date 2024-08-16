import { createContext } from '@lit/context';
import { nanoid } from 'nanoid';
import pick from 'lodash-es/pick';
import omit from 'lodash-es/omit';
import { LayoutInfo, Preset, Box } from './types';
import type { TileLayoutElement } from '.';
import { getStorage } from './storage.js';

const LAYOUT_KEY = 'layout';

export const layoutContext = createContext<LayoutManager>('tile-layout');

export class LayoutManager {
  constructor(
    private host: TileLayoutElement,
    private getMetrics: () => [number, number],
  ) {}

  update() {
    this.host.requestUpdate();
  }

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

    this.layoutInfo = val.map(e => ({
      id: nanoid(),
      ...e,
    }));
  }

  saveLayout() {
    this.storage?.save(LAYOUT_KEY, {
      ver: this.host.storageVer,
      config: this.layoutInfo?.map(e => omit(e, 'id')),
    });
  }

  layoutInfo?: LayoutInfo
  guideBox?: Box
  targetBox?: any

  // unit cell width, height and gap
  metrics = [0, 0]
  prepare(id: string) {
    this.metrics = this.getMetrics();
    this.targetBox = this.layoutInfo?.find(e => e.id == id);
    if (this.layoutInfo) {
      const idx = this.layoutInfo.findIndex(e => e.id == id);
      this.guideBox = pick(this.layoutInfo[idx], ['x', 'y', 'w', 'h']);
      this.update();
    }
  }

  /**
   * Convert left and top pixel coords to cell indexes
   * @param left relative pixel distance from left
   * @param top relative pixel distance from top
   * @returns cell index position
   */
  cellByPos(left: number, top: number): [number, number] {
    const gap = this.host.gap;
    const widthWithGap = this.metrics[0] + gap;
    const heightWithGap = this.metrics[1] + gap;
    let newX = Math.floor(left / widthWithGap);
    let newY = Math.floor(top / heightWithGap);
    return [newX, newY];
  }
  
  onResize(width: number, height: number) {
    if (!this.layoutInfo) return;

    const gap = this.host.gap;
    const widthWithGap = this.metrics[0] + gap;
    const heightWithGap = this.metrics[1] + gap;
    let newW = Math.max(1, Math.ceil((width + gap) / widthWithGap));
    let newH = Math.max(1, Math.ceil((height + gap) / heightWithGap));
    this.updateBox({
      w: newW,
      h: newH,
    })
  }

  onPan(left: number, top: number) {
    if (!this.layoutInfo) return;
    
    const gap = this.host.gap;
    const widthWithGap = this.metrics[0] + gap;
    const heightWithGap = this.metrics[1] + gap;
    // Offset left top center
    left += widthWithGap / 2;
    top += heightWithGap / 2;
    let [x, y] = this.cellByPos(left, top);
    x = Math.min(x, this.host.cols - this.targetBox.w);
    this.updateBox({ x, y });
  }

  updateBox(changed: Partial<Box>) {
    if (!this.layoutInfo) return;

    if (this.targetBox) {
      const idx = this.layoutInfo.findIndex(e => e.id == this.targetBox.id);
      if (idx != -1) {
        const box = this.layoutInfo![idx];
        const guide = pick({
          ...box,
          ...changed,
        }, ['x', 'y', 'w', 'h']);

        // Remove current box from layout calculation
        const boxes = [...this.layoutInfo];
        boxes.splice(idx, 1);

        if (this.host.compress) {
          compress(boxes, guide);
          this.guideBox = guide;
        } else {
          this.guideBox = hasOverlap(boxes, guide) ? undefined : guide;
        }
        // Ensure box is within bounds
        if (guide) {
          guide.x = Math.max(0, guide.x);
          guide.y = Math.max(0, guide.y);
          guide.w = Math.min(guide.w, this.host.cols - this.targetBox.x);
        }
        this.update();
      }
    }
  }

  finalize() {
    if (!this.layoutInfo) return;
    if (!this.guideBox) return;

    // apply update
    const idx = this.layoutInfo.findIndex(e => e.id == this.targetBox.id);
    let boxes = this.layoutInfo;
    const newBox = {
      ...boxes[idx],
      ...this.guideBox,
    }
    this.layoutInfo.splice(idx, 1, newBox);
    this.guideBox = undefined;
    this.update();
    this.saveLayout();
  }

  close(id: string) {
    const idx = this.layoutInfo?.findIndex(e => e.id == id);
    if (typeof idx == 'number' && idx != -1) {
      this.layoutInfo?.splice(idx, 1);
      if (this.layoutInfo?.length === 0) {
        this.layoutInfo = undefined;
      }
      this.update();
      this.saveLayout();
    }
  }
}

function isOverlap(a: Box, b: Box): boolean {
  return !(
    b.x >= a.x + a.w ||
    b.x + b.w <= a.x ||
    b.y >= a.y + a.h ||
    b.y + b.h <= a.y
  );
}

function getOverlap(boxes: Box[], target: Box): Box | undefined {
  for (let box of boxes) {
    if (isOverlap(box, target)) {
      return box;
    }
  }
}

function hasOverlap(boxes: Box[], target: Box): boolean {
  return Boolean(getOverlap(boxes, target));
}

/**
 * Vertically compress boxes
 * @param boxes Other boxes
 * @param target The box in action, can be empty
 */ 
function compress(boxes: Box[], target?: Box) {
  // Find an insertion index that will keep the list sorted
  if (target) {
    const i = bisect(boxes.map(e => e.y + e.h/2), target.y + target.h/2)
    boxes.splice(i, 0, target);
  }
  boxes.sort((a, b) => (a.y + a.h/2) - (b.y + b.h/2));
  compressBoxes(boxes)
}

function compressBoxes(boxes: Box[]) {
  const moveable = boxes.filter(e => !e.static);
  const immobilized = boxes.filter(e => e.static);
  const heights = [];
  for (let box of moveable) {
    let y = 0;
    // Iterate all columns occupied by this box,
    // find the y position this box will be placed at
    for (let i = box.x, j = box.x + box.w; i < j; i++) {
      y = Math.max(y, heights[i] ?? 0);
    }
    // Box is placed at y
    box.y = y;
    // If overlap with static boxes, move forward to avoid overlap
    let o;
    while (o = getOverlap(immobilized, box)) {
      box.y = o.y + o.h;
    }
    // Update current height for all columns
    for (let i = box.x, j = box.x + box.w; i < j; i++) {
      let maxH = y + box.h;
      heights[i] = maxH;
    }
  }
}

function bisect(nums: number[], n: number) {
  let lo = 0, hi = nums.length;
  while (lo < hi) {
    let m = Math.floor((lo + hi) / 2);
    if (nums[m] >= n) {
      hi = m;
    } else {
      lo = m + 1;
    }
  }
  return lo;
}
