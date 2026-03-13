// ==========================================
// FILE: FEATURES.JS (BẢN TÍCH HỢP GAME BẢO VỆ TRÁI ĐẤT)
// Tích hợp: Tải ngầm, Bảng Vàng, Bỏ icon Ong Vàng, Giải đố, Game Toán Học
// ==========================================

let isSpinning = false;
window.Data = window.Data || { hs: [], math: [], tv: [], vietnamese: [], log: [], caudo: [] };
window.isAllDataLoaded = false;
window.isFetchingBackground = false;

const PRIZES = [
    { id: "plus10", text: "+10 Điểm", color: "#34d399", netScore: 10, extraSpin: 0, msg: "Chúc mừng! Con được cộng ngay 10 điểm.", icon: "🎉" },
    { id: "extra", text: "Thêm Lượt", color: "#60a5fa", netScore: 0, extraSpin: 1, msg: "Tuyệt vời! Con được tặng thêm 1 lượt quay nữa.", icon: "🎁" },
    { id: "riddle", text: "Giải Đố", color: "#a78bfa", netScore: 0, extraSpin: 0, msg: "Con hãy giải câu đố để nhận thưởng nhé!", icon: "🧠" },
    { id: "minus10", text: "-10 Điểm", color: "#f87171", netScore: -10, extraSpin: 0, msg: "Ối! Con bị trừ 10 điểm rồi.", icon: "📉" },
    { id: "redo", text: "Vé Làm Lại", color: "#fb923c", netScore: 0, extraSpin: 0, msg: "Con nhận được 1 VÉ LÀM LẠI. Dùng nó để làm lại bài nhé!", icon: "🎫" },
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
    } catch(e) { console.log("Không tải được hiệu ứng pháo hoa."); }
};

// ==========================================
// 0. BỘ NÃO TẢI DỮ LIỆU TỔNG (TẢI NGẦM TÀNG HÌNH)
// ==========================================
window.loadAllDataOnce = async function(force = false, silent = false) {
    if (window.isAllDataLoaded && !force) return true;

    if (!silent) {
        document.getElementById('content').innerHTML = `
            <div class="flex flex-col items-center justify-center mt-28 fade-in opacity-90">
                <i class="fas fa-circle-notch animate-spin inline-block text-5xl text-indigo-500 mb-4 drop-shadow-md"></i>
                <p class="text-slate-500 font-bold text-sm animate-pulse tracking-wide">Đang kết nối không gian học tập...</p>
            </div>
        `;
    }

    try {
        const [mRes, tRes, lRes, cRes] = await Promise.all([
            fetch(API_URL + "?type=math&t=" + Date.now()).then(r => r.json()),
            fetch(API_URL + "?type=vietnamese&t=" + Date.now()).then(r => r.json()),
            fetch(API_URL + "?type=history_all&t=" + Date.now()).then(r => r.json()),
            fetch(API_URL + "?type=caudo&t=" + Date.now()).then(r => r.json())
        ]);

        Data.math = Array.isArray(mRes) ? mRes : [];
        Data.tv = Array.isArray(tRes) ? tRes : [];
        Data.vietnamese = Data.tv;
        Data.log = Array.isArray(lRes) ? lRes : [];
        Data.caudo = Array.isArray(cRes) ? cRes : [];

        window.isAllDataLoaded = true;
        return true;
    } catch(e) {
        console.error("Lỗi tải tổng:", e);
        if (!silent) {
            document.getElementById('content').innerHTML = `
                <div class="text-center mt-24 text-red-500 fade-in">
                    <i class="fas fa-wifi text-6xl mb-4 opacity-50"></i>
                    <h2 class="text-xl font-black uppercase mb-2">Lỗi Kết Nối</h2>
                    <p class="font-bold text-sm">Không thể tải dữ liệu. Thầy/cô và con vui lòng F5 tải lại trang nhé!</p>
                </div>
            `;
        }
        window.isFetchingBackground = false; 
        return false;
    }
};

