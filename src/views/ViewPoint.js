import React, { useCallback } from 'react';
import { Just } from 'folktale/maybe';
import { Grid, H4, HelpText } from 'indigo-react';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';

import patp2dec from 'lib/patp2dec';

import { PointInput } from 'form/Inputs';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';

export default function ViewPoint() {
  const { pop, push, names } = useHistory();
  const { setPointCursor } = usePointCursor();
  const onSubmit = useCallback(
    values => {
      setPointCursor(Just(patp2dec(values.point)));
      push(names.POINT);
    },
    [push, names.POINT, setPointCursor]
  );
  return (
    <View pop={pop} inset>
      <Grid>
        <BridgeForm onSubmit={onSubmit}>
          {({ handleSubmit }) => (
            <>
              <Grid.Item full as={H4}>
                View a Point
              </Grid.Item>
              <Grid.Item className="mt1" full as={HelpText}>
                Enter a point name to view its public information.
              </Grid.Item>
              <Grid.Item
                full
                className="mt2"
                as={PointInput}
                name="point"></Grid.Item>
              <Grid.Item full as={FormError} />
              <Grid.Item full as={SubmitButton} handleSubmit={handleSubmit}>
                Continue
              </Grid.Item>
            </>
          )}
        </BridgeForm>
      </Grid>
    </View>
  );
}
