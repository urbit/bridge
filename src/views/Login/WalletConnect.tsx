import { useCallback, useMemo } from 'react';
import { Image } from '@tlon/indigo-react';
import BridgeForm from 'form/BridgeForm';
import Condition from 'form/Condition';
import FormError from 'form/FormError';
import { HdPathInput } from 'form/Inputs';
import SubmitButton from 'form/SubmitButton';
import {
  buildCheckboxValidator,
  buildHdPathValidator,
  composeValidator,
} from 'form/validators';
import { CheckboxInput, Grid, Text as LegacyText } from 'indigo-react';
import { DEFAULT_HD_PATH, WALLET_TYPES } from 'lib/constants';
import useLoginView from 'lib/useLoginView';
import { useWalletConnect } from 'lib/useWalletConnect';
import { abbreviateAddress } from 'lib/utils/address';
import { ForwardButton, RestartButton } from 'components/Buttons';

const WalletConnectLogin = ({ className, goHome }) => {
  useLoginView(WALLET_TYPES.WALLET_CONNECT);

  const {
    address,
    authenticate,
    connect,
    connector,
    disconnect,
    isConnected,
    peerMeta,
  } = useWalletConnect();

  const initialValues = useMemo(
    () => ({
      useCustomPath: false,
      hdPath: DEFAULT_HD_PATH,
    }),
    []
  );

  const validate = useMemo(
    () =>
      composeValidator({
        useCustomPath: buildCheckboxValidator(),
        hdPath: buildHdPathValidator(),
      }),
    []
  );

  const onValues = useCallback(({ valid, values, form }) => {
    if (!valid) {
      return;
    }

    if (!values.useCustomPath) {
      form.change('hdPath', DEFAULT_HD_PATH);
    }
  }, []);

  const onSubmit = async (values: typeof initialValues) => {
    await authenticate({ hdPath: values.hdPath });
    return;
  };

  return (
    connector && (
      <>
        <Grid className={className}>
          {!isConnected() && (
            <Grid.Item full as={LegacyText} className="f6 gray4 mb3">
              Connect a wallet that supports WalletConnect
            </Grid.Item>
          )}

          {isConnected() && peerMeta && (
            <Grid.Item full className="f6 gray5 mt3 mb3">
              <Grid>
                <Grid.Item style={{ gridArea: 'auto / 3 / auto / 5' }}>
                  {peerMeta.icons.length > 0 ? (
                    <Image src={peerMeta.icons[0]} />
                  ) : (
                    <LegacyText>Icon Unavailable</LegacyText>
                  )}
                </Grid.Item>
                <Grid.Item
                  className={'flex-col align-center justify-center'}
                  style={{ gridArea: 'auto / 6 / auto / 11' }}>
                  <LegacyText as="div">{peerMeta.name}</LegacyText>
                  <LegacyText as="div">
                    {address ? abbreviateAddress(address) : null}
                  </LegacyText>
                  <RestartButton
                    as="a"
                    className={'gray3'}
                    onClick={disconnect}>
                    disconnect
                  </RestartButton>
                </Grid.Item>
              </Grid>
            </Grid.Item>
          )}

          <BridgeForm
            validate={validate}
            onSubmit={onSubmit}
            onValues={onValues}
            afterSubmit={goHome}
            initialValues={initialValues}>
            {({ handleSubmit, submitting }) => (
              <>
                {isConnected() ? (
                  <>
                    <Grid.Item
                      full
                      as={CheckboxInput}
                      className="mv3"
                      name="useCustomPath"
                      label="Custom HD Path"
                    />

                    <Condition when="useCustomPath" is={true}>
                      <Grid.Item
                        full
                        as={HdPathInput}
                        name="hdPath"
                        label="HD Path"
                      />
                    </Condition>

                    <Grid.Item full as={FormError} />

                    <Grid.Item
                      full
                      as={SubmitButton}
                      handleSubmit={handleSubmit}>
                      {submitting
                        ? 'Please check your WalletConnect wallet'
                        : 'Authenticate'}
                    </Grid.Item>
                  </>
                ) : (
                  <>
                    <Grid.Item full as={ForwardButton} solid onClick={connect}>
                      {'Connect'}
                    </Grid.Item>
                  </>
                )}
              </>
            )}
          </BridgeForm>
        </Grid>
      </>
    )
  );
};

export default WalletConnectLogin;
