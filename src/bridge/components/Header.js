import React from "react";
import { Button, Chevron } from "../components/Base";

import { getRouteBreadcrumb } from "../lib/router";
import { ROUTE_NAMES } from "../lib/routeNames";
import { useHistory } from "../store/history";
import { isLast } from "../lib/lib";

function Crumbs(props) {
  const history = useHistory();

  // FIXME probably more straightforward to render them normally and just
  // return the reversed array of renders
  const rendered = history.routes.map((route, idx) => {
    return (
      <div className={"flex items-center"} key={`history-${idx}`}>
        <Button
          prop-type={"link"}
          prop-size={"sm"}
          key={`history-button-${idx}`}
          onClick={() => history.pop(history.size - idx - 1)}
        >
          {getRouteBreadcrumb(props, route)}
        </Button>

        {isLast(history.size, idx) ? (
          <div />
        ) : (
          <Chevron className={"h-4 mh-2"} />
        )}
      </div>
    );
  });

  return rendered;
}

function Header(props) {
  const history = useHistory();

  const showCrumbs = !history.includes(ROUTE_NAMES.INVITE_TICKET);

  if (showCrumbs) {
    return (
      <div className={"flex items-center h-10"}>
        <Crumbs
          networkType={props.networkType}
          wallet={props.wallet}
          pointCursor={props.pointCursor}
        />
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
