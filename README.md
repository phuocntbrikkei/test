# P1 – Client · Server · MySQL chạy bằng Docker Compose

Dự án mẫu gồm 3 service chạy cùng nhau bằng một file `docker-compose.yml`:

```
Trình duyệt ──► client (Nginx :8080) ──/api/*──► server (Node.js :3000) ──► db (MySQL :3306)
```

## Cấu trúc thư mục

```
p1/
├── docker-compose.yml      # Khai báo cả 3 service, mạng, volume
├── .env                    # Biến môi trường thật (KHÔNG commit)
├── .env.example            # Mẫu của .env để commit lên git
├── .gitignore
├── README.md
│
├── server/                 # Service 2: Node.js API
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── index.js        # Express app, định nghĩa các route /api/*
│       └── db.js           # Kết nối MySQL (pool) + tạo bảng lần đầu
│
└── client/                 # Service 3: giao diện web
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf          # Phục vụ file tĩnh + chuyển /api/* sang server
    └── public/
        └── index.html
```

Service `db` dùng image chính thức `mysql:8.4` nên không cần thư mục hay Dockerfile riêng.

## Ba service

### 1. `db`: SQL server (MySQL 8.4)

| Mục | Giá trị |
|---|---|
| Image | `mysql:8.4` (MySQL server chính thức) |
| Container | `p1-db` |
| Cổng | `localhost:3306` → `3306` trong container |
| Dữ liệu | Volume `p1_db_data`, vẫn còn khi xoá container |
| Tài khoản | Lấy từ `.env`: `MYSQL_USER` / `MYSQL_PASSWORD`, root: `MYSQL_ROOT_PASSWORD` |
| Database | `MYSQL_DATABASE` (mặc định `appdb`) |

- Đây là MySQL server đầy đủ. Bạn có thể kết nối từ MySQL Workbench hoặc DBeaver vào `localhost:3306`.
- Có `healthcheck`: service `server` chỉ khởi động sau khi MySQL đã sẵn sàng nhận kết nối.
- Bảng `messages` do `server` tự tạo khi khởi động (`server/src/db.js`).

### 2. `server`: API Node.js (Express)

| Mục | Giá trị |
|---|---|
| Build | `server/Dockerfile` (`node:24-alpine`) |
| Container | `p1-server` |
| Cổng | `localhost:3000` → `3000` |
| Kết nối DB | `DB_HOST=db`, tức là **tên service**, không phải `localhost` |

API:

| Method | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/health` | Kiểm tra server và kết nối MySQL |
| GET | `/api/messages` | Lấy danh sách tin nhắn |
| POST | `/api/messages` | Thêm tin nhắn, body: `{ "text": "..." }` |

### 3. `client`: giao diện web (Nginx)

| Mục | Giá trị |
|---|---|
| Build | `client/Dockerfile` (`nginx:stable-alpine`) |
| Container | `p1-client` |
| Cổng | `localhost:8080` → `80` |

- Phục vụ `client/public/index.html`.
- Mọi request `/api/*` được Nginx chuyển tới `http://server:3000`, nên trình duyệt chỉ cần gọi một địa chỉ là `localhost:8080`.

## Chạy dự án

Yêu cầu: Docker Desktop đang chạy.

```bash
# Lần đầu: tạo file .env từ mẫu, rồi sửa mật khẩu nếu cần
cp .env.example .env

# Build image và chạy cả 3 service ở chế độ nền
docker compose up -d --build
```

Mở trình duyệt:

- Client: http://localhost:8080
- API trực tiếp: http://localhost:3000/api/health
- MySQL: `localhost:3306` (user `appuser`, mật khẩu trong `.env`)

## Các lệnh Docker thường dùng

### Chạy / dừng

```bash
docker compose up -d --build        # build và chạy tất cả
docker compose up -d                # chạy lại, không build
docker compose stop                 # tạm dừng (giữ container)
docker compose start                # chạy lại container đã dừng
docker compose restart server       # khởi động lại 1 service
docker compose down                 # dừng và xoá container (GIỮ dữ liệu MySQL)
docker compose down -v              # dừng, xoá container VÀ dữ liệu MySQL
```

### Xem trạng thái và log

```bash
docker compose ps                   # trạng thái các service (cột health của db)
docker compose logs -f              # log tất cả service
docker compose logs -f server       # log của 1 service
```

### Sau khi sửa code

```bash
docker compose up -d --build server     # build lại và chạy lại server
docker compose up -d --build client     # build lại và chạy lại client
```

Code được COPY vào image lúc build, nên sửa code xong phải build lại thì mới thấy thay đổi.

### Vào bên trong container

```bash
docker compose exec db mysql -u appuser -p appdb      # MySQL CLI
docker compose exec db mysql -u root -p               # MySQL CLI bằng root
docker compose exec server sh                         # shell trong container server
docker compose exec client sh                         # shell trong container client
```

### Dọn dẹp

```bash
docker compose down --rmi local -v      # xoá container, image đã build, dữ liệu
docker image prune                      # xoá image rác không dùng
```

## Thêm service mới

1. Tạo thư mục mới, ví dụ `worker/`, kèm `Dockerfile` riêng.
2. Thêm một khối vào `docker-compose.yml`:
   ```yaml
   worker:
     build: ./worker
     depends_on:
       db:
         condition: service_healthy
   ```
3. Chạy `docker compose up -d --build worker`.

Các service gọi nhau bằng **tên service** (`db`, `server`, `client`...) vì cùng nằm trong mạng `p1_default` do Compose tự tạo.



=> client dùng vite

