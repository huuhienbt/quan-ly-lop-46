// ==========================================
// FILE: FEATURES.JS (BẢN BUNG FULL - HOÀN HẢO 100%)
// Tích hợp: Tải 1 lần (sửa vòng xoay), Bảng Vàng Leo Rank, Ong Vàng (🐝), 
// Danh hiệu trang cá nhân (Bỏ Chiến binh), Chữ chạy trượt xuống, Giải đố Tiếng Việt
// ==========================================

let isSpinning = false;
window.Data = window.Data || { hs: [], math: [], tv: [], vietnamese: [], log: [], caudo: [] };
window.isAllDataLoaded = false;

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
// 0. BỘ NÃO TẢI DỮ LIỆU TỔNG (VÒNG XOAY HOẠT ĐỘNG CHUẨN)
// ==========================================
window.loadAllDataOnce = async function(force = false) {
    if (window.isAllDataLoaded && !force) return true;

    // Ép vòng tròn phải xoay bằng animate-spin và inline-block
    document.getElementById('content').innerHTML = `
        <div class="flex flex-col items-center justify-center mt-28 fade-in opacity-90">
            <i class="fas fa-circle-notch animate-spin inline-block text-5xl text-indigo-500 mb-4 drop-shadow-md"></i>
            <p class="text-slate-500 font-bold text-sm animate-pulse tracking-wide">Đang tải dữ liệu...</p>
        </div>
    `;

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
        document.getElementById('content').innerHTML = `
            <div class="text-center mt-24 text-red-500 fade-in">
                <i class="fas fa-wifi text-6xl mb-4 opacity-50"></i>
                <h2 class="text-xl font-black uppercase mb-2">Lỗi Kết Nối</h2>
                <p class="font-bold text-sm">Không thể tải dữ liệu. Thầy/cô và con vui lòng F5 tải lại trang nhé!</p>
            </div>
        `;
        return false;
    }
};

