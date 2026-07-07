const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const DATA_VERSION = "diary-records-v5-memory";

const state = {
  entries: [],
  currentId: null,
  currentImage: "",
  visualMode: "particles",
  selectedMood: "松弛",
  startedAt: Date.now(),
  particles: [],
  mouse: { x: -9999, y: -9999, active: false },
  settings: {
    baseUrl: "",
    apiKey: "",
    model: "gemini-3-flash-preview",
    musicModel: "ace-step-1.5",
    musicBaseUrl: ""
  },
  supabase: null,
  user: null,
  guestMode: localStorage.getItem("diary-records.guestMode") === "true",
  audio: null,
  audioNodes: [],
  uploadedAudioUrls: new Map(),
  visualizerTimer: 0,
  soundOn: true,
  performance: {
    pixelRatio: 1,
    lastFrame: 0,
    targetFps: 40,
    particleBudget: 5600
  },
  intro: {
    active: true,
    particles: [],
    raf: 0,
    pointer: { x: 0, y: 0, active: false }
  },
  gpu: {
    ready: false,
    failed: false,
    THREE: null,
    renderer: null,
    scene: null,
    camera: null,
    geometry: null,
    material: null,
    points: null,
    requestId: 0,
    pendingImage: "",
    targetDisruption: 0,
    disruption: 0,
    mouseWorld: { x: 0, y: 0, z: 0 },
    pointerActive: false,
    targetRotationX: -0.12,
    targetRotationY: 0,
    rotationX: -0.12,
    rotationY: 0,
    particleCount: 130000,
    lastSrc: ""
  },
  hand: {
    running: false,
    loading: false,
    landmarker: null,
    stream: null,
    visionBase: "",
    lastVideoTime: -1,
    lastPalm: null,
    gesture: "idle",
    raf: 0
  },
  memory: {
    dragging: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
    pointerX: 0,
    pointerY: 0,
    raf: 0,
    snapTimer: 0
  }
};

const demoImages = [
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#d7eef6"/><stop offset=".42" stop-color="#2b5262"/><stop offset="1" stop-color="#0a0b0c"/></linearGradient><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3"/><feColorMatrix type="saturate" values="0"/></filter></defs><rect fill="url(#g)" width="900" height="900"/><circle cx="455" cy="380" r="170" fill="#f4d184" opacity=".78"/><path d="M0 620 C180 520 300 620 470 525 C650 424 740 520 900 430 L900 900 L0 900Z" fill="#0a0b0c"/><path d="M340 535 L448 300 L552 535Z" fill="#111719"/><rect x="411" y="520" width="91" height="115" rx="44" fill="#182226"/><rect width="900" height="900" filter="url(#n)" opacity=".12"/></svg>`),
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 900"><defs><radialGradient id="r" cx=".5" cy=".35" r=".65"><stop stop-color="#f2efdf"/><stop offset=".45" stop-color="#62798b"/><stop offset="1" stop-color="#050506"/></radialGradient></defs><rect width="900" height="900" fill="url(#r)"/><rect x="210" y="545" width="480" height="48" rx="24" fill="#f4f0e5" opacity=".8"/><rect x="302" y="360" width="296" height="220" rx="22" fill="#0b0b0c"/><circle cx="374" cy="442" r="18" fill="#e0717e"/><circle cx="526" cy="442" r="18" fill="#e0717e"/><path d="M350 520 Q450 575 550 520" fill="none" stroke="#f5f0e8" stroke-width="16" stroke-linecap="round"/></svg>`)
];

const initialEntries = [
  {
    id: uid(),
    title: "把水晶小店好好收起来",
    date: "2026-05-11",
    range: "22:18 / 打包完最后一单",
    mood: "清醒",
    image: "./assets/crystal.jpg",
    seed:
      "今天把水晶创业这件事正式画上句号了。说“结束”的时候其实没有想象中难过，更多是一种终于把一段喜欢的事情认真做完的踏实感。刚开始只是很喜欢那些石头，喜欢它们在光下面一点点亮起来的样子，后来真的去调研、去算成本、去拍图、去写介绍、去和陌生人沟通，才发现喜欢不是一句话，喜欢是愿意一遍遍把细节做好。最开心的是，我真的靠它赚到了第一桶金。钱本身当然重要，但更重要的是它证明了：我不是只会想，我也可以把一个小小的念头做成真的。以后也许还会有新的尝试，也许也会失败，但我会记得这一次，记得自己曾经认真地相信过喜欢这件事。",
    summary:
      "把水晶小店圆满收尾，不是放弃喜欢，而是确认自己真的把喜欢做成过一件事，也赚到了第一桶金。",
    keywords: ["水晶", "第一桶金", "尝试", "喜欢", "圆满"],
    chat: [
      { role: "ai", text: "这不像一个普通的结束，更像你把一段很亮的经历擦干净、包好，然后郑重地放进抽屉里。" },
      { role: "user", text: "是的，我以前总觉得自己只是想得多，但这次我真的做出来了。" },
      { role: "ai", text: "那就很值得记。喜欢没有停在脑子里，它经过了调研、成本、沟通和试错，最后真的回到了你手里。" }
    ],
    song: {
      title: "第一颗发亮的石头",
      lyric:
        "我把喜欢摊在桌上 / 一颗一颗数过光 / 第一笔收入落进口袋 / 像夏天很轻地回响",
      chorus: "敢把小小的愿望 / 做成真的形状 / 就算明天换方向 / 今晚也值得发亮",
      bpm: 84,
      key: "D major",
      style: "清冷 indie pop / 轻电子鼓 / 玻璃质感合成器 / 温柔女声",
      prompt:
        "A minimal Chinese indie pop song about closing a small crystal business, first income, courage to try what you love, glassy synths, soft female vocal, hopeful and calm."
    }
  },
  {
    id: uid(),
    title: "我的第一只小猫",
    date: "2026-05-08",
    range: "18:40 / 到家第一晚",
    mood: "心动",
    image: "./assets/cat.jpg",
    seed:
      "今天终于把小猫接回家了。付款的时候手还是抖了一下，毕竟这是我第一次用自己挣来的钱，为一件纯粹喜欢的事情支出这么大一笔。可是看见它缩在航空箱里，眼睛圆圆地看我，我又突然觉得这笔钱不是花掉了，而是变成了一种很具体的生活。以前总觉得养猫是以后稳定了、很有余裕了才可以做的事，没想到现在我也可以认真地为一个小生命准备猫粮、猫砂、窝和玩具。它还不太熟悉我，走几步就停下来闻一闻，但我已经开始偷偷期待它以后在我旁边睡觉的样子。今天有一点紧张，也有一点骄傲：我好像真的在用自己赚来的钱，给自己喜欢的生活投票。",
    summary:
      "第一次用自己挣来的钱迎接一只小猫，紧张、心疼、骄傲和期待混在一起，变成很真实的成就感。",
    keywords: ["小猫", "成就感", "喜欢", "责任", "第一笔大支出"],
    chat: [
      { role: "ai", text: "这不是冲动消费，是你第一次很认真地把“我想要这样的生活”变成了现实。" },
      { role: "user", text: "对，我有点心疼钱，但更多是觉得自己终于可以照顾一个喜欢的小东西了。" },
      { role: "ai", text: "那种成就感很安静，但很深。它不只是买到了一只猫，也是你开始相信自己能承担喜欢。" }
    ],
    song: {
      title: "给喜欢的生活投票",
      lyric:
        "小小的爪子踩过地板 / 我把紧张藏进口袋 / 钱变成猫粮和灯光 / 也变成我新的勇敢",
      chorus: "你慢慢靠近吧 / 我也慢慢长大 / 从今天开始 / 家里多了一点柔软的回答",
      bpm: 92,
      key: "G major",
      style: "lo-fi bedroom pop / 木吉他 / 轻柔节拍 / 温暖但不甜腻",
      prompt:
        "A warm lo-fi bedroom pop song in Chinese about bringing home the first kitten with self-earned money, responsibility, pride, tenderness, soft guitar and gentle beat."
    }
  },
  {
    id: uid(),
    title: "算法实习终于落地",
    date: "2026-05-06",
    range: "16:25 / 收到 offer 后",
    mood: "松弛",
    image: "./assets/internship.jpg",
    seed:
      "今天收到算法实习的 offer 了，看到消息的时候我先愣了几秒，然后才慢慢笑出来。这个过程比我想象中曲折很多：简历改了好几版，项目经历讲到后来自己都快背下来了，第一场面试结束后还复盘了很久，觉得有个问题明明可以答得更清楚。中间也有很沮丧的时候，尤其是等结果的那几天，手机一亮就忍不住看是不是邮件。后来二面的时候反而放松了一点，我把自己做过的模型、调参过程、踩过的坑都讲得比较实在，没有再假装自己什么都会。也许面试官喜欢的就是这种真实吧。现在回头看，那些准备到很晚的晚上、那些被问住以后重新补的知识点，突然都有了落点。不是说拿到实习就万事大吉了，但至少今天，我可以允许自己高兴一下。",
    summary:
      "算法实习 offer 落地，曲折的面试、反复复盘和等待终于有了结果，也确认了真实表达自己的价值。",
    keywords: ["算法实习", "offer", "面试", "复盘", "真实"],
    chat: [
      { role: "ai", text: "你不是突然幸运，是前面那些反复修改、复盘和补知识点，终于在今天一起被看见了。" },
      { role: "user", text: "最开心的是我后面没有硬装很厉害，而是把真实做过的东西讲清楚了。" },
      { role: "ai", text: "这很珍贵。算法面试当然看能力，但也看一个人怎么面对不会、怎么解释过程、怎么继续往前走。" }
    ],
    song: {
      title: "等邮件亮起",
      lyric:
        "把简历改到凌晨两点 / 把不会的题重新看一遍 / 当邮件终于亮起来 / 我听见心落回人间",
      chorus: "不是一夜之间 / 是每个晚上的铺垫 / 我带着真实的自己 / 走进下一段时间",
      bpm: 88,
      key: "A major",
      style: "cinematic pop / piano + soft synth / steady beat / restrained uplifting",
      prompt:
        "A restrained uplifting Chinese cinematic pop song about getting an algorithm internship offer after difficult interviews, waiting for emails, honest technical storytelling, piano and soft synth."
    }
  }
];

const canvas = $("#particleCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const webglCanvas = $("#particleWebglCanvas");
const handVideo = $("#handTrackerVideo");
const introCanvas = $("#introCanvas");
const introCtx = introCanvas?.getContext("2d");
const exportCanvas = $("#shareCanvas");
const exportCtx = exportCanvas.getContext("2d");

async function boot() {
  initIntro();
  loadSettings();
  initSupabase();
  await restoreAuth();
  loadEntries();
  if (state.user) await loadEntriesFromCloud();
  state.currentId = state.entries[0]?.id ?? null;
  persist();
  bindEvents();
  setToday();
  renderAll();
  initGpuParticleSystem();
  tickTimer();
  drawLoop();
  buildWave();
  if (location.protocol !== "file:" && "serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    } catch (error) {
      // PWA caching is optional for the prototype.
    }
  }
}

function initIntro() {
  if (!introCanvas || !introCtx) {
    document.body.classList.remove("intro-active");
    state.intro.active = false;
    return;
  }
  if (sessionStorage.getItem("diary-records.introSeen") === "true") {
    document.body.classList.remove("intro-active");
    state.intro.active = false;
    return;
  }
  resizeIntroCanvas();
  seedIntroParticles();
  $("#introStartBtn")?.addEventListener("click", dismissIntro);
  $("#introScreen")?.addEventListener(
    "click",
    (event) => {
      if (event.target.closest("#introStartBtn")) dismissIntro();
    },
    true
  );
  introCanvas.addEventListener("pointermove", (event) => {
    const rect = introCanvas.getBoundingClientRect();
    const ratio = state.intro.pixelRatio || 1;
    state.intro.pointer.x = (event.clientX - rect.left) * ratio;
    state.intro.pointer.y = (event.clientY - rect.top) * ratio;
    state.intro.pointer.active = true;
  });
  introCanvas.addEventListener("pointerleave", () => {
    state.intro.pointer.active = false;
  });
  window.addEventListener("resize", () => {
    if (!state.intro.active) return;
    resizeIntroCanvas();
    seedIntroParticles();
  });
  drawIntro();
}

function dismissIntro() {
  sessionStorage.setItem("diary-records.introSeen", "true");
  document.body.classList.remove("intro-active");
  state.intro.active = false;
  if (state.intro.raf) cancelAnimationFrame(state.intro.raf);
}

function resizeIntroCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 620 ? 1.15 : 1.4);
  state.intro.pixelRatio = ratio;
  introCanvas.width = Math.max(320, Math.floor(window.innerWidth * ratio));
  introCanvas.height = Math.max(320, Math.floor(window.innerHeight * ratio));
}

function seedIntroParticles() {
  const count = window.innerWidth < 620 ? 165 : 260;
  const w = introCanvas.width;
  const h = introCanvas.height;
  const palette = [
    [114, 183, 255],
    [231, 197, 121],
    [73, 213, 150],
    [247, 242, 234],
    [154, 205, 220]
  ];
  state.intro.particles = Array.from({ length: count }, (_, index) => {
    const color = palette[index % palette.length];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      age: Math.random() * 100,
      speed: 0.35 + Math.random() * 1.2,
      size: 0.35 + Math.random() * 1.8,
      alpha: 0.08 + Math.random() * 0.28,
      color
    };
  });
}

