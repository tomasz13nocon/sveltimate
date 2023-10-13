import type { Action } from "svelte/action";
import { type Writable } from "svelte/store";
interface Options {
    clickOutsideToClose?: boolean;
}
interface Dialog {
    /** Controls the open state of the dialog. */
    isOpen: Writable<boolean>;
    /** Used on the element that triggers the dialog. */
    trigger: Action;
    /** Used on the dialog container. */
    dialog: Action;
    /**
     * Optional.
     * Used on element in the dialog containing content that describes the primary purpose or message of the dialog.
     * If not used, aria-label must be set on the dialog element. */
    title: Action;
    /** Used on the close button. */
    close: Action;
}
/**
 * Dialog (Modal) Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * */
export declare function createDialog({ clickOutsideToClose }?: Options): Dialog;
export {};
