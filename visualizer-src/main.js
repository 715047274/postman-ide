import { createApp } from 'vue'
import App from './App.vue'

// pm mock now lives in pmMock.js, imported by App.vue itself, so it
// installs regardless of whether this file (main.js) runs at all — see
// pmMock.js for why that matters.

console.log('[visualizer] main.js running, about to mount')
createApp(App).mount('#app')
