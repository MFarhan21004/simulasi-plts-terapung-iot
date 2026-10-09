/**
 * renderer.js — Menggambar 12 objek prototipe di kanvas
 *
 * Tata letak mengikuti diagram prototipe LKM-3 (README §4, §5, §8):
 *   ① waduk + ② panel  →  ④⑤⑦ kotak IoT  →  ③ baterai / ⑥ lampu
 *   →  ⑪ elektroliser (tabung H₂ & O₂)  →  ⑫ fuel cell  →  ⑧⑨ dasbor
 *
 * Semua koordinat komponen berasal dari Config.LAYOUT supaya renderer dan
 * particles.js memakai titik sambung yang sama.
 */
(function() {
  'use strict';

  var C = window.Config;
  var L = C.LAYOUT;

  var reducedMotion = false;
  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var animTime = 0;

  var FONT = 'Inter, "Segoe UI", system-ui, sans-serif';
  var MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

  // Palet tetap supaya seluruh komponen tampil sebagai satu sistem
  var PAL = {
    panelBg:    '#141C2B',
    panelBg2:   '#1B2638',
    stroke:     'rgba(148,176,214,0.28)',
    strokeSoft: 'rgba(148,176,214,0.16)',
    text:       '#E6EDF7',
    textDim:    '#93A6C0',
    yellow:     '#FFC94A',
    green:      '#4ADE80',
    blue:       '#4FC3F7',
    red:        '#F87171',
    grey:       '#9AA7B8'
  };

  // =====================================================================
  // GAMBAR UTAMA
  // =====================================================================
  function draw(ctx, state) {
    animTime += 1 / 60;
    var w = C.CANVAS_W, h = C.CANVAS_H;

    ctx.clearRect(0, 0, w, h);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    drawSky(ctx, state);
    drawSun(ctx, state);
    drawClouds(ctx, state);
    drawGround(ctx, state);

    // Kabel digambar di bawah komponen agar terlihat "tercolok"
    Particles.drawWires(ctx, state.flows);

    drawReservoirAndPanel(ctx, state);   // ① ②
    drawBattery(ctx, state);             // ③
    drawIoTBox(ctx, state);              // ④ ⑤ ⑦
    drawLamp(ctx, state);                // ⑥
    drawElectrolyzer(ctx, state);        // ⑪
    drawFuelCell(ctx, state);            // ⑫
    drawPLN(ctx, state);
    drawLaptop(ctx, state);              // ⑧
    drawPhone(ctx, state);               // ⑨

    // Partikel di atas komponen supaya arah aliran selalu terbaca
    Particles.drawParticles(ctx, state.flows, state.particlesOn);

    if (state.tagOn) drawPowerTags(ctx, state);
    if (state.labelsOn) drawLabels(ctx, state);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // =====================================================================
  // LANGIT, MATAHARI, AWAN, TANAH
  // =====================================================================
  function drawSky(ctx, state) {
    var w = C.CANVAS_W;
    var b = 0.28 + 0.72 * state.sun * state.tCloud;

    var g = ctx.createLinearGradient(0, 0, 0, L.HORIZON);
    g.addColorStop(0,    hsl(224, 46, 7 + 26 * b));
    g.addColorStop(0.55, hsl(212, 48, 11 + 34 * b));
    g.addColorStop(1,    hsl(201, 52, 16 + 40 * b));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, L.HORIZON);

    // Kabut tipis di garis cakrawala
    var haze = ctx.createLinearGradient(0, L.HORIZON - 70, 0, L.HORIZON);
    haze.addColorStop(0, 'rgba(255,236,196,0)');
    haze.addColorStop(1, 'rgba(255,236,196,' + (0.14 * b).toFixed(3) + ')');
    ctx.fillStyle = haze;
    ctx.fillRect(0, L.HORIZON - 70, w, 70);
  }

  function drawSun(ctx, state) {
    var sx = L.sun.x, sy = L.sun.y;
    var intensity = state.sun;

    if (intensity <= 0.02) {
      // Bulan
      ctx.beginPath();
      ctx.arc(sx, sy, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#DDE4EE';
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(sx + 13, sy - 8, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      chip(ctx, sx - 26, sy + 38, 'Malam', { dim: true });
      return;
    }

    var radius = 28 + intensity * 12;
    var glowA = intensity * state.tCloud * 0.45;

    var glow = ctx.createRadialGradient(sx, sy, radius * 0.3, sx, sy, radius * 3.4);
    glow.addColorStop(0, 'rgba(255,214,92,' + glowA.toFixed(3) + ')');
    glow.addColorStop(0.5, 'rgba(255,176,46,' + (glowA * 0.28).toFixed(3) + ')');
    glow.addColorStop(1, 'rgba(255,150,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 3.4, 0, Math.PI * 2);
    ctx.fill();

    if (intensity > 0.1 && !reducedMotion) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(animTime * 0.25);
      ctx.strokeStyle = 'rgba(255,205,80,' + (intensity * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 2.5;
      for (var i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(radius + 7, 0);
        ctx.lineTo(radius + 15 + intensity * 9, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    var body = ctx.createRadialGradient(sx - 6, sy - 7, 2, sx, sy, radius);
    body.addColorStop(0, '#FFF7CC');
    body.addColorStop(0.45, '#FFD95E');
    body.addColorStop(1, '#FF9D2E');
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();
  }

  function drawClouds(ctx, state) {
    var clouds = Weather.getClouds();
    for (var i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      ctx.save();
      ctx.translate(cl.x, cl.y);

      var alpha = 0.42 + cl.density * 0.42;
      var g = ctx.createLinearGradient(0, -cl.ry, 0, cl.ry * 1.4);
      g.addColorStop(0, 'rgba(244,248,255,' + alpha.toFixed(3) + ')');
      g.addColorStop(1, 'rgba(188,201,222,' + alpha.toFixed(3) + ')');
      ctx.fillStyle = g;

      var puffs = [
        [0, 0, cl.rx, cl.ry],
        [-cl.rx * 0.42, cl.ry * 0.18, cl.rx * 0.58, cl.ry * 0.78],
        [cl.rx * 0.38, cl.ry * 0.14, cl.rx * 0.54, cl.ry * 0.72],
        [-cl.rx * 0.16, -cl.ry * 0.52, cl.rx * 0.5, cl.ry * 0.62],
        [cl.rx * 0.22, -cl.ry * 0.42, cl.rx * 0.4, cl.ry * 0.55]
      ];
      for (var p = 0; p < puffs.length; p++) {
        ctx.beginPath();
        ctx.ellipse(puffs[p][0], puffs[p][1], puffs[p][2], puffs[p][3], 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawGround(ctx, state) {
    var w = C.CANVAS_W, h = C.CANVAS_H;
    var y = L.HORIZON;
    var b = 0.3 + 0.7 * state.sun * state.tCloud;

    var g = ctx.createLinearGradient(0, y, 0, h);
    g.addColorStop(0,   hsl(152, 24, 14 + 14 * b));
    g.addColorStop(0.4, hsl(150, 22, 11 + 10 * b));
    g.addColorStop(1,   hsl(148, 20, 8 + 6 * b));
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, h - y);

    // Garis cakrawala + rumput halus
    ctx.strokeStyle = 'rgba(168,214,184,' + (0.18 + 0.22 * b).toFixed(3) + ')';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();

    ctx.fillStyle = 'rgba(126,186,142,' + (0.2 + 0.2 * b).toFixed(3) + ')';
    for (var x = 0; x < w; x += 11) {
      var gh = 3 + Math.sin(x * 0.09 + (reducedMotion ? 0 : animTime)) * 2;
      ctx.fillRect(x, y - gh, 3, gh);
    }
  }

  // =====================================================================
  // ① WADUK MINI + ② PANEL SURYA TERAPUNG
  // =====================================================================
  function drawReservoirAndPanel(ctx, state) {
    var r = L.reservoir;
    var wTop = L.waterTop;
    var bright = 0.45 + state.sun * state.tCloud * 0.55;

    shadow(ctx, 18, 10);
    // Dinding wadah (akrilik)
    ctx.fillStyle = 'rgba(126,148,174,0.18)';
    roundRect(ctx, r.x - 7, r.y - 7, r.w + 14, r.h + 14, 12);
    ctx.fill();
    noShadow(ctx);

    ctx.strokeStyle = 'rgba(186,208,232,0.45)';
    ctx.lineWidth = 2;
    roundRect(ctx, r.x - 7, r.y - 7, r.w + 14, r.h + 14, 12);
    ctx.stroke();

    // Air
    var wg = ctx.createLinearGradient(0, wTop, 0, r.y + r.h);
    wg.addColorStop(0, hsl(197, 62, 26 + 24 * bright));
    wg.addColorStop(1, hsl(212, 66, 13 + 12 * bright));
    ctx.save();
    roundRect(ctx, r.x, wTop, r.w, r.y + r.h - wTop, 6);
    ctx.clip();
    ctx.fillStyle = wg;
    ctx.fillRect(r.x, wTop, r.w, r.y + r.h - wTop);

    // Riak
    ctx.strokeStyle = 'rgba(170,220,255,0.22)';
    ctx.lineWidth = 1.2;
    for (var k = 0; k < 4; k++) {
      ctx.beginPath();
      for (var x = r.x; x <= r.x + r.w; x += 4) {
        var t = reducedMotion ? 0 : animTime;
        var yy = wTop + 22 + k * 26 + Math.sin(x * 0.035 + t * 1.7 + k) * 3;
        if (x === r.x) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }

    // Pantulan matahari di air
    if (state.sun > 0.2) {
      var refl = ctx.createLinearGradient(0, wTop, 0, wTop + 60);
      refl.addColorStop(0, 'rgba(255,224,150,' + (0.22 * state.sun * state.tCloud).toFixed(3) + ')');
      refl.addColorStop(1, 'rgba(255,224,150,0)');
      ctx.fillStyle = refl;
      ctx.fillRect(r.x + 18, wTop, 70, 60);
    }
    ctx.restore();

    // Garis permukaan air
    ctx.strokeStyle = 'rgba(200,235,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(r.x, wTop);
    ctx.lineTo(r.x + r.w, wTop);
    ctx.stroke();

    // --- ② Panel surya terapung ---
    var p = L.panel;
    var bob = reducedMotion ? 0 : Math.sin(animTime * 1.4) * 2.2;

    // Pelampung (ponton)
    ctx.fillStyle = '#F2862A';
    roundRect(ctx, p.cx - 64, wTop - 6 + bob, 34, 13, 4); ctx.fill();
    roundRect(ctx, p.cx + 30, wTop - 6 + bob, 34, 13, 4); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(ctx, p.cx - 64, wTop + 2 + bob, 34, 5, 2); ctx.fill();
    roundRect(ctx, p.cx + 30, wTop + 2 + bob, 34, 5, 2); ctx.fill();

    // Rangka penopang
    ctx.strokeStyle = '#8899AA';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.cx - 48, wTop - 2 + bob); ctx.lineTo(p.cx - 44, p.cy + 18 + bob);
    ctx.moveTo(p.cx + 46, wTop - 2 + bob); ctx.lineTo(p.cx + 44, p.cy + 4 + bob);
    ctx.stroke();

    ctx.save();
    ctx.translate(p.cx, p.cy + bob);
    ctx.rotate(p.tilt * Math.PI / 180);

    shadow(ctx, 14, 8);
    ctx.fillStyle = '#2B3545';
    roundRect(ctx, -p.w / 2 - 4, -p.h / 2 - 4, p.w + 8, p.h + 8, 5);
    ctx.fill();
    noShadow(ctx);

    // Sel surya — makin terang saat daya naik
    var lit = Math.min(1, state.pPV / C.P_STC);
    var cg = ctx.createLinearGradient(-p.w / 2, -p.h / 2, p.w / 2, p.h / 2);
    cg.addColorStop(0, hsl(224, 68, 16 + lit * 16));
    cg.addColorStop(1, hsl(218, 62, 24 + lit * 20));
    ctx.fillStyle = cg;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);

    ctx.strokeStyle = 'rgba(210,225,245,0.22)';
    ctx.lineWidth = 1;
    for (var gx = 1; gx < 6; gx++) {
      var xx = -p.w / 2 + (p.w / 6) * gx;
      ctx.beginPath(); ctx.moveTo(xx, -p.h / 2); ctx.lineTo(xx, p.h / 2); ctx.stroke();
    }
    for (var gy = 1; gy < 3; gy++) {
      var yy2 = -p.h / 2 + (p.h / 3) * gy;
      ctx.beginPath(); ctx.moveTo(-p.w / 2, yy2); ctx.lineTo(p.w / 2, yy2); ctx.stroke();
    }

    // Kilau
    if (state.sun > 0.25 && state.tCloud > 0.4) {
      var sg = ctx.createLinearGradient(-p.w / 2, -p.h / 2, 0, p.h / 2);
      var a = (state.sun * state.tCloud * 0.3).toFixed(3);
      sg.addColorStop(0, 'rgba(255,255,255,' + a + ')');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w * 0.55, p.h);
    }
    ctx.restore();

    // Kotak sambung (junction box) tempat W1 berangkat
    ctx.fillStyle = '#2B3545';
    roundRect(ctx, 292, wTop - 10, 20, 18, 4); ctx.fill();
    ctx.strokeStyle = PAL.stroke; ctx.lineWidth = 1;
    roundRect(ctx, 292, wTop - 10, 20, 18, 4); ctx.stroke();
  }

  // =====================================================================
  // ④⑤⑦ KOTAK KONTROL IoT
  // =====================================================================
  function drawIoTBox(ctx, state) {
    var b = L.iot;

    shadow(ctx, 22, 12);
    panelFill(ctx, b.x, b.y, b.w, b.h, 12);
    noShadow(ctx);
    ctx.strokeStyle = PAL.stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.stroke();

    // Pelat dalam
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    roundRect(ctx, b.x + 8, b.y + 8, b.w - 16, b.h - 16, 8);
    ctx.fill();

    // Sekrup sudut
    ctx.fillStyle = 'rgba(190,205,225,0.35)';
    var sc = [[b.x + 13, b.y + 13], [b.x + b.w - 13, b.y + 13],
              [b.x + 13, b.y + b.h - 13], [b.x + b.w - 13, b.y + b.h - 13]];
    for (var s = 0; s < 4; s++) {
      ctx.beginPath(); ctx.arc(sc[s][0], sc[s][1], 2.6, 0, Math.PI * 2); ctx.fill();
    }

    // Terminal blok biru di tepi atas (seperti pada prototipe)
    for (var t = 0; t < 9; t++) {
      ctx.fillStyle = '#2D6FD1';
      roundRect(ctx, b.x + 24 + t * 23, b.y + 22, 17, 14, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(b.x + 30 + t * 23, b.y + 26, 5, 2);
    }

    // ⑤ INA219 ×2
    for (var i = 0; i < 2; i++) {
      var ix = L.ina.x, iy = L.ina.y + i * L.ina.gap;
      ctx.fillStyle = '#137A4A';
      roundRect(ctx, ix, iy, L.ina.w, L.ina.h, 3); ctx.fill();
      ctx.fillStyle = '#123C8C';
      roundRect(ctx, ix + 22, iy + 7, 18, 18, 2); ctx.fill();
      ctx.fillStyle = '#9FE3C0';
      ctx.font = '7px ' + MONO;
      ctx.fillText('INA219', ix + 3, iy + L.ina.h - 4);
      // Konektor sekrup
      ctx.fillStyle = '#1F5BB5';
      roundRect(ctx, ix + L.ina.w - 16, iy + 4, 13, 11, 2); ctx.fill();
    }

    // ④ ESP32
    var e = L.esp;
    ctx.fillStyle = '#15181F';
    roundRect(ctx, e.x, e.y, e.w, e.h, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(190,205,225,0.3)'; ctx.lineWidth = 1;
    roundRect(ctx, e.x, e.y, e.w, e.h, 5); ctx.stroke();
    // Pin header
    ctx.fillStyle = '#E0B23C';
    for (var pn = 0; pn < 9; pn++) {
      ctx.fillRect(e.x + 3, e.y + 6 + pn * 7.4, 4, 4);
      ctx.fillRect(e.x + e.w - 7, e.y + 6 + pn * 7.4, 4, 4);
    }
    // Pelindung logam + USB
    ctx.fillStyle = '#9AA7B8';
    roundRect(ctx, e.x + 13, e.y + 8, 26, 18, 2); ctx.fill();
    ctx.fillStyle = '#5A6476';
    roundRect(ctx, e.x + e.w / 2 - 9, e.y + e.h - 12, 18, 9, 2); ctx.fill();
    ctx.fillStyle = '#C9D6E8';
    ctx.font = 'bold 8px ' + MONO;
    ctx.textAlign = 'center';
    ctx.fillText('ESP32', e.x + e.w / 2, e.y + 44);
    ctx.textAlign = 'left';
    // LED daya ESP32 (selalu aktif — P_ESP)
    ctx.beginPath();
    ctx.arc(e.x + e.w - 13, e.y + e.h - 9, 2.6, 0, Math.PI * 2);
    ctx.fillStyle = '#FF5A5A'; ctx.fill();

    // ⑦ Modul relay 4 kanal
    var rl = L.relay;
    ctx.fillStyle = '#1B4FA8';
    roundRect(ctx, rl.x, rl.y, rl.w, rl.h, 4); ctx.fill();
    ctx.strokeStyle = 'rgba(190,205,225,0.25)'; ctx.lineWidth = 1;
    roundRect(ctx, rl.x, rl.y, rl.w, rl.h, 4); ctx.stroke();

    var chLabels = ['CH1', 'CH2', 'CH3', 'CH4'];
    var chOn = [state.relay.ch1, state.relay.ch2, state.relay.ch3, state.relay.ch4];
    for (var c = 0; c < 4; c++) {
      var cy = rl.y + 11 + c * 17;
      ctx.beginPath();
      ctx.arc(rl.x + 10, cy, 4.2, 0, Math.PI * 2);
      if (chOn[c]) {
        ctx.fillStyle = '#5BFF7A';
        ctx.shadowColor = '#5BFF7A';
        ctx.shadowBlur = 9;
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = '#2A3344';
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = chOn[c] ? '#EAF4FF' : 'rgba(234,244,255,0.42)';
      ctx.font = 'bold 7.5px ' + MONO;
      ctx.fillText(chLabels[c], rl.x + 19, cy + 3);
    }

    // Modul daya: TP4056 / boost / buck
    var mods = [
      { x: b.x + 16, w: 46, bg: '#9A2020', fg: '#FFD9D9', t: 'TP4056' },
      { x: b.x + 68, w: 40, bg: '#123C8C', fg: '#BBD6FF', t: 'Boost' },
      { x: b.x + 114, w: 36, bg: '#9A5208', fg: '#FFE0B8', t: 'Buck' }
    ];
    for (var m = 0; m < mods.length; m++) {
      ctx.fillStyle = mods[m].bg;
      roundRect(ctx, mods[m].x, b.y + 122, mods[m].w, 18, 3); ctx.fill();
      ctx.fillStyle = mods[m].fg;
      ctx.font = '7.5px ' + MONO;
      ctx.textAlign = 'center';
      ctx.fillText(mods[m].t, mods[m].x + mods[m].w / 2, b.y + 134);
      ctx.textAlign = 'left';
    }

    // Badge status EMS
    var modeCol = { NORMAL: '#22A95B', SURPLUS: '#1E78D8', DEFISIT: '#D93B3B' };
    var col = modeCol[state.mode] || '#5A6476';
    ctx.fillStyle = col;
    roundRect(ctx, b.x + 158, b.y + 120, 82, 22, 6); ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 9px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText('EMS ' + state.mode, b.x + 199, b.y + 134);
    ctx.textAlign = 'left';

    // Simbol WiFi di titik keluar W8
    drawWifi(ctx, 566, b.y - 4);
  }

  function drawWifi(ctx, x, y) {
    ctx.strokeStyle = 'rgba(129,214,168,0.75)';
    ctx.lineWidth = 2;
    for (var i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(x, y, i * 6, Math.PI * 1.22, Math.PI * 1.78);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y - 2, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(129,214,168,0.9)';
    ctx.fill();
  }

  // =====================================================================
  // ③ BATERAI Li-ion
  // =====================================================================
  function drawBattery(ctx, state) {
    var b = L.battery;

    shadow(ctx, 18, 10);
    panelFill(ctx, b.x, b.y, b.w, b.h, 9);
    noShadow(ctx);
    ctx.strokeStyle = PAL.stroke; ctx.lineWidth = 1.5;
    roundRect(ctx, b.x, b.y, b.w, b.h, 9); ctx.stroke();

    // Terminal
    ctx.fillStyle = '#E8533A';
    roundRect(ctx, b.x + b.w, b.y + 20, 9, 16, 2); ctx.fill();
    ctx.fillStyle = '#5A6476';
    roundRect(ctx, b.x - 9, b.y + 20, 9, 16, 2); ctx.fill();

    // Judul
    ctx.fillStyle = PAL.text;
    ctx.font = 'bold 10px ' + FONT;
    ctx.fillText('Li-ion 3,7 V · 5.200 mAh', b.x + 12, b.y + 19);

    // Bilah SOC
    var tx = b.x + 12, ty = b.y + 27, tw = b.w - 24, th = 20;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    roundRect(ctx, tx, ty, tw, th, 5); ctx.fill();

    var socCol = state.soc > 0.5 ? '#36C26A' : state.soc > 0.2 ? '#E8B13A' : '#E0564A';
    var fw = Math.max(0, Math.min(1, state.soc)) * (tw - 4);
    if (fw > 1) {
      var bg = ctx.createLinearGradient(tx, ty, tx, ty + th);
      bg.addColorStop(0, lighten(socCol, 26));
      bg.addColorStop(1, socCol);
      ctx.fillStyle = bg;
      roundRect(ctx, tx + 2, ty + 2, fw, th - 4, 4); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1;
    roundRect(ctx, tx, ty, tw, th, 5); ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText((state.soc * 100).toFixed(0) + '%', tx + tw / 2, ty + 14);
    ctx.textAlign = 'left';

    // Baris data
    ctx.font = '9px ' + MONO;
    ctx.fillStyle = PAL.textDim;
    ctx.fillText(state.vBat.toFixed(2) + ' V', b.x + 12, b.y + 63);
    var arrow = state.pNet > 0.01 ? '▲ isi' : state.pNet < -0.01 ? '▼ pakai' : '— diam';
    ctx.fillStyle = state.pNet > 0.01 ? PAL.green : state.pNet < -0.01 ? PAL.yellow : PAL.textDim;
    ctx.textAlign = 'right';
    ctx.fillText(arrow + '  ' + Math.abs(state.pNet).toFixed(2) + ' W', b.x + b.w - 12, b.y + 63);
    ctx.textAlign = 'left';
  }

  // =====================================================================
  // ⑥ LAMPU LED
  // =====================================================================
  function lampSource(state) {
    if (!state.lampOn) return null;
    if (state.relay.ch3) return 'fc';
    if (state.relay.ch4) return 'pln';
    if (state.relay.ch1) return 'bus';
    return null;
  }

  function drawLamp(ctx, state) {
    var l = L.lamp;
    var src = lampSource(state);
    var p = src === null ? 0 : (src === 'fc' ? state.pFC : state.lampPower);
    var lit = Math.min(1, p / Math.max(0.1, state.lampPower));

    if (p > 0.01) {
      var g = ctx.createRadialGradient(l.x, l.y, 3, l.x, l.y, 62);
      g.addColorStop(0, 'rgba(255,246,186,' + (0.65 * lit).toFixed(3) + ')');
      g.addColorStop(0.45, 'rgba(255,226,96,' + (0.2 * lit).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(255,226,96,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(l.x, l.y, 62, 0, Math.PI * 2); ctx.fill();
    }

    // Bohlam
    ctx.beginPath();
    ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2);
    if (p > 0.01) {
      var bg = ctx.createRadialGradient(l.x - 5, l.y - 6, 2, l.x, l.y, l.r);
      bg.addColorStop(0, '#FFFDE9');
      bg.addColorStop(1, mix('#FFE97A', '#5A6476', 1 - lit));
      ctx.fillStyle = bg;
    } else {
      ctx.fillStyle = '#39414F';
    }
    ctx.fill();
    ctx.strokeStyle = 'rgba(214,226,244,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Filamen
    ctx.strokeStyle = p > 0.01 ? 'rgba(220,150,40,0.85)' : 'rgba(150,162,180,0.5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(l.x - 7, l.y + 6);
    ctx.lineTo(l.x - 3, l.y - 5);
    ctx.lineTo(l.x + 1, l.y + 4);
    ctx.lineTo(l.x + 5, l.y - 5);
    ctx.lineTo(l.x + 8, l.y + 6);
    ctx.stroke();

    // Fitting
    ctx.fillStyle = '#7E8899';
    roundRect(ctx, l.x - 9, l.y + l.r - 3, 18, 10, 2); ctx.fill();
    ctx.fillStyle = '#5A6476';
    roundRect(ctx, l.x - 6, l.y + l.r + 7, 12, 5, 2); ctx.fill();

    // Status di bawah fitting
    var srcText = src === 'fc' ? 'dari fuel cell'
                : src === 'pln' ? 'dari PLN'
                : src === 'bus' ? 'dari panel/baterai' : 'padam';
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px ' + FONT;
    ctx.fillStyle = p > 0.01 ? '#FFEFA8' : PAL.textDim;
    ctx.fillText(p > 0.01 ? p.toFixed(2) + ' W' : 'OFF', l.x, l.y + 30);
    ctx.font = '8.5px ' + FONT;
    ctx.fillStyle = PAL.textDim;
    ctx.fillText(srcText, l.x, l.y + 42);
    ctx.textAlign = 'left';
  }

  // =====================================================================
  // ⑪ ELEKTROLISER + TABUNG H₂ / O₂
  // =====================================================================
  function drawElectrolyzer(ctx, state) {
    var e = L.elBox, ba = L.bath, th = L.tubeH2, to = L.tubeO2;
    var active = !!state.relay.ch2;

    // --- Bak air ---
    shadow(ctx, 16, 10);
    ctx.fillStyle = 'rgba(126,148,174,0.16)';
    roundRect(ctx, ba.x - 6, ba.y - 6, ba.w + 12, ba.h + 12, 10); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(186,208,232,0.42)'; ctx.lineWidth = 2;
    roundRect(ctx, ba.x - 6, ba.y - 6, ba.w + 12, ba.h + 12, 10); ctx.stroke();

    ctx.save();
    roundRect(ctx, ba.x, L.bathTop, ba.w, ba.y + ba.h - L.bathTop, 6);
    ctx.clip();
    var wg = ctx.createLinearGradient(0, L.bathTop, 0, ba.y + ba.h);
    wg.addColorStop(0, 'rgba(78,150,210,0.55)');
    wg.addColorStop(1, 'rgba(38,92,150,0.7)');
    ctx.fillStyle = wg;
    ctx.fillRect(ba.x, L.bathTop, ba.w, ba.h);
    ctx.restore();

    ctx.strokeStyle = 'rgba(200,235,255,0.45)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(ba.x, L.bathTop); ctx.lineTo(ba.x + ba.w, L.bathTop);
    ctx.stroke();

    // --- Kabel elektroda dari modul ke dalam tabung (hitam = katoda H₂, merah = anoda O₂) ---
    var leadY = ba.y + ba.h - 34;
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = active ? 'rgba(40,46,58,0.95)' : 'rgba(40,46,58,0.55)';
    ctx.beginPath();
    ctx.moveTo(e.x + 16, e.y + e.h);
    ctx.lineTo(ba.x + 12, e.y + e.h + 20);
    ctx.lineTo(ba.x + 12, leadY);
    ctx.lineTo(th.x + th.w / 2, leadY);
    ctx.stroke();

    ctx.strokeStyle = active ? 'rgba(216,66,58,0.95)' : 'rgba(216,66,58,0.55)';
    ctx.beginPath();
    ctx.moveTo(e.x + e.w - 16, e.y + e.h);
    ctx.lineTo(ba.x + ba.w - 12, e.y + e.h + 20);
    ctx.lineTo(ba.x + ba.w - 12, leadY);
    ctx.lineTo(to.x + to.w / 2, leadY);
    ctx.stroke();

    // Batang elektroda di dalam tabung
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#2A313D';
    ctx.beginPath();
    ctx.moveTo(th.x + th.w / 2, leadY); ctx.lineTo(th.x + th.w / 2, leadY - 42); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(to.x + to.w / 2, leadY); ctx.lineTo(to.x + to.w / 2, leadY - 42); ctx.stroke();

    // --- Tabung ---
    drawTube(ctx, th, state.h2, state.h2Capacity, '#4FC3F7', 'H₂', active, leadY);
    drawTube(ctx, to, state.o2, state.o2Capacity, '#F87171', 'O₂', active, leadY);

    // --- Modul elektroliser ---
    shadow(ctx, 18, 10);
    var g = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
    g.addColorStop(0, '#1D2A5E');
    g.addColorStop(1, '#131C40');
    ctx.fillStyle = g;
    roundRect(ctx, e.x, e.y, e.w, e.h, 10); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = active ? 'rgba(96,160,255,0.75)' : PAL.stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, e.x, e.y, e.w, e.h, 10); ctx.stroke();

    ctx.fillStyle = PAL.text;
    ctx.font = 'bold 11px ' + FONT;
    ctx.fillText('Elektroliser', e.x + 12, e.y + 21);
    ctx.font = '9px ' + FONT;
    ctx.fillStyle = PAL.textDim;
    ctx.fillText('H₂ : O₂ = 2 : 1   ·   2,0 V', e.x + 12, e.y + 36);
    ctx.font = 'bold 10px ' + MONO;
    ctx.fillStyle = active ? PAL.blue : PAL.textDim;
    ctx.fillText((active ? state.electrolyzerPower : 0).toFixed(2) + ' W', e.x + 12, e.y + 51);

    // Indikator aktif
    ctx.beginPath();
    ctx.arc(e.x + e.w - 17, e.y + 18, 5, 0, Math.PI * 2);
    if (active) {
      ctx.fillStyle = '#5BFF7A';
      ctx.shadowColor = '#5BFF7A'; ctx.shadowBlur = 9;
      ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#2A3344'; ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.font = '8px ' + FONT;
    ctx.fillStyle = PAL.textDim;
    ctx.textAlign = 'right';
    ctx.fillText('CH2', e.x + e.w - 12, e.y + 36);
    ctx.textAlign = 'left';
  }

  function drawTube(ctx, t, volume, maxVol, color, label, bubbling, leadY) {
    var ratio = Math.max(0, Math.min(1, volume / maxVol));
    var gasH = t.h * ratio;

    ctx.save();
    roundRect(ctx, t.x, t.y, t.w, t.h, 10);
    ctx.clip();

    // Air di dalam tabung — sengaja gelap agar kolom gas menonjol
    var wg2 = ctx.createLinearGradient(0, t.y + gasH, 0, t.y + t.h);
    wg2.addColorStop(0, 'rgba(26,62,102,0.92)');
    wg2.addColorStop(1, 'rgba(18,46,80,0.92)');
    ctx.fillStyle = wg2;
    ctx.fillRect(t.x, t.y + gasH, t.w, t.h - gasH);

    // Gas terkumpul di puncak tabung (tabung terbalik)
    if (gasH > 0.5) {
      var gg = ctx.createLinearGradient(0, t.y, 0, t.y + gasH);
      gg.addColorStop(0, hexA(color, 0.95));
      gg.addColorStop(1, hexA(color, 0.55));
      ctx.fillStyle = gg;
      ctx.fillRect(t.x, t.y, t.w, gasH);
      // Meniskus — batas gas/air
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(t.x, t.y + gasH); ctx.lineTo(t.x + t.w, t.y + gasH);
      ctx.stroke();
    }

    // Gelembung naik dari elektroda
    if (bubbling && !reducedMotion) {
      var cx = t.x + t.w / 2;
      for (var i = 0; i < 7; i++) {
        var seed = i * 1.7 + (label === 'O₂' ? 0.6 : 0);
        var span = leadY - 42 - (t.y + gasH);
        if (span <= 4) break;
        var prog = ((animTime * 0.55 + seed * 0.14) % 1);
        var by = (leadY - 42) - prog * span;
        var bx = cx + Math.sin(seed * 2.1 + animTime * 2) * (t.w * 0.26);
        ctx.beginPath();
        ctx.arc(bx, by, 1.8 + (i % 3) * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.55 * (1 - prog * 0.5)).toFixed(3) + ')';
        ctx.fill();
      }
    }

    // Kilau kaca
    var sh = ctx.createLinearGradient(t.x, 0, t.x + t.w, 0);
    sh.addColorStop(0, 'rgba(255,255,255,0.16)');
    sh.addColorStop(0.28, 'rgba(255,255,255,0.02)');
    sh.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.fillStyle = sh;
    ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.restore();

    // Dinding kaca
    ctx.strokeStyle = 'rgba(200,220,245,0.55)';
    ctx.lineWidth = 1.8;
    roundRect(ctx, t.x, t.y, t.w, t.h, 10);
    ctx.stroke();

    // Skala ukur
    ctx.strokeStyle = 'rgba(214,230,250,0.4)';
    ctx.lineWidth = 1;
    for (var s = 0; s <= 10; s++) {
      var sy = t.y + (t.h / 10) * s;
      var len = (s % 5 === 0) ? 9 : 5;
      ctx.beginPath();
      ctx.moveTo(t.x + t.w - 2, sy);
      ctx.lineTo(t.x + t.w - 2 - len, sy);
      ctx.stroke();
    }

    // Label satu baris tepat di atas tabung — menyisakan jalur bebas
    // di atasnya untuk pipa gas W5.
    var cx2 = t.x + t.w / 2;
    ctx.textAlign = 'right';
    ctx.font = 'bold 12px ' + FONT;
    ctx.fillStyle = color;
    ctx.fillText(label, cx2 + 1, t.y - 11);
    ctx.textAlign = 'left';
    ctx.font = 'bold 9px ' + MONO;
    ctx.fillStyle = PAL.text;
    ctx.fillText(volume.toFixed(1) + ' mL', cx2 + 6, t.y - 11);
  }

  // =====================================================================
  // ⑫ FUEL CELL
  // =====================================================================
  function drawFuelCell(ctx, state) {
    var f = L.fc;
    var on = !!state.relay.ch3;

    shadow(ctx, 18, 10);
    var g = ctx.createLinearGradient(f.x, f.y, f.x, f.y + f.h);
    g.addColorStop(0, on ? '#14532D' : '#1B2638');
    g.addColorStop(1, on ? '#0D3A20' : '#141C2B');
    ctx.fillStyle = g;
    roundRect(ctx, f.x, f.y, f.w, f.h, 10); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = on ? 'rgba(90,230,140,0.75)' : PAL.stroke;
    ctx.lineWidth = 1.5;
    roundRect(ctx, f.x, f.y, f.w, f.h, 10); ctx.stroke();

    // Sirip tumpukan sel (stack)
    ctx.strokeStyle = on ? 'rgba(144,240,180,0.45)' : 'rgba(148,176,214,0.2)';
    ctx.lineWidth = 2;
    for (var i = 0; i < 6; i++) {
      var sx = f.x + 12 + i * 8;
      ctx.beginPath();
      ctx.moveTo(sx, f.y + 36);
      ctx.lineTo(sx, f.y + 58);
      ctx.stroke();
    }

    ctx.fillStyle = on ? '#C8F7D8' : PAL.textDim;
    ctx.font = 'bold 11px ' + FONT;
    ctx.fillText('Fuel Cell', f.x + 11, f.y + 20);
    ctx.font = '8.5px ' + FONT;
    ctx.fillStyle = PAL.textDim;
    ctx.fillText('PEM · η 50%', f.x + 11, f.y + 32);
    ctx.textAlign = 'right';
    ctx.font = '8px ' + FONT;
    ctx.fillText('CH3', f.x + f.w - 11, f.y + 32);
    ctx.textAlign = 'left';

    ctx.font = 'bold 10px ' + MONO;
    ctx.fillStyle = on ? PAL.green : PAL.textDim;
    ctx.fillText((on ? state.pFC : 0).toFixed(2) + ' W', f.x + 11, f.y + 73);

    ctx.beginPath();
    ctx.arc(f.x + f.w - 15, f.y + 16, 5, 0, Math.PI * 2);
    if (on) {
      ctx.fillStyle = '#5BFF7A';
      ctx.shadowColor = '#5BFF7A'; ctx.shadowBlur = 9;
      ctx.fill(); ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = '#2A3344'; ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 1; ctx.stroke();
  }

  // =====================================================================
  // PLN (cadangan, CH4)
  // =====================================================================
  function drawPLN(ctx, state) {
    var p = L.pln;
    var on = !!state.relay.ch4;

    shadow(ctx, 14, 8);
    ctx.fillStyle = on ? '#6B4A0C' : PAL.panelBg;
    roundRect(ctx, p.x, p.y, p.w, p.h, 9); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = on ? 'rgba(240,190,80,0.75)' : PAL.strokeSoft;
    ctx.lineWidth = 1.5;
    roundRect(ctx, p.x, p.y, p.w, p.h, 9); ctx.stroke();

    ctx.fillStyle = on ? '#FFE9B8' : PAL.textDim;
    ctx.font = 'bold 11px ' + FONT;
    ctx.fillText('PLN', p.x + 11, p.y + 20);
    ctx.font = '8.5px ' + MONO;
    ctx.fillText(on ? state.pPLN.toFixed(2) + ' W' : 'siaga', p.x + 11, p.y + 36);

    ctx.font = '8px ' + FONT;
    ctx.fillStyle = PAL.textDim;
    ctx.textAlign = 'right';
    ctx.fillText('CH4', p.x + p.w - 11, p.y + 36);
    ctx.textAlign = 'left';
  }

  // =====================================================================
  // ⑧ DASBOR LAPTOP
  // =====================================================================
  function drawLaptop(ctx, state) {
    var d = L.laptop;

    // Alas
    ctx.fillStyle = '#39414F';
    ctx.beginPath();
    ctx.moveTo(d.x - 10, d.y + d.h + 2);
    ctx.lineTo(d.x + d.w + 10, d.y + d.h + 2);
    ctx.lineTo(d.x + d.w + 18, d.y + d.h + 12);
    ctx.lineTo(d.x - 18, d.y + d.h + 12);
    ctx.closePath();
    ctx.fill();

    shadow(ctx, 18, 10);
    ctx.fillStyle = '#2B3545';
    roundRect(ctx, d.x - 5, d.y - 5, d.w + 10, d.h + 10, 7); ctx.fill();
    noShadow(ctx);

    ctx.fillStyle = '#0B1220';
    roundRect(ctx, d.x, d.y, d.w, d.h, 4); ctx.fill();

    dashboardScreen(ctx, state, d.x, d.y, d.w, d.h, 'laptop');
  }

  // =====================================================================
  // ⑨ DASBOR PONSEL
  // =====================================================================
  function drawPhone(ctx, state) {
    var p = L.phone;

    shadow(ctx, 16, 9);
    ctx.fillStyle = '#2B3545';
    roundRect(ctx, p.x, p.y, p.w, p.h, 9); ctx.fill();
    noShadow(ctx);
    ctx.strokeStyle = 'rgba(190,205,225,0.3)'; ctx.lineWidth = 1;
    roundRect(ctx, p.x, p.y, p.w, p.h, 9); ctx.stroke();

    ctx.fillStyle = '#0B1220';
    roundRect(ctx, p.x + 4, p.y + 9, p.w - 8, p.h - 18, 4); ctx.fill();

    // Speaker & tombol
    ctx.fillStyle = 'rgba(190,205,225,0.4)';
    roundRect(ctx, p.x + p.w / 2 - 7, p.y + 4, 14, 2.5, 1.2); ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h - 5, 3, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(190,205,225,0.4)'; ctx.lineWidth = 1; ctx.stroke();

    dashboardScreen(ctx, state, p.x + 4, p.y + 9, p.w - 8, p.h - 18, 'phone');
  }

  /**
   * Isi layar dasbor ⑧/⑨ — angka yang sama dengan panel info di samping kanvas.
   * Tata letak dihitung dari tinggi layar supaya baris, badge mode, dan bilah
   * mini tidak pernah saling menimpa pada kedua ukuran perangkat.
   */
  function dashboardScreen(ctx, state, x, y, w, h, kind) {
    var small  = kind === 'phone';
    var pad    = small ? 5 : 10;
    var titleH = small ? 13 : 16;
    var rowFs  = small ? 6.5 : 7.5;
    var rowH   = small ? 12 : 13;
    var badgeH = small ? 11 : 14;
    var barH   = 5;

    var modeCol = state.mode === 'DEFISIT' ? PAL.red
                : state.mode === 'SURPLUS' ? PAL.blue : PAL.green;

    // Bar judul
    ctx.fillStyle = 'rgba(79,195,247,0.15)';
    ctx.fillRect(x, y, w, titleH);
    ctx.fillStyle = PAL.blue;
    ctx.font = 'bold ' + (small ? 6.5 : 8.5) + 'px ' + FONT;
    ctx.fillText(small ? 'PLTS IoT' : 'Monitoring PLTS + H₂', x + pad, y + titleH - 4);

    var rows = small
      ? [['PV',  state.pPV.toFixed(2) + ' W',                        PAL.yellow],
         ['SOC', (state.soc * 100).toFixed(0) + '%',                 PAL.green],
         ['H₂',  state.h2.toFixed(1) + ' mL',                        PAL.blue],
         ['FC',  state.pFC.toFixed(2) + ' W',                        PAL.green]]
      : [['V · I',   state.vPV.toFixed(2) + ' V · ' + state.iPV.toFixed(2) + ' A', PAL.yellow],
         ['P panel', state.pPV.toFixed(2) + ' W',                                  PAL.yellow],
         ['Baterai', (state.soc * 100).toFixed(0) + '% · ' + state.vBat.toFixed(2) + ' V', PAL.green],
         ['H₂ / O₂', state.h2.toFixed(1) + ' / ' + state.o2.toFixed(1) + ' mL',    PAL.blue]];

    var top = y + titleH + (small ? 9 : 11);
    ctx.font = rowFs + 'px ' + MONO;
    for (var i = 0; i < rows.length; i++) {
      var ry = top + i * rowH;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(147,166,192,0.95)';
      ctx.fillText(rows[i][0], x + pad, ry);
      ctx.textAlign = 'right';
      ctx.fillStyle = rows[i][2];
      ctx.fillText(rows[i][1], x + w - pad, ry);
    }
    ctx.textAlign = 'left';

    // Badge mode EMS
    var badgeY = y + h - barH - badgeH - 8;
    ctx.fillStyle = modeCol;
    roundRect(ctx, x + pad, badgeY, w - pad * 2, badgeH, 3);
    ctx.fill();
    ctx.fillStyle = '#06131F';
    ctx.font = 'bold ' + (small ? 6.5 : 8) + 'px ' + FONT;
    ctx.textAlign = 'center';
    ctx.fillText(state.mode, x + w / 2, badgeY + badgeH - (small ? 3 : 4));
    ctx.textAlign = 'left';

    // Bilah mini PV / SOC / H₂
    var barY = y + h - barH - 3;
    var bw   = w - pad * 2;
    var seg  = (bw - 8) / 3;
    var bars = [
      [state.pPV / C.P_STC,                       PAL.yellow],
      [state.soc,                                 PAL.green],
      [state.h2 / Math.max(1, state.h2Capacity),  PAL.blue]
    ];
    for (var b = 0; b < 3; b++) {
      var sx = x + pad + b * (seg + 4);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      roundRect(ctx, sx, barY, seg, barH, barH / 2); ctx.fill();
      ctx.fillStyle = bars[b][1];
      roundRect(ctx, sx, barY, Math.max(1.5, seg * clamp01(bars[b][0])), barH, barH / 2);
      ctx.fill();
    }
  }

  // =====================================================================
  // TAG DAYA (README §8)
  // =====================================================================
  function drawPowerTags(ctx, state) {
    var src = lampSource(state);
    var lampW = src === null ? 0 : (src === 'fc' ? state.pFC : state.lampPower);

    var tags = [
      { x: 322, y: 318, v: state.flows.w1, c: PAL.yellow },
      { x: 430, y: 440, v: state.flows.w2 + state.flows.w2r, c: state.flows.w2 > 0 ? PAL.green : PAL.yellow },
      { x: 646, y: 238, v: state.flows.w4, c: PAL.blue },
      { x: 612, y: 436, v: state.flows.w3, c: PAL.yellow },
      { x: 952, y: 306, v: state.flows.w5, c: PAL.blue },
      { x: 846, y: 568, v: src === 'fc' ? lampW : 0, c: PAL.green },
      { x: 788, y: 630, v: state.flows.w7, c: PAL.grey }
    ];

    ctx.font = 'bold 9.5px ' + MONO;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < tags.length; i++) {
      var t = tags[i];
      if (!t.v || t.v < 0.05) continue;
      var txt = t.v.toFixed(2) + ' W';
      var w = ctx.measureText(txt).width + 14;
      ctx.fillStyle = 'rgba(8,13,22,0.82)';
      roundRect(ctx, t.x - w / 2, t.y - 9, w, 18, 9); ctx.fill();
      ctx.strokeStyle = hexA(t.c, 0.45); ctx.lineWidth = 1;
      roundRect(ctx, t.x - w / 2, t.y - 9, w, 18, 9); ctx.stroke();
      ctx.fillStyle = t.c;
      ctx.fillText(txt, t.x, t.y + 0.5);
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }

  // =====================================================================
  // LABEL KOMPONEN ①–⑫
  // =====================================================================
  function drawLabels(ctx, state) {
    var labels = [
      { x: 50,   y: 250, t: '② Panel surya terapung 6 V 5 W' },
      { x: 50,   y: 276, t: '① Wadah air (waduk mini)' },
      { x: 346,  y: 206, t: '⑦ Kotak kontrol IoT' },
      { x: 346,  y: 228, t: '④ ESP32 (WiFi)  ·  ⑤ INA219 ×2' },
      { x: 368,  y: 470, t: '③ Baterai Li-ion 3,7 V' },
      { x: 560,  y: 556, t: '⑥ Lampu LED (beban)' },
      { x: 690,  y: 92,  t: '⑪ Elektroliser (H₂ : O₂ = 2 : 1)' },
      { x: 898,  y: 370, t: '⑫ Fuel cell (H₂ → listrik)' },
      { x: 1050, y: 358, t: '⑧ Dasbor laptop' },
      { x: 1046, y: 642, t: '⑨ Dasbor ponsel' }
    ];

    for (var i = 0; i < labels.length; i++) {
      chip(ctx, labels[i].x, labels[i].y, labels[i].t, {});
    }
  }

  /**
   * Pil label — selalu digambar paling akhir dengan latar pekat
   * agar tetap terbaca walau ada kabel yang melintas di belakangnya.
   */
  function chip(ctx, x, y, text, opt) {
    ctx.font = (opt.dim ? '9px ' : 'bold 9.5px ') + FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    var w = ctx.measureText(text).width + 18;
    var h = 19;
    ctx.fillStyle = 'rgba(10,16,26,0.9)';
    roundRect(ctx, x, y, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = 'rgba(148,176,214,0.35)'; ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, h / 2); ctx.stroke();
    ctx.fillStyle = opt.dim ? PAL.textDim : '#DCE7F6';
    ctx.fillText(text, x + 9, y + h / 2 + 0.5);
    ctx.textBaseline = 'alphabetic';
  }

  // =====================================================================
  // UTIL
  // =====================================================================
  function panelFill(ctx, x, y, w, h, r) {
    var g = ctx.createLinearGradient(x, y, x, y + h);
    g.addColorStop(0, PAL.panelBg2);
    g.addColorStop(1, PAL.panelBg);
    ctx.fillStyle = g;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();
  }

  function shadow(ctx, blur, dy) {
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = blur;
    ctx.shadowOffsetY = dy;
  }
  function noShadow(ctx) {
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function hsl(h, s, l) {
    return 'hsl(' + h + ',' + s + '%,' + Math.max(0, Math.min(100, l)) + '%)';
  }

  function hexA(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function lighten(hex, amt) {
    var r = Math.max(0, Math.min(255, parseInt(hex.slice(1, 3), 16) + amt));
    var g = Math.max(0, Math.min(255, parseInt(hex.slice(3, 5), 16) + amt));
    var b = Math.max(0, Math.min(255, parseInt(hex.slice(5, 7), 16) + amt));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function mix(hexA2, hexB, t) {
    t = Math.max(0, Math.min(1, t));
    var ar = parseInt(hexA2.slice(1, 3), 16), ag = parseInt(hexA2.slice(3, 5), 16), ab = parseInt(hexA2.slice(5, 7), 16);
    var br = parseInt(hexB.slice(1, 3), 16), bg = parseInt(hexB.slice(3, 5), 16), bb = parseInt(hexB.slice(5, 7), 16);
    return 'rgb(' + Math.round(ar + (br - ar) * t) + ',' +
                    Math.round(ag + (bg - ag) * t) + ',' +
                    Math.round(ab + (bb - ab) * t) + ')';
  }

  window.Renderer = { draw: draw };

})();
