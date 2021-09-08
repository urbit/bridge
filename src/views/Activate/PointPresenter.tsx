import { Box, Text } from '@tlon/indigo-react';
import Sigil from 'components/Sigil';
import withFadeable from './withFadeable';

type PointPresenterArgs = {
  patp: string;
  className?: string;
};

const PointPresenter = ({ patp, className }: PointPresenterArgs) => {
  return patp ? (
    <Box
      width={256}
      height={256}
      display="flex"
      flexDirection="column"
      flexWrap="nowrap"
      justifyContent="center"
      alignItems="center"
      background="white"
      className={className}>
      <Box
        background="black"
        borderRadius={5}
        padding={32}
        mb={3}
        width={64}
        height={64}>
        <Sigil
          patp={patp}
          size={64}
          display="block"
          colors={['black', 'white']}
          icon
          padding={32}
          borderRadius={5}
        />
      </Box>
      <Box>
        <Text
          display="block"
          fontFamily={'Source Code Pro'}
          fontSize={'18px'}
          textAlign={'center'}>
          {patp}
        </Text>
      </Box>
    </Box>
  ) : null;
};

export default PointPresenter;

export const FadeablePointPresenter = withFadeable(PointPresenter);
