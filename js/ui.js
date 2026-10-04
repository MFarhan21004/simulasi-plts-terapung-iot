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

  function bindControls() {
    // === Matahari ===
    var sunSlider = document.getElementById('sun-slider');
    var sunVal = document.getElementById('sun-value');
    sunSlider.addEventListener('input', function() {
      state.sun = parseFloat(this.value) / 100;
      sunVal.textContent = this.value + '%';
    });

    // === Awan ===
    document.getElementById('btn-close-cloud').addEventListener('click', function() {
      Weather.closeCloud();
    });
    document.getElementById('btn-open-cloud').addEventListener('click', function() {
      Weather.openCloud();
    });

    var cloudModeSelect = document.getElementById('cloud-mode');
    cloudModeSelect.addEventListener('change', function() {
      Weather.setMode(this.value);
    });

    var cloudDensity = document.getElementById('cloud-density');
    var cloudDenVal = document.getElementById('cloud-density-value');
    cloudDensity.addEventListener('input', function() {
      var d = parseFloat(this.value) / 100;
      Weather.setDensity(d);
      cloudDenVal.textContent = this.value + '%';
    });

    var windSpeed = document.getElementById('wind-speed');
    var windVal = document.getElementById('wind-speed-value');
    windSpeed.addEventListener('input', function() {
      var s = parseFloat(this.value);
      Weather.setSpeed(s);
      windVal.textContent = s + ' px/s';
    });

    var cloudCount = document.getElementById('cloud-count');
    var cloudCountVal = document.getElementById('cloud-count-value');
    cloudCount.addEventListener('input', function() {
      var n = parseInt(this.value);
      var d = parseFloat(cloudDensity.value) / 100;
      var s = parseFloat(windSpeed.value);
      Weather.setCount(n, d, s);
      cloudCountVal.textContent = n;
    });

    // === Waktu ===
    var timeScaleSelect = document.getElementById('time-scale');
    timeScaleSelect.addEventListener('change', function() {
      state.timeScale = parseInt(this.value);
    });

    document.getElementById('btn-pause').addEventListener('click', function() {
      state.paused = !state.paused;
      this.textContent = state.paused ? '▶ Lanjut' : '⏸ Jeda';
      this.setAttribute('aria-label', state.paused ? 'Lanjutkan simulasi' : 'Jeda simulasi');
    });

    // === Beban & EMS ===
    var lampSwitch = document.getElementById('lamp-switch');
    lampSwitch.addEventListener('change', function() {
      state.lampOn = this.checked;
    });

    var emsSelect = document.getElementById('ems-version');
    emsSelect.addEventListener('change', function() {
      state.emsVersion = this.value;
      EMS.reset();
    });

    var etaFSlider = document.getElementById('eta-f');
    var etaFVal = document.getElementById('eta-f-value');
    etaFSlider.addEventListener('input', function() {
      state.etaF = parseFloat(this.value) / 100;
      etaFVal.textContent = this.value + '%';
    });

    var socSlider = document.getElementById('soc-init');
    var socVal = document.getElementById('soc-init-value');
    socSlider.addEventListener('input', function() {
      var soc = parseFloat(this.value) / 100;
      state.soc = soc;
      state.eBat = soc * C.E_BAT_MAX;
      socVal.textContent = this.value + '%';
    });

    var h2Slider = document.getElementById('h2-init');
    var h2Val = document.getElementById('h2-init-value');
    h2Slider.addEventListener('input', function() {
      state.h2 = parseFloat(this.value);
      state.o2 = state.h2 / 2;
      h2Val.textContent = this.value + ' mL';
    });

    // === Tampilan ===
    var labelSwitch = document.getElementById('label-switch');
    labelSwitch.addEventListener('change', function() {
      state.labelsOn = this.checked;
    });

    var tagSwitch = document.getElementById('tag-switch');
    tagSwitch.addEventListener('change', function() {
      state.tagOn = this.checked;
    });

    var particleSwitch = document.getElementById('particle-switch');
    particleSwitch.addEventListener('change', function() {
      state.particlesOn = this.checked;
    });

    // === Reset ===
    document.getElementById('btn-reset').addEventListener('click', function() {
      resetState();
      resetControls();
    });

    // === Preset ===
    var presetBtns = document.querySelectorAll('.preset-btn');
    for (var i = 0; i < presetBtns.length; i++) {
      presetBtns[i].addEventListener('click', function() {
        applyPreset(this.dataset.preset);
      });
    }
  }

  /**
   * Reset state ke default
   */
  function resetState() {
    state.t = 0;
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
    state.tCell = C.T_AMB;
    state.mode = 'NORMAL';
    state.relay = { ch1: true, ch2: false, ch3: false, ch4: false };
    state.h2 = C.DEFAULT_H2;
    state.o2 = 0;
    state.h2Full = false;
    state.h2Depleted = false;
    state.pFC = 0;
    state.eDay = { pv: 0, load: 0, h2chem: 0, fc: 0 };
    state.flows = { w1: 0, w2: 0, w2r: 0, w3: 0, w4: 0, w5: 0, w6: 0, w7: 0, w8: 0, pLoad: 0, pElectrolyzer: 0, elActive: false };
    state.lampOn = C.DEFAULT_LAMP;
    state.emsVersion = C.DEFAULT_EMS_VERSION;
    state.etaF = C.ETA_F_DEFAULT;
    state.timeScale = C.TIME_SCALE_DEFAULT;
    state.paused = false;
    state.tagOn = true;
    state.labelsOn = false;
    state.particlesOn = true;

    EMS.reset();
    Weather.init(C.CLOUD_COUNT_DEFAULT, C.CLOUD_DEFAULT_DENSITY, C.CLOUD_DEFAULT_SPEED);
    Particles.init();
  }

  function resetControls() {
    document.getElementById('sun-slider').value = 100;
    document.getElementById('sun-value').textContent = '100%';
    document.getElementById('cloud-mode').value = 'auto';
    document.getElementById('cloud-density').value = 70;
    document.getElementById('cloud-density-value').textContent = '70%';
    document.getElementById('wind-speed').value = 12;
    document.getElementById('wind-speed-value').textContent = '12 px/s';
    document.getElementById('cloud-count').value = 2;
    document.getElementById('cloud-count-value').textContent = '2';
    document.getElementById('time-scale').value = 60;
    document.getElementById('btn-pause').textContent = '⏸ Jeda';
    document.getElementById('lamp-switch').checked = true;
    document.getElementById('ems-version').value = 'v2';
    document.getElementById('eta-f').value = 100;
    document.getElementById('eta-f-value').textContent = '100%';
    document.getElementById('soc-init').value = 70;
    document.getElementById('soc-init-value').textContent = '70%';
    document.getElementById('h2-init').value = 0;
    document.getElementById('h2-init-value').textContent = '0 mL';
    document.getElementById('label-switch').checked = false;
    document.getElementById('tag-switch').checked = true;
    document.getElementById('particle-switch').checked = true;
  }

  /**
   * §12 — Skenario bawaan (Preset)
   */
  function applyPreset(name) {
    resetState();
    resetControls();

    switch (name) {
      case 'siang-cerah':
        state.sun = 1.0;
        state.soc = 0.85;
        state.eBat = 0.85 * C.E_BAT_MAX;
        Weather.init(0, 0, 0);
        document.getElementById('sun-slider').value = 100;
        document.getElementById('soc-init').value = 85;
        document.getElementById('soc-init-value').textContent = '85%';
        document.getElementById('cloud-count').value = 0;
        document.getElementById('cloud-count-value').textContent = '0';
        break;

      case 'awan-lewat':
        state.sun = 1.0;
        Weather.init(1, 0.9, 15);
        document.getElementById('cloud-density').value = 90;
        document.getElementById('cloud-density-value').textContent = '90%';
        document.getElementById('cloud-count').value = 1;
        document.getElementById('cloud-count-value').textContent = '1';
        break;

      case 'mendung':
        state.sun = 1.0;
        Weather.init(3, 1.0, 0);
        Weather.closeCloud();
        document.getElementById('cloud-density').value = 100;
        document.getElementById('cloud-density-value').textContent = '100%';
        document.getElementById('cloud-count').value = 3;
        document.getElementById('cloud-count-value').textContent = '3';
        document.getElementById('wind-speed').value = 0;
        document.getElementById('wind-speed-value').textContent = '0 px/s';
        break;

      case 'malam-defisit':
        state.sun = 0;
        state.soc = 0.12;
        state.eBat = 0.12 * C.E_BAT_MAX;
        state.h2 = 40;
        state.o2 = 20;
        Weather.init(0, 0, 0);
        document.getElementById('sun-slider').value = 0;
        document.getElementById('sun-value').textContent = '0%';
        document.getElementById('soc-init').value = 12;
        document.getElementById('soc-init-value').textContent = '12%';
        document.getElementById('h2-init').value = 40;
        document.getElementById('h2-init-value').textContent = '40 mL';
        document.getElementById('cloud-count').value = 0;
        document.getElementById('cloud-count-value').textContent = '0';
        break;

      case 'kendala-v1':
        state.sun = 1.0;
        state.soc = 0.93;
        state.eBat = 0.93 * C.E_BAT_MAX;
        state.emsVersion = 'v1';
        Weather.init(0, 0, 0);
        document.getElementById('soc-init').value = 93;
        document.getElementById('soc-init-value').textContent = '93%';
        document.getElementById('ems-version').value = 'v1';
        document.getElementById('cloud-count').value = 0;
        document.getElementById('cloud-count-value').textContent = '0';
        break;

      case 'perbaikan-v2':
        state.sun = 1.0;
        state.soc = 0.93;
        state.eBat = 0.93 * C.E_BAT_MAX;
        state.emsVersion = 'v2';
        Weather.init(0, 0, 0);
        document.getElementById('soc-init').value = 93;
        document.getElementById('soc-init-value').textContent = '93%';
        document.getElementById('ems-version').value = 'v2';
        document.getElementById('cloud-count').value = 0;
        document.getElementById('cloud-count-value').textContent = '0';
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
    setText('info-vbat', state.vBat.toFixed(2) + ' V');
    setText('info-soc', (state.soc * 100).toFixed(1) + '%');
    setText('info-mode', state.mode);
    var relayStr = '';
    if (state.relay.ch1) relayStr += 'CH1 ';
    if (state.relay.ch2) relayStr += 'CH2 ';
    if (state.relay.ch3) relayStr += 'CH3 ';
    if (state.relay.ch4) relayStr += 'CH4 ';
    setText('info-relay', relayStr || '-');
    setText('info-pel', state.relay.ch2 ? (C.V_EL * C.I_EL).toFixed(1) + ' W' : '0 W');
    setText('info-h2', state.h2.toFixed(1) + ' mL');
    setText('info-o2', state.o2.toFixed(1) + ' mL');
    setText('info-pfc', (state.pFC || 0).toFixed(2) + ' W');
    setText('info-h2remain', state.h2.toFixed(1) + ' mL');
    setText('info-epv', state.eDay.pv.toFixed(3) + ' Wh');
    setText('info-eload', state.eDay.load.toFixed(3) + ' Wh');
    setText('info-eh2', state.eDay.h2chem.toFixed(3) + ' Wh');
    setText('info-time', formatTime(state.t));
  }

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
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
