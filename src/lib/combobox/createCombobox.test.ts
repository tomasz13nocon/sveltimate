import { describe, expect, it, vi } from "vitest";
import { createCombobox } from "./createCombobox.js";
import { get, writable } from "svelte/store";
import userEvent from "@testing-library/user-event";
import { tick } from "svelte";

describe("combobox", () => {
  const values = writable([
    { value: "foo", key: "foo" },
    { value: "bar", key: "bar" },
    { value: "baz", key: "baz" },
  ]);
  const onSelection = vi.fn();
  const {
    listboxVisible,
    focusedValue,
    filteredValues,
    inputValue,
    listboxX,
    listboxY,
    input,
    listbox,
    item,
  } = createCombobox(values, {
    onSelection,
  });

  const inputNode = document.createElement("input");
  const listboxNode = document.createElement("ul");
  input(inputNode);
  listbox(listboxNode);
  for (const value of get(filteredValues)) {
    const itemNode = document.createElement("li");
    item(itemNode, value);
  }

  it("should have correct default state", () => {
    expect(get(listboxVisible)).toBe(false);
    expect(inputNode.ariaExpanded).toBe("false");
    expect(inputNode.getAttribute("aria-activedescendant") == null).toBe(true);
  });

  it("should open when input is focused", async () => {
    inputNode.focus();
    expect(get(listboxVisible)).toBe(false);
  });

  it("showOnFocus", async () => {
    const user = userEvent.setup();

    const { listboxVisible, filteredValues, input, listbox, item } = createCombobox(values, {
      showOnFocus: true,
    });

    const inputNode = document.createElement("input");
    const listboxNode = document.createElement("ul");
    input(inputNode);
    listbox(listboxNode);
    for (const value of get(filteredValues)) {
      const itemNode = document.createElement("li");
      item(itemNode, value);
    }

    await user.click(inputNode);
    expect(get(listboxVisible)).toBe(true);

    inputNode.value = "foo";
    inputNode.dispatchEvent(new Event("input"));
    expect(get(filteredValues).length).toBe(1);
  });
});
