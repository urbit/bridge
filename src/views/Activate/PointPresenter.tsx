import { Box, Text } from '@tlon/indigo-react';
import Sigil from 'components/Sigil';
import withFadeable from './withFadeable';

type PointPresenterArgs = {
  patp: string;
  className?: string;
  showLabel?: boolean;
  success?: boolean;
};

const PointPresenter = ({
  patp,
  className,
  showLabel = true,
  success = false,
}: PointPresenterArgs) => {
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
        background={success ? '#009F65' : 'black'}
        borderRadius={5}
        padding={24}
        mb={3}
        width={64}
        height={64}>
        <Sigil
          patp={patp}
          colors={[success ? '#009F65' : 'black', 'white']}
          size={64}
          display="block"
          padding={32}
          borderRadius={5}
        />
      </Box>
      {showLabel && (
        <Box>
          <Text
            display="block"
            fontFamily={'Source Code Pro'}
            fontSize={'18px'}
            textAlign={'center'}>
            {patp}
          </Text>
        </Box>
      )}
    </Box>
  ) : null;
};

export default PointPresenter;

export const FadeablePointPresenter = withFadeable(PointPresenter);