// ==========================================
// 1. GÓC HỌC TẬP (Đã thêm nút Game Toán Học)
// ==========================================
window.moGocHocTap = async function() { 
    closeMenu(); 
    if (!(await window.loadAllDataOnce())) return;

    let mathUnread = 0; let tvUnread = 0;
    const mathGroupsAll = [...new Set(Data.math.map(x => x.group))].filter(g => g);
    const tvGroupsAll = [...new Set(Data.tv.map(x => x.group))].filter(g => g);
    const totalAssignments = mathGroupsAll.length + tvGroupsAll.length;

    if (currentUser && currentUser.role === 'student') {
        const myLogs = Data.log.filter(l => String(l.id) === String(currentUser.id));
        mathUnread = mathGroupsAll.filter(g => !myLogs.some(l => l.subject === 'math' && l.group === g)).length;
        tvUnread = tvGroupsAll.filter(g => !myLogs.some(l => (l.subject === 'vietnamese' || l.subject === 'tv') && l.group === g)).length;
    }

    let mathBadge = mathUnread > 0 ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[12px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">${mathUnread} BÀI MỚI</div>` : '';
    let tvBadge = tvUnread > 0 ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[12px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">${tvUnread} BÀI MỚI</div>` : '';

    let htmlTop = `
        ${getNavHtml('hoctap')}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 relative">
            <button onclick="window.loadSubject('math')" class="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-32 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${mathBadge}
                <i class="fas fa-calculator text-3xl mb-1 block opacity-90"></i>TOÁN
            </button>
            <button onclick="window.loadSubject('vietnamese')" class="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white h-32 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${tvBadge}
                <i class="fas fa-book-open text-3xl mb-1 block opacity-90"></i>TIẾNG VIỆT
            </button>
        </div>
        
        ${currentUser && currentUser.role === 'student' ? `
        <div onclick="window.moGameBaoVeTraiDat()" class="mt-4 bg-gradient-to-r from-slate-800 to-indigo-900 rounded-[2rem] p-4 text-white shadow-lg cursor-pointer hover:scale-[1.02] transition border-2 border-indigo-400 relative overflow-hidden group">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div class="flex items-center gap-4 relative z-10">
                <div class="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center text-3xl border-2 border-white shadow-inner animate-pulse"><i class="fas fa-rocket"></i></div>
                <div>
                    <h3 class="font-black text-xl text-yellow-400 tracking-wide uppercase">Bảo Vệ Trái Đất</h3>
                    <p class="text-xs text-indigo-200 font-bold">Game phản xạ tính nhẩm nhanh</p>
                </div>
            </div>
        </div>` : ''}
    `; 
    
    function parseLogTime(timeStr) { if(!timeStr) return 0; let d = new Date(timeStr); return !isNaN(d.getTime()) ? d.getTime() : 0; }

    let studentsWithTime = Data.hs.map(s => {
        let scoreVal = Number(s.score) || 0;
        let userLogs = Data.log.filter(l => String(l.id) === String(s.id) && Number(l.score) !== 0);
        let achievedTime = 0;
        if (userLogs.length > 0) {
            userLogs.sort((a, b) => parseLogTime(a.time) - parseLogTime(b.time)); achievedTime = parseLogTime(userLogs[userLogs.length - 1].time);
        }
        return { ...s, score: scoreVal, achievedTime: achievedTime };
    });

    let eligibleStudents = studentsWithTime.filter(s => s.score > 1500); 
    let sortedStudents = eligibleStudents.sort((a, b) => {
        let scoreDiff = b.score - a.score; if (scoreDiff !== 0) return scoreDiff;
        let timeA = a.achievedTime === 0 ? Infinity : a.achievedTime; let timeB = b.achievedTime === 0 ? Infinity : b.achievedTime;
        return timeA - timeB; 
    });

    let top15 = sortedStudents.slice(0, 15); 
    let uniqueScores = [...new Set(sortedStudents.map(s => s.score))].sort((a, b) => b - a);

    let leaderboardHtml = ""; 
    if (top15.length > 0) { 
        let listHtml = top15.map((s) => { 
            let actualDisplayRank = uniqueScores.indexOf(s.score) + 1; 
            let rankIcon = `<span class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm">${actualDisplayRank}</span>`; 
            
            let userLogs = Data.log.filter(l => String(l.id) === String(s.id));
            let doneMath = new Set(userLogs.filter(l => l.subject === 'math' && mathGroupsAll.includes(l.group)).map(l => l.group)).size;
            let doneTv = new Set(userLogs.filter(l => (l.subject === 'vietnamese' || l.subject === 'tv') && tvGroupsAll.includes(l.group)).map(l => l.group)).size;
            let isOngVang = (totalAssignments > 0 && (doneMath + doneTv) >= totalAssignments);

            let titleBadge = "";
            let ongVangBadge = isOngVang ? `<div class="text-[10px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-400 inline-flex items-center mt-1 shadow-sm">Ong Vàng Chăm Chỉ</div>` : "";
            
            let nameColor = "text-slate-700 font-bold"; let rowStyles = "bg-slate-50 border-slate-200"; 
            
            if (actualDisplayRank === 1) { rowStyles = "bg-yellow-50 scale-[1.02] z-10"; nameColor = "text-yellow-700 font-bold"; rankIcon = `<i class="fas fa-medal text-3xl text-yellow-500 drop-shadow-md"></i>`; }
            else if (actualDisplayRank === 2) { rowStyles = "bg-gray-50"; rankIcon = `<i class="fas fa-medal text-3xl text-slate-400 drop-shadow-md"></i>`; }
            else if (actualDisplayRank === 3) { rowStyles = "bg-orange-50"; rankIcon = `<i class="fas fa-medal text-3xl text-orange-400 drop-shadow-md"></i>`; }

            if (s.score >= 5000) { titleBadge = `<div class="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-star mr-1"></i>Ngôi Sao Tri Thức</div>`; nameColor = "text-red-600 font-black drop-shadow-md"; rowStyles += " border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] ring-2 ring-red-200 ring-offset-1 animate-pulse"; } 
            else if (s.score >= 4000) { titleBadge = `<div class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-award mr-1"></i>Học Sinh Ưu Tú</div>`; nameColor = "text-purple-700 font-bold drop-shadow-sm"; rowStyles += " border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]"; } 
            else if (s.score >= 3000) { titleBadge = `<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-medal mr-1"></i>Học Giả Nhí</div>`; nameColor = "text-emerald-700 font-bold"; rowStyles += " border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]"; } 
            else { if (actualDisplayRank === 1) rowStyles += " border-yellow-300 shadow-sm"; else if (actualDisplayRank === 2) rowStyles += " border-gray-300"; else if (actualDisplayRank === 3) rowStyles += " border-orange-200"; else rowStyles += " border-slate-100"; }

            let allBadges = ""; if (titleBadge || ongVangBadge) { allBadges = `<div class="flex flex-wrap gap-1">${titleBadge}${ongVangBadge}</div>`; }
            
            return `<div class="flex items-center justify-between p-3 mb-2 rounded-xl transition-all relative border ${rowStyles}"><div class="flex items-center gap-3"><div class="w-10 text-center flex justify-center shrink-0">${rankIcon}</div><div class="flex flex-col"><span class="${nameColor} text-sm sm:text-base tracking-wide">${s.name}</span>${allBadges}</div></div><div class="font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm text-sm shrink-0">${s.score} <span class="text-[10px] text-indigo-500 font-bold ml-1 uppercase">điểm</span></div></div>`; 
        }).join(''); 
        
        let personalMsg = ""; 
        if (currentUser && currentUser.role === 'student') { 
            let myScore = Number(currentUser.score) || 0; let myRank = uniqueScores.indexOf(myScore) + 1; if (myRank === 0) myRank = uniqueScores.length + 1; 
            if (myScore > 1500) { if (myRank <= 15) { personalMsg = `<div class="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl text-center"><p class="text-green-700 font-bold text-sm"><i class="fas fa-star text-yellow-500 mr-1 animate-pulse"></i> Tuyệt vời! Con đang ở Top ${myRank} Bảng Vàng!</p></div>`; } else { personalMsg = `<div class="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center"><p class="text-blue-700 font-bold text-sm"><i class="fas fa-rocket mr-1 text-blue-500"></i> Con đã vượt mốc với ${myScore} điểm (Hạng ${myRank}).<br>Cố lên nhé, Bảng Vàng ngay trước mắt rồi!</p></div>`; } } else { personalMsg = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Vạch xuất phát là 1500 điểm.<br>Hãy làm bài tập để vượt mốc này và ghi danh nhé!</p></div>`; } 
        } 
        
        leaderboardHtml = `<div class="mt-6 bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-yellow-400 fade-in"><div class="text-center mb-5"><h3 class="font-black text-xl sm:text-2xl text-yellow-600 uppercase tracking-wide"><i class="fas fa-crown text-yellow-500 mr-2 mb-1 animate-bounce inline-block"></i>BẢNG VÀNG LỚP 4/6</h3></div><div class="flex flex-col">${listHtml}</div>${personalMsg}</div>`; 
    } else { 
        let personalMsgEmpty = ""; if (currentUser && currentUser.role === 'student') { personalMsgEmpty = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Hãy làm bài tập để trở thành người đầu tiên vượt mốc 1500 điểm nhé!</p></div>`; } 
        leaderboardHtml = `<div class="mt-6 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in opacity-80"><i class="fas fa-trophy text-5xl text-slate-200 mb-3 block"></i><p class="font-black text-slate-500 text-lg uppercase">Bảng Vàng đang trống</p><p class="text-sm font-bold text-slate-400 mt-1">Chưa có chiến binh nào vượt mốc 1500 điểm.</p>${personalMsgEmpty}</div>`; 
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
// 3. TIẾN TRÌNH LÀM BÀI & THƯỞNG TỐC ĐỘ 
// ==========================================
window.loadSubject = async function(sub) { 
    if(!currentUser) return showLogin(); 
    curSub = sub; 
    if (!(await window.loadAllDataOnce())) return;
    
    const qs = Data[sub]; if (!qs) { alert("Không tải được dữ liệu. Vui lòng thử lại."); return veTrangChu(); }
    const grps = [...new Set(qs.map(x => x.group))].filter(g => g).sort((a, b) => { let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); });
    
    let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2></div><div class="space-y-3">`; 
    
    if(grps.length === 0) { html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`; } else {
        grps.forEach(g => { 
            const isDone = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g); 
            const time = qs.find(q => q.group === g).time || 20; 
            const count = qs.filter(q => q.group === g && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length; 
            
            let clickAction = `window.startQuiz('${g}', ${time})`; 
            if (isDone && currentUser.role === 'student') { 
                let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0');
                if(tokens > 0) clickAction = `window.promptRedo('${g}', ${time})`; else clickAction = `alert('Con đã làm bài này rồi. Hãy vào Vòng Quay May Mắn để tìm VÉ LÀM LẠI nhé!')`; 
            } 
            
            let badgeHtml = !isDone ? `<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>` : `<span class="bg-slate-200 text-slate-500 text-[10px] font-black px-2 py-1 rounded"><i class="fas fa-lock text-xs mr-1"></i>ĐÃ LÀM</span>`; 
            html += `<div onclick="${clickAction}" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${isDone ? 'border-green-100 bg-green-50/40 opacity-80' : 'border-indigo-50'}"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}"><i class="fas ${isDone ? 'fa-check-circle' : 'fa-star'}"></i></div><div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p></div></div>${badgeHtml}</div>`; 
        }); 
    } 
    document.getElementById('content').innerHTML = html + `</div>`; 
};

window.promptRedo = function(group, time) {
    let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0');
    if(tokens > 0) { 
        if(confirm(`Con đang có ${tokens} VÉ LÀM LẠI.\nCon có chắc chắn muốn dùng 1 vé để mở khóa và làm lại [${group}] không?`)) { 
            localStorage.setItem('redo_tokens_'+currentUser.id, tokens - 1); 
            Data.log = Data.log.filter(l => !(String(l.id) === String(currentUser.id) && l.group === group)); 
            window.startQuiz(group, time); 
        } 
    }
};

window.startQuiz = function(group, timeMins) { 
    curGrp = group; let rawQuiz = Data[curSub].filter(q => q.group === group); quiz = []; readingPassage = "";
    rawQuiz.forEach(q => {
        let qText = q.question || ""; 
        if (q.image) { qText += `<br><div style="text-align: center;"><img src="${q.image}" class="max-w-full rounded-md mt-2"></div>`; } 
        let match = qText.match(/\[BAIDOC\](.*?)\[\/BAIDOC\]/s); 
        if (match) { readingPassage = match[1]; qText = qText.replace(match[0], '').trim(); } 
        else if (qText.includes('[ĐOẠN VĂN]')) { readingPassage = qText.replace('[ĐOẠN VĂN]', '').trim(); qText = ""; }
        if (qText !== "" || q.a || q.b) { quiz.push({ ...q, question: qText }); }
    });
    
    quiz = quiz.sort(() => Math.random() - 0.5).slice(0, 10); currentQIndex = 0; score = 0; wrongAnswersLog = []; 
    
    if (curSub === 'vietnamese' || curSub === 'tv') {
        if (!readingPassage) readingPassage = "Hãy đọc kỹ các câu hỏi bên phải và chọn đáp án đúng nhất nhé!";
        document.getElementById('content').innerHTML = `
            <div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4"><div class="flex items-center gap-3"><button onclick="window.loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-green-700 truncate max-w-[150px]">${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black text-green-600 shadow-sm border border-green-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div>
            <div class="flex flex-col lg:flex-row gap-6"><div class="lg:w-1/2 bg-[#fffbeb] p-6 sm:p-8 rounded-[2rem] border-2 border-yellow-200 shadow-inner lg:h-[75vh] overflow-y-auto relative custom-scrollbar"><div class="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1 rounded-bl-xl opacity-80">BÀI ĐỌC</div><h3 class="font-black text-yellow-800 text-xl mb-4 flex items-center gap-2 border-b-2 border-yellow-200 pb-3"><i class="fas fa-book-reader text-2xl"></i> NỘI DUNG ĐỌC HIỂU</h3><div class="text-slate-800 leading-[1.8] text-base sm:text-lg whitespace-pre-wrap font-medium pb-10 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${window.parseImg(readingPassage)}</div></div><div class="lg:w-1/2" id="quizBox"></div></div>
        `;
    } else { 
        document.getElementById('content').innerHTML = `
            <div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4"><div class="flex items-center gap-3"><button onclick="window.loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-indigo-900 truncate max-w-[150px]">${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div>
            <div id="quizBox" class="bg-white p-5 sm:p-8 rounded-[2rem] shadow-xl border-4 border-white min-h-[400px] text-base sm:text-lg"></div>
        `; 
    }
    window.renderQuestion(0); window.startTimer(timeMins * 60); 
};

window.renderQuestion = function(index) { 
    if (index >= quiz.length) { window.finishQuiz(); return; } 
    const q = quiz[index]; let colorTheme = (curSub === 'vietnamese' || curSub === 'tv') ? 'text-green-600' : 'text-indigo-600'; 
    let wrapperClass = (curSub === 'vietnamese' || curSub === 'tv') ? 'bg-white p-6 rounded-[2rem] shadow-lg border-2 border-slate-100' : '';
    let optionsHtml = ['a','b','c','d'].filter(k => q[k]).map(key => `<div onclick="window.checkAns(this, '${key}', '${q.correct}', ${index})" class="quiz-option p-4 sm:p-5 border-2 border-slate-100 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition btn-3d bg-white"><span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase text-lg shrink-0 shadow-inner">${key}</span><div class="font-bold text-slate-700 flex-1 text-base sm:text-lg leading-relaxed">${window.parseImg(q[key])}</div></div>`).join('');
    document.getElementById("quizBox").innerHTML = `<div class="${wrapperClass} fade-in"><div class="mb-6"><div class="text-sm font-black ${colorTheme} mb-3 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">CÂU HỎI ${index + 1} / ${quiz.length}</div><div class="text-xl sm:text-2xl font-bold text-slate-800 leading-snug [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${window.parseImg(q.question)}</div></div><div class="space-y-4">${optionsHtml}</div></div>`; 
};

window.checkAns = function(el, selected, correct, index) { 
    document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70')); const q = quiz[index]; 
    if (selected === correct.toLowerCase()) { el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800', 'scale-[1.02]'); score += 10; } 
    else { 
        el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800', 'scale-[0.98]'); 
        wrongAnswersLog.push(`<div class="bg-white p-4 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-red-500">Câu ${index+1}:</span> ${window.parseImg(q.question)}</p><div class="space-y-2 mt-3"><p class="text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-100"><i class="fas fa-times-circle mr-1"></i> <b>Bé chọn (${selected.toUpperCase()}):</b> <span class="font-medium">${window.parseImg(q[selected])}</span></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng (${correct.toUpperCase()}):</b> <span class="font-medium">${window.parseImg(q[correct])}</span></p></div></div>`); 
    } 
    setTimeout(() => window.renderQuestion(index + 1), 1200); 
};

window.startTimer = function(seconds) { 
    if (timer) clearInterval(timer); window.totalQuizTime = seconds; window.remainingQuizTime = seconds;
    timer = setInterval(() => { 
        let m = Math.floor(window.remainingQuizTime / 60); let s = window.remainingQuizTime % 60; 
        document.getElementById('quizTimer').innerText = `${m}:${s < 10 ? '0' + s : s}`; 
        if (window.remainingQuizTime <= 0) { clearInterval(timer); alert("Hết giờ làm bài!"); window.finishQuiz(); } 
        window.remainingQuizTime--; 
    }, 1000); 
};

window.finishQuiz = async function() { 
    if (timer) clearInterval(timer); const maxPossibleScore = quiz.length * 10; let timeTaken = window.totalQuizTime - window.remainingQuizTime; 
    let halfTime = window.totalQuizTime / 2; let extraSpinsEarned = 0; let rewardMessage = "";

    if (score > 0 && score === maxPossibleScore) { 
        let previousMax = Data.log.find(l => String(l.id) === String(currentUser.id) && l.subject === curSub && l.group === curGrp && Number(l.score) === maxPossibleScore);
        if (!previousMax && currentUser.role === 'student') {
            if (timeTaken <= halfTime) { extraSpinsEarned = 2; rewardMessage = `<div class="bg-green-50 border border-green-200 p-3 rounded-xl mt-4"><p class="text-green-700 font-bold text-sm"><i class="fas fa-bolt text-orange-500 mr-1 text-lg"></i> KỶ LỤC TỐC ĐỘ! Đúng 100% siêu nhanh. Thưởng <b>+2 Lượt quay</b>!</p></div>`; } 
            else { extraSpinsEarned = 1; rewardMessage = `<div class="bg-green-50 border border-green-200 p-3 rounded-xl mt-4"><p class="text-green-700 font-bold text-sm"><i class="fas fa-gift text-red-500 mr-1 text-lg"></i> XUẤT SẮC! Đúng 100%. Thưởng <b>+1 Lượt quay</b>!</p></div>`; }
            let todayStr = new Date().toLocaleDateString('vi-VN'); let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
            if (spinLog.date !== todayStr) spinLog = { date: todayStr, extra: 0, usedFree: false };
            spinLog.extra += extraSpinsEarned; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog));
        } else if (previousMax && currentUser.role === 'student') { rewardMessage = `<p class="text-slate-400 font-bold mt-4 text-xs italic">Con đã từng đạt điểm tối đa bài này rồi nên không nhận thêm thưởng nữa nhé.</p>`; }
        window.safeConfetti(); 
    } 
    
    document.getElementById('content').innerHTML = `<div class="text-center bg-white p-10 rounded-[3rem] shadow-2xl fade-in max-w-lg mx-auto mt-10 border-t-8 border-indigo-500"><div class="text-7xl mb-6 animate-bounce">🏆</div><h3 class="text-3xl font-black text-slate-800 mb-2 uppercase tracking-wider">ĐIỂM CỦA CON</h3><p class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 drop-shadow-sm">${score}</p>${rewardMessage}<button onclick="window.loadSubject('${curSub}')" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl btn-3d shadow-lg w-full hover:scale-[1.02] transition mt-6">HOÀN TẤT & TRỞ VỀ</button></div>`; 
    
    if(currentUser.role === 'student') { 
        let submitTime = new Date().toISOString(); let detailsToSave = wrongAnswersLog.join('');
        if (extraSpinsEarned > 0) { detailsToSave += `<br><div style="color:green; font-weight:bold; background:#f0fdf4; padding:5px; border-radius:5px;">(Hệ thống tự động: Đã thưởng ${extraSpinsEarned} lượt quay)</div>`; }
        try { 
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score, details: detailsToSave } }) }); 
            Data.log.push({ id: currentUser.id, subject: curSub, group: curGrp, score: score, time: submitTime, details: detailsToSave }); 
        } catch(e){}
    } 
};

