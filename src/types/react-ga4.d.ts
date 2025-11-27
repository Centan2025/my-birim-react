declare module 'react-ga4' {
  interface GAEventArgs {
    action: string
    category?: string
    label?: string
    value?: number
  }

  interface GASendArgs {
    hitType: string
    page: string
    title?: string
  }

  const ReactGA: {
    initialize: (measurementId: string | string[]) => void
    send: (args: string | GASendArgs) => void
    event: (args: GAEventArgs) => void
  }

  export default ReactGA
}
