from fastapi import FastAPI, Query
from fastapi.responses import JSONResponse
import sqlite3
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta


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

from datetime import datetime, timedelta

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
def get_rentals_detail():
    conn = get_db_connection()
    rentals = conn.execute("""
        SELECT
            r.id,
            c.name as customer_name,
            c.phone as customer_phone,
            r.rental_type,
            r.rental_date,
            r.return_date,
            r.start_time,
            r.end_time
        FROM rental r
        JOIN customer c ON r.customer_id = c.id
        ORDER BY r.created_at DESC
        LIMIT 50
    """).fetchall()
    conn.close()
    result = []
    for r in rentals:
        result.append({
            "id": r["id"],
            "customer_name": r["customer_name"],
            "customer_phone": r["customer_phone"],
            "rental_type": r["rental_type"],
            "rental_date": r["rental_date"],
            "return_date": r["return_date"],
            "start_time": r["start_time"],
            "end_time": r["end_time"]
        })
    return JSONResponse(result)
