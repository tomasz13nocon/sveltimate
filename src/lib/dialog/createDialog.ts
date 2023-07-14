import type { Action } from "svelte/action";
import { writable, type Writable } from "svelte/store";
import { uid } from "uid";

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
export function createDialog({ clickOutsideToClose }: Options = {}): Dialog {
  const id = uid();
  const titleId = `title-${id}`;

  const isOpen = writable(false);

  let dialogNode: HTMLElement | null = null;
  let titleNode: HTMLElement | null = null;

  function setLabelledBy() {
    if (titleNode && dialogNode) {
      dialogNode.setAttribute("aria-labelledby", titleId);
    }
  }

  // ACTIONS //
  function trigger(node: HTMLElement) {
    function onTriggerClick() {
      isOpen.set(true);
    }
    node.addEventListener("click", onTriggerClick);

    return {
      destroy() {
        node.removeEventListener("click", onTriggerClick);
      },
    };
  }

  function dialog(node: HTMLElement) {
    dialogNode = node;
    node.setAttribute("role", "dialog");
    node.setAttribute("aria-modal", "true");

    setLabelledBy();

    // Contain focus to the dialog

    node.setAttribute("aria-describedby", `${titleId} content-${id}`);
    if (clickOutsideToClose) {
      node.addEventListener("click", (event) => {
        if (event.target === node) {
          node.dispatchEvent(new CustomEvent("close"));
        }
      });
    }
  }

  function title(node: HTMLElement) {
    titleNode = node;
    node.id = titleId;

    setLabelledBy();
  }

  function close(node: HTMLElement) {
    function onCloseClick() {
      isOpen.set(false);
    }
    node.addEventListener("click", onCloseClick);

    return {
      destroy() {
        node.removeEventListener("click", onCloseClick);
      },
    };
  }

  return {
    isOpen,
    trigger,
    dialog,
    title,
    close,
  };
}