// ==========================================
// 4. VÒNG QUAY MAY MẮN
// ==========================================
window.moVongQuay = async function() {
    if(!currentUser) return showLogin(); 
    closeMenu(); 
    if (!(await window.loadAllDataOnce())) return;

    let todayStr = new Date().toLocaleDateString('vi-VN'); 
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
    if (spinLog.date !== todayStr) { spinLog = { date: todayStr, extra: 0, usedFree: false }; }
    
    let sliceAngle = 360 / PRIZES.length; let halfSlice = sliceAngle / 2;
    let slicesHtml = PRIZES.map((p, i) => `<div class="absolute inset-0 flex justify-center" style="transform: rotate(${i * sliceAngle}deg);"><div class="pt-5 font-black text-white text-[10px] sm:text-[11px] drop-shadow-md w-14 text-center leading-tight z-20" style="transform: rotate(0deg);">${p.text}</div></div>`).join('');
    let gradColors = PRIZES.map((p, i) => `${p.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(', ');

    document.getElementById('content').innerHTML = `
        ${getNavHtml('vongquay')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in">
            <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase text-yellow-500">Vòng Quay May Mắn</h2>
            <div class="flex justify-center items-center gap-4 mb-6"><p class="text-slate-500 font-bold text-sm">Điểm: <span id="vqCurrentScore" class="text-indigo-600 font-black text-lg">${currentUser.score || 0}</span></p><p class="text-slate-500 font-bold text-sm border-l-2 pl-4">Vé làm lại: <span class="text-orange-500 font-black text-lg">${localStorage.getItem('redo_tokens_'+currentUser.id) || 0}</span></p></div>
            <div class="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-8"><div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-5xl text-yellow-500 drop-shadow-xl z-30 animate-bounce"><i class="fas fa-caret-down"></i></div><div id="wheel" class="w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl relative overflow-hidden" style="background: conic-gradient(from -${halfSlice}deg, ${gradColors}); transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);">${slicesHtml}<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-30 shadow-inner flex items-center justify-center text-xl">🎡</div></div></div>
            <button id="btnSpin" onclick="window.thucHienQuay()" class="inline-block bg-gradient-to-r from-red-500 to-yellow-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition mb-6 cursor-pointer hover:scale-[1.02]">BẮT ĐẦU</button>
            <div id="spinHistoryContainer" class="max-w-sm mx-auto transition-all"></div>
        </div>
    `;
    window.checkSpinStatus(spinLog, todayStr); 
};

window.checkSpinStatus = function(spinLog, todayStr) {
    let hasSpunTodayOnServer = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === "LuckySpin" && String(l.group).includes(todayStr));
    if (hasSpunTodayOnServer) { spinLog.usedFree = true; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); }
    window.restoreSpinButton(spinLog); window.renderSpinHistory(todayStr); 
};

window.restoreSpinButton = function(spinLog) {
    let btnUpdate = document.getElementById('btnSpin'); if (!btnUpdate) return;
    let canSpinNow = !spinLog.usedFree || spinLog.extra > 0;
    if (canSpinNow) { btnUpdate.className = "inline-block bg-gradient-to-r from-red-500 to-yellow-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition hover:scale-[1.02] cursor-pointer mb-6"; btnUpdate.innerText = spinLog.usedFree ? `BẮT ĐẦU (+${spinLog.extra} LƯỢT)` : "BẮT ĐẦU"; } 
    else { btnUpdate.className = "inline-block bg-gradient-to-r from-slate-400 to-slate-500 text-white px-12 py-4 rounded-2xl font-black shadow-lg text-xl transition opacity-50 pointer-events-none mb-6"; btnUpdate.innerText = "ĐÃ HẾT LƯỢT HÔM NAY"; }
};

window.renderSpinHistory = function(todayStr) {
    let container = document.getElementById('spinHistoryContainer'); if (!container) return;
    let todayLogs = Data.log.filter(l => l.subject === "LuckySpin" && String(l.group).includes(todayStr));
    
    if (todayLogs.length === 0) { container.innerHTML = `<div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center"><p class="text-sm font-bold text-slate-400"><i class="fas fa-info-circle"></i> Hôm nay chưa có bạn nào thử vận may.</p></div>`; return; }
    todayLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); 
    let listItems = todayLogs.map(l => {
        let hs = Data.hs.find(x => String(x.id) === String(l.id)); let name = hs ? hs.name : "Một bạn"; let prizeText = (l.details || "").replace("Quay trúng: ", "").split(" (")[0]; let textStyle = "text-orange-600 font-bold";
        if(prizeText.includes("Kho Báu")) textStyle = "text-red-600 font-black animate-pulse"; if(prizeText.includes("Mất Lượt") || prizeText.includes("-10")) textStyle = "text-slate-400 font-medium";
        return `<div class="py-2.5 border-b border-orange-100/50 last:border-0 text-[13px] text-slate-600 flex justify-between items-center"><span class="font-black text-blue-600 truncate mr-2"><i class="fas fa-user-circle text-blue-300 mr-1"></i>${name}</span> <span class="text-right ${textStyle}">${prizeText}</span></div>`;
    }).join('');

    let spacer = todayLogs.length < 4 ? `<div class="py-4 text-center text-orange-300 text-[11px] font-bold italic border-b border-orange-100/50">... chờ các bạn khác ...</div>` : ""; let animDuration = Math.max(todayLogs.length * 2.5, 10);
    container.innerHTML = `<div class="bg-orange-50/50 rounded-2xl border border-orange-200 relative overflow-hidden shadow-inner h-40 group"><div class="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-orange-50 to-transparent z-10 pointer-events-none"></div><div class="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-orange-50 to-transparent z-10 pointer-events-none"></div><h3 class="text-[11px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 py-2 text-center border-b border-orange-200 relative z-20 shadow-sm"><i class="fas fa-gift mr-1"></i> Trạm Nhận Quà</h3><div class="overflow-hidden h-[120px] relative px-4"><div class="animate-scroll-down flex flex-col group-hover:[animation-play-state:paused] pt-2">${listItems}${spacer}${listItems}${spacer}</div></div><style>@keyframes scrollDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } } .animate-scroll-down { animation: scrollDown ${animDuration}s linear infinite; }</style></div>`;
};

