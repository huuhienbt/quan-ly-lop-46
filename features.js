// ==========================================
// FILE: FEATURES.JS (BẢN FULL VIP 100% - ĐÃ TỔNG VỆ SINH & TỐI ƯU HÓA)
// Tích hợp: Soạn Đề Full Option, Kéo Thả Multi-drop, Vòng Quay VIP (Cloud), Bản Đồ Tiến Độ, Game Toán (Cloud), Quản lý Kho Đồ
// ==========================================

let isSpinning = false;
window.Data = window.Data || { hs: [], math: [], tv: [], vietnamese: [], log: [], caudo: [] };
window.isAllDataLoaded = false;
window.isFetchingBackground = false;

// Biến hệ thống Giám thị ảo
window.isQuizActive = false;
window.cheatWarnings = 0;

const PRIZES = [
    { id: "plus10", text: "+10 Điểm", color: "#34d399", netScore: 10, extraSpin: 0, msg: "Chúc mừng! Con được cộng 10 điểm.", icon: "🎉" },
    { id: "extra", text: "Thêm Lượt", color: "#60a5fa", netScore: 0, extraSpin: 1, msg: "Tuyệt vời! Con được tặng thêm 1 lượt quay nữa.", icon: "🎁" },
    { id: "riddle", text: "Giải Đố", color: "#a78bfa", netScore: 0, extraSpin: 0, msg: "Con hãy giải câu đố để nhận thưởng nhé!", icon: "🧠" },
    { id: "minus10", text: "-10 Điểm", color: "#f87171", netScore: -10, extraSpin: 0, msg: "Ối! Con bị trừ 10 điểm rồi.", icon: "📉" },
    { id: "redo", text: "Vé làm bài", color: "#fb923c", netScore: 0, extraSpin: 0, msg: "Con nhận được 1 Vé làm bài. Dùng nó để làm lại bài nhé!", icon: "🎫" },
    { id: "miss", text: "Mất Lượt", color: "#94a3b8", netScore: 0, extraSpin: 0, msg: "Thật tiếc, con quay trúng ô mất lượt.", icon: "😢" },
    { id: "chest", text: "Kho Báu", color: "#fbbf24", netScore: 0, extraSpin: 0, msg: "Wow! Con đã mở được Rương Kho Báu!", icon: "💎" }
];

window.safeConfetti = function() {
    try {
        var dur = 3000; var end = Date.now() + dur; 
        var int = setInterval(function() { 
            if (end - Date.now() <= 0) return clearInterval(int); 
            if (typeof confetti === 'function') {
                confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, particleCount: 50 * ((end - Date.now()) / dur), origin: { x: Math.random(), y: Math.random() - 0.2 } }); 
            }
        }, 250);
    } catch(e) {}
};

window.getDailySpinLog = function(todayStr) {
    if (!currentUser) return { date: todayStr, extra: 0, usedFree: false };
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
    if (spinLog.date !== todayStr) {
        spinLog = { date: todayStr, extra: 0, usedFree: false };
        localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog));
    }
    return spinLog;
};

// ==========================================
// 0. BỘ NÃO TẢI DỮ LIỆU TỔNG & KHO ĐỒ CLOUD
// ==========================================
window.updateKhoDoCloud = async function(spinsToAdd, ticketsToAdd, gamesToAdd = 0) {
    if (!currentUser || currentUser.role !== 'student') return;
    
    currentUser.luotQuay = (Number(currentUser.luotQuay) || 0) + spinsToAdd;
    currentUser.veLamLai = (Number(currentUser.veLamLai) || 0) + ticketsToAdd;
    currentUser.luotGame = (Number(currentUser.luotGame) || 0) + gamesToAdd;
    
    if(currentUser.luotQuay < 0) currentUser.luotQuay = 0;
    if(currentUser.veLamLai < 0) currentUser.veLamLai = 0;
    if(currentUser.luotGame < 0) currentUser.luotGame = 0;

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'update_inventory', data: { id_hs: currentUser.id, spins: spinsToAdd, tickets: ticketsToAdd, games: gamesToAdd } })
        });
    } catch(e) { console.log("Lỗi đồng bộ kho đồ Cloud"); }
};

window.loadAllDataOnce = async function(force = false, silent = false) {
    if (window.isAllDataLoaded && !force) return true;
    if (!force) {
        try {
            let cacheData = localStorage.getItem('eduDataCache');
            if (cacheData) {
                let parsed = JSON.parse(cacheData);
                if (parsed.math && parsed.tv && parsed.log) {
                    Data.math = parsed.math; Data.tv = parsed.tv; Data.vietnamese = parsed.tv;
                    Data.log = parsed.log; Data.caudo = parsed.caudo || []; window.isAllDataLoaded = true;
                    if (!window.isFetchingBackground) {
                        window.isFetchingBackground = true;
                        window.fetchFreshDataSilently(false).then(() => window.isFetchingBackground = false);
                    }
                    return true;
                }
            }
        } catch(e) {}
    }

    if (!silent) {
        document.getElementById('content').innerHTML = `
            <div class="flex flex-col items-center justify-center mt-28 fade-in opacity-90">
                <i class="fas fa-circle-notch animate-spin inline-block text-5xl text-indigo-500 mb-4 drop-shadow-md"></i>
                <p class="text-slate-500 font-bold text-sm animate-pulse tracking-wide">Đang đồng bộ không gian học tập...</p>
            </div>
        `;
    }
    return await window.fetchFreshDataSilently(!silent);
};

window.fetchFreshDataSilently = async function(showError = false) {
    try {
        const [mRes, tRes, lRes, cRes] = await Promise.all([
            fetch(API_URL + "?type=math&t=" + Date.now()).then(r => r.json()),
            fetch(API_URL + "?type=vietnamese&t=" + Date.now()).then(r => r.json()),
            fetch(API_URL + "?type=history_all&t=" + Date.now()).then(r => r.json()),
            fetch(API_URL + "?type=caudo&t=" + Date.now()).then(r => r.json())
        ]);

        Data.math = Array.isArray(mRes) ? mRes : []; Data.tv = Array.isArray(tRes) ? tRes : []; Data.vietnamese = Data.tv;
        
        let rawLog = Array.isArray(lRes) ? lRes : []; 
        let resetLogs = rawLog.filter(l => l.subject === "RESET");
        resetLogs.forEach(rLog => {
            rawLog = rawLog.filter(l => !(String(l.id) === String(rLog.id) && (l.subject === rLog.details || (rLog.details === 'vietnamese' && l.subject === 'tv')) && l.group === rLog.group && new Date(l.time) < new Date(rLog.time)));
        });
        Data.log = rawLog;
        Data.caudo = Array.isArray(cRes) ? cRes : [];

        try { localStorage.setItem('eduDataCache', JSON.stringify({ math: Data.math, tv: Data.tv, log: Data.log, caudo: Data.caudo })); } catch(e) {}
        window.isAllDataLoaded = true; return true;
    } catch(e) {
        if (showError) { document.getElementById('content').innerHTML = `<div class="text-center mt-24 text-red-500 fade-in"><i class="fas fa-wifi text-6xl mb-4 opacity-50"></i><h2 class="text-xl font-black uppercase mb-2">Lỗi Kết Nối</h2><p class="font-bold text-sm">Không thể kết nối. Thầy/cô và con vui lòng F5 tải lại trang nhé!</p></div>`; }
        return false;
    }
};

// ==========================================
// 1. GÓC HỌC TẬP (GIAO DIỆN THẺ BÀI HIỆN ĐẠI NHƯ KHO GAME)
// ==========================================
window.moGocHocTap = async function() { 
    closeMenu(); 
    if (!(await window.loadAllDataOnce())) return;

    // --- TÍNH TOÁN SỐ BÀI CHƯA LÀM ---
    let mathUnread = 0; let tvUnread = 0;
    const mathGroupsAll = [...new Set(Data.math.map(x => x.group))].filter(g => g);
    const tvGroupsAll = [...new Set(Data.tv.map(x => x.group))].filter(g => g);
    const totalAssignments = mathGroupsAll.length + tvGroupsAll.length;

    if (currentUser && currentUser.role === 'student') {
        const myLogs = Data.log.filter(l => String(l.id) === String(currentUser.id));
        mathUnread = mathGroupsAll.filter(g => !myLogs.some(l => l.subject === 'math' && l.group === g)).length;
        tvUnread = tvGroupsAll.filter(g => !myLogs.some(l => (l.subject === 'vietnamese' || l.subject === 'tv') && l.group === g)).length;
    }

    // --- TẠO NHÃN BÁO ĐỎ NHẤP NHÁY (Chuyển sang góc trái để nhường chỗ cho icon) ---
    let mathBadge = mathUnread > 0 ? `<div class="absolute -top-3 -left-3 bg-red-500 text-white text-[12px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce z-20">${mathUnread} BÀI MỚI</div>` : '';
    let tvBadge = tvUnread > 0 ? `<div class="absolute -top-3 -left-3 bg-red-500 text-white text-[12px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-bounce z-20">${tvUnread} BÀI MỚI</div>` : '';

    let htmlTop = `
        ${window.getNavHtml ? window.getNavHtml('hoctap') : ''}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5 relative">
            
            <div class="bg-orange-50/80 p-5 sm:p-6 rounded-[2rem] border-2 border-orange-100 shadow-sm hover:shadow-md transition relative flex flex-col justify-between min-h-[180px] group">
                ${mathBadge}
                <div class="absolute -top-4 -right-2 bg-orange-100 border-2 border-orange-200 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-500 text-2xl shadow-sm rotate-12 group-hover:rotate-0 transition z-10">
                    <i class="fas fa-calculator"></i>
                </div>
                <div class="mb-6 pr-8 relative z-10">
                    <div class="text-[10px] font-black text-orange-500 mb-2 uppercase tracking-widest bg-orange-200/50 inline-block px-2 py-0.5 rounded-md"><i class="fas fa-fire mr-1"></i>Học Tập</div>
                    <h3 class="font-black text-2xl sm:text-3xl text-slate-800">TOÁN</h3>
                    <p class="text-sm font-bold text-slate-500 mt-1.5 leading-snug">Vượt qua các thử thách tính toán để chinh phục đỉnh cao trí tuệ.</p>
                </div>
                <button onclick="window.loadSubject('math')" class="w-full bg-orange-500 text-white font-black py-3 rounded-xl shadow-[0_4px_0_rgb(194,65,12)] active:shadow-none active:translate-y-1 transition text-lg flex items-center justify-center gap-2 relative z-10 hover:bg-orange-600">
                    <i class="fas fa-play text-sm"></i> VÀO HỌC
                </button>
            </div>

            <div class="bg-cyan-50/80 p-5 sm:p-6 rounded-[2rem] border-2 border-cyan-100 shadow-sm hover:shadow-md transition relative flex flex-col justify-between min-h-[180px] group">
                ${tvBadge}
                <div class="absolute -top-4 -right-2 bg-cyan-100 border-2 border-cyan-200 w-12 h-12 rounded-2xl flex items-center justify-center text-cyan-500 text-2xl shadow-sm rotate-12 group-hover:rotate-0 transition z-10">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="mb-6 pr-8 relative z-10">
                    <div class="text-[10px] font-black text-cyan-500 mb-2 uppercase tracking-widest bg-cyan-200/50 inline-block px-2 py-0.5 rounded-md"><i class="fas fa-bolt mr-1"></i>Khám phá</div>
                    <h3 class="font-black text-2xl sm:text-3xl text-slate-800">TIẾNG VIỆT</h3>
                    <p class="text-sm font-bold text-slate-500 mt-1.5 leading-snug">Rèn luyện kỹ năng đọc hiểu và giải mã các từ khóa thú vị.</p>
                </div>
                <button onclick="window.loadSubject('vietnamese')" class="w-full bg-cyan-500 text-white font-black py-3 rounded-xl shadow-[0_4px_0_rgb(6,182,212)] active:shadow-none active:translate-y-1 transition text-lg flex items-center justify-center gap-2 relative z-10 hover:bg-cyan-600">
                    <i class="fas fa-play text-sm"></i> VÀO HỌC
                </button>
            </div>

        </div>
        
        ${currentUser && currentUser.role === 'student' ? `
        <div class="bg-blue-50/80 p-5 sm:p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm hover:shadow-md transition relative flex flex-col sm:flex-row justify-between min-h-[120px] group mt-5 items-center gap-4">
            <div class="absolute -top-4 -right-2 bg-blue-100 border-2 border-blue-200 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-500 text-2xl shadow-sm rotate-12 group-hover:rotate-0 transition z-10 hidden sm:flex">
                <i class="fas fa-brain"></i>
            </div>
            <div class="flex-1 pr-0 sm:pr-10 relative z-10 w-full text-center sm:text-left">
                <div class="text-[10px] font-black text-blue-500 mb-2 uppercase tracking-widest bg-blue-200/50 inline-block px-2 py-0.5 rounded-md"><i class="fas fa-puzzle-piece mr-1"></i>Trí Tuệ</div>
                <h3 class="font-black text-2xl sm:text-3xl text-slate-800">LẬT THẺ GIẢI TOÁN</h3>
                <p class="text-sm font-bold text-slate-500 mt-1.5 leading-snug">Rèn luyện trí nhớ và khả năng tính nhẩm siêu tốc qua thử thách 20 thẻ bài bí ẩn.</p>
            </div>
            <button onclick="window.moGameLatTheToan()" class="w-full sm:w-auto min-w-[180px] bg-blue-500 text-white font-black py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(37,99,235)] active:shadow-none active:translate-y-1 transition text-lg flex items-center justify-center gap-2 relative z-10 hover:bg-blue-600 shrink-0">
                <i class="fas fa-play text-sm"></i> CHƠI NGAY
            </button>
        </div>

        <div class="bg-pink-50/80 p-5 sm:p-6 rounded-[2rem] border-2 border-pink-100 shadow-sm hover:shadow-md transition relative flex flex-col sm:flex-row justify-between min-h-[120px] group mt-5 items-center gap-4">
            <div class="absolute -top-4 -right-2 bg-pink-100 border-2 border-pink-200 w-12 h-12 rounded-2xl flex items-center justify-center text-pink-500 text-2xl shadow-sm rotate-12 group-hover:rotate-0 transition z-10 hidden sm:flex">
                <i class="fas fa-rocket"></i>
            </div>
            <div class="flex-1 pr-0 sm:pr-10 relative z-10 w-full text-center sm:text-left">
                <div class="text-[10px] font-black text-pink-500 mb-2 uppercase tracking-widest bg-pink-200/50 inline-block px-2 py-0.5 rounded-md"><i class="fas fa-gamepad mr-1"></i>Kịch tính</div>
                <h3 class="font-black text-2xl sm:text-3xl text-slate-800">BẢO VỆ TRÁI ĐẤT</h3>
                <p class="text-sm font-bold text-slate-500 mt-1.5 leading-snug">Sân đấu trí tuệ phản xạ tính nhẩm nhanh dành cho những chiến binh xuất sắc nhất.</p>
            </div>
            <button onclick="window.moGameBaoVeTraiDat()" class="w-full sm:w-auto min-w-[180px] bg-pink-500 text-white font-black py-3 px-6 rounded-xl shadow-[0_4px_0_rgb(219,39,119)] active:shadow-none active:translate-y-1 transition text-lg flex items-center justify-center gap-2 relative z-10 hover:bg-pink-600 shrink-0">
                <i class="fas fa-play text-sm"></i> CHƠI NGAY
            </button>
        </div>` : ''}
    `; 
    
    function parseLogTime(timeStr) { if(!timeStr) return 0; let d = new Date(timeStr); return !isNaN(d.getTime()) ? d.getTime() : 0; }

    let studentsWithTime = Data.hs.filter(s => (s.role || '').toLowerCase() !== 'admin').map(s => {
        let scoreVal = Number(s.score) || 0; let userLogs = Data.log.filter(l => String(l.id) === String(s.id) && Number(l.score) !== 0); let achievedTime = 0;
        if (userLogs.length > 0) { userLogs.sort((a, b) => parseLogTime(a.time) - parseLogTime(b.time)); achievedTime = parseLogTime(userLogs[userLogs.length - 1].time); }
        return { ...s, score: scoreVal, achievedTime: achievedTime };
    });

    let sortedStudents = studentsWithTime.sort((a, b) => {
        let scoreDiff = b.score - a.score; if (scoreDiff !== 0) return scoreDiff;
        let timeA = a.achievedTime === 0 ? Infinity : a.achievedTime; let timeB = b.achievedTime === 0 ? Infinity : b.achievedTime;
        return timeA - timeB; 
    });

    let top30 = sortedStudents.slice(0, 30);
    let uniqueScores = [...new Set(sortedStudents.map(s => s.score))].sort((a, b) => b - a);
    let now = new Date();

    let leaderboardHtml = ""; 
    if (top30.length > 0) { 
        let listHtml = top30.map((s) => { 
            let actualDisplayRank = uniqueScores.indexOf(s.score) + 1; 
            let rankIcon = `<span class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm">${actualDisplayRank}</span>`; 
            
            let userLogs = Data.log.filter(l => String(l.id) === String(s.id));
            let doneMath = new Set(userLogs.filter(l => l.subject === 'math' && mathGroupsAll.includes(l.group)).map(l => l.group)).size;
            let doneTv = new Set(userLogs.filter(l => (l.subject === 'vietnamese' || l.subject === 'tv') && tvGroupsAll.includes(l.group)).map(l => l.group)).size;
            let isOngVang = (totalAssignments > 0 && (doneMath + doneTv) >= totalAssignments);

            let lastActionTime = 0;
            if (userLogs.length > 0) {
                userLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
                let d = new Date(userLogs[0].time);
                if (!isNaN(d.getTime())) lastActionTime = d;
            }

            let statusDot = ""; let statusTitle = "";
            if (!lastActionTime) {
                statusDot = "bg-black"; statusTitle = "Chưa truy cập";
            } else {
                let diffMinutes = Math.floor((now - lastActionTime) / 60000);
                if (diffMinutes < 30) { statusDot = "bg-green-500 animate-pulse ring-2 ring-green-200"; statusTitle = "Đang hoạt động rôm rả"; } 
                else if (diffMinutes < 60 * 24) { statusDot = "bg-blue-500"; statusTitle = "Có hoạt động hôm nay"; } 
                else { statusDot = "bg-black"; statusTitle = "Đang Offline"; }
            }

            let titleBadge = ""; let ongVangBadge = isOngVang ? `<div class="text-[10px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-400 inline-flex items-center mt-1 shadow-sm">Ong Vàng Chăm Chỉ</div>` : "";
            let nameColor = "text-slate-700 font-bold"; let rowStyles = "bg-slate-50 border-slate-200"; 
            
            if (actualDisplayRank === 1) { rowStyles = "bg-yellow-50 scale-[1.02] z-10"; nameColor = "text-yellow-700 font-bold"; rankIcon = `<i class="fas fa-medal text-3xl text-yellow-500 drop-shadow-md"></i>`; }
            else if (actualDisplayRank === 2) { rowStyles = "bg-gray-50"; rankIcon = `<i class="fas fa-medal text-3xl text-slate-400 drop-shadow-md"></i>`; }
            else if (actualDisplayRank === 3) { rowStyles = "bg-orange-50"; rankIcon = `<i class="fas fa-medal text-3xl text-orange-400 drop-shadow-md"></i>`; }

            if (s.score >= 5000) { titleBadge = `<div class="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-star mr-1"></i>Ngôi Sao Tri Thức</div>`; nameColor = "text-red-600 font-black drop-shadow-md"; rowStyles += " border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] ring-2 ring-red-200 ring-offset-1 animate-pulse"; } 
            else if (s.score >= 4000) { titleBadge = `<div class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-award mr-1"></i>Học Sinh Ưu Tú</div>`; nameColor = "text-purple-700 font-bold drop-shadow-sm"; rowStyles += " border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"; } 
            else if (s.score >= 3000) { titleBadge = `<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-medal mr-1"></i>Học Giả Nhí</div>`; nameColor = "text-emerald-700 font-bold"; rowStyles += " border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"; } 
            else { if (actualDisplayRank === 1) rowStyles += " border-yellow-300 shadow-sm"; else if (actualDisplayRank === 2) rowStyles += " border-gray-300"; else if (actualDisplayRank === 3) rowStyles += " border-orange-200"; else rowStyles += " border-emerald-200"; }

            let allBadges = ""; if (titleBadge || ongVangBadge) { allBadges = `<div class="flex flex-wrap gap-1">${titleBadge}${ongVangBadge}</div>`; }
            let avatarUrl = window.layAnhDaiDien ? window.layAnhDaiDien(s.id, s.name) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=random&color=fff';
            
            let avatarHtml = `
            <div class="relative shrink-0" title="${statusTitle}">
                <img src="${avatarUrl}" class="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover">
                <span class="absolute bottom-0 right-0 w-3 h-3 ${statusDot} border-2 border-white rounded-full"></span>
            </div>`;

            return `
            <div class="flex items-center justify-between p-3 mb-2 rounded-xl transition-all relative border ${rowStyles}">
                <div class="flex items-center gap-2 sm:gap-3">
                    <div class="w-8 text-center flex justify-center shrink-0">${rankIcon}</div>
                    ${avatarHtml}
                    <div class="flex flex-col ml-1">
                        <span class="${nameColor} text-sm sm:text-base tracking-wide">${s.name}</span>
                        ${allBadges}
                    </div>
                </div>
                <div class="font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm text-sm shrink-0">
                    ${s.score} <span class="text-[10px] text-indigo-500 font-bold ml-1 uppercase">điểm</span>
                </div>
            </div>`; 
        }).join(''); 
        
        let personalMsg = ""; 
        if (currentUser && currentUser.role === 'student') { 
            let myScore = Number(currentUser.score) || 0; let myRank = uniqueScores.indexOf(myScore) + 1; if (myRank === 0) myRank = uniqueScores.length + 1; 
            if (myRank <= 10) { personalMsg = `<div class="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl text-center"><p class="text-green-700 font-bold text-sm"><i class="fas fa-star text-yellow-500 mr-1 animate-pulse"></i> Tuyệt vời! Con đang ở Top ${myRank} Bảng Vàng!</p></div>`; } 
            else { personalMsg = `<div class="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center"><p class="text-blue-700 font-bold text-sm"><i class="fas fa-rocket mr-1 text-blue-500"></i> Hiện tại con đang ở Hạng ${myRank}.<br>Cố lên nhé, chăm chỉ làm bài để leo rank nha!</p></div>`; } 
        } 
        
        leaderboardHtml = `<div class="mt-6 bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-yellow-400 fade-in"><div class="text-center mb-5"><h3 class="font-black text-xl sm:text-2xl text-yellow-600 uppercase tracking-wide"><i class="fas fa-crown text-yellow-500 mr-2 mb-1 animate-bounce inline-block"></i>BẢNG VÀNG LỚP 4/6</h3></div><div class="flex flex-col">${listHtml}</div>${personalMsg}</div>`; 
    } 
    document.getElementById('content').innerHTML = htmlTop + leaderboardHtml; 
};
// ==========================================
// 2. KHO QUẢN LÝ BÀI TẬP ADMIN
// ==========================================
window.quanLyNganHang = async function(sub, forceReload = false) { 
    closeMenu(); curSub = sub; 
    if (!(await window.loadAllDataOnce(forceReload))) return;
    window.renderGiaoDienKho(sub); 
};

window.renderGiaoDienKho = function(sub) { 
    const qs = Data[sub]; const groups = [...new Set(qs.map(q => q.group))].filter(g => g).sort(); 
    let filterOptions = `<option value="all">-- Tất cả các Tuần --</option>` + groups.map(g => `<option value="${String(g).replace(/"/g, '&quot;')}">${g}</option>`).join(''); 
    document.getElementById('content').innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button>
                <h2 class="font-black text-xl text-indigo-900 uppercase">KHO ${sub === 'math' ? 'TOÁN' : 'T.VIỆT'}</h2>
            </div>
            <button onclick="window.renderFormCauHoi(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold btn-3d text-sm"><i class="fas fa-plus mr-1"></i> Tạo câu mới</button>
        </div>
        <select id="qFilter" onchange="window.filterQuestions()" class="w-full p-3 rounded-xl border-2 border-slate-200 mb-6 font-bold text-slate-700 outline-none focus:border-indigo-500">${filterOptions}</select>
        <div id="listQuestions" class="space-y-4"></div>
    `; window.filterQuestions(); 
};

window.filterQuestions = function() { 
    const val = document.getElementById("qFilter").value; 
    let list = val === 'all' ? Data[curSub] : Data[curSub].filter(q => String(q.group) === val); 
    if (list.length === 0) { document.getElementById("listQuestions").innerHTML = '<p class="text-center text-slate-400 py-10">Trống</p>'; return; } 
    
    let grouped = {}; 
    list.forEach(q => { if (q.group) { if (!grouped[q.group]) grouped[q.group] = []; grouped[q.group].push(q); } }); 
    let sortedGroups = Object.keys(grouped).sort((a, b) => { 
        let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); 
        let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; 
        if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); 
    }); 
    
    let html = ""; 
    sortedGroups.forEach((grp, grpIndex) => { 
        let questions = grouped[grp]; let safeGrpId = 'grp_questions_' + grpIndex; 
        html += `<div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 mb-4 fade-in overflow-hidden transition-all"><div onclick="window.toggleGroupQuestions('${safeGrpId}')" class="flex items-center justify-between p-5 cursor-pointer hover:bg-indigo-50 transition select-none"><div class="flex items-center gap-4"><div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-inner"><i class="fas fa-layer-group"></i></div><div><h3 class="font-black text-xl text-slate-800 uppercase">${grp}</h3><p class="text-sm font-bold text-slate-400">${questions.length} câu hỏi</p></div></div><div class="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i id="icon_${safeGrpId}" class="fas fa-chevron-down transition-transform duration-300 text-lg"></i></div></div><div id="content_${safeGrpId}" class="hidden px-5 pb-5 pt-2 border-t-2 border-slate-50 bg-slate-50/50 space-y-3">`; 
        questions.forEach((q, index) => { 
            let qText = window.parseImg(q.question || ""); if (q.image) qText += `<br><img src="${q.image}" class="max-w-full rounded-md mt-2">`; if (qText.includes('[BAIDOC]')) qText = "<span class='text-yellow-600 font-bold'>[CHỨA BÀI ĐỌC]</span> " + qText.replace(/\[BAIDOC\].*?\[\/BAIDOC\]/s, '').trim();
            html += `<div class="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition relative shadow-sm"><div class="flex justify-between items-start"><div class="flex gap-3 w-full pr-16"><span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">${index + 1}</span><div class="font-medium text-slate-700 text-base mt-1 overflow-hidden break-words w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mt-2">${qText}</div></div><div class="flex gap-2 absolute top-4 right-4"><button onclick="window.renderFormCauHoi('${q.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm" title="Sửa"><i class="fas fa-edit"></i></button><button onclick="window.xoaCauHoi('${q.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm" title="Xóa"><i class="fas fa-trash"></i></button></div></div></div>`; 
        }); html += `</div></div>`; 
    }); document.getElementById("listQuestions").innerHTML = html; 
};

