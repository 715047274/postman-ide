// Postman can render the visualizer inside an iframe whose `src` is a
// `data:` URL. A `data:` URL gets an opaque origin per spec, and in that
// context accessing `window.localStorage` doesn't just come back empty —
// it THROWS: "SecurityError: Failed to read the 'localStorage' property
// from 'Window': Storage is disabled inside 'data:' URLs." Every part of
// this app that touched `localStorage` directly (the router's current
// route/params, pmMock's environment/globals/collectionVariables store,
// the Login page's saved configs, Config.vue's saved configs) did so at
// module load or on first render, so that throw happened immediately and
// took down the whole script before anything painted — the "can't
// render" symptom.
//
// safeStorage is a drop-in replacement for the same three methods
// (getItem/setItem/removeItem) that never throws: it probes once for a
// real, usable localStorage, and falls back to an in-memory Map when
// storage isn't reachable (the data: URL case, but also e.g. Safari
// private mode or a storage-blocking extension). The trade-off in the
// fallback case: state no longer survives Postman fully re-rendering the
// visualizer on every Send, since that memory doesn't persist across a
// fresh iframe load — but the app renders and works within one render,
// which beats a blank, broken visualizer.
const memoryStore = new Map()

function probeLocalStorage() {
    try {
        const testKey = '__safeStorage_probe__'
        window.localStorage.setItem(testKey, '1')
        window.localStorage.removeItem(testKey)
        return true
    } catch {
        return false
    }
}

// Probed once at module load rather than on every call — cheap either
// way, but this also means a storage environment that only fails
// intermittently is treated consistently for the life of the page.
const hasRealStorage = probeLocalStorage()

export const safeStorage = {
    getItem(key) {
        if (hasRealStorage) {
            try {
                return window.localStorage.getItem(key)
            } catch {
                // fall through to memory below
            }
        }
        return memoryStore.has(key) ? memoryStore.get(key) : null
    },
    setItem(key, value) {
        if (hasRealStorage) {
            try {
                window.localStorage.setItem(key, value)
                return
            } catch {
                // fall through to memory below
            }
        }
        memoryStore.set(key, value)
    },
    removeItem(key) {
        if (hasRealStorage) {
            try {
                window.localStorage.removeItem(key)
                return
            } catch {
                // fall through to memory below
            }
        }
        memoryStore.delete(key)
    }
}