(() => {
  'use strict';
  const status = document.querySelector('#connection-message');
  const installButton = document.querySelector('#install-button');
  let installPrompt;
  function updateConnection() {
    status.textContent = navigator.onLine ? '' : '目前離線：可查看網頁介面，但讀取清單及送出報修需要網路。未送出的內容不會自動保存或補送。';
    status.className = navigator.onLine ? 'message' : 'message error';
  }
  window.addEventListener('online', updateConnection);
  window.addEventListener('offline', updateConnection);
  updateConnection();
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    const prompt = installPrompt;
    installPrompt = null;
    installButton.hidden = true;
    try { await prompt.prompt(); await prompt.userChoice; } catch { /* 可使用瀏覽器的安裝選單 */ }
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.hidden = true;
  });
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {
        if (navigator.onLine) status.textContent = '離線功能尚未準備好，請連線後重新整理；仍可在線上使用報修功能。';
      });
    });
  }
})();
