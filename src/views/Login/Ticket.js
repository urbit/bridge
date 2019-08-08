import React, { useCallback, useMemo, useRef } from 'react';
import { Just, Nothing } from 'folktale/maybe';
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

import ContinueButton from './ContinueButton';
import useSetState from 'lib/useSetState';

export default function Ticket({ className, goHome }) {
  useLoginView(WALLET_TYPES.TICKET);

  const { contracts } = useNetwork();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const impliedPoint = useImpliedPoint();
  const [warnings, addWarning] = useSetState();

  const cachedUrbitWallet = useRef(Nothing());

  const validateForm = useCallback(
    async (values, errors) => {
      if (errors.point) {
        return errors;
      }

      await timeout(16); // allow ui events to flush

      let ticket;
      if (values.useShards) {
        if (errors.shard1 || errors.shard2 || errors.shard3) {
          return errors;
        }

        ticket = kg.combine([values.shard1, values.shard2, values.shard3]);
      } else {
        if (errors.ticket) {
          return errors;
        }

        ticket = values.ticket;
      }

      try {
        // ticket
        const _contracts = need.contracts(contracts);
        const point = patp2dec(values.point);

        cachedUrbitWallet.current = await urbitWalletFromTicket(
          ticket,
          point,
          values.passphrase
        );

        const [isOwner, isTransferProxy] = await Promise.all([
          azimuth.azimuth.isOwner(
            _contracts,
            point,
            cachedUrbitWallet.current.ownership.keys.address
          ),
          azimuth.azimuth.isTransferProxy(
            _contracts,
            point,
            cachedUrbitWallet.current.ownership.keys.address
          ),
        ]);

        const noPermissions = !isOwner && !isTransferProxy;
        // notify the user, but allow login regardless
        addWarning({
          point: noPermissions
            ? 'This wallet is not the owner or transfer proxy for this point.'
            : null,
        });
      } catch (error) {
        console.error(error);
        return {
          [FORM_ERROR]: `Unable to derive wallet from ${
            values.useShards ? 'shards' : 'ticket'
          }.`,
        };
      }
    },
    [addWarning, contracts]
  );

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

  const onValues = useCallback(
    ({ valid, values }) => {
      if (valid) {
        setUrbitWallet(Just(cachedUrbitWallet.current));
        setPointCursor(Just(patp2dec(values.point)));
      } else {
        setUrbitWallet(Nothing());
      }
    },
    [setPointCursor, setUrbitWallet]
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
        warnings={warnings}
        validate={validate}
        onValues={onValues}
        afterSubmit={goHome}
        initialValues={initialValues}>
        {({ handleSubmit }) => (
          <>
            <Grid.Item full as={PointInput} name="point" />

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

            <Grid.Item full as={ContinueButton} handleSubmit={handleSubmit} />
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
