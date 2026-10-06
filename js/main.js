/**
 * main.js — Inisialisasi & game loop
 * Sumber: README §10
 */
(function() {
  'use strict';

  var C = window.Config;

  // === State Simulasi ===
  var state = {
    t: 21600,
    sun: 1.0,
    G: 0,
    tCloud: 1,
    pPV: 0,
    vPV: 0,
    iPV: 0,
    tCell: C.T_AMB,
    eBat: C.DEFAULT_SOC * C.E_BAT_MAX,
    soc: C.DEFAULT_SOC,
    vBat: 3.9,
    vOC: 3.9,
    iBat: 0,
    pNet: 0,
    pPLN: 0,
    mode: 'NORMAL',
    relay: { ch1: true, ch2: false, ch3: false, ch4: false },
    h2: C.DEFAULT_H2,
    o2: 0,
    h2Capacity: C.H2_TUBE_MAX,
    o2Capacity: C.O2_TUBE_MAX,
    h2Full: false,
    h2Depleted: false,
    pFC: 0,
    eDay: { pv: 0, load: 0, h2chem: 0, fc: 0 },
    flows: {
      w1: 0, w2: 0, w2r: 0, w3: 0, w4: 0,
      w5: 0, w6: 0, w7: 0, w8: 0,
      pLoad: 0, pElectrolyzer: 0, elActive: false
    },
    lampOn: C.DEFAULT_LAMP,
    lampPower: C.P_LAMP,
    electrolyzerPower: C.V_EL * C.I_EL,
    emsVersion: C.DEFAULT_EMS_VERSION,
    etaF: C.ETA_F_DEFAULT,
    timeScale: C.TIME_SCALE_DEFAULT,
    dayNightAuto: true,
    dayPhase: 'SIANG',
    scenario: 'Standar',
    paused: false,
    tagOn: true,
    labelsOn: false,
    particlesOn: true
  };

  var canvas, ctx;
  var last = 0;

  function init() {
    canvas = document.getElementById('sim-canvas');
    ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = C.CANVAS_W;
    canvas.height = C.CANVAS_H;

    // Responsive scaling
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Inisialisasi modul
    Weather.init(C.CLOUD_COUNT_DEFAULT, C.CLOUD_DEFAULT_DENSITY, C.CLOUD_DEFAULT_SPEED);
    Particles.init();
    UI.init(state);

    // Mouse/touch events untuk drag awan
    setupCanvasEvents();

    // Mulai game loop
    last = performance.now();
    requestAnimationFrame(frame);
  }

  /**
   * Responsive canvas scaling
   */
  function resizeCanvas() {
    var container = canvas.parentElement;
    var containerW = container.clientWidth;
    var ratio = C.CANVAS_W / C.CANVAS_H;
    var displayW = containerW;
    var displayH = displayW / ratio;

    // Sisakan ruang untuk header dan jarak visual di mode landscape.
    var maxH = Math.max(320, window.innerHeight - 126);
    if (displayH > maxH) {
      displayH = maxH;
      displayW = displayH * ratio;
    }

    canvas.style.width = displayW + 'px';
    canvas.style.height = displayH + 'px';
  }

  /**
   * Canvas mouse/touch events untuk drag awan
   */
  function setupCanvasEvents() {
    function getCanvasCoords(e) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = C.CANVAS_W / rect.width;
      var scaleY = C.CANVAS_H / rect.height;
      var clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    canvas.addEventListener('mousedown', function(e) {
      var pos = getCanvasCoords(e);
      Weather.startDrag(pos.x, pos.y);
    });
    canvas.addEventListener('mousemove', function(e) {
      var pos = getCanvasCoords(e);
      Weather.moveDrag(pos.x, pos.y);
    });
    canvas.addEventListener('mouseup', function() {
      Weather.endDrag();
    });
    canvas.addEventListener('mouseleave', function() {
      Weather.endDrag();
    });

    // Touch
    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var pos = getCanvasCoords(e);
      Weather.startDrag(pos.x, pos.y);
    }, { passive: false });
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var pos = getCanvasCoords(e);
      Weather.moveDrag(pos.x, pos.y);
    }, { passive: false });
    canvas.addEventListener('touchend', function() {
      Weather.endDrag();
    });
  }

  /**
   * §10 — Game Loop
   */
  function frame(now) {
    var dtReal = Math.min((now - last) / 1000, 0.1);
    last = now;

    if (!state.paused) {
      var remaining = dtReal * state.timeScale;
      while (remaining > 0) {
        var dt = Math.min(remaining, 1.0);

        updateDayNight();

        // 1. Gerakkan awan, hitung T_awan
        Weather.update(dt, state);

        // 2. Iradiansi efektif
        Physics.irradiance(state);

        // 3. Daya panel
        Physics.panelPower(state);

        // 4. Keputusan EMS
        EMS.step(state, dt);

        // 5. Neraca daya & SOC
        Physics.busAndBattery(state, dt);

        // 6. Elektroliser (bila CH2 ON)
        Physics.electrolyzer(state, dt);

        // 7. Fuel cell (bila CH3 ON)
        Physics.fuelCell(state, dt);

        // 8. Akumulasi energi harian
        Physics.accumulate(state, dt);

        // Update waktu simulasi
        state.t += dt;
        remaining -= dt;
      }
    }

    // Partikel mengikuti waktu nyata
    Particles.update(dtReal, state.flows);

    // Gambar
    Renderer.draw(ctx, state);

    // Update panel info
    UI.updateInfo(state);

    requestAnimationFrame(frame);
  }

  function updateDayNight() {
    if (!state.dayNightAuto) return;

    var minutes = (state.t % 86400) / 60;
    var sun = 0;
    if (minutes >= 360 && minutes < 1080) {
      var daylightProgress = (minutes - 360) / 720;
      sun = Math.sin(daylightProgress * Math.PI);
    }

    state.sun = Math.max(0, sun);
    state.dayPhase = minutes >= 360 && minutes < 1080 ? 'SIANG' : 'MALAM';
    var sunSlider = document.getElementById('sun-slider');
    var sunValue = document.getElementById('sun-value');
    if (sunSlider && sunValue) {
      sunSlider.value = Math.round(state.sun * 100);
      sunValue.textContent = Math.round(state.sun * 100) + '%';
    }
  }

  // Mulai saat DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
