import React, { useCallback, useMemo, useState } from 'react';
import { Grid, Text, P, LinkButton } from 'indigo-react';
import * as azimuth from 'azimuth-js';

import { useNetwork } from 'store/network';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import { useLocalRouter } from 'lib/LocalRouter';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import BridgeForm from 'form/BridgeForm';
import convertToInt from 'lib/convertToInt';

function useCastDocumentVote() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = need.point(pointCursor);

  return useEthereumTransaction(
    useCallback(
      (hash, accept) => {
        return azimuth.ecliptic.castDocumentVote(
          _contracts,
          _point,
          hash,
          accept
        );
      },
      [_contracts, _point]
    ),
    useCallback(() => null, []), //TODO update polls[hash].hasVoted ?
    GAS_LIMITS.DEFAULT //TODO update once we have a decent sample size
  );
}

function renderDocumentHash(doc) {
  return doc.slice(0, 34) + '\n  ' + doc.slice(34);
}

export default function Documents() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);

  const { construct, bind } = useCastDocumentVote();

  // const [documentHash, setDocumentHash] = useState('0x...');
  const [majorities, setMajorities] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [polls, setPolls] = useState({});
  const [loading, setLoading] = useState(true);
  const [votingOn, setVotingOn] = useState({});

  //TODO update every second?
  const now = Math.round(new Date().getTime() / 1000);

  useMemo(async () => {
    let proposals = await azimuth.polls.getDocumentProposals(_contracts);
    let majorities = await azimuth.polls.getDocumentMajorities(_contracts);
    let polls = {};
    for (let doc of proposals) {
      let poll = await azimuth.polls.getDocumentPoll(_contracts, doc);
      poll.endTime = convertToInt(poll.start) + convertToInt(poll.duration);
      poll.hasVoted = await azimuth.polls.hasVotedOnDocumentPoll(
        _contracts,
        _point,
        doc
      );
      polls[doc] = poll;
    }
    setMajorities(majorities);
    setProposals(proposals);
    setPolls(polls);
    setLoading(false);
    return;
  }, [_contracts, _point]);

  // eslint-disable-next-line
  const [open, closed] = useMemo(() => {
    let open = [];
    let closed = [];
    if (loading) return [open, closed];
    for (let doc of proposals) {
      if (now > polls[doc].endTime) {
        closed.push(doc);
      } else {
        open.push(doc);
      }
    }
    return [open, closed];
  }, [loading, proposals, polls, now]);

  const doVote = useCallback(
    (hash, accept) => {
      construct(hash, accept);
      setVotingOn({ hash, accept });
    },
    [construct, setVotingOn]
  );

  const didVote = useCallback(() => {
    polls[votingOn].hasVoted = true;
    setPolls(polls);
    setVotingOn({});
  }, [polls, setPolls, votingOn]);

  const majorityList = useMemo(() => {
    return majorities.map(doc => {
      return (
        <Grid.Item full className="mv2" as={P}>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://raw.githubusercontent.com/urbit/azimuth/master/proposals/${doc}.txt`}
            class="mb4 mono wrap pre">
            {renderDocumentHash(doc)}↗
          </a>
        </Grid.Item>
      );
    });
  }, [majorities]);

  const openList = useMemo(() => {
    return open.map(doc => {
      const hasVoted = polls[doc].hasVoted;
      return (
        <>
          <Grid.Item full className="mv2" as={Text}>
            <P className="m0 mono wrap pre">{renderDocumentHash(doc)}</P>
            <P className="mt0">
              {hasVoted ? (
                'Your vote has been cast.'
              ) : (
                <>
                  <LinkButton onClick={() => doVote(doc, true)}>
                    {votingOn.hash === doc && votingOn.accept ? (
                      <b>support</b>
                    ) : (
                      <>support</>
                    )}
                  </LinkButton>
                  {' / '}
                  <LinkButton onClick={() => doVote(doc, false)}>
                    {votingOn.hash === doc && !votingOn.accept ? (
                      <b>reject</b>
                    ) : (
                      <>reject</>
                    )}
                  </LinkButton>
                </>
              )}
            </P>
          </Grid.Item>
          <Grid.Divider />
        </>
      );
    });
  }, [open, polls, votingOn, doVote]);

  const onDocumentChange = useCallback(({ valid, values }) => {
    // if (values.document) {
    //   const hash = '0x' + keccak256(values.document.trim()).toString('hex');
    //   setDocumentHash(hash);
    // } else {
    //   setDocumentHash('0x...');
    // }
  }, []);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Senate: Document Proposals
        </Grid.Item>

        <Grid.Item full as={Grid}>
          <Grid.Item full as={P}>
            Accepted documents:
          </Grid.Item>
          {majorityList}
        </Grid.Item>

        {openList.length > 0 && (
          <>
            <Grid.Divider className="mv4" />

            <Grid.Item full as={Grid}>
              <Grid.Item full as={P}>
                Open document polls:
              </Grid.Item>
              {openList}
            </Grid.Item>

            <BridgeForm onValues={onDocumentChange}>
              {({ onSubmit, values }) => (
                // <>
                <Grid.Item
                  full
                  as={InlineEthereumTransaction}
                  {...bind}
                  onReturn={didVote}
                />
              )}
            </BridgeForm>
          </>
        )}
      </Grid>
    </View>
  );
}
