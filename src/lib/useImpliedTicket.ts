import ob from 'urbit-ob';
import { ensurePatFormat, ensureSigPrefix } from 'form/formatters';

/**
 * pull the implied ticket and point from the #hash in the url
 */
// e.g., https://bridge.urbit.org/#widweb-tipfep-sabnux-nispec-sampel-palnet

// Example tickets:
// ~widweb-tipfep-sabnux-nispec

// Example tickets + points (Activation Flow):
// ~widweb-tipfep-sabnux-nispec-sampel
// ~widweb-tipfep-sabnux-nispec-sampel-palnet
const VALID_TICKET_REGEX = /^~(?:[[a-z]{6}-){3}[a-z]{6}/;
const VALID_TICKET_AND_POINT_REGEX = /^~([a-z]{6}-){4}([a-z-]{6,13})/;
const CAPTURE_TICKET_REGEX = /^~((?:[[a-z]{6}-){3}[a-z]{6})/;
const CAPTURE_POINT_REGEX = /^~(?:(?:[[a-z]{6}-){3}[a-z]{6}-{1})([a-z-]{6,13})/;

export default function useImpliedTicket() {
  const hash = window.location.hash.slice(1);
  const pat = ensurePatFormat(hash);
  const impliedTicket = VALID_TICKET_REGEX.test(pat)
    ? pat.match(CAPTURE_TICKET_REGEX)![0]
    : null;

  const impliedPoint = VALID_TICKET_AND_POINT_REGEX.test(pat)
    ? ensureSigPrefix(pat.match(CAPTURE_POINT_REGEX)![1])
    : null;

  return {
    impliedPoint:
      impliedPoint && ob.isValidPatq(impliedPoint) ? impliedPoint : null,
    impliedTicket:
      impliedTicket && ob.isValidPatq(impliedTicket) ? impliedTicket : null,
  };
}
