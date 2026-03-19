import type { JieqiState } from './types';
import { JIEQI_TERMS } from './jieqi-data';

export function solarLongitude(date: Date): number {
  const JD = dateToJD(date);
  const T = (JD - 2451545.0) / 36525;
  const M = (357.5291 + 35999.0503 * T) % 360;
  const Mrad = (M * Math.PI) / 180;
  const C = 1.9146 * Math.sin(Mrad) + 0.02 * Math.sin(2 * Mrad);
  const omega = 280.4665 + 36000.7698 * T;
  let lambda = (omega + C) % 360;
  if (lambda < 0) lambda += 360;
  return lambda;
}

function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    date.getUTCHours() / 24 +
    date.getUTCMinutes() / 1440;
  let Y = y,
    M = m;
  if (M <= 2) {
    Y -= 1;
    M += 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (Y + 4716)) +
    Math.floor(30.6001 * (M + 1)) +
    d +
    B -
    1524.5
  );
}

export function computeJieqiState(date: Date = new Date()): JieqiState {
  const lambda = solarLongitude(date);

  let currentIdx = 0;
  for (let i = 0; i < JIEQI_TERMS.length; i++) {
    const normLambda = (lambda - 315 + 360) % 360;
    const normTerm = (JIEQI_TERMS[i].longitude - 315 + 360) % 360;
    if (normLambda >= normTerm) {
      currentIdx = i;
    }
  }

  const nextIdx = (currentIdx + 1) % JIEQI_TERMS.length;
  const current = JIEQI_TERMS[currentIdx];
  const next = JIEQI_TERMS[nextIdx];

  const nextLon = next.longitude;
  let degToNext = (nextLon - lambda + 360) % 360;
  if (degToNext === 0) degToNext = 360;

  const daysToNext = degToNext / 0.9856;
  const secondsToNext = Math.round(daysToNext * 86400);
  const nextTransitionAt = new Date(
    date.getTime() + secondsToNext * 1000,
  ).toISOString();
  const isTransitionWindow = secondsToNext < 48 * 3600;

  return { current, next, nextTransitionAt, secondsToNext, isTransitionWindow };
}
