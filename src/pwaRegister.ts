export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const doRegister = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[CourseMate PWA] Service Worker active with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[CourseMate PWA] Service Worker registration failed:', error);
        });
    };

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      doRegister();
    } else {
      window.addEventListener('load', doRegister);
    }
  }
}
