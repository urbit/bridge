import { usePointCache } from 'store/pointCache';

export default function useInvites(point) {
  const { getInvites } = usePointCache();

  return getInvites(point);
}
