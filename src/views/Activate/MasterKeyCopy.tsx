import { Box, Icon, Text } from '@tlon/indigo-react';
import cn from 'classnames';
import useCopiable from '../../lib/useCopiable';
import withFadeable from './withFadeable';

interface MasterKeyCopyProps {
  text: string;
  className?: string;
}

const MasterKeyCopy = ({ text, className }: MasterKeyCopyProps) => {
  const [doCopy, didCopy] = useCopiable(text);
  const { color, label, icon } = didCopy
    ? { color: 'rgb(70,156,106)', label: 'Copied', icon: 'Checkmark' }
    : { color: 'rgb(89,167,248)', label: 'Copy', icon: 'Copy' };

  return (
    <Box className={cn(['mk-copy', className])} onClick={() => doCopy()}>
      <Box
        display={'flex'}
        flexDirection={'row'}
        flexWrap={'nowrap'}
        alignItems={'center'}
        cursor={'pointer'}
        padding={'10px 15px'}>
        <Icon color={color} icon={icon as 'Checkmark' | 'Copy'} size="16px" />
        <Text color={color} fontSize={'14px'} ml="4px" fontFamily={'Inter'}>
          {label}
        </Text>
      </Box>
    </Box>
  );
};

export default MasterKeyCopy;

export const FadeableMasterKeyCopy = withFadeable(MasterKeyCopy);
