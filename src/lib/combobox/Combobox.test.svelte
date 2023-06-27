<script lang="ts">
  import { writable } from "svelte/store";
  import { createCombobox } from "./createCombobox.js";

  const values = writable([
    { name: "Red", value: "red" },
    { name: "Green", value: "green" },
    { name: "Blue", value: "blue" },
    { name: "Yellow", value: "yellow" },
    { name: "Orange", value: "orange" },
    { name: "Purple", value: "purple" },
    { name: "Pink", value: "pink" },
    { name: "Brown", value: "brown" },
    { name: "Black", value: "black" },
    { name: "White", value: "white" },
  ]);

  const {
    listboxVisible,
    focusedValue,
    filteredValues,
    inputValue,
    listboxX,
    listboxY,
    label,
    input,
    button,
    listbox,
    item,
  } = createCombobox(values, {
    showOnFocus: true,
  });
</script>

<div>
  <label use:label>
    Color name
    <input use:input type="text" />
    <button use:button>
      {$listboxVisible ? "▲" : "▼"}
    </button>
  </label>
  {#if $listboxVisible}
    <ul use:listbox style:top="{$listboxY | 0}px" style:left="{$listboxX | 0}px">
      {#each $filteredValues as value}
        <li use:item={value}>
          {value.name}
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  ul {
    position: absolute;
    width: 200px;
  }
  ul :global(li[aria-selected="true"]) {
    background-color: #4bb1e8;
  }
</style>