window.thucHienQuay = async function() {
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
    if (rand < 10) idx = 0; else if (rand < 30) idx = 1; else if (rand < 70) idx = 2; else if (rand < 75) idx = 3; else if (rand < 85) idx = 4; else if (rand < 90) idx = 5; else idx = 6; 

    let sliceAngle = 360 / PRIZES.length; let wheel = document.getElementById('wheel'); 
    let currentRot = parseFloat(wheel.getAttribute('data-rot') || 0);
    let nextRot = currentRot + (360 * 5) + (360 - (currentRot % 360)) - (idx * sliceAngle); 
    wheel.style.transform = `rotate(${nextRot}deg)`; wheel.setAttribute('data-rot', nextRot);
    
    setTimeout(async () => {
        isSpinning = false; let uniqueGroup = "Vòng quay ngày " + todayStr + " (" + Date.now() + ")"; let finalPrize = {...PRIZES[idx]};

        if (finalPrize.id === 'chest') {
            let chestRand = Math.floor(Math.random() * 3);
            if (chestRand === 0) { finalPrize.netScore = 10; finalPrize.extraSpin = 2; finalPrize.msg = "Tuyệt vời! Rương chứa: <b>2 Lượt quay</b> và <b>10 Điểm</b>."; } 
            else if (chestRand === 1) { finalPrize.netScore = 30; finalPrize.extraSpin = 1; finalPrize.msg = "Tuyệt vời! Rương chứa: <b>1 Lượt quay</b> và <b>30 Điểm</b>."; } 
            else { finalPrize.netScore = 20; finalPrize.extraSpin = 0; let currentTokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0'); localStorage.setItem('redo_tokens_'+currentUser.id, currentTokens + 1); finalPrize.msg = "Tuyệt vời! Rương chứa: <b>1 Vé làm lại</b> và <b>20 Điểm</b>."; }
        }

        if (finalPrize.extraSpin > 0) { spinLog.extra += finalPrize.extraSpin; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); }
        if (finalPrize.id === 'redo') { let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0'); localStorage.setItem('redo_tokens_'+currentUser.id, tokens + 1); }
        if (finalPrize.id === 'riddle') { window.showRiddleModal(todayStr, uniqueGroup); return; }

        window.showPrizeModal(finalPrize);
        
        if (finalPrize.netScore !== 0) { currentUser.score = Number(currentUser.score) + finalPrize.netScore; document.getElementById('vqCurrentScore').innerText = currentUser.score; }
        
        try { 
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score_earned: finalPrize.netScore, details: "Quay trúng: " + finalPrize.text + (finalPrize.id === 'chest' ? " ("+finalPrize.msg+")" : "") } }) }); 
            Data.log.push({ id: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score: finalPrize.netScore, time: new Date().toISOString(), details: "Quay trúng: " + finalPrize.text }); 
            window.renderSpinHistory(todayStr);
        } catch(e) {}
        
        if (finalPrize.netScore > 0 || finalPrize.extraSpin > 0 || finalPrize.id === 'redo' || finalPrize.id === 'chest') { window.safeConfetti(); }
        window.restoreSpinButton(spinLog);
    }, 4000);
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
    overlay.innerHTML = `<div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-purple-500 animate-[cascadeDrop_0.5s_ease-out_forwards]"><div class="text-6xl mb-4 animate-bounce">🧠</div><h3 class="text-2xl font-black text-purple-600 mb-2 uppercase">Thử Tài Giải Đố</h3><p class="text-slate-600 font-bold mb-4">Trả lời đúng để nhận ngay 20 điểm:</p><div class="bg-purple-50 text-purple-800 ${textSize} font-black p-4 rounded-xl mb-6 shadow-inner border border-purple-200 leading-snug">${questionStr}${isMath ? ' = ?' : ''}</div><input type="${inputType}" id="riddleAns" class="w-full p-4 border-2 border-purple-200 rounded-xl font-bold text-xl text-center mb-6 focus:border-purple-500 outline-none" placeholder="Đáp án của con..."><button onclick="window.checkRiddle('${correctAns}', '${todayStr}', '${uniqueGroup}')" class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-black shadow-lg btn-3d hover:scale-[1.02] transition">TRẢ LỜI</button><button onclick="document.getElementById('riddleModal').remove(); window.isSpinning=false; window.restoreSpinButton(JSON.parse(localStorage.getItem('spinLog_'+currentUser.id)));" class="w-full mt-4 text-slate-400 font-bold hover:text-slate-600 transition">Đóng</button></div>`;
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
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id)); window.restoreSpinButton(spinLog);
};

