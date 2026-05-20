import GitInfo from '../static/GitInfo';
import packageJson from '../../../package.json';

export const formatBuildDate = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return date;
  }

  const [, year, month, day] = match;
  return `${month}/${day}/${year.slice(-2)}`;
};

export const getDiagnosticsVersionInfo = (): string => {
  return `v${packageJson.version} (${GitInfo.sha}, ${formatBuildDate(GitInfo.date)})`;
};
