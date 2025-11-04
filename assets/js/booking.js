// Các khung 6 tiếng hợp lệ từ 07:00 đến 17:00
const valid6hSlots = [];
for (let h = 7; h <= 17; h++) {
  const start = `${String(h).padStart(2, '0')}:00`;
  const end = `${String(h + 6).padStart(2, '0')}:00`;
  valid6hSlots.push({ start, end });
}
const buffer = 1; // 1 tiếng buffer

async function fetchAllBookings(dateStart, dateEnd) {
  const API_BASE = "http://127.0.0.1:5583";
  // Lấy cả tháng bắt đầu và tháng kết thúc (nếu khác tháng)
  const months = [];
  let d = new Date(dateStart.slice(0, 7) + "-01");
  const endMonth = dateEnd.slice(0, 7);
  while (d.toISOString().slice(0, 7) <= endMonth) {
    months.push(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() + 1);
  }
  let all = [];
  for (const m of months) {
    const res = await fetch(`${API_BASE}/api/rentals-detail?month=${m}`);
    const data = await res.json();
    all = all.concat(data.rentals || []);
  }
  return all;
}
// Kiểm tra conflict với buffer
function isConflictWithBuffer(slot, booked) {
  // Nếu là object start (ngày bắt đầu của booking nhiều ngày)
  if (typeof booked === 'object' && booked.type === 'start') {
    const slotEnd = parseInt(slot.end.split(":")[0]);
    const startH = parseInt(booked.start_time.split(":")[0]);
    return slotEnd > (startH - buffer);
  }
  // Nếu là object end (ngày kết thúc của booking nhiều ngày)
  if (typeof booked === 'object' && booked.type === 'end') {
    const slotStart = parseInt(slot.start.split(":")[0]);
    const endH = parseInt(booked.end_time.split(":")[0]);
    // Chỉ block slot bắt đầu trước (giờ trả + buffer)
    return slotStart < (endH + buffer);
  }
  // Nếu là slot dạng chuỗi (giờ theo giờ)
  if (typeof booked === 'string') {
    const [bStart, bEnd] = booked.split("-");
    const slotStart = parseInt(slot.start.split(":")[0]);
    const slotEnd = parseInt(slot.end.split(":")[0]);
    const bStartH = parseInt(bStart.split(":")[0]);
    const bEndH = parseInt(bEnd.split(":")[0]);
    // Áp dụng buffer 1 tiếng 2 đầu
    return !(slotEnd <= bStartH - buffer || slotStart >= bEndH + buffer);
  }
  return false;
}

// Kiểm tra slot bị block
function isSlotBlocked(slot, booked_slots) {
  // Nếu block toàn bộ ngày
  if (booked_slots.length === 1 && booked_slots[0] === 'ALL_DAY') return true;

  // Nếu có object start/end
  for (const b of booked_slots) {
    if (typeof b === 'object' && b.type === 'start') {
      // Block slot giao với [start_time, 23:59]
      if (slot.end > b.start_time) return true;
    }
    if (typeof b === 'object' && b.type === 'end') {
      // Block slot giao với [00:00, end_time]
      if (slot.start < b.end_time) return true;
    }
    // Nếu là slot dạng chuỗi (giờ theo giờ)
    if (typeof b === 'string') {
      // ...xử lý conflict như cũ...
    }
  }
  return false;
}

// Lấy danh sách booking của tất cả máy cho 1 ngày từ API
async function getBookingsByDate(dateStr) {
  const res = await fetch(`http://127.0.0.1:5583/api/bookings?date=${dateStr}`);
  const data = await res.json();
  // Đưa về dạng [{camera, slots: [...], rent_time_frame }]
  return data.map(cam => ({
    camera: cam.camera_name,
    slots: cam.booked_slots,
    rent_time_frame: cam.rent_time_frame
  }));
}

