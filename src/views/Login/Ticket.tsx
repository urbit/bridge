import { useCallback, useMemo, useRef, useState } from 'react';
import { Just } from 'folktale/maybe';
import * as kg from 'urbit-key-generation';
import { Grid, ToggleInput, AccessoryIcon } from 'indigo-react';
import { FORM_ERROR } from 'final-form';
import { Icon, Row } from '@tlon/indigo-react';

import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import { urbitWalletFromTicket } from 'lib/wallet';
import { WALLET_TYPES } from 'lib/constants';
import useImpliedPoint from 'lib/useImpliedPoint';
import useLoginView from 'lib/useLoginView';
import { patp2dec } from 'lib/patp2dec';
import { timeout } from 'lib/timeout';
import useRoller from 'lib/useRoller';

import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import { TicketInput, PassphraseInput, PointInput } from 'form/Inputs';
import {
  composeValidator,
  buildCheckboxValidator,
  buildPatqValidator,
  buildShardValidator,
  buildPassphraseValidator,
  buildPointValidator,
} from 'form/validators';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { WARNING } from 'form/helpers';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';
import AdvancedOptions from 'components/L2/Headers/AdvancedOptions';

function TicketInputAccessory({ name }: { name: any }) {
  return (
    <AccessoryIcon>
      <ToggleInput
        name={name}
        className="mt1"
        inverseLabel={<Icon className="icon" icon="Visible" />}
        label={<Icon className="icon" icon="Hidden" />}
      />
    </AccessoryIcon>
  );
}

interface TicketProps {
  className?: string;
  goHome: () => void;
}

