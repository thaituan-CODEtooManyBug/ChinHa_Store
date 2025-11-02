// Các khung 6 tiếng hợp lệ từ 07:00 đến 17:00
const valid6hSlots = [];
for (let h = 7; h <= 17; h++) {
  const start = `${String(h).padStart(2, '0')}:00`;
  const end = `${String(h + 6).padStart(2, '0')}:00`;
  valid6hSlots.push({ start, end });
}
const buffer = 1; // 1 tiếng buffer

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
  // Đưa về dạng [{camera, slots: [...] }]
  return data.map(cam => ({
    camera: cam.camera_name,
    slots: cam.booked_slots
  }));
}

// Hiển thị modal: danh sách máy, slot đã thuê và slot còn trống
async function showDayDetail(date) {
  const container = document.getElementById("bookingSections");
  container.style.display = "block"; // Hiện lên khi có dữ liệu
  container.innerHTML = `<h5>Lịch thuê ngày ${date.split('-').reverse().join('/')}</h5>`;
  const bookings = await getBookingsByDate(date);

  let html = '';
  bookings.forEach(({camera, slots}, idx) => {
    let slotHtml = '';
    if (slots.length === 1 && slots[0] === 'ALL_DAY') {
      // Máy này bị block toàn bộ ngày
      slotHtml = `<div class="slot booked"><span style="color:#d11313;">🔴 Không còn giờ trống cho ngày ${date.split('-').reverse().join('/')}</span></div>`;
    } else {
      // Chỉ hiển thị slot còn trống
      const availableSlots = valid6hSlots.filter(slot => !slots.some(booked => isConflictWithBuffer(slot, booked)));
      if (availableSlots.length > 0) {
        slotHtml += availableSlots.map(s => `<div class="slot available"><span>🟢</span> ${s.start}–${s.end} <button class="book-btn">Đặt ngay</button></div>`).join('');
      } else {
        slotHtml = `<div class="slot booked"><span style="color:#d11313;">🔴 Không còn giờ trống cho ngày ${date.split('-').reverse().join('/')}</span></div>`;
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

  // Thêm sự kiện toggle cho accordion
  document.querySelectorAll('.accordion-toggle').forEach(header => {
    header.onclick = function() {
      const target = document.getElementById(this.getAttribute('data-target'));
      const arrow = this.querySelector('.accordion-arrow');
      if (target.classList.contains('open')) {
        target.classList.remove('open');
        arrow.innerHTML = "◀";
      } else {
        target.classList.add('open');
        arrow.innerHTML = "▼";
      }
    };
  });
}

document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");
  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth",
    locale: "vi",
    height: "auto",
    selectable: true,
    eventTimeFormat: false,
    eventDisplay: 'block',
    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: ""
    },
    // Không cần events từ mockBookings nữa
    dateClick: function (info) {
      showDayDetail(info.dateStr);
    }
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