async function showDaySection(date) {
  const container = document.getElementById("bookingDaySections");
  const dMY = date.split('-').reverse().join('/');
  let bookings = [];
  try {
    bookings = await getBookingsByDate(date);
  } catch (e) {
    container.innerHTML = "<div style='color:#d11313'>Không thể tải dữ liệu thuê ngày.</div>";
    return;
  }

  // Lọc chỉ lấy máy cho thuê theo ngày hoặc cả ngày/giờ
  const dateBookings = bookings.filter(b =>
    b.rent_time_frame === "date" || b.rent_time_frame === "date/hour"
  );

  let html = `<h4 style="color:#F2A7AD;text-align:center;">Thuê theo ngày</h4>`;
  if (!dateBookings.length) {
    html += `<div style="color:#aaa;text-align:center;">Không có máy nào cho thuê theo ngày.</div>`;
  } else {
    html += dateBookings.map((b, idx) => {
      const camera = b.camera;
      const slots = Array.isArray(b.slots) ? b.slots : [];
      let slotHtml = '';
      if (slots.length === 1 && slots[0] === 'ALL_DAY') {
        slotHtml = `<div class="slot booked"><span style="color:#d11313;">🔴 Đã kín lịch cho thuê ngày này</span></div>`;
      } else {
        slotHtml = `
          <div class="slot available" style="color:#90ee90;">
            🟢 Máy này chỉ cho thuê theo ngày.<br>
            <b>Chính sách trả máy:</b>
            <ul style="color:#fff; text-align:left; margin: 8px 0 0 18px; font-size:0.98em;">
              <li>Nếu lấy máy trước 20h: phải trả trước 9h ngày kết thúc thuê.</li>
              <li>Nếu lấy máy sau 20h: trả đúng giờ lấy vào ngày kết thúc thuê.</li>
              <li>Trả giờ lẻ: trước xh30 tính x, sau xh30 tính x+1.</li>
            </ul>
            <button class="book-btn" type="button">Đặt thuê theo ngày</button>
          </div>
        `;
      }
      return `
        <div class="camera-card">
          <div class="camera-header">
            <span class="camera-title">${camera}</span>
          </div>
          <div class="camera-slots">
            ${slotHtml}
          </div>
        </div>
      `;
    }).join('');
  }
  container.innerHTML = html;
}
// Hiển thị modal: danh sách máy, slot đã thuê và slot còn trống
async function showDayDetail(date) {
  const container = document.getElementById("bookingSections");
  const dMY = date.split('-').reverse().join('/');

  // Last-click-wins token: chỉ render kết quả của lần click gần nhất
  window.__bookingClickToken = (window.__bookingClickToken || 0) + 1;
  const myToken = window.__bookingClickToken;

  container.style.display = "block";
  container.innerHTML = `<h5>Lịch thuê ngày ${dMY}</h5>`;

  let bookings = [];
  try {
    bookings = await getBookingsByDate(date);
  } catch (e) {
    console.error(e);
    return;
  }
  async function getBookingsByDate(dateStr) {
    const res = await fetch(`http://127.0.0.1:5583/api/bookings?date=${dateStr}`);
    const data = await res.json();
    // Đưa về dạng [{camera, slots: [...], rent_time_frame }]
    return data.map(cam => ({
      camera: cam.camera_name,
      slots: cam.booked_slots,
      rent_time_frame: cam.rent_time_frame || "date/hour"
    }));
  }
  const hourBookings = bookings.filter(b =>
  b.rent_time_frame === "hour" || b.rent_time_frame === "date/hour"
  );

//   async function showDaySection(date) {
//   const container = document.getElementById("bookingDaySections");
//   const dMY = date.split('-').reverse().join('/');
//   let bookings = [];
//   try {
//     bookings = await getBookingsByDate(date);
//   } catch (e) {
//     container.innerHTML = "<div style='color:#d11313'>Không thể tải dữ liệu thuê ngày.</div>";
//     return;
//   }

//   // Lọc chỉ lấy máy cho thuê theo ngày hoặc cả ngày/giờ
//   const dateBookings = bookings.filter(b =>
//     b.rent_time_frame === "date" || b.rent_time_frame === "date/hour"
//   );

//   let html = `<h4 style="color:#F2A7AD;text-align:center;">Thuê theo ngày</h4>`;
//   if (!dateBookings.length) {
//     html += `<div style="color:#aaa;text-align:center;">Không có máy nào cho thuê theo ngày.</div>`;
//   } else {
//     html += dateBookings.map((b, idx) => {
//       const camera = b.camera;
//       const slots = Array.isArray(b.slots) ? b.slots : [];
//       let slotHtml = '';
//       if (slots.length === 1 && slots[0] === 'ALL_DAY') {
//         slotHtml = `<div class="slot booked"><span style="color:#d11313;">🔴 Đã kín lịch cho thuê ngày này</span></div>`;
//       } else {
//         slotHtml = `
//           <div class="slot available" style="color:#90ee90;">
//             🟢 Máy này chỉ cho thuê theo ngày.<br>
//             <b>Chính sách trả máy:</b>
//             <ul style="color:#fff; text-align:left; margin: 8px 0 0 18px; font-size:0.98em;">
//               <li>Nếu lấy máy trước 20h: phải trả trước 9h ngày kết thúc thuê.</li>
//               <li>Nếu lấy máy sau 20h: trả đúng giờ lấy vào ngày kết thúc thuê.</li>
//               <li>Trả giờ lẻ: trước xh30 tính x, sau xh30 tính x+1.</li>
//             </ul>
//             <button class="book-btn" type="button">Đặt thuê theo ngày</button>
//           </div>
//         `;
//       }
//       return `
//         <div class="camera-card">
//           <div class="camera-header">
//             <span class="camera-title">${camera}</span>
//           </div>
//           <div class="camera-slots">
//             ${slotHtml}
//           </div>
//         </div>
//       `;
//     }).join('');
//   }
//   container.innerHTML = html;
// }
  // Nếu đã có click mới hơn, bỏ qua render của lần cũ
  if (myToken !== window.__bookingClickToken) return;

  let html = '';
  bookings
  .filter(b => {
    const t = String(b.rent_time_frame).toLowerCase().trim();
    return t === "hour" || t === "date/hour";
  })
  .forEach((b, idx) => {
    const camera = b.camera;
    const slots = Array.isArray(b.slots) ? b.slots : [];
    let slotHtml = '';

    if (slots.length === 1 && slots[0] === 'ALL_DAY') {
      slotHtml = `<div class="slot booked"><span style="color:#d11313;">🔴 Không còn giờ trống cho ngày ${dMY}</span></div>`;
    } else {
      const available = valid6hSlots.filter(slot =>
        !slots.some(booked => isConflictWithBuffer(slot, booked))
      );
      if (available.length > 0) {
        slotHtml = available.map(s =>
          `<div class="slot available"><span>🟢</span> ${s.start}–${s.end} <button class="book-btn" type="button">Đặt ngay</button></div>`
        ).join('');
      } else {
        slotHtml = `<div class="slot booked"><span style="color:#d11313;">🔴 Không còn giờ trống cho ngày ${dMY}</span></div>`;
      }
    }

    html += `
      <div class="camera-card">
        <div class="camera-header accordion-toggle" data-target="camera-body-${idx}">
          <span class="camera-title">${camera}</span>
          <span class="accordion-arrow">◀</span>
        </div>
        <div class="camera-slots camera-body" id="camera-body-${idx}">
          ${slotHtml}
        </div>
      </div>
    `;
  });

  container.innerHTML += html;

  container.querySelectorAll('.accordion-toggle').forEach(header => {
    header.onclick = function () {
      const target = document.getElementById(this.getAttribute('data-target'));
      const arrow = this.querySelector('.accordion-arrow');
      const opened = target.classList.toggle('open');
      arrow.innerHTML = opened ? "▼" : "◀";
    };
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "vi",
    height: "auto",
    selectable: true,
    eventTimeFormat: false,
    eventDisplay: 'block',
    headerToolbar: { left: "prev,next today", center: "title", right: "" },
    dateClick: function (info) { showDayDetail(info.dateStr); }
  });
  calendar.render();
});

