import { ensurePatFormat } from './formatters';

describe('#ensurePatFormat', () => {
  it('ensures a valid ticket', () => {
    const input = '~ticket-ticket-ticket-ticket';
    const expected = '~ticket-ticket-ticket-ticket';

    expect(ensurePatFormat(input)).toEqual(expected);
  });

  it('prepends a ~ when missing', () => {
    const input = 'ticket-ticket-ticket-ticket';
    const expected = '~ticket-ticket-ticket-ticket';

    expect(ensurePatFormat(input)).toEqual(expected);
  });

  it('inserts missing separators', () => {
    const input = 'ticketticketticketticket';
    const expected = '~ticket-ticket-ticket-ticket';

    expect(ensurePatFormat(input)).toEqual(expected);
  });

  it('handles uneven patp', () => {
    const input = 'ticket-ticket-tic';
    const expected = '~ticket-ticket-tic';

    expect(ensurePatFormat(input)).toEqual(expected);
  });

  it('supports master ticket + star combo for Activation flow', () => {
    const input = 'ticket-ticket-ticket-ticket-sampel';
    const expected = '~ticket-ticket-ticket-ticket-sampel';

    expect(ensurePatFormat(input)).toEqual(expected);
  });

  it('supports master ticket + planet combo for Activation flow', () => {
    const input = 'ticket-ticket-ticket-ticket-sampel-palnet';
    const expected = '~ticket-ticket-ticket-ticket-sampel-palnet';

    expect(ensurePatFormat(input)).toEqual(expected);
  });
});
