/* ============================================================
   Lunar Lander - native DOM touch controls (overlay layer)
   ------------------------------------------------------------
   WHY THIS EXISTS:
   Phaser's interactive-object hit-testing is unreliable on mobile
   browsers when the canvas is scaled/letterboxed (especially Firefox
   Android, whose URL bar show/hide shifts the viewport and desyncs
   Phaser's input-coordinate mapping). That caused missed presses and
   "left" registering as "thrust" (coordinates landing on the wrong button).

   Native DOM touch handling does NOT go through Phaser's transform, so it
   is rock-solid on every mobile browser. Each button is its own DOM element
   using Pointer Events + setPointerCapture, giving reliable multi-touch
   (rotate + thrust at once) with no coordinate ambiguity.

   The overlay is positioned to exactly match the canvas on screen
   (tracked via getBoundingClientRect + polling, so Firefox URL-bar
   resizes can't desync it). Controls are placed in the game's 360x640
   coordinate space using percentages of the overlay.
   ============================================================ */

const DOMUI = {
  overlay: null,
  scale: 1,
  _poll: null,
  _alive: 0, // generation counter; stale closures check this

  init() {
    if (this.overlay) return;
    const ov = document.createElement('div');
    ov.id = 'dom-overlay';
    ov.style.cssText =
      'position:fixed;left:0;top:0;width:100vw;height:100vh;' +
      'pointer-events:none;z-index:50;touch-action:none;' +
      'overflow:hidden;';
    document.body.appendChild(ov);
    this.overlay = ov;

    const sync = () => this.sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', () => setTimeout(sync, 250));
    // Light polling catches canvas moves that don't fire resize (e.g. Firefox
    // Android URL bar hide/show while touching). Cheap; every 250ms.
    this._poll = setInterval(sync, 250);
    sync();
  },

  // Resize/reposition the overlay to exactly cover the canvas element.
  sync() {
    const c = document.querySelector('#game-container canvas');
    if (!c || !this.overlay) return;
    const r = c.getBoundingClientRect();
    if (!r.width) return;
    this.scale = r.width / GAME_W;
    this.overlay.style.left = r.left + 'px';
    this.overlay.style.top = r.top + 'px';
    this.overlay.style.width = r.width + 'px';
    this.overlay.style.height = r.height + 'px';
    this.overlay.style.setProperty('--s', String(this.scale));
  },

  // Remove all overlay controls (called when leaving a screen).
  clear() {
    this._alive++; // invalidate any closures still bound to old elements
    if (this.overlay) this.overlay.innerHTML = '';
  },

  // ---- shared element styling ----
  _styleBtn(el, gx, gy, gw, gh, fontSize) {
    el.style.cssText =
      'position:absolute;pointer-events:auto;box-sizing:border-box;' +
      'left:' + (gx / GAME_W * 100) + '%;' +
      'top:' + (gy / GAME_H * 100) + '%;' +
      'width:' + (gw / GAME_W * 100) + '%;' +
      'height:' + (gh / GAME_H * 100) + '%;' +
      'transform:translate(-50%,-50%);' +
      'font-size:calc(' + fontSize + 'px * var(--s));' +
      'font-family:"Courier New",monospace;font-weight:bold;' +
      'display:flex;align-items:center;justify-content:center;' +
      'text-align:center;line-height:1.05;' +
      'border:2px solid #fff;border-radius:12px;color:#fff;background:transparent;' +
      'user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;' +
      '-webkit-tap-highlight-color:transparent;touch-action:none;outline:none;' +
      'margin:0;padding:0;cursor:pointer;';
  },

  _visual(el, pressed) {
    if (el._pressed === pressed) return;
    el._pressed = pressed;
    el.style.background = pressed ? '#fff' : 'transparent';
    el.style.color = pressed ? '#000' : '#fff';
    el.style.transform = pressed
      ? 'translate(-50%,-50%) scale(0.95)'
      : 'translate(-50%,-50%)';
  },

  // ---- hold button: multi-touch safe, returns object with .pressed ----
  holdButton(gx, gy, gw, gh, label, fontSize) {
    this.init();
    const el = document.createElement('div');
    el.textContent = label;
    el.className = 'dom-btn';
    this._styleBtn(el, gx, gy, gw, gh, fontSize);
    el._pressed = false;
    el._pid = null;

    const press = (e) => {
      e.preventDefault();
      el._pid = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      this._visual(el, true);
    };
    const release = (e) => {
      if (e && e.pointerId != null && el._pid != null && e.pointerId !== el._pid) return;
      e && e.preventDefault && e.preventDefault();
      el._pid = null;
      try { if (e && e.pointerId != null) el.releasePointerCapture(e.pointerId); } catch (_) {}
      this._visual(el, false);
    };

    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    // Safety nets: if capture fails, a global up/cancel still releases us.
    const myGen = this._alive;
    const globalUp = (e) => {
      if (myGen !== this._alive) return;            // stale
      if (el._pid != null && (e.pointerId == null || e.pointerId === el._pid)) release(e);
    };
    window.addEventListener('pointerup', globalUp);
    window.addEventListener('pointercancel', globalUp);
    el.addEventListener('contextmenu', (e) => e.preventDefault());

    this.overlay.appendChild(el);
    return {
      el: el,
      get pressed() { return !!el._pressed; },
      release: () => release(null)
    };
  },

  // ---- tap button: fires onClick on release ----
  tapButton(gx, gy, gw, gh, label, fontSize, onClick) {
    const b = this.holdButton(gx, gy, gw, gh, label, fontSize);
    b.el.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
    return b;
  },

  // ---- native range slider (gravity). Always reliable on mobile. ----
  range(gx, gy, gw, min, max, step, val, onChange) {
    this.init();
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'position:absolute;pointer-events:none;' +
      'left:' + (gx / GAME_W * 100) + '%;' +
      'top:' + (gy / GAME_H * 100) + '%;' +
      'width:' + (gw / GAME_W * 100) + '%;' +
      'transform:translate(-50%,-50%);';
    const r = document.createElement('input');
    r.type = 'range';
    r.min = String(min); r.max = String(max); r.step = String(step); r.value = String(val);
    r.style.cssText =
      'width:100%;pointer-events:auto;accent-color:#fff;' +
      'touch-action:none;height:calc(40px * var(--s));' +
      'margin:0;display:block;';
    r.addEventListener('input', () => onChange(parseFloat(r.value)));
    wrap.appendChild(r);
    this.overlay.appendChild(wrap);
    return { wrap: wrap, input: r };
  },

  // ---- icon (SVG) tap button. Uses currentColor so the existing press-state
  //      color flip (white<->black) recolours the icon automatically. ----
  iconButton(gx, gy, gw, gh, svgMarkup, onClick) {
    const b = this.holdButton(gx, gy, gw, gh, '', 1);
    b.el.innerHTML = svgMarkup;
    const svg = b.el.querySelector('svg');
    if (svg) {
      svg.style.cssText = 'width:62%;height:62%;display:block;pointer-events:none;';
    }
    b.el.addEventListener('click', (e) => { e.preventDefault(); onClick(); });
    return b;
  }
};
