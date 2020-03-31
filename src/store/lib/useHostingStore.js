import { useLocalHostingStore } from './useLocalHostingStore';
import { useTlonHostingStore } from './useTlonHostingStore';

import { useNetwork } from 'store/network';

import { HOSTING_STATUS } from 'lib/hosting';
import { NETWORK_TYPES } from 'lib/network';

const HOSTING_DETAILS = {
  DEV: { url: '', domain: 'liam.tlon.network', disabled: true },
  MAINNET: { url: '', domain: '', disabled: true },
};
export default function useHostingStore() {
  const { networkType } = useNetwork();
  const { url, domain, disabled } =
    networkType === NETWORK_TYPES.MAINNET
      ? HOSTING_DETAILS.MAINNET
      : HOSTING_DETAILS.DEV;

  const { status: tlonStatus, ...tlonHosting } = useTlonHostingStore(
    url,
    domain,
    disabled
  );

  const { status: localStatus, ...localHosting } = useLocalHostingStore();

  if (
    !disabled &&
    (tlonStatus === HOSTING_STATUS.RUNNING ||
      localStatus === HOSTING_STATUS.MISSING)
  ) {
    return { status: tlonStatus, ...tlonHosting };
  }
  return { status: localStatus, ...localHosting };
}