window.toggleGroupQuestions = function(groupId) {
    const contentDiv = document.getElementById('content_' + groupId); const icon = document.getElementById('icon_' + groupId);
    if (contentDiv.classList.contains('hidden')) { contentDiv.classList.remove('hidden'); icon.style.transform = 'rotate(180deg)'; } 
    else { contentDiv.classList.add('hidden'); icon.style.transform = 'rotate(0deg)'; }
};

// ==========================================
// 3. EDITOR ĐA PHƯƠNG TIỆN TÙY CHỈNH
// ==========================================
window.getRichTextToolbar = function(targetId) {
    return `
        <div class="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200 items-center shadow-sm">
            <button onclick="document.execCommand('bold', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 font-black text-slate-700">B</button>
            <button onclick="document.execCommand('italic', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 italic font-serif text-slate-700">I</button>
            <button onclick="document.execCommand('underline', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 underline font-serif text-slate-700">U</button>
            <div class="relative flex items-center bg-white rounded shadow-sm px-1 hover:bg-slate-200 h-8" title="Màu chữ">
                <input type="color" onchange="document.execCommand('foreColor', false, this.value)" class="w-5 h-5 border-0 bg-transparent cursor-pointer">
            </div>
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            <button onclick="document.execCommand('justifyLeft', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-left"></i></button>
            <button onclick="document.execCommand('justifyCenter', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-center"></i></button>
            <button onclick="document.execCommand('justifyRight', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-right"></i></button>
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            <button onclick="document.execCommand('insertText', false, '___')" class="px-2 h-8 bg-yellow-50 rounded hover:bg-yellow-100 text-yellow-700 font-bold text-xs flex items-center gap-1 border border-yellow-200 shadow-sm transition"><i class="far fa-square"></i> Ô Trống</button>
            <button onclick="window.chenPhanSo('${targetId}')" class="px-2 h-8 bg-cyan-50 rounded hover:bg-cyan-100 text-cyan-700 font-bold text-xs flex items-center gap-1 border border-cyan-200 shadow-sm transition"><i class="fas fa-divide"></i> Phân số</button>
            
            <button onclick="window.chenLinkVaoEditor('${targetId}')" class="px-2 h-8 bg-blue-50 rounded hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200"><i class="fas fa-link"></i> Link</button>
            <button onclick="window.chenAnhVaoEditor('${targetId}')" class="px-2 h-8 bg-indigo-50 rounded shadow-sm hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200"><i class="fas fa-image"></i> Ảnh</button>
            <button onclick="window.chenVideoYouTube('${targetId}')" class="px-2 h-8 bg-red-50 rounded hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 border border-red-200"><i class="fab fa-youtube"></i> Video</button>
            <button onclick="window.chenAmThanh('${targetId}')" class="px-2 h-8 bg-green-50 rounded hover:bg-green-100 text-green-700 font-bold text-xs flex items-center gap-1 border border-green-200"><i class="fas fa-music"></i> Nghe</button>
            <button onclick="window.chenPDF('${targetId}')" class="px-2 h-8 bg-orange-50 rounded hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center gap-1 border border-orange-200"><i class="fas fa-file-pdf"></i> PDF</button>
            
            <select onchange="window.resizeImg(this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ ảnh</option><option value="30%">Nhỏ (30%)</option><option value="60%">Vừa (60%)</option><option value="100%">Lớn (100%)</option></select>
        </div>
    `;
};

window.chenPhanSo = function(targetId) {
    const tuSo = prompt("Nhập TỬ SỐ:"); if (tuSo === null || tuSo.trim() === "") return;
    const mauSo = prompt("Nhập MẪU SỐ:"); if (mauSo === null || mauSo.trim() === "") return;
    const fractionHtml = `<span contenteditable="false" style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; margin: 0 4px; font-weight: bold; line-height: 1.2;"><span style="border-bottom: 2px solid currentColor; padding: 0 4px;">${tuSo}</span><span style="padding: 0 4px;">${mauSo}</span></span>&nbsp;`;
    let target = window.lastActiveEditor || targetId; let editor = document.getElementById(target);
    if (editor) { editor.focus(); document.execCommand('insertHTML', false, fractionHtml); }
};

window.chenPDF = function(targetId) {
    const url = prompt("Dán link file PDF từ Google Drive vào đây:"); if (!url) return;
    const pdfTitle = prompt("Nhập tên hiển thị cho tài liệu:", "TÀI LIỆU PDF"); if (!pdfTitle) return;
    let pdfSrc = url; let driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); if (driveMatch) pdfSrc = `https://drive.google.com/file/d/${driveMatch[1]}/preview`; 
    const pdfHtml = `<div contenteditable="false" style="margin: 15px 0; width: 100%; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><div style="background: #f1f5f9; padding: 10px 15px; font-size: 13px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; text-transform: uppercase;"><i class="fas fa-file-pdf text-red-500 mr-2 text-lg"></i>${pdfTitle}</div><iframe src="${pdfSrc}" width="100%" height="500px" style="border: none;" allow="autoplay" loading="lazy"></iframe></div><br>`;
    document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, pdfHtml);
};

window.chenVideoYouTube = function(targetId) {
    const url = prompt("Dán link Video (YouTube, Google Drive, GitHub) vào đây:"); if (!url) return;
    const sizeInput = prompt("Chiếm bao nhiêu phần ngang? (Nhập số: 100, 80, 60...)", "100"); const videoWidth = sizeInput ? sizeInput + "%" : "100%";
    let videoHtml = ""; const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/); const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const wrapperStyle = `margin: 15px auto; width: ${videoWidth}; max-width: 800px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden;`;
    if (ytMatch && ytMatch[2].length === 11) { 
        videoHtml = `<div contenteditable="false" style="${wrapperStyle} position: relative; padding-bottom: calc(${videoWidth} * 0.5625); height: 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" src="https://www.youtube.com/embed/${ytMatch[2]}" allowfullscreen loading="lazy"></iframe></div><br>`; 
    } else if (driveMatch) { 
        videoHtml = `<div contenteditable="false" style="${wrapperStyle} position: relative; padding-bottom: calc(${videoWidth} * 0.5625); height: 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" src="https://drive.google.com/file/d/${driveMatch[1]}/preview" allow="autoplay" allowfullscreen loading="lazy"></iframe></div><br>`; 
    } else if (url.includes(".mp4") || url.includes("github.com")) { 
        let videoSrc = url; if (url.includes("github.com") && url.includes("/blob/")) { videoSrc = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/"); } 
        videoHtml = `<div contenteditable="false" style="${wrapperStyle} padding: 10px; background: #f8fafc; border: 2px solid #e2e8f0; text-align: center;"><video controls style="width: 100%; border-radius: 8px; outline: none;"><source src="${videoSrc}" type="video/mp4">Trình duyệt không hỗ trợ.</video></div><br>`; 
    } else { alert("Link Video không hợp lệ!"); return; }
    document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, videoHtml);
};

window.chenLinkVaoEditor = function(targetId) { 
    const url = prompt("Dán đường link trang web vào đây:"); if (url) { const tenLink = prompt("Nhập chữ hiển thị:", "Bấm vào đây"); if (tenLink) { document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" style="color: blue; text-decoration: underline; font-weight: bold;">${tenLink}</a>`); } } 
};

window.chenAnhVaoEditor = function(targetId) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; 
    input.onchange = async (e) => { 
        const file = e.target.files[0]; if (!file) return; 
        document.getElementById('loader').style.display = 'flex'; 
        const reader = new FileReader(); 
        reader.onload = function(event) { 
            const img = new Image(); 
            img.onload = async function() { 
                const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let scaleSize = 1; 
                if(img.width > MAX_WIDTH) { scaleSize = MAX_WIDTH / img.width; } 
                canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize; 
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
                const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]; 
                try { 
                    const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) }); 
                    const result = await response.json(); 
                    if(result.url) { 
                        document.getElementById(targetId).focus(); 
                        document.execCommand('insertHTML', false, `<div style="text-align: center;"><img src="${result.url}" loading="lazy" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block; cursor: pointer;"></div><br>`); 
                    } else { alert("Lỗi! Không lấy được link ảnh từ Server."); } 
                } catch(err) { alert("Lỗi mạng khi tải ảnh lên!"); } 
                document.getElementById('loader').style.display = 'none'; 
            }; img.src = event.target.result; 
        }; reader.readAsDataURL(file); 
    }; input.click(); 
};

window.handleEditorClick = function(e) { 
    document.querySelectorAll('div[contenteditable="true"] img').forEach(img => img.style.border = 'none'); window.currentSelectedImg = null; 
    if (e.target.tagName === 'IMG') { e.target.style.border = '3px dashed #f97316'; window.currentSelectedImg = e.target; } 
};

window.resizeImg = function(size) { 
    if(!size) return; if(!window.currentSelectedImg) return alert("Thầy hãy bấm chọn một tấm ảnh ở dưới trước khi chỉnh kích thước nhé!"); 
    window.currentSelectedImg.style.width = size; window.currentSelectedImg.style.height = 'auto'; 
};

window.parseImg = function(t) { 
    let str = (t||"").toString();
    str = str.replace(/\[img:(.*?)\]/g, '<img src="$1" loading="lazy" class="rounded border my-2">');
    str = str.replace(/ps\(([^/]+)\/([^)]+)\)/gi, '<span style="display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; margin: 0 4px; font-weight: bold; line-height: 1.2; font-size: 0.9em;"><span style="border-bottom: 2px solid currentColor; padding: 0 4px;">$1</span><span style="padding: 0 4px;">$2</span></span>');
    return str.replace(/\n/g,'<br>'); 
};

window.autoFillTime = function() { 
    let selectedGroup = document.getElementById('frmG').value; let existingQ = Data[curSub].find(q => q.group === selectedGroup); 
    if (existingQ && existingQ.time) { document.getElementById('frmT').value = existingQ.time; } 
};

window.changeQType = function(initialCorr = '') {
    let val = document.getElementById("frmQType").value; let hint = document.getElementById("qTypeHint");
    let lblA = document.getElementById("lblA"); let lblB = document.getElementById("lblB");
    let lblC = document.getElementById("lblC"); let lblD = document.getElementById("lblD");
    let corrContainer = document.getElementById("corrContainer");
    let curVal = initialCorr || (document.getElementById("frmCorr") ? document.getElementById("frmCorr").value : 'a');
    if(val === 'dienkhuyet') {
        hint.className = "mt-2 text-[11px] font-bold text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-200 fade-in";
        lblA.innerText = "Từ gợi ý 1 (A)"; lblB.innerText = "Từ gợi ý 2 (B)"; lblC.innerText = "Từ gợi ý 3 (C)"; lblD.innerText = "Từ gợi ý 4 (D)";
        corrContainer.innerHTML = `<label class="text-xs font-bold text-slate-500 uppercase block mb-1">Thứ tự điền vào ô trống? (Vd: a,b,c)</label><input type="text" id="frmCorr" value="${curVal}" class="edit-input w-full bg-yellow-50 text-yellow-800 border-2 border-yellow-200 p-3 rounded-xl font-bold uppercase outline-none focus:border-yellow-500" placeholder="Ví dụ: a, c">`;
    } else {
        hint.className = "hidden"; lblA.innerText = "Đáp án A"; lblB.innerText = "Đáp án B"; lblC.innerText = "Đáp án C"; lblD.innerText = "Đáp án D";
        if(!['a','b','c','d'].includes(curVal.toLowerCase())) curVal = 'a';
        corrContainer.innerHTML = `<label class="text-xs font-bold text-slate-500 uppercase block mb-1">Chọn Đáp Án Đúng</label><select id="frmCorr" class="edit-input w-full bg-yellow-50 border-2 border-yellow-200 p-3 rounded-xl font-bold text-yellow-800 outline-none focus:border-yellow-500"><option value="a" ${curVal=='a'?'selected':''}>Đáp án A</option><option value="b" ${curVal=='b'?'selected':''}>Đáp án B</option><option value="c" ${curVal=='c'?'selected':''}>Đáp án C</option><option value="d" ${curVal=='d'?'selected':''}>Đáp án D</option></select>`;
    }
};

window.renderFormCauHoi = function(id) { 
    const q = id ? Data[curSub].find(x => x.id === id) : { group: '', time: 20, question: '', a: '', b: '', c: '', d: '', correct: 'a', image: '' }; 
    const groups = [...new Set(Data[curSub].map(x => x.group))].filter(g => g); 
    const dl = `<datalist id="groupList">${groups.map(g => `<option value="${g}">`).join('')}</datalist>`;
    let isTV = (curSub === 'vietnamese' || curSub === 'tv'); let baiDocHtml = ""; let cauHoiHtml = window.parseImg(q.question || "");
    if (q.image) { cauHoiHtml += `<br><div style="text-align: center;"><img src="${q.image}" loading="lazy" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block; cursor: pointer;"></div>`; }
    if (isTV && cauHoiHtml) { 
        let match = cauHoiHtml.match(/\[BAIDOC\](.*?)\[\/BAIDOC\]/s); 
        if (match) { baiDocHtml = match[1]; cauHoiHtml = cauHoiHtml.replace(match[0], '').trim(); } 
        else if (cauHoiHtml.includes('[ĐOẠN VĂN]')) { baiDocHtml = cauHoiHtml.replace('[ĐOẠN VĂN]', '').trim(); cauHoiHtml = ""; } 
    }
    let isDrag = /_{3,}/.test(cauHoiHtml);
    let formLayout = isTV ? `<div class="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl"><label class="text-xs font-black text-yellow-700 uppercase tracking-wider block mb-2"><i class="fas fa-book-reader"></i> Khung Bài Đọc</label>${window.getRichTextToolbar('frmBaiDoc')}<div id="frmBaiDoc" onclick="window.handleEditorClick(event)" contenteditable="true" class="w-full min-h-[120px] bg-white border border-yellow-300 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${baiDocHtml}</div></div>` : ``;
    formLayout += `
        <div class="w-full mb-4">
            <div class="mb-4 bg-indigo-50 border border-indigo-100 p-3 rounded-xl shadow-sm">
                <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Loại Câu Hỏi</label>
                <select id="frmQType" onchange="window.changeQType()" class="edit-input w-full bg-white border-2 border-indigo-200 p-2 rounded-xl font-bold text-indigo-700 outline-none focus:border-indigo-500 transition cursor-pointer">
                    <option value="tracnghiem" ${!isDrag ? 'selected' : ''}>🔘 Trắc nghiệm chọn đáp án (A, B, C, D)</option>
                    <option value="dienkhuyet" ${isDrag ? 'selected' : ''}>🧩 Bấm chọn Điền khuyết</option>
                </select>
                <div id="qTypeHint" class="${isDrag ? 'mt-2 text-[11px] font-bold text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-200 fade-in' : 'hidden'}">
                    <i class="fas fa-info-circle"></i> Hệ thống sẽ tạo dạng Bấm-Điền-Từ. Thầy hãy đặt con trỏ chuột vào chỗ cần điền và bấm nút <b class="bg-white px-1 rounded border border-slate-200 text-slate-700"><i class="far fa-square"></i> Ô Trống</b> ở thanh công cụ bên dưới nhé!
                </div>
            </div>
            <label class="text-xs font-black text-indigo-700 uppercase tracking-wider block mb-2"><i class="fas fa-edit"></i> Khung Câu Hỏi</label>
            ${window.getRichTextToolbar('frmQ')}
            <div id="frmQ" onclick="window.handleEditorClick(event)" contenteditable="true" class="w-full min-h-[150px] bg-white border-2 border-indigo-200 p-4 rounded-xl outline-none focus:border-indigo-500 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${cauHoiHtml}</div>
        </div>
    `;
    document.getElementById('content').innerHTML = `
        <div class="flex items-center mb-6"><button onclick="window.quanLyNganHang('${curSub}')" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">${id ? 'SỬA CÂU HỎI' : 'TẠO CÂU HỎI MỚI'}</h2></div>
        <div class="bg-white p-5 rounded-3xl shadow border space-y-4 fade-in">
            ${dl} 
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="col-span-2"><label class="text-xs font-bold text-slate-500 uppercase">Tên Bài Tập</label><input type="text" id="frmG" list="groupList" value="${q.group}" oninput="window.autoFillTime()" onchange="window.autoFillTime()" class="edit-input w-full mt-1" placeholder="Ví dụ: Tuần 1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Phút</label><input type="number" id="frmT" value="${q.time}" class="edit-input w-full mt-1 text-center"></div>
            </div>
            ${formLayout} 
            <div class="grid grid-cols-2 gap-3 mt-4">
                <div><label id="lblA" class="text-xs font-bold text-slate-500 uppercase">${isDrag ? 'Từ gợi ý 1 (A)' : 'Đáp án A'}</label><input type="text" id="frmA" value="${q.a}" class="edit-input w-full mt-1"></div>
                <div><label id="lblB" class="text-xs font-bold text-slate-500 uppercase">${isDrag ? 'Từ gợi ý 2 (B)' : 'Đáp án B'}</label><input type="text" id="frmB" value="${q.b}" class="edit-input w-full mt-1"></div>
                <div><label id="lblC" class="text-xs font-bold text-slate-500 uppercase">${isDrag ? 'Từ gợi ý 3 (C)' : 'Đáp án C'}</label><input type="text" id="frmC" value="${q.c}" class="edit-input w-full mt-1"></div>
                <div><label id="lblD" class="text-xs font-bold text-slate-500 uppercase">${isDrag ? 'Từ gợi ý 4 (D)' : 'Đáp án D'}</label><input type="text" id="frmD" value="${q.d}" class="edit-input w-full mt-1"></div>
            </div>
            <div id="corrContainer" class="mt-4"></div>
            <button onclick="window.luuCauHoi('${id || ''}')" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black btn-3d shadow-lg mt-6 text-lg hover:bg-indigo-700 transition"><i class="fas fa-save mr-2"></i> LƯU CÂU HỎI LÊN HỆ THỐNG</button>
        </div>
    `; 
    setTimeout(() => window.changeQType(q.correct), 50);
};

window.luuCauHoi = async function(id) { 
    document.querySelectorAll('#frmQ img, #frmBaiDoc img').forEach(img => img.style.border = 'none'); window.currentSelectedImg = null;
    let finalQuestionText = document.getElementById("frmQ").innerHTML; let isTV = (curSub === 'vietnamese' || curSub === 'tv');
    let typeVal = document.getElementById("frmQType").value;
    if (typeVal === 'dienkhuyet' && !/_{3,}/.test(finalQuestionText)) {
        alert("⚠️ CẢNH BÁO NHẦM LẪN:\n\nThầy đang chọn loại câu hỏi 'Điền khuyết' nhưng trong nội dung câu hỏi chưa có chỗ nào chừa trống cả!\n\nThầy hãy đặt con trỏ chuột vào vị trí cần điền, sau đó bấm nút [Ô Trống] màu vàng trên thanh công cụ nhé!"); return;
    }
    if (isTV) { let baiDocText = (document.getElementById("frmBaiDoc") ? document.getElementById("frmBaiDoc").innerHTML.trim() : ""); if (baiDocText && baiDocText !== '<br>') { finalQuestionText = `[BAIDOC]${baiDocText}[/BAIDOC] ` + finalQuestionText; } }
    let corrVal = document.getElementById("frmCorr").value.trim().toLowerCase();
    const data = { id: id, subject: curSub, group: document.getElementById("frmG").value, time: document.getElementById("frmT").value, question: finalQuestionText, a: document.getElementById("frmA").value, b: document.getElementById("frmB").value, c: document.getElementById("frmC").value, d: document.getElementById("frmD").value, correct: corrVal, image: "" }; 
    if(!data.group || !finalQuestionText.trim()) { return alert("Vui lòng điền đủ Tên bài và Câu hỏi!"); }
    document.getElementById('loader').style.display = 'flex'; 
    try { await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: id ? 'sua_cau_hoi' : 'them_cau_hoi', data: data }) }); window.isAllDataLoaded = false; alert("Lưu thành công!"); window.quanLyNganHang(curSub, true); } catch(e) { alert("Lỗi mạng! Không thể lưu câu hỏi."); } finally { document.getElementById('loader').style.display = 'none'; }
};

window.xoaCauHoi = async function(id) { 
    if(confirm("Chắc chắn xóa câu hỏi này?")) { 
        document.getElementById('loader').style.display = 'flex'; 
        try { await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: 'xoa_cau_hoi', data: { id: id, subject: curSub } }) }); window.isAllDataLoaded = false; alert("Đã xóa!"); window.quanLyNganHang(curSub, true); } catch(e) {} finally { document.getElementById('loader').style.display = 'none'; } 
    } 
};

// ==========================================
// 4. TIẾN TRÌNH LÀM BÀI (TÍCH HỢP HIỂN THỊ VÉ SỬA BÀI SAI)
// ==========================================
window.loadSubject = async function(sub) { 
    if(!currentUser) return showLogin(); curSub = sub; 
    if (!(await window.loadAllDataOnce())) return;
    const qs = Data[sub]; if (!qs) { alert("Không tải được dữ liệu. Vui lòng thử lại."); return veTrangChu(); }
    const grps = [...new Set(qs.map(x => x.group))].filter(g => g).sort((a, b) => { let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); });
    
    // Giao diện Huy hiệu Vé sửa bài sai
    let veLamLai = (currentUser && currentUser.role === 'student') ? (Number(currentUser.veLamLai) || 0) : 0;
    let veHtml = (currentUser && currentUser.role === 'student') ? `
        <div class="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl shadow-sm text-sm" title="Dùng để làm lại bài tập cũ cải thiện điểm">
            <i class="fas fa-ticket-alt text-orange-500"></i>
            <span class="font-bold text-orange-800 uppercase text-[10px] sm:text-[11px] tracking-wide whitespace-nowrap">Vé sửa bài sai:</span>
            <span class="font-black text-orange-600 text-base leading-none">${veLamLai}</span>
        </div>
    ` : '';

    let html = `
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center">
                <button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500 hover:bg-slate-50 transition"><i class="fas fa-arrow-left"></i></button>
                <h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2>
            </div>
            ${veHtml}
        </div>
        <div class="space-y-3">
    `; 

    if(grps.length === 0) { html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`; } else {
        grps.forEach(g => { 
            const myLogsForGroup = Data.log.filter(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g);
            const isDone = myLogsForGroup.length > 0; 
            const time = qs.find(q => q.group === g).time || 20; 
            const count = qs.filter(q => q.group === g && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length; 
            const maxPossibleScore = count * 10; 
            let clickAction = `window.startQuiz('${g}', ${time})`; 
            let badgeHtml = `<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>`;
            let cardClass = `border-indigo-50 bg-white`; let iconClass = `bg-indigo-100 text-indigo-600`; let iconSymbol = `fa-star`;
            if (isDone && currentUser.role === 'student') { 
                let maxScore = Math.max(...myLogsForGroup.map(l => Number(l.score) || 0));
                let pct = maxPossibleScore > 0 ? (maxScore / maxPossibleScore) * 100 : 0; 
                let theme = {};
                if (pct >= 90) { theme = { badge: "bg-green-100 text-green-700 border border-green-500", card: "border-green-200 bg-green-50/40 opacity-95", icon: "bg-green-100 text-green-600", sym: "fa-check-circle" }; } 
                else if (pct >= 70) { theme = { badge: "bg-yellow-100 text-yellow-700 border border-yellow-500", card: "border-yellow-200 bg-yellow-50/40 opacity-95", icon: "bg-yellow-100 text-yellow-600", sym: "fa-check-circle" }; } 
                else if (pct >= 50) { theme = { badge: "bg-orange-100 text-orange-700 border border-orange-500", card: "border-orange-200 bg-orange-50/40 opacity-95", icon: "bg-orange-100 text-orange-600", sym: "fa-exclamation-circle" }; } 
                else { theme = { badge: "bg-red-100 text-red-700 border border-red-500", card: "border-red-200 bg-red-50/40 opacity-95", icon: "bg-red-100 text-red-600", sym: "fa-times-circle" }; }
                badgeHtml = `<span class="${theme.badge} text-[10px] font-black px-2 py-1 rounded shadow-sm"><i class="fas ${theme.sym} text-xs mr-1"></i>${maxScore}/${maxPossibleScore} điểm</span>`;
                cardClass = theme.card; iconClass = theme.icon; iconSymbol = theme.sym;
                let isMaxScore = (pct >= 100); let tokens = Number(currentUser.veLamLai) || 0;
                if (tokens > 0) { clickAction = `window.promptRedo('${g}', ${time}, ${isMaxScore})`; } 
                else { if (isMaxScore) clickAction = `alert('Tuyệt vời! Con đã đạt điểm tuyệt đối ${maxScore}/${maxPossibleScore} ở bài này rồi. Quá xuất sắc! 🎉')`; else clickAction = `alert('Con đã làm bài này đạt ${maxScore}/${maxPossibleScore} điểm.\\n\\nHãy vào Vòng Quay May Mắn tìm Vé sửa bài sai nếu muốn cải thiện điểm nhé!')`; }
            } 
            html += `<div onclick="${clickAction}" class="p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${cardClass}"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${iconClass}"><i class="fas ${iconSymbol}"></i></div><div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p></div></div>${badgeHtml}</div>`; 
        }); 
    } 
    document.getElementById('content').innerHTML = html + `</div>`; 
};

