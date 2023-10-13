import { type Writable } from "svelte/store";
export type Value = {
    value: string;
    key?: string;
};
interface Options<T> {
    onSelection?: (value: T) => void;
    showWhenEmpty?: boolean;
    showOnFocus?: boolean;
    autocomplete?: "none" | "manual" | "auto" | "inline";
}
export declare function createCombobox<T extends Value>(values: T[] | Writable<T[]>, { onSelection, showWhenEmpty, showOnFocus, autocomplete, }?: Options<T>): {
    listboxVisible: Writable<boolean>;
    focusedValue: Writable<T | null>;
    filteredValues: Writable<T[]>;
    inputValue: Writable<string>;
    listboxX: Writable<number>;
    listboxY: Writable<number>;
    label: (node: HTMLElement) => void;
    input: (node: HTMLInputElement) => {
        destroy(): void;
    };
    button: (node: HTMLButtonElement) => {
        destroy(): void;
    };
    listbox: (node: HTMLElement) => void;
    item: (node: HTMLElement, value: T) => {
        update(value: T): void;
        destroy(): void;
    };
};
export {};
