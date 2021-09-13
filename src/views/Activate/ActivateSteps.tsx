import { Box, SegmentedProgressBar } from '@tlon/indigo-react';
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
          borderTopLeftRadius={isFirstStep ? '3px' : null}
          borderBottomLeftRadius={isFirstStep ? '3px' : null}
          borderTopRightRadius={isLastStep ? '3px' : null}
          borderBottomRightRadius={isLastStep ? '3px' : null}
          key={i}
          backgroundColor={i <= currentStep ? 'black' : 'gray'}
          height={'4px'}
          width={`${100 / totalSteps}%`}
          marginLeft={'0px'}
          marginRight={isLastStep ? null : '1px'}></Box>
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
      {/* TODO: Ask Jimmy: */}
      {/* <SegmentedProgressBar current={currentStep} segments={totalSteps} /> */}
      {renderSteps()}
    </Box>
  );
};

export const FadeableActivateSteps = withFadeable(ActivateSteps);
