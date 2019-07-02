import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid } from 'indigo-react';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';

import { ROUTE_NAMES } from 'lib/routeNames';

import { useHistory } from 'store/history';
import { useWallet } from 'store/wallet';
import FooterButton from 'components/FooterButton';

export default function Admin() {
  const history = useHistory();
  const { urbitWallet } = useWallet();

  const goRedownload = useCallback(() => history.push(ROUTE_NAMES.REDOWNLOAD), [
    history,
  ]);

  const goReticket = useCallback(() => history.push(ROUTE_NAMES.RETICKET), [
    history,
  ]);

  const goEditPerms = useCallback(() => history.push(ROUTE_NAMES.PERMISSIONS), [
    history,
  ]);

  const canDownloadPassport = Just.hasInstance(urbitWallet);

  return (
    <View>
      <Grid className="pt3">
        <Grid.Item full>
          <ForwardButton
            disabled={!canDownloadPassport}
            onClick={goRedownload}
            detail="Re-download your paper wallet">
            Download Passport
          </ForwardButton>
        </Grid.Item>
        <Grid.Divider />
        <Grid.Item full>
          <ForwardButton
            onClick={goReticket}
            detail="//TODO disable if not logged in as owner">
            Reticket
          </ForwardButton>
        </Grid.Item>
        <Grid.Item full>
          <ForwardButton
            onClick={goEditPerms}
            detail="Management, networking keys, etc.">
            Edit permissions
          </ForwardButton>
        </Grid.Item>
      </Grid>

      <FooterButton detail="Transfer this identity to a new owner" disabled>
        Transfer
      </FooterButton>
    </View>
  );
}