function drawIntro(now = 0) {
  if (!state.intro.active || !introCtx) return;
  state.intro.raf = requestAnimationFrame(drawIntro);
  const w = introCanvas.width;
  const h = introCanvas.height;
  const t = now * 0.00024;

  introCtx.globalCompositeOperation = "source-over";
  introCtx.fillStyle = "rgba(3,4,6,0.18)";
  introCtx.fillRect(0, 0, w, h);

  const cx = w * 0.5;
  const cy = h * 0.48;
  introCtx.globalCompositeOperation = "lighter";
  introCtx.lineCap = "round";
  introCtx.lineJoin = "round";
  for (const p of state.intro.particles) {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const radius = Math.hypot(dx, dy) / Math.max(w, h);
    const angle =
      Math.atan2(dy, dx) +
      Math.sin(dx * 0.006 + t * 7.5) * 0.72 +
      Math.cos(dy * 0.004 - t * 6.4) * 0.58 +
      radius * 5.2;
    const pull = 0.42 + Math.sin(radius * 12 - t * 18) * 0.22;
    const vx = Math.cos(angle) * p.speed * (1.6 + pull);
    const vy = Math.sin(angle) * p.speed * (1.2 + pull);

    if (state.intro.pointer.active) {
      const px = p.x - state.intro.pointer.x;
      const py = p.y - state.intro.pointer.y;
      const dist = Math.hypot(px, py);
      const limit = 160 * (state.intro.pixelRatio || 1);
      if (dist < limit) {
        const force = (1 - dist / limit) * 2.8;
        p.x += (px / Math.max(dist, 1)) * force;
        p.y += (py / Math.max(dist, 1)) * force;
      }
    }

    const ox = p.x;
    const oy = p.y;
    p.x += vx;
    p.y += vy;
    p.age += 1;

    if (p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40 || p.age > 680) {
      p.x = Math.random() * w;
      p.y = h * (0.18 + Math.random() * 0.72);
      p.age = 0;
    }

    const [r, g, b] = p.color;
    introCtx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
    introCtx.lineWidth = p.size * (state.intro.pixelRatio || 1);
    introCtx.beginPath();
    introCtx.moveTo(ox, oy);
    introCtx.lineTo(p.x, p.y);
    introCtx.stroke();

    if (p.age % 9 < 1) {
      introCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha * 1.7})`;
      introCtx.beginPath();
      introCtx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
      introCtx.fill();
    }
  }
  introCtx.globalCompositeOperation = "source-over";
}

function initSupabase() {
  const env = window.__DIARY_ENV__ || {};
  const url = env.VITE_SUPABASE_URL || "";
  const anonKey = env.VITE_SUPABASE_ANON_KEY || "";
  resetAuthFields();
  if (!url || !anonKey || !window.supabase?.createClient) {
    setAuthStatus("暂未连接云端，可以先以游客模式体验。");
    return;
  }
  state.supabase = window.supabase.createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  setAuthStatus("云端空间已准备好。登录后，日记、对话和唱片会保存到你的账号。");
}

async function restoreAuth() {
  if (!state.supabase) {
    updateAuthUi();
    return;
  }
  const { data } = await state.supabase.auth.getSession();
  state.user = data?.session?.user || null;
  state.supabase.auth.onAuthStateChange(async (_event, session) => {
    state.user = session?.user || null;
    state.guestMode = !state.user && state.guestMode;
    loadEntries();
    if (state.user) await loadEntriesFromCloud();
    renderAll();
    updateAuthUi();
  });
  if (state.user) {
    state.guestMode = false;
    localStorage.removeItem("diary-records.guestMode");
  }
  updateAuthUi();
}

function bindAuthEvents() {
  $("#authForm")?.addEventListener("submit", signIn);
  $("#signUpBtn")?.addEventListener("click", signUp);
  $("#guestBtn")?.addEventListener("click", continueAsGuest);
  $("#profileBtn")?.addEventListener("click", () => {
    updateProfileUi();
    $("#profileModal")?.showModal();
  });
  $("#logoutBtn")?.addEventListener("click", signOut);
  $("#syncCloudBtn")?.addEventListener("click", syncEntriesToCloud);
}

function setAuthStatus(message) {
  const status = $("#authStatus");
  if (status) status.textContent = message;
}

function resetAuthFields() {
  ["authEmail", "authPassword"].forEach((id) => {
    const input = $(`#${id}`);
    if (!input) return;
    input.value = "";
    setTimeout(() => {
      input.value = "";
    }, 250);
    setTimeout(() => {
      input.value = "";
    }, 900);
  });
}

function displayNameForUser() {
  if (!state.user) return "Guest";
  return state.user.user_metadata?.display_name || state.user.email?.split("@")[0] || "Diary User";
}

function updateAuthUi() {
  document.body.classList.toggle("auth-required", !state.user && !state.guestMode);
  updateProfileUi();
}

function updateProfileUi() {
  const name = displayNameForUser();
  const email = state.user?.email || "本地游客模式";
  const initial = (name || "D").trim().slice(0, 1).toUpperCase();
  if ($("#accountName")) $("#accountName").textContent = name;
  if ($("#accountAvatar")) $("#accountAvatar").textContent = initial;
  if ($("#profileName")) $("#profileName").textContent = name;
  if ($("#profileEmail")) $("#profileEmail").textContent = email;
  if ($("#profileAvatar")) $("#profileAvatar").textContent = initial;
  if ($("#profileEntryCount")) $("#profileEntryCount").textContent = String(state.entries.length);
  if ($("#profileSyncState")) $("#profileSyncState").textContent = state.user ? "Cloud" : "Local";
}

async function signIn(event) {
  event.preventDefault();
  if (!state.supabase) {
    setAuthStatus("请用 npm run dev 启动，或检查 .env 中的 Supabase 配置。");
    return;
  }
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  if (!email || !password) {
    setAuthStatus("请输入邮箱和密码。");
    return;
  }
  setAuthStatus("正在登录...");
  const { error } = await state.supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setAuthStatus(error.message);
    return;
  }
  state.guestMode = false;
  localStorage.removeItem("diary-records.guestMode");
  setAuthStatus("登录成功。");
}

async function signUp() {
  if (!state.supabase) {
    setAuthStatus("请先用 npm run dev 启动本地服务读取 Supabase 配置。");
    return;
  }
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const displayName = $("#authName").value.trim();
  if (!email || password.length < 6) {
    setAuthStatus("请输入邮箱，并设置至少 6 位密码。");
    return;
  }
  setAuthStatus("正在注册...");
  const { error } = await state.supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || email.split("@")[0] }
    }
  });
  if (error) {
    setAuthStatus(error.message);
    return;
  }
  state.guestMode = false;
  localStorage.removeItem("diary-records.guestMode");
  setAuthStatus("注册完成。如果 Supabase 开启了邮箱验证，请先查收邮件。");
}

function continueAsGuest() {
  state.guestMode = true;
  localStorage.setItem("diary-records.guestMode", "true");
  updateAuthUi();
  toast("已进入游客唱片库");
}

async function signOut() {
  if (state.supabase && state.user) await state.supabase.auth.signOut();
  state.user = null;
  state.guestMode = false;
  localStorage.removeItem("diary-records.guestMode");
  loadEntries();
  renderAll();
  updateAuthUi();
  $("#profileModal")?.close();
}

function storageNamespace() {
  return state.user?.id ? `diary-records.user.${state.user.id}` : "diary-records.guest";
}

function loadEntries() {
  const namespace = storageNamespace();
  const saved = localStorage.getItem(`${namespace}.entries`) || (!state.user ? localStorage.getItem("diary-records.entries") : "");
  const savedVersion = localStorage.getItem(`${namespace}.version`) || localStorage.getItem("diary-records.version");
  state.entries = saved && savedVersion === DATA_VERSION ? JSON.parse(saved) : cloneInitialEntries();
  state.currentId = state.entries[0]?.id ?? null;
}

async function loadEntriesFromCloud() {
  if (!state.supabase || !state.user) return;
  const { data, error } = await state.supabase
    .from("diary_entries")
    .select("payload, updated_at")
    .eq("user_id", state.user.id)
    .order("updated_at", { ascending: false });
  if (error) {
    if ($("#profileSyncState")) $("#profileSyncState").textContent = "Local";
    return;
  }
  if (data?.length) {
    state.entries = data.map((row) => row.payload).filter(Boolean);
    state.currentId = state.entries[0]?.id ?? null;
    persist();
  }
}

async function syncEntriesToCloud() {
  if (!state.supabase || !state.user) {
    toast("登录后才能同步到 Supabase");
    return;
  }
  const rows = state.entries.map((entry) => ({
    id: entry.id,
    user_id: state.user.id,
    payload: entry,
    updated_at: new Date().toISOString()
  }));
  const { error } = await state.supabase.from("diary_entries").upsert(rows, { onConflict: "id" });
  if (error) {
    toast("同步失败，请确认 Supabase 表已创建");
    if ($("#profileSyncState")) $("#profileSyncState").textContent = "Local";
    return;
  }
  if ($("#profileSyncState")) $("#profileSyncState").textContent = "Synced";
  toast("已同步到 Supabase");
}

function bindEvents() {
  bindAuthEvents();
  document.addEventListener("click", async (event) => {
    const openMemoryButton = event.target.closest("[data-open-memory]");
    if (openMemoryButton) {
      event.preventDefault();
      event.stopPropagation();
      openMemoryDetail(openMemoryButton.dataset.openMemory);
      return;
    }

    const playMemoryButton = event.target.closest("[data-play-memory]");
    if (playMemoryButton) {
      event.preventDefault();
      event.stopPropagation();
      state.currentId = playMemoryButton.dataset.playMemory;
      renderAll();
      await playSong();
      return;
    }

    const regenerateSongButton = event.target.closest("[data-regenerate-song]");
    if (regenerateSongButton) {
      event.preventDefault();
      event.stopPropagation();
      await regenerateSong(regenerateSongButton.dataset.regenerateSong);
      return;
    }

    const deleteMemoryButton = event.target.closest("[data-delete-memory]");
    if (deleteMemoryButton) {
      event.preventDefault();
      event.stopPropagation();
      await deleteEntry(deleteMemoryButton.dataset.deleteMemory);
      return;
    }

    const continueMemoryButton = event.target.closest("[data-continue-memory]");
    if (continueMemoryButton) {
      event.preventDefault();
      state.currentId = continueMemoryButton.dataset.continueMemory;
      closeMemoryDetail();
      renderAll();
      routeTo("studio");
      openPanel("chat");
      return;
    }

    const musicMemoryButton = event.target.closest("[data-music-memory]");
    if (musicMemoryButton) {
      event.preventDefault();
      state.currentId = musicMemoryButton.dataset.musicMemory;
      closeMemoryDetail();
      renderAll();
      routeTo("music");
      return;
    }

    if (event.target.closest("[data-memory-close]")) {
      closeMemoryDetail();
      return;
    }

    const memoryCard = event.target.closest(".memory-card[data-id]");
    if (memoryCard && !event.target.closest("button, a, input, textarea, select")) {
      const carousel = $("#memoryCarousel");
      if (!carousel?.dataset.dragMoved) openMemoryDetail(memoryCard.dataset.id);
      return;
    }

    const openButton = event.target.closest("[data-open-panel]");
    if (openButton) openPanel(openButton.dataset.openPanel);
    if (event.target.closest("[data-close-panel]")) closePanels();
  });

  $$(".nav-tab, .brand").forEach((button) => {
    button.addEventListener("click", () => routeTo(button.dataset.route));
  });

  $("#photoInput").addEventListener("change", onPhoto);
  $("#createBtn").addEventListener("click", createEntry);
  $("#demoBtn").addEventListener("click", loadDemo);
  $("#chatForm").addEventListener("submit", sendChat);
  $("#summarizeBtn").addEventListener("click", enrichEntry);
  $("#songBtn").addEventListener("click", () => generateSong({ force: true }));
  $("#voiceBtn").addEventListener("click", startVoiceInput);
  $("#handTrackBtn")?.addEventListener("click", toggleHandTracking);
  $("#soundBtn").addEventListener("click", toggleSound);
  $("#playSongBtn").addEventListener("click", playSong);
  $("#exportBtn").addEventListener("click", exportShareImage);
  $("#copyBtn").addEventListener("click", copyShareText);
  $("#nativeShareBtn").addEventListener("click", nativeShare);
  $("#musicInput")?.addEventListener("change", uploadMusicForEntry);
  $("#removeMusicBtn")?.addEventListener("click", removeUploadedMusic);
  $("#simulateBtn").addEventListener("click", simulatePhoneSignals);
  $("#sceneWriteBtn").addEventListener("click", () => openPanel("compose"));
  $("#sceneChatBtn").addEventListener("click", () => openPanel("chat"));
  $("#dockVoiceBtn").addEventListener("click", startVoiceInput);
  $("#dockHandBtn")?.addEventListener("click", toggleHandTracking);
  $("#sheetBackdrop").addEventListener("click", closePanels);
  $$("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => openPanel(button.dataset.openPanel));
  });
  $$("[data-close-panel]").forEach((button) => {
    button.addEventListener("click", closePanels);
  });

  $$(".mood-chip").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMood = button.dataset.mood;
      $$(".mood-chip").forEach((chip) => chip.classList.toggle("is-selected", chip === button));
    });
  });

  $$(".segmented button").forEach((button) => {
    button.addEventListener("click", () => {
      state.visualMode = button.dataset.visual;
      $$(".segmented button").forEach((item) => item.classList.toggle("is-active", item === button));
      $("#recordView").classList.toggle("is-visible", state.visualMode === "record");
      canvas.style.opacity = state.visualMode === "record" ? "0.22" : "1";
      if (webglCanvas) webglCanvas.style.opacity = state.visualMode === "record" ? "0.16" : "1";
    });
  });

  $("#settingsBtn").addEventListener("click", () => $("#settingsModal").showModal());
  $("#saveSettingsBtn").addEventListener("click", saveSettings);
  $("#memoryModal").addEventListener("click", (event) => {
    if (event.target === $("#memoryModal")) closeMemoryDetail();
  });

  const move = (event) => {
    const point = event.touches?.[0] ?? event;
    const rect = canvas.getBoundingClientRect();
    const ratioX = canvas.width / Math.max(rect.width, 1);
    const ratioY = canvas.height / Math.max(rect.height, 1);
    state.mouse.x = (point.clientX - rect.left) * ratioX;
    state.mouse.y = (point.clientY - rect.top) * ratioY;
    state.mouse.active = true;
    updateGpuMouse(point.clientX, point.clientY, 0.42);
  };

  canvas.addEventListener("pointermove", move);
  $("#visualFrame")?.addEventListener("pointermove", move);
  webglCanvas?.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", () => {
    state.mouse.active = false;
    releaseGpuPointer();
  });
  $("#visualFrame")?.addEventListener("pointerleave", () => {
    state.mouse.active = false;
    releaseGpuPointer();
  });
  webglCanvas?.addEventListener("pointerleave", () => {
    state.mouse.active = false;
    releaseGpuPointer();
  });
  canvas.addEventListener("touchmove", move, { passive: true });
  $("#visualFrame")?.addEventListener("touchmove", move, { passive: true });
  webglCanvas?.addEventListener("touchmove", move, { passive: true });
  window.addEventListener("resize", () => prepareParticles(getCurrentEntry()?.image));
  $("#memoryCarousel").addEventListener("scroll", () => requestAnimationFrame(updateMemoryDepth), { passive: true });
  setupMemoryInteractions();
}

