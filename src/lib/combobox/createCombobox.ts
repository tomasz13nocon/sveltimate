import { tick } from "svelte";
import { writable, type Writable } from "svelte/store";
import { uid } from "uid";

export type Value = { value: string; key?: string };

interface Options<T> {
  onSelection?: (value: T) => void;
  hideWhenEmpty?: boolean;
  autocomplete?: "none" | "manual" | "auto" | "inline";
}

export function createCombobox<T extends Value>(
  values: T[] | Writable<T[]>,
  { onSelection, hideWhenEmpty, autocomplete = "manual" }: Options<T> = {}
) {
  type _T = T & { __node?: HTMLElement };

  const listboxVisible = writable(false);
  const filteredValues = writable<_T[]>([]);
  const focusedValue = writable<_T | null>(null);
  const inputValue = writable<string>("");
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
    // filteredValues.set(localValues); // TODO do we need this?
    if (inputNode) inputNode.ariaExpanded = value.toString();
    if (buttonNode) buttonNode.ariaExpanded = value.toString();
  });

  filteredValues.subscribe((values) => {
    localFilteredValues = values;
    if (values.length === 0 && hideWhenEmpty) {
      listboxVisible.set(false);
    }
    if (localFocusedValue && !values.includes(localFocusedValue)) {
      focusedValue.set(null);
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

  function setInputValue(value: string) {
    inputValue.set(value);
    inputNode.value = value;
  }

  // EVENT HANDLERS //
  function onInputInput(e: Event) {
    focusedValue.set(null);
    listboxVisible.set(true);
    setInputValue((e.target as HTMLInputElement).value);
    filterValues();
  }

  function acceptItem(value: T) {
    setInputValue(value.value);
    filterValues(); // TODO do we need this?
    listboxVisible.set(false);
    onSelection && onSelection(value);
  }

  function onInputFocus() {
    filterValues();
    listboxVisible.set(true);
  }

  function onInputBlur(e: FocusEvent) {
    if (listboxNode.contains(e.relatedTarget as Node)) {
      inputNode.focus();
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
          focusedValue.set(localFilteredValues[0] ?? null);
          listboxVisible.set(true);
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

  function onItemMouseEnter(e: MouseEvent) {
    const node = e.target as HTMLElement;
    const value = localValues.find((v) => v.__node === node);
    focusedValue.set(value ?? null);
  }

  function onItemMouseLeave() {
    focusedValue.set(null);
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

  function button(node: HTMLElement) {
    function buttonOnClick() {
      listboxVisible.set(!localListboxVisible);
    }

    node.tabIndex = -1;
    node.ariaLabel = "Show suggestions";
    node.setAttribute("aria-labelledby", labelId);
    node.ariaExpanded = "false";
    node.setAttribute("aria-controls", listboxId);
    node.addEventListener("click", buttonOnClick);

    return {
      destroy() {
        node.removeEventListener("click", buttonOnClick);
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
  }

  function item(node: HTMLElement, value: T) {
    node.id = `item-${id}-${(value.key ?? value.value).replaceAll(/\s/g, "-")}}`;
    node.role = "option";
    node.tabIndex = -1;
    const acceptThisItem = acceptItem.bind(null, value);
    node.addEventListener("click", acceptThisItem);
    node.addEventListener("mouseenter", onItemMouseEnter);
    node.addEventListener("mouseleave", onItemMouseLeave);
    (value as _T).__node = node;

    return {
      destroy() {
        node.removeEventListener("click", acceptThisItem);
        node.removeEventListener("mouseenter", onItemMouseEnter);
        node.removeEventListener("mouseleave", onItemMouseLeave);
      },
    };
  }

  return {
    listboxVisible,
    focusedValue: focusedValue as Writable<T | null>,
    filteredValues: filteredValues as Writable<T[]>,
    inputValue,
    label,
    input,
    button,
    listbox,
    item,
  };
}
