import React from 'react';
import { Grid, Flex } from 'indigo-react';
import * as ob from 'urbit-ob';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import Sigil from 'components/Sigil';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';

import { composeValidator, buildNumberValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { NumberInput, ColorInput } from 'form/Inputs';

const BG_COLORS = [
  '#000000',
  '#C80F34',
  '#EE5432',
  '#F8C134',
  '#286E55',
  '#2AA779',
  '#2ED196',
  '#190D8D',
  '#4330FC',
  '#6184FF',
  '#83C3FF',
  '#903AE6',
  '#EC6FF7',
  '#FFB0D6',
];

const FG_COLORS = ['#000000', '#FFFFFF'];

export default function SigilGenerator() {
  const { pop, push, names } = useLocalRouter();
  const { pointCursor } = usePointCursor();

  const validate = composeValidator({ size: buildNumberValidator(16) });
  const point = need.point(pointCursor);
  const onSubmit = () => {};
  return (
    <View pop={pop}>
      <BridgeForm
        validate={validate}
        initialValues={{
          size: 256,
          fgColor: '#FFFFFF',
          bgColor: '#000000',
        }}
        onSubmit={onSubmit}>
        {({ handleSubmit, values }) => (
          <Grid gap={6}>
            <Grid.Item full className="f7">
              Sigil
            </Grid.Item>
            <Grid.Item fourth={1}>
              <Sigil
                size={50}
                patp={ob.patp(point)}
                colors={[values.bgColor, values.fgColor]}
              />
            </Grid.Item>

            <Grid.Item full as={Flex} col>
              <Flex.Item className="mb1">Urbit ID</Flex.Item>
              <Flex.Item className="mono">{ob.patp(point)}</Flex.Item>
            </Grid.Item>
            <Grid.Item full as={NumberInput} name="size" label="Size (px)" />
            <Grid.Item
              full
              as={ColorInput}
              name="bgColor"
              label="Background Color"
              colors={BG_COLORS}
            />
            <Grid.Item
              full
              as={ColorInput}
              name="fgColor"
              label="Foreground Color"
              colors={FG_COLORS}
            />
            <Grid.Item
              full
              as={SubmitButton}
              handleSubmit={handleSubmit}
              accessory="↓">
              Download Sigil
            </Grid.Item>
            <Grid.Item full as={FormError} />
          </Grid>
        )}
      </BridgeForm>
    </View>
  );
}