// ==========================================
// VÁ LỖ HỔNG: DÙNG VÉ LÀM BÀI SẼ TRỪ ĐIỂM CŨ ĐỂ TÍNH LẠI TỪ ĐẦU
// ==========================================
window.promptRedo = async function(group, time, isMaxScore = false) {
    let tokens = Number(currentUser.veLamLai) || 0;
    if(tokens > 0) { 
        let confirmMsg = isMaxScore ? 
            `Con đang có ${tokens} Vé sửa bài sai.\n\nCon đã đạt điểm tối đa ở bài này rồi, con có muốn dùng 1 vé để làm lại không?` : 
            `Con đang có ${tokens} Vé sửa bài sai.\n\nCon có chắc chắn muốn dùng 1 vé để làm lại bài [${group}] không?\n\n(⚠️ LƯU Ý: Số điểm cũ của bài này sẽ bị trừ đi để con làm và tính lại từ đầu nhé!)`;
        
        if(confirm(confirmMsg)) { 
            document.getElementById('loader').style.display = 'flex';
            let loaderP = document.querySelector('#loader p');
            if(loaderP) loaderP.innerText = "ĐANG XÓA ĐIỂM CŨ VÀ DÙNG VÉ...";

            try {
                // 1. Trừ 1 vé làm bài trên Đám mây
                await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_inventory', data: { id_hs: currentUser.id, spins: 0, tickets: -1, games: 0 } }) });
                
                // 2. Tìm điểm cao nhất cũ để trừ đi (Tuyệt đối không cho cộng dồn x2 điểm)
                let groupLogs = Data.log.filter(l => String(l.id) === String(currentUser.id) && l.subject === curSub && l.group === group);
                let maxScoreObj = groupLogs.sort((a,b) => (Number(b.real_added)||0) - (Number(a.real_added)||0))[0];
                let pointsToDeduct = maxScoreObj ? (Number(maxScoreObj.real_added) || 0) : 0;

                if (pointsToDeduct > 0) {
                    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "Bonus", group: "Trừ điểm cũ để làm lại", score: -pointsToDeduct, score_earned: -pointsToDeduct, details: `Hệ thống tự trừ ${pointsToDeduct} điểm do dùng Vé sửa bài sai ở bài ${group}` } }) });
                    currentUser.score = Number(currentUser.score) - pointsToDeduct;
                }
                
                // 3. Ghi log RESET để hệ thống biết bài này bắt đầu lại từ số 0
                let resetTime = new Date().toISOString();
                await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "RESET", group: group, score: 0, score_earned: 0, details: curSub } }) });

                // 4. Cập nhật dữ liệu ngay trên máy học sinh
                Data.log = Data.log.filter(l => !(String(l.id) === String(currentUser.id) && l.group === group));
                Data.log.push({ id: currentUser.id, subject: "RESET", group: group, score: 0, time: resetTime, details: curSub });
                currentUser.veLamLai = tokens - 1;

                document.getElementById('loader').style.display = 'none';
                if(loaderP) loaderP.innerText = "ĐANG TẢI DỮ LIỆU...";
                
                // Khởi động lại bài thi
                window.startQuiz(group, time); 

            } catch (error) {
                alert("Lỗi mạng! Không thể kết nối đến máy chủ để dùng vé.");
                document.getElementById('loader').style.display = 'none';
                if(loaderP) loaderP.innerText = "ĐANG TẢI DỮ LIỆU...";
            }
        } 
    }
};

// ==========================================
// KHỐI CODE TỔNG HỢP: LÀM BÀI + GIAO DIỆN + BẢO MẬT CHỐNG HACK (ĐÃ VÁ LỖI)
// ==========================================

window.startQuiz = async function(group, timeMins) {
    window.isQuizActive = true; window.cheatWarnings = 0; curGrp = group; 
    
    // 1. Khởi tạo dữ liệu
    let rawQuiz = Data[curSub].filter(q => q.group === group); 
    quiz = []; 
    window.readingPassage = ""; 
    
    rawQuiz.forEach(q => {
        let qText = q.question || ""; if (q.image) { qText += `<br><div style="text-align: center;"><img src="${q.image}" class="max-w-full rounded-md mt-2"></div>`; } 
        let match = qText.match(/\[BAIDOC\](.*?)\[\/BAIDOC\]/s); 
        if (match) { window.readingPassage = match[1]; qText = qText.replace(match[0], '').trim(); } 
        else if (qText.includes('[ĐOẠN VĂN]')) { window.readingPassage = qText.replace('[ĐOẠN VĂN]', '').trim(); qText = ""; }
        if (qText !== "" || q.a || q.b || q.c || q.d) { quiz.push({ ...q, question: qText }); }
    });
    
    quiz = quiz.sort(() => Math.random() - 0.5); 
    window.currentQIndex = 0; score = 0; wrongAnswersLog = []; window.answeredQuestions = 0;

// 2. CHỐNG GIAN LẬN F5: Khôi phục trạng thái làm dở
    const localStateKey = `activeQuizState_${currentUser.id}`;
    let savedState = JSON.parse(localStorage.getItem(localStateKey));
    if (savedState && savedState.subject === curSub && savedState.group === curGrp) {
        // ĐÃ SỬA LẠI CÂU THÔNG BÁO THEO Ý THẦY HIỂN
        if (confirm("Hệ thống phát hiện con làm bài này chưa xong. Con có muốn tiếp tục không?")) {
            score = savedState.score || 0; 
            wrongAnswersLog = savedState.answersLog || []; 
            window.currentQIndex = savedState.quizIndex || 0; 
            window.answeredQuestions = savedState.quizIndex || 0;
            timeMins = (savedState.timer / 60) || timeMins;
        } else { 
            localStorage.removeItem(localStateKey); 
        }
    }

    // 3. GIAO DIỆN (Tắt nút X thoát) & LAYOUT TIẾNG VIỆT
    let subjectName = curSub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT';
    let headerColor = curSub === 'math' ? 'text-indigo-900' : 'text-green-700';
    let badgeColor = curSub === 'math' ? 'text-indigo-600 border-indigo-100' : 'text-green-600 border-green-100';

    let headerHtml = `<div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4 shadow-sm"><div class="flex items-center gap-3"><span class="font-black ${headerColor} uppercase truncate max-w-[200px] sm:max-w-md ml-4"><i class="fas fa-edit mr-2"></i>${subjectName} - ${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black ${badgeColor} shadow-sm border flex items-center gap-2 mr-4"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div>`;

    if (curSub === 'vietnamese' || curSub === 'tv') {
        if (!window.readingPassage) window.readingPassage = "Hãy đọc kỹ các câu hỏi bên phải và chọn đáp án đúng nhất nhé!";
        document.getElementById('content').innerHTML = `
            ${headerHtml}
            <div class="flex flex-col lg:flex-row gap-6 px-4">
                <div class="lg:w-1/2 bg-[#fffbeb] p-6 sm:p-8 rounded-[2rem] border-2 border-yellow-200 shadow-inner lg:h-[75vh] overflow-y-auto relative custom-scrollbar">
                    <div class="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1 rounded-bl-xl opacity-80">BÀI ĐỌC</div>
                    <h3 class="font-black text-yellow-800 text-xl mb-4 flex items-center gap-2 border-b-2 border-yellow-200 pb-3"><i class="fas fa-book-reader text-2xl"></i> NỘI DUNG ĐỌC HIỂU</h3>
                    <div class="text-slate-800 leading-[1.8] text-base sm:text-lg whitespace-pre-wrap font-medium pb-10 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${window.parseImg(window.readingPassage)}</div>
                </div>
                <div class="lg:w-1/2 flex flex-col" id="quizBox"></div>
            </div>
        `;
    } else { 
        document.getElementById('content').innerHTML = `
            ${headerHtml}
            <div id="quizBox" class="bg-white p-5 sm:p-8 rounded-[2rem] shadow-xl border-4 border-white min-h-[400px] text-base sm:text-lg flex flex-col mx-4"></div>
        `; 
    }

    // 4. Đánh dấu làm bài lên máy chủ
    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'start_quiz', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, type: 'start' } }) }); } catch(e) {}

    window.saveQuizState = function() {
        localStorage.setItem(localStateKey, JSON.stringify({ subject: curSub, group: curGrp, score: score, answersLog: wrongAnswersLog, quizIndex: window.currentQIndex, timer: window.remainingQuizTime }));
    }

    window.renderQuestion(window.currentQIndex); 
    window.startTimer(timeMins * 60); 
};

window.renderQuestion = function(index) { 
    window.currentQIndex = index; 
    if (index >= quiz.length) { window.finishQuiz(); return; } 
    const q = quiz[index]; let colorTheme = (curSub === 'vietnamese' || curSub === 'tv') ? 'text-green-600' : 'text-indigo-600'; 
    let wrapperClass = (curSub === 'vietnamese' || curSub === 'tv') ? 'bg-white p-6 rounded-[2rem] shadow-lg border-2 border-slate-100 flex-1 flex flex-col' : 'flex-1 flex flex-col';
    let questionHtml = window.parseImg(q.question); let isDragMode = /_{3,}/.test(questionHtml);

    if (isDragMode) {
        let dropCount = 0;
        questionHtml = questionHtml.replace(/_{3,}/g, () => {
            let id = 'drop-zone-' + dropCount; dropCount++;
            return `<div id="${id}" class="drop-zone inline-flex items-center justify-center min-w-[70px] h-10 border-2 border-dashed border-indigo-400 bg-indigo-50/50 rounded-xl align-middle mx-1.5 text-indigo-800 font-bold transition-all px-2 shadow-inner cursor-pointer hover:bg-indigo-100 empty:after:content-['Bấm_chọn'] empty:after:text-indigo-400 empty:after:opacity-70 empty:after:text-sm"></div>`;
        });
        let dragItemsHtml = ['a','b','c','d'].filter(k => q[k]).map(key => `
            <div class="drag-item p-3 bg-white border-2 border-indigo-200 rounded-xl shadow-sm text-center font-bold text-indigo-700 cursor-pointer hover:border-orange-400 transition-all active:scale-95 flex items-center justify-center" data-val="${key}">
                ${window.parseImg(q[key])}
            </div>
        `).join('');
        document.getElementById("quizBox").innerHTML = `
            <div class="${wrapperClass} fade-in">
                <div class="mb-6">
                    <div class="text-sm font-black ${colorTheme} mb-3 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200"><i class="fas fa-hand-pointer mr-1"></i> CÂU ${index + 1} / ${quiz.length} (CHỌN TỪ VÀO CHỖ TRỐNG)</div>
                    <div class="text-xl sm:text-2xl font-bold text-slate-800 leading-[2.2] [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${questionHtml}</div>
                </div>
                <div class="mt-auto">
                    <p class="text-xs font-bold text-orange-500 mb-2 text-center animate-pulse"><i class="fas fa-lightbulb"></i> Hướng dẫn: Bấm chọn 1 từ bên dưới, sau đó bấm vào ô trống để điền.</p>
                    <div id="drag-container" class="grid grid-cols-2 gap-3 min-h-[100px] p-4 bg-indigo-50/50 rounded-2xl border-2 border-dashed border-indigo-200 shadow-inner cursor-pointer">${dragItemsHtml}</div>
                    <button id="btnSubmitDrag" onclick="window.checkDragAns(${index})" class="hidden w-full mt-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg text-xl hover:scale-[1.02] transition"><i class="fas fa-check-circle mr-2"></i> CHỐT ĐÁP ÁN</button>
                </div>
            </div>`; 
        setTimeout(() => window.initDragAndDrop(index, q.correct), 100);
    } else {
        let optionsHtml = ['a','b','c','d'].filter(k => q[k]).map((key, idx) => {
            const colorList = ['text-blue-600', 'text-green-600', 'text-orange-600', 'text-red-600'];
            let labelColor = colorList[idx]; 
            // ẨN ĐÁP ÁN ĐÚNG KHỎI HTML F12
            return `<div onclick="window.checkAns(this, '${key}', ${index})" class="quiz-option p-4 sm:p-5 border-2 border-green-200 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-green-400 hover:bg-green-200 bg-green-50 transition btn-3d"><span class="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black ${labelColor} uppercase text-lg shrink-0 shadow-sm">${key}</span><div class="font-bold text-slate-800 flex-1 text-base sm:text-lg leading-relaxed">${window.parseImg(q[key])}</div></div>`;
        }).join('');
        document.getElementById("quizBox").innerHTML = `<div class="${wrapperClass} fade-in"><div class="mb-6"><div class="text-sm font-black ${colorTheme} mb-3 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">CÂU HỎI ${index + 1} / ${quiz.length}</div><div class="text-xl sm:text-2xl font-bold text-slate-800 leading-snug [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${questionHtml}</div></div><div class="space-y-4 mt-auto">${optionsHtml}</div></div>`; 
    }
};

window.initDragAndDrop = function(qIndex, correctKey) {
    const items = document.querySelectorAll('.drag-item'); const dropZones = document.querySelectorAll('.drop-zone');
    const container = document.getElementById('drag-container'); const btnSubmit = document.getElementById('btnSubmitDrag');
    if(dropZones.length === 0 || items.length === 0) return;
    let selectedItem = null;

    const checkSubmitState = () => { let allFilled = true; dropZones.forEach(dz => { if(dz.children.length === 0) allFilled = false; }); if(allFilled) btnSubmit.classList.remove('hidden'); else btnSubmit.classList.add('hidden'); };
    const clearSelection = () => { items.forEach(item => { item.classList.remove('ring-4', 'ring-orange-400', 'scale-105', 'bg-orange-50', 'shadow-md', 'border-orange-400', 'z-10'); item.classList.add('bg-white', 'border-indigo-200'); }); dropZones.forEach(dz => dz.classList.remove('ring-4', 'ring-orange-300', 'shadow-lg')); selectedItem = null; };

    items.forEach(item => {
        item.onclick = function(e) {
            e.stopPropagation();
            if (selectedItem === this) { clearSelection(); } else {
                clearSelection(); selectedItem = this;
                this.classList.remove('bg-white', 'border-indigo-200'); this.classList.add('ring-4', 'ring-orange-400', 'scale-105', 'bg-orange-50', 'shadow-md', 'border-orange-400', 'z-10');
                dropZones.forEach(dz => { if (dz.children.length === 0 || dz.children[0] !== this) { dz.classList.add('ring-4', 'ring-orange-300', 'shadow-lg'); } });
            }
        };
    });
    dropZones.forEach(dz => {
        dz.onclick = function(e) {
            e.stopPropagation();
            if (selectedItem) {
                if (this.children.length > 0 && this.children[0] !== selectedItem) { let oldItem = this.children[0]; container.appendChild(oldItem); oldItem.style.width = 'auto'; oldItem.style.height = 'auto'; }
                this.innerHTML = ''; this.appendChild(selectedItem); selectedItem.style.width = '100%'; selectedItem.style.height = '100%'; selectedItem.style.margin = '0';
                clearSelection(); checkSubmitState();
            } else if (this.children.length > 0) { this.children[0].click(); }
        };
    });
    container.onclick = function(e) {
        if (selectedItem && selectedItem.parentElement !== container) { container.appendChild(selectedItem); selectedItem.style.width = 'auto'; selectedItem.style.height = 'auto'; clearSelection(); checkSubmitState(); }
    };
};

window.checkDragAns = function(index) {
    document.querySelectorAll('.drag-item').forEach(x => x.style.pointerEvents = 'none'); document.getElementById('btnSubmitDrag').classList.add('hidden'); window.answeredQuestions++;
    let userAnsArr = []; document.querySelectorAll('.drop-zone').forEach(dz => { if(dz.children[0]) userAnsArr.push(dz.children[0].getAttribute('data-val')); });
    
    const q = quiz[index];
    let correctStr = q.correct;
    let userAnsStr = userAnsArr.join(',').toLowerCase(); let expectedStr = correctStr.toLowerCase().replace(/\s/g, ''); 
    
    if (userAnsStr === expectedStr) {
        document.querySelectorAll('.drop-zone').forEach(dz => { dz.classList.add('!bg-green-100', '!border-green-500'); dz.children[0].classList.add('!bg-green-100', '!text-green-800', '!border-transparent'); });
        score += 10;
    } else {
        document.querySelectorAll('.drop-zone').forEach(dz => { dz.classList.add('!bg-red-100', '!border-red-500'); dz.children[0].classList.add('!bg-red-100', '!text-red-800', '!border-transparent'); });
        let questionReplaced = window.parseImg(q.question).replace(/_{3,}/g, '[___]');
        let userAnsText = userAnsArr.map(k => q[k] ? window.parseImg(q[k]).replace(/<[^>]*>?/gm, '') : '').join(' | ');
        let expectedArr = expectedStr.split(','); let expectedAnsText = expectedArr.map(k => q[k] ? window.parseImg(q[k]).replace(/<[^>]*>?/gm, '') : '').join(' | ');
        wrongAnswersLog.push(`<div class="bg-white p-4 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-red-500">Câu ${index+1}:</span> ${questionReplaced}</p><div class="space-y-2 mt-3"><p class="text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-100"><i class="fas fa-times-circle mr-1"></i> <b>Bé ghép sai (${userAnsStr.toUpperCase()}):</b> <span class="font-medium">${userAnsText}</span></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng (${expectedStr.toUpperCase()}):</b> <span class="font-medium">${expectedAnsText}</span></p></div></div>`);
    }
    
    window.currentQIndex = index + 1; 
    if (typeof window.saveQuizState === 'function') window.saveQuizState();
    setTimeout(() => window.renderQuestion(window.currentQIndex), 1500);
};

window.checkAns = function(el, selected, index) { 
    document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70')); 
    window.answeredQuestions++;
    const q = quiz[index];
    const correct = q.correct.toLowerCase();

    if (selected === correct) { 
        el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800', 'scale-[1.02]'); score += 10;
    } 
    else { 
        el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800', 'scale-[0.98]');
        wrongAnswersLog.push(`<div class="bg-white p-4 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-red-500">Câu ${index+1}:</span> ${window.parseImg(q.question)}</p><div class="space-y-2 mt-3"><p class="text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-100"><i class="fas fa-times-circle mr-1"></i> <b>Bé chọn (${selected.toUpperCase()}):</b> <span class="font-medium">${window.parseImg(q[selected])}</span></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng (${correct.toUpperCase()}):</b> <span class="font-medium">${window.parseImg(q[correct])}</span></p></div></div>`);
    } 
    
    window.currentQIndex = index + 1;
    if (typeof window.saveQuizState === 'function') window.saveQuizState();
    setTimeout(() => window.renderQuestion(window.currentQIndex), 1200); 
};

window.startTimer = function(seconds) { 
    if (timer) clearInterval(timer); window.totalQuizTime = seconds; window.remainingQuizTime = seconds;
    timer = setInterval(() => { 
        let m = Math.floor(window.remainingQuizTime / 60); let s = window.remainingQuizTime % 60; 
        document.getElementById('quizTimer').innerText = `${m}:${s < 10 ? '0' + s : s}`; 
        if (window.remainingQuizTime <= 0) { clearInterval(timer); alert("Hết giờ làm bài!"); window.finishQuiz(); } 
        window.remainingQuizTime--; 
        if (typeof window.saveQuizState === 'function') window.saveQuizState();
    }, 1000); 
};

window.finishQuiz = async function() { 
    window.isQuizActive = false; if (timer) clearInterval(timer); 
    const maxPossibleScore = quiz.length * 10; 
    let timeTaken = window.totalQuizTime - window.remainingQuizTime; 
    let halfTime = window.totalQuizTime / 2; let extraSpinsEarned = 0; let rewardMessage = "";

    // CHỐNG HACK ĐIỂM F12: Tính điểm chuẩn từ số câu làm sai/bỏ trống
    if (typeof window.answeredQuestions !== 'undefined' && window.answeredQuestions < quiz.length) {
        for (let i = window.answeredQuestions; i < quiz.length; i++) {
            let q = quiz[i]; let qTextReplaced = window.parseImg(q.question).replace(/_{3,}/g, '[___]'); let correctStr = q.correct.toLowerCase().replace(/\s/g, ''); let expectedAnsText = "";
            if (correctStr.length === 1 && ['a','b','c','d'].includes(correctStr)) { expectedAnsText = window.parseImg(q[correctStr]); } 
            else { let expectedArr = correctStr.split(','); expectedAnsText = expectedArr.map(k => q[k] ? window.parseImg(q[k]).replace(/<[^>]*>?/gm, '') : '').join(' | '); }
            wrongAnswersLog.push(`<div class="bg-white p-4 rounded-xl border border-orange-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-orange-500">Câu ${i+1} (Bỏ trống):</span> ${qTextReplaced}</p><div class="space-y-2 mt-3"><p class="text-orange-600 text-sm bg-orange-50 p-2 rounded-lg border border-orange-100"><i class="fas fa-exclamation-triangle mr-1"></i> <b>Hết giờ / Bị ép nộp (Chưa làm)</b></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng:</b> <span class="font-medium">${expectedAnsText}</span></p></div></div>`);
        }
    }

    // ĐỐI CHIẾU AN TOÀN KÉP
    let secureScore = (quiz.length * 10) - (wrongAnswersLog.length * 10);
    if (secureScore < 0) secureScore = 0;
    score = secureScore; // Khóa chết điểm số, không cho sửa bậy

    let previousLogs = Data.log.filter(l => String(l.id) === String(currentUser.id) && l.subject === curSub && l.group === curGrp);
    let previousMaxScore = previousLogs.length > 0 ? Math.max(...previousLogs.map(l => Number(l.score) || 0)) : 0;
    let actualScoreEarned = score - previousMaxScore; if (actualScoreEarned < 0) actualScoreEarned = 0; 

    if (score > 0 && score === maxPossibleScore) { 
        let previousMaxLog = previousLogs.find(l => Number(l.score) === maxPossibleScore);
        if (!previousMaxLog && currentUser.role === 'student') {
            if (timeTaken <= halfTime) { extraSpinsEarned = 2; rewardMessage = `<div class="bg-green-50 border border-green-200 p-3 rounded-xl mt-4"><p class="text-green-700 font-bold text-sm"><i class="fas fa-bolt text-orange-500 mr-1 text-lg"></i> KỶ LỤC TỐC ĐỘ! Đúng 100% siêu nhanh. Thưởng <b>+2 Lượt quay</b>!</p></div>`; } 
            else { extraSpinsEarned = 1; rewardMessage = `<div class="bg-green-50 border border-green-200 p-3 rounded-xl mt-4"><p class="text-green-700 font-bold text-sm"><i class="fas fa-gift text-red-500 mr-1 text-lg"></i> XUẤT SẮC! Đúng 100%. Thưởng <b>+1 Lượt quay</b>!</p></div>`; }
            window.updateKhoDoCloud(extraSpinsEarned, 0);
        } else if (previousMaxLog && currentUser.role === 'student') { rewardMessage = `<p class="text-slate-400 font-bold mt-4 text-xs italic">Con đã từng đạt điểm tối đa bài này rồi nên không nhận thêm thưởng nữa nhé.</p>`; }
        window.safeConfetti(); 
    } 
    
    let scoreMsg = actualScoreEarned > 0 ? `<p class="text-green-600 font-bold text-sm mt-2">+${actualScoreEarned} điểm vào tổng kết</p>` : `<p class="text-slate-400 font-bold text-sm mt-2">Làm lại bài (Không cộng thêm điểm)</p>`;
    
    document.getElementById('content').innerHTML = `<div class="text-center bg-white p-10 rounded-[3rem] shadow-2xl fade-in max-w-lg mx-auto mt-10 border-t-8 border-indigo-500"><div class="text-7xl mb-6 animate-bounce">🏆</div><h3 class="text-3xl font-black text-slate-800 mb-2 uppercase tracking-wider">ĐIỂM CỦA CON</h3><p id="finalScoreDisplay" class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 drop-shadow-sm">${score}</p>${scoreMsg}${rewardMessage}<button id="btnFinishQuizWait" disabled class="bg-slate-300 text-slate-600 px-10 py-5 rounded-2xl font-black text-xl shadow-inner w-full mt-6 cursor-wait flex items-center justify-center gap-3 transition"><i class="fas fa-spinner fa-spin"></i> ĐANG LƯU ĐIỂM...</button></div>`; 
    
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'finish_quiz', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score } }) });
        
        // Mở khóa bài làm trên máy local
        localStorage.removeItem(`activeQuizState_${currentUser.id}`);
        
        if(currentUser.role === 'student') { 
            let submitTime = new Date().toISOString(); 
            let detailsToSave = wrongAnswersLog.join('');
            if (extraSpinsEarned > 0) { detailsToSave += `<br><div style="color:green; font-weight:bold; background:#f0fdf4; padding:5px; border-radius:5px;">(Hệ thống tự động: Đã thưởng ${extraSpinsEarned} lượt quay)</div>`; }
            currentUser.score = Number(currentUser.score) + actualScoreEarned;
            
            // Ghi log lên máy chủ
            fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: actualScoreEarned, details: detailsToSave } }) }).catch(e => console.log("Lỗi mạng ngầm"));
            Data.log.push({ id: currentUser.id, subject: curSub, group: curGrp, score: score, real_added: actualScoreEarned, time: submitTime, details: detailsToSave }); 
        }
    } catch(e) { console.log("Lỗi khi kết thúc quiz"); }
    finally {
        let btn = document.getElementById('btnFinishQuizWait');
        if (btn) {
            btn.disabled = false;
            btn.className = "bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl btn-3d shadow-lg w-full hover:scale-[1.02] transition mt-6";
            btn.innerHTML = `<i class="fas fa-check-circle mr-1"></i> HOÀN TẤT & TRỞ VỀ`;
            btn.onclick = function() { window.loadSubject(curSub); };
        }
    }
};

// ==========================================