function closeModal() {
  document.getElementById("slotModal").style.display = 'none';
  document.getElementById("conflictInfo").innerHTML = "";
}
document.querySelectorAll('.accordion-toggle').forEach(header => {
  header.onclick = function() {
    const target = document.getElementById(this.getAttribute('data-target'));
    const arrow = this.querySelector('.accordion-arrow');
    if (target.classList.contains('open')) {
      target.classList.remove('open');
      arrow.innerHTML = "&#9660;";
    } else {
      target.classList.add('open');
      arrow.innerHTML = "&#9650;";
    }
  };
});
document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  if (!calendarEl) return;

  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "vi",
    height: "auto",
    selectable: true,
    eventTimeFormat: false,
    eventDisplay: 'block',
    headerToolbar: { left: "prev,next today", center: "title", right: "" },
    dateClick: function (info) {
      showDaySection(info.dateStr);   // thuê theo ngày
      showDayDetail(info.dateStr);    // thuê theo giờ
    }
  });
  calendar.render();
});



/* ===== Loader khi pending fetch /api/bookings (không đổi xử lý dữ liệu) ===== */
// ...existing code...

/* ===== Loader khi pending fetch /api/bookings (không đổi xử lý dữ liệu) ===== */
(() => {
  const API_MATCH = /\/api\/bookings/i;
  const targetSelector = "#bookingSections";
  let active = 0;
  let container, overlay, quoteTimer;

  const QUOTES = [
    "“Bạn không chụp ảnh – bạn tạo ra nó.” – Ansel Adams",
    "“Ống kính tốt nhất là đôi mắt biết cảm.”",
    "“Ánh sáng tạo nên phép màu của nhiếp ảnh.”",
    "“Kể một câu chuyện bằng một khung hình.”",
    "“Đôi khi chậm lại để bắt kịp khoảnh khắc.”",
    "“Mọi bức ảnh đều là tấm gương của người chụp.”"
  ];

  // CSS cho overlay trong container (cân giữa đẹp hơn)
  (function injectCSS() {
    if (document.getElementById("copilotLoaderCSS")) return;
    const st = document.createElement("style");
    st.id = "copilotLoaderCSS";
    st.textContent = `
      @keyframes copilotSpin{to{transform:rotate(360deg)}}
      .copilot-spinner{
        width:44px;height:44px;border-radius:50%;
        border:3px solid rgba(242,167,173,0.25);border-top-color:#F2A7AD;
        animation:copilotSpin .9s linear infinite;margin:0 auto 10px auto;
      }
      ${targetSelector}{ position: relative; }
      .copilot-overlay{
        position: absolute; inset: 0; z-index: 10; display: none; pointer-events: none;
        display: grid; place-items: center;
        border: 2px dashed rgba(242,167,173,0.35); border-radius: 14px;
        background: rgba(0,0,0,0.6); padding: 24px 16px; text-align: center;
      }
      .copilot-inner{
        max-width: 560px; width: 100%;
      }
      .copilot-title{
        color:#F2A7AD;font-weight:700;letter-spacing:0.5px;margin:8px 0 6px;font-size:18px;
      }
      .copilot-quote{ color:#ddd;font-style:italic;margin:4px 0 0;font-size:15px }
      .copilot-attempt{ color:#bfbfbf;margin-top:8px;font-size:14px; display:none }
      /* Ẩn toàn bộ nội dung trong lúc chờ để tránh chồng chéo */
      .copilot-loading > :not(.copilot-overlay){ visibility: hidden !important; }
    `;
    document.head.appendChild(st);
  })();

  function ensureElements() {
    container = document.querySelector(targetSelector);
    if (!container) return false;
    overlay = container.querySelector(".copilot-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "copilot-overlay";
      overlay.innerHTML = `
        <div class="copilot-inner">
          <div class="copilot-spinner"></div>
          <p class="copilot-title">Đang tải dữ liệu...</p>
          <p id="copilotQuote" class="copilot-quote">“Khoảnh khắc tốt nhất là khoảnh khắc bạn đang có.”</p>
          <p id="copilotAttempt" class="copilot-attempt">Đang thử lại lần 1</p>
        </div>`;
      container.prepend(overlay);
    }
    return true;
  }

  function showLoader() {
    if (!ensureElements()) return;
    container.classList.add("copilot-loading");
    if (!container.dataset.prevMinH) container.dataset.prevMinH = container.style.minHeight || "";
    container.style.minHeight = Math.max(260, container.clientHeight) + "px";
    overlay.style.display = "grid";

    clearInterval(quoteTimer);
    const q = document.getElementById("copilotQuote");
    let i = 0;
    quoteTimer = setInterval(() => { if (q) q.textContent = QUOTES[(++i) % QUOTES.length]; }, 4000);
  }

  function hideLoader() {
    clearInterval(quoteTimer);
    if (!container || !overlay) return;
    overlay.style.display = "none";
    container.classList.remove("copilot-loading");
    container.style.minHeight = container.dataset.prevMinH || "";
    delete container.dataset.prevMinH;
  }

  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const _fetch = window.fetch.bind(window);

  // Chỉ “bọc” các request tới /api/bookings
  window.fetch = function(input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (!API_MATCH.test(url)) return _fetch(input, init);

    // Một phiên loader cho cả chuỗi retry
    active++;
    showLoader();

    // Reset & cập nhật bộ đếm retry hiển thị
    const attemptEl = () => document.getElementById("copilotAttempt");
    const setAttempt = (n) => {
      const el = attemptEl();
      if (!el) return;
      if (n > 0) {
        el.style.display = "block";
        el.textContent = `Đang thử lại lần ${n}`;
      } else {
        el.style.display = "none";
      }
    };
    setAttempt(0);

    const attempt = async () => {
      let n = 0;
      while (true) {
        try {
          const res = await _fetch(input, init);
          if (res.ok) return res;          // thành công => trả về ngay
        } catch (_) { /* network error -> retry */ }
        setAttempt(++n);                    // cập nhật “Đang thử lại lần n”
        await delay(7000);                  // fail => tự retry sau 7s
      }
    };

    return attempt().then(res => {
      active = Math.max(0, active - 1);
      if (active === 0) hideLoader();
      return res;
    }, err => {
      active = Math.max(0, active - 1);
      if (active === 0) hideLoader();
      throw err;
    });
  };
})();
/* ===== End loader ===== */

