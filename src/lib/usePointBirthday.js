import { usePointCache } from 'store/pointCache';

export default function usePointBirthday(point) {
  const { getBirthday } = usePointCache();

  return getBirthday(point);
}
