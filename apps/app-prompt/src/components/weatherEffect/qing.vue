<template>
  <section class="particle-effect">
    <canvas ref="canvasRef"></canvas>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const canvasRef = ref<HTMLCanvasElement | null>(null);

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

interface DataStream {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  width: number;
}

let rafId: number;
let particles: Particle[] = [];
let streams: DataStream[] = [];

const colors = ['#0ea5e9', '#06b6d4', '#38bdf8', '#22d3ee', '#67e8f9'];

const initParticles = (canvas: HTMLCanvasElement) => {
  const { width, height } = canvas;
  const count = Math.floor((width * height) / 9000);
  particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 1.8 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.35 + 0.25,
    });
  }
};

const initStreams = (canvas: HTMLCanvasElement) => {
  const { width, height } = canvas;
  const count = Math.floor(width / 120);
  streams = [];

  for (let i = 0; i < count; i++) {
    streams.push({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 60 + 30,
      speed: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.12 + 0.06,
      width: Math.random() * 0.8 + 0.4,
    });
  }
};

const draw = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);

  // 绘制连线
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 140) {
        const alpha = (1 - dist / 140) * 0.22;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  // 绘制粒子
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;

    if (p.x < 0 || p.x > width) p.vx *= -1;
    if (p.y < 0 || p.y > height) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  // 绘制数据流：从上往下落的细线
  streams.forEach((s) => {
    s.y += s.speed;
    if (s.y - s.length > height) {
      s.y = -s.length;
      s.x = Math.random() * width;
    }

    const gradient = ctx.createLinearGradient(s.x, s.y, s.x, s.y - s.length);
    gradient.addColorStop(0, `rgba(34, 211, 238, 0)`);
    gradient.addColorStop(1, `rgba(34, 211, 238, ${s.alpha})`);

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = s.width;
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x, s.y - s.length);
    ctx.stroke();
  });
};

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    initParticles(canvas);
    initStreams(canvas);
  };

  resize();
  window.addEventListener('resize', resize);

  const loop = () => {
    draw(ctx, canvas);
    rafId = requestAnimationFrame(loop);
  };
  loop();

  onUnmounted(() => {
    window.removeEventListener('resize', resize);
    cancelAnimationFrame(rafId);
  });
});
</script>

<style scoped lang="scss">
.particle-effect {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;

  canvas {
    display: block;
    width: 100%;
    height: 100%;
    opacity: 0.9;
  }
}
</style>