/* ===== Loader + retry có hủy (pending /api/bookings) ===== */
(() => {
  const API_MATCH = /\/api\/bookings/i;
  const targetSelector = "#bookingSections";

  // State dùng chung
  let container, overlay, quoteTimer;
  let sessionId = 0;                 // phiên gọi hiện tại (last-click-wins)
  let controller = null;             // AbortController của phiên hiện tại

  const QUOTES = [
    "“Bạn không chụp ảnh – bạn tạo ra nó.” – Ansel Adams",
    "“Ống kính tốt nhất là đôi mắt biết cảm.”",
    "“Ánh sáng tạo nên phép màu của nhiếp ảnh.”",
    "“Kể một câu chuyện bằng một khung hình.”",
    "“Đôi khi chậm lại để bắt kịp khoảnh khắc.”",
    "“Mọi bức ảnh đều là tấm gương của người chụp.”"
  ];

  // CSS một lần
  (function injectCSS() {
    if (document.getElementById("copilotLoaderCSS")) return;
    const st = document.createElement("style");
    st.id = "copilotLoaderCSS";
    st.textContent = `
      @keyframes copilotSpin{to{transform:rotate(360deg)}}
      .copilot-spinner{
        width:44px;height:44px;border-radius:50%;
        border:3px solid rgba(242,167,173,0.25);border-top-color:#F2A7AD;
        animation:copilotSpin .9s linear infinite;margin:0 auto 10px auto;
      }
      ${targetSelector}{ position: relative; }
      .copilot-overlay{
        position: absolute; inset: 0; z-index: 10; display: none; pointer-events: none;
        display: grid; place-items: center;
        border: 2px dashed rgba(242,167,173,0.35); border-radius: 14px;
        background: rgba(0,0,0,0.6); padding: 24px 16px; text-align: center;
      }
      .copilot-inner{
        max-width: 560px; width: 100%;
      }
      .copilot-title{
        color:#F2A7AD;font-weight:700;letter-spacing:0.5px;margin:8px 0 6px;font-size:18px;
      }
      .copilot-quote{ color:#ddd;font-style:italic;margin:4px 0 0;font-size:15px }
      .copilot-attempt{ color:#bfbfbf;margin-top:8px;font-size:14px; display:none }
      .copilot-loading > :not(.copilot-overlay){ visibility: hidden !important; }
    `;
    document.head.appendChild(st);
  })();

  function ensureElements() {
    container = document.querySelector(targetSelector);
    if (!container) return false;
    overlay = container.querySelector(".copilot-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "copilot-overlay";
      overlay.innerHTML = `
        <div class="copilot-inner">
          <div class="copilot-spinner"></div>
          <p class="copilot-title">Đang tải dữ liệu...</p>
          <p id="copilotQuote" class="copilot-quote">“Khoảnh khắc tốt nhất là khoảnh khắc bạn đang có.”</p>
          <p id="copilotAttempt" class="copilot-attempt">Đang thử lại lần 1</p>
        </div>`;
      container.prepend(overlay);
    }
    return true;
  }

  function showLoader() {
    if (!ensureElements()) return;
    container.classList.add("copilot-loading");
    if (!container.dataset.prevMinH) container.dataset.prevMinH = container.style.minHeight || "";
    container.style.minHeight = Math.max(260, container.clientHeight) + "px";
    overlay.style.display = "grid";
    clearInterval(quoteTimer);
    const q = document.getElementById("copilotQuote");
    let i = 0;
    quoteTimer = setInterval(() => { if (q) q.textContent = QUOTES[(++i) % QUOTES.length]; }, 4000);
  }

  function hideLoader() {
    clearInterval(quoteTimer);
    if (!container || !overlay) return;
    overlay.style.display = "none";
    container.classList.remove("copilot-loading");
    container.style.minHeight = container.dataset.prevMinH || "";
    delete container.dataset.prevMinH;
  }

  // sleep có thể hủy bằng AbortController
  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const t = setTimeout(resolve, ms);
      if (signal) {
        if (signal.aborted) { clearTimeout(t); return reject(new DOMException('Aborted','AbortError')); }
        signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted','AbortError')); }, { once:true });
      }
    });
  }

  const _fetch = window.fetch.bind(window);

  window.fetch = function(input, init) {
    const url = typeof input === "string" ? input : (input && input.url) || "";
    if (!API_MATCH.test(url)) return _fetch(input, init);

    // Tạo phiên mới: hủy phiên cũ (last-click-wins)
    sessionId += 1;
    const mySession = sessionId;

    if (controller) controller.abort();
    controller = new AbortController();

    showLoader();

    // Tham số retry
    const started = Date.now();
    const maxMs = 30000;          // tối đa 30s
    const maxAttempts = 5;        // tối đa 5 lần
    let attempts = 0;

    // Hiển thị/Reset bộ đếm thử lại — chỉ cập nhật nếu đúng session
    const attemptEl = () => document.getElementById("copilotAttempt");
    function setAttempt(n, sid) {
      const el = attemptEl();
      if (!el) return;
      if (!overlay || overlay.dataset.session !== String(sid)) return; // chặn phiên cũ
      if (n > 0) { el.style.display = "block"; el.textContent = `Đang thử lại lần ${n}`; }
      else { el.style.display = "none"; }
    }
    setAttempt(0, mySession); // reset về ẩn khi bắt đầu phiên mới

    // Gói gọi fetch với retry/timeout và hủy
    const tryOnce = () => _fetch(input, { ...(init||{}), signal: controller.signal });

    const run = async () => {
      while (true) {
        // Nếu đã quá 30s hoặc quá 5 lần -> dừng
        if ((Date.now() - started) > maxMs || attempts >= maxAttempts) {
          throw new Error("RetryLimitExceeded");
        }

        try {
          const res = await tryOnce();
          // Nếu trong lúc chờ đã có phiên mới -> coi như hủy
          if (mySession !== sessionId) throw new DOMException('Aborted','AbortError');

          if (res.ok) return res;             // thành công
          // HTTP lỗi => chuẩn bị retry
        } catch (e) {
          // Abort do phiên mới -> ném tiếp để caller không render cũ
          if (e && e.name === 'AbortError') throw e;
          // network/HTTP lỗi -> tiếp tục retry
        }

        attempts += 1;
        setAttempt(attempts);

        // chờ 7s hoặc bị abort thì thoát sớm
        await sleep(7000, controller.signal);
      }
    };

    return run().then(res => {
      // Nếu vẫn đúng phiên hiện tại thì ẩn loader
      if (mySession === sessionId) hideLoader();
      return res;
    }).catch(err => {
      // Nếu phiên hiện tại kết thúc (limit/abort), ẩn loader nếu không có phiên mới
      if (mySession === sessionId) hideLoader();
      throw err;
    });
  };
})();
/* ===== End loader ===== */


