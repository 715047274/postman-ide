// A local mock of Postman's `pm` API, structured as an explicit adapter:
// PmMock (below) implements the same shape real Postman's `pm` presents
// (pm.environment.get/set, pm.getData, pm.sendRequest, ...), so anywhere
// in this app that calls `pm.xxx()` never needs to know or check which
// one it's actually talking to — both conform to one interface.
//
// The install line at the bottom is the actual adapter-selection logic:
//
//   if (import.meta.env.DEV && typeof window.pm === 'undefined') {
//     window.pm = new PmMock()
//   }
//
// `import.meta.env.DEV` is a build-time constant Vite replaces with a
// literal `true` (dev server) or `false` (production build) — it's not
// something checked at runtime. In the production build
// (`npm run build:visualizer`), that becomes `if (false && ...)`, which
// Rollup's dead-code elimination removes entirely, taking the whole
// PmMock class and everything only reachable from its constructor with
// it. The shipped Postman script contains none of this file at all —
// only the real, Postman-injected `window.pm` is ever used there.
// `typeof window.pm === 'undefined'` stays as a second guard even in
// dev, in case something else ever installs a `pm` first.
//
// Real Postman's `pm` surface differs by script context — notably
// `pm.response` only exists in Test/Post-response scripts (there's no
// response yet in a Pre-request script), and `pm.visualizer.set()` is
// only meaningful from a Test script (the visualizer itself only ever
// gets `pm.getData()` — see the Config page's comments for why). PmMock
// doesn't enforce those distinctions — everything is always present on
// it — because this app doesn't simulate two separate script realms the
// way real Postman does.
//
// None of this is Postman's real implementation — it's a best-effort
// approximation for local development, not a spec-compliant reproduction.

const STORAGE_PREFIX = 'pmMock:'

function loadStore(name) {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_PREFIX + name)) || {}
  } catch {
    return {}
  }
}

function saveStore(name, store) {
  localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(store))
}

// ---------------------------------------------------------------------
// Variable scopes: environment, collectionVariables, globals persist to
// localStorage (matching how real Postman environments/globals persist
// across runs). variables (script-local) and iterationData don't, since
// real Postman resets local variables every run and iterationData comes
// fresh from whatever dataset is active.
// ---------------------------------------------------------------------
function createVariableScope({ persistAs = null, fallbacks = [] } = {}) {
  const store = persistAs ? loadStore(persistAs) : {}

  function persist() {
    if (persistAs) saveStore(persistAs, store)
  }

  return {
    get(key) {
      if (Object.prototype.hasOwnProperty.call(store, key)) return store[key]
      for (const scope of fallbacks) {
        if (scope.has(key)) return scope.get(key)
      }
      return undefined
    },
    set(key, value) {
      store[key] = value
      persist()
    },
    unset(key) {
      delete store[key]
      persist()
    },
    has(key) {
      if (Object.prototype.hasOwnProperty.call(store, key)) return true
      return fallbacks.some((scope) => scope.has(key))
    },
    clear() {
      for (const key of Object.keys(store)) delete store[key]
      persist()
    },
    toObject() {
      return { ...store }
    },
    // Postman's {{varName}} substitution, approximated. Not part of the
    // real pm.<scope> API itself (that lives on pm.variables.replaceIn),
    // included here since every scope can be asked to do it in practice.
    replaceIn(template) {
      return String(template).replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const value = this.get(key)
        return value === undefined ? `{{${key}}}` : String(value)
      })
    }
  }
}