export default function Ticket({ className, goHome }: TicketProps) {
  useLoginView(WALLET_TYPES.TICKET);

  const { setUrbitWallet }: any = useWallet();
  const { setPointCursor }: any = usePointCursor();
  const impliedPoint = useImpliedPoint();
  const didWarn = useRef(false);
  const { getPoints } = useRoller();

  const [usePassphrase, setUsePassphrase] = useState(false);
  const [useShards, setUseShards] = useState(false);

  const validateForm = useCallback((values, errors) => {
    didWarn.current = false;

    if (errors.point) {
      return errors;
    }

    if (values.useShards) {
      if (errors.shard1 || errors.shard2 || errors.shard3) {
        return errors;
      }
      const empty = ['shard1', 'shard2', 'shard3'].filter(s => !values[s]);
      if (empty.length > 1) {
        let errors = {};
        empty.forEach(s => {
          errors[s] = 'Please provide at least two out of three shards.';
        });
        return errors;
      }
    } else {
      if (errors.ticket) {
        return errors;
      }
    }
  }, []);

  const onSubmit = useCallback(
    async values => {
      const ticket = values.useShards
        ? kg.combine(
            [values.shard1, values.shard2, values.shard3].map(v =>
              v === '' ? undefined : v
            )
          )
        : values.ticket;

      try {
        // const _contracts = need.contracts(contracts);
        const point = patp2dec(values.point);

        await timeout(16); // allow ui events to flush
        const urbitWallet = await urbitWalletFromTicket(
          ticket,
          point,
          values.passphrase
        );
        const [ownedPoints, incomingPoints] = await Promise.all([
          getPoints('own', urbitWallet.ownership.keys.address),
          getPoints('transfer', urbitWallet.ownership.keys.address),
        ]);
        const isOwner = ownedPoints.length !== 0;
        const isTransferProxy = incomingPoints.length !== 0;

        const noPermissions = !isOwner && !isTransferProxy;
        // warn the user
        if (noPermissions && !didWarn.current) {
          didWarn.current = true;
          return {
            [WARNING]:
              'This wallet is not the owner or transfer proxy for this point.',
          };
        }

        setUrbitWallet(Just(urbitWallet));
        setPointCursor(Just(patp2dec(values.point)));
      } catch (error) {
        console.error(error);
        return {
          [FORM_ERROR]: `Unable to derive wallet from ${
            values.useShards ? 'shards' : 'ticket'
          }.`,
        };
      }
    },
    [setPointCursor, setUrbitWallet, getPoints]
  );

  const validate = useMemo(
    () =>
      composeValidator(
        {
          useAdvanced: buildCheckboxValidator(),
          usePassphrase: buildCheckboxValidator(),
          useShards: buildCheckboxValidator(),
          point: buildPointValidator(4),
          ticket: buildPatqValidator(),
          shard1: buildShardValidator(),
          shard2: buildShardValidator(),
          shard3: buildShardValidator(),
          ticketHidden: buildCheckboxValidator(),
          passphrase: buildPassphraseValidator(),
        },
        validateForm
      ),
    [validateForm]
  );

  const initialValues = useMemo(
    () => ({
      point: impliedPoint || '',
      usePasshrase: false,
      useShards: false,
      ticketHidden: true,
      useAdvanced: false,
    }),
    [impliedPoint]
  );

  const advancedOptions = [
    {
      selected: usePassphrase,
      key: 'usePassphrase',
      label: 'Passphrase',
      onClick: () => setUsePassphrase(!usePassphrase),
    },
    {
      selected: useShards,
      key: 'useShards',
      label: 'Shards',
      onClick: () => setUseShards(!useShards),
    },
  ];

  const ticketInputClass = usePassphrase && useShards ? 'ticket-input' : '';

  return (
    <Window className="master-ticket">
      <HeaderPane>
        <Row className="header-row">
          <h5>Master Ticket</h5>
          <AdvancedOptions options={advancedOptions} />
        </Row>
      </HeaderPane>
      <BodyPane className="login-body-pane">
        <Grid className="input-form" gap={1}>
          <BridgeForm
            validate={validate}
            onSubmit={onSubmit}
            afterSubmit={goHome}
            className="flex-col justify-between"
            onValues={() => null}
            initialValues={initialValues}>
            {({ handleSubmit, values, submitting }) => (
              <Grid.Item full className="flex-col justify-between">
                <Grid.Item full>
                  <Grid.Item
                    full
                    as={PointInput}
                    name="point"
                    className={ticketInputClass}
                  />

                  <Condition when="useShards" is={false}>
                    <Grid.Item
                      className={ticketInputClass}
                      full
                      as={TicketInput}
                      hidden={values.ticketHidden}
                      accessory={<TicketInputAccessory name="ticketHidden" />}
                      name="ticket"
                      label="Master Ticket"
                      style={{ height: 40 }}
                    />
                  </Condition>

                  {useShards && (
                    <>
                      <Grid.Item
                        className={ticketInputClass}
                        full
                        as={TicketInput}
                        accessory={<TicketInputAccessory name="ticketHidden" />}
                        hidden={values.ticketHidden}
                        name="shard1"
                        label="Shard 1"
                      />
                      <Grid.Item
                        className={ticketInputClass}
                        full
                        as={TicketInput}
                        accessory={<TicketInputAccessory name="ticketHidden" />}
                        hidden={values.ticketHidden}
                        name="shard2"
                        label="Shard 2"
                      />
                      <Grid.Item
                        className={ticketInputClass}
                        full
                        as={TicketInput}
                        accessory={<TicketInputAccessory name="ticketHidden" />}
                        hidden={values.ticketHidden}
                        name="shard3"
                        label="Shard 3"
                      />
                    </>
                  )}

                  {usePassphrase && (
                    <Grid.Item
                      full
                      as={PassphraseInput}
                      name="passphrase"
                      label="Wallet Passphrase"
                      className={ticketInputClass}
                    />
                  )}

                  <Grid.Item full as={FormError} />
                </Grid.Item>

                <Grid.Item
                  full
                  as={SubmitButton}
                  center
                  handleSubmit={handleSubmit}>
                  {(isWarning: boolean) =>
                    submitting
                      ? 'Logging in...'
                      : isWarning
                      ? 'Login Anyway'
                      : 'Log In'
                  }
                </Grid.Item>
              </Grid.Item>
            )}
          </BridgeForm>
        </Grid>
      </BodyPane>
    </Window>
  );
}
