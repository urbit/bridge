import { useMediaQuery } from './MediaQuery';

export default function useBreakpoints(values = [null, null, null]) {
  return values[useMediaQuery()];
}
