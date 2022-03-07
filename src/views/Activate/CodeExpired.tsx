import View from 'components/View';

import { Box, Button } from '@tlon/indigo-react';
import { FadeableActivateHeader as ActivateHeader } from './ActivateHeader';
import useFadeIn from './useFadeIn';
import Window from 'components/L2/Window/Window';

import './CodeExpired.scss';

export default function CodeExpired() {
  // Fade in on load
  useFadeIn();

  return (
    <Window className="expired-view mt10">
      <Box className="w-full">
        <ActivateHeader content="This invite link has expired." />
      </Box>
      <Box className="flex-col align-center justify-center w-full h-full">
        <Box>
          <p
            className="mb2 sans gray5"
            style={{
              fontSize: 14,
              textAlign: 'center',
              maxWidth: '38ch',
              marginLeft: 'auto',
            }}>
            Please contact the entity you received it from.
          </p>
        </Box>
        <a className="flex-col m4 w-full" href="https://twitter.com/urbit">
          <Button
            className="m2"
            backgroundColor={'black'}
            color={'white'}
            padding={'16px'}
            fontFamily="Inter"
            height={'40px'}
            fontWeight={'400'}
            fontSize={'14px'}
            borderRadius={'4px'}>
            Learn more
          </Button>
        </a>
      </Box>
    </Window>
  );
}
