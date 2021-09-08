import { useEffect } from 'react';
import { useActivateFlow } from './ActivateFlow';

const useFadeIn = () => {
  const { setIsIn } = useActivateFlow();

  useEffect(() => {
    setIsIn(true);

    return () => {
      setIsIn(false);
    };
  }, [setIsIn]);
};

export default useFadeIn;
