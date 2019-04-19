import React from 'react'
import { Button, Chevron } from '../components/Base'

import { renderRoute, ROUTE_NAMES } from '../lib/router'
import { isLast } from '../lib/lib'

const Crumbs = (props) => {
  const { routeCrumbs, skipRoute } = props
  const history = routeCrumbs.reverse()

  // FIXME probably more straightforward to render them normally and just
  // return the reversed array of renders
  const rendered = history.map((route, idx) => {

      return (
        <div className={'flex items-center'} key={ `history-${idx}` }>




          <Button
            prop-type={'link'}
            prop-size={'sm'}
            key={ `history-button-${idx}` }
            onClick={ () => skipRoute(history.size - idx - 1) }>
            { renderRoute(props, route) }
          </Button>

          {
            isLast(history.size, idx)
              ? <div />
              : <Chevron className={'h-4 mh-2'} />
          }


        </div>
      )
    })

  return rendered
}

const Header = (props) => {
  let showCrumbs = !props.routeCrumbs.contains(ROUTE_NAMES.INVITE_LOGIN)

  if (showCrumbs) {
    return (
      <div className={'flex items-center h-10'}>
        <Crumbs
          routeCrumbs={ props.routeCrumbs }
          skipRoute={ props.skipRoute }
          networkType={ props.networkType }
          wallet={ props.wallet }
          pointCursor={ props.pointCursor }
        />
      </div>
    )
  } else {
    return <h2 className="mt-9">Bridge</h2>
  }
}

export default Header
