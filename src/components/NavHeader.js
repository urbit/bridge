import React from 'react';
import { createTeleporter } from 'react-teleporter';

const NavHeaderTeleporter = createTeleporter();

const NavHeader = NavHeaderTeleporter.Source;
NavHeader.Target = props => <NavHeaderTeleporter.Target as="div" {...props} />;

export default NavHeader;
