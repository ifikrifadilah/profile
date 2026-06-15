(() => {
  const scene = document.getElementById('scene');
  const canvas = document.getElementById('waterCanvas');
  const ctx = canvas.getContext('2d', { alpha: true });
  const tuneToggle = document.getElementById('tuneToggle');
  const tunePanel = document.getElementById('tunePanel');
  const restartBtn = document.getElementById('restartBtn');
  const cameraBtn = document.getElementById('cameraBtn');

  const controls = {
    sparkle: document.getElementById('sparkleRange'),
    ripple: document.getElementById('rippleRange'),
    petals: document.getElementById('petalRange'),
    light: document.getElementById('lightRange')
  };

  const state = {
    width: 0,
    height: 0,
    dpr: 1,
    time: 0,
    lastAutoRipple: 0,
    ripples: [],
    sparkles: [],
    petals: [],
    caustics: [],
    pointer: { x: 0.5, y: 0.5 }
  };

  const clamp01 = value => Math.max(0, Math.min(1, value));
  const rand = (min, max) => min + Math.random() * (max - min);
  const setting = key => Number(controls[key].value) / 100;

  function resize() {
    const rect = scene.getBoundingClientRect();
    state.width = rect.width;
    state.height = rect.height;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    seedCaustics();
  }

  function seedCaustics() {
    state.caustics = Array.from({ length: 18 }, (_, i) => ({
      x: rand(-0.12, 1.12),
      y: rand(-0.06, 1.06),
      amp: rand(8, 22),
      len: rand(90, 220),
      speed: rand(0.00018, 0.0005),
      phase: rand(0, Math.PI * 2),
      width: rand(0.9, 2.4),
      alpha: rand(0.10, 0.25),
      drift: i % 2 ? -1 : 1
    }));
  }

  function makeSparkle(x = rand(0, state.width), y = rand(0, state.height)) {
    state.sparkles.push({
      x,
      y,
      size: rand(2, 7),
      life: 0,
      maxLife: rand(900, 2400),
      phase: rand(0, Math.PI * 2),
      drift: rand(-0.12, 0.12)
    });
  }

  function makePetal() {
    const pink = Math.random() > 0.5;
    state.petals.push({
      x: rand(-20, state.width + 20),
      y: rand(-40, state.height + 40),
      r: rand(3, 8),
      rot: rand(0, Math.PI * 2),
      speed: rand(0.08, 0.28),
      sway: rand(0.2, 0.7),
      alpha: rand(0.16, 0.34),
      hue: pink ? '255, 204, 225' : '196, 247, 240'
    });
  }

  function addRipple(x, y, strength = 1) {
    const max = 72 + 120 * setting('ripple');
    state.ripples.push({
      x,
      y,
      r: 4,
      max,
      alpha: 0.52 * strength,
      speed: rand(0.58, 1.22) * (0.65 + setting('ripple')),
      wobble: rand(0, Math.PI * 2)
    });
    if (Math.random() < 0.75) makeSparkle(x + rand(-8, 8), y + rand(-8, 8));
  }

  function pointerPosition(event) {
    const rect = scene.getBoundingClientRect();
    const touch = event.touches?.[0] || event.changedTouches?.[0] || event;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    return { x, y };
  }

  let lastPointerRipple = 0;
  function handlePointer(event) {
    const { x, y } = pointerPosition(event);
    state.pointer.x = clamp01(x / state.width);
    state.pointer.y = clamp01(y / state.height);
    scene.style.setProperty('--mx', `${state.pointer.x * 100}%`);
    scene.style.setProperty('--my', `${state.pointer.y * 100}%`);
    const now = performance.now();
    if (now - lastPointerRipple > 70) {
      addRipple(x, y, 1.05);
      lastPointerRipple = now;
    }
  }

  function drawStar(x, y, size, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = alpha;
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 3.2);
    gradient.addColorStop(0, 'rgba(255,255,255,.98)');
    gradient.addColorStop(0.22, 'rgba(229,255,255,.74)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, size * 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.lineWidth = Math.max(0.7, size * 0.16);
    ctx.beginPath();
    ctx.moveTo(-size * 3.1, 0);
    ctx.lineTo(size * 3.1, 0);
    ctx.moveTo(0, -size * 3.1);
    ctx.lineTo(0, size * 3.1);
    ctx.stroke();
    ctx.rotate(Math.PI / 4);
    ctx.globalAlpha = alpha * 0.62;
    ctx.beginPath();
    ctx.moveTo(-size * 1.65, 0);
    ctx.lineTo(size * 1.65, 0);
    ctx.moveTo(0, -size * 1.65);
    ctx.lineTo(0, size * 1.65);
    ctx.stroke();
    ctx.restore();
  }

  function drawCaustics(dt) {
    const light = setting('light');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const line of state.caustics) {
      line.phase += dt * line.speed;
      const x = (line.x + Math.sin(line.phase * .33) * .02) * state.width;
      const y = (line.y + Math.cos(line.phase * .28) * .018) * state.height;
      const alpha = line.alpha * (0.45 + light * 1.25);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = line.width * (0.8 + light);
      ctx.shadowColor = `rgba(220,255,255,${alpha})`;
      ctx.shadowBlur = 6 + 16 * light;
      ctx.beginPath();
      const segments = 5;
      for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const px = x + (t - .5) * line.len;
        const py = y + Math.sin(t * Math.PI * 2 + line.phase * line.drift) * line.amp;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawRipples(dt) {
    const ripplePower = setting('ripple');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = state.ripples.length - 1; i >= 0; i--) {
      const r = state.ripples[i];
      r.r += r.speed * dt * 0.055;
      const life = clamp01(r.r / r.max);
      const alpha = r.alpha * (1 - life) * (0.25 + ripplePower * 0.95);
      if (life >= 1 || alpha <= 0.005) {
        state.ripples.splice(i, 1);
        continue;
      }
      for (let ring = 0; ring < 3; ring++) {
        const rr = r.r + ring * 13;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255,255,255,${alpha * (1 - ring * .25)})`;
        ctx.lineWidth = 1.0 + (1 - life) * 1.8;
        ctx.shadowColor = 'rgba(206,250,255,.8)';
        ctx.shadowBlur = 8;
        ctx.ellipse(
          r.x,
          r.y,
          rr * (1 + Math.sin(r.wobble + rr * .02) * .025),
          rr * (0.72 + Math.cos(r.wobble + rr * .018) * .022),
          Math.sin(r.wobble) * .16,
          0,
          Math.PI * 2
        );
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawSparkles(dt) {
    const sparklePower = setting('sparkle');
    const desired = Math.floor(16 + sparklePower * 70);
    if (state.sparkles.length < desired && Math.random() < 0.18 + sparklePower * 0.34) {
      makeSparkle();
    }
    for (let i = state.sparkles.length - 1; i >= 0; i--) {
      const s = state.sparkles[i];
      s.life += dt;
      s.y += Math.sin((state.time + s.phase) * 0.002) * 0.03;
      s.x += s.drift;
      const t = s.life / s.maxLife;
      const pulse = Math.sin(t * Math.PI) * (0.28 + sparklePower * .75);
      if (t >= 1) {
        state.sparkles.splice(i, 1);
      } else {
        drawStar(s.x, s.y, s.size, pulse);
      }
    }
  }

  function drawPetals(dt) {
    const petalPower = setting('petals');
    const desired = Math.floor(petalPower * 28);
    while (state.petals.length < desired) makePetal();
    while (state.petals.length > desired) state.petals.pop();

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (const p of state.petals) {
      p.y += p.speed * dt * 0.055;
      p.x += Math.sin(state.time * 0.0007 + p.rot) * p.sway;
      p.rot += 0.002 * dt;
      if (p.y > state.height + 48) {
        p.y = -48;
        p.x = rand(-20, state.width + 20);
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, .48);
      ctx.fillStyle = `rgba(${p.hue},${p.alpha})`;
      ctx.shadowColor = `rgba(${p.hue},0.55)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 1.35, p.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  function drawLightWash() {
    const light = setting('light');
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const x = state.pointer.x * state.width;
    const y = state.pointer.y * state.height;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(state.width, state.height) * .75);
    gradient.addColorStop(0, `rgba(255,255,255,${0.08 + light * .16})`);
    gradient.addColorStop(.42, `rgba(205,252,255,${0.025 + light * .06})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.restore();
  }

  let last = performance.now();
  function animate(now) {
    const dt = Math.min(34, now - last);
    last = now;
    state.time += dt;
    ctx.clearRect(0, 0, state.width, state.height);

    if (now - state.lastAutoRipple > 760 - setting('ripple') * 420) {
      addRipple(rand(state.width * .06, state.width * .94), rand(state.height * .08, state.height * .95), rand(.34, .68));
      state.lastAutoRipple = now;
    }

    drawLightWash();
    drawCaustics(dt);
    drawRipples(dt);
    drawPetals(dt);
    drawSparkles(dt);
    requestAnimationFrame(animate);
  }

  function restart() {
    state.ripples.length = 0;
    state.sparkles.length = 0;
    state.petals.length = 0;
    seedCaustics();
    for (let i = 0; i < 9; i++) {
      addRipple(rand(state.width * .12, state.width * .88), rand(state.height * .12, state.height * .9), rand(.34, .82));
    }
  }

  async function saveSnapshot() {
    const img = document.querySelector('.water-photo');
    const snap = document.createElement('canvas');
    const w = Math.floor(state.width * 2);
    const h = Math.floor(state.height * 2);
    snap.width = w;
    snap.height = h;
    const sctx = snap.getContext('2d');

    // Best-effort export: background image + current animation canvas.
    sctx.drawImage(img, 0, 0, w, h);
    sctx.drawImage(canvas, 0, 0, w, h);
    const link = document.createElement('a');
    link.download = 'eau-de-printemps-ripples.png';
    link.href = snap.toDataURL('image/png');
    link.click();
  }

  tuneToggle.addEventListener('click', () => {
    const open = !tunePanel.classList.contains('open');
    tunePanel.classList.toggle('open', open);
    tuneToggle.setAttribute('aria-expanded', String(open));
  });

  restartBtn.addEventListener('click', restart);
  cameraBtn.addEventListener('click', saveSnapshot);
  scene.addEventListener('pointerdown', handlePointer);
  scene.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      const { x, y } = pointerPosition(event);
      state.pointer.x = clamp01(x / state.width);
      state.pointer.y = clamp01(y / state.height);
      scene.style.setProperty('--mx', `${state.pointer.x * 100}%`);
      scene.style.setProperty('--my', `${state.pointer.y * 100}%`);
      return;
    }
    handlePointer(event);
  });
  scene.addEventListener('touchmove', event => {
    handlePointer(event);
  }, { passive: true });

  window.addEventListener('resize', resize);
  resize();
  restart();
  requestAnimationFrame(animate);
})();
