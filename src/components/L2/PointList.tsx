import React from 'react';
import { Just } from 'folktale/maybe';

import { useHistory } from 'store/history';
import { usePointCursor } from 'store/pointCursor';
import Point from 'lib/types/Point';

import { Grid, Flex } from 'indigo-react';
import Passport from 'components/Passport';
import PermissionIndicator from './PermissionIndicator';

interface PointListProps {
  points: Point[];
  className?: string;
  actions?: (point: Point, i: number) => React.Component;
  locked?: boolean;
  processing?: boolean;
}

const PointList: React.FC<PointListProps> = function({
  points,
  className,
  actions,
  locked = false,
  processing = false,
  ...rest
}) {
  const { setPointCursor }: any = usePointCursor();
  const { push, names }: any = useHistory();

  return (
    <Grid asFlex gap={4} className={`${className} flex-row flex-wrap`}>
      {points.map((point, i) => (
        <Grid.Item
          key={point.value}
          className={`fourth-${(i % 4) + 1}-md fourth-${(i % 4) + 1}-lg`}>
          <Flex col className="rel">
            <Passport.Mini
              locked={locked}
              processing={processing}
              point={point.value}
              onClick={
                locked || processing
                  ? undefined
                  : () => {
                      setPointCursor(Just(point.value));
                      push(names.POINT);
                    }
              }
              {...rest}
            />
            {actions && (
              <Flex.Item className="mt2">{actions(point, i)}</Flex.Item>
            )}
            {!locked && (
              <PermissionIndicator permission={point.permissionLevel} />
            )}
          </Flex>
        </Grid.Item>
      ))}
    </Grid>
  );
};

export default PointList;
