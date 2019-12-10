import { useEffect } from 'react';

function onBeforeUnload(e) {
  e.preventDefault();

  e.returnValue = '';
}

export default function useBlockWindowClose() {
  return useEffect(() => {
    window.addEventListener('beforeunload', onBeforeUnload);

    return function cleanup() {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  });
}
