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