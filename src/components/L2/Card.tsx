import React from 'react';
import { Box, Icon, Row } from '@tlon/indigo-react';

import './Card.scss';

export interface CardProps {
  icon?: typeof Icon;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  children: React.ReactNode;
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
          {!!title && <Box className="card-title">{title}</Box>}
        </Row>
      )}
      {!!subtitle && <Box className="card-subtitle">{subtitle}</Box>}
      {children}
    </Box>
  );
}
