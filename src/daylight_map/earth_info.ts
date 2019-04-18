import { DateTime } from 'luxon';

import { Vec3 } from './Vec3';

const TWO_PI = 2 * Math.PI;

function understandDate(date: DateTime) {
  let time = date.hour + date.minute / 60 + date.second / 3600;
  time = time + 24 + 6 - date.offset / 60;
  time = (time % 24) / 24;
  return {
    dayOfYear: date.ordinal,
    time: time,
    daysInYear: date.daysInYear,
  };
}

export type EarthInfo = {
  tilt: number;
  seasonOffset: Vec3;
  pointingFromEarthToSun: Vec3;
};

export function getEarthInfo(date: DateTime): EarthInfo {
  const times = understandDate(date);

  let pointingFromEarthToSun = new Vec3(
    Math.sin(TWO_PI * times.time),
    0,
    Math.cos(TWO_PI * times.time),
  );

  const tilt =
    23.5 * Math.cos((TWO_PI * (times.dayOfYear - 173)) / times.daysInYear);

  const seasonOffset = new Vec3(0, Math.tan(TWO_PI * (tilt / 360)), 0);

  pointingFromEarthToSun = pointingFromEarthToSun.add(seasonOffset);
  pointingFromEarthToSun = pointingFromEarthToSun.normalize();

  return {
    tilt,
    seasonOffset,
    pointingFromEarthToSun,
  };
}

