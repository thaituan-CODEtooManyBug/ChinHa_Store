document.addEventListener("DOMContentLoaded", function () {
    // Lấy danh sách máy ảnh
    fetch("http://localhost:5583/api/cameras")
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById("cameraList");
            tbody.innerHTML = "";
            data.forEach(cam => {
                tbody.innerHTML += `
                    <tr>
                        <td>${cam.id}</td>
                        <td>${cam.name}</td>
                        <td>${cam.model || ""}</td>
                        <td>${cam.status || ""}</td>
                        <td>
                            <button class="btn btn-sm btn-warning">Sửa</button>
                            <button class="btn btn-sm btn-danger">Xóa</button>
                        </td>
                    </tr>
                `;
            });
        });

    // Lấy thống kê cho thuê
    fetch("http://localhost:5583/api/rental-stats")
        .then(res => res.json())
        .then(stats => {
            document.getElementById("statsContent").innerText =
                `Tổng số lượt thuê: ${stats.total_rentals}\n
                Máy đang cho thuê: ${stats.active_rentals}`;
        })
        .catch(() => {
            document.getElementById("statsContent").innerText = "Không thể tải thống kê.";
        });

    // Lấy thống kê chi tiết cho thuê
    fetch("http://localhost:5583/api/rentals-detail")
        .then(res => res.json())
        .then(list => {
            const statsTbody = document.getElementById("statsContent");
            if (!list.length) {
                statsTbody.innerHTML = `<tr><td colspan="7">Không có dữ liệu.</td></tr>`;
                return;
            }
            statsTbody.innerHTML = "";
            list.forEach(r => {
                statsTbody.innerHTML += `
                    <tr>
                        <td>${r.customer_name}</td>
                        <td>${r.customer_phone}</td>
                        <td>${r.camera_name}</td>
                        <td>${r.rental_type === 'date' ? 'Ngày' : 'Giờ'}</td>
                        <td>${r.rental_date || ""}</td>
                        <td>${r.return_date || ""}</td>
                        <td>${r.start_time || ""}</td>
                        <td>${r.end_time || ""}</td>
                    </tr>
                `;
            });
        })
        .catch(() => {
            document.getElementById("statsContent").innerHTML = `<tr><td colspan="7">Không thể tải thống kê.</td></tr>`;
        });

    const cameraColors = [
        "#4caf50", "#2196f3", "#e91e63", "#ffeb3b",
        "#9c27b0", "#ff9800", "#795548", "#00bcd4"
    ];

    function getCameraColor(camId) {
        const idx = Number(camId) - 1;
        return cameraColors[(idx >= 0 && idx < cameraColors.length) ? idx : (cameraColors.length - 1)];
    }

    function loadDailyStats(dateStr) {
        const tbody = document.getElementById("dailyStatsContent");
        tbody.innerHTML = `<tr><td colspan="3">Đang tải...</td></tr>`;
        fetch(`http://localhost:5583/api/bookings?date=${dateStr}`)
            .then(res => res.json())
            .then(data => {
                if (!data.length) {
                    tbody.innerHTML = `<tr><td colspan="3">Không có dữ liệu cho ngày này.</td></tr>`;
                    return;
                }
                tbody.innerHTML = "";
                data.forEach(cam => {
                    let slots = "";
                    if (!cam.booked_slots || cam.booked_slots.length === 0) {
                        slots = "<span class='text-success'>Còn trống</span>";
                    } else if (cam.booked_slots.includes('ALL_DAY')) {
                        slots = "<span class='text-danger'>Đã kín cả ngày</span>";
                    } else {
                        slots = cam.booked_slots.map(slot => {
                            if (typeof slot === "string") return slot;
                            if (slot.type === "start") return `Từ ${slot.start_time}`;
                            if (slot.type === "end") return `Đến ${slot.end_time}`;
                            return JSON.stringify(slot);
                        }).join(", ");
                    }
                    tbody.innerHTML += `
                        <tr>
                            <td>${cam.camera_name}</td>
                            <td>${cam.model || ""}</td>
                            <td>${slots}</td>
                        </tr>
                    `;
                });
            })
            .catch(() => {
                tbody.innerHTML = `<tr><td colspan="3">Không thể tải dữ liệu.</td></tr>`;
            });
    }

    // Set default date to today
    const dateInput = document.getElementById("statDate");
    if (dateInput) {
        const today = new Date();
        dateInput.value = today.toISOString().slice(0, 10);
    }

    // Sự kiện nút xem
    document.getElementById("loadDailyStats").addEventListener("click", function () {
        const dateStr = document.getElementById("statDate").value;
        if (dateStr) loadDailyStats(dateStr);
    });

    // Tự động load khi vào trang
    const dateStr = document.getElementById("statDate")?.value;
    if (dateStr) loadDailyStats(dateStr);
});