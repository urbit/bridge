import { Box } from '@tlon/indigo-react';

type ActivateStepsProps = {
  currentStep: number;
  totalSteps: number;
  className?: string;
};

export const ActivateSteps = ({
  currentStep,
  totalSteps,
  className,
}: ActivateStepsProps) => {
  const renderSteps = () => {
    let steps = [];
    for (let i = 0; i < totalSteps; i++) {
      steps.push(
        <Box
          borderTopLeftRadius={i === 0 ? '5px' : null}
          borderBottomLeftRadius={i === 0 ? '5px' : null}
          borderTopRightRadius={i === totalSteps - 1 ? '5px' : null}
          borderBottomRightRadius={i === totalSteps - 1 ? '5px' : null}
          key={i}
          backgroundColor={i <= currentStep ? 'black' : 'gray'}
          height={'10px'}
          width={`${100 / totalSteps}%`}
          marginLeft={'2px'}
          marginRight={'2px'}></Box>
      );
    }
    return steps;
  };

  return (
    <Box
      display={'flex'}
      flexDirection={'row'}
      flexWrap={'nowrap'}
      width={'100%'}
      className={className}>
      {renderSteps()}
    </Box>
  );
};
