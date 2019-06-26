import { createTeleporter } from 'react-teleporter';

const FooterTeleporter = createTeleporter();

const Footer = FooterTeleporter.Source;
Footer.Target = FooterTeleporter.Target;

export default Footer;