// ==========================================
// 5. VÒNG QUAY MAY MẮN (CÓ BẢO MẬT & CLOUD)
// ==========================================
window.tinhLuotQuayHienTai = function() {
    if (!currentUser) return 0;
    let today = new Date();
    let daQuayHomNay = Data.log.some(l => {
        if (String(l.id) !== String(currentUser.id) || l.subject !== "LuckySpin") return false;
        let d = new Date(l.time);
        return !isNaN(d) && d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    
    let freeSpin = daQuayHomNay ? 0 : 1;
    let weekendBonus = 0; let d = today.getDay();
    if (!daQuayHomNay && (d === 0 || d === 5 || d === 6)) {
        let chucVu = currentUser.chucvu ? String(currentUser.chucvu).toLowerCase() : "";
        let userInfoStr = JSON.stringify(currentUser).toLowerCase();
        let isOfficer = chucVu.includes('lớp trưởng') || userInfoStr.includes('lớp trưởng') || chucVu.includes('phó') || userInfoStr.includes('phó') || chucVu.includes('tt') || userInfoStr.includes('tt');
        if (isOfficer) weekendBonus = 1;
    }
    let cloudSpins = Number(currentUser.luotQuay) || 0;
    return freeSpin + weekendBonus + cloudSpins;
};

// ==========================================
// 5. VÒNG QUAY MAY MẮN (ĐÃ TÍCH HỢP KIỂM TRA LỆNH PHẠT)
// ==========================================
window.moVongQuay = async function() {
    if(!currentUser) return showLogin(); closeMenu(); 
    
    // KIỂM TRA LỆNH KHÓA TỪ GVCN
    let blockUntil = window.checkIsBlocked ? window.checkIsBlocked(currentUser.id) : false;
    if (blockUntil) {
        alert("🚨 TÍNH NĂNG BỊ KHOÁ");
        if (window.veTrangChu) veTrangChu();
        return;
    }

    document.getElementById('content').innerHTML = `<div class="text-center py-10 mt-10"><i class="fas fa-dharmachakra fa-spin text-5xl text-yellow-500 mb-4 shadow-sm rounded-full"></i><p class="font-black text-slate-500 animate-pulse tracking-widest uppercase">Đang đồng bộ kho đồ đám mây...</p></div>`;
    if (!(await window.loadAllDataOnce(true))) return;

    let tongLuot = window.tinhLuotQuayHienTai();
    if (tongLuot <= 0) {
        alert("🛡️ HỆ THỐNG: Con đã dùng hết lượt quay của ngày hôm nay! Hãy làm bài tập đạt 100% để được Thầy thưởng thêm lượt nhé.");
        return veTrangChu();
    }

    let sliceAngle = 360 / PRIZES.length; let halfSlice = sliceAngle / 2;
    let slicesHtml = PRIZES.map((p, i) => `<div class="absolute inset-0 flex justify-center" style="transform: rotate(${i * sliceAngle}deg);"><div class="pt-5 font-black text-white text-[10px] sm:text-[11px] drop-shadow-md w-14 text-center leading-tight z-20" style="transform: rotate(0deg);">${p.text}</div></div>`).join('');
    let gradColors = PRIZES.map((p, i) => `${p.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ');

    document.getElementById('content').innerHTML = `
        ${window.getNavHtml('vongquay')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in">
            <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase text-yellow-500">Vòng Quay May Mắn</h2>
            <div class="flex justify-center items-center gap-4 mb-6"><p class="text-slate-500 font-bold text-sm">Điểm: <span id="vqCurrentScore" class="text-indigo-600 font-black text-lg">${currentUser.score || 0}</span></p><p class="text-slate-500 font-bold text-sm border-l-2 pl-4">Lượt quay: <span class="text-orange-500 font-black text-lg">${tongLuot}</span></p></div>
            <div class="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-8"><div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-5xl text-yellow-500 drop-shadow-xl z-30 animate-bounce"><i class="fas fa-caret-down"></i></div><div id="wheel" class="w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl relative overflow-hidden" style="background: conic-gradient(from -${halfSlice}deg, ${gradColors}); transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);">${slicesHtml}<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-30 shadow-inner flex items-center justify-center text-xl">🎡</div></div></div>
            <button id="btnSpin" onclick="window.thucHienQuay()" class="inline-block bg-gradient-to-r from-red-500 to-yellow-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition mb-6 cursor-pointer hover:scale-[1.02]">BẮT ĐẦU</button>
            <div id="spinHistoryContainer" class="max-w-sm mx-auto transition-all"></div>
        </div>
    `;
    let todayStr = new Date().toLocaleDateString('vi-VN'); window.renderSpinHistory(todayStr); 
};

window.thucHienQuay = async function() {
    if(isSpinning) return;
    let tongLuot = window.tinhLuotQuayHienTai();
    if (tongLuot <= 0) return alert("Con đã hết lượt quay!");

    isSpinning = true;
    let btn = document.getElementById('btnSpin'); btn.classList.add('opacity-50', 'pointer-events-none');
    
    let today = new Date();
    let daQuayHomNay = Data.log.some(l => {
        if (String(l.id) !== String(currentUser.id) || l.subject !== "LuckySpin") return false;
        let d = new Date(l.time);
        return !isNaN(d) && d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
    
    if (daQuayHomNay) { window.updateKhoDoCloud(-1, 0); }

    let chucVu = currentUser.chucvu ? String(currentUser.chucvu).toLowerCase() : "";
    let userInfoStr = JSON.stringify(currentUser).toLowerCase(); 
    let isLopTruong = chucVu.includes('lớp trưởng') || userInfoStr.includes('lớp trưởng');
    let isLopPho = chucVu.includes('phó') || userInfoStr.includes('phó') || chucVu.includes('tt') || userInfoStr.includes('tt');

    let rand = Math.random() * 100; let idx = 0;
    if (isLopTruong) { if (rand < 10) idx = 0; else if (rand < 25) idx = 1; else if (rand < 50) idx = 2; else if (rand < 55) idx = 3; else if (rand < 65) idx = 4; else if (rand < 70) idx = 5; else idx = 6; } 
    else if (isLopPho) { if (rand < 10) idx = 0; else if (rand < 25) idx = 1; else if (rand < 60) idx = 2; else if (rand < 65) idx = 3; else if (rand < 75) idx = 4; else if (rand < 80) idx = 5; else idx = 6; } 
    else { if (rand < 10) idx = 0; else if (rand < 30) idx = 1; else if (rand < 70) idx = 2; else if (rand < 75) idx = 3; else if (rand < 85) idx = 4; else if (rand < 90) idx = 5; else idx = 6; }

    let sliceAngle = 360 / PRIZES.length; let wheel = document.getElementById('wheel'); 
    let currentRot = parseFloat(wheel.getAttribute('data-rot') || 0);
    let nextRot = currentRot + (360 * 5) + (360 - (currentRot % 360)) - (idx * sliceAngle); 
    wheel.style.transform = `rotate(${nextRot}deg)`; wheel.setAttribute('data-rot', nextRot);
    
    let todayStr = new Date().toLocaleDateString('vi-VN'); 
    
    setTimeout(async () => {
        isSpinning = false; let uniqueGroup = "Vòng quay ngày " + todayStr + " (" + Date.now() + ")"; let finalPrize = {...PRIZES[idx]};
        let addSpins = 0; let addTickets = 0;

        if (finalPrize.id === 'chest') {
            let chestRand = Math.floor(Math.random() * 3);
            if (chestRand === 0) { finalPrize.netScore = 10; addSpins = 2; finalPrize.msg = "Tuyệt vời! Rương chứa: <b>2 Lượt quay</b> và <b>10 Điểm</b>."; } 
            else if (chestRand === 1) { finalPrize.netScore = 30; addSpins = 1; finalPrize.msg = "Tuyệt vời! Rương chứa: <b>1 Lượt quay</b> và <b>30 Điểm</b>."; } 
            else { finalPrize.netScore = 20; addTickets = 1; finalPrize.msg = "Tuyệt vời! Rương chứa: <b>1 Vé làm bài</b> và <b>20 Điểm</b>."; }
        }

        if (finalPrize.extraSpin > 0) addSpins += finalPrize.extraSpin;
        if (finalPrize.id === 'redo') addTickets += 1;
        if (addSpins > 0 || addTickets > 0) { window.updateKhoDoCloud(addSpins, addTickets); }
        if (finalPrize.id === 'riddle') { window.showRiddleModal(todayStr, uniqueGroup); return; }

        window.showPrizeModal(finalPrize);
        if (finalPrize.netScore !== 0) { currentUser.score = Number(currentUser.score) + finalPrize.netScore; document.getElementById('vqCurrentScore').innerText = currentUser.score; }
        
        try { 
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score_earned: finalPrize.netScore, details: "Quay trúng: " + finalPrize.text + (finalPrize.id === 'chest' ? " ("+finalPrize.msg+")" : "") } }) }); 
            Data.log.push({ id: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score: finalPrize.netScore, time: new Date().toISOString(), details: "Quay trúng: " + finalPrize.text }); 
            window.renderSpinHistory(todayStr);
        } catch(e) {}
        
        if (finalPrize.netScore > 0 || addSpins > 0 || addTickets > 0) { window.safeConfetti(); }
        
        let newTongLuot = window.tinhLuotQuayHienTai();
        if (newTongLuot > 0) { btn.className = "inline-block bg-gradient-to-r from-red-500 to-yellow-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition hover:scale-[1.02] cursor-pointer mb-6"; btn.innerText = `BẮT ĐẦU (${newTongLuot} LƯỢT)`; } 
        else { btn.className = "inline-block bg-gradient-to-r from-slate-400 to-slate-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg text-xl transition opacity-50 pointer-events-none mb-6"; btn.innerText = "ĐÃ HẾT LƯỢT HÔM NAY"; }
    }, 4000);
};

window.checkSpinStatus = function(spinLog, todayStr) {
    window.renderSpinHistory(todayStr); 
};

window.restoreSpinButton = function(spinLog) {
    let btnUpdate = document.getElementById('btnSpin'); if (!btnUpdate) return;
    let tongLuot = window.tinhLuotQuayHienTai();
    if (tongLuot > 0) { btnUpdate.className = "inline-block bg-gradient-to-r from-red-500 to-yellow-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition hover:scale-[1.02] cursor-pointer mb-6"; btnUpdate.innerText = `BẮT ĐẦU (${tongLuot} LƯỢT)`; } 
    else { btnUpdate.className = "inline-block bg-gradient-to-r from-slate-400 to-slate-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg text-xl transition opacity-50 pointer-events-none mb-6"; btnUpdate.innerText = "ĐÃ HẾT LƯỢT HÔM NAY"; }
};

window.renderSpinHistory = function(todayStr) {
    let container = document.getElementById('spinHistoryContainer'); if (!container) return;
    let todayLogs = Data.log.filter(l => l.subject === "LuckySpin" && String(l.group).includes(todayStr));
    if (todayLogs.length === 0) { container.innerHTML = `<div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center"><p class="text-sm font-bold text-slate-400"><i class="fas fa-info-circle"></i> Hôm nay chưa có bạn nào thử vận may.</p></div>`; return; }
    
    todayLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); 
    
    let listItems = todayLogs.map(l => {
        let hs = Data.hs.find(x => String(x.id) === String(l.id)); 
        let name = hs ? hs.name : "Một bạn"; 
        let prizeText = (l.details || "").replace("Quay trúng: ", "").split(" (")[0]; 
        let textStyle = "text-orange-600 font-bold";
        
        if(prizeText.includes("Kho Báu")) textStyle = "text-red-600 font-black animate-pulse"; 
        if(prizeText.includes("Mất Lượt") || prizeText.includes("-10")) textStyle = "text-slate-400 font-medium";
        
        // TÍCH HỢP: Lấy link ảnh đại diện của học sinh
        let avatarUrl = window.layAnhDaiDien ? window.layAnhDaiDien(l.id, name) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=random&color=fff';
        
        // Render kèm hình ảnh (thẻ <img>)
        return `<div class="py-2.5 border-b border-orange-100/50 last:border-0 text-[13px] text-slate-600 flex justify-between items-center"><div class="flex items-center gap-2 overflow-hidden mr-2"><img src="${avatarUrl}" class="w-6 h-6 rounded-full object-cover border border-orange-200 shrink-0 shadow-sm"><span class="font-black text-blue-600 truncate">${name}</span></div> <span class="text-right shrink-0 ${textStyle}">${prizeText}</span></div>`;
    }).join('');

    let spacer = todayLogs.length < 4 ? `<div class="py-4 text-center text-orange-300 text-[11px] font-bold italic border-b border-orange-100/50">... chờ các bạn khác ...</div>` : ""; let animDuration = Math.max(todayLogs.length * 2.5, 10);
    container.innerHTML = `<div class="bg-orange-50/50 rounded-2xl border border-orange-200 relative overflow-hidden shadow-inner h-40 group"><div class="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-orange-50 to-transparent z-10 pointer-events-none"></div><div class="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-orange-50 to-transparent z-10 pointer-events-none"></div><h3 class="text-[11px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 py-2 text-center border-b border-orange-200 relative z-20 shadow-sm"><i class="fas fa-gift mr-1"></i> Trạm Nhận Quà</h3><div class="overflow-hidden h-[120px] relative px-4"><div class="animate-scroll-down flex flex-col group-hover:[animation-play-state:paused] pt-2">${listItems}${spacer}${listItems}${spacer}</div></div><style>@keyframes scrollDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } } .animate-scroll-down { animation: scrollDown ${animDuration}s linear infinite; }</style></div>`;
};

window.showRiddleModal = function(todayStr, uniqueGroup) {
    let isMath = Math.random() < 0.5; let questionStr = ""; let correctAns = ""; let inputType = "text";
    if (isMath || !Data.caudo || Data.caudo.length === 0) {
        isMath = true; inputType = "number"; let type = Math.floor(Math.random() * 3);
        if (type === 0) { let a = Math.floor(Math.random() * 30) + 10; let b = Math.floor(Math.random() * 10) + 2; let c = Math.floor(Math.random() * 10) + 2; correctAns = (a + b * c).toString(); questionStr = `${a} + ${b} x ${c}`; } 
        else if (type === 1) { let a = Math.floor(Math.random() * 89) + 11; let b = Math.floor(Math.random() * 89) + 11; correctAns = (a * b).toString(); questionStr = `${a} x ${b}`; } 
        else { let divisor = Math.floor(Math.random() * 89) + 11; let quotient = Math.floor(Math.random() * 89) + 11; let dividend = divisor * quotient; correctAns = quotient.toString(); questionStr = `${dividend} : ${divisor}`; }
    } else {
        let r = Data.caudo[Math.floor(Math.random() * Data.caudo.length)]; questionStr = r.cauhoi; correctAns = r.dapan;
    }

    let overlay = document.createElement('div'); overlay.id = "riddleModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in p-4";
    let textSize = isMath ? "text-3xl" : "text-xl sm:text-2xl"; 
    overlay.innerHTML = `<div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-purple-500 animate-[cascadeDrop_0.5s_ease-out_forwards]"><div class="text-6xl mb-4 animate-bounce">🧠</div><h3 class="text-2xl font-black text-purple-600 mb-2 uppercase">Thử Tài Giải Đố</h3><p class="text-slate-600 font-bold mb-4">Trả lời đúng để nhận ngay 20 điểm:</p><div class="bg-purple-50 text-purple-800 ${textSize} font-black p-4 rounded-xl mb-6 shadow-inner border border-purple-200 leading-snug">${questionStr}${isMath ? ' = ?' : ''}</div><input type="${inputType}" id="riddleAns" class="w-full p-4 border-2 border-purple-200 rounded-xl font-bold text-xl text-center mb-6 focus:border-purple-500 outline-none" placeholder="Đáp án của con..."><button onclick="window.checkRiddle('${correctAns}', '${todayStr}', '${uniqueGroup}')" class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-black shadow-lg btn-3d hover:scale-[1.02] transition">TRẢ LỜI</button><button onclick="document.getElementById('riddleModal').remove(); window.isSpinning=false; window.restoreSpinButton();" class="w-full mt-4 text-slate-400 font-bold hover:text-slate-600 transition">Đóng</button></div>`;
    document.body.appendChild(overlay); setTimeout(() => document.getElementById('riddleAns').focus(), 100);
};

window.checkRiddle = async function(correctAnsStr, todayStr, uniqueGroup) {
    let ansStr = document.getElementById('riddleAns').value.trim().toLowerCase(); 
    if(!ansStr) return alert("Con chưa nhập đáp án kìa!"); document.getElementById('riddleModal').remove();
    let prize = { icon: "", text: "Giải Đố", color: "", msg: "", netScore: 0 };
    
    if (ansStr === correctAnsStr.toLowerCase().trim()) { prize.netScore = 20; prize.msg = "Giỏi quá! Con trả lời đúng và được thưởng 20 điểm."; prize.icon = "🎉"; prize.color = "#34d399"; } 
    else { prize.msg = `Tiếc quá! Đáp án đúng là "${correctAnsStr}". Hãy cẩn thận hơn ở lần sau nhé!`; prize.icon = "😅"; prize.color = "#f87171"; }
    
    if (prize.netScore !== 0) { currentUser.score = Number(currentUser.score) + prize.netScore; document.getElementById('vqCurrentScore').innerText = currentUser.score; }
    window.showPrizeModal(prize);
    
    try { 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score_earned: prize.netScore, details: "Quay trúng: Giải đố (" + prize.netScore + "đ)" } }) }); 
        Data.log.push({ id: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score: prize.netScore, time: new Date().toISOString(), details: "Quay trúng: Giải đố (" + prize.netScore + "đ)" }); 
        window.renderSpinHistory(todayStr); 
    } catch(e) {}
    
    if (prize.netScore > 0) window.safeConfetti(); 
    window.restoreSpinButton();
};

window.showPrizeModal = function(prize) {
    let overlay = document.createElement('div'); overlay.id = "prizeModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `<div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 animate-[cascadeDrop_0.5s_ease-out_forwards]" style="border-color: ${prize.color}"><div class="text-7xl mb-4 animate-bounce">${prize.icon}</div><h3 class="text-2xl font-black text-slate-800 mb-2">${prize.text}</h3><p class="text-slate-600 font-bold mb-6 text-sm">${prize.msg}</p><button onclick="document.getElementById('prizeModal').remove()" class="w-full text-white py-3 rounded-xl font-black shadow-md transition hover:opacity-80" style="background-color: ${prize.color}">ĐÓNG</button></div>`;
    document.body.appendChild(overlay);
};

// ==========================================
// 6. QUẢN LÝ TIẾN ĐỘ THÔNG MINH (ĐÃ ĐẢO THỨ TỰ DANH HIỆU)
// ==========================================
window.calculateTitle = function(student) {
    if (!window.Data || !Data.math || !Data.tv || !Data.log) return "";
    const mathGroupsAll = [...new Set(Data.math.map(x => x.group))].filter(g => g); const tvGroupsAll = [...new Set(Data.tv.map(x => x.group))].filter(g => g);
    const totalAssignments = mathGroupsAll.length + tvGroupsAll.length;
    const userLogs = Data.log.filter(l => String(l.id) === String(student.id));
    const doneMath = new Set(userLogs.filter(l => l.subject === 'math' && mathGroupsAll.includes(l.group)).map(l => l.group)).size;
    const doneTv = new Set(userLogs.filter(l => (l.subject === 'vietnamese' || l.subject === 'tv') && tvGroupsAll.includes(l.group)).map(l => l.group)).size;
    const isOngVang = (totalAssignments > 0 && (doneMath + doneTv) >= totalAssignments);

    let titlesHtml = "";
    let scoreVal = Number(student.score) || 0; 
    
    // ƯU TIÊN 1: CHÈN DANH HIỆU ĐIỂM SỐ TRƯỚC
    let titleBadge = "";
    if (scoreVal >= 5000) titleBadge = `<div class="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center shadow-sm w-fit"><i class="fas fa-star mr-1"></i>Ngôi Sao Tri Thức</div>`;
    else if (scoreVal >= 4000) titleBadge = `<div class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center shadow-sm w-fit"><i class="fas fa-award mr-1"></i>Học Sinh Ưu Tú</div>`;
    else if (scoreVal >= 3000) titleBadge = `<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center shadow-sm w-fit"><i class="fas fa-medal mr-1"></i>Học Giả Nhí</div>`;
    
    if (titleBadge) titlesHtml += titleBadge;

    // ƯU TIÊN 2: CHÈN HUY HIỆU ONG VÀNG XUỐNG DƯỚI
    let ongVangBadge = isOngVang ? `<div class="text-[10px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-400 inline-flex items-center shadow-sm w-fit">Ong Vàng Chăm Chỉ</div>` : "";
    if (ongVangBadge) titlesHtml += (titlesHtml ? " " : "") + ongVangBadge;

    return titlesHtml;
};

window.moTienDo = async function() { 
    closeMenu(); if (!(await window.loadAllDataOnce())) return;
    const mathGroups = [...new Set(Data.math.map(x=>x.group))].filter(g=>g); 
    const tvGroups = [...new Set(Data.tv.map(x=>x.group))].filter(g=>g); 
    const allGroups = [...new Set([...mathGroups, ...tvGroups])].sort((a, b) => { let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); });
    
    window.totalMathAssignments = mathGroups.length; window.totalTvAssignments = tvGroups.length;
    let filterGroupHtml = `<option value="all">Tất cả Bài tập / Tuần</option>` + allGroups.map(g => `<option value="${g}">${g}</option>`).join('');

    let html = `
        <div class="flex items-center mb-4"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600 uppercase">TIẾN ĐỘ HỌC TẬP</h2></div>
        <div class="bg-white p-4 sm:p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-6 fade-in">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div><label class="text-[10px] font-black text-slate-400 uppercase mb-1 block"><i class="fas fa-book"></i> Môn học</label><select id="filterProgSub" onchange="window.renderDanhSachTienDo()" class="w-full bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-400"><option value="all">Tất cả Môn</option><option value="math">📐 Toán</option><option value="tv">📖 Tiếng Việt</option></select></div>
                <div><label class="text-[10px] font-black text-slate-400 uppercase mb-1 block"><i class="fas fa-filter"></i> Lọc Bài / Tuần</label><select id="filterProgGroup" onchange="window.renderDanhSachTienDo()" class="w-full bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-400">${filterGroupHtml}</select></div>
                <div><label class="text-[10px] font-black text-slate-400 uppercase mb-1 block"><i class="fas fa-bullseye"></i> Lọc Mức điểm</label><select id="filterProgScore" onchange="window.renderDanhSachTienDo()" class="w-full bg-slate-50 border-2 border-slate-200 p-2.5 rounded-xl font-bold text-slate-700 outline-none focus:border-purple-400"><option value="all">Tất cả mức điểm</option><option value="100">💯 100đ (Tuyệt đối)</option><option value="90">🟢 Từ 90 - 100đ (Giỏi)</option><option value="70">🟡 Từ 70 - 89đ (Khá)</option><option value="50">🟠 Từ 50 - 69đ (TB)</option><option value="0">🔴 Dưới 50đ (Cố gắng)</option></select></div>
            </div>
            <p class="text-[11px] text-slate-400 mt-4 italic text-center"><i class="fas fa-info-circle"></i> Bản đồ nhiệt được tách thành 2 thanh riêng biệt cho Toán và Tiếng Việt.</p>
        </div>
        <div id="danhSachTienDoRender" class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10 fade-in"></div>
    `; 
    document.getElementById('content').innerHTML = html; window.renderDanhSachTienDo();
};

