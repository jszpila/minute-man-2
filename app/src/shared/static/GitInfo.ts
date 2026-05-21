interface GitInfoType {
  sha: string;
  date: string;
}

declare const __GIT_SHA__: string | undefined;
declare const __GIT_DATE__: string | undefined;

const GitInfo: GitInfoType = {
  sha: typeof __GIT_SHA__ === 'string' ? __GIT_SHA__ : 'dev',
  date: typeof __GIT_DATE__ === 'string' ? __GIT_DATE__ : 'dev',
};

export default GitInfo;
