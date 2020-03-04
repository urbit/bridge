import React, { useCallback } from 'react';
import { Grid, B } from 'indigo-react';
import { azimuth } from 'azimuth-js';
import { Just } from 'folktale/maybe';

import { ForwardButton } from 'components/Buttons';
import CopyButton from 'components/CopyButton';

import { useLocalRouter } from 'lib/LocalRouter';
import { PROXY_TYPE, proxyTypeToHuman } from 'lib/proxy';
import * as need from 'lib/need';
import capitalize from 'lib/capitalize';
import useCurrentPermissions from 'lib/useCurrentPermissions';
import convertToInt from 'lib/convertToInt';

import { usePointCursor } from 'store/pointCursor';
import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

export default function UrbitIDHome() {
  const { push, names } = useLocalRouter();
  const { pointCursor } = usePointCursor();
  const { getDetails } = usePointCache();
  const { urbitWallet } = useWallet();

  const goSigil = useCallback(() => push(names.SIGIL_GENERATOR), [push, names]);

  const goDownloadKeys = useCallback(() => push(names.DOWNLOAD_KEYS), [
    push,
    names,
  ]);

  const goResetKeys = useCallback(() => push(names.RESET_KEYS), [push, names]);

  const isMasterTicket = Just.hasInstance(urbitWallet);
  const point = need.point(pointCursor);
  const details = need.details(getDetails(point));
  const { isOwner } = useCurrentPermissions();
  const networkRevision = convertToInt(details.keyRevisionNumber, 10);

  const pointSize = azimuth.getPointSize(point);
  const isParent = pointSize !== azimuth.PointSize.Planet;
  const isSenate = pointSize === azimuth.PointSize.Galaxy;

  const goSetProxy = useCallback(
    proxyType => push(names.SET_PROXY, { proxyType }),
    [push, names]
  );

  const goTransfer = useCallback(() => push(names.TRANSFER), [names, push]);

  const renderProxyAction = useCallback(
    (proxyType, address) => {
      const disabled =
        !isOwner ||
        (proxyType === PROXY_TYPE.SPAWN ? networkRevision === 0 : false);
      return (
        <>
          <Grid.Item
            full
            as={ForwardButton}
            disabled={disabled}
            onClick={() => goSetProxy(proxyType)}>
            Edit {capitalize(proxyTypeToHuman(proxyType))} Key
          </Grid.Item>
        </>
      );
    },
    [goSetProxy, isOwner, networkRevision]
  );
  return (
    <Grid>
      <Grid.Item full className="mb7 f5">
        Urbit ID
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item full as={ForwardButton} onClick={goSigil}>
        Sigil
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item
        full
        as={ForwardButton}
        onClick={goDownloadKeys}
        disabled={!isMasterTicket}
        disabledDetail={
          <B className="wrap ws-normal">
            · Master Ticket Authentication required.
          </B>
        }>
        Download Keys
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item
        full
        as={ForwardButton}
        onClick={goResetKeys}
        disabled={!isOwner}
        disabledDetail={
          <B className="wrap ws-normal"> · Ownership key required</B>
        }
        detail="Reset Master Key and all other keys">
        Reset Keys
      </Grid.Item>

      <Grid.Divider />

      <Grid.Item full className="mv7 f5 gray4">
        Advanced
      </Grid.Item>
      <Grid.Divider />
      <Grid.Item
        full
        as={ForwardButton}
        accessory={<CopyButton text={details.owner} />}
        detail={<div className="mt1 mono black">{details.owner}</div>}
        disabled={!details.owner}>
        Ownership Address
      </Grid.Item>
      <Grid.Divider />

      {renderProxyAction(PROXY_TYPE.MANAGEMENT, details.managementProxy)}
      <Grid.Divider />

      {isParent && renderProxyAction(PROXY_TYPE.SPAWN, details.spawnProxy)}

      {isParent && networkRevision !== 0 && <Grid.Divider />}

      {isParent && networkRevision === 0 && (
        <>
          <Grid.Item
            full
            as={ForwardButton}
            className="f6"
            accessory={<span className="underline pointer">Set Keys</span>}>
            Network Keys Required
          </Grid.Item>
          <Grid.Divider />
        </>
      )}

      {isSenate && (
        <>
          {renderProxyAction(PROXY_TYPE.VOTING, details.votingProxy)}{' '}
          <Grid.Divider />
        </>
      )}
      <Grid.Item
        full
        as={ForwardButton}
        onClick={goTransfer}
        disabled={!isOwner}
        disabledDetail={
          <B className="wrap ws-normal"> · Ownership key required</B>
        }>
        Transfer this point
      </Grid.Item>
    </Grid>
  );
}