window.showPrizeModal = function(prize) {
    let overlay = document.createElement('div'); overlay.id = "prizeModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `<div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 animate-[cascadeDrop_0.5s_ease-out_forwards]" style="border-color: ${prize.color}"><div class="text-7xl mb-4 animate-bounce">${prize.icon}</div><h3 class="text-2xl font-black text-slate-800 mb-2">${prize.text}</h3><p class="text-slate-600 font-bold mb-6 text-sm">${prize.msg}</p><button onclick="document.getElementById('prizeModal').remove()" class="w-full text-white py-3 rounded-xl font-black shadow-md transition hover:opacity-80" style="background-color: ${prize.color}">ĐÓNG</button></div>`;
    document.body.appendChild(overlay);
};

// ==========================================
// 5. QUẢN LÝ HỌC SINH & TRANG CÁ NHÂN
// ==========================================
window.calculateTitle = function(student) {
    if (!window.Data || !Data.math || !Data.tv || !Data.log) return "";
    const mathGroupsAll = [...new Set(Data.math.map(x => x.group))].filter(g => g); const tvGroupsAll = [...new Set(Data.tv.map(x => x.group))].filter(g => g); const totalAssignments = mathGroupsAll.length + tvGroupsAll.length;
    const userLogs = Data.log.filter(l => String(l.id) === String(student.id));
    const doneMath = new Set(userLogs.filter(l => l.subject === 'math' && mathGroupsAll.includes(l.group)).map(l => l.group)).size;
    const doneTv = new Set(userLogs.filter(l => (l.subject === 'vietnamese' || l.subject === 'tv') && tvGroupsAll.includes(l.group)).map(l => l.group)).size;
    const isOngVang = (totalAssignments > 0 && (doneMath + doneTv) >= totalAssignments);

    let titlesHtml = "";
    let ongVangBadge = isOngVang ? `<div class="text-[10px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-400 inline-flex items-center shadow-sm">Ong Vàng Chăm Chỉ</div>` : "";
    if (ongVangBadge) titlesHtml += ongVangBadge;

    let scoreVal = Number(student.score) || 0; let titleBadge = "";
    if (scoreVal >= 5000) titleBadge = `<div class="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center shadow-sm"><i class="fas fa-star mr-1"></i>Ngôi Sao Tri Thức</div>`;
    else if (scoreVal >= 4000) titleBadge = `<div class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center shadow-sm"><i class="fas fa-award mr-1"></i>Học Sinh Ưu Tú</div>`;
    else if (scoreVal >= 3000) titleBadge = `<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center shadow-sm"><i class="fas fa-medal mr-1"></i>Học Giả Nhí</div>`;
    if (titleBadge) titlesHtml += (titlesHtml ? " " : "") + titleBadge;
    return titlesHtml;
};

