/**
 * physics.js — Model fisika: panel, baterai, elektroliser, fuel cell
 * Sumber: README §6.1–6.8
 */
(function() {
  'use strict';

  var C = window.Config;

  /**
   * Interpolasi linear pada tabel V_oc(SOC)
   */
  function vocFromSOC(soc) {
    var table = C.VOC_TABLE;
    if (soc <= table[0].soc) return table[0].v;
    if (soc >= table[table.length - 1].soc) return table[table.length - 1].v;
    for (var i = 0; i < table.length - 1; i++) {
      if (soc >= table[i].soc && soc <= table[i + 1].soc) {
        var t = (soc - table[i].soc) / (table[i + 1].soc - table[i].soc);
        return table[i].v + t * (table[i + 1].v - table[i].v);
      }
    }
    return 3.7;
  }

  /**
   * §6.1 — Hitung iradiansi efektif
   */
  function irradiance(state) {
    state.G = C.G_MAX * state.sun * state.tCloud;
  }

  /**
   * §6.2 — Hitung daya panel
   */
  function panelPower(state) {
    var G = state.G;
    if (G <= 0) {
      state.pPV = 0;
      state.vPV = 0;
      state.iPV = 0;
      return;
    }
    // Suhu sel
    var tCell = C.T_AMB + ((C.NOCT - 20) / 800) * G;
    // Daya panel dengan koreksi suhu
    var pPV = C.P_STC * (G / 1000) * C.PR * (1 - C.GAMMA * (tCell - 25));
    pPV = Math.max(0, pPV);
    state.pPV = pPV;
    state.tCell = tCell;
    // Tegangan dan arus ilustratif
    state.vPV = pPV > 0.001 ? C.V_PV_NOM : 0;
    state.iPV = pPV > 0.001 ? pPV / C.V_PV_NOM : 0;
  }

  /**
   * §6.3, §6.4, §6.5 — Neraca daya bus dan baterai
   * Harus dipanggil setelah EMS.step() agar relay sudah ditentukan
   */
  function busAndBattery(state, dt) {
    // Hitung beban listrik total
    var pLoad = C.P_ESP; // ESP32 selalu aktif
    if (state.lampOn && !state.relay.ch3 && !state.relay.ch4) {
      // Lampu dari panel/baterai (CH1)
      pLoad += C.P_LAMP;
    }
    // Elektroliser (CH2)
    var pElectrolyzer = 0;
    if (state.relay.ch2) {
      pElectrolyzer = C.V_EL * C.I_EL;
    }
    pLoad += pElectrolyzer;

    // Fuel cell memasok lampu langsung, tidak melalui baterai
    // Jadi beban fuel cell tidak masuk neraca baterai

    // Daya bersih ke baterai
    var pNet = state.pPV - pLoad;
    state.pNet = pNet;

    // Update energi baterai
    var dE;
    if (pNet >= 0) {
      dE = C.ETA_CHG * pNet * (dt / 3600); // Wh
    } else {
      dE = (pNet / C.ETA_DIS) * (dt / 3600); // Wh (negatif)
    }

    state.eBat += dE;
    state.eBat = Math.max(0, Math.min(C.E_BAT_MAX, state.eBat));
    state.soc = state.eBat / C.E_BAT_MAX;

    // Arus baterai (positif = mengisi, negatif = mengosongkan)
    var vOC = vocFromSOC(state.soc);
    var iBat = pNet >= 0
      ? (pNet > 0.001 ? pNet / vOC : 0)
      : (pNet / vOC);
    state.vBat = vOC + iBat * C.R_INT;
    state.vBat = Math.max(2.5, Math.min(4.3, state.vBat));
    state.iBat = iBat;
    state.vOC = vOC;

    // Daya jalur untuk partikel/visualisasi
    state.flows.w1 = state.pPV;
    state.flows.w2 = pNet > 0 ? pNet : 0;
    state.flows.w2r = pNet < 0 ? -pNet : 0;
    state.flows.w3 = (state.lampOn && !state.relay.ch3 && !state.relay.ch4) ? C.P_LAMP : 0;
    state.flows.w4 = pElectrolyzer;
    state.flows.w8 = C.P_ESP;
    state.flows.pLoad = pLoad;
    state.flows.pElectrolyzer = pElectrolyzer;
  }

  /**
   * §6.6 — Elektroliser (Hukum Faraday)
   */
  function electrolyzer(state, dt) {
    if (!state.relay.ch2) {
      state.flows.elActive = false;
      return;
    }
    state.flows.elActive = true;

    // Cek tabung penuh
    if (state.h2 >= C.H2_TUBE_MAX) {
      state.relay.ch2 = false;
      state.h2Full = true;
      state.flows.elActive = false;
      return;
    }

    // Hukum Faraday: n_H2 = η_F · I · t / (2F)
    var nH2 = state.etaF * C.I_EL * dt / (2 * C.F_CONST); // mol
    var vH2 = nH2 * C.V_M * 1000; // mL (V_M dalam L/mol × 1000)
    var vO2 = vH2 / 2;

    state.h2 += vH2;
    state.o2 += vO2;

    // Batasi
    if (state.h2 > C.H2_TUBE_MAX) {
      var excess = state.h2 - C.H2_TUBE_MAX;
      state.h2 = C.H2_TUBE_MAX;
      state.o2 -= excess / 2;
    }
    state.o2 = Math.max(0, Math.min(C.H2_TUBE_MAX, state.o2));
  }

  /**
   * §6.7 — Fuel Cell
   */
  function fuelCell(state, dt) {
    if (!state.relay.ch3) {
      state.pFC = 0;
      state.flows.w5 = 0;
      state.flows.w6 = 0;
      return;
    }

    // Fuel cell memasok beban lampu
    var pBeban = C.P_LAMP;
    var pFCin = pBeban / C.ETA_FC; // daya kimia yang dibutuhkan

    // Konsumsi H₂: n = P_in · dt / E_mol
    var nH2 = pFCin * (dt / 3600) / C.E_MOL_H2; // mol
    var vH2consumed = nH2 * C.V_M * 1000; // mL

    if (state.h2 < vH2consumed) {
      // H₂ habis
      vH2consumed = state.h2;
      nH2 = vH2consumed / (C.V_M * 1000);
      pBeban = nH2 * C.E_MOL_H2 * C.ETA_FC * (3600 / dt);
    }

    state.h2 -= vH2consumed;
    state.h2 = Math.max(0, state.h2);
    state.pFC = pBeban;

    state.flows.w5 = vH2consumed > 0.0001 ? pBeban : 0;
    state.flows.w6 = state.flows.w5;

    // Jika H₂ habis saat mode DEFISIT, EMS akan switch ke CH4
    if (state.h2 < 0.01 && state.relay.ch3) {
      state.h2Depleted = true;
    }
  }

  /**
   * §6.8 — Akumulasi energi harian
   */
  function accumulate(state, dt) {
    var dtH = dt / 3600; // konversi detik ke jam
    state.eDay.pv += state.pPV * dtH;
    state.eDay.load += state.flows.pLoad * dtH;
    if (state.relay.ch2) {
      state.eDay.h2chem += (C.V_EL * C.I_EL) * dtH;
    }
    if (state.relay.ch3) {
      state.eDay.fc += state.pFC * dtH;
    }
  }

  window.Physics = {
    irradiance: irradiance,
    panelPower: panelPower,
    busAndBattery: busAndBattery,
    electrolyzer: electrolyzer,
    fuelCell: fuelCell,
    accumulate: accumulate,
    vocFromSOC: vocFromSOC
  };

})();