window.renderDanhSachTienDo = function() {
    let fSub = document.getElementById('filterProgSub').value; let fGroup = document.getElementById('filterProgGroup').value; let fScore = document.getElementById('filterProgScore').value;
    let htmlList = ""; let tMath = window.totalMathAssignments; let tTv = window.totalTvAssignments;
    
    let filteredStudents = Data.hs.filter(h => {
        if (fSub === 'all' && fGroup === 'all' && fScore === 'all') return true;
        let userLogs = Data.log.filter(l => String(l.id) === String(h.id) && ['math', 'tv', 'vietnamese'].includes(l.subject));
        if (fSub === 'math') userLogs = userLogs.filter(l => l.subject === 'math');
        if (fSub === 'tv') userLogs = userLogs.filter(l => l.subject === 'tv' || l.subject === 'vietnamese');

        let validLogsForGroup = userLogs;
        if (fGroup !== 'all') { validLogsForGroup = userLogs.filter(l => l.group === fGroup); if (validLogsForGroup.length === 0) return false; }
        if (fScore !== 'all') {
            if (validLogsForGroup.length === 0) return false; 
            let pct = 0;
            validLogsForGroup.forEach(l => {
                let qs = (l.subject === 'math') ? Data.math : Data.tv;
                let count = qs.filter(q => q.group === l.group && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length; 
                let maxPoss = count * 10 || 100; let currentPct = (Number(l.score) / maxPoss) * 100;
                if (currentPct > pct) pct = currentPct;
            });
            if (fScore === "100" && pct < 100) return false;
            if (fScore === "90" && (pct < 90 || pct >= 100)) return false;
            if (fScore === "70" && (pct < 70 || pct > 89)) return false;
            if (fScore === "50" && (pct < 50 || pct > 69)) return false;
            if (fScore === "0" && pct >= 50) return false;
        }
        return true;
    });

    if (filteredStudents.length === 0) { document.getElementById('danhSachTienDoRender').innerHTML = `<div class="col-span-full text-center py-10 opacity-60"><i class="fas fa-search text-5xl text-slate-300 mb-3"></i><p class="font-bold text-slate-400">Không tìm thấy học sinh nào phù hợp với bộ lọc.</p></div>`; return; }

    const buildSegments = (logs, subjectCode, totalAssigments) => {
        let uniqueDoneGroups = {}; let subLogs = logs.filter(l => subjectCode === 'math' ? l.subject === 'math' : (l.subject === 'tv' || l.subject === 'vietnamese'));
        subLogs.forEach(l => {
            let qs = (l.subject === 'math') ? Data.math : Data.tv;
            let count = qs.filter(q => q.group === l.group && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length; 
            let maxPoss = count * 10 || 100; let currentPct = (Number(l.score) / maxPoss) * 100;
            if (!uniqueDoneGroups[l.group] || currentPct > uniqueDoneGroups[l.group].pct) { uniqueDoneGroups[l.group] = { pct: currentPct }; }
        });

        let doneCount = Object.keys(uniqueDoneGroups).length; if (doneCount > totalAssigments) doneCount = totalAssigments;
        let segmentsHtml = "";
        Object.values(uniqueDoneGroups).forEach(item => {
            let color = 'bg-red-500'; if (item.pct >= 90) color = 'bg-green-500'; else if (item.pct >= 70) color = 'bg-yellow-400'; else if (item.pct >= 50) color = 'bg-orange-500'; 
            segmentsHtml += `<div class="h-full flex-1 ${color} rounded-sm opacity-90 shadow-sm"></div>`;
        });
        
        let emptyCount = totalAssigments - doneCount;
        for(let i=0; i<emptyCount; i++) { segmentsHtml += `<div class="h-full flex-1 bg-slate-200 rounded-sm"></div>`; }
        let pctOverall = totalAssigments ? Math.round((doneCount/totalAssigments)*100) : 0; 
        return { segmentsHtml, doneCount, pctOverall, totalAssigments };
    };

    filteredStudents.forEach(h => { 
        const userLogs = Data.log.filter(l => String(l.id) === String(h.id) && ['math', 'tv', 'vietnamese'].includes(l.subject)); 
        let mathData = buildSegments(userLogs, 'math', tMath); let tvData = buildSegments(userLogs, 'tv', tTv);
        let filteredHighlight = "";
        if (fSub !== 'all' || fGroup !== 'all' || fScore !== 'all') { filteredHighlight = `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow animate-pulse border border-white z-10">Khớp bộ lọc</span>`; }

        let studentTitles = window.calculateTitle(h); let currentScore = Number(h.score) || 0;

        htmlList += `
        <div onclick="window.xemChiTietTienDo('${h.id}', '${h.name.replace(/'/g, "\\'")}')" class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col cursor-pointer hover:border-purple-300 hover:shadow-md transition relative">
            ${filteredHighlight}
            <div class="flex items-center gap-3 mb-4 border-b border-slate-50 pb-3"><div class="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-black shadow-inner text-xl shrink-0"><i class="fas fa-user"></i></div><div class="flex-1 min-w-0"><div class="flex items-center justify-between gap-2"><span class="font-black text-slate-700 text-lg truncate">${h.name}</span><span class="font-black text-indigo-600 text-base shrink-0">${currentScore} <span class="text-[10px] text-slate-400 font-bold uppercase">điểm</span></span></div><div class="flex flex-wrap gap-1 mt-1 empty:hidden">${studentTitles}</div></div></div>
            <div class="space-y-4 w-full">
                <div class="w-full"><div class="flex justify-between items-end mb-1.5"><span class="text-[11px] font-black text-blue-600 uppercase tracking-wider"><i class="fas fa-calculator mr-1 opacity-70"></i>Toán</span><span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">${mathData.doneCount}/${mathData.totalAssigments} bài (${mathData.pctOverall}%)</span></div><div class="w-full h-2.5 flex gap-[2px] p-[1px] bg-slate-50 border border-slate-100 rounded-md">${mathData.segmentsHtml}</div></div>
                <div class="w-full"><div class="flex justify-between items-end mb-1.5"><span class="text-[11px] font-black text-green-600 uppercase tracking-wider"><i class="fas fa-book-open mr-1 opacity-70"></i>Tiếng Việt</span><span class="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">${tvData.doneCount}/${tvData.totalAssigments} bài (${tvData.pctOverall}%)</span></div><div class="w-full h-2.5 flex gap-[2px] p-[1px] bg-slate-50 border border-slate-100 rounded-md">${tvData.segmentsHtml}</div></div>
            </div>
        </div>`; 
    }); 
    document.getElementById('danhSachTienDoRender').innerHTML = htmlList;
};

window.xemChiTietTienDo = function(studentId, studentName) { 
    const userLogs = Data.log.filter(l => String(l.id) === String(studentId)); 
    const sortFunc = (a, b) => { let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); };
    const mathGroups = [...new Set(Data.math.map(x=>x.group))].filter(g=>g).sort(sortFunc); const tvGroups = [...new Set(Data.tv.map(x=>x.group))].filter(g=>g).sort(sortFunc); 
    
    const renderSubjectProgress = (subjectCode, groupsList) => { 
        if(groupsList.length === 0) return `<p class="text-sm text-slate-400 italic py-2">Chưa có bài tập</p>`; 
        const qs = subjectCode === 'math' ? Data.math : Data.tv;
        return groupsList.map(grp => { 
            let groupLogs = userLogs.filter(l => (l.subject === subjectCode || (subjectCode === 'vietnamese' && l.subject === 'tv')) && l.group === grp); 
            if(groupLogs.length > 0) { 
                groupLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); const log = groupLogs[0]; 
                const count = qs.filter(q => q.group === grp && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length;
                const maxScore = count * 10; const isMax = (Number(log.score) >= maxScore && maxScore > 0); const hasMistakes = log.details && String(log.details).includes('border-red-200');
                const isTuyetDoi = isMax || (Number(log.score) > 0 && !hasMistakes);
                const btnChiTiet = isTuyetDoi ? `<span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200 shadow-sm"><i class="fas fa-star text-yellow-500 mr-1"></i>Tuyệt đối</span>` : `<button onclick="window.xemLoiSai('${studentId}', '${subjectCode}', '${grp}')" class="text-[10px] bg-red-50 text-red-600 font-bold px-3 py-1 rounded hover:bg-red-600 hover:text-white transition shadow-sm"><i class="fas fa-search mr-1"></i>Lỗi sai</button>`; 
                const btnMoLai = `<button onclick="window.moLaiBai('${studentId}', '${studentName}', '${subjectCode}', '${grp}')" class="text-[10px] bg-orange-50 text-orange-600 font-bold px-2 py-1 rounded hover:bg-orange-600 hover:text-white transition shadow-sm ml-1" title="Xóa kết quả để em làm lại từ đầu"><i class="fas fa-undo"></i> Mở lại</button>`;
                return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition px-2 rounded-lg"><div class="flex items-center gap-2"><i class="fas fa-check-circle text-green-500 text-lg"></i><span class="font-bold text-slate-700 text-sm">${grp}</span></div><div class="flex items-center gap-2"><span class="font-black text-indigo-600 text-lg mr-1">${log.score}đ</span>${btnChiTiet}${btnMoLai}</div></div>`; 
            } else { return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 opacity-50 px-2"><div class="flex items-center gap-2"><i class="far fa-circle text-slate-300 text-lg"></i><span class="font-bold text-slate-500 text-sm line-through">${grp}</span></div><span class="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">Chưa làm</span></div>`; } 
        }).join(''); 
    }; 
    document.getElementById('content').innerHTML = `<div class="flex items-center mb-6"><button onclick="window.moTienDo()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600 uppercase">CHI TIẾT: ${studentName}</h2></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in pb-10"><div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-100"><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-calculator"></i></div><h3 class="font-black text-blue-800 text-lg">MÔN TOÁN</h3></div><div>${renderSubjectProgress('math', mathGroups)}</div></div><div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-100"><div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><i class="fas fa-book"></i></div><h3 class="font-black text-green-800 text-lg">MÔN TIẾNG VIỆT</h3></div><div>${renderSubjectProgress('vietnamese', tvGroups)}</div></div></div><div id="modalReview" class="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in"><div class="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden flex flex-col max-h-[85vh]"><div class="bg-red-500 p-5 text-white flex justify-between items-center relative shadow-md"><div><h3 class="font-black text-lg uppercase" id="rvTitle">--</h3><p class="text-xs text-red-100 font-bold" id="rvName">--</p></div><button onclick="document.getElementById('modalReview').classList.add('hidden')" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition"><i class="fas fa-times"></i></button></div><div id="rvContent" class="p-5 overflow-y-auto bg-slate-50 space-y-4 text-sm text-slate-700 leading-relaxed font-medium"></div></div></div>`; 
};

window.xemLoiSai = function(studentId, subjectCode, group) { 
    const student = Data.hs.find(s => String(s.id) === String(studentId)); const studentName = student ? student.name : "Học sinh"; 
    let groupLogs = Data.log.filter(l => String(l.id) === String(studentId) && (l.subject === subjectCode || (subjectCode === 'vietnamese' && l.subject === 'tv')) && l.group === group);
    groupLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); const log = groupLogs[0]; 
    document.getElementById("rvTitle").innerText = "Lỗi sai: " + group; document.getElementById("rvName").innerText = studentName; document.getElementById("rvContent").innerHTML = (log && log.details) ? log.details : '<p class="text-center text-slate-400">Không có dữ liệu chi tiết.</p>'; document.getElementById("modalReview").classList.remove("hidden"); 
};

window.moLaiBai = async function(studentId, studentName, subjectCode, group) {
    if(!confirm(`⚠️ CHÚ Ý: Thầy có chắc chắn muốn MỞ LẠI bài [${group}] cho em ${studentName} không?\n\nHành động này sẽ hủy kết quả hiện tại của bài này để em có thể làm lại từ đầu (Điểm của bài này cũng sẽ bị trừ khỏi tổng kết).`)) return;

    let groupLogs = Data.log.filter(l => String(l.id) === String(studentId) && (l.subject === subjectCode || (subjectCode === 'vietnamese' && l.subject === 'tv')) && l.group === group);
    let maxScoreObj = groupLogs.sort((a,b) => (Number(b.real_added)||0) - (Number(a.real_added)||0))[0];
    let pointsToDeduct = maxScoreObj ? (Number(maxScoreObj.real_added) || 0) : 0;

    document.getElementById('loader').style.display = 'flex';
    try {
        if (pointsToDeduct > 0) {
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: studentId, subject: "Bonus", group: "Hoàn tác điểm lỗi mạng", score: -pointsToDeduct, score_earned: -pointsToDeduct, details: `Hệ thống tự động trừ ${pointsToDeduct} điểm do GVCN mở lại bài ${group}` } }) });
        }
        
        let resetTime = new Date().toISOString();
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: studentId, subject: "RESET", group: group, score: 0, score_earned: 0, details: subjectCode } }) });

        Data.log = Data.log.filter(l => !(String(l.id) === String(studentId) && (l.subject === subjectCode || (subjectCode === 'vietnamese' && l.subject === 'tv')) && l.group === group));
        Data.log.push({ id: studentId, subject: "RESET", group: group, score: 0, time: resetTime, details: subjectCode });
        
        let hs = Data.hs.find(x => String(x.id) === String(studentId));
        if(hs && pointsToDeduct > 0) hs.score = Number(hs.score) - pointsToDeduct;

        alert("Đã mở lại bài thành công! Em " + studentName + " đã có thể vào làm lại bài này.");
        window.xemChiTietTienDo(studentId, studentName);
    } catch(e) { alert("Lỗi mạng, chưa thể mở lại bài!"); } finally { document.getElementById('loader').style.display = 'none'; }
};

// ==========================================
// 7. THƯ BÍ MẬT & ĐƠN XIN PHÉP
// ==========================================
window.moHopThuBiMat = function() {
    if(!currentUser) return showLogin(); closeMenu();
    document.getElementById('content').innerHTML = `${getNavHtml('thubimat')}<div class="bg-[#fff0f5] p-6 rounded-[2rem] shadow-sm border-2 border-pink-200 space-y-5 fade-in relative overflow-hidden"><p class="text-slate-600 font-bold text-sm relative z-10 leading-relaxed">Thầy Hiển luôn ở đây để lắng nghe con.</p><textarea id="mailContent" class="w-full bg-white border-2 border-pink-200 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-pink-400 transition min-h-[150px] relative z-10" placeholder="Viết điều con muốn nói vào đây..."></textarea><label class="flex items-center gap-3 cursor-pointer relative z-10 bg-white p-3 rounded-xl border border-pink-100"><input type="checkbox" id="mailAnon" class="w-5 h-5 accent-pink-500 cursor-pointer"><span class="font-bold text-slate-600 text-sm">Gửi giấu tên</span></label><button onclick="window.guiThuBiMat()" class="w-full bg-pink-500 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-pink-600 transition relative z-10"><i class="fas fa-paper-plane mr-2"></i> GỬI CHO THẦY HIỂN</button></div>`;
};

window.guiThuBiMat = async function() {
    const content = document.getElementById('mailContent').value.trim(); const isAnon = document.getElementById('mailAnon').checked; 
    if(!content) return alert("Con chưa viết gì cả!"); document.getElementById('loader').style.display = 'flex';
    try { await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'gui_thu_bi_mat', data:{ id:currentUser.id, name:currentUser.name, isAnonymous: isAnon, content: content } }) }); alert("Đã gửi thư thành công!"); veTrangChu(); } catch(e) { alert("Lỗi mạng, chưa gửi được thư!"); } finally { document.getElementById('loader').style.display = 'none'; }
};

window.moXinPhep = function() { 
    if(!currentUser) return showLogin(); closeMenu(); 
    document.getElementById('content').innerHTML = `${getNavHtml('hopthu')}<div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5 fade-in"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Ngày nghỉ</label><input type="date" id="lDate" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700"></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại xin phép</label><select id="lType" onchange="window.changeLeaveType()" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Nghỉ học và bán trú">Nghỉ học và bán trú</option><option value="Nghỉ Bán trú">Nghỉ Bán trú</option></select></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian nghỉ</label><select id="lSession" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option></select></div></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Lý do (Bệnh, việc gia đình...)</label><textarea id="lReason" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-medium text-slate-700 outline-none focus:border-red-400 transition" rows="3" placeholder="Nhập lý do chi tiết..."></textarea></div><button onclick="window.sendLeave()" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-red-700 transition"><i class="fas fa-paper-plane mr-2"></i> GỬI ĐƠN CHO GVCN</button></div>`; document.getElementById('lDate').valueAsDate = new Date(Date.now()+86400000); 
};

window.changeLeaveType = function() { 
    const type = document.getElementById('lType').value; const session = document.getElementById('lSession'); 
    if (type === 'Nghỉ Bán trú') { session.innerHTML = `<option value="Ăn trưa và Không ngủ trưa">Ăn trưa và Không ngủ trưa</option><option value="Không ăn trưa và không ngủ trưa">Không ăn trưa và không ngủ trưa</option>`; } else { session.innerHTML = `<option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option>`; } 
};

window.sendLeave = async function() { 
    const d = document.getElementById('lDate').value; const r = document.getElementById('lReason').value; const type = document.getElementById('lType').value; const session = document.getElementById('lSession').value; 
    if(!d || !r) return alert("Vui lòng chọn Ngày nghỉ và Nhập Lý do!"); const combinedType = `${type} (${session})`; document.getElementById('loader').style.display='flex'; 
    try { await fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'gui_xin_phep', data:{ id:currentUser.id, name:currentUser.name, dateOff:d, type:combinedType, reason:r } }) }); alert("Gửi đơn thành công!"); veTrangChu(); } catch(e) { alert("Lỗi mạng, chưa gửi được đơn!"); } finally { document.getElementById('loader').style.display='none'; } 
};

// ==========================================
// 8. QUẢN LÝ ADMIN & THÔNG BÁO
// ==========================================
window.moQuanLyThu = async function() { 
    closeMenu(); document.getElementById('content').innerHTML = `<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-4xl text-pink-500 mb-3"></i><p class="font-bold text-slate-500">Đang tải thư...</p></div>`; 
    try {
        const letters = await (await fetch(API_URL + "?type=mailbox&t=" + Date.now())).json();
        if (currentUser && currentUser.role === 'admin') { localStorage.setItem('admin_read_mail_' + currentUser.id, letters.length); window.kiemTraThongBaoAdmin(); }
        let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-pink-600 uppercase">THƯ TỪ HỌC SINH</h2></div>`;
        if(letters.length === 0) { html += `<div class="text-center py-10 text-slate-400 font-bold"><i class="fas fa-comment-dots text-5xl mb-3 text-slate-200"></i><br>Không có thư nào.</div>`; } else {
            html += `<div class="space-y-4 pb-10">`;
            letters.forEach(l => {
                let timeSent = ""; try { let d = new Date(l.time); timeSent = isNaN(d) ? l.time : d.toLocaleString('vi-VN'); } catch(e) { timeSent = l.time; }
                let isAnon = (String(l.isAnonymous).toLowerCase() === "true"); let senderDisplay = isAnon ? `<span class="text-purple-600"><i class="fas fa-user-secret"></i> Ẩn danh (Thực tế: ${l.name})</span>` : `<span class="text-blue-600"><i class="fas fa-user"></i> ${l.name}</span>`; let anonBadge = isAnon ? `<span class="bg-purple-100 text-purple-700 text-[10px] font-black px-2 py-1 rounded ml-2">THƯ ẨN DANH</span>` : '';
                html += `<div class="bg-white p-5 rounded-2xl shadow-sm border-l-4 ${isAnon ? 'border-purple-400' : 'border-pink-400'} hover:shadow-md transition relative"><div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2"><div class="font-bold text-sm">${senderDisplay} ${anonBadge}</div><div class="text-[10px] text-slate-400"><i class="fas fa-clock"></i> ${timeSent}</div></div><div class="text-slate-700 text-base whitespace-pre-wrap font-medium bg-slate-50 p-3 rounded-xl">"${l.content}"</div></div>`;
            }); html += `</div>`;
        }
        document.getElementById('content').innerHTML = html;
    } catch (e) { document.getElementById('content').innerHTML = `<p class="text-center text-red-500 mt-10 font-bold">Lỗi tải dữ liệu hộp thư.</p>`; }
};

window.moDonTu = async function() { 
    closeMenu(); document.getElementById('content').innerHTML = `<h2 class="text-xl font-black text-red-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách...</h2>`; 
    try {
        const leaves = await (await fetch(API_URL + "?type=absent_list&t=" + Date.now())).json(); 
        if (currentUser && currentUser.role === 'admin') { localStorage.setItem('admin_read_leave_' + currentUser.id, leaves.length); window.kiemTraThongBaoAdmin(); }
        let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600 uppercase">HỘP THƯ ĐƠN TỪ</h2></div>`; 
        if (leaves.length === 0) { html += `<p class="text-center text-slate-400 font-medium py-10"><i class="fas fa-check-circle text-4xl mb-3 text-green-200 block"></i>Lớp đi học đầy đủ, không có đơn xin phép nào.</p>`; } else { 
            const groupedLeaves = {}; leaves.forEach(l => { let fDate = l.dateOff; if (fDate.includes('-')) { const parts = fDate.split('-'); if(parts.length === 3) fDate = `${parts[2]}/${parts[1]}/${parts[0]}`; } if (!groupedLeaves[fDate]) groupedLeaves[fDate] = []; groupedLeaves[fDate].push(l); }); 
            html += `<div class="space-y-6 pb-10">`; 
            for (const [dateStr, items] of Object.entries(groupedLeaves)) { 
                html += `<div class="bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-red-500 fade-in relative overflow-hidden"><div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3"><div class="flex items-center gap-2"><i class="fas fa-calendar-alt text-red-500 text-xl"></i><h3 class="font-black text-lg text-slate-800">Xin nghỉ ngày: ${dateStr}</h3></div><span class="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">${items.length} đơn</span></div><div class="space-y-4">`; 
                items.forEach(l => { 
                    const isBanTru = l.type.startsWith('Nghỉ Bán trú') || l.type.includes('Chỉ nghỉ Bán trú'); const badgeColor = isBanTru ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'; const icon = isBanTru ? 'fa-utensils' : 'fa-bed'; const iconBg = isBanTru ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'; 
                    let timeSent = ""; try { let d = new Date(l.time); if(isNaN(d)) timeSent = l.time; else timeSent = d.toLocaleString('vi-VN'); } catch(e) { timeSent = l.time; } 
                    html += `<div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-4 hover:border-slate-300 transition"><div class="w-10 h-10 ${iconBg} rounded-full flex justify-center items-center text-lg shrink-0"><i class="fas ${icon}"></i></div><div class="flex-1"><div class="flex justify-between items-start mb-1"><span class="font-black text-slate-800">${l.name}</span></div><div class="mb-2"><span class="text-[11px] font-black inline-block px-2 py-1 rounded border ${badgeColor}">${l.type}</span></div><p class="text-[13px] text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100">" ${l.reason} "</p><p class="text-[10px] text-slate-400 mt-2 text-right">Gửi lúc: ${timeSent}</p></div></div>`; 
                }); html += `</div></div>`; 
            } html += `</div>`; 
        } document.getElementById('content').innerHTML = html; 
    } catch (e) {}
};

window.kiemTraThongBaoAdmin = async function() { 
    if (!currentUser || currentUser.role !== 'admin') return; 
    try { 
        const [mailRes, leaveRes] = await Promise.all([ fetch(API_URL + "?type=mailbox&t=" + Date.now()), fetch(API_URL + "?type=absent_list&t=" + Date.now()) ]); 
        const mails = await mailRes.json(); const leaves = await leaveRes.json(); 
        let readMail = parseInt(localStorage.getItem('admin_read_mail_' + currentUser.id) || "0"); let readLeave = parseInt(localStorage.getItem('admin_read_leave_' + currentUser.id) || "0"); 
        let unreadMail = mails.length - readMail; if (unreadMail < 0) unreadMail = 0; let unreadLeave = leaves.length - readLeave; if (unreadLeave < 0) unreadLeave = 0; 
        window.renderChuongThongBao(unreadMail, unreadLeave); 
    } catch(e) { console.log("Lỗi tải thông báo:", e); } 
};

window.renderChuongThongBao = function(unreadMail, unreadLeave) { 
    let oldBell = document.getElementById('adminNotificationBell'); if (oldBell) oldBell.remove(); let totalUnread = unreadMail + unreadLeave; if (totalUnread <= 0) return; 
    let bellHtml = `<div id="adminNotificationBell" class="fixed bottom-8 right-6 z-[80] flex flex-col items-end fade-in"><div id="adminNotiPopup" class="hidden bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 mb-3 w-64 origin-bottom-right transition-all"><h4 class="font-black text-slate-700 mb-3 border-b pb-2"><i class="fas fa-bell text-yellow-500 mr-2 animate-pulse"></i>Thông báo mới</h4>${unreadMail > 0 ? `<div onclick="window.moQuanLyThu(); document.getElementById('adminNotiPopup').classList.add('hidden');" class="flex justify-between items-center p-2 bg-pink-50 rounded-xl mb-2 cursor-pointer hover:bg-pink-100 transition"><span class="font-bold text-pink-700 text-sm"><i class="fas fa-envelope mr-2"></i>Thư bí mật</span><span class="bg-pink-500 text-white text-xs font-black px-2 py-1 rounded-full">${unreadMail}</span></div>` : ''}${unreadLeave > 0 ? `<div onclick="window.moDonTu(); document.getElementById('adminNotiPopup').classList.add('hidden');" class="flex justify-between items-center p-2 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition"><span class="font-bold text-red-700 text-sm"><i class="fas fa-file-signature mr-2"></i>Đơn xin phép</span><span class="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">${unreadLeave}</span></div>` : ''}</div><button onclick="document.getElementById('adminNotiPopup').classList.toggle('hidden')" class="relative w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-[0_8px_30px_rgb(245,158,11/0.5)] hover:scale-110 transition flex items-center justify-center text-white text-2xl btn-3d animate-bounce border-2 border-white"><i class="fas fa-bell"></i><span class="absolute -top-2 -right-2 bg-red-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">${totalUnread}</span></button></div>`; document.body.insertAdjacentHTML('beforeend', bellHtml); 
};

setInterval(() => { 
    if (window.currentUser && window.currentUser.role === 'admin') { 
        if (!window.hasCheckedAdminNoti) { window.hasCheckedAdminNoti = true; window.kiemTraThongBaoAdmin(); } 
    } else { window.hasCheckedAdminNoti = false; let bell = document.getElementById('adminNotificationBell'); if (bell) bell.remove(); } 
}, 60000); 

// ==========================================
// 9. CÔNG CỤ CHUNG TẢI NGẦM & ĐỒNG BỘ
// ==========================================
let checkLoginInterval = setInterval(() => { 
    if (window.currentUser && !window.isAllDataLoaded && !window.isFetchingBackground) { 
        window.isFetchingBackground = true; 
        clearInterval(checkLoginInterval);
        setTimeout(() => { window.loadAllDataOnce(false, true).catch(e => console.log("Lỗi tải ngầm")); }, 3000);
    } 
}, 1000);

window.dongBoDuLieu = async function() { 
    if(!confirm("Hành động này sẽ tải lại toàn bộ dữ liệu mới nhất từ máy chủ. Tiếp tục?")) return; 
    document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG ĐỒNG BỘ MÁY CHỦ..."; 
    try { 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'clear_cache', data: {} }) }); 
        localStorage.removeItem('eduDataCache'); 
        window.isAllDataLoaded = false; 
        alert("Đồng bộ thành công! Hệ thống sẽ tự tải lại."); 
        location.reload(); 
    } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng khi đồng bộ!"); } 
};

window.checkSinhNhat = function() { 
    if (!currentUser || currentUser.role !== 'student' || !currentUser.dob) return; 
    if (sessionStorage.getItem('hpbdShown_' + currentUser.id)) return; 
    let dobStr = currentUser.dob; let bDay = 0, bMonth = 0; 
    try { if (dobStr.includes('T')) { let dt = new Date(dobStr); bDay = dt.getDate(); bMonth = dt.getMonth() + 1; } else if (dobStr.includes('/')) { let parts = dobStr.split('/'); bDay = parseInt(parts[0]); bMonth = parseInt(parts[1]); } else if (dobStr.includes('-')) { let parts = dobStr.split('-'); bDay = parseInt(parts[2]); bMonth = parseInt(parts[1]); } } catch(e) { return; } 
    let today = new Date(); 
    if (bDay === today.getDate() && bMonth === (today.getMonth() + 1)) { 
        let currentYear = today.getFullYear(); let bonusKey = 'hpbd_bonus_' + currentYear + '_' + currentUser.id; 
        if (!localStorage.getItem(bonusKey)) { 
            window.updateKhoDoCloud(5, 0); 
            localStorage.setItem(bonusKey, 'true'); 
            try { fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: "Sinh nhật " + currentYear, score_earned: 0, details: "Hệ thống tự động tặng 5 lượt quay nhân dịp sinh nhật!" } }) }); } catch(e) {} 
        } 
        window.showHappyBirthdayUI(); sessionStorage.setItem('hpbdShown_' + currentUser.id, 'true'); 
    } 
};

window.showHappyBirthdayUI = function() { 
    let overlay = document.createElement('div'); overlay.id = "hpbdModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4"; 
    overlay.innerHTML = `<div class="bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 p-1 rounded-[2.5rem] shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-[cascadeDrop_0.8s_ease-out_forwards]"><div class="bg-white rounded-[2.4rem] p-8 text-center relative overflow-hidden"><button onclick="document.getElementById('hpbdModal').remove()" class="absolute top-3 right-4 text-slate-300 hover:text-red-500 transition font-bold text-3xl">&times;</button><div class="text-7xl mb-2 mt-2 animate-bounce">🎂</div><h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wide mb-2">CHÚC MỪNG SINH NHẬT</h2><h3 class="text-3xl font-black text-slate-800 mb-4">${currentUser.name}</h3><div class="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-4 relative"><i class="fas fa-quote-left text-orange-200 text-3xl absolute -top-2 -left-2"></i><p class="text-slate-700 font-bold text-sm leading-relaxed relative z-10">Thầy Hiển và tập thể lớp Bốn 6 chúc con thêm tuổi mới luôn vui vẻ, mạnh khỏe, chăm ngoan và đạt được thật nhiều bông hoa điểm 10 nhé! 💖</p></div><div class="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 p-3 rounded-2xl mb-6 shadow-inner animate-pulse"><p class="text-orange-600 font-black text-sm"><i class="fas fa-gift text-xl mr-1 text-red-500"></i> LÌ XÌ TỪ THẦY HIỂN</p><p class="text-slate-700 font-bold text-xs mt-1">Hệ thống đã tự động cộng <span class="text-red-600 text-base font-black">5 LƯỢT QUAY</span> vào Vòng Quay May Mắn của con!</p></div><button onclick="document.getElementById('hpbdModal').remove()" class="bg-gradient-to-r from-pink-500 to-orange-500 text-white w-full py-4 rounded-2xl font-black shadow-lg btn-3d text-lg hover:scale-[1.02] transition">CẢM ƠN THẦY Ạ!</button></div></div>`; 
    document.body.appendChild(overlay); window.safeConfetti(); 
};

// ==========================================
// 10. GAME TOÁN HỌC: BẢO VỆ TRÁI ĐẤT (ĐÃ TÍCH HỢP KIỂM TRA LỆNH PHẠT)
// ==========================================
let mathGame = { loop: null, spawn: null, meteors: [], level: 1, score: 0, combo: 0, lives: 10, timeLeft: 60, active: false };

