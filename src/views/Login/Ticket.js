import React, { useCallback, useMemo, useRef } from 'react';
import { Just } from 'folktale/maybe';
import cn from 'classnames';
import * as azimuth from 'azimuth-js';
import * as kg from 'urbit-key-generation/dist/index';
import { Grid, CheckboxInput } from 'indigo-react';
import { FORM_ERROR } from 'final-form';

import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import { WALLET_TYPES, urbitWalletFromTicket } from 'lib/wallet';
import useImpliedPoint from 'lib/useImpliedPoint';
import useLoginView from 'lib/useLoginView';
import patp2dec from 'lib/patp2dec';
import timeout from 'lib/timeout';

import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import { TicketInput, PassphraseInput, PointInput } from 'form/Inputs';
import {
  composeValidator,
  buildCheckboxValidator,
  buildPatqValidator,
  buildPassphraseValidator,
  buildPointValidator,
} from 'form/validators';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { hasWarnings } from 'form/helpers';
import { ForwardButton } from 'components/Buttons';

export default function Ticket({ className, goHome }) {
  useLoginView(WALLET_TYPES.TICKET);

  const { contracts } = useNetwork();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const impliedPoint = useImpliedPoint();
  const warnings = useRef({});

  const validateForm = useCallback((values, errors) => {
    warnings.current.point = null;

    if (errors.point) {
      return errors;
    }

    if (values.useShards) {
      if (errors.shard1 || errors.shard2 || errors.shard3) {
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
        ? kg.combine([values.shard1, values.shard2, values.shard3])
        : values.ticket;

      try {
        const _contracts = need.contracts(contracts);
        const point = patp2dec(values.point);

        await timeout(16); // allow ui events to flush
        const urbitWallet = await urbitWalletFromTicket(
          ticket,
          point,
          values.passphrase
        );

        const [isOwner, isTransferProxy] = await Promise.all([
          azimuth.azimuth.isOwner(
            _contracts,
            point,
            urbitWallet.ownership.keys.address
          ),
          azimuth.azimuth.isTransferProxy(
            _contracts,
            point,
            urbitWallet.ownership.keys.address
          ),
        ]);

        const noPermissions = !isOwner && !isTransferProxy;
        // notify the user, but allow login regardless
        if (noPermissions) {
          warnings.current.point =
            'This wallet is not the owner or transfer proxy for this point.';
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
    [contracts, setPointCursor, setUrbitWallet]
  );

  const afterSubmit = useCallback(() => {
    if (hasWarnings(warnings.current)) {
      return;
    }

    goHome();
  }, [goHome]);

  const validate = useMemo(
    () =>
      composeValidator(
        {
          usePassphrase: buildCheckboxValidator(),
          useShards: buildCheckboxValidator(),
          point: buildPointValidator(4),
          ticket: buildPatqValidator(),
          shard1: buildPatqValidator(),
          shard2: buildPatqValidator(),
          shard3: buildPatqValidator(),
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
    }),
    [impliedPoint]
  );

  return (
    <Grid className={cn('mt4', className)}>
      <BridgeForm
        validate={validate}
        onSubmit={onSubmit}
        afterSubmit={afterSubmit}
        initialValues={initialValues}>
        {({ handleSubmit, submitSucceeded }) => (
          <>
            <Grid.Item
              full
              as={PointInput}
              name="point"
              warning={warnings.current.point}
            />

            <Condition when="useShards" is={false}>
              <Grid.Item
                full
                as={TicketInput}
                name="ticket"
                label="Master Ticket"
              />
            </Condition>

            <Condition when="useShards" is={true}>
              <Grid.Item full as={TicketInput} name="shard1" label="Shard 1" />
              <Grid.Item full as={TicketInput} name="shard2" label="Shard 2" />
              <Grid.Item full as={TicketInput} name="shard3" label="Shard 3" />
            </Condition>

            <Condition when="usePassphrase" is={true}>
              <Grid.Item
                full
                as={PassphraseInput}
                name="passphrase"
                label="Wallet Passphrase"
              />
            </Condition>

            <Grid.Item
              full
              as={CheckboxInput}
              name="usePassphrase"
              label="Passphrase"
            />
            <Grid.Item
              full
              as={CheckboxInput}
              name="useShards"
              label="Shards"
            />

            <Grid.Item full as={FormError} />

            {submitSucceeded ? (
              <Grid.Item full as={ForwardButton} solid onClick={goHome}>
                Login Anyway
              </Grid.Item>
            ) : (
              <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
                Continue
              </Grid.Item>
            )}
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
