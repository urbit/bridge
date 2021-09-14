import { azimuth } from 'azimuth-js';

export const isStar = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Star;
