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
    model: "",
    musicModel: ""
  },
  audio: null,
  soundOn: true,
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
const exportCanvas = $("#shareCanvas");
const exportCtx = exportCanvas.getContext("2d");

function boot() {
  loadSettings();
  const saved = localStorage.getItem("diary-records.entries");
  const savedVersion = localStorage.getItem("diary-records.version");
  state.entries = saved && savedVersion === DATA_VERSION ? JSON.parse(saved) : cloneInitialEntries();
  state.currentId = state.entries[0]?.id ?? null;
  persist();
  bindEvents();
  setToday();
  renderAll();
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

function bindEvents() {
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
  $("#songBtn").addEventListener("click", generateSong);
  $("#voiceBtn").addEventListener("click", startVoiceInput);
  $("#soundBtn").addEventListener("click", toggleSound);
  $("#playSongBtn").addEventListener("click", playSong);
  $("#exportBtn").addEventListener("click", exportShareImage);
  $("#copyBtn").addEventListener("click", copyShareText);
  $("#nativeShareBtn").addEventListener("click", nativeShare);
  $("#simulateBtn").addEventListener("click", simulatePhoneSignals);
  $("#sceneWriteBtn").addEventListener("click", () => openPanel("compose"));
  $("#sceneChatBtn").addEventListener("click", () => openPanel("chat"));
  $("#dockVoiceBtn").addEventListener("click", startVoiceInput);
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
    state.mouse.x = (point.clientX - rect.left) * devicePixelRatio;
    state.mouse.y = (point.clientY - rect.top) * devicePixelRatio;
    state.mouse.active = true;
  };

  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerleave", () => (state.mouse.active = false));
  canvas.addEventListener("touchmove", move, { passive: true });
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
  $("#apiBase").value = state.settings.baseUrl;
  $("#apiKey").value = state.settings.apiKey;
  $("#apiModel").value = state.settings.model;
  $("#musicModel").value = state.settings.musicModel;
  $("#modelName").textContent = state.settings.model || "Local Muse";
}

