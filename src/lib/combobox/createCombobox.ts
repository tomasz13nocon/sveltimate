import { computePosition, offset } from "@floating-ui/dom";
import { tick } from "svelte";
import { writable, type Writable } from "svelte/store";
import { uid } from "uid";

export type Value = { value: string; key?: string };

interface Options<T> {
  onSelection?: (value: T) => void;
  showWhenEmpty?: boolean;
  showOnFocus?: boolean;
  autocomplete?: "none" | "manual" | "auto" | "inline";
}

export function createCombobox<T extends Value>(
  values: T[] | Writable<T[]>,
  {
    onSelection,
    showWhenEmpty = false,
    showOnFocus = false,
    autocomplete = "manual",
  }: Options<T> = {}
) {
  type _T = T & { __node?: HTMLElement };

  const listboxVisible = writable(false);
  const filteredValues = writable<_T[]>([]);
  const focusedValue = writable<_T | null>(null);
  const inputValue = writable<string>("");
  const listboxX = writable(0);
  const listboxY = writable(0);

  let localValues: _T[] = [];
  let localListboxVisible = false;
  let localFilteredValues: _T[] = [];
  let localFocusedValue: _T | null = null;
  let localInputValue = "";

  let inputNode: HTMLInputElement;
  let buttonNode: HTMLButtonElement;
  let listboxNode: HTMLElement;
  const id = uid();
  const inputId = `input-${id}`;
  const labelId = `label-${id}`;
  const listboxId = `listbox-${id}`;

  // SUBSCRIPTIONS //
  if ("subscribe" in values) {
    values.subscribe(assignLocalValues);
  } else {
    assignLocalValues(values);
  }

  listboxVisible.subscribe((value) => {
    localListboxVisible = value;
    if (!value) focusedValue.set(null);
    if (inputNode) inputNode.ariaExpanded = value.toString();
    if (buttonNode) buttonNode.ariaExpanded = value.toString();
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
        if (!localFocusedValue.__node?.id) throw new Error("Node must have an id");
        inputNode.setAttribute("aria-activedescendant", localFocusedValue.__node.id);
      } else {
        inputNode.removeAttribute("aria-activedescendant");
      }
    }
  });

  inputValue.subscribe((value) => {
    localInputValue = value;
    if (inputNode) inputNode.value = value;
  });
  ///////////////////

  function assignLocalValues(values: T[]) {
    localValues = values;
    filterValues();
  }

  function filterValues() {
    filteredValues.set(
      localValues.filter((value) => {
        return value.value.toLowerCase().includes(localInputValue.toLowerCase());
      })
    );
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

  // EVENT HANDLERS //
  function onInputInput(e: Event) {
    focusedValue.set(null);
    inputValue.set((e.target as HTMLInputElement).value);
    filterValues();
    listboxVisible.set(localFilteredValues.length > 0 || showWhenEmpty);
  }

  function acceptItem(value: T) {
    inputValue.set(value.value);
    listboxVisible.set(false);
    filteredValues.set(localValues);
    onSelection && onSelection(value);
  }

  function onInputFocus() {
    // filterValues(); // TODO Do we need this? We need to call this at the start and whenever input changes, not on focus, right?
    if (showOnFocus) listboxVisible.set(true);
  }

  function onInputBlur(e: FocusEvent) {
    if (listboxNode.contains(e.relatedTarget as Node) || e.relatedTarget === buttonNode) {
      return;
    }
    listboxVisible.set(false);
  }

  function onInputKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case "Home":
      case "End":
        focusedValue.set(null);
        break;
      case "ArrowDown":
        event.preventDefault();
        if (localFocusedValue) {
          const index = localFilteredValues.indexOf(localFocusedValue);
          focusedValue.set(
            localFilteredValues[Math.min(index + 1, localFilteredValues.length - 1)] ?? null
          );
        } else {
          listboxVisible.set(true);
          console.log(localFilteredValues);
          focusedValue.set(localFilteredValues[0] ?? null);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (localFocusedValue) {
          const index = localFilteredValues.indexOf(localFocusedValue);
          focusedValue.set(localFilteredValues[Math.max(index - 1, 0)] ?? null);
        } else {
          focusedValue.set(localFilteredValues[localFilteredValues.length - 1] ?? null);
          listboxVisible.set(true);
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

  function onButtonPointerdown(e: PointerEvent) {
    // prevent deafult to prevent blur on input
    e.preventDefault();
    const wasVisible = localListboxVisible;
    if (inputNode) inputNode.focus();
    listboxVisible.set(!wasVisible);
  }

  function onItemMouseenter(e: MouseEvent) {
    const node = e.target as HTMLElement;
    const value = localValues.find((v) => v.__node === node);
    focusedValue.set(value ?? null);
  }

  function onItemMouseleave() {
    focusedValue.set(null);
  }

  function onItemPointerdown(e: PointerEvent) {
    e.preventDefault();
  }
  ////////////////////

  // ACTIONS //
  /**
   * Does not have to be a label element if combobox is not editable.
   * If no label is used at all, you must specify aria-label on the input */
  function label(node: HTMLElement) {
    if (node instanceof HTMLLabelElement) {
      node.htmlFor = inputId;
    } else {
      // wait for input to be created
      tick().then(() => {
        node.id = `label-${id}`;
        inputNode.setAttribute("aria-labelledby", node.id);
      });
    }
  }

  function input(node: HTMLInputElement) {
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

  function button(node: HTMLButtonElement) {
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

  function listbox(node: HTMLElement) {
    listboxNode = node;
    node.id = listboxId;
    node.role = "listbox";
    node.ariaLabel = "Suggestions";

    // TODO labelledBy input and/or input's label (react-aria does both in addition to aria-label)
    // but they also have the button labelledBy itself so...
    updatePopoverPos();
  }

  function item(node: HTMLElement, value: T) {
    node.id = `item-${id}-${(value.key ?? value.value).replaceAll(/\s/g, "-")}}`;
    node.role = "option";
    node.tabIndex = -1;
    const acceptThisItem = acceptItem.bind(null, value);
    node.addEventListener("click", acceptThisItem);
    node.addEventListener("mouseenter", onItemMouseenter);
    node.addEventListener("mouseleave", onItemMouseleave);
    node.addEventListener("pointerdown", onItemPointerdown);
    (value as _T).__node = node;

    return {
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
    focusedValue: focusedValue as Writable<T | null>,
    filteredValues: filteredValues as Writable<T[]>,
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
