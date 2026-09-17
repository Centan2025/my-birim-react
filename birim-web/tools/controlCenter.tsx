import {definePlugin} from 'sanity'
import {BarChart3} from 'lucide-react'
import {ControlCenterTool} from './controlCenter/ControlCenterTool'

export const controlCenterTool = definePlugin({
  name: 'control-center',
  tools: [
    {
      name: 'control-center',
      title: 'Control Center',
      icon: BarChart3,
      component: ControlCenterTool,
    },
  ],
})
