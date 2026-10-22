import { en } from '../i18n/en';

export function issueTypeLabel(type: number): string {
  switch (type) {
    case 1:
      return en.issues.video;
    case 2:
      return en.issues.audio;
    case 3:
      return en.issues.subtitles;
    case 4:
      return en.issues.other;
    default:
      return en.status.unknown;
  }
}

export function issueStatusLabel(status: number): string {
  switch (status) {
    case 1:
      return en.issues.open;
    case 2:
      return en.issues.resolved;
    default:
      return en.status.unknown;
  }
}