// ==========================================
// 1. GÓC HỌC TẬP & BẢNG VÀNG CHUẨN THỜI GIAN
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
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 relative">
            <button onclick="window.loadSubject('math')" class="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${mathBadge}
                <i class="fas fa-calculator text-4xl mb-2 block opacity-90"></i>TOÁN
            </button>
            <button onclick="window.loadSubject('vietnamese')" class="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${tvBadge}
                <i class="fas fa-book-open text-4xl mb-2 block opacity-90"></i>TIẾNG VIỆT
            </button>
        </div>
    `; 
    
    function parseLogTime(timeStr) {
        if(!timeStr) return 0; let d = new Date(timeStr); return !isNaN(d.getTime()) ? d.getTime() : 0; 
    }

    let studentsWithTime = Data.hs.map(s => {
        let scoreVal = Number(s.score) || 0;
        let userLogs = Data.log.filter(l => String(l.id) === String(s.id) && Number(l.score) !== 0);
        let achievedTime = 0;
        if (userLogs.length > 0) {
            userLogs.sort((a, b) => parseLogTime(a.time) - parseLogTime(b.time));
            achievedTime = parseLogTime(userLogs[userLogs.length - 1].time);
        }
        return { ...s, score: scoreVal, achievedTime: achievedTime };
    });

    let eligibleStudents = studentsWithTime.filter(s => s.score > 1500); 
    let sortedStudents = eligibleStudents.sort((a, b) => {
        let scoreDiff = b.score - a.score; 
        if (scoreDiff !== 0) return scoreDiff;
        let timeA = a.achievedTime === 0 ? Infinity : a.achievedTime;
        let timeB = b.achievedTime === 0 ? Infinity : b.achievedTime;
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
            
            let nameColor = "text-slate-700 font-bold";
            let rowStyles = "bg-slate-50 border-slate-200"; 
            
            if (actualDisplayRank === 1) { rowStyles = "bg-yellow-50 scale-[1.02] z-10"; nameColor = "text-yellow-700 font-bold"; rankIcon = `<i class="fas fa-medal text-3xl text-yellow-500 drop-shadow-md"></i>`; }
            else if (actualDisplayRank === 2) { rowStyles = "bg-gray-50"; rankIcon = `<i class="fas fa-medal text-3xl text-slate-400 drop-shadow-md"></i>`; }
            else if (actualDisplayRank === 3) { rowStyles = "bg-orange-50"; rankIcon = `<i class="fas fa-medal text-3xl text-orange-400 drop-shadow-md"></i>`; }

            if (s.score >= 5000) {
                titleBadge = `<div class="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-star mr-1"></i>Ngôi Sao Tri Thức</div>`;
                nameColor = "text-red-600 font-black drop-shadow-md";
                rowStyles += " border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] ring-2 ring-red-200 ring-offset-1 animate-pulse";
            } else if (s.score >= 4000) {
                titleBadge = `<div class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-award mr-1"></i>Học Sinh Ưu Tú</div>`;
                nameColor = "text-purple-700 font-bold drop-shadow-sm";
                rowStyles += " border-2 border-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.4)]";
            } else if (s.score >= 3000) {
                titleBadge = `<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center mt-1 shadow-sm"><i class="fas fa-medal mr-1"></i>Học Giả Nhí</div>`;
                nameColor = "text-emerald-700 font-bold";
                rowStyles += " border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]";
            } else {
                if (actualDisplayRank === 1) rowStyles += " border-yellow-300 shadow-sm";
                else if (actualDisplayRank === 2) rowStyles += " border-gray-300";
                else if (actualDisplayRank === 3) rowStyles += " border-orange-200";
                else rowStyles += " border-slate-100";
            }

            let allBadges = "";
            if (titleBadge || ongVangBadge) {
                allBadges = `<div class="flex flex-wrap gap-1">${titleBadge}${ongVangBadge}</div>`;
            }
            
            return `
                <div class="flex items-center justify-between p-3 mb-2 rounded-xl transition-all relative border ${rowStyles}">
                    <div class="flex items-center gap-3">
                        <div class="w-10 text-center flex justify-center shrink-0">${rankIcon}</div>
                        <div class="flex flex-col">
                            <span class="${nameColor} text-sm sm:text-base tracking-wide">${s.name}</span>
                            ${allBadges}
                        </div>
                    </div>
                    <div class="font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm text-sm shrink-0">
                        ${s.score} <span class="text-[10px] text-indigo-500 font-bold ml-1 uppercase">điểm</span>
                    </div>
                </div>
            `; 
        }).join(''); 
        
        let personalMsg = ""; 
        if (currentUser && currentUser.role === 'student') { 
            let myScore = Number(currentUser.score) || 0; 
            let myRank = uniqueScores.indexOf(myScore) + 1; 
            if (myRank === 0) myRank = uniqueScores.length + 1; 
            
            if (myScore > 1500) { 
                if (myRank <= 15) { 
                    personalMsg = `<div class="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl text-center"><p class="text-green-700 font-bold text-sm"><i class="fas fa-star text-yellow-500 mr-1 animate-pulse"></i> Tuyệt vời! Con đang ở Top ${myRank} Bảng Vàng!</p></div>`; 
                } else { 
                    personalMsg = `<div class="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center"><p class="text-blue-700 font-bold text-sm"><i class="fas fa-rocket mr-1 text-blue-500"></i> Con đã vượt mốc với ${myScore} điểm (Hạng ${myRank}).<br>Cố lên nhé, Bảng Vàng ngay trước mắt rồi!</p></div>`; 
                } 
            } else { 
                personalMsg = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Vạch xuất phát là 1500 điểm.<br>Hãy làm bài tập để vượt mốc này và ghi danh nhé!</p></div>`; 
            } 
        } 
        
        leaderboardHtml = `
            <div class="mt-10 bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-yellow-400 fade-in">
                <div class="text-center mb-5"><h3 class="font-black text-xl sm:text-2xl text-yellow-600 uppercase tracking-wide"><i class="fas fa-crown text-yellow-500 mr-2 mb-1 animate-bounce inline-block"></i>BẢNG VÀNG LỚP 4/6</h3></div>
                <div class="flex flex-col">${listHtml}</div>
                ${personalMsg}
            </div>
        `; 
    } else { 
        let personalMsgEmpty = ""; 
        if (currentUser && currentUser.role === 'student') { 
            personalMsgEmpty = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Hãy làm bài tập để trở thành người đầu tiên vượt mốc 1500 điểm nhé!</p></div>`; 
        } 
        leaderboardHtml = `
            <div class="mt-10 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in opacity-80">
                <i class="fas fa-trophy text-5xl text-slate-200 mb-3 block"></i>
                <p class="font-black text-slate-500 text-lg uppercase">Bảng Vàng đang trống</p>
                <p class="text-sm font-bold text-slate-400 mt-1">Chưa có chiến binh nào vượt mốc 1500 điểm.</p>
                ${personalMsgEmpty}
            </div>
        `; 
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
        html += `
            <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 mb-4 fade-in overflow-hidden transition-all">
                <div onclick="window.toggleGroupQuestions('${safeGrpId}')" class="flex items-center justify-between p-5 cursor-pointer hover:bg-indigo-50 transition select-none">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-inner"><i class="fas fa-layer-group"></i></div>
                        <div><h3 class="font-black text-xl text-slate-800 uppercase">${grp}</h3><p class="text-sm font-bold text-slate-400">${questions.length} câu hỏi</p></div>
                    </div>
                    <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i id="icon_${safeGrpId}" class="fas fa-chevron-down transition-transform duration-300 text-lg"></i></div>
                </div>
                <div id="content_${safeGrpId}" class="hidden px-5 pb-5 pt-2 border-t-2 border-slate-50 bg-slate-50/50 space-y-3">
        `; 
        questions.forEach((q, index) => { 
            let qText = window.parseImg(q.question || ""); 
            if (q.image) qText += `<br><img src="${q.image}" class="max-w-full rounded-md mt-2">`;
            if (qText.includes('[BAIDOC]')) qText = "<span class='text-yellow-600 font-bold'>[CHỨA BÀI ĐỌC]</span> " + qText.replace(/\[BAIDOC\].*?\[\/BAIDOC\]/s, '').trim();
            html += `
                <div class="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition relative shadow-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-3 w-full pr-16">
                            <span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">${index + 1}</span>
                            <div class="font-medium text-slate-700 text-base mt-1 overflow-hidden break-words w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mt-2">${qText}</div>
                        </div>
                        <div class="flex gap-2 absolute top-4 right-4">
                            <button onclick="window.renderFormCauHoi('${q.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm" title="Sửa"><i class="fas fa-edit"></i></button>
                            <button onclick="window.xoaCauHoi('${q.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `; 
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
            <button onclick="document.execCommand('superscript', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 font-bold text-slate-700 text-sm">X²</button>
            <div class="relative flex items-center bg-white rounded shadow-sm px-1 hover:bg-slate-200 h-8"><input type="color" onchange="document.execCommand('foreColor', false, this.value)" class="w-5 h-5 border-0 bg-transparent cursor-pointer"></div>
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            <button onclick="document.execCommand('justifyLeft', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-left"></i></button>
            <button onclick="document.execCommand('justifyCenter', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-center"></i></button>
            <button onclick="document.execCommand('justifyRight', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-right"></i></button>
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            <button onclick="window.chenLinkVaoEditor('${targetId}')" class="px-2 h-8 bg-blue-50 rounded hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200"><i class="fas fa-link"></i> Link</button>
            <button onclick="window.chenAnhVaoEditor('${targetId}')" class="px-2 h-8 bg-indigo-50 rounded hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200"><i class="fas fa-image"></i> Ảnh</button>
            <button onclick="window.chenVideoYouTube('${targetId}')" class="px-2 h-8 bg-red-50 rounded hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 border border-red-200"><i class="fab fa-youtube"></i> Video</button>
            <button onclick="window.chenAmThanh('${targetId}')" class="px-2 h-8 bg-green-50 rounded hover:bg-green-100 text-green-700 font-bold text-xs flex items-center gap-1 border border-green-200"><i class="fas fa-music"></i> Nghe</button>
            <button onclick="window.chenPDF('${targetId}')" class="px-2 h-8 bg-orange-50 rounded hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center gap-1 border border-orange-200"><i class="fas fa-file-pdf"></i> PDF</button>
            <select onchange="window.resizeImg(this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ ảnh...</option><option value="30%">Thu nhỏ 30%</option><option value="60%">Vừa 60%</option><option value="100%">Phóng to 100%</option></select>
        </div>
    `;
};

window.chenAmThanh = function(targetId) {
    const url = prompt("Dán link file MP3 (từ Google Drive hoặc GitHub) vào đây:"); if (!url) return;
    const audioTitle = prompt("Nhập tiêu đề cho bài nghe:", "BÀI NGHE AUDIO"); if (!audioTitle) return;
    let driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); let audioHtml = "";
    if (driveMatch) { 
        audioHtml = `<div contenteditable="false" style="margin: 15px auto; max-width: 600px; background: #f8fafc; padding: 15px; border-radius: 16px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"><p style="font-size: 13px; color: #0284c7; font-weight: black; margin-bottom: 12px; text-transform: uppercase;"><i class="fas fa-headphones-alt mr-1"></i> ${audioTitle}</p><iframe src="https://drive.google.com/file/d/${driveMatch[1]}/preview" style="width: 100%; height: 80px; margin: 0 auto; display: block; border:none; border-radius: 8px; background: white;" allow="autoplay"></iframe></div><br>`; 
    } else { 
        let audioSrc = url; if (url.includes("github.com") && url.includes("/blob/")) { audioSrc = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/"); } 
        audioHtml = `<div contenteditable="false" style="margin: 15px auto; max-width: 600px; text-align: center; background: #f8fafc; padding: 15px; border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"><p style="font-size: 13px; color: #0284c7; font-weight: black; margin-bottom: 12px; text-transform: uppercase;"><i class="fas fa-headphones-alt mr-1"></i> ${audioTitle}</p><audio controls style="width: 100%; display: block; margin: 0 auto; outline: none; border-radius: 8px;"><source src="${audioSrc}" type="audio/mpeg">Trình duyệt không hỗ trợ.</audio></div><br>`; 
    }
    document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, audioHtml);
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
                    if(result.url) { document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, `<div style="text-align: center;"><img src="${result.url}" loading="lazy" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block; cursor: pointer;"></div><br>`); } 
                    else { alert("Lỗi! Không lấy được link ảnh."); } 
                } catch(err) { alert("Lỗi mạng khi tải ảnh lên!"); } finally { document.getElementById('loader').style.display = 'none'; }
            }; img.src = event.target.result; 
        }; reader.readAsDataURL(file); 
    }; input.click(); 
};

