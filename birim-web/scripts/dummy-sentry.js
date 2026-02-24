// A dummy module that mimics Sentry's exports to avoid throwing undefined undefined errors during Sanity's boot sequence

export const init = () => { };
export const captureException = () => { };
export const captureMessage = () => { };
export const setContext = () => { };
export const setTag = () => { };
export const setUser = () => { };
export const withScope = (cb) => { cb({ setTag: () => { }, setExtra: () => { }, setContext: () => { } }); };
export const ErrorBoundary = ({ children }) => children;
export const browserTracingIntegration = () => ({});
export const replayIntegration = () => ({});
export const httpClientIntegration = () => ({});
export const captureUserFeedback = () => { };
export const showReportDialog = () => { };
export const ReactRouterV6BrowserTracingIntegration = () => ({});
export const withSentryRouting = (Component) => Component;
export const withProfiler = (Component) => Component;
export const metrics = { increment: () => { }, distribution: () => { }, set: () => { }, gauge: () => { } };
export const startSpan = (opts, cb) => cb();
export const startSpanManual = (opts, cb) => cb();
export const captureSession = () => { };
export const getCurrentHub = () => ({ getClient: () => ({ flush: async () => true }) });
export const Hub = class { getClient() { return { flush: async () => true } } };
export const Scope = class { };
