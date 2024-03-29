import { Button } from 'indigo-react';
import { Box, Row, StatelessTextInput } from '@tlon/indigo-react';
import L2BackHeader from 'components/L2/Headers/L2BackHeader';
import BodyPane from 'components/L2/Window/BodyPane';
import HeaderPane from 'components/L2/Window/HeaderPane';
import Window from 'components/L2/Window/Window';
import View from 'components/View';
import useRoller from 'lib/useRoller';
import { useLocalRouter } from 'lib/LocalRouter';
import { ddmmmYYYY } from 'lib/utils/date';
import { isExternalWallet } from 'lib/utils/wallet';
import { useCallback, useState } from 'react';
import { useRollerStore } from 'store/rollerStore';
import { GeneratingModal } from './GeneratingModal';
import {
  InviteGeneratingStatus,
  useInvites,
  useInviteStore,
} from './useInvites';
import { DEFAULT_NUM_INVITES } from 'lib/constants';
import { useTimerStore } from 'store/timerStore';
import { useWallet } from 'store/wallet';
import { UnspawnedPoints } from '@urbit/roller-api';
import { getPendingSpawns } from 'lib/utils/roller';

export const GenerateInvites = () => {
  const { pop } = useLocalRouter();
  const { walletType }: any = useWallet();
  const { point, nextQuotaTime } = useRollerStore();
  const { api, getPendingTransactions, getAndUpdatePoint } = useRoller();
  const { nextRoll } = useTimerStore();
  const { inviteJobs } = useInviteStore();
  const { generateInviteCodes } = useInvites();
  const [generatingStatus, setGeneratingStatus] = useState<
    InviteGeneratingStatus
  >('initial');
  const [error, setError] = useState('');
  const [numInvites, setNumInvites] = useState(DEFAULT_NUM_INVITES);

  const createInvites = useCallback(async () => {
    setGeneratingStatus('generating');
    try {
      let planets: UnspawnedPoints = await api.getUnspawned(point.value);
      const pendingTxs = await api.getPendingByShip(point.value);
      const pendingSpawns = getPendingSpawns(pendingTxs);
      planets = planets
        .filter((point: number) => !pendingSpawns.has(point))
        .slice(0, numInvites);

      await generateInviteCodes(point, planets);
      getPendingTransactions();
      getAndUpdatePoint(point.value);
      setGeneratingStatus('finished');
    } catch (error) {
      if (typeof error === 'object' && (error as Error)?.message) {
        setError((error as Error).message);
      } else if (typeof error === 'string') {
        setError(error);
      } else {
        setError('Generating invites failed');
      }
      setGeneratingStatus('errored');
    }
  }, [
    api,
    point,
    numInvites,
    generateInviteCodes,
    getPendingTransactions,
    getAndUpdatePoint,
    setGeneratingStatus,
  ]);

  const overQuota = numInvites > point.l2Quota && numInvites > 0;
  const generateDisabled = overQuota; //loading?
  const showTxnNote = isExternalWallet(walletType);

  return (
    <View
      pop={pop}
      className="cohort show-invite-form"
      hideBack
      header={<L2BackHeader back={pop} />}>
      <Window>
        <HeaderPane>
          <h5>Generate Invite Codes</h5>
        </HeaderPane>
        <BodyPane>
          <Box className="upper">
            <Row className="points-input">
              I want to generate
              <StatelessTextInput
                className={`input-box ${overQuota ? 'over-quota' : ''}`}
                value={numInvites}
                maxLength={3}
                onChange={e => {
                  const target = e.target as HTMLInputElement;
                  setNumInvites(Number(target.value.replace(/\D/g, '')));
                }}
              />
              planet invite code{numInvites > 1 ? 's' : ''}
            </Row>
            <Box className="mb4" lineHeight="1.4em">
              You can generate up to
              <strong>{` ${point.l2Quota} `}</strong>
              invites. You will be able to generate another
              <strong>{` ${point.l2Allowance}`}</strong> invites on
              <strong>{` ${ddmmmYYYY(nextQuotaTime)}`}</strong>.
            </Box>
            {showTxnNote && (
              <Box className="mb6" lineHeight="1.4em">
                Note: you will have to sign <strong>4</strong> transactions per
                invite, for a total of <strong>{4 * numInvites}</strong>{' '}
                signatures.
              </Box>
            )}
          </Box>
          <Box className="lower">
            <Row className="next-roll">
              <span>Next Roll in</span>
              <span className="timer">{nextRoll}</span>
            </Row>
            {/*
            // @ts-ignore */}
            <Button
              as={'button'}
              className={`generate-codes ${generateDisabled ? 'disabled' : ''}`}
              disabled={generateDisabled}
              center
              onClick={createInvites}>
              {overQuota
                ? `You can only generate ${point.l2Quota} codes`
                : `Generate Invite Codes (${numInvites})`}
            </Button>
          </Box>
        </BodyPane>
      </Window>
      <GeneratingModal
        status={generatingStatus}
        current={inviteJobs[point.value]?.generatingNum || 0}
        total={numInvites}
        error={error}
        hide={() => {
          setGeneratingStatus('initial');
          if (generatingStatus !== 'errored') {
            pop();
          }
        }}
      />
    </View>
  );
};
