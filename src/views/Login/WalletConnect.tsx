import { Image, Row, Text } from '@tlon/indigo-react';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import SubmitButton from 'form/SubmitButton';
import { Grid } from 'indigo-react';
import { WALLET_TYPES } from 'lib/constants';
import useLoginView from 'lib/useLoginView';
import { useWalletConnect } from 'lib/useWalletConnect';
import { abbreviateAddress } from 'lib/utils/address';
import { ForwardButton, RestartButton } from 'components/Buttons';
import Window from 'components/L2/Window/Window';
import HeaderPane from 'components/L2/Window/HeaderPane';
import BodyPane from 'components/L2/Window/BodyPane';

interface WalletConnectLoginProps {
  className?: string;
  goHome: () => void;
}

const WalletConnectLogin = ({ className, goHome }: WalletConnectLoginProps) => {
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
      <Window className="master-ticket">
        <HeaderPane>
          <Row className="header-row">
            <h5>WalletConnect</h5>
          </Row>
        </HeaderPane>
        <BodyPane className="login-body-pane">
          <Grid className={`${className} w-full`}>
            {!isConnected() && (
              <Grid.Item full as={Text} className="f6 gray4 mb3">
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
                      <Text>Icon Unavailable</Text>
                    )}
                  </Grid.Item>
                  <Grid.Item
                    className={'flex-col align-center justify-center'}
                    style={{ gridArea: 'auto / 6 / auto / 11' }}>
                    <Text as={'div'}>{peerMeta.name}</Text>
                    <Text as={'div'}>
                      {address ? abbreviateAddress(address) : null}
                    </Text>
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
              {({ handleSubmit, submitting }: any) => (
                <Grid.Item full className="flex-col justify-end">
                  {isConnected() ? (
                    <>
                      <Grid.Item full as={FormError} />

                      <Grid.Item
                        full
                        center
                        as={SubmitButton}
                        handleSubmit={handleSubmit}>
                        {submitting
                          ? 'Please check your WalletConnect wallet'
                          : 'Authenticate'}
                      </Grid.Item>
                    </>
                  ) : (
                    <>
                      <Grid.Item
                        full
                        center
                        as={ForwardButton}
                        solid
                        onClick={connect}>
                        {'Connect'}
                      </Grid.Item>
                    </>
                  )}
                </Grid.Item>
              )}
            </BridgeForm>
          </Grid>
        </BodyPane>
      </Window>
    )
  );
};

export default WalletConnectLogin;