function saveSettings() {
  state.settings = {
    baseUrl: $("#apiBase").value.trim(),
    apiKey: $("#apiKey").value.trim(),
    model: $("#apiModel").value.trim(),
    musicModel: $("#musicModel").value.trim()
  };
  localStorage.setItem("diary-records.settings", JSON.stringify(state.settings));
  $("#modelName").textContent = state.settings.model || "Local Muse";
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
  toast("日记卡片已生成");
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
      toast("API 暂不可用，已切换本地陪伴");
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

async function generateSong() {
  const entry = ensureEntry();
  const keywords = entry.keywords?.length ? entry.keywords : extractKeywords(entry.seed);
  toast("正在压制私人唱片...");
  const generated = await askSongModel(entry, keywords);
  entry.song = generated || composeLocalSong(entry, keywords);
  persist();
  renderMusic();
  routeTo("music");
  toast(entry.song.audioUrl ? "音乐模型已返回音频" : "私人短歌已压制，可播放 demo");
}

async function askSongModel(entry, keywords) {
  if (!state.settings.baseUrl || !state.settings.apiKey || !state.settings.musicModel) return null;
  try {
    const response = await fetch(`${state.settings.baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.settings.apiKey}`
      },
      body: JSON.stringify({
        model: state.settings.musicModel,
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
    toast("音乐模型暂不可用，已生成本地唱片 demo");
    return null;
  }
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
    prompt:
      song.prompt ||
      `Create a polished short song from this diary. Language: Chinese. Mood: ${entry.mood}. Keywords: ${keywords.join(", ")}. Style: ${style}. Diary: ${entry.seed}`
  };
}

function prepareParticles(src) {
  resizeCanvas();
  state.particles = [];
  if (!src) return;

  const image = new Image();
  if (/^https?:\/\//i.test(src)) image.crossOrigin = "anonymous";
  image.onload = () => {
    const size = Math.min(canvas.width, canvas.height) * 0.76;
    const off = document.createElement("canvas");
    const scale = window.innerWidth < 620 ? 190 : 230;
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
    const step = window.innerWidth < 620 ? 2 : 2;

    for (let y = 0; y < scale; y += step) {
      for (let x = 0; x < scale; x += step) {
        const i = (y * scale + x) * 4;
        const alpha = pixels[i + 3];
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        const keep = brightness > 20 ? 0.88 : 0.22;
        if (alpha > 20 && brightness > 10 && Math.random() < keep) {
          const targetX = cx + (x / scale - 0.5) * size;
          const targetY = cy + (y / scale - 0.5) * size;
          const depth = (brightness / 255) * 1.8 - 0.55 + (Math.random() - 0.5) * 0.55;
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
            size: Math.random() * 1.55 + 0.48 + Math.max(depth, 0) * 0.42,
            r: pixels[i],
            g: pixels[i + 1],
            b: pixels[i + 2],
            a: 0.42 + Math.random() * 0.46
          });
        }
      }
    }

    for (let i = 0; i < 1600; i += 1) {
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
  for (let i = 0; i < 5200; i += 1) {
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
  canvas.width = Math.max(320, Math.floor(rect.width * devicePixelRatio));
  canvas.height = Math.max(320, Math.floor(rect.height * devicePixelRatio));
}

function drawLoop() {
  requestAnimationFrame(drawLoop);
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

  for (const p of state.particles) {
    const breathe = Math.sin(t * p.drift + p.phase) * (5 + p.z * 2) * devicePixelRatio;
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
      const radius = 150 * devicePixelRatio;
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
    ctx.beginPath();
    ctx.arc(px, py, p.size * perspective * devicePixelRatio, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
}

function renderAll() {
  const entry = getCurrentEntry();
  if (entry) {
    $("#recordImage").src = entry.image;
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
  const positions = [
    [18, 31],
    [68, 22],
    [74, 58],
    [20, 66],
    [43, 15],
    [49, 76]
  ];
  $("#keywordOrbit").innerHTML = keywords
    .slice(0, 6)
    .map((word, index) => `<span class="keyword" style="left:${positions[index][0]}%;top:${positions[index][1]}%;animation-delay:${index * 0.4}s">${escapeHtml(word)}</span>`)
    .join("");
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
          <button class="ghost-btn" data-play-memory="${entry.id}">${song ? "播放唱片" : "生成唱片"}</button>
          <button class="ghost-btn subtle" data-music-memory="${entry.id}">查看音乐页</button>
        </div>
        <div class="detail-song">
          <small>DIARY SONG</small>
          <strong>${escapeHtml(song?.title || "还没有生成歌曲")}</strong>
          <p>${escapeHtml(song?.chorus || song?.prompt || "点击生成唱片后，会把这篇日记写成一首可以分享的歌。")}</p>
        </div>
      </section>
    </div>
    <section class="detail-chat">
      <div class="eyebrow">AI COMPANION LOG</div>
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
  $("#waveBars").innerHTML = Array.from({ length: 48 }, (_, index) => `<span class="bar" style="height:${20 + Math.abs(Math.sin(index * 0.44)) * 72}%"></span>`).join("");
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
  if (!entry.song) await generateSong();
  const song = entry.song;
  if (song?.audioUrl) {
    const audio = new Audio(song.audioUrl);
    audio.play().catch(() => toast("音频地址暂时无法播放，已切换 demo 旋律"));
    $("#miniVinyl").classList.add("is-playing");
    audio.addEventListener("ended", () => $("#miniVinyl").classList.remove("is-playing"));
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) {
    toast("当前浏览器不支持 WebAudio");
    return;
  }
  if (!state.audio) state.audio = new AudioContext();
  const ctxAudio = state.audio;
  const now = ctxAudio.currentTime;
  const notes = melodyForSong(song);
  const beat = 60 / (song.bpm || 78);
  notes.forEach((freq, index) => {
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    const filter = ctxAudio.createBiquadFilter();
    osc.type = index % 3 ? "triangle" : "sine";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 950 + index * 40;
    gain.gain.setValueAtTime(0.0001, now + index * beat);
    gain.gain.exponentialRampToValueAtTime(0.13, now + index * beat + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (index + 0.82) * beat);
    osc.connect(filter).connect(gain).connect(ctxAudio.destination);
    osc.start(now + index * beat);
    osc.stop(now + (index + 0.9) * beat);
  });
  $("#miniVinyl").classList.add("is-playing");
  setTimeout(() => $("#miniVinyl").classList.remove("is-playing"), notes.length * beat * 1000);
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
  localStorage.setItem("diary-records.entries", JSON.stringify(state.entries));
  localStorage.setItem("diary-records.version", DATA_VERSION);
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

boot();
