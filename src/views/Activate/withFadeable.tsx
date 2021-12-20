import { useActivateFlow } from './ActivateFlow';
import { CSSTransition } from 'react-transition-group';
import { DEFAULT_FADE_TIMEOUT } from 'lib/constants';

interface withFadeableProps {
  fadeTimeout?: number;
  overrideFadeIn?: boolean;
}

const withFadeable = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P & withFadeableProps> => (props: withFadeableProps) => {
  const { isIn }: any = useActivateFlow();

  // Allow one-off overrides, otherwise fallback to shared fade-in state
  const _in = props?.overrideFadeIn ? props.overrideFadeIn : isIn;

  return (
    <CSSTransition
      in={_in}
      classNames="fadeable"
      timeout={props.fadeTimeout || DEFAULT_FADE_TIMEOUT}>
      <Component {...(props as P)} />
    </CSSTransition>
  );
};

export default withFadeable;
