import React, { useCallback, useMemo, useState } from 'react';
import cn from 'classnames';
import { Grid, Text, Input, P, LinkButton } from 'indigo-react';
import * as azimuth from 'azimuth-js';
import ob from 'urbit-ob';

import { useNetwork } from 'store/network';
import { usePointCache } from 'store/pointCache';
import { usePointCursor } from 'store/pointCursor';

import * as need from 'lib/need';
import useEthereumTransaction from 'lib/useEthereumTransaction';
import { GAS_LIMITS } from 'lib/constants';
import patp2dec from 'lib/patp2dec';
import { getSpawnCandidate } from 'lib/child';
import { useLocalRouter } from 'lib/LocalRouter';
import useConstant from 'lib/useConstant';

import { keccak256 } from 'lib/wallet';

import ViewHeader from 'components/ViewHeader';
import InlineEthereumTransaction from 'components/InlineEthereumTransaction';
import View from 'components/View';
import { PointInput, AddressInput } from 'form/Inputs';
import {
  composeValidator,
  buildPointValidator,
  buildAddressValidator,
  hasErrors,
} from 'form/validators';
import BridgeForm from 'form/BridgeForm';
import FormError from 'form/FormError';
import CopiableAddress from 'components/CopiableAddress';
import convertToInt from 'lib/convertToInt';

function useCastDocumentVote() {
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();
  const { syncDetails } = usePointCache();

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

export default function Senate() {
  const { pop } = useLocalRouter();
  const { contracts } = useNetwork();
  const { pointCursor } = usePointCursor();

  const _contracts = need.contracts(contracts);
  const _point = convertToInt(need.point(pointCursor), 10);

  const {
    construct,
    unconstruct,
    inputsLocked,
    completed,
    bind,
  } = useCastDocumentVote();

  const [documentHash, setDocumentHash] = useState('0x...');
  const [majorities, setMajorities] = useState([]); //TODO gh.com/proposals/doc.txt
  const [proposals, setProposals] = useState([]);
  const [polls, setPolls] = useState({});
  const [loading, setLoading] = useState(true);
  const [votingOn, setVotingOn] = useState(null);

  //TODO update every second?
  const now = Math.round(new Date().getTime() / 1000);

  useMemo(async () => {
    let proposals = await azimuth.polls.getDocumentProposals(_contracts);
    let majorities = await azimuth.polls.getDocumentMajorities(_contracts);
    let polls = {};
    for (let doc of proposals) {
      let poll = await azimuth.polls.getDocumentPoll(_contracts, doc);
      console.log('got poll', doc, poll);
      poll.endTime = polls.start + poll.duration;
      poll.hasVoted = await azimuth.polls.hasVotedOnDocumentPoll(
        _contracts,
        _point,
        doc
      );
      polls[doc] = poll;
    }
    setMajorities(majorities);
    setProposals(proposals);
    console.log('setting polls', polls);
    setPolls(polls);
    setLoading(false);
    return;
  }, [_contracts]);

  const [open, closed] = useMemo(() => {
    let open = [];
    let closed = [];
    if (loading) return [open, closed];
    console.log('proposals', proposals);
    console.log('polls', polls);
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
      setVotingOn(hash);
    },
    [construct, setVotingOn]
  );

  const didVote = useCallback(() => {
    polls[votingOn].hasVoted = true;
    setPolls(polls);
  }, [polls, setPolls, votingOn]);

  const majorityList = useMemo(() => {
    return majorities.map(doc => {
      return (
        <Text>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://github.com/urbit/azimuth/blob/master/proposals/${doc}.txt`}>
            <code>{doc}</code>
          </a>
        </Text>
      );
    });
  }, [majorities]);

  const openList = useMemo(() => {
    return open.map(doc => {
      const hasVoted = polls[doc].hasVoted;
      return (
        <>
          <Grid.Item full as={Text}>
            <P>
              <code>{doc}</code>
            </P>
            <P>
              {hasVoted ? (
                'Your vote has been cast.'
              ) : (
                <>
                  <LinkButton onClick={() => doVote(doc, true)}>aye</LinkButton>
                  {' / '}
                  <LinkButton onClick={() => doVote(doc, false)}>
                    nay
                  </LinkButton>
                </>
              )}
            </P>
          </Grid.Item>
          <Grid.Divider />
        </>
      );
    });
  }, [open, polls]);

  const onDocumentChange = useCallback(({ valid, values }) => {
    if (values.document) {
      const hash = '0x' + keccak256(values.document.trim()).toString('hex');
      setDocumentHash(hash);
    } else {
      setDocumentHash('0x...');
    }
  }, []);

  return (
    <View pop={pop} inset>
      <Grid>
        <Grid.Item full as={ViewHeader}>
          Senate: Document Proposals
        </Grid.Item>

        <Grid.Item full as={P}>
          Accepted documents:
          {majorityList}
        </Grid.Item>

        <Grid>
          <Grid.Item full as={P}>
            Open document polls:
          </Grid.Item>
          {openList}
        </Grid>

        <BridgeForm onValues={onDocumentChange}>
          {({ onSubmit, values }) => (
            <>
              <Grid.Item
                full
                as={InlineEthereumTransaction}
                {...bind}
                onReturn={didVote}
              />

              <Grid.Divider />

              <Grid.Item
                full
                as={Input}
                type="textarea"
                placeholder="Input some text to find its hash..."
                name="document"
                className="mt4"
              />

              <Grid.Item full as={CopiableAddress}>
                {documentHash}
              </Grid.Item>
            </>
          )}
        </BridgeForm>
      </Grid>
    </View>
  );
}