// ---------------------------------------------------------------------
// Header list — used by both pm.request.headers and pm.response.headers
// ---------------------------------------------------------------------
function createHeaderList(initial = {}) {
  const store = { ...initial }
  return {
    get(name) {
      const key = Object.keys(store).find((k) => k.toLowerCase() === String(name).toLowerCase())
      return key ? store[key] : undefined
    },
    has(name) {
      return Object.keys(store).some((k) => k.toLowerCase() === String(name).toLowerCase())
    },
    add({ key, value }) {
      store[key] = value
    },
    remove(name) {
      const key = Object.keys(store).find((k) => k.toLowerCase() === String(name).toLowerCase())
      if (key) delete store[key]
    },
    each(fn) {
      Object.entries(store).forEach(([key, value]) => fn({ key, value }))
    },
    toObject() {
      return { ...store }
    }
  }
}

function createRequestMock() {
  return {
    url: {
      _raw: 'https://api.example.com/resource',
      toString() {
        return this._raw
      }
    },
    method: 'GET',
    headers: createHeaderList({ 'Content-Type': 'application/json' }),
    body: { mode: 'raw', raw: '' }
  }
}

function createResponseMock({ code = 200, status = 'OK', responseTime = 42, headers = {}, body = { id: 1, name: 'Sample item' } } = {}) {
  return {
    code,
    status,
    responseTime,
    headers: createHeaderList(headers),
    json() {
      return body
    },
    text() {
      return typeof body === 'string' ? body : JSON.stringify(body)
    }
  }
}

// Real Postman supports both callback(err, res) and Promise styles. This
// does a real fetch() (we're in a real browser during dev), so it can
// hit real APIs, unlike everything else in this file.
function sendRequest(request, callback) {
  const opts = typeof request === 'string' ? { url: request, method: 'GET' } : request
  const promise = fetch(opts.url, {
    method: opts.method || 'GET',
    headers: opts.header || undefined,
    body: opts.body?.raw
  }).then(async (res) => {
    const text = await res.text()
    let parsed
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = text
    }
    return createResponseMock({
      code: res.status,
      status: res.statusText,
      body: parsed,
      headers: Object.fromEntries(res.headers.entries())
    })
  })

  if (typeof callback === 'function') {
    promise.then((res) => callback(null, res)).catch((err) => callback(err, null))
    return undefined
  }
  return promise
}

// ---------------------------------------------------------------------
// test/expect — a minimal, hand-rolled subset of Chai's BDD style, NOT
// the real Chai library Postman bundles. Covers the common patterns
// (.to.equal, .to.eql, .to.be.above/below, .to.include, .to.have.property,
// .to.be.true/false, .not negation) — anything more exotic will need
// extending here or swapping in a real assertion library later.
// ---------------------------------------------------------------------
function createTest() {
  const results = []

  function test(name, fn) {
    try {
      fn()
      results.push({ name, passed: true })
      console.log(`[pmMock] ✓ ${name}`)
    } catch (err) {
      results.push({ name, passed: false, error: err.message })
      console.error(`[pmMock] ✗ ${name}: ${err.message}`)
    }
  }
  test.results = results
  return test
}

function expect(actual) {
  let negated = false

  function assert(condition, message) {
    const pass = negated ? !condition : condition
    negated = false // each chained assertion call resets the negation, matching Chai
    if (!pass) throw new Error(message)
    return api
  }

  const api = {
    get not() {
      negated = !negated
      return api
    },
    get to() {
      return api
    },
    get be() {
      return api
    },
    get been() {
      return api
    },
    get have() {
      return api
    },
    get an() {
      return api
    },
    get exist() {
      return assert(actual !== null && actual !== undefined, `expected ${actual} to exist`)
    },
    get true() {
      return assert(actual === true, `expected ${actual} to be true`)
    },
    get false() {
      return assert(actual === false, `expected ${actual} to be false`)
    },
    equal(expected) {
      return assert(actual === expected, `expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`)
    },
    eql(expected) {
      return assert(
          JSON.stringify(actual) === JSON.stringify(expected),
          `expected ${JSON.stringify(actual)} to deeply equal ${JSON.stringify(expected)}`
      )
    },
    above(n) {
      return assert(actual > n, `expected ${actual} to be above ${n}`)
    },
    below(n) {
      return assert(actual < n, `expected ${actual} to be below ${n}`)
    },
    include(item) {
      const has =
          Array.isArray(actual) || typeof actual === 'string'
              ? actual.includes(item)
              : actual && Object.prototype.hasOwnProperty.call(actual, item)
      return assert(has, `expected ${JSON.stringify(actual)} to include ${JSON.stringify(item)}`)
    },
    property(name, value) {
      const has = actual && Object.prototype.hasOwnProperty.call(actual, name)
      const matches = value === undefined || (has && actual[name] === value)
      return assert(has && matches, `expected object to have property "${name}"${value !== undefined ? ` with value ${value}` : ''}`)
    },
    a(type) {
      return assert(typeof actual === type, `expected ${actual} to be of type ${type}`)
    }
  }

  return api
}

