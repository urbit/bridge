import { Box } from '@tlon/indigo-react';
import withFadeable from './withFadeable';

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
      const isFirstStep = i === 0;
      const isLastStep = i === totalSteps - 1;
      steps.push(
        <Box
          borderTopLeftRadius={isFirstStep ? '5px' : null}
          borderBottomLeftRadius={isFirstStep ? '5px' : null}
          borderTopRightRadius={isLastStep ? '5px' : null}
          borderBottomRightRadius={isLastStep ? '5px' : null}
          key={i}
          backgroundColor={i <= currentStep ? 'black' : 'gray'}
          height={'10px'}
          width={`${100 / totalSteps}%`}
          marginLeft={isFirstStep ? null : '2px'}
          marginRight={isLastStep ? null : '2px'}></Box>
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

export const FadeableActivateSteps = withFadeable(ActivateSteps);
