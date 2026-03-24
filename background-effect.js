// ==========================================
// HIỆU ỨNG PHÁO HOA HÌNH HỌC LƠ LỬNG BAY LÊN (PASTEL CONFETTI)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('particle-container');
    if (!container) return; // Nếu không tìm thấy container thì thoát

    const colors = ["#FFD1DC", "#FFF8DC", "#E0FFF4", "#E6E6FA"]; // Bộ màu Pastel: Hồng, Vàng, Xanh, Tím

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Thiết lập kích thước và hình dạng ngẫu nhiên (Vuông hoặc Chữ nhật)
        const size = Math.random() * 7 + 8; // Kích thước từ 8px đến 15px
        particle.style.width = size + 'px';
        const isRectangle = Math.random() > 0.5; // 50% là chữ nhật
        particle.style.height = (isRectangle ? size * (Math.random() * 0.4 + 1.2) : size) + 'px';

        // Thiết lập màu nền Pastel ngẫu nhiên từ bộ màu
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Thiết lập vị trí bắt đầu ngẫu nhiên theo chiều ngang (0% - 100%)
        particle.style.left = Math.random() * 100 + '%';

        // Thiết lập thời gian bay và độ trễ ngẫu nhiên cho animation
        const duration = Math.random() * 3 + 4; // Thời gian bay từ 4s đến 7s
        const delay = Math.random() * 5; // Độ trễ từ 0s đến 5s
        particle.style.setProperty('--duration', duration + 's');
        particle.style.setProperty('--delay', delay + 's');
        particle.style.setProperty('--rotation', (Math.random() * 360) + 'deg');

        // Thêm hạt vào container
        container.appendChild(particle);

        // Xóa hạt khi animation kết thúc để tránh làm nặng trình duyệt
        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }

    // Tạo hạt mới sau mỗi khoảng thời gian (càng nhỏ càng nhiều hạt)
    setInterval(createParticle, 400); // Tạo hạt mới mỗi 400ms
});
