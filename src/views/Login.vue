<template>
  <div
    class="login-page"
    :class="{ 'is-reduced': reducedMotion }"
    @mousemove="handlePointerMove"
    @mouseleave="handlePointerLeave"
  >
    <!-- 背景：粒子星网（跟随鼠标） -->
    <canvas ref="canvasRef" class="bg-canvas"></canvas>

    <!-- 背景：极光光斑 -->
    <div class="aurora aurora-1" :style="auroraStyle(1)"></div>
    <div class="aurora aurora-2" :style="auroraStyle(2)"></div>
    <div class="aurora aurora-3" :style="auroraStyle(3)"></div>
    <div class="aurora aurora-4" :style="auroraStyle(4)"></div>

    <!-- 背景：透视网格地面 -->
    <div class="grid-floor"></div>

    <!-- 背景：漂浮的业务图标 -->
    <div
      v-for="item in floaters"
      :key="item.icon"
      class="floater"
      :class="{ 'is-near': pointer.active }"
      :style="{
        left: item.x,
        top: item.y,
        animationDelay: item.delay,
        animationDuration: item.dur
      }"
    >
      <el-icon><component :is="item.icon" /></el-icon>
    </div>

    <!-- 顶部条：品牌 + 实时时间 -->
    <header class="top-bar">
      <div class="top-brand">
        <span class="top-dot"></span>
        <span>LL 进销存 · 采购 / 销售 / 库存一体化</span>
      </div>
      <div class="top-clock">
        <el-icon><Clock /></el-icon>
        <span>{{ now }}</span>
      </div>
    </header>

    <!-- 主体：玻璃卡片 + 关键词跑马灯 -->
    <div class="center-column">
      <div class="login-shell" ref="shellRef" :style="shellStyle">
        <span class="shell-spot"></span>
        <!-- 左：品牌介绍 -->
        <section class="brand-panel">
        <div class="logo-wrap">
          <div class="logo-ring logo-ring-1"></div>
          <div class="logo-ring logo-ring-2"></div>
          <div class="logo-core">LL</div>
        </div>

        <h1 class="brand-title">
          <span class="title-glow">进销存管理系统</span>
        </h1>
        <p class="brand-tagline">
          <span class="tagline-text">{{ typed }}</span>
          <span class="caret">|</span>
        </p>

        <ul class="feature-list">
          <li v-for="(feature, index) in features" :key="feature.text" :style="{ animationDelay: index * 0.12 + 's' }">
            <span class="feature-icon"><el-icon><component :is="feature.icon" /></el-icon></span>
            <span class="feature-text">
              <strong>{{ feature.text }}</strong>
              <em>{{ feature.desc }}</em>
            </span>
          </li>
        </ul>

        <div class="chip-row">
          <span v-for="chip in chips" :key="chip.label" class="chip">
            <el-icon><component :is="chip.icon" /></el-icon>{{ chip.label }}
          </span>
        </div>
      </section>

      <!-- 右：登录表单 -->
      <section class="form-panel">
        <div class="form-head">
          <h2>欢迎回来 <span class="wave">👋</span></h2>
          <p>登录后即可管理商品、采购、销售与库存</p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="0" @submit.prevent>
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              class="glass-input"
              @keyup.enter="handleLogin"
            >
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              class="glass-input"
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
            <span class="submit-shine"></span>
            <span
              v-for="ripple in ripples"
              :key="ripple.id"
              class="ripple"
              :style="{ left: ripple.x + 'px', top: ripple.y + 'px' }"
            ></span>
          </button>
        </el-form>

        <div class="form-foot">
          <span class="secure"><el-icon><Lock /></el-icon>本地部署 · 口令加密存储</span>
        </div>

        <div class="tips">
          <div class="tips-title">
            <el-icon><Sunny /></el-icon>第一次使用，建议先做这三件事
          </div>
          <ol>
            <li><span class="tips-index">1</span>到「系统设置」填好公司抬头、送货人、服务电话与打印设置</li>
            <li><span class="tips-index">2</span>商品和采购清单都支持 Excel 批量导入，模板可在弹窗里下载</li>
            <li><span class="tips-index">3</span>送货单选好针式纸张后，点「直接打印」即可一键出纸</li>
          </ol>
        </div>
        </section>
      </div>

      <!-- 业务关键词跑马灯 -->
      <div class="ticker">
        <div class="ticker-track">
          <span v-for="(word, index) in tickerWords" :key="'a' + index" class="ticker-item">
            <el-icon><component :is="word.icon" /></el-icon>{{ word.text }}
          </span>
          <span v-for="(word, index) in tickerWords" :key="'b' + index" class="ticker-item">
            <el-icon><component :is="word.icon" /></el-icon>{{ word.text }}
          </span>
        </div>
      </div>
    </div>

    <footer class="login-footer">
      <span>© {{ year }} LL 进销存管理系统</span>
      <span class="split">·</span>
      <span>巴马瓦尔塔蓄电池</span>
      <span class="split">·</span>
      <span>送货单支持针式打印机直连出纸</span>
    </footer>

    <!-- 登录成功动画 -->
    <transition name="pop">
      <div v-if="success" class="success-mask">
        <div class="success-card">
          <div class="success-ring">
            <el-icon><Check /></el-icon>
          </div>
          <p>登录成功，正在进入系统…</p>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
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

