/**
 * weather.js — Awan, geometri bayangan, transmitansi
 * Sumber: README §7
 */
(function() {
  'use strict';

  var C = window.Config;

  var clouds = [];
  var cloudMode = 'auto'; // 'auto' | 'manual'
  var dragCloud = null;
  var dragOffX = 0;
  var dragOffY = 0;
  var cloudAnimations = []; // untuk animasi tutup/buka

  // Posisi referensi — diambil dari Config.LAYOUT agar segmen matahari→panel
  // yang dipakai perhitungan bayangan awan selalu cocok dengan gambar.
  var sunPos = { x: C.LAYOUT.sun.x, y: C.LAYOUT.sun.y };
  var panelCenter = { x: C.LAYOUT.panel.cx, y: C.LAYOUT.panel.cy };

  /**
   * Smoothstep function
   */
  function smoothstep(edge0, edge1, x) {
    var t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
  }

  /**
   * Inisialisasi awan
   */
  function init(count, density, speed) {
    clouds = [];
    for (var i = 0; i < count; i++) {
      clouds.push({
        x: 100 + i * 300 + Math.random() * 100,
        y: 55 + (i % 3) * 42 + Math.random() * 16,
        rx: 72 + Math.random() * 28,
        ry: 24 + Math.random() * 12,
        density: density,
        speed: speed * (0.8 + Math.random() * 0.4),
        origX: 0, // untuk animasi
        targetX: 0
      });
    }
    cloudAnimations = [];
  }

  /**
   * Update posisi awan
   */
  function update(dt, state) {
    // Update animasi tutup/buka
    for (var a = cloudAnimations.length - 1; a >= 0; a--) {
      var anim = cloudAnimations[a];
      anim.progress += dt / anim.duration;
      if (anim.progress >= 1) {
        anim.cloud.x = anim.targetX;
        cloudAnimations.splice(a, 1);
      } else {
        // ease-in-out
        var t = smoothstep(0, 1, anim.progress);
        anim.cloud.x = anim.startX + (anim.targetX - anim.startX) * t;
      }
    }

    // Gerak otomatis (angin)
    if (cloudMode === 'auto' && cloudAnimations.length === 0) {
      for (var i = 0; i < clouds.length; i++) {
        if (clouds[i] === dragCloud) continue;
        clouds[i].x += clouds[i].speed * dt;
        // Wrap di tepi kanvas
        if (clouds[i].x - clouds[i].rx > C.CANVAS_W + 50) {
          clouds[i].x = -clouds[i].rx - 50;
        }
        if (clouds[i].x + clouds[i].rx < -50) {
          clouds[i].x = C.CANVAS_W + clouds[i].rx + 50;
        }
      }
    }

    // Hitung transmitansi
    state.tCloud = calcTransmittance();
  }

  /**
   * §7.1 — Hitung transmitansi total
   */
  function calcTransmittance() {
    var tTotal = 1;
    for (var i = 0; i < clouds.length; i++) {
      var cloud = clouds[i];
      // Jarak titik tengah awan ke segmen matahari-panel
      var d = distPointToSegment(cloud.x, cloud.y, sunPos.x, sunPos.y, panelCenter.x, panelCenter.y);
      var rEff = (cloud.rx + cloud.ry) / 2;
      // Faktor tutupan
      var cov = 1 - smoothstep(0.6 * rEff, 1.0 * rEff, d);
      // Transmitansi awan ini
      var ti = 1 - cloud.density * cov * (1 - C.T_CLOUD_MIN);
      tTotal *= ti;
    }
    return Math.max(C.T_CLOUD_MIN, Math.min(1, tTotal));
  }

  /**
   * Jarak titik (px, py) ke segmen (ax, ay)-(bx, by)
   */
  function distPointToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.sqrt((px - ax) * (px - ax) + (py - ay) * (py - ay));
    var t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
    var projX = ax + t * dx;
    var projY = ay + t * dy;
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  /**
   * Tombol "Tutup Awan" — awan bergerak ke atas panel
   */
  function closeCloud() {
    cloudAnimations = [];
    var targetX = (sunPos.x + panelCenter.x) / 2;
    for (var i = 0; i < clouds.length; i++) {
      cloudAnimations.push({
        cloud: clouds[i],
        startX: clouds[i].x,
        targetX: targetX + i * 30,
        duration: 3,
        progress: 0
      });
    }
  }

  /**
   * Tombol "Buka Awan" — awan bergerak menjauhi panel
   */
  function openCloud() {
    cloudAnimations = [];
    for (var i = 0; i < clouds.length; i++) {
      var target = clouds[i].x < panelCenter.x ? -150 : C.CANVAS_W + 150;
      cloudAnimations.push({
        cloud: clouds[i],
        startX: clouds[i].x,
        targetX: target,
        duration: 3,
        progress: 0
      });
    }
  }

  /**
   * Drag handling
   */
  function startDrag(mx, my) {
    for (var i = clouds.length - 1; i >= 0; i--) {
      var cloud = clouds[i];
      var dx = mx - cloud.x;
      var dy = my - cloud.y;
      if ((dx * dx) / (cloud.rx * cloud.rx) + (dy * dy) / (cloud.ry * cloud.ry) <= 1.2) {
        dragCloud = cloud;
        dragOffX = dx;
        dragOffY = dy;
        return true;
      }
    }
    return false;
  }

  function moveDrag(mx, my) {
    if (dragCloud) {
      dragCloud.x = mx - dragOffX;
      dragCloud.y = Math.max(30, Math.min(180, my - dragOffY));
    }
  }

  function endDrag() {
    dragCloud = null;
  }

  function setMode(mode) { cloudMode = mode; }
  function getMode() { return cloudMode; }
  function getClouds() { return clouds; }
  function getSunPos() { return sunPos; }
  function getPanelCenter() { return panelCenter; }

  function setDensity(d) {
    for (var i = 0; i < clouds.length; i++) {
      clouds[i].density = d;
    }
  }

  function setSpeed(s) {
    for (var i = 0; i < clouds.length; i++) {
      clouds[i].speed = s * (0.8 + Math.random() * 0.4);
    }
  }

  function setCount(count, density, speed) {
    var current = clouds.length;
    if (count > current) {
      for (var i = current; i < count; i++) {
        clouds.push({
          x: -100 - Math.random() * 200,
          y: 55 + (i % 3) * 42 + Math.random() * 16,
          rx: 72 + Math.random() * 28,
          ry: 24 + Math.random() * 12,
          density: density,
          speed: speed * (0.8 + Math.random() * 0.4)
        });
      }
    } else if (count < current) {
      clouds.splice(count);
    }
  }

  window.Weather = {
    init: init,
    update: update,
    closeCloud: closeCloud,
    openCloud: openCloud,
    startDrag: startDrag,
    moveDrag: moveDrag,
    endDrag: endDrag,
    setMode: setMode,
    getMode: getMode,
    getClouds: getClouds,
    getSunPos: getSunPos,
    getPanelCenter: getPanelCenter,
    setDensity: setDensity,
    setSpeed: setSpeed,
    setCount: setCount,
    calcTransmittance: calcTransmittance
  };

})();
