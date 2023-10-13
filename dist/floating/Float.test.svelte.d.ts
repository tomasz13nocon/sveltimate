import { SvelteComponent } from "svelte";
declare const __propDef: {
    props: Record<string, never>;
    events: {
        [evt: string]: CustomEvent<any>;
    };
    slots: {};
};
export type FloatProps = typeof __propDef.props;
export type FloatEvents = typeof __propDef.events;
export type FloatSlots = typeof __propDef.slots;
export default class Float extends SvelteComponent<FloatProps, FloatEvents, FloatSlots> {
}
export {};
