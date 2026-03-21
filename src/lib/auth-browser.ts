export type GoogleAuthMethod = 'popup' | 'redirect';

function getUserAgent() {
  if (typeof navigator === 'undefined') {
    return '';
  }

  return navigator.userAgent.toLowerCase();
}

export function isFirefoxBrowser() {
  const userAgent = getUserAgent();
  return userAgent.includes('firefox') || userAgent.includes('fxios');
}

export function isChromiumBrowser() {
  const userAgent = getUserAgent();
  const hasChromiumEngine =
    userAgent.includes('chrome')
    || userAgent.includes('chromium')
    || userAgent.includes('crios')
    || userAgent.includes('edg')
    || userAgent.includes('opr')
    || userAgent.includes('opera')
    || userAgent.includes('brave');

  return hasChromiumEngine && !isFirefoxBrowser();
}

export function isSafariBrowser() {
  const userAgent = getUserAgent();
  return userAgent.includes('safari') && !isChromiumBrowser() && !isFirefoxBrowser();
}

export function isMobileBrowser() {
  const userAgent = getUserAgent();
  return userAgent.includes('android')
    || userAgent.includes('iphone')
    || userAgent.includes('ipad')
    || userAgent.includes('ipod');
}

export function getGoogleAuthMethod(): GoogleAuthMethod {
  if (isFirefoxBrowser() || isSafariBrowser() || isMobileBrowser()) {
    return 'redirect';
  }

  return 'popup';
}

export function supportsGoogleOneTap() {
  return isChromiumBrowser() && !isMobileBrowser();
}

export function shouldFallbackToRedirect(error: unknown) {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const code = String(error.code);

  return code === 'auth/popup-blocked'
    || code === 'auth/popup-closed-by-user'
    || code === 'auth/cancelled-popup-request'
    || code === 'auth/web-storage-unsupported'
    || code === 'auth/operation-not-supported-in-this-environment';
}
