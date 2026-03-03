// --- BỘ ĐỊNH TUYẾN (ROUTER) CHIA LINK TRANG ---
window.onpopstate = () => handleRoute();

function handleRoute() {
    const path = window.location.pathname;
    if (currentUser && currentUser.role === 'admin' && (path === '/' || path === '/index.html')) {
        renderDashboardAdmin(true);
        return;
    }
    if (path === '/hoc-tap') moGocHocTap(true);
    else if (path === '/vong-quay') moVongQuay(true);
    else if (path === '/hop-thu') moXinPhep(true);
    else if (path === '/loi-muon-noi') moHopThuBiMat(true);
    else moThongBao(true); // Default là Bảng tin
}

// ==========================================
// 🎡 TÍNH NĂNG VÒNG QUAY MAY MẮN (Chống Ẩn danh)
// ==========================================
const PRIZES = [
    { text: "+10 Điểm", color: "#34d399", netScore: 10, extraSpin: 0, msg: "Chúc mừng! Con được cộng ngay 10 điểm vào Bảng Vàng.", icon: "🎉" },
    { text: "Thêm Lượt", color: "#60a5fa", netScore: 0, extraSpin: 1, msg: "Tuyệt vời! Con được tặng thêm 1 lượt quay nữa.", icon: "🎁" },
    { text: "-10 Điểm", color: "#f87171", netScore: -10, extraSpin: 0, msg: "Ối! Con bị trừ 10 điểm vào Bảng Vàng mất rồi.", icon: "📉" },
    { text: "May Mắn", color: "#fbbf24", netScore: 0, extraSpin: 0, msg: "Thật tiếc, con quay trúng ô mất lượt. Cố gắng ở lượt quay sau nhé!", icon: "🍀" }
];

let isSpinning = false;

async function moVongQuay(fromRouter = false) {
    if(!currentUser) return showLogin(); 
    closeMenu(); 
    if(!fromRouter) window.history.pushState({}, "", "/vong-quay");
    
    let todayStr = new Date().toLocaleDateString('vi-VN');
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
    if (spinLog.date !== todayStr) { spinLog = { date: todayStr, extra: 0, usedFree: false }; }
    
    let btnStyle = "from-slate-400 to-slate-500 opacity-50 pointer-events-none";

    let slicesHtml = PRIZES.map((p, i) => {
        return `<div class="absolute inset-0 flex justify-center" style="transform: rotate(${i * 90}deg);"><div class="pt-6 font-black text-white text-sm sm:text-base drop-shadow-md w-20 text-center leading-tight z-20" style="transform: rotate(0deg);">${p.text}</div></div>`;
    }).join('');
    let gradColors = PRIZES.map((p, i) => `${p.color} ${i*90}deg ${(i+1)*90}deg`).join(', ');

    contentArea.innerHTML = `
        ${getNavHtml('vongquay')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in">
            <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase text-yellow-500">Vòng Quay May Mắn</h2>
            <p class="text-slate-500 font-bold mb-6 text-sm">Điểm Bảng Vàng của con: <span id="vqCurrentScore" class="text-indigo-600 font-black text-lg">${currentUser.score || 0} điểm</span></p>
            <div class="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-8">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-5xl text-yellow-500 drop-shadow-xl z-30 animate-bounce"><i class="fas fa-caret-down"></i></div>
                <div id="wheel" class="w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl relative overflow-hidden" style="background: conic-gradient(from -45deg, ${gradColors}); transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);">
                    ${slicesHtml}
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-30 shadow-inner flex items-center justify-center text-xl">🎡</div>
                </div>
            </div>
            <button id="btnSpin" onclick="thucHienQuay()" class="bg-gradient-to-r text-white px-10 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition ${btnStyle}">
                <i class="fas fa-spinner fa-spin mr-2"></i> ĐANG KẾT NỐI...
            </button>
        </div>
    `;

    if(Data.log.length === 0) { try { Data.log = await (await fetch(API_URL+"?type=history_all&t="+Date.now())).json(); } catch(e){} }
    
    let hasSpunTodayOnServer = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === "LuckySpin" && String(l.group).includes(todayStr));
    if (hasSpunTodayOnServer) { spinLog.usedFree = true; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); }
    
    let btnUpdate = document.getElementById('btnSpin');
    if (btnUpdate) {
        let canSpin = !spinLog.usedFree || spinLog.extra > 0;
        btnUpdate.innerHTML = canSpin ? (spinLog.usedFree ? `QUAY (+${spinLog.extra} LƯỢT)` : "QUAY MIỄN PHÍ") : "ĐÃ HẾT LƯỢT HÔM NAY";
        btnUpdate.className = canSpin ? "bg-gradient-to-r text-white px-10 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition from-yellow-400 to-orange-500 hover:scale-[1.02]" : "bg-gradient-to-r text-white px-10 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition from-slate-400 to-slate-500 opacity-50 pointer-events-none";
    }
}