window.handleEditorClick = function(e) { 
    document.querySelectorAll('div[contenteditable="true"] img').forEach(img => img.style.border = 'none'); window.currentSelectedImg = null; 
    if (e.target.tagName === 'IMG') { e.target.style.border = '3px dashed #f97316'; window.currentSelectedImg = e.target; } 
};
window.resizeImg = function(size) { if(!size) return; if(!window.currentSelectedImg) return alert("Thầy hãy bấm chọn một tấm ảnh ở dưới trước khi chỉnh kích thước nhé!"); window.currentSelectedImg.style.width = size; window.currentSelectedImg.style.height = 'auto'; };
window.parseImg = function(t) { return (t||"").toString().replace(/\[img:(.*?)\]/g, '<img src="$1" loading="lazy" class="rounded border my-2">').replace(/\n/g,'<br>'); };

window.autoFillTime = function() { 
    let selectedGroup = document.getElementById('frmG').value; let existingQ = Data[curSub].find(q => q.group === selectedGroup); 
    if (existingQ && existingQ.time) { document.getElementById('frmT').value = existingQ.time; } 
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

    let formLayout = isTV ? 
        `<div class="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl"><label class="text-xs font-black text-yellow-700 uppercase tracking-wider block mb-2"><i class="fas fa-book-reader"></i> Khung Bài Đọc</label>${window.getRichTextToolbar('frmBaiDoc')}<div id="frmBaiDoc" onclick="window.handleEditorClick(event)" contenteditable="true" class="w-full min-h-[120px] bg-white border border-yellow-300 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${baiDocHtml}</div></div><div class="w-full mb-4"><label class="text-xs font-black text-green-700 uppercase tracking-wider block mb-2"><i class="fas fa-question-circle"></i> Khung Câu Hỏi</label>${window.getRichTextToolbar('frmQ')}<div id="frmQ" onclick="window.handleEditorClick(event)" contenteditable="true" class="w-full min-h-[120px] bg-white border-2 border-green-200 p-4 rounded-xl outline-none focus:border-green-500 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${cauHoiHtml}</div></div>` 
        : 
        `<div class="w-full mb-4"><label class="text-xs font-black text-indigo-700 uppercase tracking-wider block mb-2"><i class="fas fa-calculator"></i> Nội dung câu hỏi</label>${window.getRichTextToolbar('frmQ')}<div id="frmQ" onclick="window.handleEditorClick(event)" contenteditable="true" class="w-full min-h-[150px] bg-white border-2 border-indigo-200 p-4 rounded-xl outline-none focus:border-indigo-500 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${cauHoiHtml}</div></div>`;
        
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
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án A</label><input type="text" id="frmA" value="${q.a}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án B</label><input type="text" id="frmB" value="${q.b}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án C</label><input type="text" id="frmC" value="${q.c}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án D</label><input type="text" id="frmD" value="${q.d}" class="edit-input w-full mt-1"></div>
            </div>
            <div class="mt-4"><label class="text-xs font-bold text-slate-500 uppercase">Chọn Đáp Án Đúng</label><select id="frmCorr" class="edit-input w-full mt-1 bg-yellow-50 text-yellow-800 border-yellow-200"><option value="a" ${q.correct=='a'?'selected':''}>Đáp án A</option><option value="b" ${q.correct=='b'?'selected':''}>Đáp án B</option><option value="c" ${q.correct=='c'?'selected':''}>Đáp án C</option><option value="d" ${q.correct=='d'?'selected':''}>Đáp án D</option></select></div>
            <button onclick="window.luuCauHoi('${id || ''}')" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black btn-3d shadow-lg mt-6 text-lg hover:bg-indigo-700 transition"><i class="fas fa-save mr-2"></i> LƯU CÂU HỎI LÊN HỆ THỐNG</button>
        </div>
    `; 
};

window.luuCauHoi = async function(id) { 
    document.querySelectorAll('#frmQ img, #frmBaiDoc img').forEach(img => img.style.border = 'none'); window.currentSelectedImg = null;
    let finalQuestionText = document.getElementById("frmQ").innerHTML; let isTV = (curSub === 'vietnamese' || curSub === 'tv');
    if (isTV) { let baiDocText = document.getElementById("frmBaiDoc").innerHTML.trim(); if (baiDocText && baiDocText !== '<br>') { finalQuestionText = `[BAIDOC]${baiDocText}[/BAIDOC] ` + finalQuestionText; } }
    if (finalQuestionText.includes('data:image')) { alert("⚠️ CẢNH BÁO! Vui lòng dùng nút [Ảnh] để tải ảnh lên, KHÔNG dùng lệnh Copy/Dán (Ctrl+V) trực tiếp vào khung."); return; }
    const data = { id: id, subject: curSub, group: document.getElementById("frmG").value, time: document.getElementById("frmT").value, question: finalQuestionText, a: document.getElementById("frmA").value, b: document.getElementById("frmB").value, c: document.getElementById("frmC").value, d: document.getElementById("frmD").value, correct: document.getElementById("frmCorr").value, image: "" }; 
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
// 4. TIẾN TRÌNH LÀM BÀI & THƯỞNG TỐC ĐỘ 
// ==========================================
window.loadSubject = async function(sub) { 
    if(!currentUser) return showLogin(); 
    curSub = sub; 
    if (!(await window.loadAllDataOnce())) return;
    
    const qs = Data[sub]; if (!qs) { alert("Không tải được dữ liệu. Vui lòng thử lại."); return veTrangChu(); }
    const grps = [...new Set(qs.map(x => x.group))].filter(g => g).sort((a, b) => { let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); });
    
    let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2></div><div class="space-y-3">`; 
    
    if(grps.length === 0) { 
        html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`; 
    } else {
        grps.forEach(g => { 
            const isDone = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g); 
            const time = qs.find(q => q.group === g).time || 20; 
            const count = qs.filter(q => q.group === g && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length; 
            
            let clickAction = `window.startQuiz('${g}', ${time})`; 
            if (isDone && currentUser.role === 'student') { 
                let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0');
                if(tokens > 0) clickAction = `window.promptRedo('${g}', ${time})`; 
                else clickAction = `alert('Con đã làm bài này rồi. Hãy vào Vòng Quay May Mắn để tìm VÉ LÀM LẠI nhé!')`; 
            } 
            
            let badgeHtml = !isDone ? `<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>` : `<span class="bg-slate-200 text-slate-500 text-[10px] font-black px-2 py-1 rounded"><i class="fas fa-lock text-xs mr-1"></i>ĐÃ LÀM</span>`; 
            
            html += `
                <div onclick="${clickAction}" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${isDone ? 'border-green-100 bg-green-50/40 opacity-80' : 'border-indigo-50'}">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}"><i class="fas ${isDone ? 'fa-check-circle' : 'fa-star'}"></i></div>
                        <div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p></div>
                    </div>
                    ${badgeHtml}
                </div>
            `; 
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
            <div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4">
                <div class="flex items-center gap-3"><button onclick="window.loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-green-700 truncate max-w-[150px]">${curGrp}</span></div>
                <div class="bg-white px-4 py-2 rounded-full font-black text-green-600 shadow-sm border border-green-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div>
            </div>
            <div class="flex flex-col lg:flex-row gap-6">
                <div class="lg:w-1/2 bg-[#fffbeb] p-6 sm:p-8 rounded-[2rem] border-2 border-yellow-200 shadow-inner lg:h-[75vh] overflow-y-auto relative custom-scrollbar">
                    <div class="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1 rounded-bl-xl opacity-80">BÀI ĐỌC</div>
                    <h3 class="font-black text-yellow-800 text-xl mb-4 flex items-center gap-2 border-b-2 border-yellow-200 pb-3"><i class="fas fa-book-reader text-2xl"></i> NỘI DUNG ĐỌC HIỂU</h3>
                    <div class="text-slate-800 leading-[1.8] text-base sm:text-lg whitespace-pre-wrap font-medium pb-10 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${window.parseImg(readingPassage)}</div>
                </div>
                <div class="lg:w-1/2" id="quizBox"></div>
            </div>
        `;
    } else { 
        document.getElementById('content').innerHTML = `
            <div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4">
                <div class="flex items-center gap-3"><button onclick="window.loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-indigo-900 truncate max-w-[150px]">${curGrp}</span></div>
                <div class="bg-white px-4 py-2 rounded-full font-black text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div>
            </div>
            <div id="quizBox" class="bg-white p-5 sm:p-8 rounded-[2rem] shadow-xl border-4 border-white min-h-[400px] text-base sm:text-lg"></div>
        `; 
    }
    window.renderQuestion(0); window.startTimer(timeMins * 60); 
};

