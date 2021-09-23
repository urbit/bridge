import useImpliedTicket from './useImpliedTicket';

describe('#useImpliedTicket', () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
  });

  afterAll(() => {
    window.location = location;
  });

  describe('when hash is not present in URL', () => {
    it('returns null', () => {
      const input = '';
      window.location = { hash: input };

      const {
        impliedAzimuthPoint,
        impliedPatp,
        impliedTicket,
      } = useImpliedTicket();
      expect(impliedAzimuthPoint).toEqual(null);
      expect(impliedPatp).toEqual(null);
      expect(impliedTicket).toEqual(null);
    });
  });

  describe('when hash is just a ticket', () => {
    it('parses the ticket, returns null point', () => {
      const input = '#widweb-tipfep-sabnux-nispec';
      window.location = { hash: input };

      const {
        impliedAzimuthPoint,
        impliedPatp,
        impliedTicket,
      } = useImpliedTicket();
      expect(impliedAzimuthPoint).toEqual(null);
      expect(impliedPatp).toEqual(null);
      expect(impliedTicket).toEqual('~widweb-tipfep-sabnux-nispec');
    });
  });

  describe('when hash has both ticket and star point', () => {
    it('parses the ticket, returns null point', () => {
      const input = '#widweb-tipfep-sabnux-nispec-sampel';
      window.location = { hash: input };

      const {
        impliedAzimuthPoint,
        impliedPatp,
        impliedTicket,
      } = useImpliedTicket();
      expect(impliedAzimuthPoint).toEqual(1135);
      expect(impliedPatp).toBe('~sampel');
      expect(impliedTicket).toEqual('~widweb-tipfep-sabnux-nispec');
    });
  });

  describe('when hash has both ticket and planet point', () => {
    it('parses both ticket and point', () => {
      const input = '#widweb-tipfep-sabnux-nispec-sampel-palnet';
      window.location = { hash: input };

      const {
        impliedAzimuthPoint,
        impliedPatp,
        impliedTicket,
      } = useImpliedTicket();
      expect(impliedAzimuthPoint).toEqual(1624961343);
      expect(impliedPatp).toBe('~sampel-palnet');
      expect(impliedTicket).toEqual('~widweb-tipfep-sabnux-nispec');
    });
  });
});
