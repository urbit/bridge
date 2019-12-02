import useLocalStorageState from './useLocalStorageState';

const WAS_GREETED_KEY = 'bridge:was-greeted';

export default function useWasGreeted() {
  return useLocalStorageState(WAS_GREETED_KEY, false);
}