window.renderQuestion = function(index) { 
    if (index >= quiz.length) { window.finishQuiz(); return; } 
    const q = quiz[index]; let colorTheme = (curSub === 'vietnamese' || curSub === 'tv') ? 'text-green-600' : 'text-indigo-600'; 
    let wrapperClass = (curSub === 'vietnamese' || curSub === 'tv') ? 'bg-white p-6 rounded-[2rem] shadow-lg border-2 border-slate-100' : '';
    let optionsHtml = ['a','b','c','d'].filter(k => q[k]).map(key => `
        <div onclick="window.checkAns(this, '${key}', '${q.correct}', ${index})" class="quiz-option p-4 sm:p-5 border-2 border-slate-100 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition btn-3d bg-white">
            <span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase text-lg shrink-0 shadow-inner">${key}</span>
            <div class="font-bold text-slate-700 flex-1 text-base sm:text-lg leading-relaxed">${window.parseImg(q[key])}</div>
        </div>
    `).join('');
    document.getElementById("quizBox").innerHTML = `
        <div class="${wrapperClass} fade-in">
            <div class="mb-6">
                <div class="text-sm font-black ${colorTheme} mb-3 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">CÂU HỎI ${index + 1} / ${quiz.length}</div>
                <div class="text-xl sm:text-2xl font-bold text-slate-800 leading-snug [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${window.parseImg(q.question)}</div>
            </div>
            <div class="space-y-4">${optionsHtml}</div>
        </div>
    `; 
};