window.viewProfile = function(id) { 
    closeMenu(); const s = Data.hs.find(x => String(x.id) === String(id)); if(!s) return; 
    const avatar = s.gender === 'Nữ' ? '<div class="w-24 h-24 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-graduate"></i></div>' : '<div class="w-24 h-24 bg-blue-100 text-blue-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-astronaut"></i></div>'; 
    let cleanDob = s.dob || 'Chưa cập nhật'; if(cleanDob.includes('T') && cleanDob.includes('.000Z')) { const dt = new Date(cleanDob); cleanDob = ("0" + dt.getDate()).slice(-2) + "/" + ("0" + (dt.getMonth() + 1)).slice(-2) + "/" + dt.getFullYear(); } 
    const renderPhone = (phone, label) => { 
        if(!phone || phone.trim() === '') return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><span class="text-slate-400 italic text-xs">Chưa cập nhật</span></div>`; 
        const cleanPhone = phone.toString().replace(/\D/g, ''); return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><div class="flex items-center gap-2"><span class="font-bold text-slate-700 text-sm">${phone}</span><a href="tel:${cleanPhone}" class="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs hover:bg-green-600 hover:text-white transition"><i class="fas fa-phone"></i></a></div></div>`; 
    }; 
    const studentTitles = window.calculateTitle(s);

    document.getElementById('content').innerHTML = `
        <div class="flex items-center mb-6"><button onclick="${currentUser && currentUser.role==='admin'?'window.chuyenTrangQuanLy()':'veTrangChu()'}" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600 uppercase">HỒ SƠ CÁ NHÂN</h2></div>
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-blue-50 fade-in relative overflow-hidden"><div class="text-center mb-6 relative z-10">${avatar}<h2 class="text-2xl font-black text-slate-800">${s.name}</h2><span class="bg-blue-50 text-blue-600 font-mono font-bold px-3 py-1 rounded-full text-xs mt-2 inline-block">ID: ${s.id}</span></div><div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-6 flex items-center justify-between relative overflow-hidden"><div class="absolute -right-4 -bottom-4 text-white opacity-20 text-6xl"><i class="fas fa-gem"></i></div><div><p class="text-xs font-bold opacity-90 uppercase">Điểm tích lũy</p><p class="text-3xl font-black">${s.score || 0}</p></div><div class="text-right flex flex-col items-end gap-1 mt-1">${studentTitles}</div></div><div class="space-y-1"><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Ngày sinh</span><b class="text-slate-700">${cleanDob}</b></div><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Giới tính</span><b class="text-slate-700">${s.gender || '-'}</b></div>${renderPhone(s.fatherPhone, "SĐT Cha")}${renderPhone(s.motherPhone, "SĐT Mẹ")}<div class="py-2"><span class="text-slate-400 font-bold uppercase text-[10px] block mb-1">Địa chỉ</span><b class="text-slate-700 text-sm leading-snug">${s.address || 'Chưa cập nhật'}</b></div></div></div>
    `; 
};

// ==========================================
// 6. CÔNG CỤ CHUNG & ĐỒNG BỘ
// ==========================================
let checkLoginInterval = setInterval(() => {
    if (window.currentUser && !window.isAllDataLoaded && !window.isFetchingBackground) {
        window.isFetchingBackground = true; window.loadAllDataOnce(false, true).catch(e => console.log("Lỗi tải ngầm")); clearInterval(checkLoginInterval);
    }
}, 1000);

window.dongBoDuLieu = async function() { 
    if(!confirm("Hành động này sẽ tải lại toàn bộ dữ liệu mới nhất từ Google Sheets. Tiếp tục?")) return; 
    document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG ĐỒNG BỘ MÁY CHỦ..."; 
    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'clear_cache', data: {} }) }); window.isAllDataLoaded = false; alert("Đồng bộ thành công! Hệ thống sẽ tự tải lại."); location.reload(); } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng khi đồng bộ!"); } 
};

// ==========================================
// 7. GAME TOÁN HỌC: BẢO VỆ TRÁI ĐẤT (SIÊU PHẨM)
// ==========================================
let mathGame = { loop: null, spawn: null, meteors: [], level: 1, score: 0, combo: 0, lives: 3, timeLeft: 60, active: false };

