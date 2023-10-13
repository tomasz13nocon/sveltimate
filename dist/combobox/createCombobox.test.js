import "@testing-library/jest-dom";
import { describe, expect, test, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { get, writable } from "svelte/store";
import { createCombobox } from "./createCombobox.js";
function createDefaultValues() {
    return writable([
        { value: "foo", key: "foo" },
        { value: "bar", key: "bar" },
        { value: "baz", key: "baz" },
    ]);
}
function createTestCombobox(values = createDefaultValues(), options) {
    const combobox = createCombobox(values, options);
    const wrapperNode = document.createElement("div");
    document.body.appendChild(wrapperNode);
    const labelNode = document.createElement("label");
    wrapperNode.appendChild(labelNode);
    const inputNode = document.createElement("input");
    wrapperNode.appendChild(inputNode);
    const buttonNode = document.createElement("button");
    wrapperNode.appendChild(buttonNode);
    const listboxNode = document.createElement("ul");
    wrapperNode.appendChild(listboxNode);
    combobox.label(labelNode);
    combobox.input(inputNode);
    combobox.button(buttonNode);
    combobox.listbox(listboxNode);
    for (const value of get(combobox.filteredValues)) {
        const itemNode = document.createElement("li");
        listboxNode.appendChild(itemNode);
        combobox.item(itemNode, value);
    }
    return { ...combobox, labelNode, inputNode, buttonNode, listboxNode };
}
describe("combobox", () => {
    const user = userEvent.setup();
    const onSelection = vi.fn();
    test("default options", async () => {
        const { listboxVisible, inputNode } = createTestCombobox();
        expect(get(listboxVisible)).toBe(false);
        expect(inputNode.ariaExpanded).toBe("false");
        expect(inputNode.getAttribute("aria-activedescendant") == null).toBe(true);
        await user.click(inputNode);
        expect(get(listboxVisible)).toBe(false);
        await user.k;
    });
    test("showOnFocus", async () => {
        const { listboxVisible, filteredValues, inputNode } = createTestCombobox(undefined, {
            showOnFocus: true,
        });
        expect(get(listboxVisible)).toBe(false);
        await user.click(inputNode);
        expect(get(listboxVisible)).toBe(true);
        await user.type(inputNode, "foo");
        expect(get(filteredValues).length).toBe(1);
    });
});
