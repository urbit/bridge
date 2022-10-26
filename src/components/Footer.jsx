import React from 'react';
import { createTeleporter } from 'react-teleporter';

const FooterTeleporter = createTeleporter();

const Footer = FooterTeleporter.Source;

export const FooterTarget = props => (
  <FooterTeleporter.Target as="footer" {...props} />
);

export default Footer;
