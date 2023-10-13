/// <reference types="svelte" />
import { type Placement, type Strategy, type Middleware, type Platform, type ReferenceElement } from "@floating-ui/dom";
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
    whileElementsMounted?: (reference: ReferenceElement, floating: HTMLElement, update: () => void) => () => void;
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
export declare function createFloating({ placement, strategy, middleware, platform, elements: { reference: externalReference, floating: externalFloating }, transform, whileElementsMounted, open, }?: FloatingOptions): {
    reference: (node: HTMLElement) => {
        destroy(): void;
    };
    floating: (node: HTMLElement) => {
        destroy(): void;
    };
    floatingStyles: import("svelte/store").Readable<string>;
};
export {};
