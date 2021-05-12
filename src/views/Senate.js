import React, { useCallback, useState } from 'react';
import { Grid } from 'indigo-react';
import { azimuth } from 'azimuth-js';

import View from 'components/View';
import ViewHeader from 'components/ViewHeader';
import { ForwardButton } from 'components/Buttons';

import { useLocalRouter } from 'lib/LocalRouter';

export default function Point() {
  const { pop, push, names } = useLocalRouter();

  //TODO  if we moved the poll fetching logic into a cache/store,
  //      we could be cute here and display "x ongoing" under the buttons.

  const goDocuments = useCallback(() => push(names.DOCUMENTS), [push, names]);

  const goUpgrades = useCallback(() => push(names.UPGRADES), [push, names]);

  return (
    <View pop={pop} inset>
      <Grid.Item full as={ViewHeader}>
        Senate: Proposals
      </Grid.Item>
      <Grid className="pt2">
        <Grid.Item
          full
          as={ForwardButton}
          className="mt1"
          onClick={goDocuments}>
          Document Proposals
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full as={ForwardButton} className="mt1" onClick={goUpgrades}>
          Upgrade Proposals
        </Grid.Item>
      </Grid>
    </View>
  );
}
