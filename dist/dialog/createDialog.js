import { writable } from "svelte/store";
import { uid } from "uid";
/**
 * Dialog (Modal) Pattern
 * https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 * */
export function createDialog({ clickOutsideToClose } = {}) {
    const id = uid();
    const titleId = `title-${id}`;
    const isOpen = writable(false);
    let dialogNode = null;
    let titleNode = null;
    function setLabelledBy() {
        if (titleNode && dialogNode) {
            dialogNode.setAttribute("aria-labelledby", titleId);
        }
    }
    // ACTIONS //
    function trigger(node) {
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
    function dialog(node) {
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
    function title(node) {
        titleNode = node;
        node.id = titleId;
        setLabelledBy();
    }
    function close(node) {
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
