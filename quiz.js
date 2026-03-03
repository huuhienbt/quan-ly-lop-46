async function moGocHocTap(fromRouter = false) { 
    closeMenu(); 
    if(!fromRouter) window.history.pushState({}, "", "/hoc-tap");
    
    // TÍNH TOÁN BÀI TẬP CHƯA LÀM
    let mathUnread = 0, tvUnread = 0;
    if (currentUser && currentUser.role === 'student') {
        const myLogs = Data.log.filter(l => String(l.id) === String(currentUser.id));
        mathUnread = [...new Set(Data.math.map(x => x.group))].filter(g => !myLogs.some(l => l.subject === 'math' && l.group === g)).length;
        tvUnread = [...new Set(Data.tv.map(x => x.group))].filter(g => !myLogs.some(l => l.subject === 'vietnamese' && l.group === g)).length;
    }

    let mathBadge = mathUnread > 0 ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">${mathUnread} BÀI MỚI</div>` : '';
    let tvBadge = tvUnread > 0 ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">${tvUnread} BÀI MỚI</div>` : '';

    let html = `${getNavHtml('hoctap')}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 relative">
        <button onclick="loadSubject('math')" class="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">${mathBadge} <i class="fas fa-calculator"></i> TOÁN</button>
        <button onclick="loadSubject('vietnamese')" class="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">${tvBadge} <i class="fas fa-book-open"></i> TIẾNG VIỆT</button>
    </div>`;

    // --- BẢNG VÀNG XẾP HẠNG THEO THỜI GIAN ---
    // 1. Lọc học sinh > 1500 điểm
    // 2. Tìm thời gian đạt điểm cuối cùng (achievedTime)
    let studentsWithTime = Data.hs.map(s => {
        let score = Number(s.score) || 0;
        let logs = Data.log.filter(l => String(l.id) === String(s.id) && Number(l.score) !== 0);
        let time = 0;
        if(logs.length) {
            logs.sort((a,b) => new Date(a.time) - new Date(b.time));
            time = new Date(logs[logs.length-1].time).getTime();
        }
        return { ...s, score: score, achievedTime: time };
    }).filter(s => s.score > 1500);

    // 3. Sắp xếp: Điểm cao trên -> Thời gian nhỏ (sớm) trên
    studentsWithTime.sort((a,b) => (b.score - a.score) || (a.achievedTime - b.achievedTime));
    
    // 4. Lấy Top 15 và hiển thị
    let top15 = studentsWithTime.slice(0, 15);
    let uniqueScores = [...new Set(top15.map(s => s.score))]; // Để tính đồng hạng

    let listHtml = top15.map(s => {
        let rank = uniqueScores.indexOf(s.score) + 1; // Hạng dựa trên điểm
        let color = rank === 1 ? 'text-yellow-500' : (rank === 2 ? 'text-slate-400' : (rank === 3 ? 'text-orange-500' : 'text-slate-600'));
        let icon = rank <= 3 ? '<i class="fas fa-medal text-2xl"></i>' : `<span class="font-bold text-lg">${rank}</span>`;
        return `<div class="flex items-center justify-between p-3 mb-2 rounded-xl border bg-white"><div class="flex items-center gap-3"><div class="w-8 text-center ${color}">${icon}</div><div class="font-bold text-slate-700">${s.name}</div></div><div class="font-black text-indigo-600">${s.score}đ</div></div>`;
    }).join('');

    document.getElementById('content').innerHTML = html + `<div class="mt-8 bg-white p-5 rounded-[2rem] shadow-md border-t-4 border-yellow-400 fade-in"><h3 class="text-center font-black text-xl text-yellow-600 mb-4"><i class="fas fa-crown"></i> BẢNG VÀNG LỚP 4/6</h3>${listHtml || '<p class="text-center text-slate-400">Chưa có ai lên bảng vàng.</p>'}</div>`;
}

