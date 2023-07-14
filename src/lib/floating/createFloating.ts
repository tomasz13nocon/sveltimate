import {
  computePosition,
  type Placement,
  type Strategy,
  type Middleware,
  type Platform,
  type ReferenceElement,
} from "@floating-ui/dom";
import { roundByDPR } from "./utils/roundByDPR.js";
import { getDPR } from "./utils/getDPR.js";
import { derived, writable } from "svelte/store";

interface FloatingOptions {
  placement?: Placement;
  strategy?: Strategy;
  middleware?: Array<Middleware | null | undefined | false>;
  platform?: Platform;
  transform?: boolean;

  /**
   * A callback invoked when both the reference and floating elements are
   * mounted, and cleaned up when either is unmounted. This is useful for
   * setting up event listeners (e.g. pass `autoUpdate`).
   */
  whileElementsMounted?: (
    reference: ReferenceElement,
    floating: HTMLElement,
    update: () => void
  ) => () => void;
  elements?: {
    reference?: ReferenceElement | null;
    floating?: HTMLElement | null;
  };
  /**
   * The `open` state of the floating element to synchronize with the
   * `isPositioned` value.
   */
  open?: boolean;
}

export function createFloating({
  placement = "bottom",
  strategy = "absolute",
  middleware = [],
  platform,
  elements: { reference: externalReference, floating: externalFloating } = {},
  transform = true,
  whileElementsMounted,
  open,
}: FloatingOptions = {}) {
  let referenceNode: ReferenceElement | null | undefined = externalReference;
  let floatingNode: HTMLElement | null | undefined = externalFloating;
  let cleanup: ReturnType<Exclude<typeof whileElementsMounted, undefined>> | null = null;
  const _floatingStyles = writable({
    position: strategy,
    left: 0,
    top: 0,
  });
  const floatingStyles = derived(_floatingStyles, ($styles) =>
    Object.entries($styles).reduce((acc, [key, value]) => acc + `${key}:${value};`, "")
  );
  const data = writable({
    x: 0,
    y: 0,
    strategy,
    placement,
    middlewareData: {},
    isPositioned: false,
  });
  // derived(data, ({ x, y, strategy, placement, middlewareData, isPositioned }) => ({
  //   x,
  //   y,
  //   strategy,
  // })).subscribe(setFloatingStyles);
  data.subscribe(setFloatingStyles);

  function update() {
    if (!referenceNode || !floatingNode) {
      return;
    }

    const config = {
      placement,
      strategy,
      middleware,
    };

    if (platform) {
      config.platform = platform;
    }

    console.log(platform);
    computePosition(referenceNode, floatingNode, config).then((newData) => {
      if (!floatingNode) {
        return;
      }
      // only if data changed, set data
      // only set data if is mounted (layout effect)
      data.set({ ...newData, isPositioned: true });
    });
  }

  // This should run whenever whileElementsMounted, refNode, floatingNode, middleware, placement, strategy or platform change
  function callUpdate() {
    // This is already checked in update, prob don't need it here
    if (!referenceNode || !floatingNode) {
      return;
    }

    if (whileElementsMounted) {
      cleanup = whileElementsMounted(referenceNode, floatingNode, update);
    } else {
      update();
    }
  }

  // This should run on change of strategy, transform, elements.floating, data.x, data.y
  function setFloatingStyles(data) {
    const initialStyles = {
      position: strategy,
      left: 0,
      top: 0,
    };

    if (!floatingNode) {
      // Do we care if we have stale positions when floatingNode is unmounted?
      // If we do, then we need to set floatingStyles to initialStyles
      return;
    }

    const x = roundByDPR(floatingNode, data.x);
    const y = roundByDPR(floatingNode, data.y);

    if (transform) {
      _floatingStyles.set({
        ...initialStyles,
        transform: `translate(${x}px, ${y}px)`,
        ...(getDPR(floatingNode) >= 1.5 && { willChange: "transform" }),
      });
    } else {
      _floatingStyles.set({
        position: strategy,
        left: x,
        top: y,
      });
    }
  }

  function reference(node: HTMLElement) {
    referenceNode = externalReference || node;
    callUpdate();
    return {
      destroy() {
        referenceNode = null;
      },
    };
  }

  function floating(node: HTMLElement) {
    floatingNode = externalFloating || node;
    callUpdate();

    return {
      destroy() {
        floatingNode = null;
        if (cleanup) cleanup();
      },
    };
  }

  return {
    reference,
    floating,
    floatingStyles,
  };
}