function routeTo(route) {
  closePanels();
  $$(".view").forEach((view) => view.classList.toggle("is-visible", view.dataset.view === route));
  $$(".nav-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.route === route));
  if (route === "music") renderShareCanvas();
  if (route === "memory") {
    renderMemory();
    requestAnimationFrame(updateMemoryDepth);
  }
}

function openPanel(name) {
  document.body.classList.toggle("panel-compose-open", name === "compose");
  document.body.classList.toggle("panel-chat-open", name === "chat");
  if (window.matchMedia("(max-width: 1080px)").matches) {
    $$("[data-panel]").forEach((panel) => {
      const active = panel.dataset.panel === name;
      panel.style.setProperty("transition", "none", "important");
      panel.style.setProperty("transform", active ? "none" : "translateY(calc(100% + 28px))", "important");
      panel.style.setProperty("opacity", active ? "1" : "0", "important");
      panel.style.setProperty("pointer-events", active ? "auto" : "none", "important");
    });
  }
}

function closePanels() {
  document.body.classList.remove("panel-compose-open", "panel-chat-open");
  $$("[data-panel]").forEach((panel) => {
    if (window.matchMedia("(max-width: 1080px)").matches) {
      panel.style.setProperty("transition", "none", "important");
      panel.style.setProperty("transform", "translateY(calc(100% + 28px))", "important");
      panel.style.setProperty("opacity", "0", "important");
      panel.style.setProperty("pointer-events", "none", "important");
    } else {
      panel.removeAttribute("style");
    }
  });
}

function setupMemoryInteractions() {
  const carousel = $("#memoryCarousel");
  if (!carousel) return;

  carousel.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      carousel.scrollLeft += event.deltaY * 1.15;
      window.clearTimeout(state.memory.snapTimer);
      state.memory.snapTimer = window.setTimeout(snapMemoryToNearest, 180);
    },
    { passive: false }
  );

  carousel.addEventListener("pointerdown", (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    if (event.target.closest("button, a, input, textarea, select")) return;
    state.memory.dragging = true;
    state.memory.moved = false;
    state.memory.startX = event.clientX;
    state.memory.scrollLeft = carousel.scrollLeft;
    carousel.classList.add("is-dragging");
    carousel.setPointerCapture?.(event.pointerId);
  });

  carousel.addEventListener("pointermove", (event) => {
    const rect = carousel.getBoundingClientRect();
    state.memory.pointerX = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
    state.memory.pointerY = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;

    if (state.memory.dragging) {
      const distance = event.clientX - state.memory.startX;
      if (Math.abs(distance) > 5) state.memory.moved = true;
      carousel.scrollLeft = state.memory.scrollLeft - distance * 1.02;
    }
    scheduleMemoryDepth();
  });

  carousel.addEventListener("pointerup", (event) => {
    if (!state.memory.dragging) return;
    const moved = state.memory.moved;
    state.memory.dragging = false;
    carousel.classList.remove("is-dragging");
    carousel.releasePointerCapture?.(event.pointerId);
    if (moved) {
      carousel.dataset.dragMoved = "true";
      window.setTimeout(() => delete carousel.dataset.dragMoved, 180);
      snapMemoryToNearest();
    }
  });

  carousel.addEventListener("pointerleave", () => {
    state.memory.pointerX = 0;
    state.memory.pointerY = 0;
    if (state.memory.dragging) {
      state.memory.dragging = false;
      carousel.classList.remove("is-dragging");
      snapMemoryToNearest();
    }
    scheduleMemoryDepth();
  });
}

function scheduleMemoryDepth() {
  if (state.memory.raf) return;
  state.memory.raf = requestAnimationFrame(() => {
    state.memory.raf = 0;
    updateMemoryDepth();
  });
}

function setToday() {
  const now = new Date();
  $("#entryDate").value = now.toISOString().slice(0, 10);
  $("#entryRange").value = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function loadSettings() {
  const saved = localStorage.getItem("diary-records.settings");
  if (saved) state.settings = { ...state.settings, ...JSON.parse(saved) };
  if (!state.settings.model) state.settings.model = "gemini-3-flash-preview";
  if (!state.settings.musicModel) state.settings.musicModel = "ace-step-1.5";
  $("#apiBase").value = state.settings.baseUrl;
  $("#apiKey").value = state.settings.apiKey;
  $("#apiModel").value = state.settings.model;
  $("#musicModel").value = state.settings.musicModel;
  if ($("#musicBaseUrl")) $("#musicBaseUrl").value = state.settings.musicBaseUrl || "";
  $("#modelName").textContent = state.settings.model || "今日陪伴";
}

function saveSettings() {
  state.settings = {
    baseUrl: $("#apiBase").value.trim(),
    apiKey: $("#apiKey").value.trim(),
    model: $("#apiModel").value.trim() || "gemini-3-flash-preview",
    musicModel: $("#musicModel").value.trim() || "ace-step-1.5",
    musicBaseUrl: $("#musicBaseUrl")?.value.trim() || ""
  };
  localStorage.setItem("diary-records.settings", JSON.stringify(state.settings));
  $("#modelName").textContent = state.settings.model || "今日陪伴";
  toast("AI 路由已保存");
}

function onPhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.currentImage = reader.result;
    $("#recordImage").src = state.currentImage;
    prepareParticles(state.currentImage);
    $("#emptyState").classList.add("is-hidden");
    toast("影像已载入");
  };
  reader.readAsDataURL(file);
}

function createEntry() {
  const seed = $("#entrySeed").value.trim();
  const image = state.currentImage || getCurrentEntry()?.image || demoImages[0];
  const entry = {
    id: uid(),
    title: $("#entryTitle").value.trim() || titleFromSeed(seed) || "未命名的一天",
    date: $("#entryDate").value || new Date().toISOString().slice(0, 10),
    range: $("#entryRange").value.trim() || "此刻",
    mood: state.selectedMood,
    image,
    seed: seed || "今天没有写很多，但我想把这个瞬间保存下来。",
    summary: "",
    keywords: extractKeywords(`${seed} ${state.selectedMood}`),
    chat: [
      { role: "ai", text: companionOpening(state.selectedMood, seed) }
    ],
    song: null
  };

  state.entries.unshift(entry);
  state.currentId = entry.id;
  persist();
  renderAll();
  routeTo("studio");
  toast("今天已经留好了");
}

function loadDemo() {
  const demo = initialEntries[0];
  state.currentImage = demo.image;
  $("#entryTitle").value = demo.title;
  $("#entryDate").value = demo.date;
  $("#entryRange").value = demo.range;
  $("#entrySeed").value = demo.seed;
  state.selectedMood = demo.mood;
  $$(".mood-chip").forEach((chip) => chip.classList.toggle("is-selected", chip.dataset.mood === demo.mood));
  prepareParticles(demo.image);
  $("#recordImage").src = demo.image;
  $("#emptyState").classList.add("is-hidden");
  toast("样片已载入");
}

async function sendChat(event) {
  event.preventDefault();
  const text = $("#chatInput").value.trim();
  if (!text) return;
  const entry = ensureEntry();
  entry.chat.push({ role: "user", text });
  $("#chatInput").value = "";
  renderChat(entry);
  persist();

  const aiText = await askCompanion(entry, text);
  entry.chat.push({ role: "ai", text: aiText });
  entry.seed = mergeText(entry.seed, text);
  renderChat(entry);
  renderMemory();
  persist();
  speak(aiText);
}

async function askCompanion(entry, userText) {
  if (state.settings.baseUrl && state.settings.apiKey && state.settings.model) {
    try {
      const response = await fetch(`${state.settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.settings.apiKey}`
        },
        body: JSON.stringify({
          model: state.settings.model,
          temperature: 0.86,
          messages: [
            {
              role: "system",
              content:
                "你是 Diary Records 的私人日记伙伴，不是客服，也不是心理咨询师。你的语气像一个很会倾听、审美很好、说话克制的朋友。回复必须自然、有生活气、不要模板化，不要说“我理解你的感受”这种套话。先接住用户刚说的具体细节，再补一句温柔但不油腻的观察，最后只问一个能帮助继续记录的小问题。每次 60-120 字。"
            },
            {
              role: "user",
              content: multimodalContent(
                entry,
                `日记标题：${entry.title}
日期与时间：${entry.date} ${entry.range}
心情：${entry.mood}
已有日记：${entry.seed}
已有对话：
${entry.chat.map((item) => `${item.role === "user" ? "用户" : "AI"}：${item.text}`).join("\n")}
用户刚说：${userText}

请像真实朋友一样回复，不要总结成报告，不要提“作为AI”。`
              )
            }
          ]
        })
      });
      if (!response.ok) throw new Error("API request failed");
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || localCompanionReply(entry, userText);
    } catch (error) {
      toast("暂时连不上模型，先陪你在本地记下");
    }
  }
  return localCompanionReply(entry, userText);
}

function localCompanionReply(entry, userText) {
  const text = `${entry.seed} ${userText}`;
  const detail = pickDetail(userText) || pickDetail(entry.seed) || "这个瞬间";
  const themes = [
    {
      match: ["水晶", "创业", "第一桶金", "小店", "生意"],
      lines: [
        `我很喜欢你说的“${detail}”。它不像一件被匆忙结束的事，更像你亲手把喜欢做成了一个有重量的证据。`,
        "第一桶金最珍贵的地方，可能不是数字，而是它证明你真的敢把想法拿出来试。"
      ],
      question: "如果给这段小店经历留一句结尾，你会想写“圆满”，还是“我真的做到了”？"
    },
    {
      match: ["猫", "小猫", "猫粮", "猫砂", "航空箱"],
      lines: [
        `“${detail}”这个细节好软。感觉那一刻钱不只是花掉了，它变成了一个会呼吸、会靠近你的生活选择。`,
        "用自己挣来的钱照顾喜欢的小生命，这种骄傲很安静，但其实特别大。"
      ],
      question: "它到家后的第一个小动作是什么？我想把那个画面也放进这张唱片里。"
    },
    {
      match: ["实习", "算法", "面试", "offer", "简历"],
      lines: [
        `你提到“${detail}”的时候，我能感觉到那种终于落地的松一口气。不是突然好运，是前面很多晚上的准备终于被看见了。`,
        "而且你没有把自己包装成什么都会的人，只是把真实做过的事讲清楚，这其实很有力量。"
      ],
      question: "面试里有没有一个问题，是你现在回想起来觉得自己答得最真诚的？"
    }
  ];
  const theme = themes.find((item) => item.match.some((word) => text.includes(word)));
  if (theme) {
    const index = Math.abs(hashCode(userText + entry.title)) % theme.lines.length;
    return `${theme.lines[index]} ${theme.question}`;
  }

  const soft = [
    `我注意到你写了“${detail}”。这不是流水账里的普通一句，更像今天真正留下痕迹的地方。`,
    `这个瞬间有点值得慢下来。不是因为它多重大，而是它刚好露出了你在乎什么。`,
    `我会想把“${detail}”先放进唱片的中心，它像今天的针脚，把很多情绪缝在一起。`
  ];
  const questions = [
    "如果把这一刻再写具体一点，当时你最先看见、听见或者摸到的是什么？",
    "这件事结束以后，你心里更像是松了一口气，还是突然有点舍不得？",
    "要不要给今天补一句很私人、但未来再看会一下子想起来的话？"
  ];
  const index = Math.abs(hashCode(userText + entry.mood)) % soft.length;
  return `${soft[index]} ${questions[index]}`;
}

async function enrichEntry() {
  const entry = ensureEntry();
  const allText = [entry.seed, ...entry.chat.map((item) => item.text)].join("\n");

  if (state.settings.baseUrl && state.settings.apiKey && state.settings.model) {
    try {
      const response = await fetch(`${state.settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.settings.apiKey}`
        },
        body: JSON.stringify({
          model: state.settings.model,
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                "你为中文私人日记生成结构化卡片。只输出 JSON：summary 字符串，keywords 字符串数组，mood 字符串，title 字符串。summary 要像用户自己写的自然短句，不要像报告，不要出现“用户”。keywords 2-4 个字为主。"
            },
            { role: "user", content: multimodalContent(entry, allText) }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const raw = data.choices?.[0]?.message?.content || "{}";
        const parsed = safeJson(raw) || {};
        entry.summary = parsed.summary || localSummary(allText);
        entry.keywords = (parsed.keywords || extractKeywords(allText)).slice(0, 6);
        entry.mood = parsed.mood || entry.mood;
        entry.title = parsed.title || entry.title;
      }
    } catch (error) {
      entry.summary = localSummary(allText);
      entry.keywords = extractKeywords(allText);
    }
  } else {
    entry.summary = localSummary(allText);
    entry.keywords = extractKeywords(allText);
  }

  renderAll();
  persist();
  toast("关键词已浮现");
}

