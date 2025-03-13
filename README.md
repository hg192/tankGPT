# Tank Battle 3D

Một web game 3D về xe tăng với hai chế độ chơi: 5v5 đặt bom và battle ground 20 người chơi.

## Tính năng

- Đồ họa 3D sử dụng Three.js
- Chế độ chơi nhiều người thời gian thực sử dụng Socket.IO
- Hai chế độ chơi:
  - 5v5 Bomb Mode: Hai đội đối đầu, mỗi đội 5 người chơi
  - 20 Player Battle Ground: Tất cả người chơi chiến đấu với nhau

## Yêu cầu hệ thống

- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

## Cài đặt

1. Clone repository:
```bash
git clone https://github.com/yourusername/tank-battle-3d.git
cd tank-battle-3d
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Chạy server:
```bash
npm start
```

4. Mở trình duyệt và truy cập:
```
http://localhost:3000
```

## Điều khiển

- Mũi tên: Di chuyển xe tăng
- Space: Bắn
- ESC: Thoát game

## Cấu trúc dự án

```
tank-battle-3d/
├── index.html
├── js/
│   ├── main.js
│   ├── map.js
│   ├── tank.js
│   ├── bullet.js
│   └── explosion.js
├── assets/
│   ├── models/
│   ├── textures/
│   └── sounds/
└── package.json
```

## Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng tạo một pull request hoặc mở một issue để thảo luận về các thay đổi.

## Giấy phép

MIT License
