import React from 'react'
import { get, map } from 'lodash'

const ReactSVGComponents = {
  svg: (p, key) => {
    return (
      <svg {...p.attr} version={'1.1'} xmlns={'http://www.w3.org/2000/svg'} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </svg>
    )
  },
  circle: (p, key) => {
    return (
      <circle {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </circle>
    )
  },
  rect: (p, key) => {
    return (
      <rect {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </rect>
    )
  },
  path: (p, key) => {
    return (
      <path {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </path>
    )
  },
  g: (p, key) => {
    return (
      <g {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </g>
    )
  },
  polygon: (p, key) => {
    return (
      <polygon {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </polygon>
    )
  },
  line: (p, key) => {
    return (
      <line {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </line>
    )
  },
  polyline: (p, key) => {
    return (
      <polyline {...p.attr} key={key}>
        { map(get(p, 'children', []), (child, idx) => ReactSVGComponents[child.tag](child, idx)) }
      </polyline>
    )
  }
}

export default ReactSVGComponents