window.checkAns = function(el, selected, correct, index) { 
    document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70')); const q = quiz[index]; 
    if (selected === correct.toLowerCase()) { el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800', 'scale-[1.02]'); score += 10; } 
    else { 
        el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800', 'scale-[0.98]'); 
        let wrongText = `<div class="bg-white p-4 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-red-500">Câu ${index+1}:</span> ${window.parseImg(q.question)}</p><div class="space-y-2 mt-3"><p class="text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-100"><i class="fas fa-times-circle mr-1"></i> <b>Bé chọn (${selected.toUpperCase()}):</b> <span class="font-medium">${window.parseImg(q[selected])}</span></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng (${correct.toUpperCase()}):</b> <span class="font-medium">${window.parseImg(q[correct])}</span></p></div></div>`; 
        wrongAnswersLog.push(wrongText); 
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
    
    document.getElementById('content').innerHTML = `
        <div class="text-center bg-white p-10 rounded-[3rem] shadow-2xl fade-in max-w-lg mx-auto mt-10 border-t-8 border-indigo-500">
            <div class="text-7xl mb-6 animate-bounce">🏆</div>
            <h3 class="text-3xl font-black text-slate-800 mb-2 uppercase tracking-wider">ĐIỂM CỦA CON</h3>
            <p class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 drop-shadow-sm">${score}</p>
            ${rewardMessage}
            <button onclick="window.loadSubject('${curSub}')" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl btn-3d shadow-lg w-full hover:scale-[1.02] transition mt-6">HOÀN TẤT & TRỞ VỀ</button>
        </div>
    `; 
    
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
// 5. VÒNG QUAY MAY MẮN
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
            <div class="flex justify-center items-center gap-4 mb-6">
                <p class="text-slate-500 font-bold text-sm">Điểm: <span id="vqCurrentScore" class="text-indigo-600 font-black text-lg">${currentUser.score || 0}</span></p>
                <p class="text-slate-500 font-bold text-sm border-l-2 pl-4">Vé làm lại: <span class="text-orange-500 font-black text-lg">${localStorage.getItem('redo_tokens_'+currentUser.id) || 0}</span></p>
            </div>
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
    
    if (todayLogs.length === 0) { 
        container.innerHTML = `<div class="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-center"><p class="text-sm font-bold text-slate-400"><i class="fas fa-info-circle"></i> Hôm nay chưa có bạn nào thử vận may.</p></div>`; return; 
    }
    todayLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); 
    let listItems = todayLogs.map(l => {
        let hs = Data.hs.find(x => String(x.id) === String(l.id)); let name = hs ? hs.name : "Một bạn";
        let prizeText = (l.details || "").replace("Quay trúng: ", "").split(" (")[0]; 
        let textStyle = "text-orange-600 font-bold";
        if(prizeText.includes("Kho Báu")) textStyle = "text-red-600 font-black animate-pulse";
        if(prizeText.includes("Mất Lượt") || prizeText.includes("-10")) textStyle = "text-slate-400 font-medium";
        return `<div class="py-2.5 border-b border-orange-100/50 last:border-0 text-[13px] text-slate-600 flex justify-between items-center"><span class="font-black text-blue-600 truncate mr-2"><i class="fas fa-user-circle text-blue-300 mr-1"></i>${name}</span> <span class="text-right ${textStyle}">${prizeText}</span></div>`;
    }).join('');

    let spacer = todayLogs.length < 4 ? `<div class="py-4 text-center text-orange-300 text-[11px] font-bold italic border-b border-orange-100/50">... chờ các bạn khác ...</div>` : "";
    let animDuration = Math.max(todayLogs.length * 2.5, 10);
    
    container.innerHTML = `
        <div class="bg-orange-50/50 rounded-2xl border border-orange-200 relative overflow-hidden shadow-inner h-40 group">
            <div class="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-orange-50 to-transparent z-10 pointer-events-none"></div>
            <div class="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-orange-50 to-transparent z-10 pointer-events-none"></div>
            <h3 class="text-[11px] font-black text-orange-600 uppercase tracking-widest bg-orange-100 py-2 text-center border-b border-orange-200 relative z-20 shadow-sm"><i class="fas fa-gift mr-1"></i> Trạm Nhận Quà</h3>
            <div class="overflow-hidden h-[120px] relative px-4"><div class="animate-scroll-down flex flex-col group-hover:[animation-play-state:paused] pt-2">${listItems}${spacer}${listItems}${spacer}</div></div>
            <style>@keyframes scrollDown { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } } .animate-scroll-down { animation: scrollDown ${animDuration}s linear infinite; }</style>
        </div>
    `;
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
    overlay.innerHTML = `
        <div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-purple-500 animate-[cascadeDrop_0.5s_ease-out_forwards]">
            <div class="text-6xl mb-4 animate-bounce">🧠</div>
            <h3 class="text-2xl font-black text-purple-600 mb-2 uppercase">Thử Tài Giải Đố</h3>
            <p class="text-slate-600 font-bold mb-4">Trả lời đúng để nhận ngay 20 điểm:</p>
            <div class="bg-purple-50 text-purple-800 ${textSize} font-black p-4 rounded-xl mb-6 shadow-inner border border-purple-200 leading-snug">${questionStr}${isMath ? ' = ?' : ''}</div>
            <input type="${inputType}" id="riddleAns" class="w-full p-4 border-2 border-purple-200 rounded-xl font-bold text-xl text-center mb-6 focus:border-purple-500 outline-none" placeholder="Đáp án của con...">
            <button onclick="window.checkRiddle('${correctAns}', '${todayStr}', '${uniqueGroup}')" class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-black shadow-lg btn-3d hover:scale-[1.02] transition">TRẢ LỜI</button>
            <button onclick="document.getElementById('riddleModal').remove(); window.isSpinning=false; window.restoreSpinButton(JSON.parse(localStorage.getItem('spinLog_'+currentUser.id)));" class="w-full mt-4 text-slate-400 font-bold hover:text-slate-600 transition">Đóng</button>
        </div>
    `;
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
    overlay.innerHTML = `
        <div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 animate-[cascadeDrop_0.5s_ease-out_forwards]" style="border-color: ${prize.color}">
            <div class="text-7xl mb-4 animate-bounce">${prize.icon}</div><h3 class="text-2xl font-black text-slate-800 mb-2">${prize.text}</h3><p class="text-slate-600 font-bold mb-6 text-sm">${prize.msg}</p>
            <button onclick="document.getElementById('prizeModal').remove()" class="w-full text-white py-3 rounded-xl font-black shadow-md transition hover:opacity-80" style="background-color: ${prize.color}">ĐÓNG</button>
        </div>
    `;
    document.body.appendChild(overlay);
};

// ==========================================
// 6. QUẢN LÝ TIẾN ĐỘ THÔNG MINH
// ==========================================
window.moTienDo = async function() { 
    closeMenu(); 
    if (!(await window.loadAllDataOnce())) return;
    
    const mathGroups = [...new Set(Data.math.map(x=>x.group))].filter(g=>g); const tvGroups = [...new Set(Data.tv.map(x=>x.group))].filter(g=>g); const total = mathGroups.length + tvGroups.length; 
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600">TIẾN ĐỘ CHUNG (${total} BÀI)</h2></div><p class="text-xs text-slate-500 mb-4 text-center italic"><i class="fas fa-hand-pointer mr-1"></i> Bấm vào tên học sinh để xem chi tiết</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10 fade-in">`; 
    html += Data.hs.map(h => { 
        const userL = Data.log.filter(l => String(l.id) === String(h.id)); 
        const validLogs = userL.filter(l => { if (l.subject === 'math') return mathGroups.includes(l.group); if (l.subject === 'vietnamese' || l.subject === 'tv') return tvGroups.includes(l.group); return false; });
        const done = new Set(validLogs.map(l => (l.subject === 'tv' ? 'vietnamese' : l.subject) + '_' + l.group)).size; const pct = total ? Math.round((done/total)*100) : 0; 
        return `
            <div onclick="window.xemChiTietTienDo('${h.id}', '${h.name}')" class="bg-white p-4 rounded-2xl border-2 border-transparent shadow-sm flex justify-between items-center cursor-pointer hover:border-purple-300 hover:shadow-md transition">
                <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-black"><i class="fas fa-user"></i></div><span class="font-bold text-slate-700">${h.name}</span></div>
                <div class="w-1/3 text-right"><div class="text-[11px] font-black mb-1 text-slate-500">${done}/${total} BÀI (${pct}%)</div><div class="progress-bar h-1.5"><div class="progress-fill ${pct==100?'bg-green-500':'bg-purple-500'}" style="width:${pct}%"></div></div></div>
            </div>
        `; 
    }).join(''); 
    document.getElementById('content').innerHTML = html + "</div>"; 
};

window.xemChiTietTienDo = function(studentId, studentName) { 
    const userLogs = Data.log.filter(l => String(l.id) === String(studentId)); 
    const sortFunc = (a, b) => { let matchA = String(a).match(/\d+(\.\d+)?/); let matchB = String(b).match(/\d+(\.\d+)?/); let numA = matchA ? parseFloat(matchA[0]) : 0; let numB = matchB ? parseFloat(matchB[0]) : 0; if(numA !== numB) return numB - numA; return String(b).localeCompare(String(a)); };
    const mathGroups = [...new Set(Data.math.map(x=>x.group))].filter(g=>g).sort(sortFunc); const tvGroups = [...new Set(Data.tv.map(x=>x.group))].filter(g=>g).sort(sortFunc); 
    const renderSubjectProgress = (subjectCode, groupsList) => { 
        if(groupsList.length === 0) return `<p class="text-sm text-slate-400 italic py-2">Chưa có bài tập</p>`; 
        return groupsList.map(grp => { 
            let groupLogs = userLogs.filter(l => (l.subject === subjectCode || (subjectCode === 'vietnamese' && l.subject === 'tv')) && l.group === grp); 
            if(groupLogs.length > 0) { 
                groupLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); const log = groupLogs[0]; 
                const btnChiTiet = log.details ? `<button onclick="window.xemLoiSai('${studentId}', '${subjectCode}', '${grp}')" class="text-[10px] bg-red-50 text-red-600 font-bold px-3 py-1 rounded hover:bg-red-600 hover:text-white transition shadow-sm"><i class="fas fa-search mr-1"></i>Xem lỗi sai</button>` : `<span class="text-[10px] text-green-500 font-bold px-2 py-1"><i class="fas fa-check-circle"></i> Tuyệt đối</span>`; 
                return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition px-2 rounded-lg"><div class="flex items-center gap-2"><i class="fas fa-check-circle text-green-500 text-lg"></i><span class="font-bold text-slate-700 text-sm">${grp}</span></div><div class="flex items-center gap-3"><span class="font-black text-indigo-600 text-lg">${log.score}đ</span>${btnChiTiet}</div></div>`; 
            } else { return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 opacity-50 px-2"><div class="flex items-center gap-2"><i class="far fa-circle text-slate-300 text-lg"></i><span class="font-bold text-slate-500 text-sm line-through">${grp}</span></div><span class="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">Chưa làm</span></div>`; } 
        }).join(''); 
    }; 
    document.getElementById('content').innerHTML = `
        <div class="flex items-center mb-6"><button onclick="window.moTienDo()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600 uppercase">CHI TIẾT: ${studentName}</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in pb-10">
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-100"><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-calculator"></i></div><h3 class="font-black text-blue-800 text-lg">MÔN TOÁN</h3></div><div>${renderSubjectProgress('math', mathGroups)}</div></div>
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-100"><div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><i class="fas fa-book"></i></div><h3 class="font-black text-green-800 text-lg">MÔN TIẾNG VIỆT</h3></div><div>${renderSubjectProgress('vietnamese', tvGroups)}</div></div>
        </div>
        <div id="modalReview" class="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in"><div class="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden flex flex-col max-h-[85vh]"><div class="bg-red-500 p-5 text-white flex justify-between items-center relative shadow-md"><div><h3 class="font-black text-lg uppercase" id="rvTitle">--</h3><p class="text-xs text-red-100 font-bold" id="rvName">--</p></div><button onclick="document.getElementById('modalReview').classList.add('hidden')" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition"><i class="fas fa-times"></i></button></div><div id="rvContent" class="p-5 overflow-y-auto bg-slate-50 space-y-4 text-sm text-slate-700 leading-relaxed font-medium"></div></div></div>
    `; 
};

