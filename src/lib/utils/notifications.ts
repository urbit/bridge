export const showNotification = (message: string) => {
  if (Notification?.permission === 'granted') {
    new Notification(message);
  }
};
