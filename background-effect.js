// ==========================================
// HIỆU ỨNG PHÁO HOA LƠ LỬNG (ĐÃ NÂNG TÔNG MÀU & THÊM VIỀN SÁNG ĐỂ NỔI BẬT)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('particle-container');
    if (!container) return;

    // Bộ màu Pastel được tăng độ đậm và thêm nhiều màu sắc hơn
    const colors = [
        "#FF9AA2", // Hồng đào
        "#FFB7B2", // Cam san hô nhạt
        "#FFDAC1", // Vàng cam sữa
        "#E2F0CB", // Xanh lá mạ
        "#B5EAD7", // Xanh mint (ngọc bích)
        "#C7CEEA", // Tím mộng mơ
        "#9ED2F6"  // Xanh da trời
    ];

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Kích thước gốc ngẫu nhiên từ 10px đến 18px
        const size = Math.random() * 8 + 10; 
        
        // Phân bổ tỷ lệ: 60% Ovan, 20% Tròn, 10% Chữ nhật, 10% Vuông
        const randShape = Math.random();
        
        if (randShape < 0.6) {
            particle.style.width = size + 'px';
            particle.style.height = size * (Math.random() * 0.6 + 1.4) + 'px'; 
            particle.style.borderRadius = '50%';
        } else if (randShape < 0.8) {
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.borderRadius = '50%';
        } else if (randShape < 0.9) {
            particle.style.width = size + 'px';
            particle.style.height = size * (Math.random() * 0.5 + 1.3) + 'px';
            particle.style.borderRadius = '4px'; // Bo góc nhẹ cho hình chữ nhật
        } else {
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.borderRadius = '4px'; // Bo góc nhẹ cho hình vuông
        }

        // Chọn màu đậm hơn
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        // THÊM HIỆU ỨNG ĐỂ TÁCH KHỎI NỀN: Viền trắng mờ và bóng đổ nhẹ
        particle.style.border = "1.5px solid rgba(255, 255, 255, 0.7)";
        particle.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";

        // Vị trí xuất hiện ngẫu nhiên
        particle.style.left = Math.random() * 100 + '%';

        // Thời gian bay
        const duration = Math.random() * 4 + 6; 
        const delay = Math.random() * 2;
        particle.style.setProperty('--duration', duration + 's');
        particle.style.setProperty('--delay', delay + 's');
        particle.style.setProperty('--rotation', (Math.random() * 360) + 'deg');

        container.appendChild(particle);

        particle.addEventListener('animationend', () => {
            particle.remove();
        });
    }

    // Tốc độ xuất hiện
    setInterval(createParticle, 4000); 

    // Mồi sẵn 3 hạt đầu tiên
    for(let i = 0; i < 3; i++) {
        setTimeout(createParticle, i * 1000);
    }
});