<script>import { createDialog } from "./createDialog.js";
const { isOpen, trigger, dialog, title, close } = createDialog();
</script>

<button use:trigger>Open</button>

{#if $isOpen}
  <div use:dialog>
    <h2 use:title>My dialog</h2>
    <p>Dialog content</p>
    <button use:close>Close</button>
  </div>
{/if}
