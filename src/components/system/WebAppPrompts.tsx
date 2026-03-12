import { useEffect, useState } from 'react';
import { Bell, Download, Share2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  isIosSafari,
  isStandaloneDisplayMode,
  isTouchDevice,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa';

const INSTALL_DISMISS_KEY = 'finzy.install.dismissed';
const NOTIFICATION_DISMISS_KEY = 'finzy.notifications.dismissed';

const WebAppPrompts = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [notificationDismissed, setNotificationDismissed] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [installing, setInstalling] = useState(false);
  const [requestingNotifications, setRequestingNotifications] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsStandalone(isStandaloneDisplayMode());
    setIsIos(isIosSafari());
    setIsTouch(isTouchDevice());
    setInstallDismissed(sessionStorage.getItem(INSTALL_DISMISS_KEY) === 'true');
    setNotificationDismissed(localStorage.getItem(NOTIFICATION_DISMISS_KEY) === 'true');

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const displayModeMedia = window.matchMedia('(display-mode: standalone)');
    const handleStandaloneChange = () => setIsStandalone(isStandaloneDisplayMode());
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
      setJustInstalled(true);
      sessionStorage.removeItem(INSTALL_DISMISS_KEY);
      setInstallDismissed(false);
      toast.success('Finzy ya se puede abrir como app.');
    };

    if ('addEventListener' in displayModeMedia) {
      displayModeMedia.addEventListener('change', handleStandaloneChange);
    } else {
      displayModeMedia.addListener(handleStandaloneChange);
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      if ('removeEventListener' in displayModeMedia) {
        displayModeMedia.removeEventListener('change', handleStandaloneChange);
      } else {
        displayModeMedia.removeListener(handleStandaloneChange);
      }
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const showInstallPrompt = !isStandalone && !installDismissed && (Boolean(deferredPrompt) || isIos);
  const canAskNotifications = isTouch && (isStandalone || justInstalled) && 'Notification' in window && 'serviceWorker' in navigator;
  const showNotificationPrompt =
    canAskNotifications &&
    notificationPermission === 'default' &&
    !notificationDismissed;

  const handleInstall = async () => {
    if (!deferredPrompt || installing) return;

    setInstalling(true);

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;

      if (choice.outcome === 'accepted') {
        toast.success('Instalacion iniciada.');
      }
    } finally {
      setDeferredPrompt(null);
      setInstalling(false);
    }
  };

  const dismissInstallPrompt = () => {
    sessionStorage.setItem(INSTALL_DISMISS_KEY, 'true');
    setInstallDismissed(true);
  };

  const dismissNotificationPrompt = () => {
    localStorage.setItem(NOTIFICATION_DISMISS_KEY, 'true');
    setNotificationDismissed(true);
  };

  const handleEnableNotifications = async () => {
    if (!canAskNotifications || requestingNotifications) return;

    setRequestingNotifications(true);

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        localStorage.removeItem(NOTIFICATION_DISMISS_KEY);
        setNotificationDismissed(true);

        const registration = await navigator.serviceWorker.ready;
        if ('showNotification' in registration) {
          await registration.showNotification('Notificaciones activadas', {
            body: 'Finzy ya puede mostrar avisos desde tu acceso directo.',
            icon: '/icons/icon-192.png',
            badge: '/icons/badge-72.png',
            data: { url: '/' },
            tag: 'finzy-notifications-enabled',
          });
        } else {
          new Notification('Notificaciones activadas', {
            body: 'Finzy ya puede mostrar avisos desde tu acceso directo.',
            icon: '/icons/icon-192.png',
          });
        }

        toast.success('Notificaciones activadas.');
        return;
      }

      if (permission === 'denied') {
        toast.error('Bloqueaste las notificaciones para esta app.');
        return;
      }

      toast('La activacion de notificaciones quedo pendiente.');
    } catch (error) {
      console.error(error);
      toast.error('No se pudo activar el permiso de notificaciones.');
    } finally {
      setRequestingNotifications(false);
    }
  };

  if (!showInstallPrompt && !showNotificationPrompt) {
    return null;
  }

  return (
    <div className="space-y-4 px-4 pt-4 md:px-8 md:pt-6">
      {showInstallPrompt && (
        <div className="page-surface overflow-hidden border-primary/20 bg-[linear-gradient(135deg,hsl(var(--card)),hsl(var(--secondary)/0.72))] p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                {isIos ? <Share2 size={20} /> : <Download size={20} />}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  {isIos ? 'Agrega Finzy a tu inicio' : 'Instala Finzy'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isIos
                    ? 'En Safari toca Compartir y luego Agregar a pantalla de inicio para usarla como app.'
                    : 'Abrela como una app independiente desde tu escritorio o pantalla de inicio.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {!isIos && (
                <button
                  onClick={() => void handleInstall()}
                  disabled={installing}
                  className="rounded-[20px] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {installing ? 'Preparando...' : 'Instalar app'}
                </button>
              )}
              <button
                onClick={dismissInstallPrompt}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Cerrar aviso de instalacion"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotificationPrompt && (
        <div className="page-surface overflow-hidden border-accent/25 bg-[linear-gradient(135deg,hsl(var(--card)),hsl(var(--accent)/0.12))] p-4 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/15 text-accent-foreground">
                <Bell size={20} />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">Activa notificaciones</p>
                <p className="text-sm text-muted-foreground">
                  Si usas Finzy como acceso directo en tu celular, podemos pedir permiso para mostrar avisos desde la app.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => void handleEnableNotifications()}
                disabled={requestingNotifications}
                className="rounded-[20px] bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {requestingNotifications ? 'Solicitando...' : 'Permitir'}
              </button>
              <button
                onClick={dismissNotificationPrompt}
                className="rounded-[20px] bg-background/80 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebAppPrompts;
