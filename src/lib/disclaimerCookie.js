const COOKIE_ID = 'bridge_disclaimed';

export const hasDisclaimed = () => {
  return document.cookie.includes(COOKIE_ID);
};

export const setDisclaimerCookie = () => {
  document.cookie = COOKIE_ID;
};