async function thucHienQuay() {
    if(isSpinning) return;
    let todayStr = new Date().toLocaleDateString('vi-VN');
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
    if (spinLog.date !== todayStr) spinLog = { date: todayStr, extra: 0, usedFree: false };
    if (spinLog.usedFree && spinLog.extra <= 0) return alert("Con đã hết lượt quay!");

    isSpinning = true;
    let btn = document.getElementById('btnSpin'); btn.classList.add('opacity-50', 'pointer-events-none');
    if (!spinLog.usedFree) { spinLog.usedFree = true; } else { spinLog.extra -= 1; }
    localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog));

    let rand = Math.random() * 100; let idx = 0;
    if (rand < 15) idx = 0; else if (rand < 50) idx = 1; else if (rand < 65) idx = 2; else idx = 3;                           

    let prize = PRIZES[idx];
    let wheel = document.getElementById('wheel'); let currentRot = parseFloat(wheel.getAttribute('data-rot') || 0);
    let nextRot = currentRot + (360 * 5) + (360 - (currentRot % 360)) - (idx * 90); 
    wheel.style.transform = `rotate(${nextRot}deg)`; wheel.setAttribute('data-rot', nextRot);
    
    setTimeout(async () => {
        isSpinning = false;
        if (prize.extraSpin > 0) { spinLog.extra += prize.extraSpin; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); }
        showPrizeModal(prize);
        
        let uniqueGroup = "Vòng quay ngày " + todayStr + " (" + Date.now() + ")";
        if (prize.netScore !== 0) { currentUser.score = Number(currentUser.score) + prize.netScore; document.getElementById('vqCurrentScore').innerText = currentUser.score + " điểm"; }

        try {
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score_earned: prize.netScore, details: "Quay trúng: " + prize.text } }) });
            Data.log.push({ id: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score: prize.netScore, time: new Date().toISOString() });
        } catch(e) {}
        
        if (prize.netScore > 0 || prize.extraSpin > 0) {
            var duration = 3 * 1000; var animationEnd = Date.now() + duration; var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; 
            var interval = setInterval(function() { var timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) return clearInterval(interval); var particleCount = 50 * (timeLeft / duration); confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }); }, 250);
        }

        let canSpinNow = !spinLog.usedFree || spinLog.extra > 0;
        if (canSpinNow) { btn.classList.remove('opacity-50', 'pointer-events-none'); btn.innerText = spinLog.usedFree ? `QUAY (+${spinLog.extra} LƯỢT)` : "QUAY MIỄN PHÍ"; } 
        else { btn.innerText = "ĐÃ HẾT LƯỢT HÔM NAY"; btn.className = "w-full px-10 py-4 rounded-2xl font-black shadow-lg text-xl transition bg-gradient-to-r from-slate-400 to-slate-500 opacity-50 pointer-events-none text-white"; }
    }, 4000);
}

function showPrizeModal(prize) {
    let overlay = document.createElement('div'); overlay.id = "prizeModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `<div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 animate-[cascadeDrop_0.5s_ease-out_forwards]" style="border-color: ${prize.color}"><div class="text-7xl mb-4 animate-bounce">${prize.icon}</div><h3 class="text-2xl font-black text-slate-800 mb-2">${prize.text}</h3><p class="text-slate-600 font-bold mb-6">${prize.msg}</p><button onclick="document.getElementById('prizeModal').remove()" class="w-full text-white py-3 rounded-xl font-black shadow-md transition hover:opacity-80" style="background-color: ${prize.color}">ĐÓNG</button></div>`;
    document.body.appendChild(overlay);
}

function moHopThuBiMat(fromRouter = false) {
    if(!currentUser) return showLogin(); closeMenu();
    if(!fromRouter) window.history.pushState({}, "", "/loi-muon-noi");
    contentArea.innerHTML = `
        ${getNavHtml('thubimat')}
        <div class="bg-[#fff0f5] p-6 rounded-[2rem] shadow-sm border-2 border-pink-200 space-y-5 fade-in relative overflow-hidden">
            <p class="text-slate-600 font-bold text-sm relative z-10 leading-relaxed">Thầy Hiển luôn ở đây để lắng nghe con.</p>
            <textarea id="mailContent" class="w-full bg-white border-2 border-pink-200 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-pink-400 transition min-h-[150px] relative z-10" placeholder="Viết điều con muốn nói vào đây..."></textarea>
            <label class="flex items-center gap-3 cursor-pointer relative z-10 bg-white p-3 rounded-xl border border-pink-100"><input type="checkbox" id="mailAnon" class="w-5 h-5 accent-pink-500 cursor-pointer"><span class="font-bold text-slate-600 text-sm">Gửi giấu tên</span></label>
            <button onclick="guiThuBiMat()" class="w-full bg-pink-500 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-pink-600 transition relative z-10"><i class="fas fa-paper-plane mr-2"></i> GỬI CHO THẦY HIỂN</button>
        </div>
    `;
}

async function guiThuBiMat() {
    const content = document.getElementById('mailContent').value.trim(); const isAnon = document.getElementById('mailAnon').checked; if(!content) return alert("Con chưa viết gì cả!");
    document.getElementById('loader').style.display = 'flex';
    try { await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'gui_thu_bi_mat', data:{ id:currentUser.id, name:currentUser.name, isAnonymous: isAnon, content: content } }) }); alert("Đã gửi thư thành công! Cảm ơn con đã chia sẻ, thầy Hiển sẽ đọc sớm thôi."); veTrangChu(); } 
    catch(e) { alert("Lỗi mạng, chưa gửi được thư!"); }
    document.getElementById('loader').style.display = 'none';
}