window.xemLoiSai = function(studentId, subjectCode, group) { 
    const student = Data.hs.find(s => String(s.id) === String(studentId)); const studentName = student ? student.name : "Học sinh"; 
    let groupLogs = Data.log.filter(l => String(l.id) === String(studentId) && (l.subject === subjectCode || (subjectCode === 'vietnamese' && l.subject === 'tv')) && l.group === group);
    groupLogs.sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime()); const log = groupLogs[0]; 
    document.getElementById("rvTitle").innerText = "Lỗi sai: " + group; document.getElementById("rvName").innerText = studentName; document.getElementById("rvContent").innerHTML = (log && log.details) ? log.details : '<p class="text-center text-slate-400">Không có dữ liệu chi tiết.</p>'; document.getElementById("modalReview").classList.remove("hidden"); 
};

// ==========================================
// 7. THƯ BÍ MẬT & ĐƠN XIN PHÉP
// ==========================================
window.moHopThuBiMat = function() {
    if(!currentUser) return showLogin(); closeMenu();
    document.getElementById('content').innerHTML = `
        ${getNavHtml('thubimat')}
        <div class="bg-[#fff0f5] p-6 rounded-[2rem] shadow-sm border-2 border-pink-200 space-y-5 fade-in relative overflow-hidden">
            <p class="text-slate-600 font-bold text-sm relative z-10 leading-relaxed">Thầy Hiển luôn ở đây để lắng nghe con.</p>
            <textarea id="mailContent" class="w-full bg-white border-2 border-pink-200 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-pink-400 transition min-h-[150px] relative z-10" placeholder="Viết điều con muốn nói vào đây..."></textarea>
            <label class="flex items-center gap-3 cursor-pointer relative z-10 bg-white p-3 rounded-xl border border-pink-100"><input type="checkbox" id="mailAnon" class="w-5 h-5 accent-pink-500 cursor-pointer"><span class="font-bold text-slate-600 text-sm">Gửi giấu tên</span></label>
            <button onclick="window.guiThuBiMat()" class="w-full bg-pink-500 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-pink-600 transition relative z-10"><i class="fas fa-paper-plane mr-2"></i> GỬI CHO THẦY HIỂN</button>
        </div>
    `;
};

window.guiThuBiMat = async function() {
    const content = document.getElementById('mailContent').value.trim(); const isAnon = document.getElementById('mailAnon').checked; 
    if(!content) return alert("Con chưa viết gì cả!"); document.getElementById('loader').style.display = 'flex';
    try { await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'gui_thu_bi_mat', data:{ id:currentUser.id, name:currentUser.name, isAnonymous: isAnon, content: content } }) }); alert("Đã gửi thư thành công!"); veTrangChu(); } catch(e) { alert("Lỗi mạng, chưa gửi được thư!"); } finally { document.getElementById('loader').style.display = 'none'; }
};

window.moXinPhep = function() { 
    if(!currentUser) return showLogin(); closeMenu(); 
    document.getElementById('content').innerHTML = `
        ${getNavHtml('hopthu')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5 fade-in">
            <div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Ngày nghỉ</label><input type="date" id="lDate" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700"></div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại xin phép</label><select id="lType" onchange="window.changeLeaveType()" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Nghỉ học và bán trú">Nghỉ học và bán trú</option><option value="Nghỉ Bán trú">Nghỉ Bán trú</option></select></div>
                <div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian nghỉ</label><select id="lSession" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option></select></div>
            </div>
            <div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Lý do (Bệnh, việc gia đình...)</label><textarea id="lReason" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-medium text-slate-700 outline-none focus:border-red-400 transition" rows="3" placeholder="Nhập lý do chi tiết..."></textarea></div>
            <button onclick="window.sendLeave()" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-red-700 transition"><i class="fas fa-paper-plane mr-2"></i> GỬI ĐƠN CHO GVCN</button>
        </div>
    `; document.getElementById('lDate').valueAsDate = new Date(Date.now()+86400000); 
};

window.changeLeaveType = function() { 
    const type = document.getElementById('lType').value; const session = document.getElementById('lSession'); 
    if (type === 'Nghỉ Bán trú') { session.innerHTML = `<option value="Ăn trưa và Không ngủ trưa">Ăn trưa và Không ngủ trưa</option><option value="Không ăn trưa và không ngủ trưa">Không ăn trưa và không ngủ trưa</option>`; } 
    else { session.innerHTML = `<option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option>`; } 
};

