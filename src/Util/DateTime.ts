import { DateTime as DT, Duration } from 'luxon';

export const DateHour = (date: any) => date.toFormat('HH:mm');

export const NowMS = () => String(Date.now());

export const NowHour = () => DT.now().toFormat('HH:mm');

export const ToHour = (date: number) => DT.fromMillis(date).toFormat('HH:mm');

export const NowSinceHour = (time: string) => {
  const diff = DT.now().diff(DT.fromMillis(Number(time)));
  const duration = Duration.fromMillis(diff.as('milliseconds'));
  const hours = Math.floor(duration.as('hours'));
  const minutes = duration.as('minutes') % 60;
  return `${hours.toString().padStart(2, '0')}:${Math.floor(minutes)
    .toString()
    .padStart(2, '0')}`;
};

// export const DateDay = (date: number) =>
//   DT.fromMillis(date).toFormat('MM/dd/yyyy');

export const DateDay = (date: number) => new Date(date).toLocaleDateString();

export const startOfDay = DT.now().startOf('day');

export const HHMMDDYY = (date: number) =>
  DT.fromMillis(date).toFormat('HH:mm MM/dd/yyyy');

export const HHMM = (date: number) => DT.fromMillis(date).toFormat('HH:mm');

export const OneMonthAgo = () => DT.now().minus({ months: 1 }).toMillis();
