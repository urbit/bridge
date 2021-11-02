import { azimuth } from 'azimuth-js';

export const isGalaxy = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Galaxy;

export const isStar = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Star;

export const isPlanet = (point: number) =>
  azimuth.getPointSize(point) === azimuth.PointSize.Planet;
