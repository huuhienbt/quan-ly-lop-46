// ==========================================
// HIỆU ỨNG PHÁO HOA LƠ LỬNG (TÔNG XANH CHỦ ĐẠO)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('particle-container');
    if (!container) return;

    // BỘ MÀU ƯU TIÊN TÔNG XANH (Blue, Mint)
    const colors = [
        "#9ED2F6", // Xanh da trời
        "#9ED2F6", // Xanh da trời (xuất hiện nhiều hơn)
        "#B5EAD7", // Xanh mint (ngọc bích)
        "#B5EAD7", // Xanh mint (xuất hiện nhiều hơn)
        "#A2E1DB", // Xanh lục bảo nhạt
        "#C7CEEA", // Tím mộng mơ
        "#FFB7B2", // Cam san hô nhạt (giữ lại 1 ít làm điểm nhấn)
        "#FF9AA2"  // Hồng đào (giữ lại 1 ít làm điểm nhấn)
    ];

    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';

        const size = Math.random() * 8 + 10; 
        const randShape = Math.random();
        
        if (randShape < 0.6) {
            const ovalSize = size * 0.7; 
            particle.style.width = ovalSize + 'px';
            particle.style.height = ovalSize * (Math.random() * 0.5 + 1.3) + 'px'; 
            particle.style.borderRadius = '50%';
        } else if (randShape < 0.8) {
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.borderRadius = '50%';
        } else if (randShape < 0.9) {
            particle.style.width = size + 'px';
            particle.style.height = size * (Math.random() * 0.5 + 1.3) + 'px';
            particle.style.borderRadius = '4px'; 
        } else {
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.borderRadius = '4px'; 
        }

        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.border = "1.5px solid rgba(255, 255, 255, 0.7)";
        particle.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";

        particle.style.left = Math.random() * 100 + '%';

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

    setInterval(createParticle, 4000); 

    for(let i = 0; i < 3; i++) {
        setTimeout(createParticle, i * 1000);
    }
});