window.moGameBaoVeTraiDat = async function() {
    if(!currentUser) return showLogin(); closeMenu();
    
    // KIỂM TRA LỆNH KHÓA TỪ GVCN
    let blockUntil = window.checkIsBlocked ? window.checkIsBlocked(currentUser.id) : false;
    if (blockUntil) {
        alert("🚨 TÍNH NĂNG BỊ KHOÁ");
        if (window.veTrangChu) veTrangChu();
        return;
    }

    if (!(await window.loadAllDataOnce(true))) return;

    let todayGame = new Date();
    let soLanDaChoiHomNay = Data.log.filter(l => {
        if (String(l.id) !== String(currentUser.id) || l.subject !== "MathGame") return false;
        let d = new Date(l.time);
        return !isNaN(d) && d.getDate() === todayGame.getDate() && d.getMonth() === todayGame.getMonth() && d.getFullYear() === todayGame.getFullYear();
    }).length;
    
    let luotGameCloud = Number(currentUser.luotGame) || 0;
    let tongLuotGame = 1 + luotGameCloud;

    if (soLanDaChoiHomNay >= tongLuotGame) {
        alert(`🛡️ HỆ THỐNG: Con đã dùng hết ${soLanDaChoiHomNay}/${tongLuotGame} lượt chơi Game hôm nay! Hãy cố gắng học tốt để xin Thầy thưởng thêm lượt nhé.`);
        if (window.veTrangChu) veTrangChu();
        return; 
    }

    mathGame = { loop: null, spawn: null, meteors: [], level: 1, score: 0, combo: 0, lives: 10, timeLeft: 60, active: true };

    document.getElementById('content').innerHTML = `
        <div id="gameUI" class="fixed inset-0 z-[100] bg-slate-900 overflow-hidden flex flex-col font-sans select-none touch-none">
            <div class="bg-slate-800/80 backdrop-blur border-b border-slate-700 p-3 flex justify-between items-center text-white relative z-20">
                <div class="flex items-center gap-2">
                    <button onclick="window.thoatGameToan()" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0 hover:bg-red-500 transition"><i class="fas fa-times"></i></button>
                    <div id="mg-lives" class="text-red-400 text-[10px] sm:text-xs flex tracking-tighter">❤️❤️❤️❤️❤️❤️❤️❤️❤️❤️</div>
                </div>
                <div class="text-center absolute left-1/2 -translate-x-1/2 mt-1">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">CẤP ĐỘ <span id="mg-level" class="text-white text-sm">1</span></p>
                    <p id="mg-time" class="text-xl font-black text-yellow-400 leading-none">01:00</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">ĐIỂM</p>
                    <p id="mg-score" class="text-2xl font-black text-emerald-400 leading-none">0</p>
                </div>
            </div>

            <div id="mg-sky" class="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
                <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 30px 30px;"></div>
                <div id="mg-combo-text" class="absolute top-1/4 left-1/2 -translate-x-1/2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 opacity-0 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] z-10 pointer-events-none">COMBO x2 🔥</div>
                <div class="absolute bottom-0 left-0 w-full h-24 flex justify-center items-end">
                    <div class="w-full h-16 bg-blue-500/20 rounded-t-[100%] border-t border-blue-400/30 blur-[2px] absolute bottom-0"></div>
                    <div id="mg-cannon" class="w-16 h-10 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-xl relative z-10 border-2 border-b-0 border-slate-500 flex justify-center pt-1.5 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform duration-75">
                        <div class="w-5 h-5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_cyan]"></div>
                        <div class="absolute -bottom-2 w-24 h-4 bg-slate-600 rounded-full blur-md"></div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800 p-2 pb-4 relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] border-t-2 border-slate-700 h-[28vh] max-h-[240px] flex flex-col justify-end">
                <div class="max-w-md mx-auto w-full h-full flex flex-col">
                    <div class="bg-slate-900 border-2 border-slate-700 rounded-xl mb-2 flex-[0_0_36px] flex items-center justify-center">
                        <span id="mg-input" class="text-xl font-black text-cyan-400 tracking-widest drop-shadow-[0_0_5px_cyan]"></span>
                    </div>
                    <div class="grid grid-cols-3 gap-1.5 flex-1">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button onclick="window.mgType(${n})" class="bg-slate-700 text-white font-black text-xl rounded-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 hover:bg-slate-600 transition shadow-sm w-full h-full flex items-center justify-center">${n}</button>`).join('')}
                        <button onclick="window.mgClear()" class="bg-red-500/20 text-red-400 border-red-500/50 font-black text-lg rounded-xl border-b-4 active:border-b-0 active:translate-y-1 hover:bg-red-500/30 transition shadow-sm w-full h-full flex items-center justify-center"><i class="fas fa-backspace"></i></button>
                        <button onclick="window.mgType(0)" class="bg-slate-700 text-white font-black text-xl rounded-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 hover:bg-slate-600 transition shadow-sm w-full h-full flex items-center justify-center">0</button>
                        <button onclick="window.mgShoot()" class="bg-gradient-to-t from-blue-600 to-cyan-500 text-white font-black text-lg rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 hover:opacity-90 transition shadow-[0_0_15px_rgba(6,182,212,0.4)] w-full h-full flex items-center justify-center"><i class="fas fa-crosshairs mr-1"></i> BẮN</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.mgStartLevel();
};

window.mgTaoPhepTinh = function(level) {
    let rand = Math.random(); let a, b, ans, op;
    if (level === 1) {
        if (rand < 0.2) { a = Math.floor(Math.random() * 40) + 10; b = Math.floor(Math.random() * 40) + 10; op = '+'; ans = a + b; } 
        else if (rand < 0.4) { a = Math.floor(Math.random() * 70) + 20; b = Math.floor(Math.random() * (a - 10)) + 10; op = '-'; ans = a - b; } 
        else if (rand < 0.6) { a = Math.floor(Math.random() * 4) + 2; b = Math.floor(Math.random() * 9) + 2; op = 'x'; ans = a * b; } 
        else if (rand < 0.8) { b = Math.floor(Math.random() * 4) + 2; ans = Math.floor(Math.random() * 9) + 2; a = b * ans; op = ':'; } 
        else { let base = Math.floor(Math.random() * 89) + 10; if (Math.random() < 0.5) { a = base; b = 10; op = 'x'; ans = a * b; } else { ans = base; b = 10; a = ans * b; op = ':'; } }
    } 
    else if (level === 2) {
        if (rand < 0.15) { a = Math.floor(Math.random() * 4) + 6; b = Math.floor(Math.random() * 9) + 2; op = 'x'; ans = a * b; } 
        else if (rand < 0.30) { b = Math.floor(Math.random() * 4) + 6; ans = Math.floor(Math.random() * 9) + 2; a = b * ans; op = ':'; } 
        else if (rand < 0.70) { let num1 = Math.floor(Math.random() * 8) + 2; let num2 = (Math.floor(Math.random() * 8) + 2) * 10; if (Math.random() < 0.5) { a = num1; b = num2; op = 'x'; ans = a * b; } else { b = num1; ans = num2; a = b * ans; op = ':'; } } 
        else { let base = Math.floor(Math.random() * 89) + 10; if (Math.random() < 0.5) { a = base; b = 100; op = 'x'; ans = a * b; } else { ans = base; b = 100; a = ans * b; op = ':'; } }
    } 
    else {
        if (rand < 0.4) { let num1 = Math.floor(Math.random() * 8) + 2; let isHundred = Math.random() < 0.5; let num2 = (Math.floor(Math.random() * 8) + 2) * (isHundred ? 100 : 1000); if (Math.random() < 0.5) { a = num1; b = num2; op = 'x'; ans = a * b; } else { b = num1; ans = num2; a = b * ans; op = ':'; } } 
        else if (rand < 0.7) { let base = Math.floor(Math.random() * 89) + 10; if (Math.random() < 0.5) { a = base; b = 1000; op = 'x'; ans = a * b; } else { ans = base; b = 1000; a = ans * b; op = ':'; } } 
        else { if (Math.random() < 0.5) { a = Math.floor(Math.random() * 50) + 45; b = Math.floor(Math.random() * 50) + 45; op = '+'; ans = a + b; } else { a = Math.floor(Math.random() * 50) + 100; b = Math.floor(Math.random() * 80) + 20; op = '-'; ans = a - b; } }
    }
    return { q: `${a} ${op} ${b}`, a: ans.toString() };
};

window.mgStartLevel = function() {
    mathGame.timeLeft = 60; mathGame.meteors = []; 
    document.getElementById('mg-sky').innerHTML = `<div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 30px 30px;"></div><div id="mg-combo-text" class="absolute top-1/4 left-1/2 -translate-x-1/2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 opacity-0 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] z-10 pointer-events-none">COMBO x2 🔥</div><div class="absolute bottom-0 left-0 w-full h-24 flex justify-center items-end"><div class="w-full h-16 bg-blue-500/20 rounded-t-[100%] border-t border-blue-400/30 blur-[2px] absolute bottom-0"></div><div id="mg-cannon" class="w-16 h-10 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-xl relative z-10 border-2 border-b-0 border-slate-500 flex justify-center pt-1.5 shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-transform duration-75"><div class="w-5 h-5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_cyan]"></div></div></div>`;
    document.getElementById('mg-level').innerText = mathGame.level;
    document.getElementById('mg-input').innerText = "";

    let spawnRate = mathGame.level === 1 ? 4000 : (mathGame.level === 2 ? 3500 : 3000);
    let fallSpeed = mathGame.level === 1 ? 0.075 : (mathGame.level === 2 ? 0.125 : 0.175); 

    mathGame.spawn = setInterval(() => {
        if(!mathGame.active) return;
        let pt = window.mgTaoPhepTinh(mathGame.level);
        let id = 'mt_' + Date.now(); let left = Math.random() * 70 + 10; 
        let el = document.createElement('div');
        el.id = id; el.className = "absolute p-2 bg-gradient-to-b from-red-600 to-orange-500 border-2 border-yellow-300 text-white font-black text-sm rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10 flex items-center justify-center whitespace-nowrap min-w-[70px]";
        el.style.left = left + '%'; el.style.top = '-10%'; el.innerHTML = `${pt.q}`;
        document.getElementById('mg-sky').appendChild(el);
        mathGame.meteors.push({ id: id, ans: pt.a, top: -10, el: el });
    }, spawnRate);

    mathGame.loop = setInterval(() => {
        if(!mathGame.active) return;
        if(Date.now() % 1000 < 20) {
            mathGame.timeLeft--;
            let s = mathGame.timeLeft; document.getElementById('mg-time').innerText = `00:${s<10?'0'+s:s}`;
            if(mathGame.timeLeft <= 0) window.mgEndLevel();
        }
        for(let i=mathGame.meteors.length-1; i>=0; i--) {
            let m = mathGame.meteors[i]; m.top += fallSpeed; m.el.style.top = m.top + '%';
            if (m.top > 85) { 
                m.el.remove(); mathGame.meteors.splice(i, 1);
                mathGame.combo = 0; window.mgUpdateCombo();
                mathGame.lives--; window.mgUpdateLives();
                if(mathGame.lives <= 0) { window.mgGameOver(); break; }
            }
        }
    }, 20);
};

window.mgType = function(n) { let inp = document.getElementById('mg-input'); if(inp.innerText.length < 6) inp.innerText += n; };
window.mgClear = function() { document.getElementById('mg-input').innerText = ""; };

window.mgShoot = function() {
    if(!mathGame.active) return;
    let inpStr = document.getElementById('mg-input').innerText; if(!inpStr) return;
    let hitIndex = -1; let lowestTop = -100;
    for(let i=0; i<mathGame.meteors.length; i++) {
        if(mathGame.meteors[i].ans === inpStr && mathGame.meteors[i].top > lowestTop) { hitIndex = i; lowestTop = mathGame.meteors[i].top; }
    }

    if (hitIndex !== -1) {
        let m = mathGame.meteors[hitIndex]; let cannon = document.getElementById('mg-cannon'); let sky = document.getElementById('mg-sky');
        if (cannon && m.el && sky) {
            let rectSky = sky.getBoundingClientRect(); let rectC = cannon.getBoundingClientRect(); let rectM = m.el.getBoundingClientRect();   
            let startX = (rectC.left - rectSky.left) + rectC.width / 2; let startY = (rectC.top - rectSky.top);
            let endX = (rectM.left - rectSky.left) + rectM.width / 2; let endY = (rectM.top - rectSky.top) + rectM.height / 2;
            let length = Math.hypot(endX - startX, endY - startY); let angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
            
            let laser = document.createElement('div');
            laser.className = "absolute bg-cyan-300 shadow-[0_0_20px_2px_cyan] z-20 pointer-events-none rounded-full";
            laser.style.left = startX + 'px'; laser.style.top = startY + 'px'; laser.style.width = length + 'px'; laser.style.height = '6px';
            laser.style.transformOrigin = '0 50%'; laser.style.transform = `rotate(${angle}deg)`;
            sky.appendChild(laser);
            
            cannon.style.transform = 'translateY(10px)'; setTimeout(() => cannon.style.transform = 'translateY(0)', 100); setTimeout(() => laser.remove(), 150);
        }

        m.el.className = "absolute text-6xl animate-ping z-30 drop-shadow-[0_0_20px_red]"; m.el.innerHTML = "💥";
        setTimeout(() => { if(m.el) m.el.remove(); }, 300);
        mathGame.meteors.splice(hitIndex, 1);
        
        mathGame.combo++; window.mgUpdateCombo();
        let basePts = mathGame.level === 1 ? 1 : (mathGame.level === 2 ? 3 : 5);
        let pts = mathGame.combo >= 5 ? basePts * 2 : basePts;
        mathGame.score += pts; document.getElementById('mg-score').innerText = mathGame.score;
    } else {
        mathGame.combo = 0; window.mgUpdateCombo();
        document.getElementById('mg-input').classList.add('text-red-500'); setTimeout(()=>document.getElementById('mg-input').classList.remove('text-red-500'), 200);
    }
    document.getElementById('mg-input').innerText = "";
};

window.mgUpdateCombo = function() {
    let txt = document.getElementById('mg-combo-text');
    if (mathGame.combo >= 5) { txt.classList.remove('opacity-0'); txt.classList.add('opacity-100', 'animate-pulse'); } 
    else { txt.classList.add('opacity-0'); txt.classList.remove('opacity-100', 'animate-pulse'); }
};
window.mgUpdateLives = function() {
    let hpStr = ""; for(let i=0;i<10;i++){ hpStr += i < mathGame.lives ? "❤️" : "🖤"; }
    document.getElementById('mg-lives').innerText = hpStr;
};

window.mgEndLevel = function() {
    clearInterval(mathGame.loop); clearInterval(mathGame.spawn);
    if(mathGame.level < 3) {
        mathGame.level++; mathGame.active = false;
        document.getElementById('mg-sky').innerHTML += `<div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-[cascadeDrop_0.5s_ease-out_forwards]"><h2 class="text-4xl font-black text-yellow-400 mb-2">QUA MÀN!</h2><p class="text-white mb-6">Chuẩn bị cấp độ ${mathGame.level}...</p><button onclick="mathGame.active=true; window.mgStartLevel();" class="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-xl hover:bg-blue-500 shadow-[0_0_15px_blue]">TIẾP TỤC</button></div>`;
    } else { window.mgGameOver(true); }
};

window.mgGameOver = async function(isWin = false) {
    clearInterval(mathGame.loop); clearInterval(mathGame.spawn); mathGame.active = false;
    let msg = isWin ? "BẢO VỆ THÀNH CÔNG!" : "NHIỆM VỤ KẾT THÚC!";
    let titleColor = isWin ? "text-emerald-400" : "text-yellow-400"; let iconSmile = isWin ? "🌍" : "😊";
    
    document.getElementById('mg-sky').innerHTML += `
        <div class="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-[cascadeDrop_0.5s_ease-out_forwards]">
            <div class="text-6xl mb-4 animate-bounce">${iconSmile}</div>
            <h2 class="text-3xl font-black ${titleColor} mb-2 uppercase text-center">${msg}</h2>
            <p class="text-slate-300 font-bold mb-6">Số điểm đạt được: <span class="text-yellow-400 text-2xl ml-1">${mathGame.score}</span></p>
            <button id="btnNhanThuongGame" onclick="this.disabled=true; this.innerText='ĐANG LƯU ĐIỂM...'; window.thoatGameToan(true)" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xl hover:scale-105 transition shadow-[0_0_15px_blue]">NHẬN THƯỞNG & THOÁT</button>
        </div>
    `;
};

window.thoatGameToan = async function(saveScore = false) {
    clearInterval(mathGame.loop); clearInterval(mathGame.spawn);
    if (saveScore && mathGame.score > 0 && currentUser && currentUser.role === 'student') {
        document.getElementById('loader').style.display = 'flex'; 
        
        let todayGame = new Date();
        let soLanTruocDo = Data.log.filter(l => {
            if (String(l.id) !== String(currentUser.id) || l.subject !== "MathGame") return false;
            let d = new Date(l.time);
            return !isNaN(d) && d.getDate() === todayGame.getDate() && d.getMonth() === todayGame.getMonth() && d.getFullYear() === todayGame.getFullYear();
        }).length;

        if (soLanTruocDo >= 1) { window.updateKhoDoCloud(0, 0, -1); }
        
        let thoiGianThuc = new Date().toLocaleString('vi-VN');
        let uniqueGameSession = "Bảo vệ Trái Đất (" + thoiGianThuc + ")";
        
        try { 
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "MathGame", group: uniqueGameSession, score: mathGame.score, score_earned: mathGame.score, details: "Chơi game đạt " + mathGame.score + " điểm." } }) }); 
            Data.log.push({ id: currentUser.id, subject: "MathGame", group: uniqueGameSession, score: mathGame.score, real_added: mathGame.score, time: new Date().toISOString(), details: "Chơi game đạt " + mathGame.score + " điểm." }); 
            currentUser.score = Number(currentUser.score) + mathGame.score;
            alert(`Chúc mừng con đã xuất sắc đem về ${mathGame.score} điểm cho tài khoản của mình!`);
        } catch(e) { alert("Lỗi mạng, hệ thống chưa kịp đồng bộ điểm lên bảng vàng!"); } finally { document.getElementById('loader').style.display = 'none'; }
    }
    let gameUI = document.getElementById('gameUI'); if (gameUI) gameUI.remove(); 
    veTrangChu(); 
};

// ==========================================
// 11. HỆ THỐNG CHỐNG GIAN LẬN TỰ ĐỘNG
// ==========================================
document.addEventListener("visibilitychange", () => {
    if (window.isQuizActive && document.hidden && currentUser && currentUser.role === 'student') {
        window.cheatWarnings++;
        if (window.cheatWarnings >= 3) {
            alert("🚨 HỆ THỐNG BẢO MẬT: Con đã rời khỏi bài thi quá 3 lần!\nBài thi của con sẽ được nộp tự động ngay bây giờ để đảm bảo công bằng.");
            window.finishQuiz();
        } else {
            alert(`⚠️ CẢNH BÁO NHẮC NHỞ (${window.cheatWarnings}/3):\nCon vừa rời khỏi màn hình bài thi!\nHãy tập trung tự làm bài, không được mở tab khác hoặc tra Google nhé. Quá 3 lần hệ thống sẽ tự nộp bài!`);
        }
    }
});
document.addEventListener("contextmenu", (e) => { if (window.isQuizActive && currentUser && currentUser.role === 'student') { e.preventDefault(); } });
document.addEventListener("copy", (e) => { if (window.isQuizActive && currentUser && currentUser.role === 'student') { e.preventDefault(); alert("⚠️ Hệ thống: Không được copy câu hỏi con nhé!"); } });

// ==========================================
// 12. NÂNG CẤP TRANG QUẢN LÝ HỌC SINH (BẢN COMPACT - SIÊU THU GỌN DIỆN TÍCH)
// ==========================================
window.chuyenTrangQuanLy = async function() { 
    closeMenu(); 
    if (!(await window.loadAllDataOnce())) return;

    let html = `
        <div class="flex items-center mb-4">
            <button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500 hover:bg-slate-50 transition"><i class="fas fa-arrow-left"></i></button>
            <h2 class="font-black text-xl text-blue-600 uppercase">QUẢN LÝ ĐIỂM & HỌC SINH</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pb-10 fade-in">
    `; 
    
    let studentStats = Data.hs.map(h => {
        let logs = Data.log.filter(l => String(l.id) === String(h.id));
        let mathPts = 0, tvPts = 0, spinPts = 0, gamePts = 0;
        
        logs.forEach(l => {
            let s = l.real_added !== undefined ? Number(l.real_added) : (Number(l.score) || 0);
            if (l.subject === 'math') mathPts += s;
            else if (l.subject === 'tv' || l.subject === 'vietnamese') tvPts += s;
            else if (l.subject === 'LuckySpin') spinPts += s;
            else if (l.subject === 'MathGame') gamePts += s;
        });
        
        let currentScore = Number(h.score) || 0;
        let totalCalculated = mathPts + tvPts + spinPts + gamePts; 
        let bonusPts = currentScore - totalCalculated; 
        let isBlocked = window.checkIsBlocked ? window.checkIsBlocked(h.id) : false;
        
        return { ...h, mathPts, tvPts, spinPts, gamePts, bonusPts, currentScore, isBlocked };
    });

    studentStats.sort((a,b) => b.currentScore - a.currentScore);

    studentStats.forEach((s) => {
        let avatarUrl = window.layAnhDaiDien ? window.layAnhDaiDien(s.id, s.name) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=random&color=fff';
        
        // ĐỒNG BỘ LOGIC
        let originalUser = currentUser;
        let luotQuay = 0;
        try {
            currentUser = s; 
            luotQuay = window.tinhLuotQuayHienTai ? window.tinhLuotQuayHienTai() : (Number(s.luotQuay) || 0);
        } finally { currentUser = originalUser; }

        let todayGame = new Date();
        let soLanDaChoiHomNay = Data.log.filter(l => {
            if (String(l.id) !== String(s.id) || l.subject !== "MathGame") return false;
            let d = new Date(l.time);
            return !isNaN(d) && d.getDate() === todayGame.getDate() && d.getMonth() === todayGame.getMonth() && d.getFullYear() === todayGame.getFullYear();
        }).length;
        
        let luotGameCloud = Number(s.luotGame) || 0;
        let luotGame = (1 + luotGameCloud) - soLanDaChoiHomNay;
        if (luotGame < 0) luotGame = 0;
        
        let veLamLai = Number(s.veLamLai) || 0;

        // CẬP NHẬT NHÃN GIAO DIỆN (NÚT KHÓA NGANG TÊN, DANH HIỆU XẾP NGANG)
        let blockBadge = s.isBlocked ? `<div class="text-[8px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded shadow-sm animate-pulse shrink-0 whitespace-nowrap" title="Bị khóa đến ${s.isBlocked.toLocaleString('vi-VN')}"><i class="fas fa-lock mr-0.5"></i>ĐANG KHÓA</div>` : '';
        
        let studentTitles = window.calculateTitle ? window.calculateTitle(s) : "";
        if (!studentTitles && !s.chucvu) {
            studentTitles = `<div class="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 inline-flex items-center">Học sinh</div>`;
        } else if (s.chucvu) {
            studentTitles = `<div class="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-flex items-center">${s.chucvu}</div> ` + studentTitles;
        }

        html += `
        <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition relative flex flex-col ${s.isBlocked ? 'border-red-400 ring-1 ring-red-100' : ''}">
            
            <div class="flex justify-between items-center mb-2 border-b border-slate-50 pb-2">
                <div class="flex items-center gap-2.5 min-w-0 pr-2 w-full">
                    <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover shadow-inner border border-indigo-100 shrink-0">
                    <div class="min-w-0 flex flex-col items-start w-full mt-0.5">
                        <div class="flex items-center gap-1.5 w-full">
                            <div class="font-black text-slate-700 text-sm truncate" title="${s.name}">${s.name}</div>
                            ${blockBadge}
                        </div>
                        <div class="flex flex-row flex-wrap gap-1 mt-0.5">${studentTitles}</div>
                    </div>
                </div>
                <div class="text-right shrink-0 ml-1">
                    <div class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tổng</div>
                    <div class="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 leading-none">${s.currentScore}</div>
                </div>
            </div>
            
            <div class="grid grid-cols-5 gap-1 text-center mb-2">
                <div class="bg-indigo-50/50 p-1 rounded-lg border border-indigo-100/50" title="Điểm Toán"><div class="text-[8px] font-black text-indigo-500 uppercase mb-0.5 truncate"><i class="fas fa-calculator"></i></div><div class="font-bold text-indigo-700 text-[10px]">${s.mathPts}</div></div>
                <div class="bg-green-50/50 p-1 rounded-lg border border-green-100/50" title="Điểm T.Việt"><div class="text-[8px] font-black text-green-500 uppercase mb-0.5 truncate"><i class="fas fa-book-open"></i></div><div class="font-bold text-green-700 text-[10px]">${s.tvPts}</div></div>
                <div class="bg-yellow-50/50 p-1 rounded-lg border border-yellow-100/50" title="Điểm V.Quay"><div class="text-[8px] font-black text-yellow-600 uppercase mb-0.5 truncate"><i class="fas fa-dharmachakra"></i></div><div class="font-bold text-yellow-700 text-[10px]">${s.spinPts}</div></div>
                <div class="bg-red-50/50 p-1 rounded-lg border border-red-100/50" title="Điểm Game"><div class="text-[8px] font-black text-red-500 uppercase mb-0.5 truncate"><i class="fas fa-rocket"></i></div><div class="font-bold text-red-700 text-[10px]">${s.gamePts}</div></div>
                <div class="bg-pink-50/50 p-1 rounded-lg border border-pink-100/50" title="Thưởng Nóng"><div class="text-[8px] font-black text-pink-500 uppercase mb-0.5 truncate"><i class="fas fa-gift"></i></div><div class="font-bold text-pink-700 text-[10px]">${s.bonusPts}</div></div>
            </div>
            
            <div class="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg border border-slate-100 px-2 shadow-inner mb-2.5">
                <div class="text-[10px] font-bold text-slate-500 flex items-center gap-1" title="Lượt Quay">
                    <i class="fas fa-dharmachakra text-yellow-500"></i><span class="text-yellow-600 font-black">${luotQuay}</span>
                </div>
                <div class="w-px h-3 bg-slate-200"></div>
                <div class="text-[10px] font-bold text-slate-500 flex items-center gap-1" title="Vé Làm Bài">
                    <i class="fas fa-ticket-alt text-orange-500"></i><span class="text-orange-600 font-black">${veLamLai}</span>
                </div>
                <div class="w-px h-3 bg-slate-200"></div>
                <div class="text-[10px] font-bold text-slate-500 flex items-center gap-1" title="Lượt Game">
                    <i class="fas fa-rocket text-red-500"></i><span class="text-red-600 font-black">${luotGame}</span>
                </div>
            </div>
            
            <div class="flex gap-1.5 mt-auto">
                <button onclick="window.viewProfile('${s.id}')" class="flex-1 bg-white text-slate-500 py-1.5 rounded-lg font-bold text-[10px] hover:bg-blue-50 hover:text-blue-600 transition border border-slate-200 shadow-sm"><i class="fas fa-id-card"></i> Hồ sơ</button>
                <button onclick="window.thuongNong('${s.id}', '${s.name.replace(/'/g, "\\'")}', ${s.currentScore})" class="flex-1 bg-pink-50 text-pink-600 py-1.5 rounded-lg font-bold text-[10px] hover:bg-pink-500 hover:text-white transition border border-pink-200 shadow-sm"><i class="fas fa-magic"></i> Thưởng</button>
                <button onclick="window.moKhoaTaiKhoan('${s.id}', '${s.name.replace(/'/g, "\\'")}')" class="flex-1 bg-red-50 text-red-600 py-1.5 rounded-lg font-bold text-[10px] hover:bg-red-500 hover:text-white transition border border-red-200 shadow-sm"><i class="fas fa-ban"></i> Phạt</button>
            </div>
        </div>
        `;
    });

    document.getElementById('content').innerHTML = html + "</div>"; 
};