/* ---------------- 文案与装饰数据 ---------------- */

const features = [
  { icon: 'ShoppingCart', text: '采购到入库', desc: 'Excel 清单导入 · 分批入库' },
  { icon: 'Van', text: '销售到出库', desc: '分批出库 · 库存校验' },
  { icon: 'Printer', text: '送货单直连打印', desc: '针式 241×140 · 一点出纸' },
  { icon: 'DataLine', text: '报表与看板', desc: '明细表 · 趋势与热销 Top5' }
]

const chips = [
  { icon: 'Box', label: '商品档案' },
  { icon: 'Files', label: '库存流水' },
  { icon: 'Coin', label: '金额大写' },
  { icon: 'Refresh', label: '盘点盈亏' }
]

const floaters = [
  { icon: 'Box', x: '6%', y: '20%', delay: '0s', dur: '11s' },
  { icon: 'TrendCharts', x: '84%', y: '16%', delay: '1.1s', dur: '13s' },
  { icon: 'Van', x: '10%', y: '74%', delay: '.7s', dur: '12s' },
  { icon: 'Money', x: '88%', y: '70%', delay: '1.7s', dur: '14s' },
  { icon: 'Tickets', x: '47%', y: '6%', delay: '2.3s', dur: '15s' },
  { icon: 'DataAnalysis', x: '72%', y: '86%', delay: '.4s', dur: '12.5s' },
  { icon: 'OfficeBuilding', x: '24%', y: '88%', delay: '1.5s', dur: '13.5s' }
]

/* 底部跑马灯：把系统覆盖的业务串起来滚一遍 */
const tickerWords = [
  { icon: 'Goods', text: '商品档案' },
  { icon: 'User', text: '客户管理' },
  { icon: 'OfficeBuilding', text: '供应商管理' },
  { icon: 'ShoppingCart', text: '采购订单' },
  { icon: 'Download', text: '分批入库' },
  { icon: 'Sell', text: '销售订单' },
  { icon: 'Upload', text: '分批出库' },
  { icon: 'Files', text: '库存流水' },
  { icon: 'Refresh', text: '库存盘点' },
  { icon: 'Histogram', text: '采购明细表' },
  { icon: 'PieChart', text: '销售明细表' },
  { icon: 'DataLine', text: '经营看板' },
  { icon: 'Printer', text: '送货单直连打印' },
  { icon: 'Coin', text: '金额自动大写' },
  { icon: 'Document', text: 'Excel 一键导入' }
]

const taglines = [
  '采购 · 销售 · 库存，一套系统管到底',
  '分批入库 / 分批出库，账实始终一致',
  '送货单直连针式打印机，点一下直接出纸',
  '采购清单 Excel 一键导入，自动建档',
  '经营数据看板，库存与热销一目了然'
]

/* ---------------- 打字机效果 ---------------- */
const typed = ref('')
let typeTimer = null

