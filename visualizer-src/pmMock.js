// Stand-in for Postman's pm.getData — self-guards so it's a no-op once
// this runs inside Postman's real iframe, where `pm` already exists.
//
// This lives in its own file (not main.js) specifically so it installs
// regardless of entry point: visualizer-src/main.js imports it for the
// standalone build/dev, and App.vue also imports it directly so the
// IDE shell's inline preview (which renders App.vue without ever
// running main.js) gets it too.
if (typeof window.pm === 'undefined') {
  window.pm = {
    getData(callback) {
      callback(null, { id: 1, name: 'Sample item' })
    }
  }
}
