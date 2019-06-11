import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
} from 'react';

export const ONLINE_STATUS = {
  ONLINE: Symbol('ONLINE'),
  OFFLINE: Symbol('OFFLINE'),
  UNKNOWN: Symbol('UNKNOWN'),
};

const getNetworkState = () => {
  if ('onLine' in navigator) {
    return navigator.onLine ? ONLINE_STATUS.ONLINE : ONLINE_STATUS.OFFLINE;
  }

  return ONLINE_STATUS.UNKNOWN;
};

function _useOnline() {
  const [online, setOnline] = useState(getNetworkState());

  useEffect(() => {
    function handleOnlineStatus(event) {
      setOnline(getNetworkState());
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

const OnlineContext = createContext(null);

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
  forwardRef((props, ref) => {
    return (
      <OnlineContext.Consumer>
        {online => <Component ref={ref} online={online} {...props} />}
      </OnlineContext.Consumer>
    );
  });