async function checkAvailableCamerasByDate(dateStart, dateEnd, hourStart, hourEnd) {
  // Gọi API lấy tất cả booking trong khoảng ngày nhận - ngày trả
  const res = await fetch(`/api/rentals-detail?date=${dateStart.slice(0,7)}`);
  const data = await res.json();
  const bookings = data.rentals;

  // Lọc danh sách máy cho thuê theo ngày hoặc cả ngày/giờ
  // (Bạn có thể lấy danh sách máy từ API /api/cameras nếu cần)
  // Giả sử bạn đã có mảng allCameras với trường rent_time_frame

  // Lọc các máy khả dụng
  const availableCameras = allCameras.filter(cam => {
    // Chỉ kiểm tra máy cho thuê theo ngày hoặc cả ngày/giờ
    if (cam.rent_time_frame !== "date" && cam.rent_time_frame !== "date/hour") return false;
    const camBookings = allBookings.filter(b => b.camera === cam.id);
    // Nếu không có booking nào, luôn khả dụng!
    if (!camBookings.length) return true;
    // Nếu có booking, kiểm tra từng booking như cũ
    for (const b of camBookings) {
      // Nếu lịch này giao với khoảng khách muốn thuê
      if (
        !(dateEnd < b.rental_date || dateStart > b.return_date) // giao nhau về ngày
      ) {
        // Nếu là rental_type = 'date', kiểm tra giờ nhận/trả nếu là ngày đầu/cuối
        // Nếu là rental_type = 'hour', kiểm tra slot giờ giao nhau
        return false; // bị cấn lịch
      }
    }
    return true; // không bị cấn lịch nào
  });

  // Hiển thị kết quả
  // ...
}

