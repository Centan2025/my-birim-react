import React from 'react'

const dummyComponent = () => React.createElement('div')
const styled = new Proxy(() => dummyComponent, {
  get: () => () => dummyComponent,
  apply: () => dummyComponent,
})

export default styled
