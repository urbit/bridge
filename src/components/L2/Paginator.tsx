import { Row, Box, Icon } from '@tlon/indigo-react';

import './Paginator.scss';

export interface PaginatorProps {
  numElements: number;
  numPerPage: number;
  page: number;
  goPrevious: () => void;
  goNext: () => void;
}

const Paginator = ({
  numElements,
  numPerPage,
  page,
  goPrevious,
  goNext,
}: PaginatorProps) => {
  const numPages = Math.ceil(numElements / numPerPage);

  return (
    <Row className="paginator">
      <Box className="chevron-button">
        {page > 0 && (
          <Icon icon="ChevronWest" className="previous" onClick={goPrevious} />
        )}
      </Box>
      <Box className="info">
        {page + 1} of {numPages}
      </Box>
      <Box className="chevron-button">
        {page + 1 < numPages && (
          <Icon icon="ChevronEast" className="next" onClick={goNext} />
        )}
      </Box>
    </Row>
  );
};

export default Paginator;
