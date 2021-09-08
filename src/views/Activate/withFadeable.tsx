import { useActivateFlow } from './ActivateFlow';
import { CSSTransition } from 'react-transition-group';
import { DEFAULT_FADE_TIMEOUT } from 'lib/constants';

interface withFadeableProps {
  fadeTimeout?: number;
}

const withFadeable = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & withFadeableProps> => (props: withFadeableProps) => {
  const { isIn } = useActivateFlow();

  return (
    <CSSTransition
      in={isIn}
      classNames="fadeable"
      timeout={props.fadeTimeout || DEFAULT_FADE_TIMEOUT}>
      <Component {...(props as P)} />
    </CSSTransition>
  );
};

export default withFadeable;
