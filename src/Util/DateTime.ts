import { DateTime as DT, Duration } from 'luxon';

export const DateHour = (date: any) => date.toFormat('HH:mm');

export const NowMS = () => String(Date.now());

export const NowHour = () => DT.now().setZone('local').toFormat('HH:mm');

export const ToHour = (date: number) => DT.fromMillis(date).toFormat('HH:mm');

export const NowSinceHour = (time: string) => {
  const diff = DT.now().diff(DT.fromMillis(Number(time)));
  // Create a Duration object from the difference
  const duration = Duration.fromMillis(diff.as('milliseconds'));
  // Format the duration in hours and minutes
  // Note: Luxon doesn't directly support formatting Duration objects like DateTime objects
  // You need to manually extract the hours and minutes
  const hours = Math.floor(duration.as('hours'));
  const minutes = duration.as('minutes') % 60;
  return `${hours.toString().padStart(2, '0')}:${Math.floor(minutes)
    .toString()
    .padStart(2, '0')}`;
};

// export const DateDay = (date: number) =>
//   DT.fromMillis(date).toFormat('MM/dd/yyyy');

export const DateDay = (date: number) => new Date(date).toLocaleDateString();
