import { getDocument } from "../util.js";
import { computePosition, offset } from "@floating-ui/dom";
import { tick } from "svelte";
import { get, writable } from "svelte/store";
import { uid } from "uid";
export function createCombobox(values, { onSelection, showWhenEmpty = false, showOnFocus = false, autocomplete = "manual", } = {}) {
    const listboxVisible = writable(false);
    const filteredValues = writable([]);
    const focusedValue = writable(null);
    const inputValue = writable("");
    const listboxX = writable(0);
    const listboxY = writable(0);
    let localValues = [];
    let localListboxVisible = false;
    let localFilteredValues = [];
    let localFocusedValue = null;
    let localInputValue = "";
    let inputNode;
    let buttonNode;
    let listboxNode;
    const id = uid();
    const inputId = `input-${id}`;
    const labelId = `label-${id}`;
    const listboxId = `listbox-${id}`;
    // SUBSCRIPTIONS //
    if ("subscribe" in values) {
        values.subscribe(assignLocalValues);
    }
    else {
        assignLocalValues(values);
    }
    listboxVisible.subscribe((value) => {
        localListboxVisible = value;
        if (!value)
            focusedValue.set(null);
        if (inputNode)
            inputNode.ariaExpanded = value.toString();
        if (buttonNode)
            buttonNode.ariaExpanded = value.toString();
    });
    filteredValues.subscribe((values) => {
        localFilteredValues = values;
        if (localFocusedValue && !values.includes(localFocusedValue)) {
            focusedValue.set(null);
        }
        if (inputNode && listboxNode) {
            updatePopoverPos();
        }
    });
    focusedValue.subscribe((value) => {
        if (localFocusedValue?.__node) {
            localFocusedValue.__node.removeAttribute("aria-selected");
        }
        localFocusedValue = value;
        if (value?.__node) {
            value.__node.scrollIntoView({ block: "nearest" });
            value.__node.ariaSelected = "true";
        }
        if (inputNode) {
            if (localFocusedValue) {
                if (!localFocusedValue.__node?.id)
                    throw new Error("Node must have an id");
                inputNode.setAttribute("aria-activedescendant", localFocusedValue.__node.id);
            }
            else {
                inputNode.removeAttribute("aria-activedescendant");
            }
        }
    });
    inputValue.subscribe((value) => {
        localInputValue = value;
        if (inputNode)
            inputNode.value = value;
    });
    ///////////////////
    function assignLocalValues(values) {
        localValues = values;
        filterValues();
        if (!localListboxVisible && showOnFocus && inputNode === getDocument()?.activeElement) {
            showListbox();
        }
    }
    function filterValues() {
        filteredValues.set(
        // Assignment here is necessary due to a subscription not running before current subscription is finished
        (localFilteredValues = localValues.filter((value) => {
            return value.value.toLowerCase().includes(localInputValue.toLowerCase());
        })));
    }
    function updatePopoverPos() {
        computePosition(inputNode, listboxNode, {
            placement: "bottom-start",
            middleware: [
                offset(8),
                // flip(),
                // autoPlacement(),
                // shift({ padding: 5 }),
            ],
        }).then(({ x, y }) => {
            listboxX.set(x);
            listboxY.set(y);
        });
    }
    function showListbox() {
        listboxVisible.set(localFilteredValues.length > 0 || showWhenEmpty);
    }
    // EVENT HANDLERS //
    function onInputInput(e) {
        focusedValue.set(null);
        inputValue.set(e.target.value);
        filterValues();
        showListbox();
    }
    function acceptItem(value) {
        inputValue.set(value.value);
        listboxVisible.set(false);
        filteredValues.set(localValues);
        onSelection && onSelection(value);
    }
    function onInputFocus() {
        // filterValues(); // TODO Do we need this? We need to call this at the start and whenever input changes, not on focus, right?
        if (showOnFocus)
            showListbox();
    }
    function onInputBlur(e) {
        if (listboxNode?.contains(e.relatedTarget) || e.relatedTarget === buttonNode) {
            return;
        }
        listboxVisible.set(false);
    }
    function onInputKeydown(event) {
        switch (event.key) {
            case "Home":
            case "End":
                focusedValue.set(null);
                break;
            case "ArrowDown":
                event.preventDefault();
                if (localFocusedValue) {
                    const index = localFilteredValues.indexOf(localFocusedValue);
                    focusedValue.set(localFilteredValues[Math.min(index + 1, localFilteredValues.length - 1)] ?? null);
                }
                else {
                    showListbox();
                    focusedValue.set(localFilteredValues[0] ?? null);
                }
                break;
            case "ArrowUp":
                event.preventDefault();
                if (localFocusedValue) {
                    const index = localFilteredValues.indexOf(localFocusedValue);
                    focusedValue.set(localFilteredValues[Math.max(index - 1, 0)] ?? null);
                }
                else {
                    showListbox();
                    focusedValue.set(localFilteredValues[localFilteredValues.length - 1] ?? null);
                }
                break;
            case "ArrowRight":
            case "ArrowLeft":
                focusedValue.set(null);
                break;
            case "Enter":
                if (localFocusedValue) {
                    acceptItem(localFocusedValue);
                }
                break;
            case "Escape":
            case "Tab":
                listboxVisible.set(false);
                break;
        }
    }
    function onButtonPointerdown(e) {
        // prevent deafult to prevent blur on input
        e.preventDefault();
        const wasVisible = localListboxVisible;
        if (inputNode)
            inputNode.focus();
        listboxVisible.set(!wasVisible);
    }
    function onItemMouseenter(e) {
        const node = e.target;
        const value = localValues.find((v) => v.__node === node);
        focusedValue.set(value ?? null);
    }
    function onItemMouseleave() {
        focusedValue.set(null);
    }
    function onItemPointerdown(e) {
        e.preventDefault();
    }
    ////////////////////
    // ACTIONS //
    /**
     * Does not have to be a label element if combobox is not editable.
     * If no label is used at all, you must specify aria-label on the input */
    function label(node) {
        if (node instanceof HTMLLabelElement) {
            node.htmlFor = inputId;
        }
        else {
            // wait for input to be created
            tick().then(() => {
                node.id = `label-${id}`;
                inputNode.setAttribute("aria-labelledby", node.id);
            });
        }
    }
    function input(node) {
        inputNode = node;
        node.id = inputId;
        node.role = "combobox";
        node.autocomplete = "off";
        node.ariaAutoComplete = "list";
        node.ariaExpanded = "false";
        node.setAttribute("aria-controls", listboxId);
        node.addEventListener("focus", onInputFocus);
        node.addEventListener("blur", onInputBlur);
        node.addEventListener("input", onInputInput);
        node.addEventListener("keydown", onInputKeydown);
        return {
            destroy() {
                node.removeEventListener("focus", onInputFocus);
                node.removeEventListener("blur", onInputBlur);
                node.removeEventListener("input", onInputInput);
                node.removeEventListener("keydown", onInputKeydown);
            },
        };
    }
    function button(node) {
        buttonNode = node;
        node.tabIndex = -1;
        node.ariaLabel = node.ariaLabel || "Show suggestions";
        node.setAttribute("aria-labelledby", labelId);
        node.ariaExpanded = "false";
        node.setAttribute("aria-controls", listboxId);
        node.addEventListener("pointerdown", onButtonPointerdown);
        return {
            destroy() {
                node.removeEventListener("pointerdown", onButtonPointerdown);
            },
        };
    }
    function listbox(node) {
        listboxNode = node;
        node.id = listboxId;
        node.role = "listbox";
        node.ariaLabel = "Suggestions";
        // TODO labelledBy input and/or input's label (react-aria does both in addition to aria-label)
        // but they also have the button labelledBy itself so...
        updatePopoverPos();
    }
    function item(node, value) {
        node.id = `item-${id}-${(value.key ?? value.value).replaceAll(/\s/g, "-")}}`;
        node.role = "option";
        node.tabIndex = -1;
        let acceptThisItem = acceptItem.bind(null, value);
        node.addEventListener("click", acceptThisItem);
        node.addEventListener("mouseenter", onItemMouseenter);
        node.addEventListener("mouseleave", onItemMouseleave);
        node.addEventListener("pointerdown", onItemPointerdown);
        value.__node = node;
        return {
            update(value) {
                node.removeEventListener("click", acceptThisItem);
                acceptThisItem = acceptItem.bind(null, value);
                node.addEventListener("click", acceptThisItem);
            },
            destroy() {
                node.removeEventListener("click", acceptThisItem);
                node.removeEventListener("mouseenter", onItemMouseenter);
                node.removeEventListener("mouseleave", onItemMouseleave);
                node.removeEventListener("pointerdown", onItemPointerdown);
            },
        };
    }
    return {
        listboxVisible,
        focusedValue: focusedValue,
        filteredValues: filteredValues,
        inputValue,
        listboxX,
        listboxY,
        label,
        input,
        button,
        listbox,
        item,
    };
}
