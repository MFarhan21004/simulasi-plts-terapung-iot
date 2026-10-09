/**
 * particles.js — Jalur kabel W1–W8 dan partikel aliran energi
 * Sumber: README §8
 *
 * Titik kendali diambil dari Config.LAYOUT agar setiap ujung kabel
 * benar-benar menempel pada komponen yang dimaksud tabel §8:
 *   W1  Panel → INA219 #1 → bus kotak IoT      (P_pv > 0)
 *   W2  Bus → baterai (TP4056)                  (P_net > 0)
 *   W2′ Baterai → bus (boost 5 V)               (P_net < 0)
 *   W3  Bus → lampu (CH1)                       (sumber = panel/baterai)
 *   W4  Bus → elektroliser (CH2, buck 2,0 V)    (SURPLUS)
 *   W5  Tabung H₂ → fuel cell (jalur gas)       (DEFISIT, stok H₂ cukup)
 *   W6  Fuel cell → lampu (CH3)                 (DEFISIT, stok H₂ cukup)
 *   W7  PLN → lampu (CH4)                       (defisit, H₂ habis)
 *   W8  ESP32 ⇢ laptop/ponsel (WiFi)            (selalu)
 */
(function() {
  'use strict';

  var C = window.Config;
  var L = C.LAYOUT;

  var paths = {};        // polyline rapat hasil pelembutan
  var particles = {};
  var lengths = {};

  // Warna sesuai README §8: kuning = listrik, biru = H₂, abu-abu = PLN
  var COLORS = {
    w1:  '#FFC94A',
    w2:  '#4ADE80',
    w2r: '#FFC94A',
    w3:  '#FFC94A',
    w4:  '#FFC94A',
    w5:  '#4FC3F7',
    w6:  '#FFC94A',
    w7:  '#9AA7B8',
    w8:  '#81D6A8'
  };

  /**
   * Titik kendali tiap jalur (kasar). Dilembutkan oleh catmullRom().
   */
  function controlPoints() {
    var iot = L.iot, bat = L.battery, lamp = L.lamp;
    var el = L.elBox, th = L.tubeH2, fc = L.fc, pln = L.pln;

    var cp = {};

    // W1 — kotak sambung panel → sisi kiri kotak IoT
    cp.w1 = [
      { x: 306, y: L.waterTop - 2 },
      { x: 330, y: 330 },
      { x: iot.x, y: 318 }
    ];

    // W2 — bus (dasar kotak IoT) → terminal baterai
    cp.w2 = [
      { x: 430, y: iot.y + iot.h },
      { x: 430, y: 456 },
      { x: 430, y: bat.y }
    ];
    // W2′ — arah balik saat baterai mengosongkan
    cp.w2r = cp.w2.slice().reverse();

    // W3 — bus → lampu LED (CH1)
    cp.w3 = [
      { x: iot.x + iot.w, y: 374 },
      { x: 618, y: 430 },
      { x: 642, y: 470 },
      { x: lamp.x, y: lamp.y - lamp.r }
    ];

    // W4 — bus → modul elektroliser (CH2)
    cp.w4 = [
      { x: iot.x + iot.w, y: 302 },
      { x: 646, y: 238 },
      { x: el.x, y: el.y + el.h / 2 }
    ];

    // W5 — puncak tabung H₂ → fuel cell (jalur gas), lewat di atas tabung O₂
    cp.w5 = [
      { x: th.x + th.w, y: th.y + 8 },
      { x: 800, y: 206 },
      { x: 890, y: 202 },
      { x: 948, y: 292 },
      { x: 982, y: fc.y - 2 }
    ];

    // W6 — fuel cell → lampu LED (CH3), memutar di bawah bak elektroliser
    cp.w6 = [
      { x: fc.x, y: fc.y + 72 },
      { x: 884, y: 552 },
      { x: 800, y: 588 },
      { x: 716, y: 584 },
      { x: 668, y: 548 },
      { x: lamp.x + 9, y: lamp.y + lamp.r + 8 }
    ];

    // W7 — PLN → lampu LED (CH4), jalur paling bawah agar tidak berimpit W6
    cp.w7 = [
      { x: pln.x, y: pln.y + 26 },
      { x: 868, y: 612 },
      { x: 770, y: 634 },
      { x: 692, y: 620 },
      { x: 652, y: 562 },
      { x: lamp.x - 7, y: lamp.y + lamp.r + 13 }
    ];

    // W8 — ESP32 ⇢ dasbor laptop & ponsel (WiFi, garis titik)
    cp.w8 = [
      { x: 566, y: iot.y },
      { x: 612, y: 150 },
      { x: 676, y: 76 },
      { x: 1000, y: 64 },
      { x: 1114, y: 232 },
      { x: L.laptop.x + 66, y: L.laptop.y - 4 }
    ];

    return cp;
  }

  /**
   * Catmull-Rom: ubah titik kendali menjadi polyline rapat.
   * Partikel dan garis kabel memakai polyline yang sama persis,
   * sehingga partikel selalu tepat di atas kabel.
   */
  function catmullRom(pts, steps) {
    if (pts.length < 3) return pts.slice();
    var p = [pts[0]].concat(pts, [pts[pts.length - 1]]);
    var out = [];
    for (var i = 1; i < p.length - 2; i++) {
      var p0 = p[i - 1], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2];
      for (var s = 0; s < steps; s++) {
        var t = s / steps, t2 = t * t, t3 = t2 * t;
        out.push({
          x: 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t +
                    (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
                    (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
          y: 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t +
                    (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
                    (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
        });
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }

  function init() {
    var cp = controlPoints();
    paths = {};
    particles = {};
    lengths = {};
    var keys = Object.keys(cp);
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      paths[k] = catmullRom(cp[k], 14);
      lengths[k] = pathLength(paths[k]);
      particles[k] = { list: [], acc: 0 };
    }
  }

  function pathLength(path) {
    var len = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i].x - path[i - 1].x;
      var dy = path[i].y - path[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }

  function posOnPath(path, dist) {
    var acc = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i].x - path[i - 1].x;
      var dy = path[i].y - path[i - 1].y;
      var seg = Math.sqrt(dx * dx + dy * dy);
      if (acc + seg >= dist) {
        var t = seg > 0 ? (dist - acc) / seg : 0;
        return { x: path[i - 1].x + dx * t, y: path[i - 1].y + dy * t };
      }
      acc += seg;
    }
    return path[path.length - 1];
  }

  function flowOf(flows, key) {
    return flows && flows[key] ? flows[key] : 0;
  }

  /**
   * §8 — v = v0 + k·√P, jarak antarpartikel berbanding terbalik dengan P
   */
  function update(dtReal, flows) {
    var keys = Object.keys(paths);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var power = flowOf(flows, key);
      var bag = particles[key];

      if (power < 0.01) {
        bag.list.length = 0;
        bag.acc = 0;
        continue;
      }

      var speed = C.PARTICLE_V0 + C.PARTICLE_K * Math.sqrt(power);
      var spacing = Math.max(26, 86 - power * 16);
      var pLen = lengths[key];

      for (var j = bag.list.length - 1; j >= 0; j--) {
        bag.list[j] += speed * dtReal;
        if (bag.list[j] > pLen) bag.list.splice(j, 1);
      }

      bag.acc += speed * dtReal;
      while (bag.acc >= spacing) {
        bag.acc -= spacing;
        bag.list.push(0);
      }
    }
  }

  function tracePath(ctx, path) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (var i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
  }

  /**
   * Kabel: digambar sebelum komponen supaya terlihat tercolok.
   * Jalur aktif sedikit lebih terang daripada jalur siaga.
   */
  function drawWires(ctx, flows) {
    var keys = Object.keys(paths);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (key === 'w2r') continue;            // berimpit dengan W2
      var path = paths[key];
      var active = flowOf(flows, key) >= 0.01 ||
                   (key === 'w2' && flowOf(flows, 'w2r') >= 0.01);
      var wifi = key === 'w8';

      if (wifi) {
        ctx.setLineDash([5, 7]);
        ctx.strokeStyle = active ? 'rgba(129,214,168,0.45)' : 'rgba(129,214,168,0.18)';
        ctx.lineWidth = 1.4;
        tracePath(ctx, path);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }

      // Selubung kabel
      ctx.strokeStyle = 'rgba(6,10,18,0.55)';
      ctx.lineWidth = 6;
      tracePath(ctx, path);
      ctx.stroke();

      // Inti kabel
      ctx.strokeStyle = active
        ? hexA(COLORS[key], 0.5)
        : 'rgba(170,190,220,0.22)';
      ctx.lineWidth = 2.6;
      tracePath(ctx, path);
      ctx.stroke();
    }
  }

  /**
   * Partikel energi: digambar setelah komponen agar arah aliran jelas.
   */
  function drawParticles(ctx, flows, particlesOn) {
    if (!particlesOn) return;
    var keys = Object.keys(paths);

    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var power = flowOf(flows, key);
      if (power < 0.01) continue;

      var path = paths[key];
      var list = particles[key].list;
      var color = COLORS[key] || '#FFC94A';
      var r = key === 'w8' ? 2 : 3.2;

      for (var j = 0; j < list.length; j++) {
        var pos = posOnPath(path, list[j]);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
    ctx.shadowColor = 'transparent';
  }

  // Kompatibilitas: gambar kabel + partikel sekaligus
  function draw(ctx, flows, particlesOn) {
    drawWires(ctx, flows);
    drawParticles(ctx, flows, particlesOn);
  }

  function hexA(hex, a) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function getPaths() { return paths; }

  window.Particles = {
    init: init,
    update: update,
    draw: draw,
    drawWires: drawWires,
    drawParticles: drawParticles,
    getPaths: getPaths
  };

})();
