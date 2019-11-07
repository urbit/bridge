import React, { useCallback } from 'react';
import { Grid } from 'indigo-react';
import cn from 'classnames';
import * as ob from 'urbit-ob';

import Sigil from 'components/Sigil';

import { usePointCache } from 'store/pointCache';
import { useWallet } from 'store/wallet';

import * as need from 'lib/need';
import usePermissionsForPoint from 'lib/usePermissionsForPoint';
import { buildKeyType } from 'lib/point';

function ActiveViewRow({ point, goPoint }) {
  const { wallet } = useWallet();
  const address = need.addressFromWallet(wallet);
  const permissions = usePermissionsForPoint(address, point);

  const keyType = buildKeyType(permissions);
  const patp = ob.patp(point);
  const sigilSize = 50;

  const onClick = useCallback(() => goPoint(point), [point, goPoint]);
  return (
    <>
      <Grid.Item className="flex-row align-center" cols={[1, 3]}>
        {patp}{' '}
      </Grid.Item>
      <Grid.Item className="flex-row align-center" cols={[3, 6]}>
        <div
          style={{
            display: 'inline-block',
            height: `${sigilSize}px`,
            width: `${sigilSize}px`,
          }}>
          <Sigil patp={patp} size={25} colors={['#FFFFFF', '#000000']} />
        </div>
      </Grid.Item>
      <Grid.Item className="flex-center" cols={[6, 10]}>
        {keyType}
      </Grid.Item>
      <Grid.Item
        onClick={onClick}
        cols={[10, 13]}
        className="flex-row-r align-center">
        ->
      </Grid.Item>
      <Grid.Divider />
    </>
  );
}

export default function ActiveView({ className, goPoint }) {
  // const points = [2560, 2561, 2562];
  const { controlledPoints } = usePointCache();
  console.log(controlledPoints);
  const points = controlledPoints
    .matchWith({
      Nothing: () => [],
      Just: ps =>
        ps.value.matchWith({
          Error: () => null,
          Ok: ({ value }) => {
            return [
              ...value.ownedPoints,
              ...value.votingPoints,
              ...value.managingPoints,
              ...value.spawningPoints,
            ];
          },
        }),
    })
    .filter(Boolean)
    .filter(p => 255 < p && p < 65536);

  return (
    <Grid full className={cn('f5', className)}>
      <Grid.Item cols={[1, 6]} third={1}>
        Point
      </Grid.Item>
      <Grid.Item className="flex-center" cols={[6, 10]}>
        Key Type
      </Grid.Item>
      <Grid.Divider />
      {points.map(point => (
        <ActiveViewRow
          key={point}
          goPoint={goPoint}
          point={point}></ActiveViewRow>
      ))}
    </Grid>
  );
}
