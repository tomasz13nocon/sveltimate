import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: Record<string, never>;
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type ComboboxProps = typeof __propDef.props;
export type ComboboxEvents = typeof __propDef.events;
export type ComboboxSlots = typeof __propDef.slots;
export default class Combobox extends SvelteComponent<ComboboxProps, ComboboxEvents, ComboboxSlots> {
}
export {};
