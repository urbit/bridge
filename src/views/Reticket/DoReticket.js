import React, { useState } from 'react';
import { Just } from 'folktale/maybe';

import View from 'components/View';
import { ForwardButton } from 'components/Buttons';
import { Warning } from 'components/old/Base';

import { TRANSACTION_STATES, claimPointFromInvite } from 'lib/invite';

import * as need from 'lib/need';
import { useNetwork } from 'store/network';
import { useWallet } from 'store/wallet';
import { usePointCursor } from 'store/pointCursor';
import useLifecycle from 'lib/useLifecycle';

export default function DoReticket({ newWallet, completed }) {
  const { web3, contracts } = useNetwork();
  const { wallet, setUrbitWallet } = useWallet();
  const { pointCursor } = usePointCursor();

  const [transactionProgress, setTransactionProgress] = useState(
    TRANSACTION_STATES.GENERATING
  );
  const [errors, setErrors] = useState([]);

  // start reticketing transactions on mount
  useLifecycle(() => {
    claimPointFromInvite({
      inviteWallet: need.wallet(wallet),
      wallet: newWallet.value.wallet,
      point: need.point(pointCursor),
      web3: need.web3(web3),
      contracts: need.contracts(contracts),
      onUpdate: updateProgress,
    }).then(() => {
      setUrbitWallet(newWallet.value.wallet);
    });
  });

  const updateProgress = notification => {
    if (notification.type === 'progress') {
      setTransactionProgress(notification.value);
    } else if (notification.type === 'notify') {
      setErrors([notification.value]);
    }
  };

  const next = () => {
    completed();
  };

  const getErrors = () => {
    if (errors.length === 0) return null;

    let errorElems = errors.map(e => <span>{e}</span>);

    return (
      <Warning>
        <h3 className={'mb-2'}>{'Warning'}</h3>
        {errorElems}
      </Warning>
    );
  };

  const errorDisplay = getErrors();

  return (
    <View>
      {errorDisplay}
      {transactionProgress.label === TRANSACTION_STATES.DONE.label ? (
        <div>
          <h1 className="fs-6 lh-8 mb-3">
            <span>Success</span>
            <span className="ml-4 green">✓</span>
          </h1>
          <ForwardButton onClick={next}>Done!</ForwardButton>
        </div>
      ) : (
        <div>
          <h1 className="fs-6 lh-8 mb-3">Submitting</h1>
          <p className="mt-4 mb-4">
            This step can take up to five minutes. Please do not leave this page
            until the transactions are complete.
          </p>
          <div className="passport-progress mb-2">
            <div
              className="passport-progress-filled"
              style={{ width: transactionProgress.pct }}
            />
          </div>
          <div className="flex justify-between">
            <div className="text-mono text-sm lh-6 green-dark">
              {transactionProgress.label}
            </div>
          </div>
        </div>
      )}
    </View>
  );
}