window.moGameBaoVeTraiDat = function() {
    if(!currentUser) return showLogin();
    closeMenu();

    let todayStr = new Date().toLocaleDateString('vi-VN');
    let gameLog = JSON.parse(localStorage.getItem('mathGame_' + currentUser.id) || '{"date": "", "plays": 0}');
    if (gameLog.date !== todayStr) gameLog = { date: todayStr, plays: 0 };
    if (gameLog.plays >= 3) return alert("Hôm nay con đã chơi đủ 3 lần xuất kích rồi. Hãy nghỉ ngơi và quay lại vào ngày mai nhé!");

    // Cập nhật lượt chơi
    gameLog.plays += 1;
    localStorage.setItem('mathGame_' + currentUser.id, JSON.stringify(gameLog));

    // Reset game state
    mathGame = { loop: null, spawn: null, meteors: [], level: 1, score: 0, combo: 0, lives: 3, timeLeft: 60, active: true };

    document.getElementById('content').innerHTML = `
        <div id="gameUI" class="fixed inset-0 z-[100] bg-slate-900 overflow-hidden flex flex-col font-sans select-none touch-none">
            <div class="bg-slate-800/80 backdrop-blur border-b border-slate-700 p-3 flex justify-between items-center text-white relative z-20">
                <div class="flex items-center gap-3">
                    <button onclick="window.thoatGameToan()" class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center hover:bg-red-500 transition"><i class="fas fa-times"></i></button>
                    <div id="mg-lives" class="text-red-400 text-lg flex gap-1">❤️❤️❤️</div>
                </div>
                <div class="text-center absolute left-1/2 -translate-x-1/2">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">CẤP ĐỘ <span id="mg-level" class="text-white text-sm">1</span></p>
                    <p id="mg-time" class="text-xl font-black text-yellow-400">01:00</p>
                </div>
                <div class="text-right">
                    <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ĐIỂM</p>
                    <p id="mg-score" class="text-2xl font-black text-emerald-400">0</p>
                </div>
            </div>

            <div id="mg-sky" class="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
                <div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 30px 30px;"></div>
                
                <div id="mg-combo-text" class="absolute top-1/4 left-1/2 -translate-x-1/2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 opacity-0 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] z-10 pointer-events-none">COMBO x2 🔥</div>

                <div class="absolute bottom-0 left-0 w-full h-32 flex justify-center items-end">
                    <div class="w-full h-24 bg-blue-500/20 rounded-t-[100%] border-t border-blue-400/30 blur-[2px] absolute bottom-0"></div>
                    <div class="w-16 h-20 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-xl relative z-10 border-2 border-b-0 border-slate-500 flex justify-center pt-2 shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                        <div class="w-6 h-6 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_cyan]"></div>
                        <div class="absolute -bottom-2 w-24 h-6 bg-slate-600 rounded-full blur-md"></div>
                    </div>
                </div>
            </div>

            <div class="bg-slate-800 p-2 pb-6 relative z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] border-t-2 border-slate-700">
                <div class="max-w-md mx-auto">
                    <div class="bg-slate-900 border-2 border-slate-700 rounded-xl mb-2 h-14 flex items-center justify-center">
                        <span id="mg-input" class="text-3xl font-black text-cyan-400 tracking-widest drop-shadow-[0_0_5px_cyan]"></span>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        ${[1,2,3,4,5,6,7,8,9].map(n => `<button onclick="window.mgType(${n})" class="bg-slate-700 text-white font-black text-2xl h-14 rounded-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 hover:bg-slate-600 transition shadow-md">${n}</button>`).join('')}
                        <button onclick="window.mgClear()" class="bg-red-500/20 text-red-400 border-red-500/50 font-black text-xl h-14 rounded-xl border-b-4 active:border-b-0 active:translate-y-1 hover:bg-red-500/30 transition shadow-md"><i class="fas fa-backspace"></i></button>
                        <button onclick="window.mgType(0)" class="bg-slate-700 text-white font-black text-2xl h-14 rounded-xl border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 hover:bg-slate-600 transition shadow-md">0</button>
                        <button onclick="window.mgShoot()" class="bg-gradient-to-t from-blue-600 to-cyan-500 text-white font-black text-xl h-14 rounded-xl border-b-4 border-blue-800 active:border-b-0 active:translate-y-1 hover:opacity-90 transition shadow-[0_0_15px_rgba(6,182,212,0.4)]"><i class="fas fa-crosshairs mr-1"></i> BẮN</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    window.mgStartLevel();
};

window.mgTaoPhepTinh = function(level) {
    let ops = ['+', '-', 'x', ':']; let op = ops[Math.floor(Math.random() * ops.length)]; let a, b, ans;
    if (level === 1) { // Cộng trừ <100, nhân chia bảng 2-5
        if (op === '+') { a = Math.floor(Math.random()*40)+10; b = Math.floor(Math.random()*40)+10; ans = a+b; }
        else if (op === '-') { a = Math.floor(Math.random()*80)+20; b = Math.floor(Math.random()*(a-1))+1; ans = a-b; }
        else if (op === 'x') { a = Math.floor(Math.random()*4)+2; b = Math.floor(Math.random()*10)+1; ans = a*b; }
        else { b = Math.floor(Math.random()*4)+2; ans = Math.floor(Math.random()*10)+1; a = b*ans; }
    } else if (level === 2) { // Cộng trừ lớn, nhân chia bảng 6-9
        if (op === '+') { a = Math.floor(Math.random()*400)+100; b = Math.floor(Math.random()*400)+100; ans = a+b; }
        else if (op === '-') { a = Math.floor(Math.random()*500)+100; b = Math.floor(Math.random()*(a-1))+1; ans = a-b; }
        else if (op === 'x') { a = Math.floor(Math.random()*4)+6; b = Math.floor(Math.random()*10)+1; ans = a*b; }
        else { b = Math.floor(Math.random()*4)+6; ans = Math.floor(Math.random()*10)+1; a = b*ans; }
    } else { // Cấp 3 khó: Nhân chia 2 chữ số
        if (op === '+') { a = Math.floor(Math.random()*5000)+1000; b = Math.floor(Math.random()*5000)+1000; ans = a+b; }
        else if (op === '-') { a = Math.floor(Math.random()*8000)+1000; b = Math.floor(Math.random()*(a-1))+1; ans = a-b; }
        else if (op === 'x') { a = Math.floor(Math.random()*89)+10; b = Math.floor(Math.random()*8)+2; ans = a*b; }
        else { b = Math.floor(Math.random()*89)+10; ans = Math.floor(Math.random()*8)+2; a = b*ans; }
    }
    return { q: `${a} ${op} ${b}`, a: ans.toString() };
};

window.mgStartLevel = function() {
    mathGame.timeLeft = 60; mathGame.meteors = []; document.getElementById('mg-sky').innerHTML = `<div class="absolute inset-0 opacity-30" style="background-image: radial-gradient(white 1px, transparent 1px); background-size: 30px 30px;"></div><div id="mg-combo-text" class="absolute top-1/4 left-1/2 -translate-x-1/2 text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 to-red-600 opacity-0 transition-opacity duration-300 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] z-10 pointer-events-none">COMBO x2 🔥</div><div class="absolute bottom-0 left-0 w-full h-32 flex justify-center items-end"><div class="w-full h-24 bg-blue-500/20 rounded-t-[100%] border-t border-blue-400/30 blur-[2px] absolute bottom-0"></div><div class="w-16 h-20 bg-gradient-to-t from-slate-400 to-slate-200 rounded-t-xl relative z-10 border-2 border-b-0 border-slate-500 flex justify-center pt-2 shadow-[0_0_20px_rgba(59,130,246,0.5)]"><div class="w-6 h-6 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_cyan]"></div></div></div>`;
    document.getElementById('mg-level').innerText = mathGame.level;
    document.getElementById('mg-input').innerText = "";

    // Tốc độ sinh và rơi thiên thạch theo cấp
    let spawnRate = mathGame.level === 1 ? 3500 : (mathGame.level === 2 ? 2800 : 2000);
    let fallSpeed = mathGame.level === 1 ? 0.3 : (mathGame.level === 2 ? 0.45 : 0.6); // % chiều cao mỗi 20ms

    mathGame.spawn = setInterval(() => {
        if(!mathGame.active) return;
        let pt = window.mgTaoPhepTinh(mathGame.level);
        let id = 'mt_' + Date.now();
        let left = Math.random() * 70 + 10; // 10% đến 80% chiều ngang
        let el = document.createElement('div');
        el.id = id; el.className = "absolute p-2 bg-gradient-to-b from-red-600 to-orange-500 border-2 border-yellow-300 text-white font-black text-sm rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10 flex flex-col items-center justify-center transition-all duration-75";
        el.style.left = left + '%'; el.style.top = '-10%'; el.innerHTML = `${pt.q}`;
        document.getElementById('mg-sky').appendChild(el);
        mathGame.meteors.push({ id: id, ans: pt.a, top: -10, el: el });
    }, spawnRate);

    mathGame.loop = setInterval(() => {
        if(!mathGame.active) return;
        
        // Thời gian
        if(Date.now() % 1000 < 20) {
            mathGame.timeLeft--;
            let s = mathGame.timeLeft; document.getElementById('mg-time').innerText = `00:${s<10?'0'+s:s}`;
            if(mathGame.timeLeft <= 0) window.mgEndLevel();
        }

        // Rơi thiên thạch
        for(let i=mathGame.meteors.length-1; i>=0; i--) {
            let m = mathGame.meteors[i];
            m.top += fallSpeed;
            m.el.style.top = m.top + '%';
            if (m.top > 85) { // Chạm đất
                m.el.remove(); mathGame.meteors.splice(i, 1);
                mathGame.combo = 0; window.mgUpdateCombo();
                mathGame.lives--; window.mgUpdateLives();
                if(mathGame.lives <= 0) { window.mgGameOver(); break; }
            }
        }
    }, 20);
};

window.mgType = function(n) { 
    let inp = document.getElementById('mg-input'); 
    if(inp.innerText.length < 5) inp.innerText += n; 
};
window.mgClear = function() { document.getElementById('mg-input').innerText = ""; };

window.mgShoot = function() {
    if(!mathGame.active) return;
    let inpStr = document.getElementById('mg-input').innerText; if(!inpStr) return;
    let hitIndex = -1;
    
    // Tìm thiên thạch thấp nhất có đáp án khớp
    let lowestTop = -100;
    for(let i=0; i<mathGame.meteors.length; i++) {
        if(mathGame.meteors[i].ans === inpStr && mathGame.meteors[i].top > lowestTop) {
            hitIndex = i; lowestTop = mathGame.meteors[i].top;
        }
    }

    if (hitIndex !== -1) {
        // Trúng
        let m = mathGame.meteors[hitIndex];
        m.el.className = "absolute text-4xl animate-ping z-20"; m.el.innerHTML = "💥";
        setTimeout(() => { if(m.el) m.el.remove(); }, 300);
        mathGame.meteors.splice(hitIndex, 1);
        
        mathGame.combo++; window.mgUpdateCombo();
        let basePts = mathGame.level === 1 ? 1 : (mathGame.level === 2 ? 3 : 5);
        let pts = mathGame.combo >= 5 ? basePts * 2 : basePts;
        mathGame.score += pts; document.getElementById('mg-score').innerText = mathGame.score;
        
        document.getElementById('mg-sky').insertAdjacentHTML('beforeend', `<div class="absolute bottom-10 left-1/2 w-1 h-full bg-cyan-300 opacity-50 -translate-x-1/2 shadow-[0_0_20px_cyan]"></div>`);
        setTimeout(()=>document.getElementById('mg-sky').lastChild.remove(), 100);
    } else {
        // Xịt
        mathGame.combo = 0; window.mgUpdateCombo();
        document.getElementById('mg-input').classList.add('text-red-500');
        setTimeout(()=>document.getElementById('mg-input').classList.remove('text-red-500'), 200);
    }
    document.getElementById('mg-input').innerText = "";
};

window.mgUpdateCombo = function() {
    let txt = document.getElementById('mg-combo-text');
    if (mathGame.combo >= 5) { txt.classList.remove('opacity-0'); txt.classList.add('opacity-100', 'animate-pulse'); } 
    else { txt.classList.add('opacity-0'); txt.classList.remove('opacity-100', 'animate-pulse'); }
};

window.mgUpdateLives = function() {
    let hpStr = ""; for(let i=0;i<3;i++){ hpStr += i < mathGame.lives ? "❤️" : "🖤"; }
    document.getElementById('mg-lives').innerText = hpStr;
};

window.mgEndLevel = function() {
    clearInterval(mathGame.loop); clearInterval(mathGame.spawn);
    if(mathGame.level < 3) {
        mathGame.level++; mathGame.active = false;
        document.getElementById('mg-sky').innerHTML += `<div class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 animate-[cascadeDrop_0.5s_ease-out_forwards]"><h2 class="text-4xl font-black text-yellow-400 mb-2">QUA MÀN!</h2><p class="text-white mb-6">Chuẩn bị cấp độ ${mathGame.level}...</p><button onclick="mathGame.active=true; window.mgStartLevel();" class="bg-blue-600 text-white px-8 py-3 rounded-full font-black text-xl hover:bg-blue-500 shadow-[0_0_15px_blue]">TIẾP TỤC</button></div>`;
    } else {
        window.mgGameOver(true);
    }
};

