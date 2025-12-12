import { useEffect, useState } from 'react';

export function useBrowser() {
  const [browser, setBrowser] = useState<{
    name: 'chrome' | 'brave' | 'safari' | 'firefox' | 'edge' | 'other';
    isChromium: boolean;
  } | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    const vendor = navigator.vendor ?? '';

    const isChromium = !!(window as any).chrome;
    const isBrave = !!(navigator as any).brave;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isFirefox = /Firefox/.test(ua);
    const isEdge = /Edg/.test(ua);
    const isChrome = isChromium && !isBrave && !isEdge && /Chrome/.test(ua);

    let name: typeof browser['name'] = 'other';
    if (isBrave) name = 'brave';
    else if (isChrome) name = 'chrome';
    else if (isSafari) name = 'safari';
    else if (isFirefox) name = 'firefox';
    else if (isEdge) name = 'edge';

    setBrowser({ name, isChromium });
  }, []);

  return browser;
}

