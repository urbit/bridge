import useLocalStorageState from './useLocalStorageState';

const HAS_DISCLAIMED_KEY = 'bridge:has-disclaimed';

export default function useHasDisclaimed() {
  return useLocalStorageState(HAS_DISCLAIMED_KEY, false);
}