window.sendLeave = async function() { 
    const d = document.getElementById('lDate').value; const r = document.getElementById('lReason').value; const type = document.getElementById('lType').value; const session = document.getElementById('lSession').value; 
    if(!d || !r) return alert("Vui lòng chọn Ngày nghỉ và Nhập Lý do!"); const combinedType = `${type} (${session})`; document.getElementById('loader').style.display='flex'; 
    try { await fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'gui_xin_phep', data:{ id:currentUser.id, name:currentUser.name, dateOff:d, type:combinedType, reason:r } }) }); alert("Gửi đơn thành công!"); veTrangChu(); } catch(e) { alert("Lỗi mạng, chưa gửi được đơn!"); } finally { document.getElementById('loader').style.display='none'; } 
};

// ==========================================
// 8. QUẢN LÝ ADMIN (THƯ & ĐƠN)
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

// ==========================================
// 9. QUẢN LÝ HỌC SINH & TRANG CÁ NHÂN
// ==========================================
window.calculateTitle = function(student) {
    if (!window.Data || !Data.math || !Data.tv || !Data.log) return "";

    const mathGroupsAll = [...new Set(Data.math.map(x => x.group))].filter(g => g);
    const tvGroupsAll = [...new Set(Data.tv.map(x => x.group))].filter(g => g);
    const totalAssignments = mathGroupsAll.length + tvGroupsAll.length;

    const userLogs = Data.log.filter(l => String(l.id) === String(student.id));
    const doneMath = new Set(userLogs.filter(l => l.subject === 'math' && mathGroupsAll.includes(l.group)).map(l => l.group)).size;
    const doneTv = new Set(userLogs.filter(l => (l.subject === 'vietnamese' || l.subject === 'tv') && tvGroupsAll.includes(l.group)).map(l => l.group)).size;
    const isOngVang = (totalAssignments > 0 && (doneMath + doneTv) >= totalAssignments);

    let titlesHtml = "";

    let ongVangBadge = isOngVang ? `<div class="text-[10px] font-black text-yellow-800 bg-yellow-100 px-2 py-0.5 rounded border border-yellow-400 inline-flex items-center shadow-sm">Ong Vàng Chăm Chỉ</div>` : "";
    if (ongVangBadge) titlesHtml += ongVangBadge;

    let scoreVal = Number(student.score) || 0;
    let titleBadge = "";

    if (scoreVal >= 5000) titleBadge = `<div class="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-flex items-center shadow-sm"><i class="fas fa-star mr-1"></i>Ngôi Sao Tri Thức</div>`;
    else if (scoreVal >= 4000) titleBadge = `<div class="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center shadow-sm"><i class="fas fa-award mr-1"></i>Học Sinh Ưu Tú</div>`;
    else if (scoreVal >= 3000) titleBadge = `<div class="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center shadow-sm"><i class="fas fa-medal mr-1"></i>Học Giả Nhí</div>`;

    if (titleBadge) titlesHtml += (titlesHtml ? " " : "") + titleBadge;
    return titlesHtml;
};

window.chuyenTrangQuanLy = function() { 
    closeMenu(); 
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600">QUẢN LÝ HS</h2></div><div class="space-y-3">`; 
    html += Data.hs.map(h => `<div onclick="window.viewProfile('${h.id}')" class="bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"><span class="font-bold text-slate-700">${h.name}</span><span class="text-xs text-gray-500">SĐT: ${h.fatherPhone || h.motherPhone || 'Chưa có'}</span></div>`).join(''); 
    document.getElementById('content').innerHTML = html + "</div>"; 
};

window.viewProfile = function(id) { 
    closeMenu(); const s = Data.hs.find(x => String(x.id) === String(id)); if(!s) return; 
    const avatar = s.gender === 'Nữ' ? '<div class="w-24 h-24 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-graduate"></i></div>' : '<div class="w-24 h-24 bg-blue-100 text-blue-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-astronaut"></i></div>'; 
    let cleanDob = s.dob || 'Chưa cập nhật'; if(cleanDob.includes('T') && cleanDob.includes('.000Z')) { const dt = new Date(cleanDob); cleanDob = ("0" + dt.getDate()).slice(-2) + "/" + ("0" + (dt.getMonth() + 1)).slice(-2) + "/" + dt.getFullYear(); } 
    const renderPhone = (phone, label) => { 
        if(!phone || phone.trim() === '') return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><span class="text-slate-400 italic text-xs">Chưa cập nhật</span></div>`; 
        const cleanPhone = phone.toString().replace(/\D/g, ''); 
        return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><div class="flex items-center gap-2"><span class="font-bold text-slate-700 text-sm">${phone}</span><a href="tel:${cleanPhone}" class="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs hover:bg-green-600 hover:text-white transition"><i class="fas fa-phone"></i></a></div></div>`; 
    }; 
    
    const studentTitles = window.calculateTitle(s);

    document.getElementById('content').innerHTML = `
        <div class="flex items-center mb-6"><button onclick="${currentUser && currentUser.role==='admin'?'window.chuyenTrangQuanLy()':'veTrangChu()'}" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600 uppercase">HỒ SƠ CÁ NHÂN</h2></div>
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-blue-50 fade-in relative overflow-hidden">
            <div class="text-center mb-6 relative z-10">${avatar}<h2 class="text-2xl font-black text-slate-800">${s.name}</h2><span class="bg-blue-50 text-blue-600 font-mono font-bold px-3 py-1 rounded-full text-xs mt-2 inline-block">ID: ${s.id}</span></div>
            <div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-6 flex items-center justify-between relative overflow-hidden"><div class="absolute -right-4 -bottom-4 text-white opacity-20 text-6xl"><i class="fas fa-gem"></i></div><div><p class="text-xs font-bold opacity-90 uppercase">Điểm tích lũy</p><p class="text-3xl font-black">${s.score || 0}</p></div><div class="text-right flex flex-col items-end gap-1 mt-1">${studentTitles}</div></div>
            <div class="space-y-1"><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Ngày sinh</span><b class="text-slate-700">${cleanDob}</b></div><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Giới tính</span><b class="text-slate-700">${s.gender || '-'}</b></div>${renderPhone(s.fatherPhone, "SĐT Cha")}${renderPhone(s.motherPhone, "SĐT Mẹ")}<div class="py-2"><span class="text-slate-400 font-bold uppercase text-[10px] block mb-1">Địa chỉ</span><b class="text-slate-700 text-sm leading-snug">${s.address || 'Chưa cập nhật'}</b></div></div>
        </div>
    `; 
};

