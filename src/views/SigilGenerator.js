import React, { useRef, useCallback } from 'react';
import { Grid, Flex, ColorInput } from 'indigo-react';
import * as ob from 'urbit-ob';
import { FORM_ERROR } from 'final-form';
import { colors } from 'indigo-tokens';

import { usePointCursor } from 'store/pointCursor';

import View from 'components/View';
import Sigil from 'components/Sigil';

import * as need from 'lib/need';
import { useLocalRouter } from 'lib/LocalRouter';
import useSigilDownloader from 'lib/useSigilDownloader';

import { composeValidator, buildNumberValidator } from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { NumberInput } from 'form/Inputs';

const BG_COLORS = [
  colors.black,
  colors.white,
  colors.blue,
  colors.blueLight,
  colors.blueDark,
  colors.redLight,
  colors.red,
  colors.redDark,
  colors.greenLight,
  colors.green,
  colors.greenDark,
  colors.yellowLight,
  colors.yellow,
  colors.yellowDark,
];

const FG_COLORS = [colors.black, colors.white];

export default function SigilGenerator() {
  const { pop } = useLocalRouter();
  const { pointCursor } = usePointCursor();

  const validate = composeValidator({ size: buildNumberValidator(16) });
  const point = need.point(pointCursor);

  const canvasRef = useRef(null);

  const { downloadSigil } = useSigilDownloader(canvasRef);
  const onSubmit = useCallback(
    async (values, form) => {
      const error = await downloadSigil(point, values.colors, values.size);
      if (error) {
        return { [FORM_ERROR]: error };
      }
      // reset on next tick
      setTimeout(() => form.reset(values));
    },
    [point, downloadSigil]
  );
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
            <Grid.Item
              fourth={1}
              as={NumberInput}
              name="size"
              label="Size (px)"
            />
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

      <canvas style={{ display: 'none' }} ref={canvasRef} />
    </View>
  );
}
