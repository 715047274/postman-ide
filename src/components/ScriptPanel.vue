<template>
  <div class="panel">
    <div class="panel__header">
      <span>Postman Script</span>
    </div>
    <div class="script-instructions">
      <p>
        Unlike a plain-string template system, this project's visualizer is real <code>.vue</code> SFCs compiled by
        <code>@vitejs/plugin-vue</code> — there's no cheap way to re-run that compiler live in this panel, so build it
        on demand instead:
      </p>
      <pre class="code-block">npm run build:visualizer</pre>
      <p>
        That writes <code>dist/postman-script.js</code> — open it, copy everything, paste into Postman's
        <strong>Tests</strong> tab.
      </p>
    </div>
  </div>
</template>
