import React, { useMemo } from 'react';
import newGithubIssueUrl from 'new-github-issue-url';
import { OutButton, RestartButton } from './Buttons';

const buildTitle = error => `Error Report: ${error.message}`;

const buildBody = error => `\n
<!-- Thanks for submitting this error! Can you help us identify the issue by providing additional context? -->
\n
## Context
\n
<!-- 1) What were you doing when you encountered this error? -->
\n
<!-- 2) Only if relevant (don't self-dox!), what point were you interacting with? -->
\n
## Error\n\n
\`\`\`
${error.stack}
\`\`\`
\n
`;

/**
 * NOTE: we want to use as few normal components here as possible, since the
 * error might have originated from within those components, making this
 * whole error boundary useless.
 */
export default function GlobalErrorBoundary({ error }) {
  const url = useMemo(
    () =>
      newGithubIssueUrl({
        user: 'urbit',
        repo: 'bridge',
        labels: ['bug', 'error handling'],
        title: buildTitle(error),
        body: buildBody(error),
      }),
    [error]
  );

  return (
    <div className="mw1 ph4">
      <h2 className="mt8">
        Bridge Error!{' '}
        <span role="img" aria-label="a bridge on fire">
          🌉🔥
        </span>
      </h2>
      <p className="mt4 f5">
        We caught an error thrown by the Bridge application client-side code.
        <br />
        <b>Your points and assets are most likely safe.</b>
      </p>
      <p className="mt4">
        If you'd like to help us make Bridge better, you can submit the error
        and your description of events to our GitHub issue tracker.
      </p>
      <OutButton href={url} solid>
        Submit the Issue on GitHub
      </OutButton>
      <pre className="bg-gray1 mt4 p4 mono scroll-x">{error.stack}</pre>
      <p className="mt4">
        You can reload Bridge and retry the operation that caused an error. If
        the error persists, please submit a bug report and we'll work with you
        to resolve it!
      </p>
      <RestartButton onClick={() => document.location.reload()} solid success>
        Reload Bridge
      </RestartButton>
    </div>
  );
}
