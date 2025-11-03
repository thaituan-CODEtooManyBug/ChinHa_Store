# import sqlite3

# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()

# # Bảng CUSTOMER
# cur.execute('''
# CREATE TABLE IF NOT EXISTS customer (
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     name TEXT NOT NULL,
#     phone TEXT NOT NULL UNIQUE,
#     email TEXT,
#     address TEXT,
#     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
# )
# ''')

# # Bảng CAMERA
# cur.execute('''
# CREATE TABLE IF NOT EXISTS camera (
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     name TEXT NOT NULL UNIQUE,
#     model TEXT,
#     serial TEXT UNIQUE,
#     status TEXT DEFAULT 'active',
#     note TEXT,
#     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
# )
# ''')

# # Bảng RENTAL
# cur.execute('''
# CREATE TABLE IF NOT EXISTS rental (
#     id INTEGER PRIMARY KEY AUTOINCREMENT,
#     customer_id INTEGER,
#     camera_id INTEGER,
#     rental_type TEXT,
#     rental_date DATE,
#     start_time TIME,
#     end_time TIME,
#     return_date DATE,
#     actual_return DATETIME,
#     status TEXT,
#     note TEXT,
#     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
#     FOREIGN KEY(customer_id) REFERENCES customer(id),
#     FOREIGN KEY(camera_id) REFERENCES camera(id)
# )
# ''')

# conn.commit()
# conn.close()
# print("Database and tables created successfully!")

# # Thêm khách hàng mẫu
# import sqlite3

# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()

# # Cho thuê theo giờ
# cur.execute('''INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, return_date, status, note)
#     VALUES (1, 1, 'hour', '2025-11-10', '07:00', '13:00', '2025-11-10', 'booked', 'Booking slot đầu ngày')''')
# cur.execute('''INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, return_date, status, note)
#     VALUES (2, 1, 'hour', '2025-11-10', '15:00', '21:00', '2025-11-10', 'booked', 'Booking slot cuối ngày')''')

# # Cho thuê nhiều ngày (lấy trước 20h, trả trước 9h)
# cur.execute('''INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, return_date, status, note)
#     VALUES (2, 2, 'date', '2025-11-12', '18:00', '09:00', '2025-11-15', 'booked', 'Thuê nhiều ngày, lấy trước 20h')''')

# # Cho thuê nhiều ngày (lấy sau 20h, trả đúng giờ)
# cur.execute('''INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, return_date, status, note)
#     VALUES (3, 2, 'date', '2025-11-16', '21:00', '21:00', '2025-11-19', 'booked', 'Thuê nhiều ngày, lấy sau 20h')''')

# # Cho thuê giao giờ lẻ, trả trước xh30
# cur.execute('''INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, return_date, status, note)
#     VALUES (4, 3, 'date', '2025-11-20', '19:00', '12:00', '2025-11-23', 'booked', 'Trả trước 12h30')''')

# # Cho thuê giao giờ lẻ, trả sau xh30
# cur.execute('''INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, return_date, status, note)
#     VALUES (5, 3, 'date', '2025-11-24', '19:00', '15:00', '2025-11-27', 'booked', 'Trả sau 14h30')''')

# conn.commit()
# conn.close()
# print("Sample data inserted!")

# import sqlite3

# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()

# print("=== CUSTOMER ===")
# for row in cur.execute("SELECT * FROM customer"):
#     print(row)

# print("\n=== CAMERA ===")
# for row in cur.execute("SELECT * FROM camera"):
#     print(row)

# print("\n=== RENTAL ===")
# for row in cur.execute("SELECT * FROM rental"):
#     print(row)

# conn.close()

#--------------Lệnh updtae-------------
# import sqlite3

# cameras = [
#     (1, "2025-11-02 08:25:29"),
#     (2, "2025-11-02 08:25:29"),
#     (3, "2025-11-02 08:25:29"),
#     (4, "2025-11-02 08:25:29"),
#     (5, "2025-11-02 08:25:29"),
#     (6, "2025-11-02 08:25:29"),
#     (7, "2025-11-02 08:25:29"),
# ]

# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()
# for cam_id, created_at in cameras:
#     cur.execute("""
#         UPDATE camera SET created_at = ? WHERE id = ?
#     """, (created_at, cam_id))
# conn.commit()
# conn.close()
# print("Cameras updated!")
# import sqlite3

# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()

# # Lấy id khách và máy (ví dụ Canon G7x Mark II)
# cur.execute("SELECT id FROM customer LIMIT 1")
# customer_id = cur.fetchone()[0]
# cur.execute("SELECT id FROM camera WHERE name = ?", ("Canon G7x Mark II",))
# camera_id = cur.fetchone()[0]

# # Thêm booking mẫu: Canon G7x Mark II, 09:00-15:00, ngày 2025-11-03
# cur.execute('''
#     INSERT INTO rental (customer_id, camera_id, rental_type, rental_date, start_time, end_time, status, note)
#     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
# ''', (customer_id, camera_id, "hour", "2025-11-03", "09:00", "15:00", "booked", "Sample booking 3/11/2025"))

# conn.commit()
# conn.close()
# print("Sample booking for 03/11/2025 added!")

# import sqlite3

# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()
# for row in cur.execute("SELECT id, name, model FROM camera"):
#     print(row)
# conn.close()



# #xóa sạch data bảng rental
# import sqlite3
# conn = sqlite3.connect('chinha_store.db')
# cur = conn.cursor()
# cur.execute("DELETE FROM rental")
# conn.commit()
# conn.close()
# print("Đã xóa sạch toàn bộ dữ liệu trong bảng rental!")
import sqlite3

conn = sqlite3.connect('chinha_store.db')
cur = conn.cursor()

# Thêm khách hàng mẫu cho ID 2, 3, 4, 5
customers = [
    (2, "Nguyễn Văn B", "0901234562", "b@gmail.com", "Hà Nội"),
    (3, "Trần Thị C", "0901234563", "c@gmail.com", "Đà Nẵng"),
    (4, "Phạm Văn D", "0901234564", "d@gmail.com", "Cần Thơ"),
    (5, "Lê Thị E", "0901234565", "e@gmail.com", "Hải Phòng"),
]

for cid, name, phone, email, address in customers:
    cur.execute("""
        INSERT OR IGNORE INTO customer (id, name, phone, email, address)
        VALUES (?, ?, ?, ?, ?)
    """, (cid, name, phone, email, address))

conn.commit()
conn.close()
print("Đã thêm khách hàng mẫu cho ID 2, 3, 4, 5!")