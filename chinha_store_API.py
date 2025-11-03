from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import calendar


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # hoặc chỉ định ["http://127.0.0.1:5500"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    conn = sqlite3.connect('chinha_store.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/api/bookings")
def bookings_by_date(date: str = Query(...)):
    conn = get_db_connection()
    cameras = conn.execute("SELECT id, name, model FROM camera").fetchall()
    bookings = conn.execute("""
        SELECT camera_id, start_time, end_time, rental_type, rental_date, return_date
        FROM rental
        WHERE (
            (rental_type = 'date' AND ? BETWEEN rental_date AND return_date)
            OR (rental_type = 'hour' AND rental_date = ?)
        )
    """, (date, date)).fetchall()
    print("bookings:", bookings)
    conn.close()

    booking_dict = {}
    for b in bookings:
        cam_id = b['camera_id']
        if b['rental_type'] == 'date':

            if date == b['rental_date']:
                # Ngày bắt đầu: chỉ block slot giao với [start_time, 23:59]
                booking_dict.setdefault(cam_id, []).append({'type': 'start', 'start_time': b['start_time']})
            elif date == b['return_date']:
                # Ngày kết thúc: chỉ block slot giao với [00:00, end_time]
                booking_dict.setdefault(cam_id, []).append({'type': 'end', 'end_time': b['end_time']})
            else:
                # Ngày ở giữa: block toàn bộ ngày
                booking_dict[cam_id] = ['ALL_DAY']
        else:
            slot = f"{b['start_time']}-{b['end_time']}"
            if booking_dict.get(cam_id) != ['ALL_DAY']:
                booking_dict.setdefault(cam_id, []).append(slot)

    result = []
    for cam in cameras:
        result.append({
            "camera_id": cam["id"],
            "camera_name": cam["name"],
            "model": cam["model"],
            "booked_slots": booking_dict.get(cam["id"], [])
        })
    return JSONResponse(result)

@app.get("/api/cameras")
def get_cameras():
    conn = get_db_connection()
    cameras = conn.execute("SELECT id, name, model, status FROM camera").fetchall()
    conn.close()
    result = []
    for cam in cameras:
        result.append({
            "id": cam["id"],
            "name": cam["name"],
            "model": cam["model"],
            "status": cam["status"]
        })
    return JSONResponse(result)

@app.get("/api/rental-stats")
def get_rental_stats():
    conn = get_db_connection()
    total_rentals = conn.execute("SELECT COUNT(*) FROM rental").fetchone()[0]
    active_rentals = conn.execute("SELECT COUNT(*) FROM rental WHERE status = 'active'").fetchone()[0]
    conn.close()
    return JSONResponse({
        "total_rentals": total_rentals,
        "active_rentals": active_rentals
    })

@app.get("/api/rentals-detail")
def get_rentals_detail(date: str = Query(None), month: str = Query(None)):
    conn = get_db_connection()
    # 1. Trả về danh sách booking chi tiết cho table
    sql = """
        SELECT
            r.id,
            c.name as customer_name,
            c.phone as customer_phone,
            cam.name as camera_name,
            r.camera_id,
            r.rental_type,
            r.rental_date,
            r.return_date,
            r.start_time,
            r.end_time
        FROM rental r
        JOIN customer c ON r.customer_id = c.id
        JOIN camera cam ON r.camera_id = cam.id
    """
    params = []
    if date:
        sql += " WHERE (? BETWEEN r.rental_date AND r.return_date)"
        params = [date]
    sql += " ORDER BY r.created_at DESC LIMIT 50"
    rentals = conn.execute(sql, params).fetchall()
    rental_list = []
    for r in rentals:
        rental_list.append({
            "id": r["id"],
            "customer_name": r["customer_name"],
            "customer_phone": r["customer_phone"],
            "camera_name": r["camera_name"],
            "camera_id": r["camera_id"],
            "rental_type": r["rental_type"],
            "rental_date": r["rental_date"],
            "return_date": r["return_date"],
            "start_time": r["start_time"],
            "end_time": r["end_time"]
        })

    # 2. Trả về dot cho lịch nếu có month
    dots = {}
    if month or date:
        # Nếu có month thì lấy dot cho cả tháng, nếu chỉ có date thì lấy dot cho ngày đó
        if month:
            year, mon = map(int, month.split('-'))
            last_day = calendar.monthrange(year, mon)[1]
            start = f"{month}-01"
            end = f"{month}-{last_day:02d}"
        elif date:
            start = end = date
        bookings = conn.execute("""
            SELECT rental_date, return_date, camera_id
            FROM rental
            WHERE (rental_date <= ?) AND (return_date >= ?)
        """, (end, start)).fetchall()
        month_start = datetime.strptime(start, "%Y-%m-%d")
        month_end = datetime.strptime(end, "%Y-%m-%d")
        for b in bookings:
            try:
                d1 = datetime.strptime(b['rental_date'], "%Y-%m-%d")
                d2 = datetime.strptime(b['return_date'], "%Y-%m-%d") if b['return_date'] else d1
            except Exception as e:
                continue
            d1 = d1.replace(hour=0, minute=0, second=0, microsecond=0)
            d2 = d2.replace(hour=0, minute=0, second=0, microsecond=0)
            day = max(d1, month_start)
            last = min(d2, month_end)
            while day <= last:
                key = day.strftime("%Y-%m-%d")
                if key not in dots:
                    dots[key] = []
                dots[key].append(int(b['camera_id']))
                day += timedelta(days=1)
        for k in dots:
            dots[k] = list(dots[k])
    conn.close()
    return JSONResponse({"rentals": rental_list, "dots": dots})


@app.get("/api/customers")
def get_customers():
    conn = get_db_connection()
    customers = conn.execute("""
        SELECT id, name, phone, email, address
        FROM customer
        ORDER BY created_at DESC
    """).fetchall()
    conn.close()
    result = []
    for c in customers:
        result.append({
            "id": c["id"],
            "name": c["name"],
            "phone": c["phone"],
            "email": c["email"],
            "address": c["address"]
        })
    return JSONResponse(result)

# @app.get("/api/calendar-bookings")
# def calendar_bookings(month: str = Query(...)):
#     conn = get_db_connection()
#     year, mon = map(int, month.split('-'))
#     last_day = calendar.monthrange(year, mon)[1]
#     start = f"{month}-01"
#     end = f"{month}-{last_day:02d}"
#     bookings = conn.execute("""
#         SELECT rental_date, return_date, camera_id
#         FROM rental
#         WHERE (rental_date <= ?) AND (return_date >= ?)
#     """, (end, start)).fetchall()
#     conn.close()
#     dots = {}
#     month_start = datetime.strptime(start, "%Y-%m-%d")
#     month_end = datetime.strptime(end, "%Y-%m-%d")
#     for b in bookings:
#         try:
#             d1 = datetime.strptime(b['rental_date'], "%Y-%m-%d")
#             d2 = datetime.strptime(b['return_date'], "%Y-%m-%d") if b['return_date'] else d1
#         except Exception as e:
#             print("Lỗi chuyển đổi ngày:", b['rental_date'], b['return_date'], e)
#             continue
#         # Chỉ duyệt từ max(d1, month_start) đến min(d2, month_end)
#         day = max(d1, month_start)
#         last = min(d2, month_end)
#         while day <= last:
#             dots.setdefault(day.strftime("%Y-%m-%d"), set()).add(b['camera_id'])
#             day += timedelta(days=1)
#     # Chuyển set về list để trả về JSON
#     for k in dots:
#         dots[k] = list(dots[k])
#     return JSONResponse(dots)