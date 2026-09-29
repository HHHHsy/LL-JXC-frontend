<template>
  <div
    class="login-page"
    :class="{ 'is-reduced': reducedMotion, 'is-idle': idle, 'is-moving': moving }"
    @mousemove="handlePointerMove"
    @mouseleave="handlePointerLeave"
  >
    <!-- 背景：微光粒子（跟随鼠标） -->
    <canvas ref="canvasRef" class="bg-canvas"></canvas>

    <!-- 背景：五彩斑斓的黑——纯黑基底上缓慢流转的彩色微光 -->
    <div class="haze haze-1" :style="hazeStyle(1)"></div>
    <div class="haze haze-2" :style="hazeStyle(2)"></div>
    <div class="haze haze-3" :style="hazeStyle(3)"></div>
    <div class="grain"></div>

    <!-- 顶部条：品牌 + 实时时间 -->
    <header class="top-bar">
      <div class="top-brand">
        <span class="top-dot"></span>
        <span>巴马 · 瓦尔塔蓄电池</span>
      </div>
      <div class="top-clock">
        <el-icon><Clock /></el-icon>
        <span>{{ now }}</span>
      </div>
    </header>

    <!-- 主体 -->
    <main class="stage">
      <!-- 品牌区 -->
      <section class="brand">
        <p class="brand-place">广 西 · 巴 马</p>
        <h1 class="brand-title">瓦尔塔蓄电池</h1>
        <p class="brand-en">VARTA&nbsp;BATTERY&nbsp;&amp;&nbsp;SERVICE&nbsp;·&nbsp;BAMA</p>
        <div class="brand-rule">
          <span></span><i></i><span></span>
        </div>
      </section>

      <!-- 登录卡片（闲置时整块隐去，让位给品牌标题居中） -->
      <div class="card-wrap">
        <section class="card" :style="cardStyle">
        <span class="card-edge"></span>
        <span class="card-spot"></span>

        <div class="card-head">
          <h2>欢迎回来</h2>
          <p>品质如一 · 诚信经营</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="0" @submit.prevent>
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="用户名"
              size="large"
              @keyup.enter="handleLogin"
            >
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="密码"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <div class="form-extra">
            <label class="remember">
              <input type="checkbox" v-model="remember" />
              <span>记住账号</span>
            </label>
          </div>

          <button
            type="button"
            class="submit-btn"
            :class="{ 'is-loading': loading }"
            :disabled="loading"
            @click="handleLoginClick"
          >
            <span v-if="!loading" class="submit-text">
              <el-icon><Key /></el-icon>登 录
            </span>
            <span v-else class="submit-text"><span class="spinner"></span>正在登录…</span>
            <span
              v-for="ripple in ripples"
              :key="ripple.id"
              class="ripple"
              :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
            ></span>
          </button>
        </el-form>

        <p class="card-foot">
          <el-icon><Lock /></el-icon>
          本地部署 · 口令加密存储
        </p>
        </section>
      </div>
    </main>

    <footer class="login-footer">
      <span>© {{ year }} 巴马瓦尔塔蓄电池</span>
    </footer>

    <!-- 登录成功动画 -->
    <transition name="pop">
      <div v-if="success" class="success-mask">
        <div class="success-card">
          <div class="success-ring">
            <el-icon><Check /></el-icon>
          </div>
          <p>登录成功，正在进入…</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../api/auth'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const success = ref(false)
const remember = ref(false)
const reducedMotion = ref(false)

const form = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

/* ---------------- 实时时钟 ---------------- */
const now = ref('')
let clockTimer = null
const year = new Date().getFullYear()

function pad(value) {
  return String(value).padStart(2, '0')
}