window.viewProfile = function(studentId) {
    let s = Data.hs.find(x => String(x.id) === String(studentId));
    if (!s) return;
    
    let avatarUrl = window.layAnhDaiDien ? window.layAnhDaiDien(s.id, s.name) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=random&color=fff';
    let studentTitles = window.calculateTitle ? window.calculateTitle(s) : "";
    let currentScore = Number(s.score) || 0;
    
    let overlay = document.createElement('div'); overlay.id = "profileModalAdmin"; 
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `
        <div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center relative animate-[cascadeDrop_0.4s_ease-out_forwards] overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            <button onclick="document.getElementById('profileModalAdmin').remove()" class="absolute top-4 right-4 w-8 h-8 bg-black/20 text-white rounded-full hover:bg-red-500 transition flex items-center justify-center font-bold text-xl z-20">&times;</button>
            
            <div class="relative z-10 mt-6">
                <div class="relative inline-block group cursor-pointer" onclick="window.gvDoiAnhHocSinh('${s.id}', '${s.name.replace(/'/g, "\\'")}')" title="Bấm để đổi ảnh cho học sinh này">
                    <img id="adminViewAvatarImg" src="${avatarUrl}" class="w-32 h-32 mx-auto rounded-full border-4 border-white shadow-xl object-cover bg-white transition group-hover:opacity-80">
                    <div class="absolute bottom-0 right-0 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-md group-hover:scale-110 transition">
                        <i class="fas fa-camera"></i>
                    </div>
                </div>
                
                <h3 class="text-2xl font-black text-slate-800 mt-4 mb-1">${s.name}</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">${s.chucvu || 'Học sinh'}</p>
                <div class="flex justify-center gap-2 mb-6 flex-wrap">${studentTitles}</div>
                
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-inner mb-6 text-left">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[11px] font-black text-slate-400 uppercase tracking-widest"><i class="fas fa-trophy text-yellow-500 mr-1"></i> Tổng điểm</span>
                        <span class="text-lg font-black text-indigo-600">${currentScore}</span>
                    </div>
                    <div class="w-full h-px bg-slate-200 mb-3"></div>
                    <div>
                        <span class="text-[11px] font-black text-slate-400 uppercase tracking-widest block mb-1"><i class="fas fa-phone-alt text-green-500 mr-1"></i> SĐT Phụ huynh</span>
                        <div class="flex justify-between text-sm font-bold text-slate-600">
                            <span>Bố: ${s.fatherPhone || '---'}</span>
                            <span>Mẹ: ${s.motherPhone || '---'}</span>
                        </div>
                    </div>
                </div>
                
                <button onclick="document.getElementById('profileModalAdmin').remove()" class="w-full bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition shadow-sm">
                    ĐÓNG HỒ SƠ
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.gvDoiAnhHocSinh = function(studentId, studentName) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; 
    input.onchange = async (e) => { 
        const file = e.target.files[0]; if (!file) return; 
        document.getElementById('loader').style.display = 'flex'; 
        let loaderText = document.querySelector('#loader p'); if(loaderText) loaderText.innerText = `ĐANG LƯU ẢNH CHO ${studentName.toUpperCase()}...`;
        
        const reader = new FileReader(); 
        reader.onload = function(event) { 
            const img = new Image(); 
            img.onload = async function() { 
                const canvas = document.createElement('canvas'); 
                const size = Math.min(img.width, img.height); const startX = (img.width - size) / 2; const startY = (img.height - size) / 2;
                const MAX_SIZE = 300; canvas.width = MAX_SIZE; canvas.height = MAX_SIZE;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, startX, startY, size, size, 0, 0, MAX_SIZE, MAX_SIZE); 
                const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; 
                
                try { 
                    const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) }); 
                    const result = await response.json(); 
                    if(result.url) { 
                        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: studentId, subject: "Avatar", group: "Ảnh đại diện", score: 0, score_earned: 0, details: result.url } }) });
                        Data.log = Data.log.filter(l => !(String(l.id) === String(studentId) && l.subject === "Avatar")); 
                        Data.log.push({ id: studentId, subject: "Avatar", group: "Ảnh đại diện", score: 0, real_added: 0, time: new Date().toISOString(), details: result.url });
                        
                        alert(`Đã đổi ảnh đại diện thành công cho em ${studentName}!`);
                        if (document.getElementById('profileModalAdmin')) { document.getElementById('profileModalAdmin').remove(); }
                        window.chuyenTrangQuanLy();
                    } else { alert("Lỗi! Không lấy được link ảnh từ Server."); } 
                } catch(err) { alert("Lỗi mạng khi tải ảnh lên!"); } finally { document.getElementById('loader').style.display = 'none'; if(loaderText) loaderText.innerText = "ĐANG TẢI DỮ LIỆU..."; }
            }; img.src = event.target.result; 
        }; reader.readAsDataURL(file); 
    }; input.click(); 
};

window.thuongNong = function(studentId, studentName, currentScore) {
    let overlay = document.createElement('div'); overlay.id = "thuongNongModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 fade-in";
    overlay.innerHTML = `
        <div class="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-[cascadeDrop_0.3s_ease-out_forwards]">
            <button onclick="document.getElementById('thuongNongModal').remove()" class="absolute top-4 right-4 w-8 h-8 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition flex items-center justify-center font-bold text-xl z-20">&times;</button>
            <div class="text-center mb-6"><div class="w-16 h-16 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner"><i class="fas fa-gift"></i></div><h3 class="text-xl font-black text-slate-800 uppercase tracking-wide">QUẢN LÝ TÀI SẢN</h3><p class="text-sm font-bold text-slate-500 mt-1">Học sinh: <span class="text-indigo-600">${studentName}</span></p></div>

            <div class="space-y-3 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                <div class="flex items-center justify-between gap-4"><label class="text-[11px] font-black text-slate-600 uppercase w-24"><i class="fas fa-star text-indigo-500 mr-1"></i> Điểm</label><input type="number" id="tn_points" value="0" class="w-full p-2 border-2 border-indigo-200 rounded-xl font-black text-indigo-600 text-center outline-none focus:border-indigo-500" placeholder="+/-"></div>
                <div class="flex items-center justify-between gap-4"><label class="text-[11px] font-black text-slate-600 uppercase w-24"><i class="fas fa-dharmachakra text-yellow-500 mr-1"></i> V.Quay</label><input type="number" id="tn_spins" value="0" class="w-full p-2 border-2 border-yellow-200 rounded-xl font-black text-yellow-600 text-center outline-none focus:border-yellow-500" placeholder="+/-"></div>
                <div class="flex items-center justify-between gap-4"><label class="text-[11px] font-black text-slate-600 uppercase w-24"><i class="fas fa-ticket-alt text-orange-500 mr-1"></i> Vé làm bài</label><input type="number" id="tn_tickets" value="0" class="w-full p-2 border-2 border-orange-200 rounded-xl font-black text-orange-600 text-center outline-none focus:border-orange-500" placeholder="+/-"></div>
                <div class="flex items-center justify-between gap-4"><label class="text-[11px] font-black text-slate-600 uppercase w-24"><i class="fas fa-rocket text-red-500 mr-1"></i> Lượt Game</label><input type="number" id="tn_games" value="0" class="w-full p-2 border-2 border-red-200 rounded-xl font-black text-red-600 text-center outline-none focus:border-red-500" placeholder="+/-"></div>
                <div class="pt-2 border-t border-slate-200 mt-2"><label class="text-[10px] font-black text-slate-400 uppercase block mb-1">Lý do (Tùy chọn)</label><input type="text" id="tn_reason" placeholder="Vd: Thưởng điểm xuất sắc" class="w-full p-2 border-2 border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-pink-400 text-sm"></div>
            </div>

            <div class="mt-6"><button onclick="window.xacNhanThuongNong('${studentId}', '${studentName}')" class="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black text-lg py-4 rounded-xl hover:scale-[1.02] transition shadow-lg btn-3d"><i class="fas fa-check-circle mr-1"></i> CẬP NHẬT TÀI SẢN</button></div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.xacNhanThuongNong = async function(studentId, studentName) {
    let pts = parseInt(document.getElementById('tn_points').value) || 0; let spins = parseInt(document.getElementById('tn_spins').value) || 0; let tickets = parseInt(document.getElementById('tn_tickets').value) || 0; let games = parseInt(document.getElementById('tn_games').value) || 0; let reason = document.getElementById('tn_reason').value.trim();

    if (pts === 0 && spins === 0 && tickets === 0 && games === 0) { alert("Thầy cần nhập ít nhất một con số (Điểm, Lượt quay, Vé, hoặc Lượt game) để cập nhật!"); return; }
    if (!reason) reason = (pts >= 0 && spins >= 0 && tickets >= 0 && games >= 0) ? "Thưởng quà từ GVCN" : "Phạt trừ tài sản từ GVCN";

    document.getElementById('thuongNongModal').remove(); document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG ĐỒNG BỘ LÊN ĐÁM MÂY...";

    let thoiGianThuc = new Date().toLocaleString('vi-VN'); let uniqueBonusSession = "Quản lý Tài sản (" + thoiGianThuc + ")";

    try {
        if (pts !== 0) {
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: studentId, subject: "Bonus", group: uniqueBonusSession, score: pts, score_earned: pts, details: reason } }) });
            Data.log.push({ id: studentId, subject: "Bonus", group: uniqueBonusSession, score: pts, real_added: pts, time: new Date().toISOString(), details: reason });
            let hs = Data.hs.find(x => String(x.id) === String(studentId)); if (hs) hs.score = Number(hs.score) + pts;
        }

        if (spins !== 0 || tickets !== 0 || games !== 0) {
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'update_inventory', data: { id_hs: studentId, spins: spins, tickets: tickets, games: games } }) });
            let hs = Data.hs.find(x => String(x.id) === String(studentId));
            if(hs) {
                hs.luotQuay = (Number(hs.luotQuay) || 0) + spins; if(hs.luotQuay < 0) hs.luotQuay = 0;
                hs.veLamLai = (Number(hs.veLamLai) || 0) + tickets; if(hs.veLamLai < 0) hs.veLamLai = 0;
                hs.luotGame = (Number(hs.luotGame) || 0) + games; if(hs.luotGame < 0) hs.luotGame = 0;
            }
        }

        alert(`Thành công! Đã cập nhật tài sản cho ${studentName}.`); window.chuyenTrangQuanLy(); 
    } catch(e) { alert("Lỗi mạng, chưa cập nhật được tài sản!"); } finally { document.getElementById('loader').style.display = 'none'; document.querySelector('#loader p').innerText = "ĐANG TẢI DỮ LIỆU..."; }
};

// ==========================================
// 13. HỒ SƠ CÁ NHÂN & ĐỔI ẢNH ĐẠI DIỆN
// ==========================================
window.layAnhDaiDien = function(studentId, studentName) {
    let avatarLogs = Data.log.filter(l => String(l.id) === String(studentId) && l.subject === "Avatar");
    if (avatarLogs.length > 0) { avatarLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); return avatarLogs[0].details; }
    return 'https://ui-avatars.com/api/?name=' + encodeURIComponent(studentName) + '&background=random&color=fff&size=200&bold=true';
};
window.moHoSoCaNhan = function() {
    if(!currentUser) return showLogin();
    closeMenu();
    
    let savedAvatar = window.layAnhDaiDien(currentUser.id, currentUser.name);
    let btnAvatar = document.getElementById('btnHeaderAvatar');
    let headerImg = document.getElementById('headerAvatarImg');
    if(btnAvatar && headerImg) {
        btnAvatar.classList.remove('hidden');
        headerImg.src = savedAvatar;
    }
    
    let studentTitles = window.calculateTitle ? window.calculateTitle(currentUser) : "";
    if(!studentTitles) studentTitles = `<span class="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-lg font-bold">Chiến binh mới</span>`;

    // Đọc Vé làm bài và Lượt quay
    let veLamLai = Number(currentUser.veLamLai) || 0;
    let luotQuay = window.tinhLuotQuayHienTai ? window.tinhLuotQuayHienTai() : (Number(currentUser.luotQuay) || 0);

    // --- BỔ SUNG: TÍNH CHÍNH XÁC LƯỢT GAME (GỒM CẢ LƯỢT FREE) ---
    let todayGame = new Date();
    let soLanDaChoiHomNay = Data.log.filter(l => {
        if (String(l.id) !== String(currentUser.id) || l.subject !== "MathGame") return false;
        let d = new Date(l.time);
        return !isNaN(d) && d.getDate() === todayGame.getDate() && d.getMonth() === todayGame.getMonth() && d.getFullYear() === todayGame.getFullYear();
    }).length;
    
    let luotGameCloud = Number(currentUser.luotGame) || 0;
    // Công thức: 1 lượt free + lượt Cloud - số lần đã chơi hôm nay
    let luotGame = (1 + luotGameCloud) - soLanDaChoiHomNay;
    if (luotGame < 0) luotGame = 0; // Đảm bảo không bị âm
    // -------------------------------------------------------------

    document.getElementById('content').innerHTML = `
        <div class="flex items-center mb-6 fade-in">
            <button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500 hover:bg-slate-50 transition"><i class="fas fa-arrow-left"></i></button>
            <h2 class="font-black text-xl text-indigo-600 uppercase">HỒ SƠ CỦA TÔI</h2>
        </div>
        
        <div class="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in max-w-sm mx-auto relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
            
            <div class="relative z-10 mt-10">
                <div class="relative inline-block group cursor-pointer" onclick="window.doiAnhDaiDien()" title="Bấm để đổi ảnh đại diện">
                    <img id="myAvatarImg" src="${savedAvatar}" class="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover bg-white transition group-hover:opacity-80">
                    <div class="absolute bottom-0 right-0 bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-md group-hover:scale-110 transition">
                        <i class="fas fa-camera"></i>
                    </div>
                </div>
                
                <h3 class="text-2xl font-black text-slate-800 mt-4 mb-1">${currentUser.name}</h3>
                <div class="flex justify-center gap-2 mb-6 flex-wrap">${studentTitles}</div>
                
                <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-3 gap-2 shadow-inner">
                    <div class="flex flex-col items-center">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lượt quay</p>
                        <p class="text-xl font-black text-yellow-500">${luotQuay}</p>
                    </div>
                    <div class="flex flex-col items-center border-l border-r border-slate-200">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng điểm</p>
                        <p class="text-2xl font-black text-indigo-600">${currentUser.score || 0}</p>
                    </div>
                    <div class="flex flex-col items-center">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lượt Game</p>
                        <p class="text-xl font-black text-red-500">${luotGame}</p>
                    </div>
                </div>
                
                <button onclick="window.doiAnhDaiDien()" class="w-full mt-6 bg-indigo-50 text-indigo-600 font-bold py-3 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition shadow-sm btn-3d">
                    <i class="fas fa-upload mr-1"></i> Tải ảnh từ máy lên
                </button>
            </div>
        </div>
    `;
};

window.doiAnhDaiDien = function() {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = 'image/*'; 
    input.onchange = async (e) => { 
        const file = e.target.files[0]; 
        if (!file) return; 
        
        document.getElementById('loader').style.display = 'flex'; 
        let loaderText = document.querySelector('#loader p');
        if(loaderText) loaderText.innerText = "ĐANG TỐI ƯU & LƯU ẢNH LÊN MẠNG...";
        
        const reader = new FileReader(); 
        reader.onload = function(event) { 
            const img = new Image(); 
            img.onload = async function() { 
                const canvas = document.createElement('canvas'); 
                
                const size = Math.min(img.width, img.height);
                const startX = (img.width - size) / 2;
                const startY = (img.height - size) / 2;
                
                const MAX_SIZE = 300; 
                canvas.width = MAX_SIZE; 
                canvas.height = MAX_SIZE; 
                
                const ctx = canvas.getContext('2d'); 
                ctx.drawImage(img, startX, startY, size, size, 0, 0, MAX_SIZE, MAX_SIZE); 
                
                const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; 
                
                try { 
                    const response = await fetch(API_URL, { 
                        method: 'POST', 
                        body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) 
                    }); 
                    const result = await response.json(); 
                    
                    if(result.url) { 
                        await fetch(API_URL, { 
                            method: 'POST', 
                            body: JSON.stringify({ 
                                action: 'nop_bai', 
                                data: { 
                                    id_hs: currentUser.id, 
                                    subject: "Avatar", 
                                    group: "Ảnh đại diện", 
                                    score: 0, 
                                    score_earned: 0, 
                                    details: result.url 
                                } 
                            }) 
                        });
                        
                        Data.log = Data.log.filter(l => !(String(l.id) === String(currentUser.id) && l.subject === "Avatar")); 
                        Data.log.push({
                            id: currentUser.id, subject: "Avatar", group: "Ảnh đại diện", 
                            score: 0, real_added: 0, time: new Date().toISOString(), details: result.url
                        });
                        
                        let avatarImg = document.getElementById('myAvatarImg');
                        if(avatarImg) avatarImg.src = result.url;
                        let headerImg = document.getElementById('headerAvatarImg');
                        if(headerImg) headerImg.src = result.url;
                        let menuSideImg = document.querySelector('#menuSideAvatar img');
                        if(menuSideImg) menuSideImg.src = result.url;

                        alert('Tuyệt vời! Ảnh đại diện của con đã được đồng bộ lên hệ thống.');
                    } else { 
                        alert("Lỗi! Không lấy được link ảnh từ Server."); 
                    } 
                } catch(err) { 
                    alert("Lỗi mạng khi tải ảnh lên!"); 
                } finally {
                    document.getElementById('loader').style.display = 'none'; 
                    if(loaderText) loaderText.innerText = "ĐANG TẢI DỮ LIỆU...";
                }
            }; 
            img.src = event.target.result; 
        }; 
        reader.readAsDataURL(file); 
    }; 
    input.click(); 
};
window.doiMauNenTheoNgay = function() {
    const header = document.querySelector('header'); if (!header) return;
    const day = new Date().getDay(); 
    const themes = [ 'bg-gradient-to-r from-red-100/90 via-orange-50/90 to-white/90 border-red-100', 'bg-gradient-to-r from-amber-100/90 via-yellow-50/90 to-white/90 border-amber-100', 'bg-gradient-to-r from-rose-100/90 via-pink-50/90 to-white/90 border-rose-100', 'bg-gradient-to-r from-emerald-100/90 via-teal-50/90 to-white/90 border-emerald-100', 'bg-gradient-to-r from-blue-100/90 via-sky-50/90 to-white/90 border-blue-100', 'bg-gradient-to-r from-purple-100/90 via-fuchsia-50/90 to-white/90 border-purple-100', 'bg-gradient-to-r from-indigo-100/90 via-cyan-50/90 to-white/90 border-indigo-100' ];
    const baseClasses = "backdrop-blur-md sticky top-0 z-50 border-b px-4 sm:px-6 py-3 flex justify-between items-center shadow-sm transition-all duration-1000";
    header.className = themes[day] + " " + baseClasses;
};
window.doiMauNenTheoNgay(); document.addEventListener("DOMContentLoaded", window.doiMauNenTheoNgay);

window.moRaDaHoatDong = async function() {
    closeMenu(); if (!(await window.loadAllDataOnce())) return;
    let html = `<div class="flex items-center mb-6 fade-in"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500 hover:bg-slate-50 transition"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-emerald-600 uppercase">TRẠNG THÁI</h2></div><div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 fade-in mb-10"><div class="flex items-center justify-between mb-6 border-b border-slate-100 pb-4"><div><h3 class="text-lg font-black text-slate-800"><i class="fas fa-broadcast-tower text-emerald-500 mr-2 animate-pulse"></i>Trạng thái hoạt động</h3><p class="text-xs text-slate-500 font-bold mt-1">Dựa trên các tương tác nộp bài, chơi game, quay thưởng gần nhất.</p></div></div><div class="space-y-3">`;
    const now = new Date();
    let studentActivity = Data.hs.filter(s => (s.role || '').toLowerCase() !== 'admin').map(s => {
        let userLogs = Data.log.filter(l => String(l.id) === String(s.id)); let lastActionTime = 0; let lastActionName = "Chưa có hoạt động";
        if (userLogs.length > 0) {
            userLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); let latestLog = userLogs[0]; let d = new Date(latestLog.time);
            if (!isNaN(d.getTime())) {
                lastActionTime = d;
                if (latestLog.subject === 'math') lastActionName = "Vừa làm Toán: " + latestLog.group;
                else if (latestLog.subject === 'tv' || latestLog.subject === 'vietnamese') lastActionName = "Vừa làm T.Việt: " + latestLog.group;
                else if (latestLog.subject === 'LuckySpin') lastActionName = "Vừa quay Vòng quay may mắn";
                else if (latestLog.subject === 'MathGame') lastActionName = "Vừa chơi Bảo vệ Trái Đất";
                else if (latestLog.subject === 'Avatar') lastActionName = "Vừa đổi Ảnh đại diện";
                else if (latestLog.subject === 'PeerMessage') lastActionName = "Vừa gửi một bức thư";
                else lastActionName = "Hoạt động: " + latestLog.group;
            }
        }
        return { ...s, lastActionTime, lastActionName };
    });

    studentActivity.sort((a, b) => { let timeA = a.lastActionTime ? a.lastActionTime.getTime() : 0; let timeB = b.lastActionTime ? b.lastActionTime.getTime() : 0; return timeB - timeA; });

    studentActivity.forEach(s => {
        let statusHtml = ""; let timeString = "";
        if (!s.lastActionTime) { statusHtml = `<span class="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg"><div class="w-2 h-2 rounded-full bg-slate-300"></div> Vắng mặt</span>`; timeString = "Chưa truy cập"; } 
        else {
            let diffMinutes = Math.floor((now - s.lastActionTime) / 60000);
            if (diffMinutes < 30) { statusHtml = `<span class="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 shadow-sm"><div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Đang học</span>`; timeString = diffMinutes <= 1 ? "Vừa xong" : `${diffMinutes} phút trước`; } 
            else if (diffMinutes < 60 * 24) { let hours = Math.floor(diffMinutes / 60); statusHtml = `<span class="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg"><div class="w-2 h-2 rounded-full bg-blue-400"></div> Hôm nay</span>`; timeString = `${hours} giờ trước`; } 
            else { let days = Math.floor(diffMinutes / (60 * 24)); statusHtml = `<span class="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg"><div class="w-2 h-2 rounded-full bg-slate-400"></div> Offline</span>`; timeString = `${days} ngày trước`; }
        }
        let avatarUrl = window.layAnhDaiDien ? window.layAnhDaiDien(s.id, s.name) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=random&color=fff';
        html += `<div class="flex items-center justify-between p-3 bg-white border-2 border-slate-50 rounded-2xl hover:border-emerald-200 transition"><div class="flex items-center gap-3"><img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"><div><h4 class="font-black text-slate-700 text-sm sm:text-base">${s.name}</h4><p class="text-[11px] font-medium text-slate-500 mt-0.5 truncate max-w-[150px] sm:max-w-xs">${s.lastActionName}</p></div></div><div class="flex flex-col items-end gap-1">${statusHtml}<span class="text-[10px] font-bold text-slate-400">${timeString}</span></div></div>`;
    });
    html += `</div></div>`; document.getElementById('content').innerHTML = html;
};
// ==========================================
// TÍNH NĂNG BỔ SUNG: NÚT RADAR TRẠNG THÁI LỚP (BẢN CẬP NHẬT MÀU SẮC & BỎ ĐIỂM)
// ==========================================

