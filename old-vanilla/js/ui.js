/**
 * ui.js — Slider, tombol, panel info, dan interaksi DOM
 * Sumber: README §11
 */
(function() {
  'use strict';

  var C = window.Config;
  var state; // referensi ke state global

  /**
   * Inisialisasi semua kontrol UI
   */
  function init(simState) {
    state = simState;
    bindControls();
    updateInfo(state);
  }

  // ===================================================================
  // REGISTRY KONTROL
  // Satu baris per slider: rentang & langkah dibaca dari atribut HTML,
  // sehingga nilai minimum/maksimum hanya ditulis di satu tempat.
  // Setiap entri menghubungkan <input type="range"> dengan <input
  // type="number"> bernama sama + '-value', jadi angka bisa digeser
  // maupun diketik langsung.
  // ===================================================================
  var SLIDERS = [
    {
      range: 'sun-slider', def: 100, dec: 0,
      apply: function(v) {
        state.dayNightAuto = false;
        setChecked('auto-day-night', false);
        state.sun = v / 100;
      }
    },
    {
      range: 'cloud-density', def: 70, dec: 0,
      apply: function(v) { Weather.setDensity(v / 100); }
    },
    {
      range: 'wind-speed', def: 5, dec: 0,
      apply: function(v) { Weather.setSpeed(v); }
    },
    {
      range: 'cloud-count', def: 2, dec: 0,
      apply: function(v) {
        Weather.setCount(v, valueOf('cloud-density') / 100, valueOf('wind-speed'));
      }
    },
    {
      range: 'eta-f', def: 100, dec: 0,
      apply: function(v) { state.etaF = v / 100; }
    },
    {
      range: 'soc-init', def: 70, dec: 0,
      apply: function(v) {
        state.soc = v / 100;
        state.eBat = state.soc * C.E_BAT_MAX;
      }
    },
    {
      range: 'h2-init', def: 0, dec: 0,
      apply: function(v) {
        state.h2 = Math.min(v, state.h2Capacity);
        state.o2 = Math.min(state.h2 / 2, state.o2Capacity);
      }
    },
    {
      range: 'lamp-power', def: 1, dec: 1,
      apply: function(v) { state.lampPower = v; }
    },
    {
      range: 'electrolyzer-power', def: 1, dec: 1,
      apply: function(v) { state.electrolyzerPower = v; }
    },
    {
      range: 'h2-capacity', def: 50, dec: 0,
      apply: function(v) {
        state.h2Capacity = v;
        state.h2 = Math.min(state.h2, v);
      }
    },
    {
      range: 'o2-capacity', def: 50, dec: 0,
      apply: function(v) {
        state.o2Capacity = v;
        state.o2 = Math.min(state.o2, v);
      }
    }
  ];

  var SWITCHES = [
    { id: 'auto-day-night',   def: true,  apply: function(on) { state.dayNightAuto = on; } },
    { id: 'lamp-switch',      def: true,  apply: function(on) { state.lampOn = on; } },
    { id: 'label-switch',     def: false, apply: function(on) { state.labelsOn = on; } },
    { id: 'tag-switch',       def: true,  apply: function(on) { state.tagOn = on; } },
    { id: 'particle-switch',  def: true,  apply: function(on) { state.particlesOn = on; } }
  ];

  var SELECTS = [
    { id: 'cloud-mode',  def: 'auto', apply: function(v) { Weather.setMode(v); } },
    { id: 'time-scale',  def: '60',   apply: function(v) { state.timeScale = parseInt(v, 10); } },
    { id: 'ems-version', def: 'v2',   apply: function(v) { state.emsVersion = v; EMS.reset(); } }
  ];

  var sliderIndex = {};   // range id -> entri SLIDERS

  // ===================================================================
  // PEMASANGAN KONTROL
  // ===================================================================
  function bindControls() {
    for (var i = 0; i < SLIDERS.length; i++) bindSlider(SLIDERS[i]);
    for (var j = 0; j < SWITCHES.length; j++) bindSwitch(SWITCHES[j]);
    for (var k = 0; k < SELECTS.length; k++) bindSelect(SELECTS[k]);

    on('btn-close-cloud', 'click', function() { Weather.closeCloud(); });
    on('btn-open-cloud', 'click', function() { Weather.openCloud(); });

    on('btn-pause', 'click', function() {
      state.paused = !state.paused;
      this.textContent = state.paused ? 'Lanjut' : 'Jeda';
      this.setAttribute('aria-label', state.paused ? 'Lanjutkan simulasi' : 'Jeda simulasi');
    });

    on('btn-reset', 'click', function() {
      resetState();
      resetControls();
    });

    var presets = document.querySelectorAll('.preset-btn');
    for (var p = 0; p < presets.length; p++) {
      presets[p].addEventListener('click', function() {
        applyPreset(this.dataset.preset);
      });
    }
  }

  /**
   * Hubungkan satu slider dengan kotak angkanya.
   * - menggeser slider  → kotak angka ikut berubah
   * - mengetik di kotak → slider ikut bergeser (dibatasi saat selesai mengetik)
   */
  function bindSlider(cfg) {
    var range = document.getElementById(cfg.range);
    var num = document.getElementById(cfg.range + '-value');
    if (!range) return;

    cfg.min = parseFloat(range.min);
    cfg.max = parseFloat(range.max);
    cfg.step = parseFloat(range.step) || 1;
    cfg.num = num;
    cfg.el = range;
    sliderIndex[cfg.range] = cfg;

    // Isi kotak angka dari posisi slider saat halaman dimuat.
    // Sengaja tanpa apply() agar state awal tidak ikut berubah.
    if (num) num.value = parseFloat(range.value).toFixed(cfg.dec);

    range.addEventListener('input', function() {
      write(cfg, parseFloat(range.value), { skipRange: true });
    });

    if (!num) return;

    // Saat mengetik: terapkan hanya bila angka sudah valid dan di dalam rentang,
    // supaya nilai setengah jadi (misalnya "-" atau "1.") tidak memaksa clamp.
    num.addEventListener('input', function() {
      var v = parseFloat(num.value);
      if (isNaN(v) || v < cfg.min || v > cfg.max) return;
      write(cfg, v, { skipNum: true });
    });

    // Saat selesai mengetik: rapikan tampilan dan kunci ke rentang yang sah.
    num.addEventListener('change', function() {
      var v = parseFloat(num.value);
      write(cfg, isNaN(v) ? cfg.def : v);
    });

    num.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') num.blur();
    });
  }

  /**
   * Tulis satu nilai ke slider + kotak angka, lalu terapkan ke state.
   */
  function write(cfg, value, opt) {
    opt = opt || {};
    var v = clamp(snap(value, cfg.step), cfg.min, cfg.max);
    if (!opt.skipRange && cfg.el) cfg.el.value = v;
    if (!opt.skipNum && cfg.num) cfg.num.value = v.toFixed(cfg.dec);
    if (opt.skipNum && cfg.el) cfg.el.value = v;
    if (opt.skipRange && cfg.num) cfg.num.value = v.toFixed(cfg.dec);
    if (cfg.apply) cfg.apply(v);
  }

  /**
   * Setel satu slider dari kode (reset / preset) tanpa menduplikasi DOM.
   */
  function setControl(rangeId, value) {
    var cfg = sliderIndex[rangeId];
    if (cfg) write(cfg, value);
  }

  function bindSwitch(cfg) {
    var el = document.getElementById(cfg.id);
    if (!el) return;
    el.addEventListener('change', function() { cfg.apply(this.checked); });
  }

  function bindSelect(cfg) {
    var el = document.getElementById(cfg.id);
    if (!el) return;
    el.addEventListener('change', function() { cfg.apply(this.value); });
  }

  // ===================================================================
  // RESET
  // ===================================================================
  function resetState() {
    state.t = 21600;
    state.sun = 1.0;
    state.G = 0;
    state.tCloud = 1;
    state.pPV = 0;
    state.vPV = 0;
    state.iPV = 0;
    state.soc = C.DEFAULT_SOC;
    state.eBat = C.DEFAULT_SOC * C.E_BAT_MAX;
    state.vBat = 3.9;
    state.vOC = 3.9;
    state.iBat = 0;
    state.pNet = 0;
    state.pPLN = 0;
    state.tCell = C.T_AMB;
    state.mode = 'NORMAL';
    state.relay = { ch1: true, ch2: false, ch3: false, ch4: false };
    state.h2 = C.DEFAULT_H2;
    state.o2 = 0;
    state.h2Capacity = C.H2_TUBE_MAX;
    state.o2Capacity = C.O2_TUBE_MAX;
    state.h2Full = false;
    state.h2Depleted = false;
    state.pFC = 0;
    state.eDay = { pv: 0, load: 0, h2chem: 0, fc: 0 };
    state.flows = {
      w1: 0, w2: 0, w2r: 0, w3: 0, w4: 0, w5: 0, w6: 0, w7: 0, w8: 0,
      pLoad: 0, pElectrolyzer: 0, elActive: false
    };
    state.lampOn = C.DEFAULT_LAMP;
    state.lampPower = C.P_LAMP;
    state.electrolyzerPower = C.V_EL * C.I_EL;
    state.emsVersion = C.DEFAULT_EMS_VERSION;
    state.etaF = C.ETA_F_DEFAULT;
    state.timeScale = C.TIME_SCALE_DEFAULT;
    state.dayNightAuto = true;
    state.dayPhase = 'SIANG';
    state.scenario = 'Standar';
    state.paused = false;
    state.tagOn = true;
    state.labelsOn = false;
    state.particlesOn = true;

    EMS.reset();
    Weather.init(C.CLOUD_COUNT_DEFAULT, C.CLOUD_DEFAULT_DENSITY, C.CLOUD_DEFAULT_SPEED);
    Particles.init();
  }

  /**
   * Kembalikan seluruh kontrol ke nilai bawaannya.
   * Nilai bawaan diambil dari registry, bukan ditulis ulang satu per satu.
   */
  function resetControls() {
    for (var i = 0; i < SLIDERS.length; i++) {
      var cfg = SLIDERS[i];
      if (cfg.el) {
        var v = clamp(cfg.def, cfg.min, cfg.max);
        cfg.el.value = v;
        if (cfg.num) cfg.num.value = v.toFixed(cfg.dec);
      }
    }
    for (var j = 0; j < SWITCHES.length; j++) setChecked(SWITCHES[j].id, SWITCHES[j].def);
    for (var k = 0; k < SELECTS.length; k++) setSelect(SELECTS[k].id, SELECTS[k].def);
    setText('btn-pause', 'Jeda');
  }

  /**
   * §12 — Skenario bawaan (Preset)
   */
  function applyPreset(name) {
    resetState();
    resetControls();
    state.paused = false;
    setText('btn-pause', 'Jeda');

    var names = {
      'siang-cerah':   'Siang cerah',
      'awan-lewat':    'Awan lewat',
      'mendung':       'Mendung',
      'malam-defisit': 'Malam / defisit',
      'kendala-v1':    'Kendala EMS v1',
      'perbaikan-v2':  'Perbaikan EMS v2'
    };
    state.scenario = names[name] || 'Standar';
    state.dayNightAuto = false;
    setChecked('auto-day-night', false);

    switch (name) {
      case 'siang-cerah':
        setControl('sun-slider', 100);
        setControl('soc-init', 85);
        setControl('cloud-count', 0);
        break;

      case 'awan-lewat':
        setControl('sun-slider', 100);
        setControl('cloud-density', 90);
        setControl('wind-speed', 6);
        setControl('cloud-count', 1);
        break;

      case 'mendung':
        setControl('sun-slider', 100);
        setControl('cloud-density', 100);
        setControl('wind-speed', 0);
        setControl('cloud-count', 3);
        Weather.closeCloud();
        break;

      case 'malam-defisit':
        setControl('sun-slider', 0);
        setControl('soc-init', 12);
        setControl('h2-init', 40);
        setControl('cloud-count', 0);
        break;

      case 'kendala-v1':
        setControl('sun-slider', 100);
        setControl('soc-init', 93);
        setControl('cloud-count', 0);
        setSelect('ems-version', 'v1');
        state.emsVersion = 'v1';
        EMS.reset();
        break;

      case 'perbaikan-v2':
        setControl('sun-slider', 100);
        setControl('soc-init', 93);
        setControl('cloud-count', 0);
        setSelect('ems-version', 'v2');
        state.emsVersion = 'v2';
        EMS.reset();
        break;
    }
  }

  /**
   * Update panel info
   */
  function updateInfo(state) {
    setText('info-irradiance', state.G.toFixed(1) + ' W/m²');
    setText('info-tcloud', (state.tCloud * 100).toFixed(1) + '%');
    setText('info-vpv', (state.vPV || 0).toFixed(2) + ' V');
    setText('info-ipv', (state.iPV || 0).toFixed(3) + ' A');
    setText('info-ppv', state.pPV.toFixed(2) + ' W');
    setText('info-ppln', (state.pPLN || 0).toFixed(2) + ' W');
    setText('info-vbat', state.vBat.toFixed(2) + ' V');
    setText('info-soc', (state.soc * 100).toFixed(1) + '%');
    setText('info-mode', state.mode);
    setText('info-scenario', state.scenario || 'Standar');
    var lampSource = state.relay.ch4 ? 'PLN' : state.relay.ch3 ? 'Fuel Cell' : state.relay.ch1 ? 'Panel / baterai' : '-';
    setText('info-lamp-source', lampSource);
    var relayStr = '';
    if (state.relay.ch1) relayStr += 'CH1 ';
    if (state.relay.ch2) relayStr += 'CH2 ';
    if (state.relay.ch3) relayStr += 'CH3 ';
    if (state.relay.ch4) relayStr += 'CH4 ';
    setText('info-relay', relayStr || '-');
    setText('info-pel', state.relay.ch2 ? state.electrolyzerPower.toFixed(1) + ' W' : '0 W');
    setText('info-h2', state.h2.toFixed(1) + ' mL');
    setText('info-o2', state.o2.toFixed(1) + ' mL');
    setText('info-pfc', (state.pFC || 0).toFixed(2) + ' W');
    setText('info-h2remain', state.h2.toFixed(1) + ' mL');
    setText('info-epv', state.eDay.pv.toFixed(3) + ' Wh');
    setText('info-eload', state.eDay.load.toFixed(3) + ' Wh');
    setText('info-eh2', state.eDay.h2chem.toFixed(3) + ' Wh');
    setText('info-time', formatTime(state.t));
    setText('info-period', state.dayPhase || (state.sun > 0 ? 'SIANG' : 'MALAM'));
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function setChecked(id, on) {
    var el = document.getElementById(id);
    if (el) el.checked = on;
  }

  function setSelect(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  function on(id, evt, fn) {
    var el = document.getElementById(id);
    if (el) el.addEventListener(evt, fn);
  }

  function valueOf(id) {
    var el = document.getElementById(id);
    return el ? parseFloat(el.value) : 0;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  /** Bulatkan ke kelipatan langkah slider agar angka ketikan tetap sah. */
  function snap(v, step) {
    if (!step) return v;
    return Math.round(v / step) * step;
  }

  function formatTime(seconds) {
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);
    return pad(h) + ':' + pad(m) + ':' + pad(s);
  }

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  window.UI = {
    init: init,
    updateInfo: updateInfo,
    resetState: resetState,
    applyPreset: applyPreset
  };

})();
