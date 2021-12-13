import { Box, Icon, Text } from '@tlon/indigo-react';
import './StarReleaseButton.scss';

interface StarReleaseButtonProps {
  onClick: VoidFunction;
  title: string;
  subtitle: string;
}

export const StarReleaseButton = ({
  onClick,
  title,
  subtitle,
}: StarReleaseButtonProps) => {
  return (
    <Box onClick={onClick} className={'star-release-button full'}>
      <Box className={'title-container'}>
        <Text className={'button-title'}>{title}</Text>
        <Text className={'button-subtitle'}>{subtitle}</Text>
      </Box>
      <Box>
        <Icon
          display="inline-block"
          icon="ChevronEast"
          size="14px"
          color={'black'}
        />
      </Box>
    </Box>
  );
};
