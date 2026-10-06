/**
 * particles.js — Partikel energi sepanjang kabel
 * Sumber: README §8
 */
(function() {
  'use strict';

  var C = window.Config;

  // Definisi jalur kabel (koordinat dalam canvas logis 1200×675)
  var paths = {};
  var particles = {};

  function definePaths() {
    // W1: Panel → IoT Box
    paths.w1 = [
      { x: 295, y: 300 }, { x: 330, y: 330 }
    ];
    // W2: IoT → Baterai (mengisi)
    paths.w2 = [
      { x: 430, y: 270 }, { x: 475, y: 185 }
    ];
    // W2': Baterai → IoT (mengosongkan)
    paths.w2r = [
      { x: 475, y: 185 }, { x: 430, y: 270 }
    ];
    // W3: IoT → Lampu
    paths.w3 = [
      { x: 505, y: 360 }, { x: 620, y: 385 }, { x: 740, y: 455 }, { x: 820, y: 500 }
    ];
    // W4: IoT → Elektroliser
    paths.w4 = [
      { x: 505, y: 320 }, { x: 650, y: 275 }, { x: 760, y: 235 }, { x: 870, y: 210 }
    ];
    // W5: Tabung H₂ → Fuel Cell (jalur gas)
    paths.w5 = [
      { x: 910, y: 375 }, { x: 955, y: 390 }, { x: 1000, y: 425 }, { x: 1035, y: 460 }
    ];
    // W6: Fuel Cell → Lampu
    paths.w6 = [
      { x: 1040, y: 465 }, { x: 990, y: 500 }, { x: 930, y: 545 }, { x: 860, y: 545 }, { x: 820, y: 500 }
    ];
    // W7: PLN → Lampu
    paths.w7 = [
      { x: 1080, y: 570 }, { x: 1010, y: 590 }, { x: 930, y: 590 }, { x: 860, y: 570 }, { x: 820, y: 500 }
    ];
    // W8: ESP → Laptop/Ponsel (WiFi)
    paths.w8 = [
      { x: 390, y: 300 }, { x: 300, y: 430 }, { x: 175, y: 500 }
    ];
  }

  /**
   * Inisialisasi partikel
   */
  function init() {
    definePaths();
    particles = {};
    var keys = Object.keys(paths);
    for (var i = 0; i < keys.length; i++) {
      particles[keys[i]] = [];
    }
  }

  /**
   * Hitung panjang total jalur
   */
  function pathLength(path) {
    var len = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i].x - path[i - 1].x;
      var dy = path[i].y - path[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  /**
   * Dapatkan posisi pada jalur berdasarkan jarak dari awal
   */
  function posOnPath(path, dist) {
    var acc = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i].x - path[i - 1].x;
      var dy = path[i].y - path[i - 1].y;
      var segLen = Math.sqrt(dx * dx + dy * dy);
      if (acc + segLen >= dist) {
        var t = (dist - acc) / segLen;
        return {
          x: path[i - 1].x + dx * t,
          y: path[i - 1].y + dy * t
        };
      }
      acc += segLen;
    }
    return path[path.length - 1];
  }

  /**
   * Update partikel setiap frame (menggunakan waktu nyata, bukan waktu simulasi)
   */
  function update(dtReal, flows) {
    var flowMap = {
      w1: flows.w1 || 0,
      w2: flows.w2 || 0,
      w2r: flows.w2r || 0,
      w3: flows.w3 || 0,
      w4: flows.w4 || 0,
      w5: flows.w5 || 0,
      w6: flows.w6 || 0,
      w7: flows.w7 || 0,
      w8: flows.w8 || 0
    };

    var keys = Object.keys(paths);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var power = flowMap[key];
      var path = paths[key];
      var pLen = pathLength(path);
      var pList = particles[key];

      if (power < 0.01) {
        // Tidak ada daya, hapus partikel
        particles[key] = [];
        continue;
      }

      // Kecepatan dan jarak antar partikel
      var speed = C.PARTICLE_V0 + C.PARTICLE_K * Math.sqrt(power);
      var spacing = Math.max(15, 80 - power * 15);

      // Gerakkan partikel
      for (var i = pList.length - 1; i >= 0; i--) {
        pList[i].dist += speed * dtReal;
        if (pList[i].dist > pLen) {
          pList.splice(i, 1);
        }
      }

      // Spawn partikel baru
      var lastDist = pList.length > 0 ? pList[pList.length - 1].spawnDist : -spacing;
      // Total jarak yang sudah di-spawn
      if (!particles[key]._spawnAcc) particles[key]._spawnAcc = 0;
      particles[key]._spawnAcc += speed * dtReal;

      if (particles[key]._spawnAcc >= spacing) {
        particles[key]._spawnAcc = 0;
        pList.push({
          dist: 0,
          spawnDist: 0
        });
      }
    }
  }

  /**
   * Gambar partikel
   */
  function draw(ctx, flows, particlesOn) {
    if (!particlesOn) return;

    var flowMap = {
      w1: flows.w1 || 0,
      w2: flows.w2 || 0,
      w2r: flows.w2r || 0,
      w3: flows.w3 || 0,
      w4: flows.w4 || 0,
      w5: flows.w5 || 0,
      w6: flows.w6 || 0,
      w7: flows.w7 || 0,
      w8: flows.w8 || 0
    };

    var colorMap = {
      w1: '#FFD700', // kuning listrik
      w2: '#FFD700',
      w2r: '#FFD700',
      w3: '#FFD700',
      w4: '#FFD700',
      w5: '#4FC3F7', // biru H₂
      w6: '#4FC3F7',
      w7: '#9E9E9E', // abu PLN
      w8: '#81C784'  // hijau WiFi
    };

    var keys = Object.keys(paths);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      if (flowMap[key] < 0.01) continue;

      var path = paths[key];
      var pList = particles[key];
      var color = colorMap[key] || '#FFD700';

      // Gambar jalur kabel
      ctx.beginPath();
      ctx.strokeStyle = key === 'w8' ? 'rgba(129,199,132,0.3)' : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = key === 'w8' ? 1 : 2;
      if (key === 'w8') ctx.setLineDash([4, 4]);
      ctx.moveTo(path[0].x, path[0].y);
      for (var i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Gambar partikel
      for (var j = 0; j < pList.length; j++) {
        var pos = posOnPath(path, pList[j].dist);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Kabel tetap terlihat meskipun sedang tidak dialiri energi.
    for (var b = 0; b < keys.length; b++) {
      var baseKey = keys[b];
      var basePath = paths[baseKey];
      ctx.beginPath();
      ctx.strokeStyle = baseKey === 'w8'
        ? 'rgba(129,199,132,0.18)'
        : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = baseKey === 'w8' ? 1 : 2;
      if (baseKey === 'w8') ctx.setLineDash([4, 4]);
      ctx.moveTo(basePath[0].x, basePath[0].y);
      for (var p = 1; p < basePath.length; p++) {
        ctx.lineTo(basePath[p].x, basePath[p].y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function getPaths() { return paths; }

  window.Particles = {
    init: init,
    update: update,
    draw: draw,
    getPaths: getPaths
  };

})();