function tickClock() {
  const d = new Date()
  now.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`
}

/* ---------------- 鼠标视差（极轻） ---------------- */
const pointer = reactive({ x: 0, y: 0, active: false, mx: 0, my: 0 })

function handlePointerMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  pointer.x = (event.clientX - rect.width / 2) / rect.width
  pointer.y = (event.clientY - rect.height / 2) / rect.height
  pointer.active = true
  // 高光中心用「相对卡片的坐标」，让卡片上的光斑跟手
  const cardRect = cardRef.value?.getBoundingClientRect()
  if (cardRect) {
    pointer.mx = event.clientX - cardRect.left
    pointer.my = event.clientY - cardRect.top
  }
}

function handlePointerLeave() {
  pointer.x = 0
  pointer.y = 0
  pointer.active = false
}

function hazeStyle(index) {
  if (reducedMotion.value) return {}
  const factor = index * 10
  return {
    transform: `translate3d(${pointer.x * factor}px, ${pointer.y * factor}px, 0)`
  }
}

const cardRef = ref(null)

const cardStyle = computed(() => {
  const style = {
    '--mx': pointer.mx + 'px',
    '--my': pointer.my + 'px'
  }
  if (reducedMotion.value) return style
  return {
    ...style,
    transform: `perspective(1200px) rotateY(${pointer.x * 2.5}deg) rotateX(${-pointer.y * 2}deg)`
  }
})

/* ---------------- 闲置隐身：一段时间无操作后收起登录框，品牌标题居中 ---------------- */
const idle = ref(false)
const IDLE_HIDE_MS = 6000
let idleTimer = null

/* 标题滑动的过渡期间高频爆闪，到位后恢复原样：
   moving 只在过渡存续（收起/展开均 3s），与 CSS 过渡时长一一对应 */
const moving = ref(false)
let moveTimer = null

watch(idle, (value) => {
  moving.value = true
  clearTimeout(moveTimer)
  moveTimer = setTimeout(() => {
    moving.value = false
  }, 3000)
})

// 任何一点动静都算"活跃"
const idleEvents = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']

function armIdleTimer() {
  idle.value = false
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    idle.value = true
  }, IDLE_HIDE_MS)
}

function startIdleWatch() {
  // 尊重系统的「减少动态效果」，这类用户不做隐身
  if (reducedMotion.value) return
  idleEvents.forEach((evt) => window.addEventListener(evt, armIdleTimer, { passive: true }))
  armIdleTimer()
}

function stopIdleWatch() {
  idleEvents.forEach((evt) => window.removeEventListener(evt, armIdleTimer))
  clearTimeout(idleTimer)
  clearTimeout(moveTimer)
}

/* ---------------- 微光粒子背景 ---------------- */
const canvasRef = ref(null)
let ctx = null
let particles = []
let rafId = null
let resizeHandler = null
let dpr = 1

function initParticles() {
  const canvas = canvasRef.value
  if (!canvas) return
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = window.innerWidth * dpr
  canvas.height = window.innerHeight * dpr
  canvas.style.width = window.innerWidth + 'px'
  canvas.style.height = window.innerHeight + 'px'
  ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  const count = Math.min(72, Math.max(36, Math.round(window.innerWidth / 26)))
  // 跨色相取样：同一片黑里藏着不同颜色，凑近才看得见
  const hues = [265, 195, 330, 45, 160]
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.16,
    r: Math.random() * 1.4 + 0.4,
    hue: hues[Math.floor(Math.random() * hues.length)],
    tw: Math.random() * Math.PI * 2
  }))
}

function drawParticles() {
  if (!ctx) return
  const width = window.innerWidth
  const height = window.innerHeight
  ctx.clearRect(0, 0, width, height)

  const mouseX = pointer.x * width + width / 2
  const mouseY = pointer.y * height + height / 2

  for (const p of particles) {
    p.x += p.vx
    p.y += p.vy
    p.tw += 0.02
    if (p.x < 0 || p.x > width) p.vx *= -1
    if (p.y < 0 || p.y > height) p.vy *= -1

    // 缓慢呼吸式明暗，像黑绸缎上的微尘
    const alpha = 0.22 + 0.3 * (0.5 + 0.5 * Math.sin(p.tw))
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 85%, 70%, ${alpha})`
    ctx.fill()
  }

  // 鼠标附近的粒子被"照亮"
  if (pointer.active) {
    for (const p of particles) {
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY)
      if (dist < 170) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 1.6, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 90%, 76%, ${0.5 * (1 - dist / 170)})`
        ctx.fill()
      }
    }
  }
}

function loop() {
  drawParticles()
  rafId = requestAnimationFrame(loop)
}

/* ---------------- 登录 ---------------- */
const ripples = ref([])
let rippleSeed = 0

function handleLoginClick(event) {
  const button = event?.currentTarget
  if (button) {
    const rect = button.getBoundingClientRect()
    const ripple = {
      id: ++rippleSeed,
      x: (event.clientX || rect.left + rect.width / 2) - rect.left,
      y: (event.clientY || rect.top + rect.height / 2) - rect.top
    }
    ripples.value.push(ripple)
    setTimeout(() => {
      ripples.value = ripples.value.filter((r) => r.id !== ripple.id)
    }, 700)
  }
  handleLogin()
}

async function handleLogin() {
  if (loading.value || success.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const res = await login({
      username: form.username,
      password: form.password
    })
    if (res.code === 200) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('realName', res.data.realName)
      if (remember.value) {
        localStorage.setItem('loginUsername', form.username)
      } else {
        localStorage.removeItem('loginUsername')
      }
      success.value = true
      // 让成功动画播完再进系统，避免"闪一下就跳走"
      setTimeout(() => router.push('/dashboard'), reducedMotion.value ? 200 : 900)
    }
  } catch (e) {
    // 失败提示已由 request 响应拦截器统一处理（读取后端 Result.msg）
  } finally {
    loading.value = false
  }
}

/* ---------------- 生命周期 ---------------- */
onMounted(() => {
  reducedMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  const saved = localStorage.getItem('loginUsername')
  if (saved) {
    form.username = saved
    remember.value = true
  }
  tickClock()
  clockTimer = setInterval(tickClock, 1000)
  startIdleWatch()
  initParticles()
  if (reducedMotion.value) {
    drawParticles()
  } else {
    loop()
  }
  resizeHandler = () => {
    initParticles()
    if (reducedMotion.value) drawParticles()
  }
  window.addEventListener('resize', resizeHandler)
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  if (clockTimer) clearInterval(clockTimer)
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
  stopIdleWatch()
})
</script>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 88px 24px 64px;
  box-sizing: border-box;
  /* 五彩斑斓的黑：不是纯黑，是黑里透着极淡的彩 */
  background:
    radial-gradient(1100px 640px at 18% -6%, rgba(96, 70, 255, 0.14), transparent 60%),
    radial-gradient(900px 560px at 86% 4%, rgba(0, 190, 255, 0.1), transparent 58%),
    radial-gradient(860px 600px at 74% 100%, rgba(255, 80, 190, 0.09), transparent 60%),
    radial-gradient(700px 480px at 8% 96%, rgba(255, 196, 80, 0.07), transparent 58%),
    #040406;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif;
  color: #eef0f6;
}

/* ---------- 背景层 ---------- */
.bg-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
}

/* 三团缓慢呼吸的彩色微光：白天几乎看不见，暗环境里会流转出光泽 */
.haze {
  position: absolute;
  width: 52vw;
  height: 52vw;
  max-width: 720px;
  max-height: 720px;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.5;
  z-index: 0;
  transition: transform 1.2s cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: breathe 24s ease-in-out infinite alternate;
}

.haze-1 {
  left: -12vw;
  top: -14vw;
  background: radial-gradient(circle at 40% 40%, rgba(124, 92, 255, 0.4), transparent 68%);
}

.haze-2 {
  right: -14vw;
  top: 2vw;
  background: radial-gradient(circle at 55% 45%, rgba(64, 200, 255, 0.3), transparent 68%);
  animation-duration: 30s;
}

.haze-3 {
  left: 26vw;
  bottom: -22vw;
  background: radial-gradient(circle at 50% 50%, rgba(255, 96, 200, 0.24), transparent 66%);
  animation-duration: 27s;
}

@keyframes breathe {
  0% {
    opacity: 0.35;
    transform: scale(1);
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 0.42;
    transform: scale(1.1);
  }
}

/* 细颗粒噪点：让黑有"材质"，避免大面积纯色的塑料感 */
.grain {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0.05;
  background-image: radial-gradient(rgba(255, 255, 255, 0.7) 0.5px, transparent 0.5px);
  background-size: 3px 3px;
}

/* ---------- 顶部条 / 底部 ---------- */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 30px;
  color: rgba(226, 230, 244, 0.6);
  font-size: 13px;
  letter-spacing: 2px;
}

.top-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8be9ff, #b78bff 55%, #ff8ad4);
  box-shadow: 0 0 10px rgba(150, 130, 255, 0.8);
  animation: pulse 2.6s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.75);
  }
}

.top-clock {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-variant-numeric: tabular-nums;
  letter-spacing: 1px;
}

.login-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  padding: 16px 28px 20px;
  text-align: center;
  color: rgba(226, 230, 244, 0.4);
  font-size: 12px;
  letter-spacing: 2px;
}

/* ---------- 主体 ---------- */
.stage {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(460px, 100%);
}

/* 品牌区 */
.brand {
  text-align: center;
  margin-bottom: 40px;
  animation: rise 0.9s ease-out backwards;
  /* 闲置时下边距归零，标题随登录框收起平滑滑向屏幕正中（3 秒长滑） */
  transition: margin-bottom 3s cubic-bezier(0.22, 1, 0.36, 1);
}

.brand-place {
  margin: 0 0 14px;
  font-size: 14px;
  letter-spacing: 14px;
  text-indent: 14px; /* 抵消最后一个字的字距，保证视觉居中 */
  color: rgba(238, 240, 246, 0.5);
}

.brand-title {
  margin: 0;
  font-size: clamp(44px, 7vw, 64px);
  line-height: 1.15;
  font-weight: 700;
  letter-spacing: 8px;
  text-indent: 8px;
  /* 黑底上流动的金属光泽——五彩斑斓的黑 */
  background: linear-gradient(
    100deg,
    #f4f5f9 0%,
    #9be8ff 20%,
    #b99cff 38%,
    #ff9ad9 54%,
    #ffd98a 70%,
    #f4f5f9 88%,
    #9be8ff 100%
  );
  background-size: 280% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation:
    sheen 9s linear infinite,
    titlePulse 6.5s ease-in-out infinite; /* 整行轻微通电脉冲，不换色不断行 */
  filter: drop-shadow(0 6px 30px rgba(140, 120, 255, 0.22));
}

@keyframes sheen {
  to {
    background-position: 280% 0;
  }
}

/* 整行通电脉冲：亮度小幅起伏 + 辉光轻微增强，克制地表达"充满电力" */
@keyframes titlePulse {
  0%,
  82%,
  100% {
    filter: brightness(1) drop-shadow(0 6px 30px rgba(140, 120, 255, 0.22));
  }
  88% {
    filter: brightness(1.28) drop-shadow(0 6px 42px rgba(160, 170, 255, 0.5));
  }
  92% {
    filter: brightness(1.08) drop-shadow(0 6px 32px rgba(140, 120, 255, 0.3));
  }
  96% {
    filter: brightness(1.4) drop-shadow(0 6px 46px rgba(170, 180, 255, 0.55));
  }
}

/* 过渡期间（标题滑向居中/滑回原位）：高频连闪，到位即停 */
.login-page.is-moving .brand-title {
  animation:
    sheen 9s linear infinite,
    moveZap 0.48s ease-in-out infinite;
}

/* 高频双击电：主闪 + 余闪快速连打，滑动途中一路放电 */
@keyframes moveZap {
  0%,
  56%,
  100% {
    filter: brightness(1) drop-shadow(0 6px 30px rgba(140, 120, 255, 0.22));
  }
  16% {
    filter: brightness(1.8) drop-shadow(0 6px 54px rgba(170, 200, 255, 0.88));
  }
  26% {
    filter: brightness(1.05) drop-shadow(0 6px 32px rgba(140, 120, 255, 0.28));
  }
  38% {
    filter: brightness(2) drop-shadow(0 6px 62px rgba(185, 210, 255, 0.95));
  }
  47% {
    filter: brightness(1.15) drop-shadow(0 6px 36px rgba(150, 140, 255, 0.4));
  }
}

.brand-en {
  margin: 12px 0 0;
  font-size: 11px;
  letter-spacing: 6px;
  color: rgba(238, 240, 246, 0.34);
  font-weight: 500;
}

.brand-rule {
  margin-top: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}

.brand-rule span {
  width: 96px;
  height: 1px;
}

.brand-rule span:first-child {
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.28));
}

.brand-rule span:last-child {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.28), transparent);
}

.brand-rule i {
  width: 6px;
  height: 6px;
  margin: 0 12px;
  transform: rotate(45deg);
  background: linear-gradient(135deg, #9be8ff, #b99cff);
  box-shadow: 0 0 12px rgba(150, 130, 255, 0.7);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ---------- 登录卡片 ---------- */
/* 折叠容器：闲置时高度收拢 + 淡出下潜，露出居中的品牌标题（过渡 3 秒） */
.card-wrap {
  width: 100%;
  max-height: 720px;
  transition:
    max-height 3s cubic-bezier(0.33, 0, 0.2, 1),
    opacity 1.6s ease,
    transform 3s cubic-bezier(0.22, 1, 0.36, 1),
    filter 2.4s ease;
  will-change: max-height, opacity, transform, filter;
}

/* 收起方向走更慢更柔的曲线：像缓缓沉入黑里，而不是弹走 */
.login-page.is-idle .card-wrap {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transform: translateY(28px) scale(0.97);
  filter: blur(6px);
  pointer-events: none;
  transition:
    max-height 3s cubic-bezier(0.65, 0, 0.35, 1),
    opacity 1.8s ease 0.4s,
    transform 3s cubic-bezier(0.65, 0, 0.35, 1),
    filter 2.4s ease;
}

@property --edge-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.card {
  position: relative;
  width: 100%;
  border-radius: 22px;
  padding: 42px 38px 32px;
  box-sizing: border-box;
  background: linear-gradient(165deg, rgba(18, 18, 24, 0.78), rgba(8, 8, 12, 0.86));
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow:
    0 44px 90px -44px rgba(0, 0, 0, 0.95),
    0 0 90px -40px rgba(120, 100, 255, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  transition: transform 0.4s ease;
  animation: rise 0.9s 0.12s ease-out backwards;
}

/* 卡片一圈极细的虹彩描边，缓慢转动 */
.card-edge {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 23px;
  padding: 1px;
  background: conic-gradient(
    from var(--edge-angle),
    rgba(155, 232, 255, 0.7),
    rgba(255, 255, 255, 0.06) 22%,
    rgba(255, 154, 217, 0.6) 46%,
    rgba(255, 255, 255, 0.06) 70%,
    rgba(255, 217, 138, 0.5) 88%,
    rgba(155, 232, 255, 0.7)
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.55;
  animation: edgeSpin 8s linear infinite;
}

@keyframes edgeSpin {
  to {
    --edge-angle: 360deg;
  }
}

/* 跟随鼠标的高光 */
.card-spot {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  pointer-events: none;
  background: radial-gradient(
    360px circle at var(--mx, 50%) var(--my, 50%),
    rgba(160, 150, 255, 0.1),
    transparent 60%
  );
  transition: background 0.2s ease;
}

.card-head {
  text-align: center;
  margin-bottom: 26px;
}

.card-head h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 6px;
  text-indent: 6px;
  color: #f4f5f9;
}

.card-head p {
  margin: 0;
  color: rgba(238, 240, 246, 0.42);
  font-size: 12.5px;
  letter-spacing: 4px;
  text-indent: 4px;
}

/* ---------- 表单 ---------- */
.card :deep(.el-form-item) {
  margin-bottom: 18px;
}

.card :deep(.el-input__wrapper) {
  padding: 4px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.card :deep(.el-input__wrapper:hover) {
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.22);
}

.card :deep(.el-input__wrapper.is-focus) {
  background: rgba(255, 255, 255, 0.07);
  box-shadow:
    inset 0 0 0 1px rgba(185, 156, 255, 0.85),
    0 0 0 4px rgba(150, 120, 255, 0.14);
}

/* 浏览器自动填充（账号/密码）会强行给 input 刷一层浅色底并把文字变深色，
   这里用超大内阴影盖掉那层浅色，同时把文字/光标拉回本主题的浅色。 */
.card :deep(.el-input__inner:-webkit-autofill),
.card :deep(.el-input__inner:-webkit-autofill:hover),
.card :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-text-fill-color: #eef0f6;
  caret-color: #b99cff;
  box-shadow: 0 0 0 1000px #14141c inset;
}

.card :deep(.el-input__inner) {
  height: 46px;
  color: #eef0f6;
  font-size: 15px;
  letter-spacing: 0.4px;
}

.card :deep(.el-input__inner::placeholder) {
  color: rgba(238, 240, 246, 0.32);
  letter-spacing: 2px;
}

.card :deep(.el-input__prefix),
.card :deep(.el-input__suffix) {
  color: rgba(238, 240, 246, 0.5);
}

.card :deep(.el-input__password) {
  color: rgba(238, 240, 246, 0.5);
}

.card :deep(.el-form-item__error) {
  padding-left: 6px;
  color: #ff9ab8;
  font-size: 12px;
}

.form-extra {
  display: flex;
  align-items: center;
  margin: 2px 0 20px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgba(238, 240, 246, 0.6);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.remember input {
  width: 15px;
  height: 15px;
  accent-color: #b99cff;
  cursor: pointer;
}

/* 登录按钮：黑玻璃底 + 虹彩描边，克制但贵气 */
.submit-btn {
  position: relative;
  width: 100%;
  height: 50px;
  border: 1px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  color: #f4f5f9;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 8px;
  text-indent: 8px;
  background:
    linear-gradient(160deg, rgba(28, 28, 38, 0.95), rgba(12, 12, 18, 0.98)) padding-box,
    linear-gradient(
        110deg,
        rgba(155, 232, 255, 0.9),
        rgba(185, 156, 255, 0.9) 34%,
        rgba(255, 154, 217, 0.9) 67%,
        rgba(255, 217, 138, 0.9)
      )
      border-box;
  box-shadow:
    0 18px 40px -20px rgba(0, 0, 0, 0.9),
    0 0 26px -8px rgba(150, 120, 255, 0.45);
  transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.25s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  filter: brightness(1.15);
  box-shadow:
    0 24px 48px -20px rgba(0, 0, 0, 0.95),
    0 0 34px -6px rgba(150, 120, 255, 0.65);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.submit-btn:disabled {
  cursor: not-allowed;
  filter: grayscale(0.3) brightness(0.9);
}

.submit-text {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

/* 点击水波 */
.ripple {
  position: absolute;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  pointer-events: none;
  animation: rippleOut 0.68s ease-out forwards;
}

@keyframes rippleOut {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(26);
    opacity: 0;
  }
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #eef0f6;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.card-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 22px 0 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  color: rgba(238, 240, 246, 0.4);
  font-size: 12px;
  letter-spacing: 2px;
}

/* ---------- 登录成功动画 ---------- */
.success-mask {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 2, 4, 0.78);
  backdrop-filter: blur(10px);
}

.success-card {
  text-align: center;
  color: #f4f5f9;
  letter-spacing: 3px;
}

.success-ring {
  width: 92px;
  height: 92px;
  margin: 0 auto 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  color: #06060a;
  background: linear-gradient(140deg, #9be8ff, #b99cff 55%, #ff9ad9);
  box-shadow:
    0 0 0 12px rgba(150, 130, 255, 0.12),
    0 0 60px rgba(150, 130, 255, 0.5);
  animation: popIn 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
}

.success-card p {
  margin: 0;
  letter-spacing: 3px;
}

@keyframes popIn {
  from {
    transform: scale(0.4);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.35s ease;
}

.pop-enter-from,
.pop-leave-to {
  opacity: 0;
}

/* ---------- 自适应 ---------- */
@media (max-width: 640px) {
  .login-page {
    padding: 80px 18px 56px;
  }

  .card {
    padding: 34px 24px 26px;
  }

  .brand-title {
    letter-spacing: 5px;
    text-indent: 5px;
  }
}

@media (max-height: 700px) {
  .login-page {
    padding: 72px 24px 48px;
  }

  .brand {
    margin-bottom: 26px;
  }

  .brand-title {
    font-size: 40px;
  }
}

/* 用户系统设置「减少动态效果」时，关掉大幅动画 */
.login-page.is-reduced .haze,
.login-page.is-reduced .top-dot,
.login-page.is-reduced .card-edge,
.login-page.is-reduced .brand-title {
  animation: none;
}

.login-page.is-reduced .card {
  transition: none;
}
</style>
