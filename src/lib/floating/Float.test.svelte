<script lang="ts">
  import { createFloating } from "./createFloating.js";

  const { reference, floating, floatingStyles } = createFloating({ placement: "bottom" });

  let open = false;
</script>

<button use:reference on:click={() => (open = !open)}>Open float</button>
{#if open}
  <div use:floating style={$floatingStyles}>Hello from float</div>
{/if}
