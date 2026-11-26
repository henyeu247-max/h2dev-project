/**
 * H2DEV — Auto-Sleeping Sakuga Micro-FX Canvas (~3 KB)
 * Uses plain MIT particle physics (radial ticks, kira sparkle, crisp shock ring)
 * strictly themed to Viddar Dark (#E2023A / #ffffff / #38bdf8 / #10b981).
 * Guaranteed 0% CPU when idle: rAF loop cancels immediately once particles reach 0.
 */
(function (global) {
  'use strict';

  var canvas = null;
  var ctx = null;
  var particles = [];
  var rafId = 0;
  var dpr = 1;

  function prefersReducedMotion() {
    try {
      return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (_) {
      return false;
    }
  }

  function isEnabled() {
    if (prefersReducedMotion()) return false;
    try {
      if (global.localStorage && global.localStorage.getItem('h2dev-fx-off') === '1') return false;
    } catch (_) {}
    return typeof document !== 'undefined' && typeof global.requestAnimationFrame === 'function';
  }

  function ensureCanvas() {
    if (canvas && canvas.isConnected) return canvas;
    canvas = document.createElement('canvas');
    canvas.className = 'h2-fx-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    syncSize();
    return canvas;
  }

  function syncSize() {
    if (!canvas) return;
    dpr = Math.min(global.devicePixelRatio || 1, 2);
    var w = Math.max(1, global.innerWidth || document.documentElement.clientWidth || 1);
    var h = Math.max(1, global.innerHeight || document.documentElement.clientHeight || 1);
    var pw = Math.round(w * dpr);
    var ph = Math.round(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
  }

  function resolveCenter(target) {
    if (!target) return null;
    if (typeof target.left === 'number' && typeof target.top === 'number') {
      return {
        x: target.left + (target.width || 0) * 0.5,
        y: target.top + (target.height || 0) * 0.5
      };
    }
    if (typeof target.getBoundingClientRect === 'function') {
      var r = target.getBoundingClientRect();
      if (r.width <= 0 && r.height <= 0) return null;
      return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
    }
    return null;
  }

  function spawnPreset(x, y, kind) {
    var now = performance.now();
    if (kind === 'success') {
      particles.push({ type: 'ring', x: x, y: y, r0: 6, r1: 26, color: '#10b981', t0: now, dur: 320 });
      for (var i = 0; i < 4; i++) {
        var ang = (Math.PI * 2 * i) / 4 + 0.35;
        particles.push({
          type: 'kira', x: x, y: y,
          vx: Math.cos(ang) * 2.2, vy: Math.sin(ang) * 2.2,
          color: i % 2 === 0 ? '#10b981' : '#ffffff', size: 4, t0: now, dur: 300
        });
      }
      return;
    }
    if (kind === 'milestone') {
      particles.push({ type: 'ring', x: x, y: y, r0: 8, r1: 40, color: '#E2023A', t0: now, dur: 420 });
      for (var j = 0; j < 6; j++) {
        var a2 = (Math.PI * 2 * j) / 6;
        particles.push({
          type: 'tick', x: x, y: y, ang: a2, dist0: 10, dist1: 34, len: 8,
          color: j % 2 === 0 ? '#E2023A' : '#38bdf8', t0: now, dur: 380
        });
      }
      for (var k = 0; k < 4; k++) {
        var a3 = (Math.PI * 2 * k) / 4 + 0.78;
        particles.push({
          type: 'kira', x: x, y: y,
          vx: Math.cos(a3) * 2.8, vy: Math.sin(a3) * 2.8,
          color: '#ffffff', size: 4.5, t0: now, dur: 360
        });
      }
      return;
    }
    // Default preset: 'copy'
    for (var m = 0; m < 4; m++) {
      var a4 = (Math.PI * 2 * m) / 4 + 0.4;
      particles.push({
        type: 'tick', x: x, y: y, ang: a4, dist0: 8, dist1: 22, len: 6,
        color: m % 2 === 0 ? '#E2023A' : '#38bdf8', t0: now, dur: 260
      });
    }
    particles.push({
      type: 'kira', x: x + 6, y: y - 6, vx: 0.6, vy: -0.9,
      color: '#ffffff', size: 3.5, t0: now, dur: 250
    });
  }

  function tick(now) {
    if (!ctx || !canvas || document.hidden || particles.length === 0) {
      sleep();
      return;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var alive = [];
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var t = (now - p.t0) / p.dur;
      if (t >= 1) continue;
      if (t < 0) { alive.push(p); continue; }
      var ease = 1 - Math.pow(1 - t, 3);
      var alpha = 1 - t;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;

      if (p.type === 'ring') {
        ctx.lineWidth = Math.max(1, 2.2 * (1 - t));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r0 + (p.r1 - p.r0) * ease, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'tick') {
        var rStart = p.dist0 + (p.dist1 - p.dist0) * ease;
        var rEnd = rStart + p.len * (1 - t * 0.6);
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x + Math.cos(p.ang) * rStart, p.y + Math.sin(p.ang) * rStart);
        ctx.lineTo(p.x + Math.cos(p.ang) * rEnd, p.y + Math.sin(p.ang) * rEnd);
        ctx.stroke();
      } else if (p.type === 'kira') {
        var px = p.x + p.vx * (t * 14);
        var py = p.y + p.vy * (t * 14);
        var s = p.size * (1 - t * 0.45);
        ctx.beginPath();
        ctx.moveTo(px, py - s);
        ctx.lineTo(px + s * 0.32, py - s * 0.32);
        ctx.lineTo(px + s, py);
        ctx.lineTo(px + s * 0.32, py + s * 0.32);
        ctx.lineTo(px, py + s);
        ctx.lineTo(px - s * 0.32, py + s * 0.32);
        ctx.lineTo(px - s, py);
        ctx.lineTo(px - s * 0.32, py - s * 0.32);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
      alive.push(p);
    }
    particles = alive;
    if (particles.length > 0) {
      rafId = global.requestAnimationFrame(tick);
    } else {
      sleep();
    }
  }

  function sleep() {
    if (rafId) {
      try { global.cancelAnimationFrame(rafId); } catch (_) {}
      rafId = 0;
    }
    particles = [];
    if (ctx && canvas) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function burst(elOrRect, kind) {
    if (!isEnabled() || document.hidden) return false;
    var pt = resolveCenter(elOrRect);
    if (!pt) return false;
    ensureCanvas();
    syncSize();
    if (particles.length > 48) particles.splice(0, particles.length - 48);
    spawnPreset(pt.x, pt.y, kind || 'copy');
    if (!rafId) {
      rafId = global.requestAnimationFrame(tick);
    }
    return true;
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) sleep();
    });
  }
  global.addEventListener('resize', function () {
    if (canvas) syncSize();
  }, { passive: true });

  global.H2FX = {
    burst: burst,
    isEnabled: isEnabled,
    _debugState: function () {
      return { running: rafId !== 0, count: particles.length };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
