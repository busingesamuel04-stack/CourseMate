export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[CourseMate PWA] Service Worker active with scope:', registration.scope);
        })
        .catch((error) => {
          console.warn('[CourseMate PWA] Service Worker registration failed:', error);
        });
    });
  }
}
