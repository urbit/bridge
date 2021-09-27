import useLocalStorageState from './useLocalStorageState';

const NETWORKING_KEYS = 'bridge:networking-keys';

export default function useSeenMissingKeys() {
  return useLocalStorageState(NETWORKING_KEYS, false);
}
