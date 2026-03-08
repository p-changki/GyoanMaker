export class IllustrationJobNotFoundError extends Error {
  readonly code = "ILLUSTRATION_JOB_NOT_FOUND";
  constructor(jobId: string) {
    super(`Illustration job not found: ${jobId}`);
    this.name = "IllustrationJobNotFoundError";
  }
}

export class IllustrationPolicyBlockedError extends Error {
  readonly code = "ILLUSTRATION_POLICY_BLOCKED";
  readonly keyword: string;
  constructor(keyword: string) {
    super(`Illustration prompt is blocked by policy keyword: ${keyword}`);
    this.name = "IllustrationPolicyBlockedError";
    this.keyword = keyword;
  }
}

export class IllustrationJobConflictError extends Error {
  readonly code = "ILLUSTRATION_JOB_IN_PROGRESS";
  readonly jobId: string;
  constructor(jobId: string) {
    super(`Another illustration job is already running for this handout: ${jobId}`);
    this.name = "IllustrationJobConflictError";
    this.jobId = jobId;
  }
}
