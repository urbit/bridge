import React from 'react';
import { createTeleporter } from 'react-teleporter';

const FooterTeleporter = createTeleporter();

const Footer = FooterTeleporter.Source;
Footer.Target = props => <FooterTeleporter.Target as="footer" {...props} />;

export default Footer;
