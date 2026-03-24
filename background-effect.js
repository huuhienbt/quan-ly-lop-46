// ==========================================
// HIỆU ỨNG PHÁO HOA LƠ LỬNG (ĐÃ GIẢM 90% SỐ LƯỢNG & ƯU TIÊN HÌNH OVAN/TRÒN)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('particle-container');
    if (!container) return;

    const colors = ["#FFD1DC", "#FFF8DC", "#E0FFF4", "#E6E6FA"]; // Hồng, Vàng, Xanh, Tím pastel

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Kích thước gốc ngẫu nhiên từ 10px đến 18px
        const size = Math.random() * 8 + 10; 
        
        // Phân bổ tỷ lệ xuất hiện: 60% Ovan, 20% Tròn, 10% Chữ nhật, 10% Vuông
        const randShape = Math.random();
        
        if (randShape < 0.6) {
            // Hình Ovan (Bo tròn 50%, chiều cao lớn hơn chiều rộng)
            particle.style.width = size + 'px';
            particle.style.height = size * (Math.random() * 0.6 + 1.4) + 'px'; 
            particle.style.borderRadius = '50%';
        } else if (randShape < 0.8) {
            // Hình Tròn (Bo tròn 50%, rộng = cao)
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.borderRadius = '50%';
        } else if (randShape < 0.9) {
            // Hình Chữ nhật (Bo góc nhẹ 3px)
            particle.style.width = size + 'px';
            particle.style.height = size * (Math.random() * 0.5 + 1.3) + 'px';
            particle.style.borderRadius = '3px';
        } else {
            // Hình Vuông (Bo góc nhẹ 3px)
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.borderRadius = '3px';
        }

        // Chọn màu ngẫu nhiên
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        // Vị trí xuất hiện ngẫu nhiên theo chiều ngang (trải đều 100% màn hình)
        particle.style.left = Math.random() * 100 + '%';

        // Thời gian bay chậm rãi và độ trễ
        const duration = Math.random() * 4 + 6; // Bay mất 6s đến 10s
        const delay = Math.random() * 2;
        particle.style.setProperty('--duration', duration + 's');
        particle.style.setProperty('--delay', delay + 's');
        particle.style.setProperty('--rotation', (Math.random() * 360) + 'deg');

        container.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }

    // GIẢM 90% TỐC ĐỘ XUẤT HIỆN: Tạo 1 hạt mới sau mỗi 4 giây (4000ms) thay vì 0.4s như cũ
    setInterval(createParticle, 4000); 

    // Mồi sẵn 3 hạt đầu tiên khi vừa vào web để trang không bị trống quá lâu
    for(let i = 0; i < 3; i++) {
        setTimeout(createParticle, i * 1000);
    }
});