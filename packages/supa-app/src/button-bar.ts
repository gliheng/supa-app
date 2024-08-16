import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js';
import { ref } from 'lit/directives/ref.js';
import { when } from 'lit/directives/when.js';

interface ButtonType {
  id: string;
  name: string;
  variant: string;
  onClick?: () => void;
  closable?: boolean;
}

@customElement('sp-button-bar')
export class RunListElement extends LitElement {
  @property({ attribute: false })
  buttons: ButtonType[] = [];

  @state()
  dragging = false;

  @state()
  offset = 0;

  @state()
  dragData?: string = undefined;

  @state()
  showScrollButtons = false;

  wrapperRef!: HTMLElement;
  observer!: ResizeObserver;
  connectedCallback() {
    super.connectedCallback();
    this.observer = new ResizeObserver((_entries) => {
      this.checkOverflow();
    });
  }

  checkOverflow() {
    const el = this.wrapperRef;
    this.showScrollButtons = el.scrollWidth > el.clientWidth;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.observer.disconnect();
  }

  updated(attrs: Map<string, any>) {
    if (attrs.has('buttons')) {
      // Wait for sl-button mount, then we can take measure
      queueMicrotask(() => {
        this.checkOverflow();
      });
    }
  }

  startX = 0;
  currentIndex = -1;
  // If not moved, click handler will be called at end of pointer interaction
  moved = false;
  // Button positions used to find insertions when dragging
  posList?: Array<number>;
  startDrag(evt: PointerEvent) {
    if (evt.button != 0) return;

    evt.preventDefault();
    const el = evt.currentTarget as HTMLElement;
    const id = el.dataset.id;
    this.dragData = id;
    this.startX = evt.clientX - el.offsetLeft + this.wrapperRef.scrollLeft;
    this.currentIndex = Array.from(el.parentElement!.children).indexOf(el);
    document.body.addEventListener('pointermove', this.move);
    el.setPointerCapture(evt.pointerId);
  }

  move = (evt: PointerEvent) => {
    // Prevent accidental moves
    if (!this.dragging && Math.abs(evt.movementX) > 2) {
      this.dragging = true;
      this.posList = Array.from(this.wrapperRef.children ?? [])
        .map(e => {
          const rect = e.getBoundingClientRect();
          return rect.left + rect.width / 2;
        });
    }
    if (!this.dragging) return;

    this.moved = true;
    let offset = evt.clientX - this.startX;
    this.offset = offset;
    const i = bisect(this.posList!, offset);
    if (this.currentIndex != i) {
      const event = new CustomEvent(
        'reorder',
        { composed: true, detail: { data: this.dragData, i: i } },
      );
      this.dispatchEvent(event);
      this.currentIndex = i;
    }
  }

  stopDrag(evt: PointerEvent) {
    console.log('pointer up!');
    this.dragging = false;
    this.dragData = undefined;
    this.offset = 0;
    document.body.removeEventListener('pointermove', this.move);
    (evt.currentTarget as HTMLElement).releasePointerCapture(evt.pointerId);
    // Trigger click event on button
    if (!this.moved && this.currentIndex != -1) {
      const el = evt.currentTarget as HTMLElement;
      const id = el.dataset.id;
      const item = this.buttons.find(e => e.id == id);
      item?.onClick?.();
    }
    this.moved = false;
  }

  stopPropagation(evt: PointerEvent) {
    evt.stopPropagation();
  }

  onClose(evt: PointerEvent) {
    const el = (evt.target as HTMLElement).closest('[data-id]') as HTMLElement;
    const event = new CustomEvent(
      'close',
      { composed: true, bubbles: true, detail: { data: el.dataset.id } },
    );
    this.dispatchEvent(event);
  }

  goLeft() {
    const el = this.wrapperRef;
    el.scrollLeft = el.scrollLeft - 300;
  }

  goRight() {
    const el = this.wrapperRef;
    el.scrollLeft = el.scrollLeft + 300;
  }

  renderDragDummy(dragItem: ButtonType) {
    const { id, name, variant } = dragItem;
    return html`
      <sl-button
        class="drag-dummy"
        style=${styleMap({
          left: `${this.offset}px`,
        })}
        size="small"
        data-id=${id}
        variant="${variant}"
      >${name}</sl-button>
    `;
  }

  renderButtons() {
    return this.buttons.map(e => {
      return html`
        <sl-button
          style=${styleMap({
            'visibility': this.dragging && e.id === this.dragData ? 'hidden' : 'visible',
          })}
          size="small"
          data-id=${e.id}
          variant="${e.variant}"
          @pointerdown=${this.startDrag}
          @pointerup=${this.stopDrag}
        >
          ${e.name}
          ${when(
            e.closable !== false,
            () => html`
              <sl-icon-button
                class="close-btn"
                name="x-lg"
                label="Close"
                @pointerdown=${this.stopPropagation}
                @click=${this.onClose}
              ></sl-icon-button>
            `
          )}
        </sl-button>
      `;
    });
  }

  render() {
    return html`
      ${when(this.showScrollButtons, () => html`
        <sl-icon-button
          class="left"
          name="chevron-compact-left"
          @click=${this.goLeft}
        ></sl-icon-button>
      `)}
      <div class="button-bar" ${ref((el) => {
        const oldEl = this.wrapperRef
        if (oldEl) {
          this.observer.unobserve(oldEl);
        }
        if (el) {
          this.observer.observe(el);
          this.wrapperRef = el as HTMLElement;
        }
      })}>
        ${this.renderButtons()}
      </div>
      ${when(this.showScrollButtons, () => html`
        <sl-icon-button
          class="right"
          name="chevron-compact-right"
          @click=${this.goRight}
        ></sl-icon-button>
      `)}
      ${when(this.dragging && this.dragData, () => {
        let item = this.buttons.find(e => e.id == this.dragData);
        return this.renderDragDummy(item!);
      })}
    `;
  }

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      position: relative;
    }
    .button-bar {
      display: flex;
      flex: 1;
      gap: 4px;
      min-width: 0;
      overflow: hidden;
      scroll-behavior: smooth;
    }
    .left::part(base), .right::part(base) {
      padding: 0.5rem 0.2rem;
    }
    .drag-dummy {
      position: absolute;
      opacity: 0.8;
    }
    .close-btn {
      margin-left: 0.2rem;
      margin-right: -0.4rem;
      font-size: var(--sl-button-font-size-medium);
      vertical-align: middle;
      color: var(--sl-color-gray-200);
    }
    sl-button[variant='default'] .close-btn {
      color: var(--sl-color-gray-800);
    }
    .close-btn::part(base) {
      padding: 0.2rem;
    }
  `;
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
