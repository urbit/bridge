import React from 'react';
import cn from 'classnames';
import { useFormState } from 'react-final-form';

import { ForwardButton } from 'components/Buttons';
import Blinky from 'components/Blinky';

export default function ContinueButton({ className, children, handleSubmit }) {
  const { valid, validating, submitting } = useFormState({
    subscription: { valid: true, validating: true, submitting: true },
  });

  const loading = validating || submitting;

  return (
    <ForwardButton
      solid
      className={cn('mt2', className)}
      loading={validating}
      disabled={!valid || loading}
      accessory={loading ? <Blinky /> : undefined}
      onClick={handleSubmit}>
      {children || 'Continue'}
    </ForwardButton>
  );
}