document.addEventListener("DOMContentLoaded", function () {
  // --- Xử lý cho thuê theo ngày ---
  const dateStartInput = document.getElementById('dateStart');
  const dateEndInput = document.getElementById('dateEnd');
  const hourStartInput = document.getElementById('hourStart');
  const hourEndInput = document.getElementById('hourEnd');
  const checkBtn = document.getElementById('checkDateBtn');
  const resultDiv = document.getElementById('rentByDateResult');

  // Tự động sinh giờ trả theo chính sách
  function autoSetHourEnd() {
    const hourStart = hourStartInput.value;
    if (!hourStart) return;
    const h = parseInt(hourStart.split(':')[0], 10);
    if (h < 20) {
      hourEndInput.value = "09:00";
    } else {
      hourEndInput.value = hourStart;
    }
  }
  hourStartInput.addEventListener('change', autoSetHourEnd);
  dateStartInput.addEventListener('change', autoSetHourEnd);

  // Lấy danh sách máy từ API (có rent_time_frame)

  async function fetchAllCameras() {
    const API_BASE = "http://127.0.0.1:5583";
    const res = await fetch(`${API_BASE}/api/cameras`);
    return await res.json();
  }
  // Kiểm tra máy có bị cấn lịch không
  function isCameraAvailable(cam, bookings, dateStart, dateEnd, hourStart, hourEnd) {
    if (cam.rent_time_frame !== "date" && cam.rent_time_frame !== "date/hour") return false;
    const camBookings = bookings.filter(b => b.camera_id == cam.id);
    if (!camBookings.length) return true;
    // Chuyển về dạng Date để so sánh
    const dStart = new Date(dateStart);
    const dEnd = new Date(dateEnd);

    for (const b of camBookings) {
      const bStart = new Date(b.rental_date);
      const bEnd = new Date(b.return_date);

      // Nếu không giao ngày thì bỏ qua
      if (dEnd < bStart || dStart > bEnd) continue;

      // Nếu nằm trọn trong khoảng booking cũ => cấn
      if (dStart > bStart && dEnd < bEnd) return false;

      // Nếu là thuê ngày
      if (b.rental_type === 'date') {
        // Ngày nhận trùng ngày nhận booking cũ
        if (dateStart === b.rental_date) {
          // Nếu giờ nhận < giờ trả của booking cũ => cấn
          if (hourStart < b.end_time) return false;
        }
        // Ngày trả trùng ngày trả booking cũ
        if (dateEnd === b.return_date) {
          // Nếu giờ trả > giờ nhận của booking cũ => cấn
          if (hourEnd > b.start_time) return false;
        }
        // Nếu ngày nhận nằm sau ngày nhận booking cũ và ngày trả nằm trước ngày trả booking cũ => cấn
        if (
          (dStart > bStart && dStart < bEnd) ||
          (dEnd > bStart && dEnd < bEnd)
        ) {
          return false;
        }
        // Nếu booking cũ nằm trọn trong khoảng khách muốn thuê => cấn
        if (bStart > dStart && bEnd < dEnd) return false;
      } else {
        // Nếu là thuê theo giờ, kiểm tra từng ngày giao nhau
        // Kiểm tra ngày nhận
        if (dateStart === b.rental_date) {
          if (!(hourEnd <= b.start_time || hourStart >= b.end_time)) return false;
        }
        // Kiểm tra ngày trả
        if (dateEnd === b.rental_date) {
          if (!(hourEnd <= b.start_time || hourStart >= b.end_time)) return false;
        }
        // Nếu ngày ở giữa, luôn bị cấn
        if (
          (dStart < bStart && dEnd > bEnd) ||
          (bStart < dStart && bEnd > dEnd)
        ) {
          return false;
        }
      }
    }
    return true;
  }

  // Khi bấm kiểm tra máy khả dụng
  checkBtn.onclick = async function () {
    const dateStart = dateStartInput.value;
    const dateEnd = dateEndInput.value;
    const hourStart = hourStartInput.value;
    const hourEnd = hourEndInput.value;
    if (!dateStart || !dateEnd || !hourStart || !hourEnd) {
      resultDiv.innerHTML = "<div style='color:#d11313'>Vui lòng nhập đủ thông tin!</div>";
      return;
    }
    resultDiv.innerHTML = "";

    try {
      const [allCameras, allBookings] = await Promise.all([
        fetchAllCameras(),
        fetchAllBookingsByDateRange(dateStart, dateEnd)
      ]);
      // Lọc máy khả dụng 
      console.log("All cameras:", allCameras.map(c => c.id));
      const available = allCameras.map(cam => {
      const check = isCameraAvailableForDate(cam, allBookings, dateStart, dateEnd, hourStart, hourEnd);
      return { cam, ...check };
      }).filter(item => item.available || (item.availableFrom && item.availableFrom > hourStart));
      console.log("Available:", available.map(a => a.cam.id));

      // Luôn cập nhật lại resultDiv, không để loading mãi
      if (!available.length) {
        resultDiv.innerHTML = "<div style='color:#d11313'>Không có máy nào khả dụng cho thời gian này.</div>";
      } else {
    resultDiv.innerHTML = available.map(item => {
      if (item.available) {
        return `<div class="camera-card">
          <div class="camera-header"><span class="camera-title">${item.cam.name || item.cam.camera_name}</span></div>
          <div class="camera-slots"><span style="color:#90ee90;">🟢 Khả dụng</span></div>
        </div>`;
      } else if (item.availableFrom) {
        return `<div class="camera-card">
          <div class="camera-header"><span class="camera-title">${item.cam.name || item.cam.camera_name}</span></div>
          <div class="camera-slots"><span style="color:#90ee90;">🟢 Khả dụng từ ${item.availableFrom}</span></div>
        </div>`;
      }
      return "";
    }).join('');
      }
    } catch (e) {
      console.error(e);
      resultDiv.innerHTML = "<div style='color:#d11313'>Lỗi khi kiểm tra máy khả dụng.</div>";
    }
  };
});

