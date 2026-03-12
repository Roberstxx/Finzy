export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) {
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.error('No se pudo registrar el service worker.', error);
    });
  });
};

export const isStandaloneDisplayMode = () => {
  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(standaloneNavigator.standalone)
  );
};

export const isTouchDevice = () =>
  window.matchMedia('(pointer: coarse)').matches ||
  navigator.maxTouchPoints > 0;

export const isIosSafari = () => {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

  return isIos && isSafari;
};
