// A dummy module that mimics ALL of Sentry's exports to avoid errors during Sanity's boot sequence
// Uses a Proxy-based approach so any import from @sentry/* resolves without errors

const noop = () => {}
const noopIntegration = () => ({})
const noopComponent = ({children}) => children
const noopHOC = (Component) => Component
const noopClass = class {}
const noopScope = class {
  setTag() {
    return this
  }
  setExtra() {
    return this
  }
  setContext() {
    return this
  }
  setUser() {
    return this
  }
}

// Named exports that Sanity explicitly uses
export const init = noop
export const captureException = noop
export const captureMessage = noop
export const setContext = noop
export const setTag = noop
export const setUser = noop
export const withScope = (cb) => {
  cb(new noopScope())
}
export const ErrorBoundary = noopComponent
export const browserTracingIntegration = noopIntegration
export const replayIntegration = noopIntegration
export const httpClientIntegration = noopIntegration
export const captureUserFeedback = noop
export const showReportDialog = noop
export const ReactRouterV6BrowserTracingIntegration = noopIntegration
export const withSentryRouting = noopHOC
export const withProfiler = noopHOC
export const metrics = {increment: noop, distribution: noop, set: noop, gauge: noop}
export const startSpan = (opts, cb) => cb()
export const startSpanManual = (opts, cb) => cb()
export const captureSession = noop
export const getCurrentHub = () => ({getClient: () => ({flush: async () => true})})
export const Hub = class {
  getClient() {
    return {flush: async () => true}
  }
}
export const Scope = noopScope

// Additional exports required by newer Sanity versions
export const getClient = () => ({flush: async () => true})
export const getCurrentScope = () => new noopScope()
export const BrowserClient = noop
export const defaultStackParser = {}
export const isInitialized = () => false
export const makeFetchTransport = noop
export const inboundFiltersIntegration = noopIntegration
export const functionToStringIntegration = noopIntegration
export const browserApiErrorsIntegration = noopIntegration
export const breadcrumbsIntegration = noopIntegration
export const globalHandlersIntegration = noopIntegration
export const linkedErrorsIntegration = noopIntegration
export const dedupeIntegration = noopIntegration
export const httpContextIntegration = noopIntegration
export const reactRouterV6BrowserTracingIntegration = noopIntegration
export const wrap = noopHOC
export const withErrorBoundary = noopHOC
export const createBrowserRouter = noop
export const createRoutesFromChildren = noop
export const matchRoutes = noop
export const useLocation = () => ({pathname: '/'})
export const useNavigationType = () => 'PUSH'
export const useParams = () => ({})
export const useRoutes = () => null

// Catch-all default export as a Proxy so any other import resolves gracefully
export default new Proxy(
  {},
  {
    get: (target, prop) => {
      if (prop === '__esModule') return true
      return noop
    },
  },
)
