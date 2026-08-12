/* ============================================================
   Lunar Lander - in-app-browser install hint
   ------------------------------------------------------------
   When a link to the game is shared via a messaging/social app
   (WhatsApp, Facebook, Instagram, Telegram, ...) and the recipient
   taps it, the page opens inside that app's embedded "in-app
   browser". Those browsers hide the normal install path:
     - Android: `beforeinstallprompt` never fires, and there is no
       "Install app" menu item (it works fine in standalone Chrome).
     - iOS:     PWA install is always manual (Share -> Add to Home
       Screen) and that option only exists in real Safari.

   There is no way to install from inside an in-app browser, so the
   best we can do is detect the situation and nudge the player to
   open the page in their real system browser first, where install
   works as normal.

   Detection is User-Agent based. It is reliable on Android (social
   tokens + the "; wv)" Android WebView marker) and best-effort on
   iOS (in-app WKWebViews often drop the "Safari" UA token). Only
   mobile platforms are handled; desktop is ignored.
   ============================================================ */
(function () {
  var ua = navigator.userAgent || '';
  var uaLC = ua.toLowerCase();

  var isIOS = /iphone|ipad|ipod/.test(uaLC);
  var isAndroid = /android/.test(uaLC);
  if (!isIOS && !isAndroid) return; // install-blocking is a mobile-only problem

  // Already running standalone (launched from the home screen) -> nothing to do.
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return;
  if (window.navigator.standalone === true) return;

  // Samsung Internet is a real, standalone, installable browser - leave it be.
  if (/samsungbrowser/.test(uaLC)) return;

  // User dismissed the hint earlier this session - don't nag.
  try { if (sessionStorage.getItem('ll_inapp_dismissed') === '1') return; } catch (e) {}

  // Known messaging / social in-app browser tokens.
  var socialTokens = [
    'whatsapp', 'fban', 'fbav', 'fb_iab', 'messenger', 'instagram',
    'snapchat', 'tiktok', 'musical_ly', 'linkedinapp', 'telegram',
    'line/', 'micromessenger', 'twitter', 'reddit', 'kakao', 'naver'
  ];
  var matched = false;
  for (var i = 0; i < socialTokens.length; i++) {
    if (uaLC.indexOf(socialTokens[i]) !== -1) { matched = true; break; }
  }

  // Generic Android WebView marker: "...; wv) AppleWebKit/...".
  if (!matched && isAndroid && /;\s*wv\)/.test(uaLC)) matched = true;

  // iOS in-app WKWebView heuristic: an iOS UA missing the "Safari" token (and
  // not Chrome/Firefox iOS). Best-effort, but catches WhatsApp, Telegram, etc.
  if (!matched && isIOS && !/safari/.test(uaLC) &&
      !/crios/.test(uaLC) && !/fxios/.test(uaLC)) matched = true;

  if (!matched) return;

  var platform = isIOS ? 'ios' : 'android';

  var bar = document.createElement('div');
  bar.id = 'll-inapp-banner';

  var msg = document.createElement('div');
  var title = document.createElement('div');
  title.textContent = 'Open in your browser to install';
  var sub = document.createElement('div');
  if (platform === 'ios') {
    sub.textContent = "Tap Share \u2192 \u2018Open in Safari\u2019 \u2192 \u2018Add to Home Screen\u2019";
  } else {
    sub.textContent = "Tap the \u22ee menu \u2192 \u2018Open in Chrome\u2019 \u2192 \u2018Install app\u2019";
  }
  msg.appendChild(title);
  msg.appendChild(sub);

  var close = document.createElement('button');
  close.type = 'button';
  close.textContent = '\u00d7';
  close.setAttribute('aria-label', 'Dismiss install hint');
  close.addEventListener('click', function () {
    try { sessionStorage.setItem('ll_inapp_dismissed', '1'); } catch (e) {}
    if (bar.parentNode) bar.parentNode.removeChild(bar);
  });

  bar.appendChild(msg);
  bar.appendChild(close);
  document.body.appendChild(bar);
})();