// --- HÀM LÀM BÀI TẬP ---
async function loadSubject(sub) {
    if(!currentUser) return showLogin(); curSub = sub;
    const qs = Data[sub];
    if (!qs) return alert("Lỗi dữ liệu môn học! Hãy bấm Đồng bộ.");
    
    const grps = [...new Set(qs.map(x => x.group))].sort();
    let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub}</h2></div><div class="space-y-3">`;
    
    html += grps.map(g => {
        const isDone = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g);
        const qList = qs.filter(q => q.group === g);
        let click = isDone && currentUser.role==='student' ? `alert('Đã làm rồi!')` : `startQuiz('${g}')`;
        let badge = isDone ? '<span class="bg-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded">ĐÃ LÀM</span>' : '<span class="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded animate-pulse">MỚI</span>';
        return `<div onclick="${click}" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition border-indigo-50"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-indigo-100 text-indigo-600"><i class="fas fa-star"></i></div><div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1">${qList[0].time} phút • ${qList.length} câu</p></div></div>${badge}</div>`;
    }).join('');
    
    document.getElementById('content').innerHTML = html + "</div>";
}

function startQuiz(group) {
    curGrp = group; quiz = Data[curSub].filter(q => q.group === group);
    score = 0; currentQIndex = 0; wrongAnswersLog = [];
    document.getElementById('content').innerHTML = `<div id="quizBox" class="bg-white p-5 rounded-3xl shadow-xl min-h-[400px]"></div>`;
    renderQuestion(0);
}

function renderQuestion(index) {
    if (index >= quiz.length) return finishQuiz();
    const q = quiz[index];
    document.getElementById("quizBox").innerHTML = `
        <div class="mb-6"><div class="text-sm font-bold text-indigo-500 mb-2">Câu ${index+1}/${quiz.length}</div><div class="text-xl font-bold text-slate-800">${q.question}</div></div>
        <div class="space-y-3">${['a','b','c','d'].map(k => `<div onclick="checkAns(this, '${k}', '${q.correct}', ${index})" class="p-4 border-2 rounded-2xl cursor-pointer hover:border-indigo-300 font-bold text-slate-700">${k.toUpperCase()}. ${q[k]}</div>`).join('')}</div>
    `;
}

function checkAns(el, ans, corr, idx) {
    if (ans === corr) { el.classList.add('bg-green-100', 'border-green-500'); score += 10; } 
    else { el.classList.add('bg-red-100', 'border-red-500'); wrongAnswersLog.push(`Câu ${idx+1}: Chọn ${ans.toUpperCase()} (Đúng: ${corr.toUpperCase()})`); }
    setTimeout(() => renderQuestion(idx+1), 1000);
}

async function finishQuiz() {
    document.getElementById('content').innerHTML = `<div class="text-center py-10"><h3 class="text-2xl font-black mb-2">KẾT QUẢ</h3><p class="text-6xl font-black text-indigo-600 mb-8">${score}</p><button onclick="moGocHocTap()" class="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold">Quay lại</button></div>`;
    if(currentUser.role === 'student') {
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score, details: wrongAnswersLog.join('; ') } }) });
        Data.log.push({ id: currentUser.id, subject: curSub, group: curGrp, score: score, time: new Date().toISOString() });
    }
}

// --- QUẢN LÝ TIẾN ĐỘ & KHO BÀI TẬP (ADMIN) ---
async function moTienDo() { 
    closeMenu(); 
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600">TIẾN ĐỘ</h2></div>`; 
    html += Data.hs.map(h => {
        let done = Data.log.filter(l => String(l.id) === String(h.id)).length;
        return `<div class="bg-white p-4 rounded-xl border mb-2 flex justify-between"><span class="font-bold">${h.name}</span><span class="font-bold text-purple-600">${done} bài</span></div>`;
    }).join('');
    document.getElementById('content').innerHTML = html;
}

function quanLyNganHang(sub) {
    closeMenu(); curSub = sub;
    const qs = Data[sub];
    let html = `<div class="flex items-center justify-between mb-4"><div class="flex items-center"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900">KHO ${sub}</h2></div><button onclick="alert('Chức năng thêm câu hỏi')" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-sm">Thêm câu</button></div>`;
    html += qs.map(q => `<div class="bg-white p-4 rounded-xl border mb-2"><p class="font-bold">${q.group}</p><p>${q.question}</p></div>`).join('');
    document.getElementById('content').innerHTML = html;
}

function chuyenTrangQuanLy() {
    closeMenu();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600">HỌC SINH</h2></div>`;
    html += Data.hs.map(h => `<div class="bg-white p-4 rounded-xl border mb-2"><p class="font-bold">${h.name}</p><p class="text-xs text-gray-500">ID: ${h.id}</p></div>`).join('');
    document.getElementById('content').innerHTML = html;
}
