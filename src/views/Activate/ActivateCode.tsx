import { useCallback, useMemo } from 'react';

import View from 'components/View';
import ActivateView from './ActivateView';
import CodeExpired from './CodeExpired';

import { useLocalRouter } from 'lib/LocalRouter';
import useImpliedTicket from 'lib/useImpliedTicket';
import useHasDisclaimed from 'lib/useHasDisclaimed';
import useIsExpiredInvite from 'lib/useIsExpiredInvite';

import { ReactComponent as PlaceholderSigil } from 'assets/blank-planet-sigil.svg';
import { FadeablePointPresenter as PointPresenter } from './PointPresenter';
import { Box } from '@tlon/indigo-react';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import { FadeableActivateCodeForm as ActivateCodeForm } from './ActivateCodeForm';
import useFadeIn from './useFadeIn';

export default function ActivateCode() {
  const { names, push }: any = useLocalRouter();
  const { impliedPatp, impliedTicket } = useImpliedTicket();
  const [hasDisclaimed] = useHasDisclaimed();

  const goToMasterKey = useCallback(() => {
    if (!hasDisclaimed) {
      push(names.DISCLAIMER, { next: names.MASTER_KEY });
    } else {
      push(names.MASTER_KEY);
    }
  }, [hasDisclaimed, names.DISCLAIMER, names.MASTER_KEY, push]);

  // Fade in on load
  useFadeIn();

  const hasInitialValues = useMemo(
    () => Boolean(impliedTicket && impliedPatp),
    [impliedTicket, impliedPatp]
  );

  const { isExpired } = useIsExpiredInvite(impliedPatp, impliedTicket);

  return (
    <View inset hideBack>
      {isExpired ? (
        <CodeExpired />
      ) : (
        <ActivateView
          hideBack={hasInitialValues}
          header={
            <ActivateHeader
              content={
                hasInitialValues
                  ? 'Welcome. This is your Urbit ID.'
                  : 'Activate a Planet'
              }
            />
          }
          footer={<ActivateCodeForm afterSubmit={goToMasterKey} />}>
          <Box className="flex-col align-center justify-center w-full h-full">
            {hasInitialValues ? (
              <Box>
                <p
                  className="mb2 sans gray5"
                  style={{
                    fontSize: 14,
                    textAlign: 'center',
                    maxWidth: '38ch',
                    marginLeft: 'auto',
                  }}>
                  An Urbit ID is your unique identity that you use to
                  communicate on Urbit. You own it forever.
                </p>
                <p
                  className="mb2 sans gray5"
                  style={{
                    fontSize: 14,
                    textAlign: 'center',
                    maxWidth: '38ch',
                    marginLeft: 'auto',
                  }}>
                  To activate your Urbit ID, begin by claiming it via the link
                  below.
                </p>
              </Box>
            ) : (
              <Box className="mb2 sans gray5" fontSize={14}>
                Enter your planet activation code below.
              </Box>
            )}
            {impliedPatp ? (
              <PointPresenter patp={impliedPatp} className="mb6 mt7" />
            ) : (
              <PlaceholderSigil className="mv9" style={{ marginTop: 78 }} />
            )}
          </Box>
        </ActivateView>
      )}
    </View>
  );
}