async function fetchAllBookings(dateStart, dateEnd) {
  const API_BASE = "http://127.0.0.1:5583";
  // Lấy cả tháng bắt đầu và tháng kết thúc (nếu khác tháng)
  const months = [];
  let d = new Date(dateStart.slice(0, 7) + "-01");
  const endMonth = dateEnd.slice(0, 7);
  while (d.toISOString().slice(0, 7) <= endMonth) {
    months.push(d.toISOString().slice(0, 7));
    d.setMonth(d.getMonth() + 1);
  }
  let all = [];
  for (const m of months) {
    const res = await fetch(`${API_BASE}/api/rentals-detail?month=${m}`);
    const data = await res.json();
    all = all.concat(data.rentals || []);
  }
  return all;
}

async function fetchAllBookingsByDateRange(dateStart, dateEnd) {
  const API_BASE = "http://127.0.0.1:5583";
  const days = [];
  let d = new Date(dateStart);
  const dEnd = new Date(dateEnd);
  while (d <= dEnd) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  // Gọi song song tất cả ngày
  const all = await Promise.all(
    days.map(day =>
      fetch(`${API_BASE}/api/rentals-detail?date=${day}`)
        .then(res => res.json())
        .then(data => data.rentals || [])
    )
  );
  // Gộp tất cả bookings lại (có thể trùng, bạn có thể lọc unique nếu cần)
  return all.flat();
}