async function generateSong(options = {}) {
  const entry = ensureEntry();
  const keywords = entry.keywords?.length ? entry.keywords : extractKeywords(entry.seed);
  if (entry.song?.audioUrl && !options.force) {
    renderMusic();
    routeTo("music");
    return entry.song;
  }
  toast("正在压制私人唱片...");
  if (options.force) await cleanupUploadedSong(entry);
  const generated = await askSongModel(entry, keywords);
  entry.song = generated || { ...composeLocalSong(entry, keywords), generationStatus: "local-draft" };
  persist();
  renderMusic();
  routeTo("music");
  toast(entry.song.audioUrl ? "唱片已经压好" : "先为这天压了一段试播旋律");
  return entry.song;
}

async function regenerateSong(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  state.currentId = entry.id;
  await cleanupUploadedSong(entry);
  entry.song = null;
  persist();
  renderAll();
  await generateSong({ force: true });
  const freshEntry = getCurrentEntry();
  if ($("#memoryModal")?.open && freshEntry) renderMemoryDetail(freshEntry);
  renderMemory();
}

async function deleteEntry(id) {
  const entry = state.entries.find((item) => item.id === id);
  if (!entry) return;
  const ok = window.confirm(`删除「${entry.title || "这张日记唱片"}」？这只会删除当前浏览器里的本地记录。`);
  if (!ok) return;
  await cleanupUploadedSong(entry);
  state.entries = state.entries.filter((item) => item.id !== id);
  state.currentId = state.entries[0]?.id ?? null;
  persist();
  closeMemoryDetail();
  renderAll();
  toast("这张日记唱片已删除");
}

async function cleanupUploadedSong(entry) {
  if (entry?.song?.audioSource !== "upload" || !entry.song.audioStoreKey) return;
  revokeUploadedAudioUrl(entry.song.audioStoreKey);
  await deleteAudioBlob(entry.song.audioStoreKey);
}

async function askSongModel(entry, keywords) {
  const model = state.settings.musicModel || state.settings.model || "gemini-3.5-flash";
  if (/^(ace-step|acestep)/i.test(model)) return askAceStepModel(entry, keywords, model);
  if (!state.settings.baseUrl || !state.settings.apiKey || !model) return null;
  if (/^lyria-/i.test(model)) return askLyriaModel(entry, keywords, model);
  try {
    const response = await fetch(`${state.settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.settings.apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.74,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是一个私人日记音乐制作人。根据日记写一首中文短歌方案。只输出 JSON：title, lyric, chorus, style, bpm, key, prompt。如果模型支持真实音频，可额外返回 audioUrl。歌词要自然，不要AI腔，不要口号。"
          },
          {
            role: "user",
            content: `标题：${entry.title}
心情：${entry.mood}
关键词：${keywords.join("、")}
日记：${entry.seed}
对话：${entry.chat.map((item) => `${item.role}:${item.text}`).join("\n")}`
          }
        ]
      })
    });
    if (!response.ok) throw new Error("music model request failed");
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const parsed = safeJson(raw);
    if (!parsed?.title || !parsed?.lyric) return null;
    return normalizeSong(parsed, entry, keywords);
  } catch (error) {
  toast("暂时先用本地旋律为这天打样");
    return null;
  }
}

async function askAceStepModel(entry, keywords, model) {
  const serviceUrl = (state.settings.musicBaseUrl || "").replace(/\/$/, "");
  if (!serviceUrl) {
    toast("请先在设置里填写 ACE-Step 音乐生成服务地址");
    return null;
  }
  try {
    const plan = await askSongTextPlan(entry, keywords);
    const draft = plan || composeLocalSong(entry, keywords);
    const bpm = Math.max(60, Math.min(128, Number(draft.bpm) || 84));
    const key = normalizeKeyScale(draft.key || "A minor");
    const lyrics = formatLyricsForAce(draft, entry, keywords);
    const prompt = buildAcePrompt(draft, entry, keywords);
    console.info("[ACE-Step] release_task", { serviceUrl, title: draft.title, bpm, key });
    const release = await fetch(`${serviceUrl}/release_task`, {
      method: "POST",
      headers: aceHeaders(serviceUrl),
      body: JSON.stringify({
        prompt,
        lyrics,
        thinking: false,
        sample_mode: false,
        use_format: false,
        use_cot_caption: false,
        use_cot_language: false,
        vocal_language: "zh",
        audio_format: "mp3",
        audio_duration: 45,
        bpm,
        key_scale: key,
        time_signature: "4",
        inference_steps: 8,
        batch_size: 1,
        model: /^ace-step-1\.5$/i.test(model) ? undefined : model
      })
    });
    if (!release.ok) throw new Error(`ACE-Step release_task failed: ${release.status}`);
    const releaseData = await release.json();
    const taskId = releaseData?.data?.task_id || releaseData?.task_id;
    if (!taskId) throw new Error("ACE-Step did not return task_id");
    console.info("[ACE-Step] task_id", taskId);
    toast("唱片正在生成，可能需要几分钟...");
    const result = await pollAceStepResult(serviceUrl, taskId, updateAceStepProgress);
    const audioFile = extractAceAudioFile(result);
    if (!audioFile) throw new Error("ACE-Step result does not include audio file");
    const audioUrl = absoluteAceAudioUrl(serviceUrl, audioFile);
    console.info("[ACE-Step] audio", audioUrl);
    return normalizeSong(
      {
        ...draft,
        lyric: lyrics,
        prompt,
        bpm,
        key,
        style: draft.style || "ACE-Step 1.5 diary pop",
        audioUrl
      },
      entry,
      keywords
    );
  } catch (error) {
    console.warn("ACE-Step generation failed", error);
    toast("ACE-Step 暂未返回音频，先保留歌词与本地旋律");
    return null;
  }
}

async function askSongTextPlan(entry, keywords) {
  const model = state.settings.model || "gemini-3-flash-preview";
  if (!state.settings.baseUrl || !state.settings.apiKey || !model) return null;
  try {
    const response = await fetch(`${state.settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.settings.apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.68,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "你是私人日记音乐制作人。把日记改写成一首可以演唱的中文短歌。只输出 JSON：title, lyric, chorus, style, bpm, key, prompt。歌词要像日常低声叙述，不要口号，不要出现“用户”。prompt 用英文描述编曲、人声、情绪和质感。"
          },
          {
            role: "user",
            content: `标题：${entry.title}
心情：${entry.mood}
关键词：${keywords.join("、")}
日记：${entry.seed}
对话：${entry.chat.map((item) => `${item.role}:${item.text}`).join("\n")}`
          }
        ]
      })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const parsed = safeJson(raw);
    if (!parsed?.title || !parsed?.lyric) return null;
    return normalizeSong(parsed, entry, keywords);
  } catch (error) {
    return null;
  }
}

async function pollAceStepResult(serviceUrl, taskId, onProgress) {
  const started = Date.now();
  const timeoutMs = 20 * 60 * 1000;
  let lastProgressToast = 0;
  while (Date.now() - started < timeoutMs) {
    const response = await fetch(`${serviceUrl}/query_result`, {
      method: "POST",
      headers: aceHeaders(serviceUrl),
      body: JSON.stringify({ task_id_list: [taskId] })
    });
    if (!response.ok) throw new Error(`ACE-Step query_result failed: ${response.status}`);
    const payload = await response.json();
    const item = Array.isArray(payload?.data) ? payload.data[0] : payload?.data || payload;
    const status = Number(item?.status ?? 0);
    if (status === 1) return item;
    if (status === 2) throw new Error(item?.error || item?.progress_text || "ACE-Step task failed");
    if (onProgress && Date.now() - lastProgressToast > 6000) {
      onProgress(item, started);
      lastProgressToast = Date.now();
    }
    await delay(2800);
  }
  throw new Error("ACE-Step task timed out");
}

function updateAceStepProgress(item, started) {
  const elapsed = Math.max(1, Math.round((Date.now() - started) / 1000));
  const raw = String(item?.progress_text || item?.message || item?.status_text || "").trim();
  const progress = Number(item?.progress ?? item?.percent ?? item?.percentage);
  const percent = Number.isFinite(progress) && progress > 0 ? ` ${progress > 1 ? Math.round(progress) : Math.round(progress * 100)}%` : "";
  const stage = raw || (elapsed < 40 ? "正在准备模型" : elapsed < 150 ? "正在生成旋律" : "正在解码音频");
  console.info("[ACE-Step] progress", { elapsed, status: item?.status, stage, progress: item?.progress });
  toast(`唱片压制中${percent} · ${stage} · ${elapsed}s`);
}

function aceHeaders(serviceUrl = "") {
  const headers = { "Content-Type": "application/json" };
  const throughLocalProxy = serviceUrl.startsWith("/api/ace-step");
  if (!throughLocalProxy && state.settings.apiKey) headers.Authorization = `Bearer ${state.settings.apiKey}`;
  return headers;
}

function extractAceAudioFile(item) {
  const raw = item?.result;
  let result = raw;
  if (typeof raw === "string") {
    try {
      result = JSON.parse(raw);
    } catch (error) {
      result = [];
    }
  }
  const first = Array.isArray(result) ? result.find((part) => part?.file) : result;
  return first?.file || "";
}

