/**
 * renderer.js — Menggambar semua 12 objek di kanvas
 * Sumber: README §4, §5, §8
 */
(function() {
  'use strict';

  var C = window.Config;
  var reducedMotion = false;

  try {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch(e) {}

  var animTime = 0;

  /**
   * Gambar utama
   */
  function draw(ctx, state) {
    animTime += 1/60;
    var w = C.CANVAS_W;
    var h = C.CANVAS_H;

    // === Latar belakang langit ===
    var skyBright = 0.3 + 0.7 * state.sun * state.tCloud;
    var skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
    skyGrad.addColorStop(0, hsl(210, 70, 15 + 55 * skyBright));
    skyGrad.addColorStop(1, hsl(200, 50, 20 + 40 * skyBright));
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // === 1. Matahari ===
    drawSun(ctx, state);

    // === Awan ===
    drawClouds(ctx, state);

    // === Latar daratan ===
    drawGround(ctx, state);

    // === 1. Waduk mini + 2. Panel terapung ===
    drawReservoirAndPanel(ctx, state);

    // === 7. Kotak kontrol IoT ===
    drawIoTBox(ctx, state);

    // === 3. Baterai ===
    drawBattery(ctx, state);

    // === 6. Lampu LED ===
    drawLamp(ctx, state);

    // === 11. Elektroliser + Tabung ===
    drawElectrolyzer(ctx, state);

    // === 12. Fuel Cell ===
    drawFuelCell(ctx, state);

    // === 8 & 9. Dashboard laptop & ponsel ===
    drawDashboards(ctx, state);

    // === PLN box (cadangan) ===
    drawPLN(ctx, state);

    // === Kabel dan partikel ===
    Particles.draw(ctx, state.flows, state.particlesOn);

    // === Tag daya ===
    if (state.tagOn) {
      drawPowerTags(ctx, state);
    }

    // === Label komponen ===
    if (state.labelsOn) {
      drawLabels(ctx);
    }
  }

  // === Helper HSL ===
  function hsl(h, s, l) {
    return 'hsl(' + h + ',' + s + '%,' + l + '%)';
  }

  // ============ 1. MATAHARI ============
  function drawSun(ctx, state) {
    var sx = 140, sy = 70;
    var intensity = state.sun;

    if (intensity <= 0.02) {
      ctx.beginPath();
      ctx.arc(sx, sy, 27, 0, Math.PI * 2);
      ctx.fillStyle = '#E5E7EB';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + 12, sy - 8, 25, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.fillText('MALAM', sx - 22, sy + 48);
      return;
    }

    var radius = 30 + intensity * 15;
    var glowAlpha = intensity * state.tCloud * 0.4;

    // Glow
    if (intensity > 0) {
      var glow = ctx.createRadialGradient(sx, sy, radius * 0.3, sx, sy, radius * 3);
      glow.addColorStop(0, 'rgba(255, 220, 50, ' + glowAlpha + ')');
      glow.addColorStop(0.5, 'rgba(255, 180, 30, ' + (glowAlpha * 0.3) + ')');
      glow.addColorStop(1, 'rgba(255, 150, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 350, 250);
    }

    // Badan matahari
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    var sunGrad = ctx.createRadialGradient(sx - 5, sy - 5, 2, sx, sy, radius);
    sunGrad.addColorStop(0, '#FFF9C4');
    sunGrad.addColorStop(0.4, '#FFD54F');
    sunGrad.addColorStop(1, '#FF8F00');
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Sinar
    if (intensity > 0.1 && !reducedMotion) {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(animTime * 0.3);
      for (var i = 0; i < 12; i++) {
        ctx.rotate(Math.PI / 6);
        ctx.beginPath();
        ctx.moveTo(radius + 5, 0);
        ctx.lineTo(radius + 12 + intensity * 10, 0);
        ctx.strokeStyle = 'rgba(255, 200, 50, ' + (intensity * 0.6) + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // ============ AWAN ============
  function drawClouds(ctx, state) {
    var clouds = Weather.getClouds();
    for (var i = 0; i < clouds.length; i++) {
      var cl = clouds[i];
      ctx.save();
      ctx.translate(cl.x, cl.y);

      var alpha = 0.5 + cl.density * 0.45;
      ctx.fillStyle = 'rgba(220, 225, 235, ' + alpha + ')';

      // Awan dari beberapa elips
      ctx.beginPath();
      ctx.ellipse(0, 0, cl.rx, cl.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-cl.rx * 0.4, cl.ry * 0.15, cl.rx * 0.6, cl.ry * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cl.rx * 0.35, cl.ry * 0.1, cl.rx * 0.55, cl.ry * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-cl.rx * 0.15, -cl.ry * 0.5, cl.rx * 0.5, cl.ry * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cl.rx * 0.2, -cl.ry * 0.4, cl.rx * 0.4, cl.ry * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  // ============ DARATAN & AIR ============
  function drawGround(ctx, state) {
    var w = C.CANVAS_W, h = C.CANVAS_H;
    var groundY = 380;

    // Tanah
    var grdGrad = ctx.createLinearGradient(0, groundY, 0, h);
    grdGrad.addColorStop(0, '#4a7c59');
    grdGrad.addColorStop(0.3, '#3d6b4e');
    grdGrad.addColorStop(1, '#2d5a3f');
    ctx.fillStyle = grdGrad;
    ctx.fillRect(0, groundY, w, h - groundY);

    // Rumput di tepi
    ctx.fillStyle = '#5a9c6a';
    for (var i = 0; i < w; i += 8) {
      var gh = 3 + Math.sin(i * 0.1 + animTime) * 2;
      ctx.fillRect(i, groundY - gh, 4, gh);
    }
  }

  // ============ 1 & 2. WADUK + PANEL ============
  function drawReservoirAndPanel(ctx, state) {
    var rx = 35, ry = 245, rw = 270, rh = 165;

    // Waduk (kolam air)
    var waterGrad = ctx.createLinearGradient(rx, ry + 50, rx, ry + rh);
    var waterBright = 0.5 + state.sun * state.tCloud * 0.5;
    waterGrad.addColorStop(0, hsl(200, 60, 30 * waterBright + 20));
    waterGrad.addColorStop(1, hsl(210, 70, 20 * waterBright + 10));

    // Dinding waduk
    ctx.fillStyle = '#5C6B77';
    roundRect(ctx, rx - 5, ry + 45, rw + 10, rh - 30, 8);
    ctx.fill();

    // Air
    ctx.fillStyle = waterGrad;
    roundRect(ctx, rx, ry + 50, rw, rh - 40, 6);
    ctx.fill();

    // Gelombang air
    if (!reducedMotion) {
      ctx.strokeStyle = 'rgba(150, 210, 255, 0.25)';
      ctx.lineWidth = 1;
      for (var w = 0; w < 3; w++) {
        ctx.beginPath();
        for (var x = rx + 10; x < rx + rw - 10; x += 2) {
          var wy = ry + 80 + w * 25 + Math.sin(x * 0.03 + animTime * 2 + w) * 3;
          if (x === rx + 10) ctx.moveTo(x, wy);
          else ctx.lineTo(x, wy);
        }
        ctx.stroke();
      }
    }

    // Panel surya terapung
    var panelX = 90, panelY = 255;
    var panelW = 150, panelH = 60;
    var bob = reducedMotion ? 0 : Math.sin(animTime * 1.5) * 2;

    ctx.save();
    ctx.translate(panelX + panelW / 2, panelY + panelH / 2 + bob);
    ctx.rotate(-10 * Math.PI / 180); // miring 10°

    // Bingkai panel
    ctx.fillStyle = '#37474F';
    ctx.fillRect(-panelW / 2 - 3, -panelH / 2 - 3, panelW + 6, panelH + 6);

    // Sel surya
    var cellColor = state.pPV > 0
      ? hsl(220, 70, 25 + state.pPV * 5)
      : '#1a237e';
    ctx.fillStyle = cellColor;
    ctx.fillRect(-panelW / 2, -panelH / 2, panelW, panelH);

    // Grid sel
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.2)';
    ctx.lineWidth = 0.5;
    for (var gx = -panelW / 2; gx < panelW / 2; gx += panelW / 6) {
      ctx.beginPath();
      ctx.moveTo(gx, -panelH / 2);
      ctx.lineTo(gx, panelH / 2);
      ctx.stroke();
    }
    for (var gy = -panelH / 2; gy < panelH / 2; gy += panelH / 3) {
      ctx.beginPath();
      ctx.moveTo(-panelW / 2, gy);
      ctx.lineTo(panelW / 2, gy);
      ctx.stroke();
    }

    // Refleksi cahaya
    if (state.sun > 0.3 && state.tCloud > 0.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (state.sun * state.tCloud * 0.2) + ')';
      ctx.fillRect(-panelW / 2 + 5, -panelH / 2 + 3, panelW * 0.3, 4);
    }

    ctx.restore();

    // Pelampung
    ctx.fillStyle = '#F57F17';
    ctx.fillRect(panelX + 10, panelY + panelH + bob - 5, 20, 10);
    ctx.fillRect(panelX + panelW - 30, panelY + panelH + bob - 5, 20, 10);
  }

  // ============ 7. KOTAK IoT ============
  function drawIoTBox(ctx, state) {
    var bx = 335, by = 270, bw = 205, bh = 135;

    // Box body
    ctx.fillStyle = '#263238';
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.fill();
    ctx.strokeStyle = '#455A64';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 6);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#B0BEC5';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillText('IoT Control Box', bx + 10, by + 16);

    // ESP32
    ctx.fillStyle = '#1B5E20';
    roundRect(ctx, bx + 10, by + 25, 50, 30, 3);
    ctx.fill();
    ctx.fillStyle = '#A5D6A7';
    ctx.font = '8px monospace';
    ctx.fillText('ESP32', bx + 14, by + 44);

    // INA219 ×2
    ctx.fillStyle = '#4A148C';
    ctx.fillRect(bx + 70, by + 25, 35, 18);
    ctx.fillRect(bx + 70, by + 48, 35, 18);
    ctx.fillStyle = '#CE93D8';
    ctx.font = '7px monospace';
    ctx.fillText('INA219', bx + 72, by + 37);
    ctx.fillText('INA219', bx + 72, by + 60);

    // Relay CH1-CH4 indicators
    var relayLabels = ['CH1', 'CH2', 'CH3', 'CH4'];
    var relayStates = [state.relay.ch1, state.relay.ch2, state.relay.ch3, state.relay.ch4];
    for (var i = 0; i < 4; i++) {
      var rlx = bx + 115 + (i % 2) * 35;
      var rly = by + 25 + Math.floor(i / 2) * 30;
      // LED indicator
      ctx.beginPath();
      ctx.arc(rlx + 12, rly + 10, 6, 0, Math.PI * 2);
      var on = relayStates[i];
      ctx.fillStyle = on ? '#76FF03' : '#424242';
      ctx.fill();
      if (on) {
        ctx.shadowColor = '#76FF03';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.strokeStyle = '#616161';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Label
      ctx.fillStyle = on ? '#E0E0E0' : '#757575';
      ctx.font = '8px monospace';
      ctx.fillText(relayLabels[i], rlx + 3, rly + 26);
    }

    // TP4056 & buck/boost
    ctx.fillStyle = '#B71C1C';
    ctx.fillRect(bx + 10, by + 70, 40, 15);
    ctx.fillStyle = '#FFCDD2';
    ctx.font = '7px monospace';
    ctx.fillText('TP4056', bx + 12, by + 81);

    ctx.fillStyle = '#0D47A1';
    ctx.fillRect(bx + 55, by + 70, 35, 15);
    ctx.fillStyle = '#90CAF9';
    ctx.fillText('Boost', bx + 58, by + 81);

    ctx.fillStyle = '#E65100';
    ctx.fillRect(bx + 95, by + 70, 30, 15);
    ctx.fillStyle = '#FFCC80';
    ctx.fillText('Buck', bx + 97, by + 81);

    // Status EMS
    var modeColors = { 'NORMAL': '#4CAF50', 'SURPLUS': '#2196F3', 'DEFISIT': '#F44336' };
    ctx.fillStyle = modeColors[state.mode] || '#9E9E9E';
    roundRect(ctx, bx + 10, by + 95, 80, 16, 3);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('EMS: ' + state.mode, bx + 15, by + 107);
  }

  // ============ 3. BATERAI ============
  function drawBattery(ctx, state) {
    var bx = 395, by = 125, bw = 165, bh = 58;

    // Casing
    ctx.fillStyle = '#37474F';
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.fill();
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 5);
    ctx.stroke();

    // Terminal positif
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(bx + bw, by + 15, 8, 20);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText('+', bx + bw + 1, by + 30);

    // Isi baterai
    var fillW = (bw - 10) * state.soc;
    var socColor;
    if (state.soc > 0.5) socColor = '#4CAF50';
    else if (state.soc > 0.2) socColor = '#FFC107';
    else socColor = '#F44336';

    var batGrad = ctx.createLinearGradient(bx + 5, by, bx + 5, by + bh);
    batGrad.addColorStop(0, socColor);
    batGrad.addColorStop(1, darken(socColor, 30));
    ctx.fillStyle = batGrad;
    roundRect(ctx, bx + 5, by + 5, fillW, bh - 10, 3);
    ctx.fill();

    // Label
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(state.soc * 100) + '%', bx + bw / 2, by + bh / 2 + 4);
    ctx.textAlign = 'left';

    // Voltage
    ctx.fillStyle = '#B0BEC5';
    ctx.font = '9px Inter, sans-serif';
    ctx.fillText(state.vBat.toFixed(2) + ' V', bx + 5, by + bh + 14);
    ctx.fillText('Li-ion 3.7V 5.2Ah', bx + 5, by - 5);
  }

  // ============ 6. LAMPU LED ============
  function drawLamp(ctx, state) {
    var lx = 820, ly = 500;
    var lampPower = 0;
    if (state.lampOn && (state.relay.ch1 || state.relay.ch3 || state.relay.ch4)) {
      lampPower = state.lampPower;
    }

    // Glow
    if (lampPower > 0) {
      var glow = ctx.createRadialGradient(lx, ly, 5, lx, ly, 40);
      glow.addColorStop(0, 'rgba(255, 245, 157, 0.6)');
      glow.addColorStop(0.5, 'rgba(255, 235, 59, 0.2)');
      glow.addColorStop(1, 'rgba(255, 235, 59, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(lx - 50, ly - 50, 100, 100);
    }

    // Bulb shape
    ctx.beginPath();
    ctx.arc(lx, ly, 18, 0, Math.PI * 2);
    ctx.fillStyle = lampPower > 0 ? '#FFF9C4' : '#424242';
    ctx.fill();
    ctx.strokeStyle = '#9E9E9E';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Base
    ctx.fillStyle = '#757575';
    ctx.fillRect(lx - 8, ly + 16, 16, 8);
    ctx.fillRect(lx - 6, ly + 24, 12, 3);

    // Label
    ctx.fillStyle = lampPower > 0 ? '#FFF' : '#757575';
    ctx.font = '9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LED ' + (lampPower > 0 ? 'ON' : 'OFF'), lx, ly + 40);
    ctx.fillText(state.lampPower.toFixed(1) + ' W', lx, ly + 50);
    ctx.textAlign = 'left';
  }

  // ============ 11. ELEKTROLISER + TABUNG ============
  function drawElectrolyzer(ctx, state) {
    var ex = 870, ey = 180;

    // Elektroliser box
    ctx.fillStyle = '#1A237E';
    roundRect(ctx, ex, ey, 100, 55, 5);
    ctx.fill();
    ctx.strokeStyle = '#3F51B5';
    ctx.lineWidth = 1;
    roundRect(ctx, ex, ey, 100, 55, 5);
    ctx.stroke();

    ctx.fillStyle = '#E8EAF6';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('Elektroliser', ex + 10, ey + 18);
    ctx.fillText('→ Tabung H₂', ex + 10, ey + 30);
    ctx.font = '8px monospace';
    ctx.fillText(state.electrolyzerPower.toFixed(1) + ' W', ex + 10, ey + 42);

    // Indikator aktif
    if (state.relay.ch2) {
      ctx.beginPath();
      ctx.arc(ex + 85, ey + 15, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#76FF03';
      ctx.shadowColor = '#76FF03';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Tabung H₂
    drawTube(ctx, ex + 5, ey + 65, 35, 130, state.h2, state.h2Capacity, '#2196F3', 'H₂', state.relay.ch2);

    // Tabung O₂
    drawTube(ctx, ex + 55, ey + 65, 35, 130, state.o2, state.o2Capacity, '#F44336', 'O₂', state.relay.ch2);
  }

  function drawTube(ctx, x, y, w, h, volume, maxVol, color, label, bubbling) {
    // Gelas ukur
    ctx.fillStyle = 'rgba(200, 220, 255, 0.15)';
    ctx.strokeStyle = 'rgba(180, 200, 230, 0.5)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, w, h, 4);
    ctx.fill();
    roundRect(ctx, x, y, w, h, 4);
    ctx.stroke();

    // Air dalam tabung (di bawah)
    var gasRatio = volume / maxVol;
    var waterH = h * (1 - gasRatio);
    if (waterH > 2) {
      ctx.fillStyle = 'rgba(100, 160, 220, 0.4)';
      roundRect(ctx, x + 2, y + h - waterH, w - 4, waterH - 2, 2);
      ctx.fill();
    }

    // Gas (di atas)
    if (gasRatio > 0.01) {
      var gasH = h * gasRatio;
      var gasGrad = ctx.createLinearGradient(x, y, x, y + gasH);
      gasGrad.addColorStop(0, color + '40');
      gasGrad.addColorStop(1, color + '80');
      ctx.fillStyle = gasGrad;
      roundRect(ctx, x + 2, y + 2, w - 4, gasH, 2);
      ctx.fill();
    }

    // Gelembung saat aktif
    if (bubbling && !reducedMotion) {
      for (var i = 0; i < 3; i++) {
        var bx = x + 8 + Math.random() * (w - 16);
        var by2 = y + h - 10 - Math.random() * waterH * 0.8;
        ctx.beginPath();
        ctx.arc(bx, by2, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fill();
      }
    }

    // Skala
    ctx.strokeStyle = 'rgba(150,150,150,0.4)';
    ctx.lineWidth = 0.5;
    for (var s = 0; s <= 5; s++) {
      var sy = y + h - (s / 5) * h;
      ctx.beginPath();
      ctx.moveTo(x + w - 8, sy);
      ctx.lineTo(x + w - 2, sy);
      ctx.stroke();
    }

    // Label dan volume
    ctx.fillStyle = '#E0E0E0';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h + 14);
    ctx.font = '8px monospace';
    ctx.fillText(volume.toFixed(1) + ' mL', x + w / 2, y + h + 25);
    ctx.textAlign = 'left';
  }

  // ============ 12. FUEL CELL ============
  function drawFuelCell(ctx, state) {
    var fx = 1035, fy = 430, fw = 105, fh = 72;

    ctx.fillStyle = state.relay.ch3 ? '#1B5E20' : '#263238';
    roundRect(ctx, fx, fy, fw, fh, 5);
    ctx.fill();
    ctx.strokeStyle = state.relay.ch3 ? '#4CAF50' : '#455A64';
    ctx.lineWidth = 1.5;
    roundRect(ctx, fx, fy, fw, fh, 5);
    ctx.stroke();

    // Label
    ctx.fillStyle = state.relay.ch3 ? '#C8E6C9' : '#78909C';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('Fuel Cell', fx + 10, fy + 18);
    ctx.font = '8px monospace';
    ctx.fillText('← H₂ tabung', fx + 10, fy + 30);
    ctx.fillText('PEM 50%', fx + 10, fy + 42);

    if (state.relay.ch3) {
      ctx.fillStyle = '#A5D6A7';
      ctx.fillText(state.pFC.toFixed(2) + ' W', fx + 10, fy + 46);

      ctx.beginPath();
      ctx.arc(fx + fw - 12, fy + 12, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#76FF03';
      ctx.shadowColor = '#76FF03';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ============ 8 & 9. DASHBOARD ============
  function drawDashboards(ctx, state) {
    // Laptop
    var lx = 60, ly = 500;
    // Screen
    ctx.fillStyle = '#0D1B2A';
    roundRect(ctx, lx, ly, 130, 80, 4);
    ctx.fill();
    ctx.strokeStyle = '#546E7A';
    ctx.lineWidth = 1;
    roundRect(ctx, lx, ly, 130, 80, 4);
    ctx.stroke();
    // Keyboard base
    ctx.fillStyle = '#37474F';
    var kbPath = new Path2D();
    kbPath.moveTo(lx - 8, ly + 82);
    kbPath.lineTo(lx + 138, ly + 82);
    kbPath.lineTo(lx + 145, ly + 92);
    kbPath.lineTo(lx - 15, ly + 92);
    kbPath.closePath();
    ctx.fill(kbPath);

    // Dashboard content
    ctx.fillStyle = '#4FC3F7';
    ctx.font = 'bold 8px monospace';
    ctx.fillText('PLTS Dashboard', lx + 8, ly + 14);
    ctx.fillStyle = '#A5D6A7';
    ctx.font = '7px monospace';
    ctx.fillText('PV: ' + state.pPV.toFixed(2) + ' W', lx + 8, ly + 26);
    ctx.fillText('BAT: ' + (state.soc * 100).toFixed(1) + '%', lx + 8, ly + 36);
    ctx.fillText('V: ' + state.vBat.toFixed(2) + ' V', lx + 8, ly + 46);
    ctx.fillText('H₂: ' + state.h2.toFixed(1) + ' mL', lx + 8, ly + 56);
    ctx.fillStyle = state.mode === 'DEFISIT' ? '#F44336' : state.mode === 'SURPLUS' ? '#2196F3' : '#4CAF50';
    ctx.fillText('Mode: ' + state.mode, lx + 8, ly + 66);

    // Energy bar on dashboard
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(lx + 80, ly + 20, 40, 50);
    // PV bar
    var pvH = Math.min(1, state.pPV / 5) * 45;
    ctx.fillStyle = '#FFD54F';
    ctx.fillRect(lx + 83, ly + 65 - pvH, 10, pvH);
    // BAT bar
    var batH = state.soc * 45;
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(lx + 96, ly + 65 - batH, 10, batH);
    // H2 bar
    var h2H = (state.h2 / state.h2Capacity) * 45;
    ctx.fillStyle = '#42A5F5';
    ctx.fillRect(lx + 109, ly + 65 - h2H, 8, h2H);

  }

  // ============ PLN ============
  function drawPLN(ctx, state) {
    var px = 1040, py = 570, pw = 90, ph = 40;

    ctx.fillStyle = state.relay.ch4 ? '#F57F17' : '#37474F';
    roundRect(ctx, px, py, pw, ph, 4);
    ctx.fill();
    ctx.strokeStyle = state.relay.ch4 ? '#FFB300' : '#546E7A';
    ctx.lineWidth = 1;
    roundRect(ctx, px, py, pw, ph, 4);
    ctx.stroke();

    ctx.fillStyle = state.relay.ch4 ? '#FFF' : '#78909C';
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillText('PLN', px + 8, py + 15);
    ctx.font = '7px monospace';
    ctx.fillText(state.relay.ch4 ? 'Aktif ' + state.pPLN.toFixed(1) + ' W' : 'Siaga', px + 8, py + 27);
  }

  // ============ TAG DAYA ============
  function drawPowerTags(ctx, state) {
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.textAlign = 'center';

    var tags = [
      { x: 285, y: 275, val: state.pPV, label: 'PV', color: '#FFD54F' },
      { x: 430, y: 235, val: Math.abs(state.pNet), label: state.pNet >= 0 ? '→BAT' : 'BAT→', color: '#4CAF50' },
      { x: 700, y: 430, val: state.flows.w3, label: 'LED', color: '#FFF9C4' },
      { x: 700, y: 240, val: state.flows.w4, label: 'EL', color: '#42A5F5' },
      { x: 1010, y: 465, val: state.flows.w6, label: 'FC', color: '#A5D6A7' },
    ];

    for (var i = 0; i < tags.length; i++) {
      var tag = tags[i];
      if (tag.val < 0.05) continue;

      // Background
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      roundRect(ctx, tag.x - 28, tag.y - 12, 56, 16, 3);
      ctx.fill();

      ctx.fillStyle = tag.color;
      ctx.fillText(tag.val.toFixed(2) + ' W', tag.x, tag.y);
    }
    ctx.textAlign = 'left';
  }

  // ============ LABEL KOMPONEN ============
  function drawLabels(ctx) {
    ctx.font = '9px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    var labels = [
      { x: 130, y: 55, text: '① Matahari' },
      { x: 60, y: 225, text: '① Waduk + ② Panel Surya' },
      { x: 335, y: 260, text: '④⑤⑦ Kotak IoT (ESP32, INA219, Relay)' },
      { x: 395, y: 115, text: '③ Baterai Li-ion' },
      { x: 790, y: 550, text: '⑥ Lampu LED' },
      { x: 865, y: 165, text: '⑪ Elektroliser' },
      { x: 1035, y: 520, text: '⑫ Fuel Cell' },
      { x: 60, y: 490, text: '⑧ Laptop' },
      { x: 245, y: 490, text: '⑨ Ponsel' },
    ];
    for (var i = 0; i < labels.length; i++) {
      ctx.fillText(labels[i].text, labels[i].x, labels[i].y);
    }
  }

  // ============ UTIL ============
  function roundRect(ctx, x, y, w, h, r) {
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

  function darken(hex, amount) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  window.Renderer = {
    draw: draw
  };

})();
