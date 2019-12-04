import React from 'react';
import cn from 'classnames';
import { Grid, H4 } from 'indigo-react-local';

import Steps from 'components/Steps';

// NOTE: the 48px matches the `mt8` class on Passport so things line up nicely
// TODO: there's probably a clever grid/flex way to do this instead
export default function PassportView({ className, children, header, step }) {
  return (
    <>
      <Grid className={cn(className, 'auto-rows-min')}>
        <Grid.Item
          full
          as={Steps}
          num={step}
          total={3}
          style={{ height: '48px' }}
        />
        <Grid.Item full as={H4}>
          {header}
        </Grid.Item>
        <Grid.Item full>{children}</Grid.Item>
      </Grid>
    </>
  );
}
