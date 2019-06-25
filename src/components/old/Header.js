import React from 'react';
import { Button } from './Base';

import { getRouteBreadcrumb } from '../../lib/router';
import { ROUTE_NAMES } from '../../lib/routeNames';
import { useHistory } from '../../store/history';
import { isLast } from '../../lib/lib';
import { usePointCursor } from '../../store/pointCursor';

// hook to create a breadcrumb builder function based on the current
// global states
function useRouteBreadcrumbBuilder() {
  const { pointCursor } = usePointCursor();

  return getRouteBreadcrumb({ pointCursor });
}

function Crumbs(props) {
  const history = useHistory();
  const breadcrumbBuilder = useRouteBreadcrumbBuilder();

  return (
    <>
      {history.routes.map((route, idx) => {
        return (
          <div key={`history-${idx}`} className={'flex items-center'}>
            <Button
              prop-type={'link'}
              prop-size={'sm'}
              onClick={() => history.pop(history.size - idx - 1)}>
              {breadcrumbBuilder(route)}
            </Button>

            {isLast(history.size, idx) ? <div /> : '/'}
          </div>
        );
      })}
    </>
  );
}

function Header(props) {
  const history = useHistory();

  const showCrumbs = !history.includes(ROUTE_NAMES.INVITE_TICKET);

  if (showCrumbs) {
    return (
      <div className={'flex items-center h-10'}>
        <Crumbs />
      </div>
    );
  }

  return (
    <h2 className="mt-9 clickable" onClick={() => history.pop()}>
      Bridge
    </h2>
  );
}

export default Header;