function absoluteAceAudioUrl(serviceUrl, file) {
  if (/^https?:\/\//i.test(file)) return file;
  const normalized = file.startsWith("/") ? file : `/${file}`;
  return `${serviceUrl}${normalized}`;
}

function formatLyricsForAce(song, entry, keywords) {
  const lyric = String(song.lyric || entry.seed || "").replace(/\s*\/\s*/g, "\n").trim();
  const chorus = String(song.chorus || "").replace(/\s*\/\s*/g, "\n").trim();
  const fallback = [
    "[Verse 1]",
    entry.summary || entry.seed.slice(0, 48),
    "[Chorus]",
    keywords.slice(0, 4).join("，")
  ].join("\n");
  if (!lyric && !chorus) return fallback;
  return [`[Verse 1]`, lyric, chorus ? `[Chorus]\n${chorus}` : ""].filter(Boolean).join("\n");
}

function buildAcePrompt(song, entry, keywords) {
  return [
    song.prompt || "",
    `A refined Chinese diary pop song about ${keywords.join(", ")}.`,
    `Mood: ${entry.mood}.`,
    `Arrangement: intimate female vocal, soft piano, warm analog synth, subtle beat, cinematic but minimal, emotional and shareable.`,
    `Avoid generic commercial jingle, avoid EDM drop, keep natural phrasing.`
  ]
    .filter(Boolean)
    .join(" ");
}

function normalizeKeyScale(key) {
  const text = String(key || "").trim();
  if (!text) return "A minor";
  if (/major|minor/i.test(text)) return text;
  if (/m$/.test(text)) return `${text.replace(/m$/, "")} minor`;
  return `${text} Major`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openAudioDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("diary-records-audio", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("tracks");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAudioBlob(key, blob) {
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    tx.objectStore("tracks").put(blob, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function loadAudioBlob(key) {
  if (!key) return null;
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readonly");
    const request = tx.objectStore("tracks").get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function deleteAudioBlob(key) {
  if (!key) return;
  const db = await openAudioDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("tracks", "readwrite");
    tx.objectStore("tracks").delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function revokeUploadedAudioUrl(key) {
  const url = state.uploadedAudioUrls.get(key);
  if (url) URL.revokeObjectURL(url);
  state.uploadedAudioUrls.delete(key);
}

async function resolveSongAudioUrl(song) {
  if (!song) return "";
  if (song.audioSource === "upload" && song.audioStoreKey) {
    if (state.uploadedAudioUrls.has(song.audioStoreKey)) return state.uploadedAudioUrls.get(song.audioStoreKey);
    const blob = await loadAudioBlob(song.audioStoreKey);
    if (!blob) return "";
    const url = URL.createObjectURL(blob);
    state.uploadedAudioUrls.set(song.audioStoreKey, url);
    return url;
  }
  return song.audioUrl || "";
}

async function uploadMusicForEntry(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;
  if (!/^audio\//i.test(file.type || "")) {
    toast("请选择音频文件");
    return;
  }
  if (file.size > 30 * 1024 * 1024) {
    toast("音频文件建议控制在 30MB 以内");
    return;
  }

  const entry = ensureEntry();
  const previousKey = entry.song?.audioSource === "upload" ? entry.song.audioStoreKey : "";
  const key = `track:${entry.id}:${Date.now()}`;
  try {
    await saveAudioBlob(key, file);
    if (previousKey) {
      revokeUploadedAudioUrl(previousKey);
      await deleteAudioBlob(previousKey);
    }
    const objectUrl = URL.createObjectURL(file);
    state.uploadedAudioUrls.set(key, objectUrl);
    const keywords = entry.keywords?.length ? entry.keywords : extractKeywords(entry.seed);
    entry.song = normalizeSong(
      {
        title: file.name.replace(/\.[^.]+$/, "") || `${entry.title} · 上传配乐`,
        lyric: entry.seed,
        chorus: keywords.join(" / "),
        style: "uploaded soundtrack",
        bpm: entry.song?.bpm || 82,
        key: entry.song?.key || "A minor",
        prompt: `用户上传配乐：${file.name}`,
        audioUrl: "",
        audioSource: "upload",
        audioStoreKey: key,
        audioName: file.name,
        audioType: file.type || "audio/mpeg"
      },
      entry,
      keywords
    );
    persist();
    renderAll();
    routeTo("music");
    toast("配乐已经放进这张唱片");
  } catch (error) {
    console.warn("Audio upload failed", error);
    toast("音频保存失败，请换一个较小的文件");
  }
}

async function removeUploadedMusic() {
  const entry = getCurrentEntry();
  if (!entry?.song?.audioSource) {
    toast("当前唱片还没有上传配乐");
    return;
  }
  if (entry.song.audioSource === "upload" && entry.song.audioStoreKey) {
    revokeUploadedAudioUrl(entry.song.audioStoreKey);
    await deleteAudioBlob(entry.song.audioStoreKey);
  }
  entry.song = null;
  persist();
  renderAll();
  toast("已移除这张唱片的配乐");
}

async function askLyriaModel(entry, keywords, model) {
  try {
    const base = state.settings.baseUrl.replace(/\/$/, "").replace(/\/v1$/i, "/v1beta");
    const prompt = [
      `Private Chinese diary song titled "${entry.title}".`,
      `Mood: ${entry.mood}. Keywords: ${keywords.join(", ")}.`,
      `Diary: ${entry.seed}`,
      "Style: refined diary pop, intimate vocal, modern minimal arrangement, cinematic but not commercial jingle.",
      "Length: 30-45 seconds. Avoid noisy EDM drops. Keep it elegant and shareable."
    ].join("\n");
    const response = await fetch(`${base}/interactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": state.settings.apiKey,
        Authorization: `Bearer ${state.settings.apiKey}`
      },
      body: JSON.stringify({
        input: prompt,
        model
      })
    });
    if (!response.ok) throw new Error("lyria request failed");
    const data = await response.json();
    const audio = findAudioPayload(data);
    if (!audio?.data) return null;
    const audioUrl = audioBase64ToUrl(audio.data, audio.mimeType || "audio/mpeg");
    return normalizeSong(
      {
        title: `${entry.title.slice(0, 12)} · private cut`,
        lyric: entry.seed.slice(0, 96),
        chorus: keywords.join(" / "),
        style: "Lyria private diary pop",
        bpm: 82,
        key: "A minor",
        prompt,
        audioUrl
      },
      entry,
      keywords
    );
  } catch (error) {
    toast("暂时先用本地旋律为这天打样");
    return null;
  }
}

function findAudioPayload(value) {
  if (!value || typeof value !== "object") return null;
  if (typeof value.data === "string" && /^audio\//i.test(value.mimeType || "")) return value;
  if (typeof value.audioContent === "string") return { data: value.audioContent, mimeType: value.mimeType || "audio/mpeg" };
  if (typeof value.bytesBase64Encoded === "string") return { data: value.bytesBase64Encoded, mimeType: value.mimeType || "audio/mpeg" };
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findAudioPayload(item);
      if (found) return found;
    }
  } else {
    for (const item of Object.values(value)) {
      const found = findAudioPayload(item);
      if (found) return found;
    }
  }
  return null;
}

function audioBase64ToUrl(base64, mimeType) {
  const clean = base64.includes(",") ? base64.split(",").pop() : base64;
  const binary = atob(clean);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }));
}

function composeLocalSong(entry, keywords) {
  const text = `${entry.title} ${entry.seed} ${keywords.join(" ")}`;
  if (text.includes("水晶") || text.includes("创业") || text.includes("第一桶金")) {
    return normalizeSong(
      {
        title: "第一颗发亮的石头",
        lyric: "我把喜欢摊在桌上 / 一颗一颗数过光 / 第一笔收入落进口袋 / 像夏天很轻地回响",
        chorus: "敢把小小的愿望 / 做成真的形状 / 就算明天换方向 / 今晚也值得发亮",
        style: "清冷 indie pop / 玻璃质感合成器 / 轻电子鼓 / 温柔女声",
        bpm: 84,
        key: "D major"
      },
      entry,
      keywords
    );
  }
  if (text.includes("猫") || text.includes("小猫")) {
    return normalizeSong(
      {
        title: "给喜欢的生活投票",
        lyric: "小小的爪子踩过地板 / 我把紧张藏进口袋 / 钱变成猫粮和灯光 / 也变成我新的勇敢",
        chorus: "你慢慢靠近吧 / 我也慢慢长大 / 从今天开始 / 家里多了一点柔软的回答",
        style: "lo-fi bedroom pop / 木吉他 / 轻柔节拍 / 温暖但不甜腻",
        bpm: 92,
        key: "G major"
      },
      entry,
      keywords
    );
  }
  if (text.includes("算法") || text.includes("实习") || text.includes("offer")) {
    return normalizeSong(
      {
        title: "等邮件亮起",
        lyric: "把简历改到凌晨两点 / 把不会的题重新看一遍 / 当邮件终于亮起来 / 我听见心落回人间",
        chorus: "不是一夜之间 / 是每个晚上的铺垫 / 我带着真实的自己 / 走进下一段时间",
        style: "cinematic pop / piano + soft synth / 克制但向上",
        bpm: 88,
        key: "A major"
      },
      entry,
      keywords
    );
  }

  return normalizeSong(
    {
      title: `${entry.title.replace(/[。,.，]/g, "").slice(0, 10)} · diary take`,
      lyric: `${keywords[0] || "今天"}落在屏幕的边缘 / ${keywords[1] || entry.mood}把夜色轻轻折叠 / 我把没说完的话 / 放进唱片慢慢转`,
      chorus: `如果以后再听见 / 就让${keywords[2] || "回忆"}替我回答 / 原来这一刻 / 真的被我留下`,
      style: "minimal diary pop / ambient synth / soft vocal",
      bpm: entry.mood === "低电量" ? 68 : entry.mood === "心动" ? 96 : 78,
      key: entry.mood === "清醒" ? "D major" : "A minor"
    },
    entry,
    keywords
  );
}

function normalizeSong(song, entry, keywords) {
  const style = song.style || "minimal diary pop / soft synth / intimate vocal";
  return {
    title: song.title || `${entry.title.slice(0, 10)} · diary take`,
    lyric: song.lyric || "",
    chorus: song.chorus || "",
    style,
    bpm: Number(song.bpm) || 82,
    key: song.key || "A minor",
    audioUrl: song.audioUrl || "",
    audioSource: song.audioSource || "",
    audioStoreKey: song.audioStoreKey || "",
    audioName: song.audioName || "",
    audioType: song.audioType || "",
    prompt:
      song.prompt ||
      `Create a polished short song from this diary. Language: Chinese. Mood: ${entry.mood}. Keywords: ${keywords.join(", ")}. Style: ${style}. Diary: ${entry.seed}`
  };
}

async function loadThreeModule() {
  if (state.gpu.THREE) return state.gpu.THREE;
  try {
    state.gpu.THREE = await import("./vendor/three.module.js");
  } catch (error) {
    state.gpu.THREE = await import("./node_modules/three/build/three.module.js");
  }
  return state.gpu.THREE;
}

async function initGpuParticleSystem() {
  if (!webglCanvas || state.gpu.ready || state.gpu.failed) return false;
  try {
    const THREE = await loadThreeModule();
    const renderer = new THREE.WebGLRenderer({
      canvas: webglCanvas,
      alpha: true,
      antialias: false,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 620 ? 1.35 : 1.7));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 5.4);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uDisruption: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, 0) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 1.7) },
        uPointScale: { value: window.innerWidth < 620 ? 7.6 : 9.4 },
        uNearTint: { value: new THREE.Color("#f7f2ea") },
        uDeepTint: { value: new THREE.Color("#46c6ff") }
      },
      vertexShader: `
        attribute vec3 aOriginal;
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aSeed;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uDisruption;
        uniform vec3 uMouse;
        uniform float uPixelRatio;
        uniform float uPointScale;

        float hash(vec3 p) {
          p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.13));
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise(vec3 p) {
          vec3 i = floor(p);
          vec3 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
                mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
            mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
                mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
            f.z
          );
        }

        vec3 curlNoise(vec3 p) {
          float e = 0.12;
          float n1 = noise(vec3(p.x, p.y + e, p.z));
          float n2 = noise(vec3(p.x, p.y - e, p.z));
          float a = (n1 - n2) / (2.0 * e);
          n1 = noise(vec3(p.x, p.y, p.z + e));
          n2 = noise(vec3(p.x, p.y, p.z - e));
          float b = (n1 - n2) / (2.0 * e);
          n1 = noise(vec3(p.x + e, p.y, p.z));
          n2 = noise(vec3(p.x - e, p.y, p.z));
          float c = (n1 - n2) / (2.0 * e);
          return normalize(vec3(a - b, b - c, c - a) + 0.0001);
        }

        void main() {
          vec3 originalPos = aOriginal;
          float t = uTime * 0.12 + aSeed * 4.7;
          vec3 field = curlNoise(originalPos * 1.28 + vec3(t, t * 0.7, -t * 0.45));
          float mouseDistance = distance(originalPos.xy, uMouse.xy);
          float mouseMask = smoothstep(1.12, 0.02, mouseDistance);
          vec3 away = normalize(vec3(originalPos.xy - uMouse.xy, originalPos.z - uMouse.z + 0.22));
          float wave = sin(uTime * 0.78 + aSeed * 18.0 + originalPos.x * 1.7) * 0.5 + 0.5;
          vec3 breath = originalPos + field * (0.055 + wave * 0.04);
          vec3 sand = originalPos
            + field * (0.26 + uDisruption * 1.55)
            + away * mouseMask * (0.42 + uDisruption * 2.1)
            + vec3(0.0, 0.0, uDisruption * (noise(originalPos * 2.0 + t) - 0.5) * 1.65);
          vec3 transformed = mix(breath, sand, smoothstep(0.0, 1.0, uDisruption));
          vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          float depthGlow = clamp((transformed.z + 2.0) / 4.5, 0.0, 1.0);
          gl_PointSize = aSize * uPixelRatio * uPointScale * (1.0 + depthGlow * 0.62) / max(2.15, -mvPosition.z);
          vColor = aColor * (0.78 + depthGlow * 0.36 + mouseMask * 0.08);
          vAlpha = 0.28 + depthGlow * 0.24 + mouseMask * 0.12;
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec3 vColor;
        varying float vAlpha;

        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float d = length(uv);
          float core = smoothstep(0.5, 0.05, d);
          float halo = smoothstep(0.5, 0.0, d) * 0.32;
          float alpha = (core * 0.86 + halo * 0.12) * vAlpha;
          if (alpha < 0.015) discard;
          gl_FragColor = vec4(vColor, alpha);
        }
      `
    });

    state.gpu.renderer = renderer;
    state.gpu.scene = scene;
    state.gpu.camera = camera;
    state.gpu.material = material;
    state.gpu.ready = true;
    document.body.classList.add("gpu-particles-ready");
    resizeGpuRenderer();
    window.addEventListener("resize", resizeGpuRenderer);
    animateGpuParticles();
    if (state.gpu.pendingImage) prepareGpuParticles(state.gpu.pendingImage);
    return true;
  } catch (error) {
    console.warn("GPU particle renderer unavailable", error);
    state.gpu.failed = true;
    return false;
  }
}

function resizeGpuRenderer() {
  if (!state.gpu.ready || !webglCanvas) return;
  const rect = webglCanvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(320, Math.floor(rect.height));
  state.gpu.renderer.setSize(width, height, false);
  state.gpu.camera.aspect = width / height;
  state.gpu.camera.updateProjectionMatrix();
  state.gpu.material.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, window.innerWidth < 620 ? 1.35 : 1.7);
  state.gpu.material.uniforms.uPointScale.value = window.innerWidth < 620 ? 7.6 : 9.4;
}

async function prepareGpuParticles(src) {
  if (!src || state.gpu.failed) return;
  state.gpu.pendingImage = src;
  if (!state.gpu.ready) {
    initGpuParticleSystem();
    return;
  }
  if (state.gpu.lastSrc === src && state.gpu.points) return;
  const requestId = ++state.gpu.requestId;
  try {
    const data = await processImageToParticles(src, state.gpu.particleCount);
    if (requestId !== state.gpu.requestId) return;
    setGpuParticles(data);
    state.gpu.lastSrc = src;
  } catch (error) {
    console.warn("Image particle sampling failed", error);
  }
}

async function processImageToParticles(src, count = 130000) {
  const image = await loadImageElement(src);
  const sampleSize = window.innerWidth < 620 ? 420 : 520;
  const off = document.createElement("canvas");
  off.width = sampleSize;
  off.height = sampleSize;
  const octx = off.getContext("2d", { willReadFrequently: true });
  octx.fillStyle = "#020304";
  octx.fillRect(0, 0, sampleSize, sampleSize);
  const ratio = Math.min(sampleSize / image.width, sampleSize / image.height);
  const drawW = image.width * ratio;
  const drawH = image.height * ratio;
  octx.drawImage(image, (sampleSize - drawW) / 2, (sampleSize - drawH) / 2, drawW, drawH);
  const pixels = octx.getImageData(0, 0, sampleSize, sampleSize).data;
  const target = count;
  const positions = new Float32Array(target * 3);
  const colors = new Float32Array(target * 3);
  const sizes = new Float32Array(target);
  const seeds = new Float32Array(target);
  const maxAttempts = target * 30;
  const smooth01 = (edge0, edge1, value) => {
    const t = Math.min(1, Math.max(0, (value - edge0) / Math.max(edge1 - edge0, 0.0001)));
    return t * t * (3 - 2 * t);
  };
  let accepted = 0;
  let attempts = 0;

  while (accepted < target && attempts < maxAttempts) {
    attempts += 1;
    const x = Math.floor(Math.random() * sampleSize);
    const y = Math.floor(Math.random() * sampleSize);
    const idx = (y * sampleSize + x) * 4;
    const alpha = pixels[idx + 3] / 255;
    const r = pixels[idx] / 255;
    const g = pixels[idx + 1] / 255;
    const b = pixels[idx + 2] / 255;
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const saturation = maxChannel - minChannel;
    const whiteMask = smooth01(0.68, 0.92, luminance) * (1 - smooth01(0.08, 0.24, saturation));
    const nx = x / sampleSize - 0.5;
    const ny = y / sampleSize - 0.5;
    const radius = Math.hypot(nx * 2, ny * 2);
    const vignetteKeep = 1 - Math.min(0.76, Math.pow(radius, 1.85) * 0.48);
    const imageKeep = Math.min(1, Math.max(0, (luminance - 0.015) * 1.25 + saturation * 1.05 + alpha * 0.04));
    const textureKeep = 0.24 + Math.pow(luminance, 0.55) * 0.48 + saturation * 0.38;
    const whitePenalty = 1 - whiteMask * 0.88;
    if (Math.random() > vignetteKeep * imageKeep * textureKeep * whitePenalty) continue;

    const i3 = accepted * 3;
    const relief = Math.pow(luminance, 1.08) * 3.7 - 1.45 - radius * 0.24 + saturation * 0.62 - whiteMask * 0.42 + (Math.random() - 0.5) * 0.13;
    const edgeFalloff = 1 - Math.min(0.32, radius * 0.12);
    const spread = window.innerWidth < 620 ? 3.08 : 3.28;
    positions[i3] = nx * spread * edgeFalloff + (Math.random() - 0.5) * 0.006;
    positions[i3 + 1] = -ny * spread * edgeFalloff + (Math.random() - 0.5) * 0.006;
    positions[i3 + 2] = relief;
    const colorLift = 0.08 + luminance * 0.16;
    const warmWhiteR = 0.9;
    const warmWhiteG = 0.72;
    const warmWhiteB = 0.54;
    const preservedR = Math.min(1, Math.pow(r, 0.82) * 1.2 + colorLift);
    const preservedG = Math.min(1, Math.pow(g, 0.82) * 1.17 + colorLift);
    const preservedB = Math.min(1, Math.pow(b, 0.82) * 1.19 + colorLift);
    const whiteTint = whiteMask * 0.46;
    colors[i3] = preservedR * (1 - whiteTint) + warmWhiteR * whiteTint;
    colors[i3 + 1] = preservedG * (1 - whiteTint) + warmWhiteG * whiteTint;
    colors[i3 + 2] = preservedB * (1 - whiteTint) + warmWhiteB * whiteTint;
    sizes[accepted] = (0.42 + Math.random() * 0.68 + Math.pow(luminance, 1.3) * 0.58 + saturation * 0.28) * (1 - whiteMask * 0.42);
    seeds[accepted] = Math.random();
    accepted += 1;
  }

  while (accepted < target) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.pow(Math.random(), 0.72) * 1.84;
    const i3 = accepted * 3;
    positions[i3] = Math.cos(angle) * radius;
    positions[i3 + 1] = Math.sin(angle) * radius * 0.72;
    positions[i3 + 2] = (Math.random() - 0.5) * 0.9 - radius * 0.18;
    colors[i3] = 0.45 + Math.random() * 0.34;
    colors[i3 + 1] = 0.58 + Math.random() * 0.28;
    colors[i3 + 2] = 0.7 + Math.random() * 0.28;
    sizes[accepted] = 0.35 + Math.random() * 0.56;
    seeds[accepted] = Math.random();
    accepted += 1;
  }

  return { positions, colors, sizes, seeds, count: target };
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(src)) image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function setGpuParticles(data) {
  if (!state.gpu.ready) return;
  const THREE = state.gpu.THREE;
  if (state.gpu.points) {
    state.gpu.scene.remove(state.gpu.points);
    state.gpu.geometry?.dispose();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute("aOriginal", new THREE.BufferAttribute(data.positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(data.sizes, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(data.seeds, 1));
  const points = new THREE.Points(geometry, state.gpu.material);
  points.rotation.x = state.gpu.rotationX;
  points.rotation.y = state.gpu.rotationY;
  points.rotation.z = 0.03;
  state.gpu.geometry = geometry;
  state.gpu.points = points;
  state.gpu.scene.add(points);
}

function animateGpuParticles(now = 0) {
  if (!state.gpu.ready) return;
  requestAnimationFrame(animateGpuParticles);
  if (document.hidden) return;
  const entry = getCurrentEntry();
  const ambient = estimateEmotionDisruption(entry);
  const target = Math.max(ambient, state.gpu.targetDisruption);
  const recoverSpeed = state.gpu.pointerActive ? 0.045 : 0.012;
  state.gpu.disruption += (target - state.gpu.disruption) * recoverSpeed;
  state.gpu.targetDisruption *= state.gpu.pointerActive ? 0.995 : 0.992;
  state.gpu.material.uniforms.uTime.value = now * 0.001;
  state.gpu.material.uniforms.uDisruption.value = state.gpu.disruption;
  state.gpu.material.uniforms.uMouse.value.set(state.gpu.mouseWorld.x, state.gpu.mouseWorld.y, state.gpu.mouseWorld.z);
  if (state.gpu.points) {
    state.gpu.rotationX += (state.gpu.targetRotationX - state.gpu.rotationX) * 0.026;
    state.gpu.rotationY += (state.gpu.targetRotationY - state.gpu.rotationY) * 0.026;
    const idleY = Math.sin(now * 0.00011) * 0.035;
    const idleX = Math.cos(now * 0.00013) * 0.018;
    state.gpu.points.rotation.y = state.gpu.rotationY + idleY;
    state.gpu.points.rotation.x = state.gpu.rotationX + idleX;
  }
  state.gpu.renderer.render(state.gpu.scene, state.gpu.camera);
}

function updateGpuMouse(clientX, clientY, disruption = 0.35) {
  if (!webglCanvas) return;
  const rect = webglCanvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
  const y = -(((clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  state.gpu.mouseWorld.x = x * 2.0;
  state.gpu.mouseWorld.y = y * 2.0;
  state.gpu.mouseWorld.z = 0.18;
  state.gpu.pointerActive = true;
  state.gpu.targetDisruption = Math.max(state.gpu.targetDisruption, disruption);
  state.gpu.targetRotationY = x * 1.08;
  state.gpu.targetRotationX = -0.12 + y * 0.34;
}

function releaseGpuPointer() {
  state.gpu.pointerActive = false;
  state.gpu.targetRotationX = -0.12;
  state.gpu.targetRotationY = 0;
}

function estimateEmotionDisruption(entry) {
  const text = `${entry?.mood || ""} ${entry?.title || ""} ${entry?.seed || ""} ${entry?.summary || ""}`;
  if (/低电|疲|焦虑|难过|失落|崩|sad|melanch|tired|anxious/i.test(text)) return 0.16;
  return 0.028;
}

async function loadVisionBundle() {
  try {
    const bundle = await import("./vendor/vision_bundle.mjs");
    state.hand.visionBase = "./vendor/mediapipe/wasm";
    return bundle;
  } catch (error) {
    const bundle = await import("./node_modules/@mediapipe/tasks-vision/vision_bundle.mjs");
    state.hand.visionBase = "./node_modules/@mediapipe/tasks-vision/wasm";
    return bundle;
  }
}

async function toggleHandTracking() {
  if (state.hand.running) {
    stopHandTracking();
    return;
  }
  await startHandTracking();
}

async function startHandTracking() {
  if (!handVideo || state.hand.loading || state.hand.running) return;
  state.hand.loading = true;
  updateGestureStatus("唤醒中");
  try {
    const { FilesetResolver, HandLandmarker } = await loadVisionBundle();
    const wasmPath = state.hand.visionBase || "./node_modules/@mediapipe/tasks-vision/wasm";
    const vision = await FilesetResolver.forVisionTasks(wasmPath);
    state.hand.landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
    state.hand.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });
    handVideo.srcObject = state.hand.stream;
    await handVideo.play();
    state.hand.running = true;
    updateGestureStatus("已连接");
    trackHands();
  } catch (error) {
    console.warn("Hand tracking unavailable", error);
    updateGestureStatus("未开启");
  } finally {
    state.hand.loading = false;
  }
}

function stopHandTracking() {
  state.hand.running = false;
  cancelAnimationFrame(state.hand.raf);
  state.hand.stream?.getTracks().forEach((track) => track.stop());
  state.hand.stream = null;
  state.hand.lastPalm = null;
  releaseGpuPointer();
  updateGestureStatus("手势");
}

function trackHands() {
  if (!state.hand.running || !state.hand.landmarker || !handVideo) return;
  const now = performance.now();
  if (handVideo.currentTime !== state.hand.lastVideoTime) {
    state.hand.lastVideoTime = handVideo.currentTime;
    const result = state.hand.landmarker.detectForVideo(handVideo, now);
    const landmarks = result.landmarks?.[0];
    if (landmarks?.length) {
      const palm = averageLandmarks(landmarks, [0, 5, 9, 13, 17]);
      const tip = landmarks[8];
      const gesture = classifyHandGesture(landmarks, palm);
      const rect = webglCanvas?.getBoundingClientRect();
      if (rect) {
        updateGpuMouse(rect.left + (1 - palm.x) * rect.width, rect.top + palm.y * rect.height, gesture === "close" ? 0.92 : gesture === "swipe" ? 0.78 : 0.36);
      }
      state.gpu.mouseWorld.z = (0.5 - (tip.z || 0)) * 0.9;
      state.hand.lastPalm = { ...palm, time: now };
      updateGestureStatus(gesture === "open" ? "掌心" : gesture === "close" ? "聚拢" : gesture === "swipe" ? "掠过" : "手势");
    } else {
      releaseGpuPointer();
    }
  }
  state.hand.raf = requestAnimationFrame(trackHands);
}

function averageLandmarks(landmarks, indexes) {
  const total = indexes.reduce(
    (acc, index) => {
      acc.x += landmarks[index].x;
      acc.y += landmarks[index].y;
      acc.z += landmarks[index].z || 0;
      return acc;
    },
    { x: 0, y: 0, z: 0 }
  );
  return { x: total.x / indexes.length, y: total.y / indexes.length, z: total.z / indexes.length };
}

function classifyHandGesture(landmarks, palm) {
  const wrist = landmarks[0];
  const middleBase = landmarks[9];
  const palmSize = Math.max(0.04, landmarkDistance(wrist, middleBase));
  const tips = [8, 12, 16, 20].map((index) => landmarkDistance(landmarks[index], wrist) / palmSize);
  const openness = tips.reduce((sum, value) => sum + value, 0) / tips.length;
  let gesture = openness > 2.18 ? "open" : openness < 1.64 ? "close" : "hover";
  if (state.hand.lastPalm) {
    const dt = Math.max(1, performance.now() - state.hand.lastPalm.time);
    const vx = (palm.x - state.hand.lastPalm.x) / dt;
    if (Math.abs(vx) > 0.00135) gesture = "swipe";
  }
  state.hand.gesture = gesture;
  return gesture;
}

function landmarkDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.hypot(dx, dy, dz);
}

function updateGestureStatus(text) {
  const node = $("#gestureState");
  if (node) node.textContent = text;
  $("#handTrackBtn")?.classList.toggle("is-live", state.hand.running);
}

function prepareParticles(src) {
  prepareGpuParticles(src);
  resizeCanvas();
  state.particles = [];
  if (!src) return;
  const isMobile = window.innerWidth < 620;
  const budget = isMobile ? 3200 : 5600;
  state.performance.particleBudget = budget;

  const image = new Image();
  if (/^https?:\/\//i.test(src)) image.crossOrigin = "anonymous";
  image.onload = () => {
    const size = Math.min(canvas.width, canvas.height) * 0.76;
    const off = document.createElement("canvas");
    const scale = isMobile ? 164 : 220;
    off.width = scale;
    off.height = scale;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.fillStyle = "#050506";
    octx.fillRect(0, 0, scale, scale);
    const ratio = Math.max(scale / image.width, scale / image.height);
    const w = image.width * ratio;
    const h = image.height * ratio;
    octx.drawImage(image, (scale - w) / 2, (scale - h) / 2, w, h);
    let pixels;
    try {
      pixels = octx.getImageData(0, 0, scale, scale).data;
    } catch (error) {
      prepareAmbientParticles();
      return;
    }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const step = isMobile ? 3 : 2;

    for (let y = 0; y < scale; y += step) {
      for (let x = 0; x < scale; x += step) {
        if (state.particles.length >= budget) break;
        const i = (y * scale + x) * 4;
        const alpha = pixels[i + 3];
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const keep = brightness > 28 ? 0.72 : 0.16;
        if (alpha > 20 && brightness > 10 && Math.random() < keep) {
          const targetX = cx + (x / scale - 0.5) * size;
          const targetY = cy + (y / scale - 0.5) * size;
          const depth = (brightness / 255) * 2.2 - 0.7 + (Math.random() - 0.5) * 0.7;
          const scatter = 0.55 + (255 - brightness) / 180;
          state.particles.push({
            x: targetX + (Math.random() - 0.5) * 280 * scatter,
            y: targetY + (Math.random() - 0.5) * 280 * scatter,
            tx: targetX,
            ty: targetY,
            vx: 0,
            vy: 0,
            z: depth,
            phase: Math.random() * Math.PI * 2,
            drift: Math.random() * 0.55 + 0.12,
            size: Math.random() * 1.34 + 0.42 + Math.max(depth, 0) * 0.46,
            r: pixels[i],
            g: pixels[i + 1],
            b: pixels[i + 2],
            a: 0.42 + Math.random() * 0.46
          });
        }
      }
      if (state.particles.length >= budget) break;
    }

    const ambientCount = isMobile ? 720 : 1250;
    for (let i = 0; i < ambientCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() ** 0.66 * size * 0.62;
      const depth = Math.random() * 1.8 - 0.9;
      state.particles.push({
        x: cx + Math.cos(angle) * radius * 1.35,
        y: cy + Math.sin(angle) * radius * 0.95,
        tx: cx + Math.cos(angle) * radius,
        ty: cy + Math.sin(angle) * radius * 0.72,
        vx: 0,
        vy: 0,
        z: depth,
        phase: Math.random() * Math.PI * 2,
        drift: Math.random() * 0.85 + 0.12,
        size: Math.random() * 1.1 + 0.35,
        r: Math.random() > 0.5 ? 247 : 73,
        g: Math.random() > 0.5 ? 242 : 213,
        b: Math.random() > 0.5 ? 234 : 150,
        a: Math.random() * 0.18 + 0.05
      });
    }
  };
  image.onerror = prepareAmbientParticles;
  image.src = src;
}

function prepareAmbientParticles() {
  resizeCanvas();
  state.particles = [];
  const entry = getCurrentEntry();
  const palette = paletteForEntry(entry);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const size = Math.min(canvas.width, canvas.height) * 0.72;
  const count = window.innerWidth < 620 ? 1900 : 3200;
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() ** 0.58 * size * (0.25 + Math.random() * 0.58);
    const color = palette[i % palette.length];
    const targetX = cx + Math.cos(angle) * radius * (1.08 + Math.random() * 0.22);
    const targetY = cy + Math.sin(angle) * radius * (0.72 + Math.random() * 0.22);
    state.particles.push({
      x: targetX + (Math.random() - 0.5) * 260,
      y: targetY + (Math.random() - 0.5) * 260,
      tx: targetX,
      ty: targetY,
      vx: 0,
      vy: 0,
      z: Math.random() * 1.8 - 0.75,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.7 + 0.12,
      size: Math.random() * 1.45 + 0.45,
      r: color[0],
      g: color[1],
      b: color[2],
      a: Math.random() * 0.34 + 0.12
    });
  }
}

function paletteForEntry(entry) {
  const text = `${entry?.title || ""} ${entry?.seed || ""}`;
  if (text.includes("猫")) return [[246, 230, 204], [212, 190, 157], [132, 159, 170], [247, 242, 234]];
  if (text.includes("实习") || text.includes("算法")) return [[150, 184, 224], [198, 213, 235], [73, 213, 150], [247, 242, 234]];
  if (text.includes("水晶")) return [[212, 235, 246], [178, 215, 232], [231, 197, 121], [247, 242, 234]];
  return [[128, 170, 188], [231, 197, 121], [73, 213, 150], [247, 242, 234]];
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 620 ? 1.12 : 1.45);
  state.performance.pixelRatio = ratio;
  canvas.width = Math.max(320, Math.floor(rect.width * ratio));
  canvas.height = Math.max(320, Math.floor(rect.height * ratio));
}

function drawLoop(now = 0) {
  requestAnimationFrame(drawLoop);
  if (document.hidden) return;
  if (state.gpu.ready && state.gpu.points) return;
  const minDelta = 1000 / state.performance.targetFps;
  if (now - state.performance.lastFrame < minDelta) return;
  state.performance.lastFrame = now;
  if (!canvas.width) resizeCanvas();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const t = performance.now() * 0.001;
  const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height * 0.45, 20, canvas.width / 2, canvas.height / 2, canvas.width * 0.58);
  gradient.addColorStop(0, "rgba(255,255,255,0.065)");
  gradient.addColorStop(0.38, "rgba(73,213,150,0.028)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = "lighter";
  const ratio = state.performance.pixelRatio || 1;

  for (const p of state.particles) {
    const breathe = Math.sin(t * p.drift + p.phase) * (5 + p.z * 2) * ratio;
    const targetX = p.tx + Math.cos(t * 0.18 + p.phase) * breathe;
    const targetY = p.ty + Math.sin(t * 0.22 + p.phase) * breathe * 0.72;
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    p.vx += dx * 0.014;
    p.vy += dy * 0.014;

    if (state.mouse.active) {
      const mx = p.x - state.mouse.x;
      const my = p.y - state.mouse.y;
      const dist = Math.hypot(mx, my);
      const radius = 138 * ratio;
      if (dist < radius) {
        const force = (1 - dist / radius) * (5.4 + p.z);
        p.vx += (mx / Math.max(dist, 1)) * force;
        p.vy += (my / Math.max(dist, 1)) * force;
      }
    }

    p.vx *= 0.88;
    p.vy *= 0.88;
    p.x += p.vx;
    p.y += p.vy;
    const perspective = 1 + p.z * 0.13;
    const px = canvas.width / 2 + (p.x - canvas.width / 2) * perspective;
    const py = canvas.height / 2 + (p.y - canvas.height / 2) * perspective;
    const alpha = Math.max(0.035, Math.min(0.92, p.a * (0.74 + p.z * 0.18)));
    ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`;
    const dot = p.size * perspective * ratio;
    if (dot < 1.45) {
      ctx.fillRect(px, py, dot + 0.65, dot + 0.65);
    } else {
      ctx.beginPath();
      ctx.arc(px, py, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

function renderAll() {
  const entry = getCurrentEntry();
  if (entry) {
    $("#recordImage").src = entry.image;
    if ($("#memoryCoverImage")) $("#memoryCoverImage").src = entry.image;
    if ($("#coverTitle")) $("#coverTitle").textContent = entry.title || "Untitled day";
    $("#emptyState").classList.add("is-hidden");
    prepareParticles(entry.image);
    renderChat(entry);
    renderKeywords(entry);
    renderMusic();
  }
  renderMemory();
  renderPhoneSignals();
}

function renderChat(entry) {
  $("#chatLog").innerHTML = entry.chat
    .map((item) => `<div class="message ${item.role === "user" ? "user" : "ai"}" data-role="${item.role === "user" ? "YOU" : "MUSE"}">${escapeHtml(item.text)}</div>`)
    .join("");
  $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  const lastAi = [...entry.chat].reverse().find((item) => item.role === "ai") || entry.chat[0];
  if (lastAi) {
    $("#sceneQuote").querySelector("p").textContent = lastAi.text;
  }
}

function renderKeywords(entry) {
  const keywords = entry.keywords?.length ? entry.keywords : extractKeywords(entry.seed);
  const keywordOrbit = $("#keywordOrbit");
  const memoryStrips = $("#memoryStrips");
  if (keywordOrbit) keywordOrbit.innerHTML = "";
  if (memoryStrips) {
    memoryStrips.innerHTML = keywords
      .slice(0, 5)
      .map((word, index) => `<span class="memory-strip" style="--i:${index}">${escapeHtml(word)}</span>`)
      .join("");
  }
}

function updateMemoryDepth() {
  const carousel = $("#memoryCarousel");
  if (!carousel) return;
  const center = carousel.scrollLeft + carousel.clientWidth / 2;
  const cards = $$(".memory-card");
  let nearest = null;
  let nearestDistance = Infinity;

  cards.forEach((card) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const raw = (cardCenter - center) / Math.max(card.offsetWidth, 1);
    const offset = Math.max(-1.65, Math.min(1.65, raw));
    const depth = Math.min(1, Math.abs(offset));
    const distance = Math.abs(offset);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = card;
    }
    card.style.setProperty("--offset", offset.toFixed(3));
    card.style.setProperty("--depth", depth.toFixed(3));
    card.style.setProperty("--mx", (state.memory.pointerX * (1 - depth)).toFixed(3));
    card.style.setProperty("--my", (state.memory.pointerY * (1 - depth)).toFixed(3));
    card.style.setProperty("--rise", (1 - depth).toFixed(3));
    card.style.zIndex = String(100 - Math.round(depth * 80));
    card.classList.toggle("is-center", depth < 0.22);
  });

  cards.forEach((card) => card.classList.toggle("is-nearest", card === nearest));
}

function snapMemoryToNearest() {
  const carousel = $("#memoryCarousel");
  if (!carousel) return;
  const center = carousel.scrollLeft + carousel.clientWidth / 2;
  let target = null;
  let nearestDistance = Infinity;
  $$(".memory-card").forEach((card) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    const distance = Math.abs(cardCenter - center);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      target = card;
    }
  });
  if (!target) return;
  carousel.classList.add("is-programmatic");
  carousel.scrollTo({
    left: target.offsetLeft + target.offsetWidth / 2 - carousel.clientWidth / 2,
    behavior: "smooth"
  });
  window.setTimeout(() => carousel.classList.remove("is-programmatic"), 1400);
}

function renderMemory() {
  const entries = state.entries;
  const carousel = $("#memoryCarousel");
  const previousScroll = carousel.scrollLeft;
  carousel.innerHTML = `
    <div class="memory-spacer" aria-hidden="true"></div>
    ${entries
      .map(
        (entry) => `
        <article class="memory-card" data-id="${entry.id}">
          <div class="memory-cover" style="--cover:${cssImage(entry.image)}">
            <img src="${entry.image}" alt="${escapeHtml(entry.title)}" loading="lazy">
          </div>
          <div class="memory-body">
            <div class="memory-meta"><span>${entry.date}</span><span>${entry.range}</span></div>
            <h3>${escapeHtml(entry.title)}</h3>
            <p>${escapeHtml(entry.summary || entry.seed)}</p>
            <div class="tag-row">${(entry.keywords || []).slice(0, 4).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
            <div class="memory-actions">
              <button class="ghost-btn" data-open-memory="${entry.id}">打开日记</button>
              <button class="ghost-btn subtle" data-play-memory="${entry.id}">播放唱片</button>
              <button class="ghost-btn subtle" data-regenerate-song="${entry.id}">重新压制</button>
            </div>
          </div>
        </article>
      `
      )
      .join("")}
    <div class="memory-spacer" aria-hidden="true"></div>
  `;
  carousel.scrollLeft = Math.min(previousScroll, carousel.scrollWidth - carousel.clientWidth);
  requestAnimationFrame(updateMemoryDepth);
}

function openMemoryDetail(id) {
  const entry = state.entries.find((item) => item.id === id);
  const modal = $("#memoryModal");
  if (!entry || !modal) return;
  state.currentId = entry.id;
  renderAll();
  renderMemoryDetail(entry);
  if (!modal.open) modal.showModal();
}

function closeMemoryDetail() {
  const modal = $("#memoryModal");
  if (modal?.open) modal.close();
}

function renderMemoryDetail(entry) {
  const song = entry.song;
  $("#memoryDetail").innerHTML = `
    <button class="detail-close" data-memory-close aria-label="关闭">×</button>
    <div class="memory-detail-grid">
      <section class="detail-cover" style="--cover:${cssImage(entry.image)}">
        <img src="${entry.image}" alt="${escapeHtml(entry.title)}">
        <div class="detail-vinyl" aria-hidden="true">
          <span style="--cover:${cssImage(entry.image)}"></span>
        </div>
      </section>
      <section class="detail-main">
        <div class="eyebrow">MEMORY RECORD</div>
        <div class="detail-meta"><span>${entry.date}</span><span>${entry.range}</span><span>${escapeHtml(entry.mood)}</span></div>
        <h2>${escapeHtml(entry.title)}</h2>
        <p class="detail-diary">${escapeHtml(entry.seed)}</p>
        <div class="tag-row">${(entry.keywords || []).slice(0, 6).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        <div class="detail-actions">
          <button class="primary-btn" data-continue-memory="${entry.id}">继续和 AI 聊</button>
          <button class="ghost-btn" data-play-memory="${entry.id}">${song ? "播放唱片" : "压成唱片"}</button>
          <button class="ghost-btn subtle" data-regenerate-song="${entry.id}">重新压制</button>
          <button class="ghost-btn subtle" data-music-memory="${entry.id}">查看音乐页</button>
          <button class="ghost-btn danger" data-delete-memory="${entry.id}">删除日记</button>
        </div>
        <div class="detail-song">
          <small>DIARY SONG</small>
          <strong>${escapeHtml(song?.title || "还没有压成唱片")}</strong>
          <p>${escapeHtml(song?.chorus || song?.prompt || "点一下，它会把这篇日记写成一段可以播放的旋律。")}</p>
        </div>
      </section>
    </div>
    <section class="detail-chat">
      <div class="eyebrow">SOFT LOG</div>
      <div class="detail-chat-list">
        ${(entry.chat || [])
          .map(
            (item) => `
          <div class="detail-message ${item.role === "user" ? "user" : "ai"}">
            <span>${item.role === "user" ? "YOU" : "MUSE"}</span>
            <p>${escapeHtml(item.text)}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderMusic() {
  const entry = getCurrentEntry();
  const song = entry?.song;
  if (entry?.image) {
    $("#miniVinyl").style.setProperty("--cover", `url("${entry.image}")`);
  }
  $("#songTitle").textContent = song?.title || "还没有压制歌曲";
  $("#songLyric").textContent = song
    ? [song.lyric, song.chorus ? `副歌：${song.chorus}` : ""].filter(Boolean).join("\n")
    : "完成一张日记卡片后，AI 会把它变成一首私人短歌。";
  $("#songMeta").innerHTML = song
    ? [`${song.bpm || 82} BPM`, song.key || "A minor", song.style || "diary pop"].map((item) => `<span>${escapeHtml(item)}</span>`).join("")
    : "";
  $("#songPrompt").textContent = song?.prompt || "";
  $("#songPrompt").classList.toggle("is-visible", Boolean(song?.prompt));
  const uploadStatus = $("#audioUploadStatus");
  if (uploadStatus) {
    uploadStatus.textContent =
      song?.audioSource === "upload"
        ? `已使用上传配乐：${song.audioName || song.title}`
        : song?.audioUrl
          ? "这张唱片已有模型生成音频，也可以换成自己的配乐。"
          : "也可以上传自己的配乐，作为这张日记唱片的声音。";
  }
  $("#removeMusicBtn")?.classList.toggle("is-hidden", song?.audioSource !== "upload");
  renderShareCanvas();
}

function renderShareCanvas() {
  const entry = getCurrentEntry();
  const w = exportCanvas.width;
  const h = exportCanvas.height;
  exportCtx.fillStyle = "#050506";
  exportCtx.fillRect(0, 0, w, h);
  exportCtx.fillStyle = "#f7f2ea";
  exportCtx.font = "44px serif";
  exportCtx.fillText("DIARY RECORDS", 72, 94);

  if (!entry) return;
  const image = new Image();
  image.onload = () => {
    exportCtx.fillStyle = "#050506";
    exportCtx.fillRect(0, 0, w, h);
    exportCtx.save();
    roundedRect(exportCtx, 72, 150, 936, 760, 26);
    exportCtx.clip();
    exportCtx.drawImage(image, 72, 150, 936, 760);
    const grad = exportCtx.createLinearGradient(0, 420, 0, 910);
    grad.addColorStop(0, "rgba(5,5,6,0)");
    grad.addColorStop(1, "rgba(5,5,6,.88)");
    exportCtx.fillStyle = grad;
    exportCtx.fillRect(72, 150, 936, 760);
    exportCtx.restore();

    drawParticlesOnExport(entry, image);
    exportCtx.fillStyle = "#f7f2ea";
    exportCtx.font = "44px serif";
    exportCtx.fillText("DIARY RECORDS", 72, 94);
    exportCtx.font = "74px serif";
    wrapText(exportCtx, entry.title, 72, 1030, 820, 86);
    exportCtx.font = "28px sans-serif";
    exportCtx.fillStyle = "rgba(247,242,234,.68)";
    exportCtx.fillText(`${entry.date}  ${entry.range}  ${entry.mood}`, 72, 1180);
    exportCtx.font = "32px sans-serif";
    exportCtx.fillStyle = "rgba(247,242,234,.86)";
    wrapText(exportCtx, entry.summary || entry.seed, 72, 1260, 870, 48);
  };
  image.src = entry.image;
}

function drawParticlesOnExport(entry, image) {
  exportCtx.save();
  exportCtx.globalAlpha = 0.42;
  for (let i = 0; i < 1800; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() ** 0.72 * 460;
    const x = 540 + Math.cos(angle) * radius;
    const y = 520 + Math.sin(angle) * radius;
    const size = Math.random() * 2.4 + 0.6;
    exportCtx.fillStyle = i % 3 === 0 ? "rgba(73,213,150,.76)" : "rgba(247,242,234,.62)";
    exportCtx.fillRect(x, y, size, size);
  }
  exportCtx.restore();
}

function buildWave() {
  $("#waveBars").innerHTML = Array.from({ length: 48 }, (_, index) => {
    const level = 0.22 + Math.abs(Math.sin(index * 0.44)) * 0.58;
    return `<span class="bar" style="--level:${level.toFixed(3)}"></span>`;
  }).join("");
}

function renderPhoneSignals() {
  const signals = [
    ["相册", "识别今日关键影像：雨后、路灯、桌面"],
    ["日历", "提取移动办公/学习时间段：深度专注 86 分钟"],
    ["位置", "通勤与出行轨迹生成情绪地图"],
    ["音乐", "把最近循环歌曲作为情绪线索"],
    ["输入法", "在本地授权后捕捉高频愿望词"]
  ];
  $("#signalList").innerHTML = signals
    .map(
      ([name, detail]) => `
      <div class="signal">
        <span class="signal-dot"></span>
        <strong>${name}</strong>
        <small>${detail}</small>
      </div>`
    )
    .join("");
}

function simulatePhoneSignals() {
  const entry = ensureEntry();
  const additions = ["手机相册显示你今天拍了很多天空。", "日历里有一段被推迟的任务，但你最后还是完成了。", "音乐循环偏慢，像是需要一点陪伴。"];
  entry.chat.push({ role: "ai", text: `我从授权的手机信号里拼出一个侧影：${additions.join("")} 这一天的关键词可能是“把节奏拿回来”。` });
  entry.keywords = [...new Set([...(entry.keywords || []), "手机联动", "节奏", "天空"])].slice(0, 6);
  persist();
  renderAll();
  routeTo("studio");
}

async function playSong() {
  const entry = ensureEntry();
  if (!entry.song) await generateSong({ force: true });
  let song = entry.song;
  let audioUrl = await resolveSongAudioUrl(song);
  if (!audioUrl && isAceStepConfigured()) {
    toast("这张唱片还没有真实音频，正在重新压制...");
    await generateSong({ force: true });
    song = getCurrentEntry()?.song;
    audioUrl = await resolveSongAudioUrl(song);
  }
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    try {
      await audio.play();
      startPlaybackVisuals(song.bpm || 82);
      audio.addEventListener("ended", stopPlaybackVisuals);
      return;
    } catch (error) {
      toast("这段音频暂时打不开，先播放本地试播旋律");
    }
  }
  if (!song) return;
  if (!audioUrl) toast("未收到真实音频，正在播放本地草稿旋律");
  await playSynthSong(song);
}

function isAceStepConfigured() {
  const model = state.settings.musicModel || "";
  return /^(ace-step|acestep)/i.test(model) && Boolean((state.settings.musicBaseUrl || "").trim());
}

async function playSynthSong(song) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    toast("当前浏览器不支持 WebAudio");
    return;
  }
  if (!state.audio) state.audio = new AudioContext();
  const ctxAudio = state.audio;
  if (ctxAudio.state === "suspended") await ctxAudio.resume();
  const now = ctxAudio.currentTime;
  const notes = melodyForSong(song);
  const beat = 60 / (song.bpm || 78);
  const master = ctxAudio.createGain();
  master.gain.value = 0.82;
  master.connect(ctxAudio.destination);

  notes.forEach((freq, index) => {
    const start = now + index * beat;
    const osc = ctxAudio.createOscillator();
    const pad = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    const filter = ctxAudio.createBiquadFilter();
    osc.type = index % 3 ? "triangle" : "sine";
    pad.type = "sine";
    osc.frequency.value = freq;
    pad.frequency.value = freq / 2;
    filter.type = "lowpass";
    filter.frequency.value = 880 + index * 36;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.11, start + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + beat * 0.9);
    osc.connect(filter);
    pad.connect(filter);
    filter.connect(gain).connect(master);
    osc.start(start);
    pad.start(start);
    osc.stop(start + beat * 0.92);
    pad.stop(start + beat * 1.35);
  });

  startPlaybackVisuals(song.bpm || 78);
  setTimeout(() => {
    stopPlaybackVisuals();
    master.disconnect();
  }, notes.length * beat * 1000);
}

function startPlaybackVisuals(bpm = 82) {
  $("#miniVinyl")?.classList.add("is-playing");
  $(".music-player")?.classList.add("is-playing");
  clearInterval(state.visualizerTimer);
  let tick = 0;
  const speed = Math.max(0.18, Math.min(0.52, bpm / 220));
  state.visualizerTimer = setInterval(() => {
    $$(".bar").forEach((bar, index) => {
      const wave = Math.sin(tick * speed + index * 0.42);
      const pulse = Math.sin(tick * speed * 1.7 + index * 0.17);
      const level = 0.16 + Math.abs(wave) * 0.58 + Math.max(0, pulse) * 0.24;
      bar.style.setProperty("--level", Math.min(1, level).toFixed(3));
    });
    tick += 1;
  }, 90);
}

function stopPlaybackVisuals() {
  $("#miniVinyl")?.classList.remove("is-playing");
  $(".music-player")?.classList.remove("is-playing");
  clearInterval(state.visualizerTimer);
}

function melodyForSong(song) {
  const major = [261.63, 293.66, 329.63, 392, 440, 392, 329.63, 293.66, 261.63, 329.63, 392, 523.25];
  const minor = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63, 246.94, 293.66, 329.63, 440];
  const bright = [293.66, 369.99, 440, 493.88, 587.33, 493.88, 440, 369.99, 293.66, 440, 493.88, 659.25];
  const text = `${song?.title || ""} ${song?.style || ""} ${song?.key || ""}`;
  if (/cat|猫|lo-fi|G major/i.test(text)) return major;
  if (/offer|算法|A major|cinematic/i.test(text)) return bright;
  return /major/i.test(text) ? major : minor;
}

function startVoiceInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    toast("浏览器暂不支持语音识别");
    return;
  }
  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.onresult = (event) => {
    $("#chatInput").value = event.results[0][0].transcript;
    toast("语音已转写");
  };
  recognition.onerror = () => toast("语音输入被中断");
  recognition.start();
}

function toggleSound() {
  state.soundOn = !state.soundOn;
  toast(state.soundOn ? "声音已开启" : "声音已关闭");
}

function speak(text) {
  if (!state.soundOn || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.92;
  utterance.pitch = 0.92;
  window.speechSynthesis.speak(utterance);
}

function exportShareImage() {
  renderShareCanvas();
  setTimeout(() => {
    const link = document.createElement("a");
    link.download = `diary-record-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    toast("封面已导出");
  }, 180);
}

async function copyShareText() {
  const entry = ensureEntry();
  const text = `《${entry.title}》\n${entry.date} ${entry.range}\n${entry.summary || entry.seed}\n#DiaryRecords #日记唱片`;
  await copyText(text);
  toast("分享文案已复制");
}

async function nativeShare() {
  const entry = ensureEntry();
  const text = `《${entry.title}》 ${entry.summary || entry.seed}`;
  if (navigator.share) {
    await navigator.share({ title: entry.title, text });
  } else {
    await copyText(text);
    toast("当前浏览器已复制分享文案");
  }
}

function tickTimer() {
  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const secs = String(elapsed % 60).padStart(2, "0");
  $("#timer").textContent = `${mins}:${secs}`;
  setTimeout(tickTimer, 1000);
}

function ensureEntry() {
  let entry = getCurrentEntry();
  if (!entry) {
    createEntry();
    entry = getCurrentEntry();
  }
  return entry;
}

function getCurrentEntry() {
  return state.entries.find((entry) => entry.id === state.currentId) || state.entries[0];
}

function persist() {
  const namespace = storageNamespace();
  localStorage.setItem(`${namespace}.entries`, JSON.stringify(state.entries));
  localStorage.setItem(`${namespace}.version`, DATA_VERSION);
  if (!state.user) {
    localStorage.setItem("diary-records.entries", JSON.stringify(state.entries));
    localStorage.setItem("diary-records.version", DATA_VERSION);
  }
  updateProfileUi();
}

function cloneInitialEntries() {
  return initialEntries.map((entry) => ({
    ...entry,
    id: uid(),
    keywords: [...entry.keywords],
    chat: entry.chat.map((item) => ({ ...item })),
    song: entry.song ? { ...entry.song } : null
  }));
}

function extractKeywords(text) {
  const source = text.replace(/[，。！？、,.!?;；:："'“”‘’]/g, " ");
  const words = source
    .split(/\s+/)
    .flatMap((word) => (word.length > 8 && /[\u4e00-\u9fa5]/.test(word) ? word.match(/.{2,4}/g) || [] : [word]))
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !["今天", "感觉", "一个", "这个", "有点", "但是", "可以", "没有", "真的"].includes(word));
  const moodWords = ["松弛", "清醒", "心动", "低电量", "雨后", "夜色", "学习", "出行", "影像", "陪伴"];
  return [...new Set([...words, ...moodWords])].slice(0, 6);
}

function localSummary(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 72 ? `${clean.slice(0, 72)}...` : clean || "今天被安静地保存了下来。";
}

function titleFromSeed(text) {
  if (!text) return "";
  return text.replace(/[，。！？、,.!?]/g, " ").trim().slice(0, 14);
}

function companionOpening(mood, seed) {
  const map = {
    松弛: "那我们就不急着总结。你先说一个最想留下的细节，我帮你把它放稳。",
    清醒: "今天像是有一条线慢慢理顺了。可以从那个让你最确定的瞬间开始。",
    心动: "这张卡里已经有一点发亮的东西了。讲讲它吧，越具体越好。",
    低电量: "今天不用写得很完整。你丢给我一句也可以，我陪你慢慢拼起来。"
  };
  const detail = pickDetail(seed);
  return detail ? `我先把“${detail}”记在中心。${map[mood] || map.松弛}` : map[mood] || map.松弛;
}

function mergeText(a, b) {
  return [a, b].filter(Boolean).join("\n");
}

function hashCode(input) {
  return [...input].reduce((hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
}

function pickDetail(text) {
  const cleaned = String(text || "")
    .replace(/[，。！？、,.!?;；:："'“”‘’]/g, " ")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const candidates = cleaned
    .flatMap((item) => (item.length > 12 && /[\u4e00-\u9fa5]/.test(item) ? item.match(/.{2,8}/g) || [] : [item]))
    .filter((item) => item.length >= 2 && !["今天", "感觉", "这个", "真的", "有点", "然后", "但是", "因为"].includes(item));
  return candidates.sort((a, b) => scoreDetail(b) - scoreDetail(a))[0] || "";
}

function scoreDetail(text) {
  const anchors = ["水晶", "第一桶金", "猫", "小猫", "实习", "算法", "面试", "喜欢", "赚钱", "offer", "创业"];
  return text.length + anchors.reduce((score, word) => score + (text.includes(word) ? 20 : 0), 0);
}

function safeJson(raw) {
  try {
    const cleaned = String(raw)
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "");
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  } catch (error) {
    return null;
  }
}

function multimodalContent(entry, text) {
  if (!entry.image?.startsWith("data:image/")) return text;
  return [
    { type: "text", text: `${text}\n\n请结合图片的场景、色彩和情绪，但不要编造无法确认的事实。` },
    { type: "image_url", image_url: { url: entry.image } }
  ];
}

function uid() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cssImage(src) {
  return `url("${String(src).replaceAll("\\", "/").replaceAll('"', "%22")}")`;
}

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const chars = [...text];
  let line = "";
  let currentY = y;
  for (const char of chars) {
    const test = line + char;
    if (context.measureText(test).width > maxWidth && line) {
      context.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = test;
    }
  }
  context.fillText(line, x, currentY);
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("is-visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => $("#toast").classList.remove("is-visible"), 1800);
}

boot().catch((error) => {
  console.error(error);
  toast("启动失败，请检查控制台");
});