function getMaxEndTimeOnDate(bookings, date, cameraId) {
  // Trả về giờ kết thúc lớn nhất của các booking theo giờ trong ngày
  let maxEnd = "00:00";
  bookings.forEach(b => {
    if (b.camera_id == cameraId && b.rental_type === "hour" && b.rental_date === date) {
      if (b.end_time > maxEnd) maxEnd = b.end_time;
    }
  });
  return maxEnd;
}

function isCameraAvailableForDate(cam, bookings, dateStart, dateEnd, hourStart, hourEnd) {
  if (cam.rent_time_frame !== "date" && cam.rent_time_frame !== "date/hour") return false;
  const camBookings = bookings.filter(b => b.camera_id == cam.id);

  // 1. Kiểm tra toàn bộ khoảng ngày/giờ không bị cấn lịch nào
  const dStart = new Date(dateStart + "T" + hourStart);
  const dEnd = new Date(dateEnd + "T" + hourEnd);

  for (const b of camBookings) {
    // Nếu booking là theo ngày
    if (b.rental_type === "date") {
      const bStart = new Date(b.rental_date + "T" + (b.start_time || "00:00"));
      const bEnd = new Date(b.return_date + "T" + (b.end_time || "23:59"));
      // Nếu giao nhau
      if (!(dEnd <= bStart || dStart >= bEnd)) return { available: false };
    }
    // Nếu booking là theo giờ
    if (b.rental_type === "hour") {
      const bDate = b.rental_date;
      const bStart = new Date(bDate + "T" + b.start_time);
      const bEnd = new Date(bDate + "T" + b.end_time);
      // Nếu giao nhau
      if (!(dEnd <= bStart || dStart >= bEnd)) return { available: false };
    }
  }

  // 2. Kiểm tra ngày nhận: nếu có booking theo giờ, chỉ khả dụng từ sau giờ kết thúc cuối cùng
  let maxEnd = getMaxEndTimeOnDate(camBookings, dateStart, cam.id);
  if (hourStart < maxEnd) {
    // Nếu maxEnd < hourEnd (giờ trả), thì chỉ khả dụng từ maxEnd trở đi
    // Nhưng phải kiểm tra lại từ maxEnd đến hourEnd có bị cấn lịch không
    const newStart = maxEnd;
    const newDStart = new Date(dateStart + "T" + newStart);
    for (const b of camBookings) {
      if (b.rental_type === "date") {
        const bStart = new Date(b.rental_date + "T" + (b.start_time || "00:00"));
        const bEnd = new Date(b.return_date + "T" + (b.end_time || "23:59"));
        if (!(dEnd <= bStart || newDStart >= bEnd)) return { available: false };
      }
      if (b.rental_type === "hour") {
        const bDate = b.rental_date;
        const bStart = new Date(bDate + "T" + b.start_time);
        const bEnd = new Date(bDate + "T" + b.end_time);
        if (!(dEnd <= bStart || newDStart >= bEnd)) return { available: false };
      }
    }
    return { available: false, availableFrom: maxEnd };
  }

  return { available: true };
}