function startTyping() {
  if (reducedMotion.value) {
    typed.value = taglines[0]
    return
  }
  let line = 0
  let index = 0
  let deleting = false
  const tick = () => {
    const text = taglines[line]
    if (!deleting) {
      index++
      typed.value = text.slice(0, index)
      if (index >= text.length) {
        deleting = true
        typeTimer = setTimeout(tick, 1600)
        return
      }
    } else {
      index--
      typed.value = text.slice(0, index)
      if (index <= 0) {
        deleting = false
        line = (line + 1) % taglines.length
      }
    }
    typeTimer = setTimeout(tick, deleting ? 34 : 78)
  }
  typeTimer = setTimeout(tick, 400)
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

/* ---------------- 鼠标视差 ---------------- */
const shellRef = ref(null)
const pointer = reactive({ x: 0, y: 0, active: false, px: 0, py: 0 })

function handlePointerMove(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  // 高光中心用「相对卡片的坐标」，这样卡片不居中时也跟手
  const shellRect = shellRef.value?.getBoundingClientRect()
  if (shellRect) {
    pointer.px = event.clientX - shellRect.left
    pointer.py = event.clientY - shellRect.top
  }
  if (reducedMotion.value) return
  pointer.x = (event.clientX - rect.width / 2) / rect.width
  pointer.y = (event.clientY - rect.height / 2) / rect.height
  pointer.active = true
}

function handlePointerLeave() {
  pointer.x = 0
  pointer.y = 0
  pointer.active = false
}

const shellStyle = computed(() => {
  const style = {
    '--mx': pointer.px + 'px',
    '--my': pointer.py + 'px'
  }
  if (reducedMotion.value || (!pointer.x && !pointer.y)) {
    return style
  }
  return {
    ...style,
    transform: `perspective(1400px) rotateY(${pointer.x * 4}deg) rotateX(${-pointer.y * 3}deg) translateZ(0)`
  }
})

function auroraStyle(index) {
  if (reducedMotion.value) return {}
  const factor = index * 12
  return {
    transform: `translate3d(${pointer.x * factor}px, ${pointer.y * factor}px, 0)`
  }
}

/* ---------------- 粒子星网背景 ---------------- */
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

  const count = Math.min(110, Math.max(48, Math.round(window.innerWidth / 16)))
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.8 + 0.7,
    hue: Math.random() > 0.5 ? 195 : 265
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
    if (p.x < 0 || p.x > width) p.vx *= -1
    if (p.y < 0 || p.y > height) p.vy *= -1

    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${p.hue}, 90%, 72%, .75)`
    ctx.fill()
  }

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i]
      const b = particles[j]
      const dx = a.x - b.x
      const dy = a.y - b.y
      const dist = Math.hypot(dx, dy)
      if (dist < 132) {
        ctx.beginPath()
        ctx.strokeStyle = `hsla(215, 90%, 75%, ${0.16 * (1 - dist / 132)})`
        ctx.lineWidth = 0.7
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
    // 与鼠标连线，鼠标附近更亮
    if (pointer.active) {
      const p = particles[i]
      const dist = Math.hypot(p.x - mouseX, p.y - mouseY)
      if (dist < 190) {
        ctx.beginPath()
        ctx.strokeStyle = `hsla(280, 100%, 80%, ${0.3 * (1 - dist / 190)})`
        ctx.lineWidth = 0.9
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(mouseX, mouseY)
        ctx.stroke()
      }
    }
  }

  drawShooters(width, height)
}

/* ---------------- 流星 ---------------- */
let shooters = []
let lastShooter = 0

function drawShooters(width, height) {
  const now = performance.now()
  if (now - lastShooter > 3200 + Math.random() * 2600 && shooters.length < 3) {
    lastShooter = now
    const startX = Math.random() * width * 0.8
    shooters.push({
      x: startX,
      y: -40,
      vx: 3.4 + Math.random() * 2.2,
      vy: 2.1 + Math.random() * 1.4,
      life: 1,
      hue: Math.random() > 0.5 ? 190 : 300
    })
  }

  shooters = shooters.filter((s) => s.life > 0 && s.x < width + 120 && s.y < height + 120)
  for (const s of shooters) {
    s.x += s.vx * 2.2
    s.y += s.vy * 2.2
    s.life -= 0.006
    const tailX = s.x - s.vx * 22
    const tailY = s.y - s.vy * 22
    const gradient = ctx.createLinearGradient(s.x, s.y, tailX, tailY)
    gradient.addColorStop(0, `hsla(${s.hue}, 100%, 88%, ${Math.max(0, s.life) * 0.95})`)
    gradient.addColorStop(1, `hsla(${s.hue}, 100%, 80%, 0)`)
    ctx.beginPath()
    ctx.strokeStyle = gradient
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.moveTo(s.x, s.y)
    ctx.lineTo(tailX, tailY)
    ctx.stroke()
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
  startTyping()
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
  if (typeTimer) clearTimeout(typeTimer)
  if (clockTimer) clearInterval(clockTimer)
  if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})
</script>

<style scoped>
.login-page {
  --brand-cyan: #6ee7ff;
  --brand-violet: #8b5cff;
  --brand-pink: #ff6ec7;
  --brand-mint: #35e0a1;
  position: relative;
  min-height: 100vh;
  /* 竖向要能滚：小屏/低分辨率下表单不能被裁掉（贴边的极光与网格仍不允许横向溢出） */
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 72px 24px 64px;
  box-sizing: border-box;
  background:
    radial-gradient(1200px 700px at 12% 8%, rgba(90, 70, 220, 0.55), transparent 62%),
    radial-gradient(1000px 620px at 88% 12%, rgba(0, 160, 200, 0.42), transparent 60%),
    radial-gradient(900px 700px at 70% 96%, rgba(255, 90, 180, 0.28), transparent 62%),
    linear-gradient(160deg, #060a1c 0%, #0a1030 38%, #0d1a3c 68%, #05070f 100%);
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', system-ui, sans-serif;
}

/* ---------- 背景层 ---------- */
.bg-canvas {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.aurora {
  position: absolute;
  width: 46vw;
  height: 46vw;
  max-width: 640px;
  max-height: 640px;
  border-radius: 50%;
  filter: blur(72px);
  opacity: 0.55;
  z-index: 0;
  transition: transform 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  animation: drift 18s ease-in-out infinite alternate;
}

.aurora-1 {
  left: -8vw;
  top: -10vw;
  background: radial-gradient(circle at 35% 35%, rgba(110, 231, 255, 0.9), rgba(110, 231, 255, 0) 70%);
}

.aurora-2 {
  right: -6vw;
  top: -6vw;
  background: radial-gradient(circle at 60% 40%, rgba(139, 92, 255, 0.95), rgba(139, 92, 255, 0) 70%);
  animation-duration: 22s;
}

.aurora-3 {
  left: 18vw;
  bottom: -16vw;
  background: radial-gradient(circle at 50% 50%, rgba(255, 110, 199, 0.85), rgba(255, 110, 199, 0) 70%);
  animation-duration: 26s;
}

.aurora-4 {
  right: 8vw;
  bottom: -12vw;
  background: radial-gradient(circle at 50% 50%, rgba(53, 224, 161, 0.7), rgba(53, 224, 161, 0) 70%);
  animation-duration: 20s;
}

@keyframes drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(3vw, 2vh, 0) scale(1.08);
  }
  100% {
    transform: translate3d(-2vw, -3vh, 0) scale(0.96);
  }
}

.grid-floor {
  position: absolute;
  left: -25%;
  right: -25%;
  bottom: -6%;
  height: 46%;
  z-index: 1;
  background-image:
    linear-gradient(rgba(120, 170, 255, 0.16) 1px, transparent 1px),
    linear-gradient(90deg, rgba(120, 170, 255, 0.16) 1px, transparent 1px);
  background-size: 64px 64px;
  transform: perspective(560px) rotateX(70deg);
  transform-origin: bottom center;
  animation: gridScroll 6s linear infinite;
  mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.85), transparent 82%);
  -webkit-mask-image: linear-gradient(to top, rgba(0, 0, 0, 0.85), transparent 82%);
  opacity: 0.85;
}

@keyframes gridScroll {
  from {
    background-position: 0 0;
  }
  to {
    background-position: 0 64px;
  }
}

.floater {
  position: absolute;
  z-index: 2;
  width: 54px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  font-size: 24px;
  color: rgba(220, 235, 255, 0.9);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.03));
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 40px -22px rgba(80, 140, 255, 0.9);
  backdrop-filter: blur(6px);
  animation-name: floaty;
  animation-iteration-count: infinite;
  animation-timing-function: ease-in-out;
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.floater.is-near {
  opacity: 0.85;
}

@keyframes floaty {
  0% {
    transform: translateY(0) rotate(-4deg);
  }
  50% {
    transform: translateY(-22px) rotate(5deg);
  }
  100% {
    transform: translateY(0) rotate(-4deg);
  }
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
  padding: 18px 28px;
  color: rgba(210, 226, 255, 0.78);
  font-size: 13px;
  letter-spacing: 0.4px;
}

.top-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--brand-mint);
  box-shadow: 0 0 12px var(--brand-mint);
  animation: pulse 2.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.45;
    transform: scale(0.78);
  }
}

.top-clock {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-variant-numeric: tabular-nums;
}

.login-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;
  padding: 14px 28px 18px;
  text-align: center;
  color: rgba(180, 200, 235, 0.55);
  font-size: 12px;
}

.login-footer .split {
  margin: 0 8px;
  opacity: 0.6;
}

/* ---------- 玻璃卡片 ---------- */
@property --card-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.center-column {
  position: relative;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(1020px, 100%);
  max-height: 100%;
}

.login-shell {
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  width: 100%;
  border-radius: 26px;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(18, 26, 54, 0.86), rgba(10, 16, 36, 0.78));
  border: 1px solid rgba(140, 170, 255, 0.22);
  box-shadow:
    0 40px 90px -40px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 70px -30px rgba(120, 90, 255, 0.7);
  backdrop-filter: blur(18px);
  transition: transform 0.35s ease;
}

/* 旋转的霓虹描边 */
.login-shell::before {
  content: '';
  position: absolute;
  inset: -1px;
  border-radius: 27px;
  padding: 1px;
  background: conic-gradient(
    from var(--card-angle),
    rgba(110, 231, 255, 0.95),
    rgba(139, 92, 255, 0.15) 22%,
    rgba(255, 110, 199, 0.9) 48%,
    rgba(53, 224, 161, 0.18) 72%,
    rgba(110, 231, 255, 0.95)
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.9;
  animation: cardBorder 7s linear infinite;
}

@keyframes cardBorder {
  to {
    --card-angle: 360deg;
  }
}

/* 跟随鼠标的高光 */
.shell-spot {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background: radial-gradient(
    420px circle at var(--mx, 50%) var(--my, 50%),
    rgba(150, 190, 255, 0.12),
    transparent 62%
  );
  transition: background 0.2s ease;
}

.brand-panel {
  position: relative;
  padding: 44px 40px 40px;
  background:
    radial-gradient(600px 320px at 0% 0%, rgba(110, 231, 255, 0.16), transparent 65%),
    radial-gradient(520px 320px at 100% 100%, rgba(255, 110, 199, 0.16), transparent 62%);
}

.logo-wrap {
  position: relative;
  width: 78px;
  height: 78px;
  margin-bottom: 20px;
}

.logo-ring {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  border: 1.5px solid transparent;
}

.logo-ring-1 {
  border-top-color: var(--brand-cyan);
  border-right-color: rgba(110, 231, 255, 0.35);
  animation: spin 5.5s linear infinite;
}

.logo-ring-2 {
  inset: 8px;
  border-bottom-color: var(--brand-pink);
  border-left-color: rgba(255, 110, 199, 0.35);
  border-radius: 18px;
  animation: spin 4s linear infinite reverse;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.logo-core {
  position: absolute;
  inset: 15px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 22px;
  letter-spacing: 1px;
  color: #06122b;
  background: linear-gradient(135deg, var(--brand-cyan), #a78bfa 55%, var(--brand-pink));
  box-shadow: 0 12px 32px -12px rgba(139, 92, 255, 0.95);
}

.brand-title {
  margin: 0 0 10px;
  font-size: 33px;
  line-height: 1.2;
  letter-spacing: 2px;
}

.title-glow {
  background: linear-gradient(100deg, #f2f7ff 10%, var(--brand-cyan) 45%, var(--brand-violet) 78%, var(--brand-pink));
  background-size: 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: shimmer 7s linear infinite;
  text-shadow: 0 0 32px rgba(120, 160, 255, 0.35);
}

@keyframes shimmer {
  to {
    background-position: 200% 0;
  }
}

.brand-tagline {
  min-height: 26px;
  margin: 0 0 26px;
  color: rgba(198, 216, 255, 0.82);
  font-size: 14.5px;
  letter-spacing: 0.6px;
}

.caret {
  margin-left: 2px;
  color: var(--brand-cyan);
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.feature-list {
  list-style: none;
  margin: 0 0 26px;
  padding: 0;
  display: grid;
  gap: 14px;
}

.feature-list li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02));
  border: 1px solid rgba(255, 255, 255, 0.08);
  animation: slideIn 0.7s backwards ease-out;
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.feature-list li:hover {
  transform: translateX(6px);
  border-color: rgba(110, 231, 255, 0.45);
  box-shadow: 0 16px 34px -22px rgba(110, 231, 255, 0.9);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feature-icon {
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
  color: #dff2ff;
  background: linear-gradient(140deg, rgba(110, 231, 255, 0.28), rgba(139, 92, 255, 0.32));
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feature-text strong {
  color: #eaf2ff;
  font-size: 14.5px;
  font-weight: 600;
}

.feature-text em {
  color: rgba(178, 198, 235, 0.72);
  font-size: 12.5px;
  font-style: normal;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  color: rgba(214, 230, 255, 0.9);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* ---------- 表单区 ---------- */
.form-panel {
  position: relative;
  padding: 48px 42px 42px;
  background: linear-gradient(160deg, rgba(8, 13, 30, 0.55), rgba(14, 20, 44, 0.72));
  border-left: 1px solid rgba(255, 255, 255, 0.07);
}

.form-head h2 {
  margin: 0 0 8px;
  font-size: 25px;
  color: #f4f8ff;
  letter-spacing: 1px;
}

.wave {
  display: inline-block;
  transform-origin: 70% 70%;
  animation: wave 2.6s ease-in-out infinite;
}

@keyframes wave {
  0%,
  60%,
  100% {
    transform: rotate(0deg);
  }
  15% {
    transform: rotate(16deg);
  }
  30% {
    transform: rotate(-8deg);
  }
  45% {
    transform: rotate(12deg);
  }
}

.form-head p {
  margin: 0 0 26px;
  color: rgba(178, 198, 235, 0.7);
  font-size: 13px;
}

.form-panel :deep(.el-form-item) {
  margin-bottom: 18px;
}

/* 输入框：半透明玻璃面 + 顶部高光 + 外投影，避免整块纯色显得扁平 */
.form-panel :deep(.el-input__wrapper) {
  padding: 4px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03));
  box-shadow:
    inset 0 0 0 1px rgba(150, 180, 255, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 12px 26px -22px rgba(0, 0, 0, 0.95);
  transition: background 0.25s ease, box-shadow 0.25s ease;
}

.form-panel :deep(.el-input__wrapper:hover) {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.05));
  box-shadow:
    inset 0 0 0 1px rgba(160, 190, 255, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.16),
    0 14px 30px -22px rgba(0, 0, 0, 0.95);
}

.form-panel :deep(.el-input__wrapper.is-focus) {
  background: linear-gradient(180deg, rgba(110, 180, 255, 0.14), rgba(139, 92, 255, 0.08));
  box-shadow:
    inset 0 0 0 1px rgba(110, 231, 255, 0.85),
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 0 0 4px rgba(110, 160, 255, 0.16);
}

/* 浏览器自动填充（账号/密码）会强行给 input 刷一层浅色底并把文字变深色，
   在上面的玻璃样式之上仍会显示成白框。这里用超大内阴影盖掉那层浅色，
   同时把文字/光标拉回本主题的浅色。 */
.form-panel :deep(.el-input__inner:-webkit-autofill),
.form-panel :deep(.el-input__inner:-webkit-autofill:hover),
.form-panel :deep(.el-input__inner:-webkit-autofill:focus) {
  -webkit-text-fill-color: #eef4ff;
  caret-color: var(--brand-cyan);
  box-shadow: 0 0 0 1000px #1b2440 inset;
}

.form-panel :deep(.el-input__inner) {
  height: 46px;
  color: #eef4ff;
  font-size: 15px;
  letter-spacing: 0.4px;
}

.form-panel :deep(.el-input__inner::placeholder) {
  color: rgba(180, 200, 235, 0.42);
}

.form-panel :deep(.el-input__prefix),
.form-panel :deep(.el-input__suffix) {
  color: rgba(170, 200, 255, 0.75);
}

.form-panel :deep(.el-input__password) {
  color: rgba(170, 200, 255, 0.75);
}

.form-panel :deep(.el-form-item__error) {
  padding-left: 6px;
  color: #ffa8c0;
  font-size: 12px;
}

.form-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 0 18px;
}

.remember {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: rgba(198, 216, 255, 0.82);
  font-size: 13px;
  cursor: pointer;
  user-select: none;
}

.remember input {
  width: 15px;
  height: 15px;
  accent-color: #8b5cff;
  cursor: pointer;
}

.submit-btn {
  position: relative;
  width: 100%;
  height: 50px;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  overflow: hidden;
  color: #08122c;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 4px;
  background: linear-gradient(120deg, var(--brand-cyan), #a78bfa 46%, var(--brand-pink) 96%);
  background-size: 220% 100%;
  box-shadow: 0 20px 40px -20px rgba(139, 92, 255, 1);
  animation: shimmer 6s linear infinite;
  transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.25s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 26px 50px -20px rgba(139, 92, 255, 1);
  filter: saturate(1.15);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.99);
}

.submit-btn:disabled {
  cursor: not-allowed;
  filter: grayscale(0.25) brightness(0.95);
}

.submit-text {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.submit-shine {
  position: absolute;
  top: 0;
  left: -60%;
  width: 45%;
  height: 100%;
  background: linear-gradient(100deg, transparent, rgba(255, 255, 255, 0.75), transparent);
  transform: skewX(-18deg);
  animation: shine 3.4s ease-in-out infinite;
}

@keyframes shine {
  0% {
    left: -60%;
  }
  55%,
  100% {
    left: 130%;
  }
}

/* 点击水波 */
.ripple {
  position: absolute;
  z-index: 1;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.75);
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

/* ---------- 业务关键词跑马灯 ---------- */
.ticker {
  position: relative;
  z-index: 4;
  width: 100%;
  margin-top: 18px;
  padding: 10px 0;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.045);
  border: 1px solid rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(10px);
  mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);
}

.ticker-track {
  display: flex;
  align-items: center;
  gap: 30px;
  width: max-content;
  animation: tickerMove 34s linear infinite;
}

.ticker:hover .ticker-track {
  animation-play-state: paused;
}

.ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  color: rgba(200, 218, 250, 0.82);
  font-size: 13px;
  letter-spacing: 0.5px;
}

.ticker-item::after {
  content: '·';
  margin-left: 24px;
  color: rgba(140, 170, 230, 0.55);
}

@keyframes tickerMove {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

.spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(8, 18, 44, 0.35);
  border-top-color: #08122c;
  animation: spin 0.8s linear infinite;
}

.form-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  color: rgba(178, 198, 235, 0.66);
  font-size: 12.5px;
}

.secure {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 首次使用提示 */
.tips {
  margin-top: 20px;
  padding: 14px 16px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(110, 231, 255, 0.09), rgba(139, 92, 255, 0.09));
  border: 1px solid rgba(140, 180, 255, 0.16);
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: #dcebff;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.4px;
}

.tips ol {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
}

.tips li {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: rgba(186, 206, 240, 0.8);
  font-size: 12.5px;
  line-height: 1.55;
}

.tips-index {
  flex: none;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #06122b;
  background: linear-gradient(135deg, var(--brand-cyan), #a78bfa);
}

/* ---------- 登录成功动画 ---------- */
.success-mask {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(4, 8, 20, 0.72);
  backdrop-filter: blur(8px);
}

.success-card {
  text-align: center;
  color: #eaf2ff;
}

.success-ring {
  width: 96px;
  height: 96px;
  margin: 0 auto 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 46px;
  color: #06251b;
  background: linear-gradient(140deg, var(--brand-mint), var(--brand-cyan));
  box-shadow: 0 0 0 12px rgba(53, 224, 161, 0.14), 0 0 60px rgba(53, 224, 161, 0.5);
  animation: popIn 0.5s cubic-bezier(0.2, 1.4, 0.4, 1);
}

.success-card p {
  margin: 0;
  letter-spacing: 1px;
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
@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .brand-panel {
    padding: 32px 26px 26px;
  }

  .brand-title {
    font-size: 26px;
  }

  .feature-list {
    display: none;
  }

  .form-panel {
    padding: 32px 26px 30px;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
  }

  .floater {
    display: none;
  }
}

/* 矮屏（1366×768 这类）先保住表单，跑马灯与浮块让位 */
@media (max-height: 800px) {
  .login-page {
    padding: 64px 24px 46px;
  }

  .ticker {
    display: none;
  }

  .floater {
    opacity: 0.55;
  }
}

/* 用户系统设置「减少动态效果」时，关掉大幅动画 */
.login-page.is-reduced .aurora,
.login-page.is-reduced .grid-floor,
.login-page.is-reduced .floater,
.login-page.is-reduced .logo-ring,
.login-page.is-reduced .submit-shine,
.login-page.is-reduced .wave,
.login-page.is-reduced .caret,
.login-page.is-reduced .ticker-track,
.login-page.is-reduced .login-shell::before {
  animation: none;
}

.login-page.is-reduced .login-shell {
  transition: none;
}
</style>