// Hàm mở Popup danh sách trạng thái toàn lớp
window.moModalTrangThaiLop = async function() {
    if (!window.isAllDataLoaded) await window.loadAllDataOnce(false, true);
    
    let overlay = document.createElement('div');
    overlay.id = "modalTrangThaiLop";
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 fade-in";
    
    const now = new Date();
    
    // Lấy toàn bộ học sinh và tính toán thời gian hoạt động cuối cùng (Bỏ tính điểm)
    let students = Data.hs.filter(s => (s.role || '').toLowerCase() !== 'admin').map(s => {
        let userLogs = Data.log.filter(l => String(l.id) === String(s.id));
        let lastActionTime = 0; 
        if (userLogs.length > 0) {
            userLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime());
            let d = new Date(userLogs[0].time);
            if (!isNaN(d.getTime())) lastActionTime = d;
        }
        return { ...s, lastActionTime };
    });

    // Sắp xếp: Theo thời gian hoạt động mới nhất lên đầu
    students.sort((a, b) => {
        let timeA = a.lastActionTime ? a.lastActionTime.getTime() : 0;
        let timeB = b.lastActionTime ? b.lastActionTime.getTime() : 0;
        return timeB - timeA;
    });

    let listHtml = students.map(s => {
        let statusDot = ""; 
        let timeString = ""; 
        let statusBadge = "";

        if (!s.lastActionTime) { 
            statusDot = "bg-black"; // Màu đen
            timeString = "Chưa truy cập"; 
            statusBadge = `<span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">Offline</span>`;
        } else {
            let diffMinutes = Math.floor((now - s.lastActionTime) / 60000);
            if (diffMinutes < 30) { 
                statusDot = "bg-green-500 animate-pulse ring-2 ring-green-200"; // Xanh lá
                timeString = diffMinutes <= 1 ? "Vừa xong" : `${diffMinutes} phút trước`; 
                statusBadge = `<span class="text-[10px] font-black text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-lg">Đang học</span>`;
            } 
            else if (diffMinutes < 60 * 24) { 
                statusDot = "bg-blue-500"; // Xanh dương
                let hours = Math.floor(diffMinutes / 60);
                timeString = hours > 0 ? `${hours} giờ trước` : `${diffMinutes} phút trước`; 
                statusBadge = `<span class="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg">Hôm nay</span>`;
            } 
            else { 
                statusDot = "bg-black"; // Màu đen
                timeString = "Trước đó"; 
                statusBadge = `<span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">Offline</span>`;
            }
        }
        
        let avatarUrl = window.layAnhDaiDien ? window.layAnhDaiDien(s.id, s.name) : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(s.name) + '&background=random&color=fff';
        
        return `
            <div class="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition rounded-xl">
                <div class="flex items-center gap-3">
                    <div class="relative shrink-0">
                        <img src="${avatarUrl}" class="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm">
                        <span class="absolute bottom-0 right-0 w-3 h-3 ${statusDot} border-2 border-white rounded-full"></span>
                    </div>
                    <div>
                        <div class="font-black text-slate-700 text-sm">${s.name}</div>
                        <div class="text-[10px] text-slate-500 font-medium mt-0.5"><i class="fas fa-clock mr-1 opacity-70"></i>${timeString}</div>
                    </div>
                </div>
                <div class="text-right">
                    ${statusBadge}
                </div>
            </div>
        `;
    }).join('');

    overlay.innerHTML = `
        <div class="bg-white w-full max-w-md rounded-[2rem] shadow-2xl relative flex flex-col max-h-[85vh] animate-[cascadeDrop_0.3s_ease-out_forwards]">
            <div class="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
                <h3 class="font-black text-lg text-emerald-600 uppercase flex items-center gap-2"><i class="fas fa-broadcast-tower animate-pulse"></i> Trạng Thái Lớp Học</h3>
                <button onclick="document.getElementById('modalTrangThaiLop').remove()" class="w-8 h-8 bg-white text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition shadow-sm font-bold text-xl flex items-center justify-center">&times;</button>
            </div>
            <div class="p-3 overflow-y-auto custom-scrollbar flex-1">
                ${listHtml}
            </div>
            <div class="p-3 bg-slate-50 rounded-b-[2rem] border-t border-slate-100 text-center">
                <p class="text-[10px] text-slate-400 font-bold italic">Danh sách hiển thị toàn bộ ${students.length} học sinh</p>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

// Hàm tự động tạo nút Radar nổi ở góc màn hình
window.taoNutTrangThaiNoi = function() {
    if (document.getElementById('btnTrangThaiNoi')) return;
    let btn = document.createElement('button');
    btn.id = "btnTrangThaiNoi";
    btn.onclick = window.moModalTrangThaiLop;
    btn.className = "fixed bottom-6 left-6 z-50 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white w-14 h-14 rounded-full flex justify-center items-center text-2xl shadow-[0_4px_15px_rgba(16,185,129,0.5)] border-2 border-white hover:scale-110 transition animate-bounce btn-3d";
    btn.innerHTML = '<i class="fas fa-satellite-dish"></i>';
    btn.title = "Xem trạng thái lớp học";
    document.body.appendChild(btn);
};

// Kích hoạt tạo nút khi Web tải xong
document.addEventListener("DOMContentLoaded", window.taoNutTrangThaiNoi);
setTimeout(window.taoNutTrangThaiNoi, 1000);
// ==========================================
// TÍNH NĂNG BỔ SUNG: HỆ THỐNG PHẠT - KHÓA TÍNH NĂNG GIẢI TRÍ
// ==========================================
window.checkIsBlocked = function(studentId) {
    let penaltyLogs = Data.log.filter(l => String(l.id) === String(studentId) && l.subject === "Penalty" && l.group === "BlockGameSpin");
    if (penaltyLogs.length === 0) return false;
    penaltyLogs.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    let latestLog = penaltyLogs[0];
    let expireTime = Number(latestLog.details); 
    if (!isNaN(expireTime) && Date.now() < expireTime) {
        return new Date(expireTime); // Trả về ngày hết hạn
    }
    return false; // Đã hết hạn hoặc không bị khóa
};

window.moKhoaTaiKhoan = function(studentId, studentName) {
    let currentBlock = window.checkIsBlocked(studentId);
    let statusHtml = currentBlock ? 
        `<div class="bg-red-100 text-red-700 p-3 rounded-xl mb-4 font-bold text-sm border border-red-200"><i class="fas fa-ban mr-1"></i> Đang bị phạt khóa đến:<br>${currentBlock.toLocaleString('vi-VN')}</div>` : 
        `<div class="bg-green-100 text-green-700 p-3 rounded-xl mb-4 font-bold text-sm border border-green-200"><i class="fas fa-check-circle mr-1"></i> Trạng thái bình thường (Đang tự do)</div>`;

    let overlay = document.createElement('div');
    overlay.id = "khoaTaiKhoanModal";
    overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 fade-in";
    overlay.innerHTML = `
        <div class="bg-white p-6 sm:p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative animate-[cascadeDrop_0.3s_ease-out_forwards]">
            <button onclick="document.getElementById('khoaTaiKhoanModal').remove()" class="absolute top-4 right-4 w-8 h-8 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition flex items-center justify-center font-bold text-xl z-20">&times;</button>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 shadow-inner"><i class="fas fa-lock"></i></div>
                <h3 class="text-xl font-black text-slate-800 uppercase tracking-wide">PHẠT KHÓA TÍNH NĂNG</h3>
                <p class="text-sm font-bold text-slate-500 mt-1">Học sinh: <span class="text-indigo-600">${studentName}</span></p>
            </div>
            ${statusHtml}
            <div class="space-y-3 text-left">
                <label class="text-[11px] font-black text-slate-500 uppercase block">Thời gian tước quyền (Game & Vòng quay)</label>
                <select id="khoa_duration" class="w-full p-3 border-2 border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-red-500 bg-slate-50">
                    <option value="1">Khóa 1 ngày (24 giờ)</option>
                    <option value="2">Khóa 2 ngày</option>
                    <option value="3">Khóa 3 ngày</option>
                    <option value="7">Khóa 1 tuần (7 ngày)</option>
                    <option value="30">Khóa 1 tháng (30 ngày)</option>
                    <option value="0" class="text-green-600 font-black">MỞ KHÓA NGAY LẬP TỨC 🟢</option>
                </select>
                <input type="text" id="khoa_reason" placeholder="Lý do: Gian lận làm bài, copy bài..." class="w-full p-3 border-2 border-slate-200 rounded-xl font-medium text-slate-700 outline-none focus:border-red-500 text-sm mt-3 bg-slate-50">
            </div>
            <div class="mt-6">
                <button onclick="window.xacNhanKhoa('${studentId}', '${studentName}')" class="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-lg py-4 rounded-xl hover:scale-[1.02] transition shadow-lg btn-3d"><i class="fas fa-gavel mr-1"></i> THỰC THI LỆNH PHẠT</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
};

window.xacNhanKhoa = async function(studentId, studentName) {
    let days = parseInt(document.getElementById('khoa_duration').value);
    let reason = document.getElementById('khoa_reason').value.trim() || "Vi phạm nội quy lớp học";
    
    document.getElementById('khoaTaiKhoanModal').remove();
    document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG GHI LỆNH LÊN MÁY CHỦ...";
    
    let expireTime = 0;
    if (days > 0) { expireTime = Date.now() + (days * 24 * 60 * 60 * 1000); }
    let logMsg = days > 0 ? `Đã tước quyền ${days} ngày với lý do: ${reason}` : `Đã mở khóa ân xá thành công`;
    
    try {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: studentId, subject: "Penalty", group: "BlockGameSpin", score: 0, score_earned: 0, details: expireTime.toString() } }) });
        Data.log.push({ id: studentId, subject: "Penalty", group: "BlockGameSpin", score: 0, real_added: 0, time: new Date().toISOString(), details: expireTime.toString() });
        alert(`Thành công! ${logMsg}`);
        window.chuyenTrangQuanLy(); 
    } catch(e) { alert("Lỗi mạng, chưa thực thi được lệnh phạt!"); } 
    finally { document.getElementById('loader').style.display = 'none'; document.querySelector('#loader p').innerText = "ĐANG TẢI DỮ LIỆU..."; }
};

// ==========================================
// GAME: LẬT THẺ CÂU ĐỐ VIP (Glassmorphism + Ẩn Thẻ Đúng)
// ==========================================
let memoryGame = {
    cards: [], flipped: [], matchedCount: 0, lockBoard: false, timer: null, timeLeft: 600, score: 0
};

// --- HỆ THỐNG ÂM THANH KỸ THUẬT SỐ ---
window.phatAmThanhGame = function(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        if (type === 'dung') { 
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); 
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); 
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
        } else if (type === 'sai') { 
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, ctx.currentTime);
            osc.frequency.setValueAtTime(100, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'lat') { 
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
        }
    } catch(e) {} 
};

window.moGameLatTheToan = function() {
    if(!currentUser) return showLogin();
    closeMenu();

    let todayGame = new Date();
    let soLanDaChoiHomNay = Data.log.filter(l => {
        if (String(l.id) !== String(currentUser.id) || !l.subject.includes("MathGame_LatThe")) return false;
        let d = new Date(l.time);
        return !isNaN(d) && d.getDate() === todayGame.getDate() && d.getMonth() === todayGame.getMonth() && d.getFullYear() === todayGame.getFullYear();
    }).length;

    document.getElementById('content').innerHTML = `
        <div class="fixed inset-0 z-[100] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-indigo-50 flex flex-col items-center justify-center font-sans p-4">
            <div class="bg-white/95 backdrop-blur-md p-8 rounded-[3rem] shadow-2xl w-full max-w-md text-center border-4 border-fuchsia-300 relative">
                <button onclick="veTrangChu(); moGocHocTap();" class="absolute top-4 right-4 w-10 h-10 bg-slate-100 text-slate-500 rounded-full hover:bg-red-500 hover:text-white transition font-bold shadow-sm"><i class="fas fa-times"></i></button>
                <div class="text-5xl sm:text-6xl mb-4 animate-bounce drop-shadow-md">🧩</div>
                <h2 class="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-500 mb-2 uppercase drop-shadow-sm">LẬT THẺ CÂU ĐỐ</h2>
                <p class="text-slate-500 font-bold mb-6 bg-indigo-50 py-2 rounded-xl border border-indigo-100">Hôm nay con đã chơi: <span class="${soLanDaChoiHomNay >= 2 ? 'text-red-500' : 'text-emerald-500'}">${soLanDaChoiHomNay} / 2 lần</span></p>
                
                <div class="space-y-4">
                    <button onclick="${soLanDaChoiHomNay >= 2 ? "alert('Con đã hết lượt chơi hôm nay!')" : "window.batDauLatThe()"}" class="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-black py-4 rounded-2xl shadow-[0_5px_0_#0284c7] hover:translate-y-1 hover:shadow-none transition flex items-center justify-center gap-3 text-xl btn-3d">
                        <i class="fas fa-play-circle text-2xl"></i> BẮT ĐẦU CHƠI
                    </button>
                    <button onclick="window.xemBxhLatThe()" class="w-full bg-fuchsia-100 text-fuchsia-700 font-black py-4 rounded-2xl shadow-[0_5px_0_#d946ef] hover:translate-y-1 hover:shadow-none transition flex items-center justify-center gap-3 text-xl border-2 border-fuchsia-300 btn-3d">
                        <i class="fas fa-trophy text-2xl"></i> BẢNG XẾP HẠNG
                    </button>
                </div>
            </div>
        </div>
    `;
};

// --- BẢNG XẾP HẠNG ---
window.xemBxhLatThe = function() {
    let scores = {};
    Data.log.forEach(l => {
        if (l.subject && l.subject.includes("MathGame_LatThe")) {
            if(!scores[l.id]) scores[l.id] = 0;
            scores[l.id] += (Number(l.score) || 0);
        }
    });
    
    let arrBxh = [];
    Object.keys(scores).forEach(id => {
        let hs = Data.hs.find(h => String(h.id) === String(id));
        if (hs && hs.role === 'student') arrBxh.push({ name: hs.name, score: scores[id] });
    });
    arrBxh.sort((a,b) => b.score - a.score);
    let top10 = arrBxh.slice(0, 10);

    let bxhHtml = top10.map((hs, i) => `
        <div class="flex items-center justify-between bg-white/70 backdrop-blur-md p-3 rounded-xl border border-cyan-100 shadow-sm mb-2">
            <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-full flex items-center justify-center font-black ${i===0?'bg-yellow-400 text-white shadow-md':i===1?'bg-slate-300 text-white shadow-md':i===2?'bg-orange-300 text-white shadow-md':'bg-cyan-50 text-cyan-600'}">${i+1}</span>
                <span class="font-bold text-slate-700">${hs.name}</span>
            </div>
            <span class="font-black text-cyan-600">${hs.score} đ</span>
        </div>
    `).join('');

    if (top10.length === 0) bxhHtml = `<p class="text-slate-500 italic p-4 text-center">Chưa có ai chơi game này!</p>`;

    let modal = document.createElement('div');
    modal.className = "fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-[cascadeDrop_0.3s_ease-out_forwards]";
    modal.innerHTML = `
        <div class="bg-cyan-50 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border-4 border-white">
            <div class="bg-gradient-to-r from-cyan-500 to-blue-500 p-4 flex justify-between items-center text-white">
                <h3 class="font-black text-xl"><i class="fas fa-crown text-yellow-300 mr-2"></i>CAO THỦ LẬT THẺ</h3>
                <button onclick="this.closest('.fixed').remove()" class="hover:text-cyan-200 transition text-2xl"><i class="fas fa-times"></i></button>
            </div>
            <div class="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">${bxhHtml}</div>
        </div>
    `;
    document.body.appendChild(modal);
};

// --- KHỞI TẠO GAME TỪ SHEET ---
window.batDauLatThe = function() {
    let fallbackData = [
        { cauhoi: "Con gì có cánh, Mà lại biết bơi?", dapan: "Chim cánh cụt", img: "🐧" },
        { cauhoi: "Con gì cổ dài, Ăn lá trên cao?", dapan: "Hươu cao cổ", img: "🦒" },
        { cauhoi: "Con gì mào đỏ, Gáy sáng ò ó o?", dapan: "Con gà trống", img: "🐓" },
        { cauhoi: "Quả gì ruột đỏ, Vỏ xanh chấm đen?", dapan: "Dưa hấu", img: "🍉" },
        { cauhoi: "Con gì tám cẳng hai càng?", dapan: "Con cua", img: "🦀" },
        { cauhoi: "Cái gì để che nắng mưa?", dapan: "Cái ô (dù)", img: "☂️" },
        { cauhoi: "Quả gì năm múi, Cắt ra hình sao?", dapan: "Quả khế", img: "⭐" },
        { cauhoi: "Con gì giữ nhà, Thấy khách sủa gâu?", dapan: "Con chó", img: "🐶" },
        { cauhoi: "Mùa gì phượng vĩ nở rực?", dapan: "Mùa hè", img: "☀️" },
        { cauhoi: "Xe gì hai bánh, Đạp chạy bon bon?", dapan: "Xe đạp", img: "🚲" }
    ];

    let sourceData = (Data.caudo && Data.caudo.length >= 10) ? Data.caudo : fallbackData;
    let selectedPairs = sourceData.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    // BỘ ICON CHO MẶT ÚP 
    const cardBackIcons = ['🦁','🐯','🐘','🦒','🐻','🐨','🐹','🐰','🐶','🐱','🦜','🦋','🍎','🍕','🎁','✈️','🚀','🎸','⚽','🌈'];
    const shuffledBackIcons = cardBackIcons.sort(() => 0.5 - Math.random()); 
    let cardCount = 0;

    // BỘ MÀU GRADIENT PASTEL-NEON CHO MẶT ÚP (Dùng opacity 70% để tạo hiệu ứng kính)
    const pastelNeonGradients = [
        'from-pink-400/70 to-rose-400/70',
        'from-fuchsia-400/70 to-purple-500/70',
        'from-cyan-400/70 to-blue-500/70',
        'from-emerald-400/70 to-teal-500/70',
        'from-amber-400/70 to-orange-500/70',
        'from-violet-400/70 to-fuchsia-500/70',
        'from-lime-400/70 to-green-500/70',
        'from-sky-400/70 to-indigo-500/70'
    ];

    let cards = [];
    let colorClasses = ['text-pink-600', 'text-blue-600', 'text-teal-600', 'text-fuchsia-600', 'text-orange-600'];
    
    selectedPairs.forEach((item, index) => {
        let qText = item.cauhoi || item['cauhoi'] || "Lỗi câu hỏi";
        let aText = item.dapan || item['dapan'] || "Lỗi đáp án";
        let img = item.icon || item.Icon || item.img || "✨";
        let randTextColor = colorClasses[index % colorClasses.length];

        // Mặt úp Gradient Neon Glassmorphism
        let qBgColor = pastelNeonGradients[Math.floor(Math.random() * pastelNeonGradients.length)];
        let qBackIcon = shuffledBackIcons[cardCount];
        cardCount++;

        cards.push({ 
            matchId: index, type: 'Q', text: qText, backIcon: qBackIcon, upTheme: `bg-gradient-to-br ${qBgColor}`,
            textClass: 'text-indigo-900 text-[13px] sm:text-sm font-bold' 
        });

        let aBgColor = pastelNeonGradients[Math.floor(Math.random() * pastelNeonGradients.length)];
        let aBackIcon = shuffledBackIcons[cardCount];
        cardCount++;

        cards.push({ 
            matchId: index, type: 'A', text: `<div class="text-[1.8rem] mb-1 drop-shadow-sm">${img}</div><span class="text-xs sm:text-sm block">${aText}</span>`, backIcon: aBackIcon, upTheme: `bg-gradient-to-br ${aBgColor}`,
            textClass: `${randTextColor} font-black drop-shadow-sm` 
        });
    });
    
    memoryGame.cards = cards.sort(() => 0.5 - Math.random());
    memoryGame.flipped = [];
    memoryGame.matchedCount = 0;
    memoryGame.lockBoard = false;
    memoryGame.timeLeft = 600; 
    memoryGame.score = 0;

    document.getElementById('content').innerHTML = `
        <div class="fixed inset-0 z-[100] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-indigo-50 overflow-hidden flex flex-col font-sans select-none" id="game-ui-container">
            <div class="bg-white/70 backdrop-blur-md border-b border-white/50 p-2 sm:p-3 flex justify-between items-center shadow-md relative z-20">
                <button onclick="window.moGameLatTheToan()" class="w-10 h-10 rounded-full bg-white/50 text-slate-500 flex items-center justify-center font-bold text-xl hover:bg-red-500 hover:text-white transition shadow-sm shrink-0 border border-white"><i class="fas fa-arrow-left"></i></button>
                <div class="flex-1 text-center px-2">
                    <h2 class="text-sm sm:text-lg font-black text-cyan-600 uppercase tracking-widest drop-shadow-sm truncate"><i class="fas fa-puzzle-piece mr-1"></i>TÌM CẶP CÂU ĐỐ</h2>
                </div>
                <div class="flex gap-2 shrink-0">
                    <div class="bg-yellow-100/80 backdrop-blur-sm px-3 py-1.5 rounded-full font-black text-yellow-700 shadow-inner flex items-center gap-1 border border-yellow-200">
                        <i class="fas fa-star text-yellow-500"></i> <span id="mg-score-latthe">0</span>
                    </div>
                    <div class="bg-cyan-100/80 backdrop-blur-sm px-3 py-1.5 rounded-full font-black text-cyan-700 shadow-inner flex items-center gap-1 border border-cyan-200">
                        <i class="fas fa-stopwatch animate-pulse text-fuchsia-500"></i> <span id="mg-timer-latthe">10:00</span>
                    </div>
                </div>
            </div>

            <style>
                .memory-card { perspective: 1000px; cursor: pointer; }
                .memory-card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style: preserve-3d; }
                .memory-card.flipped .memory-card-inner { transform: rotateY(180deg); }
                
                /* Layout chung cho cả 2 mặt thẻ */
                .memory-card-front, .memory-card-back { 
                    position: absolute; width: 100%; height: 100%; 
                    backface-visibility: hidden; border-radius: 1rem; 
                    display: flex; align-items: center; justify-content: center; 
                    flex-direction: column; text-align: center; padding: 0.5rem;
                }
                
                /* MẶT ÚP: Glassmorphism + Gradient Pastel */
                .memory-card-front { 
                    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                    border: 2px solid rgba(255,255,255,0.6); 
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                    font-size: 1.7rem; color: rgba(255,255,255,0.9); 
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.2); 
                }
                
                /* MẶT NGỬA: Kính mờ trắng sáng */
                .memory-card-back { 
                    transform: rotateY(180deg); 
                    background: rgba(255, 255, 255, 0.5);
                    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                    border: 2px solid rgba(255,255,255,0.7); 
                    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
                }

                /* HIỆU ỨNG KHI ĐÚNG: Nổ to lên rồi mờ dần và biến mất hoàn toàn */
                .matched { animation: hideMatched 0.8s ease forwards; pointer-events: none; }
                @keyframes hideMatched { 
                    0% { transform: scale(1); opacity: 1; } 
                    40% { transform: scale(1.15) rotate(5deg); opacity: 1; box-shadow: 0 0 30px rgba(255,255,255,0.8); } 
                    100% { transform: scale(0); opacity: 0; visibility: hidden; display: none; } 
                }
            </style>

            <div class="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 relative">
                <div class="grid grid-cols-4 grid-rows-5 gap-3 w-full max-w-3xl h-full max-h-[80vh]" id="memory-board">
                    ${memoryGame.cards.map((card, index) => `
                        <div class="memory-card w-full h-full" id="card-${index}" onclick="window.latTheCauDo(${index})">
                            <div class="memory-card-inner">
                                <div class="memory-card-front ${card.upTheme}">${card.backIcon}</div>
                                <div class="memory-card-back">
                                    <span class="${card.textClass} leading-tight">${card.text}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    if(memoryGame.timer) clearInterval(memoryGame.timer);
    memoryGame.timer = setInterval(() => {
        memoryGame.timeLeft--;
        let m = Math.floor(memoryGame.timeLeft / 60);
        let s = memoryGame.timeLeft % 60;
        document.getElementById('mg-timer-latthe').innerText = `${m < 10 ? '0'+m : m}:${s < 10 ? '0'+s : s}`;
        if (memoryGame.timeLeft <= 0) { clearInterval(memoryGame.timer); window.ketThucGameLatThe(true); }
    }, 1000);
};

// --- LOGIC LẬT THẺ ---
window.latTheCauDo = function(index) {
    if (memoryGame.lockBoard) return;
    let cardEl = document.getElementById('card-' + index);
    if (cardEl.classList.contains('flipped')) return;

    window.phatAmThanhGame('lat'); 
    cardEl.classList.add('flipped');
    memoryGame.flipped.push({ index: index, data: memoryGame.cards[index] });

    if (memoryGame.flipped.length === 2) {
        memoryGame.lockBoard = true;
        let c1 = memoryGame.flipped[0].data;
        let c2 = memoryGame.flipped[1].data;

        let isMatch = (c1.matchId === c2.matchId) && (c1.type !== c2.type);

        if (isMatch) {
            setTimeout(() => {
                window.phatAmThanhGame('dung'); 
                // Thêm class matched để kích hoạt CSS biến mất thẻ
                document.getElementById('card-' + memoryGame.flipped[0].index).classList.add('matched');
                document.getElementById('card-' + memoryGame.flipped[1].index).classList.add('matched');
                
                memoryGame.score += 5; 
                document.getElementById('mg-score-latthe').innerText = memoryGame.score;
                
                memoryGame.matchedCount += 2;
                memoryGame.flipped = [];
                memoryGame.lockBoard = false;

                if (memoryGame.matchedCount === 20) window.ketThucGameLatThe(false);
            }, 600);
        } else {
            setTimeout(() => {
                window.phatAmThanhGame('sai');
                document.getElementById('card-' + memoryGame.flipped[0].index).classList.remove('flipped');
                document.getElementById('card-' + memoryGame.flipped[1].index).classList.remove('flipped');
                memoryGame.flipped = [];
                memoryGame.lockBoard = false;
            }, 1200);
        }
    }
};

window.ketThucGameLatThe = function(isTimeout = false) {
    clearInterval(memoryGame.timer);
    
    let titleText = isTimeout ? "HẾT GIỜ!" : "XUẤT SẮC!";
    let titleColor = isTimeout ? "text-fuchsia-500" : "text-yellow-400";
    if (!isTimeout) window.safeConfetti();
    
    let overlay = document.createElement('div');
    overlay.className = "absolute inset-0 bg-slate-900/85 flex flex-col items-center justify-center z-[200] animate-[cascadeDrop_0.5s_ease-out_forwards]";
    overlay.innerHTML = `
        <div class="text-8xl mb-4 animate-bounce drop-shadow-lg">${isTimeout ? '⏰' : '🏆'}</div>
        <h2 class="text-4xl font-black ${titleColor} mb-2 uppercase text-center drop-shadow-lg px-4">${titleText}</h2>
        <p class="text-white font-bold mb-2 text-xl">Đã tìm được: <span class="text-cyan-400">${memoryGame.matchedCount / 2} / 10 cặp câu đố</span></p>
        <p class="text-white font-bold mb-8 text-xl text-center">Thưởng: <span class="text-yellow-400 text-5xl ml-2">+${memoryGame.score} đ</span></p>
        <button onclick="window.thoatGameLatTheToan(true)" class="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-10 py-4 rounded-full font-black text-2xl hover:scale-105 transition shadow-[0_0_30px_#06b6d4] btn-3d">LƯU ĐIỂM & THOÁT</button>
    `;
    document.getElementById('memory-board').parentElement.appendChild(overlay);
};

window.thoatGameLatTheToan = async function(saveScore = false) {
    clearInterval(memoryGame.timer);
    
    if (saveScore && memoryGame.score > 0 && currentUser && currentUser.role === 'student') {
        document.getElementById('loader').style.display = 'flex'; 
        let uniqueGameSession = "Lật Thẻ Câu Đố (" + new Date().toLocaleString('vi-VN') + ")";
        let dbSubjectName = "MathGame_LatThe";
        
        try { 
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: dbSubjectName, group: uniqueGameSession, score: memoryGame.score, score_earned: memoryGame.score, details: "Tìm được " + (memoryGame.matchedCount/2) + "/10 cặp câu đố." } }) }); 
            Data.log.push({ id: currentUser.id, subject: dbSubjectName, group: uniqueGameSession, score: memoryGame.score, real_added: memoryGame.score, time: new Date().toISOString(), details: "Tìm được " + (memoryGame.matchedCount/2) + "/10 cặp." }); 
            currentUser.score = Number(currentUser.score) + memoryGame.score;
            alert(`Nộp điểm thành công! Con nhận được ${memoryGame.score} điểm.`);
        } catch(e) { alert("Lỗi mạng, chưa kịp lưu điểm!"); } 
        finally { document.getElementById('loader').style.display = 'none'; }
    }
    
    let gameUI = document.querySelector('#game-ui-container');
    if (gameUI) gameUI.remove();
    let mainUI = document.querySelector('.bg-\\[url'); 
    if(mainUI) mainUI.remove();

    veTrangChu(); moGocHocTap(); 
};