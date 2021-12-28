import { useMediaQuery } from './MediaQuery';

export default function useBreakpoints(values: any = [null, null, null]) {
  const query = useMediaQuery() || 0;
  return values[query];
}
