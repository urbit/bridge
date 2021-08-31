import React from 'react';
import { Box, Icon, Row } from '@tlon/indigo-react';

import './Card.scss';

export interface CardProps {
  icon?: typeof Icon;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  children: any[];
}

export default function Card({
  icon,
  title,
  subtitle,
  onClick,
  children,
}: CardProps) {
  return (
    <Box className="card" onClick={onClick}>
      {(!!icon || !!title) && (
        <Row>
          {!!icon && icon}
          {!!title && <div className="card-title">{title}</div>}
        </Row>
      )}
      {!!subtitle && <div className="card-subtitle">{subtitle}</div>}
      {children}
    </Box>
  );
}
