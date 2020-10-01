import React, { useCallback, useMemo, useRef } from 'react';
import { Just } from 'folktale/maybe';
import cn from 'classnames';
import * as azimuth from 'azimuth-js';
import * as kg from 'urbit-key-generation';
import {
  Grid,
  CheckboxInput,
  Flex,
  ToggleInput,
  AccessoryIcon,
} from 'indigo-react';
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
  buildShardValidator,
  buildPassphraseValidator,
  buildPointValidator,
} from 'form/validators';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { WARNING } from 'form/helpers';

import { ReactComponent as SecretShowIcon } from 'assets/secret-show.svg';
import { ReactComponent as SecretHideIcon } from 'assets/secret-hidden.svg';

function AdvancedOptions() {
  return (
    <Flex.Item as={Flex}>
      <Condition when="useAdvanced" is={true}>
        <Flex.Item
          as={CheckboxInput}
          inline
          white
          className="mr4"
          name="usePassphrase"
          label="Passphrase"
          style={{ boxSizing: 'border-box' }}
        />
        <Flex.Item
          as={CheckboxInput}
          inline
          white
          className="mr4"
          name="useShards"
          label="Shards"
          style={{ boxSizing: 'border-box' }}
        />
      </Condition>
      <Flex.Item
        as={ToggleInput}
        name="useAdvanced"
        label="Settings"
        small
        inverseLabel="Close"
      />
    </Flex.Item>
  );
}

function TicketInputAccessory({ name }) {
  return (
    <AccessoryIcon>
      <ToggleInput
        name={name}
        className="mt1"
        inverseLabel={<SecretShowIcon />}
        label={<SecretHideIcon />}
      />
    </AccessoryIcon>
  );
}

export default function Ticket({ className, goHome }) {
  useLoginView(WALLET_TYPES.TICKET);

  const { contracts } = useNetwork();
  const { setUrbitWallet } = useWallet();
  const { setPointCursor } = usePointCursor();
  const impliedPoint = useImpliedPoint();
  const didWarn = useRef(false);

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
        empty.map(s => {
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
    [contracts, setPointCursor, setUrbitWallet]
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

  return (
    <Grid className={className}>
      <BridgeForm
        validate={validate}
        onSubmit={onSubmit}
        afterSubmit={goHome}
        initialValues={initialValues}>
        {({ handleSubmit, values, submitting }) => (
          <>
            <Grid.Item full as={PointInput} name="point" />

            <Condition when="useShards" is={false}>
              <Grid.Item
                full
                as={TicketInput}
                hidden={values.ticketHidden}
                labelAccessory={<AdvancedOptions />}
                accessory={<TicketInputAccessory name="ticketHidden" />}
                className="mt3"
                name="ticket"
                label="Master Ticket"
              />
            </Condition>

            <Condition when="useShards" is={true}>
              <Grid.Item
                full
                as={TicketInput}
                accessory={<TicketInputAccessory name="ticketHidden" />}
                hidden={values.ticketHidden}
                labelAccessory={<AdvancedOptions />}
                className="mt3"
                name="shard1"
                label="Shard 1"
              />
              <Grid.Item
                full
                as={TicketInput}
                accessory={<TicketInputAccessory name="ticketHidden" />}
                hidden={values.ticketHidden}
                className="mt3"
                name="shard2"
                label="Shard 2"
              />
              <Grid.Item
                full
                as={TicketInput}
                className="mt3"
                accessory={<TicketInputAccessory name="ticketHidden" />}
                hidden={values.ticketHidden}
                name="shard3"
                label="Shard 3"
              />
            </Condition>

            <Condition when="usePassphrase" is={true}>
              <Grid.Item
                full
                as={PassphraseInput}
                className="mt3"
                name="passphrase"
                label="Wallet Passphrase"
              />
            </Condition>

            <Grid.Item full as={FormError} />

            <Grid.Item
              full
              as={SubmitButton}
              center
              handleSubmit={handleSubmit}>
              {isWarning =>
                submitting
                  ? 'Logging in...'
                  : isWarning
                  ? 'Login Anyway'
                  : 'Login'
              }
            </Grid.Item>
          </>
        )}
      </BridgeForm>
    </Grid>
  );
}