window.mgGameOver = async function(isWin = false) {
    clearInterval(mathGame.loop); clearInterval(mathGame.spawn); mathGame.active = false;
    let msg = isWin ? "BẢO VỆ THÀNH CÔNG!" : "TRÁI ĐẤT BỊ PHÁ HỦY!";
    let titleColor = isWin ? "text-emerald-400" : "text-red-500";
    
    document.getElementById('mg-sky').innerHTML += `
        <div class="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-50 animate-[cascadeDrop_0.5s_ease-out_forwards]">
            <h2 class="text-3xl font-black ${titleColor} mb-2 uppercase">${msg}</h2>
            <p class="text-slate-300 font-bold mb-6">Số điểm đạt được: <span class="text-yellow-400 text-2xl ml-1">${mathGame.score}</span></p>
            <button onclick="window.thoatGameToan(true)" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xl hover:scale-105 transition shadow-[0_0_15px_blue]">NHẬN THƯỞNG & THOÁT</button>
        </div>
    `;
};

window.thoatGameToan = async function(saveScore = false) {
    clearInterval(mathGame.loop); clearInterval(mathGame.spawn);
    if(saveScore && mathGame.score > 0 && currentUser.role === 'student') {
        try { 
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "MathGame", group: "Bảo vệ Trái Đất", score_earned: mathGame.score, details: "Chơi game đạt " + mathGame.score + " điểm." } }) }); 
            Data.log.push({ id: currentUser.id, subject: "MathGame", group: "Bảo vệ Trái Đất", score: mathGame.score, time: new Date().toISOString(), details: "" }); 
            currentUser.score = Number(currentUser.score) + mathGame.score;
            alert(`Chúc mừng con đã xuất sắc đem về ${mathGame.score} điểm cho tài khoản của mình!`);
        } catch(e) { alert("Đã lưu điểm vào máy, nhưng mạng hơi chậm nên chưa đồng bộ được lên bảng vàng."); }
    }
    document.getElementById('gameUI').remove(); veTrangChu();
};
