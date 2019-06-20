import React, { Children } from 'react';
import { createPortal } from 'react-dom';

const kFooterPortalId = 'footer-portal';

function Footer({ children }) {
  return createPortal(
    Children.only(children),
    document.getElementById(kFooterPortalId)
  );
}

Footer.Portal = function FooterPortal(props) {
  return <div {...props} id={kFooterPortalId} />;
};

export default Footer;
