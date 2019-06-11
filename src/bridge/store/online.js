import React, { useContext, useEffect, useState } from 'react';

function _useOnline() {
  const [online, setOnline] = useState(window.navigator.onLine);

  useEffect(() => {
    function handleOnlineStatus(event) {
      setOnline(window.navigator.onLine);
    }

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return online;
}

const OnlineContext = React.createContext(null);

// provider
export function OnlineProvider({ children }) {
  const online = _useOnline();
  return (
    <OnlineContext.Provider value={online}>{children}</OnlineContext.Provider>
  );
}

// hook consumer
export function useOnline() {
  return useContext(OnlineContext);
}

// hoc consumer
export const withOnline = Component =>
  React.forwardRef((props, ref) => {
    return (
      <OnlineContext.Consumer>
        {online => <Component ref={ref} online={online} {...props} />}
      </OnlineContext.Consumer>
    );
  });
