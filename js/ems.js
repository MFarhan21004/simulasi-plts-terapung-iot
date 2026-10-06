/**
 * ems.js — Energy Management System v1 dan v2
 * Sumber: README §6.5
 */
(function() {
  'use strict';

  var C = window.Config;

  // State internal EMS
  var deficitTimer = 0;  // akumulasi waktu di bawah DEFICIT_V
  var lastMode = 'NORMAL';

  function reset() {
    deficitTimer = 0;
    lastMode = 'NORMAL';
  }

  /**
   * EMS v2 (default, histeresis) — Lampiran 2 LKM-3
   */
  function stepV2(state, dt) {
    var v = state.vBat;
    var th = C.EMS_V2;
    var baseLoad = C.P_ESP + (state.lampOn ? state.lampPower : 0);
    var lowSolar = state.pPV <= baseLoad;
    var gridNeeded = lowSolar && state.soc <= th.GRID_SOC;
    var powerSurplus = state.pPV > baseLoad + state.electrolyzerPower;
    var loadCoveredBySolar = state.pPV >= baseLoad;

    // Status penuh harus mengikuti volume aktual setelah H₂ dipakai fuel cell.
    state.h2Full = state.h2 >= state.h2Capacity;

    // Saat matahari kembali cukup untuk beban utama, lepas dari sumber malam.
    if (state.mode === 'DEFISIT' && loadCoveredBySolar) {
      state.mode = powerSurplus && !state.h2Full ? 'SURPLUS' : 'NORMAL';
      state.relay.ch1 = true;
      state.relay.ch2 = powerSurplus && !state.h2Full;
      state.relay.ch3 = false;
      state.relay.ch4 = false;
      deficitTimer = 0;
      return;
    }

    switch (state.mode) {
      case 'NORMAL':
        state.relay.ch3 = false;
        state.relay.ch4 = false;
        // Cek surplus
        if (powerSurplus) {
          if (!state.h2Full && state.h2 < state.h2Capacity) {
            state.mode = 'SURPLUS';
            state.relay.ch2 = true;
          }
        }
        // Cek defisit
        if (!loadCoveredBySolar && (v <= th.DEFICIT_V || gridNeeded)) {
          deficitTimer += dt;
          if (deficitTimer >= th.DEFICIT_DELAY) {
            state.mode = 'DEFISIT';
            if (state.h2 >= th.DEFICIT_H2) {
              state.relay.ch3 = true;
              state.relay.ch4 = false;
              state.relay.ch1 = false;
            } else {
              state.relay.ch3 = false;
              state.relay.ch4 = true;
              state.relay.ch1 = false;
            }
          }
        } else {
          deficitTimer = 0;
        }
        break;

      case 'SURPLUS':
        // Elektroliser aktif
        state.relay.ch2 = true;
        state.relay.ch3 = false;
        state.relay.ch4 = false;
        // Keluar dari surplus jika tegangan turun
        if (!powerSurplus || state.h2 >= state.h2Capacity) {
          state.mode = 'NORMAL';
          state.relay.ch2 = false;
          if (state.h2 >= state.h2Capacity) {
            state.h2Full = true;
          }
        }
        // Cek defisit bahkan saat surplus (kasus edge)
        if (!loadCoveredBySolar && (v <= th.DEFICIT_V || gridNeeded)) {
          deficitTimer += dt;
          if (deficitTimer >= th.DEFICIT_DELAY) {
            state.mode = 'DEFISIT';
            state.relay.ch2 = false;
            if (state.h2 >= th.DEFICIT_H2) {
              state.relay.ch3 = true;
            } else {
              state.relay.ch4 = true;
            }
          }
        } else {
          deficitTimer = 0;
        }
        break;

      case 'DEFISIT':
        // Fuel cell atau PLN sedang memasok
        state.relay.ch1 = false;
        state.relay.ch2 = false;
        // Cek jika H₂ habis dan masih pakai fuel cell
        if (state.relay.ch3 && state.h2 < 0.1) {
          state.relay.ch3 = false;
          state.relay.ch4 = true;
        }
        // Kembali ke normal jika tegangan cukup
        if (v >= th.NORMAL_V && !gridNeeded) {
          state.mode = 'NORMAL';
          state.relay.ch1 = true;
          state.relay.ch3 = false;
          state.relay.ch4 = false;
          deficitTimer = 0;
        }
        break;
    }
  }

  /**
   * EMS v1 (tanpa histeresis, pembanding)
   */
  function stepV1(state, dt) {
    var v = state.vBat;
    var th = C.EMS_V1;
    var baseLoad = C.P_ESP + (state.lampOn ? state.lampPower : 0);

    if (state.pPV >= baseLoad) {
      state.mode = state.pPV > baseLoad + state.electrolyzerPower && state.h2 < state.h2Capacity
        ? 'SURPLUS'
        : 'NORMAL';
      state.relay.ch1 = true;
      state.relay.ch2 = state.mode === 'SURPLUS';
      state.relay.ch3 = false;
      state.relay.ch4 = false;
      return;
    }

    // Elektroliser: ON jika V ≥ 4.1V, OFF jika di bawah (tanpa histeresis!)
    if (v >= th.SURPLUS_V && state.pPV > baseLoad + state.electrolyzerPower && state.h2 < state.h2Capacity) {
      state.relay.ch2 = true;
      state.mode = 'SURPLUS';
    } else {
      state.relay.ch2 = false;
      if (state.mode === 'SURPLUS') state.mode = 'NORMAL';
    }

    // Defisit: V < 3.5V tanpa tundaan, tanpa cek stok H₂
    if (v < th.DEFICIT_V) {
      state.mode = 'DEFISIT';
      state.relay.ch2 = false;
      if (state.h2 > 0.1) {
        state.relay.ch3 = true;
        state.relay.ch4 = false;
        state.relay.ch1 = false;
      } else {
        state.relay.ch3 = false;
        state.relay.ch4 = true;
        state.relay.ch1 = false;
      }
    } else if (state.mode === 'DEFISIT') {
      if (v >= 3.70) {
        state.mode = 'NORMAL';
        state.relay.ch1 = true;
        state.relay.ch3 = false;
        state.relay.ch4 = false;
      }
    }
  }

  /**
   * EMS step utama — pilih v1 atau v2
   */
  function step(state, dt) {
    // Relay CH1 default ON (lampu dari panel/baterai)
    if (state.mode === 'NORMAL' || state.mode === 'SURPLUS') {
      state.relay.ch1 = true;
    }

    if (state.emsVersion === 'v1') {
      stepV1(state, dt);
    } else {
      stepV2(state, dt);
    }

    // Pastikan relay konsisten
    if (!state.lampOn) {
      state.relay.ch1 = false;
    }
  }

  window.EMS = {
    step: step,
    reset: reset
  };

})();
