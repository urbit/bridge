import { Row, Box, LoadingSpinner } from '@tlon/indigo-react';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import BodyPane from 'components/L2/Window/BodyPane';
import HeaderPane from 'components/L2/Window/HeaderPane';
import View from 'components/View';
import Window from 'components/L2/Window/Window';
import { useHistory } from 'store/history';
import { useMemo, useEffect, useState, useCallback } from 'react';
import { useL1Sponsorship } from './useL1Sponsorship';
import ob from 'urbit-ob';
import { Grid } from 'indigo-react';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import useRoller from 'lib/useRoller';
import Point from 'lib/types/Point';
import { L1TxnType } from 'lib/types/PendingL1Transaction';
import { ONE_SECOND } from 'lib/constants';

export const L1Sponsorship = () => {
  const { pop, data }: any = useHistory();
  const { adoptee, denied } = data;
  const patp = useMemo(() => ob.patp(adoptee), [adoptee]);
  const { construct, bind, completed, txHashes } = useL1Sponsorship();
  const { checkForUpdates, initPoint } = useRoller();
  const [point, setPoint] = useState<Point | null>(null);

  const fetchAdopteePoint = useCallback(async () => {
    const ap = await initPoint(adoptee);
    setPoint(ap);
  }, [adoptee, initPoint]);

  useEffect(() => {
    fetchAdopteePoint();
  }, [fetchAdopteePoint]);

  const body = useMemo(
    () =>
      denied ? (
        <>
          {completed ? 'Denied' : 'Denying'} sponsorship request from{' '}
          <span className="mono">{patp}</span>
        </>
      ) : (
        <>
          {completed ? 'Approved' : 'Approving'} sponsorship request from{' '}
          <span className="mono">{patp}</span>
        </>
      ),
    [patp, denied, completed]
  );

  useEffect(() => {
    construct(adoptee, denied);
  }, [construct, adoptee, denied]);

  useEffect(() => {
    if (point && completed) {
      checkForUpdates({
        point: point.value,
        message: `${point.patp}'s sponsorship request has been ${
          denied ? 'rejected' : 'approved'
        }!`,
        l1Txn: {
          id: `${point.patp}-${denied ? 'reject' : 'approve'}-${point.patp}`,
          point: point.value,
          type: denied ? L1TxnType.reject : L1TxnType.adopt,
          hash: txHashes[0],
          time: new Date().getTime(),
        },
        intervalTime: ONE_SECOND,
      });
    }
  }, [completed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <View
        className="ops-l1-request"
        pop={pop}
        inset
        hideBack
        header={<L2BackHeader back={pop} />}>
        <Window>
          <HeaderPane>
            <Row className="header-row">
              <h5>{denied ? 'Reject' : 'Approve'} Sponsorship Request</h5>
            </Row>
          </HeaderPane>
          <BodyPane>
            <Box className="content-container">
              <Grid>
                <Grid.Item full className="gray4 f5 mv2">
                  {body}
                </Grid.Item>
                {point ? (
                  <Grid.Item
                    full
                    {...bind}
                    as={InlineEthereumTransaction}
                    onReturn={() => pop()}
                  />
                ) : (
                  <Grid.Item full>
                    <Box className={'loading-container'}>
                      <LoadingSpinner
                        foreground="rgba(0,0,0,0.3)"
                        background="white"
                      />
                    </Box>{' '}
                  </Grid.Item>
                )}
              </Grid>
            </Box>
          </BodyPane>
        </Window>
      </View>
    </>
  );
};
