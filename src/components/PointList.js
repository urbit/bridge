import React from 'react';
import { Grid, Flex } from 'indigo-react';

import Passport from './Passport';

export default function PointList({
  points,
  className,
  actions,
  onClick,
  ...rest
}) {
  return (
    <Grid gap={3} className={className}>
      {points.map((point, i) => (
        <Grid.Item
          key={point}
          className={`full half-${(i % 2) + 1}-md half-${(i % 2) + 1}-lg`}>
          <Flex col>
            <Passport.Mini
              point={point}
              className="pointer"
              onClick={() => onClick(point)}
              {...rest}
            />
            {actions && (
              <Flex.Item className="mt2">{actions(point, i)}</Flex.Item>
            )}
          </Flex>
        </Grid.Item>
      ))}
    </Grid>
  );
}