// ==========================================
// 10. CÔNG CỤ CHUNG & ĐỒNG BỘ
// ==========================================
window.checkSinhNhat = function() {
    if (!currentUser || currentUser.role !== 'student' || !currentUser.dob) return;
    if (sessionStorage.getItem('hpbdShown_' + currentUser.id)) return;
    let dobStr = currentUser.dob; let bDay = 0, bMonth = 0;
    try { 
        if (dobStr.includes('T')) { let dt = new Date(dobStr); bDay = dt.getDate(); bMonth = dt.getMonth() + 1; } 
        else if (dobStr.includes('/')) { let parts = dobStr.split('/'); bDay = parseInt(parts[0]); bMonth = parseInt(parts[1]); } 
        else if (dobStr.includes('-')) { let parts = dobStr.split('-'); bDay = parseInt(parts[2]); bMonth = parseInt(parts[1]); } 
    } catch(e) { return; } 
    
    let today = new Date();
    if (bDay === today.getDate() && bMonth === (today.getMonth() + 1)) { 
        let currentYear = today.getFullYear(); let bonusKey = 'hpbd_bonus_' + currentYear + '_' + currentUser.id;
        if (!localStorage.getItem(bonusKey)) {
            let todayStr = today.toLocaleDateString('vi-VN'); let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
            if (spinLog.date !== todayStr) spinLog = { date: todayStr, extra: 0, usedFree: false };
            spinLog.extra += 5; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); localStorage.setItem(bonusKey, 'true'); 
            try { fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: "Sinh nhật " + currentYear, score_earned: 0, details: "Hệ thống tự động tặng 5 lượt quay nhân dịp sinh nhật!" } }) }); } catch(e) {}
        }
        window.showHappyBirthdayUI(); sessionStorage.setItem('hpbdShown_' + currentUser.id, 'true'); 
    }
};

window.showHappyBirthdayUI = function() {
    let overlay = document.createElement('div'); overlay.id = "hpbdModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `
        <div class="bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 p-1 rounded-[2.5rem] shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-[cascadeDrop_0.8s_ease-out_forwards]">
            <div class="bg-white rounded-[2.4rem] p-8 text-center relative overflow-hidden">
                <button onclick="document.getElementById('hpbdModal').remove()" class="absolute top-3 right-4 text-slate-300 hover:text-red-500 transition font-bold text-3xl">&times;</button>
                <div class="text-7xl mb-2 mt-2 animate-bounce">🎂</div><h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wide mb-2">CHÚC MỪNG SINH NHẬT</h2><h3 class="text-3xl font-black text-slate-800 mb-4">${currentUser.name}</h3>
                <div class="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-4 relative"><i class="fas fa-quote-left text-orange-200 text-3xl absolute -top-2 -left-2"></i><p class="text-slate-700 font-bold text-sm leading-relaxed relative z-10">Thầy Hiển và tập thể lớp Bốn 6 chúc con thêm tuổi mới luôn vui vẻ, mạnh khỏe, chăm ngoan và đạt được thật nhiều bông hoa điểm 10 nhé! 💖</p></div>
                <div class="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300 p-3 rounded-2xl mb-6 shadow-inner animate-pulse"><p class="text-orange-600 font-black text-sm"><i class="fas fa-gift text-xl mr-1 text-red-500"></i> LÌ XÌ TỪ THẦY HIỂN</p><p class="text-slate-700 font-bold text-xs mt-1">Hệ thống đã tự động cộng <span class="text-red-600 text-base font-black">5 LƯỢT QUAY</span> vào Vòng Quay May Mắn của con!</p></div>
                <button onclick="document.getElementById('hpbdModal').remove()" class="bg-gradient-to-r from-pink-500 to-orange-500 text-white w-full py-4 rounded-2xl font-black shadow-lg btn-3d text-lg hover:scale-[1.02] transition">CẢM ƠN THẦY Ạ!</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay); window.safeConfetti();
};

window.dongBoDuLieu = async function() { 
    if(!confirm("Hành động này sẽ tải lại toàn bộ dữ liệu mới nhất từ Google Sheets. Tiếp tục?")) return; 
    document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG ĐỒNG BỘ MÁY CHỦ..."; 
    try { 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'clear_cache', data: {} }) }); 
        window.isAllDataLoaded = false; 
        alert("Đồng bộ thành công! Hệ thống sẽ tự tải lại."); 
        location.reload(); 
    } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng khi đồng bộ!"); } 
};

// ==========================================
// 11. CHUÔNG BÁO ADMIN
// ==========================================
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
    let oldBell = document.getElementById('adminNotificationBell'); if (oldBell) oldBell.remove();
    let totalUnread = unreadMail + unreadLeave; if (totalUnread <= 0) return; 
    let bellHtml = `
        <div id="adminNotificationBell" class="fixed bottom-8 right-6 z-[80] flex flex-col items-end fade-in">
            <div id="adminNotiPopup" class="hidden bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 mb-3 w-64 origin-bottom-right transition-all">
                <h4 class="font-black text-slate-700 mb-3 border-b pb-2"><i class="fas fa-bell text-yellow-500 mr-2 animate-pulse"></i>Thông báo mới</h4>
                ${unreadMail > 0 ? `<div onclick="window.moQuanLyThu(); document.getElementById('adminNotiPopup').classList.add('hidden');" class="flex justify-between items-center p-2 bg-pink-50 rounded-xl mb-2 cursor-pointer hover:bg-pink-100 transition"><span class="font-bold text-pink-700 text-sm"><i class="fas fa-envelope mr-2"></i>Thư bí mật</span><span class="bg-pink-500 text-white text-xs font-black px-2 py-1 rounded-full">${unreadMail}</span></div>` : ''}
                ${unreadLeave > 0 ? `<div onclick="window.moDonTu(); document.getElementById('adminNotiPopup').classList.add('hidden');" class="flex justify-between items-center p-2 bg-red-50 rounded-xl cursor-pointer hover:bg-red-100 transition"><span class="font-bold text-red-700 text-sm"><i class="fas fa-file-signature mr-2"></i>Đơn xin phép</span><span class="bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full">${unreadLeave}</span></div>` : ''}
            </div>
            <button onclick="document.getElementById('adminNotiPopup').classList.toggle('hidden')" class="relative w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-[0_8px_30px_rgb(245,158,11/0.5)] hover:scale-110 transition flex items-center justify-center text-white text-2xl btn-3d animate-bounce border-2 border-white"><i class="fas fa-bell"></i><span class="absolute -top-2 -right-2 bg-red-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">${totalUnread}</span></button>
        </div>
    `; document.body.insertAdjacentHTML('beforeend', bellHtml);
};

setInterval(() => {
    if (window.currentUser && window.currentUser.role === 'admin') { 
        if (!window.hasCheckedAdminNoti) { window.hasCheckedAdminNoti = true; window.kiemTraThongBaoAdmin(); } 
    } else { window.hasCheckedAdminNoti = false; let bell = document.getElementById('adminNotificationBell'); if (bell) bell.remove(); }
}, 2000);

// ==========================================
// 12. TỰ ĐỘNG DỪNG NHẠC KHI MỞ BÀI KHÁC
// ==========================================
document.addEventListener('play', function(e) {
    var audios = document.getElementsByTagName('audio'); for (var i = 0; i < audios.length; i++) { if (audios[i] != e.target) audios[i].pause(); }
    var videos = document.getElementsByTagName('video'); for (var i = 0; i < videos.length; i++) { if (videos[i] != e.target) videos[i].pause(); }
}, true);
