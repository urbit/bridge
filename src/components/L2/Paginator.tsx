import { Icon } from '@tlon/indigo-react';

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
    <div className="paginator">
      <div className="chevron-button">
        {page > 0 && (
          <Icon icon="ChevronWest" className="previous" onClick={goPrevious} />
        )}
      </div>
      <div className="info">
        {page + 1} of {numPages}
      </div>
      <div className="chevron-button">
        {page + 1 < numPages && (
          <Icon icon="ChevronEast" className="next" onClick={goNext} />
        )}
      </div>
    </div>
  );
};

export default Paginator;