function createCookiesMock() {
  const store = {}
  return {
    get(name) {
      return store[name]
    },
    has(name) {
      return name in store
    },
    toObject() {
      return { ...store }
    },
    _mockSet(name, value) {
      store[name] = value
    }
  }
}

// ---------------------------------------------------------------------
// PmMock — the adapter itself. Assembles all the pieces above into one
// object matching the shape `pm.xxx()` calls throughout this app expect,
// whether or not they happen to be running against the real thing.
// ---------------------------------------------------------------------
class PmMock {
  constructor() {
    this.request = createRequestMock()
    this.response = createResponseMock()

    this.globals = createVariableScope({ persistAs: 'globals' })
    this.environment = createVariableScope({ persistAs: 'environment' })
    this.collectionVariables = createVariableScope({ persistAs: 'collectionVariables' })
    // Real pm.variables.get() reads through local → collection →
    // environment → global precedence, approximated via the fallback
    // chain here. .set() only ever writes to this local layer, same as
    // real Postman — it can't promote a value into another scope.
    this.variables = createVariableScope({
      fallbacks: [this.collectionVariables, this.environment, this.globals]
    })
    this.iterationData = createVariableScope()

    this.cookies = createCookiesMock()
    this.sendRequest = sendRequest
    this.test = createTest()
    this.expect = expect

    // Only meaningful from a Test script in real Postman — calling it
    // from inside the visualizer, which is where this mock actually
    // runs, doesn't do anything in real Postman either. Kept for
    // completeness/logging, not because it's wired to anything.
    this.visualizer = {
      set: (template, data) => {
        console.log(
            '[pmMock] pm.visualizer.set() called — only meaningful from a Test script in real Postman, not from inside the visualizer itself'
        )
      }
    }

    // "Depends on availability" per Postman's own docs even in the real
    // app — stubbed as an always-empty async result.
    this.datasets = () => {
      console.warn('[pmMock] pm.datasets() is a stub — real behavior depends on Postman plan/version')
      return Promise.resolve([])
    }

    this.execution = {
      setNextRequest: (name) => console.log('[pmMock] execution.setNextRequest called with:', name),
      skipRequest: () => console.log('[pmMock] execution.skipRequest called'),
      location: { current: () => 'MockFolder/MockRequest' }
    }

    this.info = {
      eventName: 'test',
      iteration: 1,
      iterationCount: 1,
      requestId: 'mock-request-id',
      requestName: 'Mock Request'
    }
  }

  // The one method the real visualizer sandbox actually exposes — see
  // Config.vue's Alert for the fuller explanation of why everything else
  // on this class is a development convenience, not a promise about
  // what works once pasted into Postman's Tests tab.
  getData(callback) {
    callback(null, { id: 1, name: 'Sample item' })
  }
}

if (import.meta.env.DEV && typeof window.pm === 'undefined') {
  window.pm = new PmMock()
  console.log(
      '[pmMock] Installed a development-only pm adapter (PmMock). Only pm.getData() reflects what the real Postman visualizer exposes — everything else here is for local development convenience, and none of this file ships in the production build (see the comment at the top). See pmMock.js for details.'
  )
}