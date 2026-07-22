function scrFlow() {
    const steps = state.ev === 'birth' ? birthSteps(state.county) : kgSteps(state.county);
    state.curSteps = steps;
    const evName = state.ev === 'birth' ? '孩子出生' : '孩子上幼兒園';
    return `<div class="flowtop"><div class="ev">${evName}</div><div class="ct">${state.county}</div></div>
    <div class="ftools"><button class="expbtn" onclick="toggleAll(this)">展開全部</button></div>
    <div class="acc">${steps.map((s, i) => stepHTML(s, i)).join('')}</div>`;
  }
  function toggleAll(btn) {
    const items = document.querySelectorAll('.acc .st');
    const anyClosed = [...items].some(it => !it.classList.contains('open'));
    items.forEach(it => it.classList.toggle('open', anyClosed));
    btn.textContent = anyClosed ? '收合全部' : '展開全部';
  }

  window.addEventListener("DOMContentLoaded", () => {
    const hash = window.location.hash;

    if (!hash) return;

    const target = document.querySelector(hash);

    if (!target) return;

    // 展開
    target.classList.add("open");

    // 捲到該位置
    target.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

  function toggleCounter(i, btn) { const el = document.getElementById('ct' + i); const show = el.style.display === 'none'; el.style.display = show ? 'block' : 'none'; btn.textContent = show ? '收合臨櫃方式' : '我要臨櫃'; }
  function toggleCounter(id, btnElement) {
    // 1. 這是你原本控制臨櫃區塊顯示/隱藏的邏輯 (例如控制 #ct1)
    const targetContent = document.getElementById('ct' + id);
    if (targetContent) {
      const isHidden = targetContent.style.display === 'none';
      targetContent.style.display = isHidden ? 'block' : 'none';
    }

    btnElement.classList.toggle('open');
  }

  function stepHTML(s, i) {
    const st = (s.role === '中央') ? 'online' : s.status;
    const kcls = st ? 'k-' + st : 'k-none', rc = { '中央': 'central', '地方': 'local', '共通': 'common' }[s.role];
    let fmtAmt = a => a ? esc(a).replace(/[、，](第\d+[名胎]|雙胞胎|三胞胎|多胞胎|首胎|二胎|三胎|四胎|五胎)/g, '<br>$1').replace(/；/g, '<br>').replace(/：/g, '：<br>') : '';
    let p = '';
    if (s.金額) p += `<div class="amount">${fmtAmt(s.金額)}</div>`;
    if (s.desc) p += `<div style="font-size:14px;color:#8a8a80;margin-bottom:6px">${s.desc}</div>`;
    let rr = ''; if (s.資格) rr += `<div class="r"><span class="k">資格</span><span>${esc(s.資格)}</span></div>`;
    if (s.申請期限) rr += `<div class="r"><span class="k">期限</span><span>${esc(s.申請期限)}</span></div>`;
    if (rr) p += `<div class="rows">${rr}</div>`;
    p += chanHTML(s, i);
    if (s.combos && s.combos.length) p += `<div class="combo"><div class="l">➕ 辦出生登記時可一站式併辦下列 ${s.combos.length} 項（同一窗口／同一線上流程）</div>`
      + s.combos.map(cb => `<div class="citem"><details><summary class="n" style="cursor:pointer;list-style:none;">${esc(cb.title)}${cb.chn ? `<span class="chn${cb.chn.includes('僅臨櫃') ? ' lim' : ''}">${esc(cb.chn)}</span>` : ''}</summary><div class="combo-detail">`
        + (cb.金額 ? `<div class="cm" style="margin-top:0">${fmtAmt(cb.金額)}</div>` : '')
        + (cb.text ? `<div class="cd">${esc(cb.text)}</div>` : '')
        + (cb.exc && cb.exc.length ? `<div class="exc"><div class="l">⚠️ 下列情形無法併辦，須另外辦理：</div><ul>${cb.exc.map(e => `<li>${esc(e)}</li>`).join('')}</ul></div>` : '')
        + (cb.alt ? `<div class="calt">🔁 ${esc(cb.alt)}</div>` : '')
        + `</div></details></div>`).join('') + `</div>`;
    if (s.tip) p += `<div class="tip">💡 ${esc(s.tip)}</div>`;
    const added = store.prog.some(x => x.id === progId(s));
    p += `<button class="trackbtn ${added ? 'added' : ''}" onclick="track(${i})">${added ? '✓ 已加入我的辦理清單' : '＋ 加入我的辦理清單'}</button>`;
    return `<div class="st ${kcls} ${rc}">
    <button class="sth" onclick="this.parentNode.classList.toggle('open')"><span class="snum">${s.n}</span>
      <span class="stt"><span class="nm">${esc(s.title)}</span></span><span class="chev">▶</span></button>
    <div class="stb">${p}</div></div>`;
  }

  //標籤狀態切換//
const statusList = [
    { text: "未開始", className: "stp-todo" },
    { text: "進行中", className: "stp-doing" },
    { text: "已完成", className: "stp-done" }
];

function cycle(btn) {
    // 找目前是哪個狀態
    let index = statusList.findIndex(s => btn.classList.contains(s.className));

    // 下一個狀態
    index = (index + 1) % statusList.length;

    // 移除所有狀態 class
    btn.classList.remove("stp-todo", "stp-doing", "stp-done");

    // 加上新的 class
    btn.classList.add(statusList[index].className);

    // 修改文字
    btn.textContent = statusList[index].text;
}

function closeConfirm() {
    pendingRemoveTrk = null;
    document.getElementById("confirmOverlay").classList.remove("show");
}

// 用事件委派綁在 document 上，不管 confirmBtn 何時出現都抓得到
document.addEventListener("click", function(e) {
    if (e.target && e.target.id === "confirmBtn") {
        if (!pendingRemoveTrk) return;

        const trk = pendingRemoveTrk;
        closeConfirm();

        trk.classList.add("removing");
        trk.addEventListener("transitionend", () => {
            trk.remove();
        }, { once: true });
    }
});

function rmProg(event) {
    event.preventDefault();

    if (!confirm("確定要移除此項目嗎？")) return;

    const trk = event.target.closest(".trk");

    if (trk) {
        trk.remove();
    }
}

function sendCode() {
    const email = document.getElementById("email").value.trim();

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
        alert("請輸入有效的 Email");
        return;
    }

    // 儲存 Email
    localStorage.setItem("userEmail", email);

    // 顯示登入碼區塊
    document.getElementById("mailbox").classList.add("show");

    document.querySelector(".mh").textContent =
        `📩 示範模式：這封信會寄到 ${email}`;
}

window.addEventListener("DOMContentLoaded", () => {
    const email = localStorage.getItem("userEmail") || "訪客";
    const count = document.querySelectorAll(".trkitem").length;

    document.querySelector(".mail-name").textContent =
        `${email}　共 ${count} 項`;
});

