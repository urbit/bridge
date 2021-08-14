import { Image } from '@tlon/indigo-react';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { Grid, Text as LegacyText } from 'indigo-react';
import { WALLET_TYPES } from 'lib/constants';
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
    peerIcon,
    peerMeta,
  } = useWalletConnect();

  const onSubmit = async () => {
    await authenticate();
    return;
  };

  return (
    connector && (
      <>
        <Grid className={className}>
          {!isConnected() && (
            <Grid.Item full as={LegacyText} className="f6 gray4 mb3">
              Note that WalletConnect is a young protocol, not all wallets may
              work fully
            </Grid.Item>
          )}

          {isConnected() && peerMeta && (
            <Grid.Item full className="f6 gray5 mt3 mb3">
              <Grid>
                <Grid.Item style={{ gridArea: 'auto / 3 / auto / 5' }}>
                  {peerIcon ? (
                    <Image src={peerIcon} />
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

          <BridgeForm onSubmit={onSubmit} afterSubmit={goHome}>
            {({ handleSubmit, submitting }) => (
              <>
                {isConnected() ? (
                  <>
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
