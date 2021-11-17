import React from 'react';
import { Box, Icon, Row } from '@tlon/indigo-react';

import './Card.scss';

export interface CardProps {
  icon?: typeof Icon;
  title?: string;
  subtitle?: string;
  warning?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function Card({
  icon,
  title,
  subtitle,
  warning,
  onClick,
  children,
  disabled = false,
}: CardProps) {
  return (
    <Box className="card" onClick={disabled ? undefined : onClick}>
      {(!!icon || !!title) && (
        <Row>
          {!!icon && icon}
          {!!title && <Box className="card-title">{title}</Box>}
        </Row>
      )}
      {!!subtitle && <Box className="card-subtitle">{subtitle}</Box>}
      {children}
      {!!warning && (
        <Row className="card-warning">
          <Icon icon="ExclaimationMark" color="white" />
          <Box>{warning}</Box>
        </Row>
      )}
    </Box>
  );
}
