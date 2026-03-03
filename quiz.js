// ==========================================
// FILE 3: QUIZ.JS (HỌC TẬP, BẢNG VÀNG & QUẢN LÝ KHO BÀI TẬP)
// ==========================================

// --- GÓC HỌC TẬP & BẢNG VÀNG CHUẨN THỜI GIAN ---
async function moGocHocTap(fromRouter = false) { 
    closeMenu(); 
    if(!fromRouter) window.history.pushState({}, "", "/hoc-tap");
    
    // Tải dữ liệu ngầm nếu chưa tải
    if (currentUser && currentUser.role === 'student' && !window.isQuizDataLoaded) {
        contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang kiểm tra bài tập...</p></div>`;
        try {
            const [mRes, tRes, lRes] = await Promise.all([
                fetch(API_URL + "?type=math&t=" + Date.now()),
                fetch(API_URL + "?type=vietnamese&t=" + Date.now()),
                fetch(API_URL + "?type=history_all&t=" + Date.now())
            ]);
            Data.math = await mRes.json(); 
            Data.tv = await tRes.json(); 
            Data.vietnamese = Data.tv; 
            Data.log = await lRes.json();
            window.isQuizDataLoaded = true;
        } catch(e) { console.log(e); }
    }

    // Đếm số bài chưa làm để hiện Badge
    let mathUnread = 0; let tvUnread = 0;
    if (currentUser && currentUser.role === 'student') {
        const myLogs = Data.log.filter(l => String(l.id) === String(currentUser.id));
        const mathGroups = [...new Set(Data.math.map(x => x.group))];
        mathUnread = mathGroups.filter(g => !myLogs.some(l => l.subject === 'math' && l.group === g)).length;
        const tvGroups = [...new Set(Data.tv.map(x => x.group))];
        tvUnread = tvGroups.filter(g => !myLogs.some(l => l.subject === 'vietnamese' && l.group === g)).length;
    }

    let mathBadge = mathUnread > 0 ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">${mathUnread} BÀI MỚI</div>` : '';
    let tvBadge = tvUnread > 0 ? `<div class="absolute -top-3 -right-3 bg-red-500 text-white text-[11px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">${tvUnread} BÀI MỚI</div>` : '';

    let htmlTop = `
        ${getNavHtml('hoctap')}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 relative">
            <button onclick="loadSubject('math')" class="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${mathBadge} <i class="fas fa-calculator text-4xl mb-2 block opacity-90"></i>TOÁN
            </button>
            <button onclick="loadSubject('vietnamese')" class="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${tvBadge} <i class="fas fa-book-open text-4xl mb-2 block opacity-90"></i>TIẾNG VIỆT
            </button>
        </div>
    `; 
    
    // TÌM THỜI GIAN ĐẠT ĐIỂM (Loại bỏ Vòng quay may mắn 0 điểm)
    let studentsWithTime = Data.hs.map(s => {
        let scoreVal = Number(s.score) || 0;
        let userLogs = Data.log.filter(l => String(l.id) === String(s.id) && Number(l.score) !== 0);
        let achievedTime = 0;
        if (userLogs.length > 0) {
            userLogs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            let lastLog = userLogs[userLogs.length - 1];
            achievedTime = new Date(lastLog.time).getTime();
        }
        return { ...s, score: scoreVal, achievedTime: achievedTime };
    });

    let eligibleStudents = studentsWithTime.filter(s => s.score > 1500); 
    
    // THUẬT TOÁN XẾP HẠNG: Điểm cao xếp trên -> Bằng điểm thì ai Đạt Sớm Hơn (achievedTime NHỎ HƠN) xếp trên
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
            let actualDisplayRank = uniqueScores.indexOf(s.score) + 1; // Gom nhóm điểm để trao huy chương đồng hạng
            let rankIcon = `<span class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-black text-sm">${actualDisplayRank}</span>`; 
            let rowBg = "bg-slate-50 border-slate-100"; let nameColor = "text-slate-700"; 
            
            if (actualDisplayRank === 1) { rankIcon = `<i class="fas fa-medal text-3xl text-yellow-500 drop-shadow-md"></i>`; rowBg = "bg-yellow-50 border-yellow-200 scale-[1.02] shadow-sm z-10"; nameColor = "text-yellow-700"; } 
            else if (actualDisplayRank === 2) { rankIcon = `<i class="fas fa-medal text-3xl text-slate-400 drop-shadow-md"></i>`; rowBg = "bg-gray-50 border-gray-200"; } 
            else if (actualDisplayRank === 3) { rankIcon = `<i class="fas fa-medal text-3xl text-orange-400 drop-shadow-md"></i>`; rowBg = "bg-orange-50 border-orange-100"; } 
            
            return `<div class="flex items-center justify-between p-3 mb-2 rounded-xl border ${rowBg} transition relative"><div class="flex items-center gap-3"><div class="w-10 text-center flex justify-center">${rankIcon}</div><div class="font-bold ${nameColor} text-sm sm:text-base">${s.name}</div></div><div class="font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm text-sm">${s.score} <span class="text-[10px] text-indigo-500 font-bold ml-1 uppercase">điểm</span></div></div>`; 
        }).join(''); 
        
        let personalMsg = ""; 
        if (currentUser && currentUser.role === 'student') { 
            let myScore = Number(currentUser.score) || 0; 
            let myRank = uniqueScores.indexOf(myScore) + 1;
            if (myRank === 0) myRank = uniqueScores.length + 1; 
            if (myScore > 1500) { 
                if (myRank <= 15) { personalMsg = `<div class="mt-4 p-3 bg-green-100 border border-green-200 rounded-xl text-center"><p class="text-green-700 font-bold text-sm"><i class="fas fa-star text-yellow-500 mr-1 animate-pulse"></i> Tuyệt vời! Con đang ở Top ${myRank} Bảng Vàng!</p></div>`; } 
                else { personalMsg = `<div class="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-center"><p class="text-blue-700 font-bold text-sm"><i class="fas fa-rocket mr-1 text-blue-500"></i> Con đã vượt mốc với ${myScore} điểm (Hạng ${myRank}).<br>Cố lên nhé, Bảng Vàng ngay trước mắt rồi!</p></div>`; } 
            } else { personalMsg = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Vạch xuất phát là 1500 điểm.<br>Hãy làm bài tập để vượt mốc này và ghi danh nhé!</p></div>`; } 
        } 
        leaderboardHtml = `<div class="mt-10 bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-yellow-400 fade-in"><div class="text-center mb-5"><h3 class="font-black text-xl sm:text-2xl text-yellow-600 uppercase tracking-wide"><i class="fas fa-crown text-yellow-500 mr-2 mb-1 animate-bounce inline-block"></i>BẢNG VÀNG LỚP 4/6</h3></div><div class="flex flex-col">${listHtml}</div>${personalMsg}</div>`; 
    } else { 
        let personalMsgEmpty = ""; 
        if (currentUser && currentUser.role === 'student') { personalMsgEmpty = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Hãy làm bài tập để trở thành người đầu tiên vượt mốc 1500 điểm nhé!</p></div>`; } 
        leaderboardHtml = `<div class="mt-10 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in opacity-80"><i class="fas fa-trophy text-5xl text-slate-200 mb-3 block"></i><p class="font-black text-slate-500 text-lg uppercase">Bảng Vàng đang trống</p><p class="text-sm font-bold text-slate-400 mt-1">Chưa có chiến binh nào vượt mốc 1500 điểm.</p>${personalMsgEmpty}</div>`; 
    } 
    contentArea.innerHTML = htmlTop + leaderboardHtml; 
}

// --- QUẢN LÝ KHO BÀI TẬP ADMIN ---
async function quanLyNganHang(sub, forceReload = false) { 
    closeMenu(); curSub = sub; 
    if (!forceReload && Data[sub] && Data[sub].length > 0) { renderGiaoDienKho(sub); return; } 
    contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải dữ liệu...</p></div>`; 
    try { const qs = await (await fetch(API_URL+"?type="+sub+"&t="+Date.now())).json(); Data[sub] = qs; if(sub === 'vietnamese') Data.tv = qs; if(sub === 'tv') Data.vietnamese = qs; renderGiaoDienKho(sub); } catch(e) { console.log("Lỗi tải kho:", e); } 
}

function renderGiaoDienKho(sub) { 
    const qs = Data[sub]; const groups = [...new Set(qs.map(q => q.group))].sort(); let filterOptions = `<option value="all">-- Tất cả các Tuần --</option>` + groups.map(g => `<option value="${g}">${g}</option>`).join(''); 
    contentArea.innerHTML = `<div class="flex items-center justify-between mb-4"><div class="flex items-center"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">KHO ${sub === 'math' ? 'TOÁN' : 'T.VIỆT'}</h2></div><button onclick="renderFormCauHoi(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold btn-3d text-sm"><i class="fas fa-plus mr-1"></i> Tạo câu mới</button></div><select id="qFilter" onchange="filterQuestions()" class="w-full p-3 rounded-xl border-2 border-slate-200 mb-6 font-bold text-slate-700 outline-none focus:border-indigo-500">${filterOptions}</select><div id="listQuestions" class="space-y-4"></div>`; 
    filterQuestions(); 
}

function filterQuestions() { 
    const val = document.getElementById("qFilter").value; let list = val === 'all' ? Data[curSub] : Data[curSub].filter(q => q.group === val); 
    if (list.length === 0) { document.getElementById("listQuestions").innerHTML = '<p class="text-center text-slate-400 py-10">Trống</p>'; return; } 
    let grouped = {}; list.forEach(q => { if (!grouped[q.group]) grouped[q.group] = []; grouped[q.group].push(q); }); 
    let sortedGroups = Object.keys(grouped).sort((a, b) => { let numA = parseInt(a.replace(/\D/g, '')) || 0; let numB = parseInt(b.replace(/\D/g, '')) || 0; if(numA !== numB) return numA - numB; return a.localeCompare(b); }); 
    let html = ""; 
    sortedGroups.forEach(grp => { 
        let questions = grouped[grp]; 
        html += `<div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-6 fade-in"><div class="flex items-center justify-between border-b-2 border-indigo-50 pb-3 mb-4"><div class="flex items-center gap-2"><i class="fas fa-layer-group text-indigo-500 text-xl"></i><h3 class="font-black text-lg text-slate-800 uppercase">${grp}</h3></div><span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">${questions.length} câu</span></div><div class="space-y-3">`; 
        questions.forEach((q, index) => { html += `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition relative"><div class="flex justify-between items-start"><div class="flex gap-3 w-full pr-16"><span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">${index + 1}</span><div class="font-medium text-slate-700 text-base mt-1 overflow-hidden break-words w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mt-2">${parseImg(q.question)}</div></div><div class="flex gap-2 absolute top-4 right-4"><button onclick="renderFormCauHoi('${q.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm" title="Sửa"><i class="fas fa-edit"></i></button><button onclick="xoaCauHoi('${q.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm" title="Xóa"><i class="fas fa-trash"></i></button></div></div></div>`; }); 
        html += `</div></div>`; 
    }); 
    document.getElementById("listQuestions").innerHTML = html; 
}

function renderFormCauHoi(id) { 
    const q = id ? Data[curSub].find(x => x.id === id) : { group: '', time: 10, question: '', a: '', b: '', c: '', d: '', correct: 'a' }; const groups = [...new Set(Data[curSub].map(x => x.group))]; const dl = `<datalist id="groupList">${groups.map(g => `<option value="${g}">`).join('')}</datalist>`; 
    contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="quanLyNganHang('${curSub}')" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">${id ? 'SỬA CÂU HỎI' : 'TẠO CÂU HỎI MỚI'}</h2></div><div class="bg-white p-5 rounded-3xl shadow border space-y-4 fade-in">${dl}<div class="grid grid-cols-3 gap-3"><div class="col-span-2"><label class="text-xs font-bold text-slate-500 uppercase">Tên Bài Tập (Ví dụ: Tuần 21)</label><input type="text" id="frmG" list="groupList" value="${q.group}" class="edit-input w-full mt-1" placeholder="Ví dụ: Tuần 21"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Phút</label><input type="number" id="frmT" value="${q.time}" class="edit-input w-full mt-1 text-center"></div></div><div><label class="text-xs font-bold text-slate-500 uppercase">Nội dung câu hỏi</label><textarea id="frmQ" rows="3" class="edit-input w-full mt-1">${q.question}</textarea></div><div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án A</label><input type="text" id="frmA" value="${q.a}" class="edit-input w-full mt-1"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án B</label><input type="text" id="frmB" value="${q.b}" class="edit-input w-full mt-1"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án C</label><input type="text" id="frmC" value="${q.c}" class="edit-input w-full mt-1"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án D</label><input type="text" id="frmD" value="${q.d}" class="edit-input w-full mt-1"></div></div><div><label class="text-xs font-bold text-slate-500 uppercase">Chọn Đáp Án Đúng</label><select id="frmCorr" class="edit-input w-full mt-1 bg-yellow-50 text-yellow-800 border-yellow-200"><option value="a" ${q.correct=='a'?'selected':''}>Đáp án A</option><option value="b" ${q.correct=='b'?'selected':''}>Đáp án B</option><option value="c" ${q.correct=='c'?'selected':''}>Đáp án C</option><option value="d" ${q.correct=='d'?'selected':''}>Đáp án D</option></select></div><button onclick="luuCauHoi('${id || ''}')" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black btn-3d shadow-lg mt-4">LƯU CÂU HỎI LÊN HỆ THỐNG</button></div>`; 
}

async function luuCauHoi(id) { const data = { id: id, subject: curSub, group: document.getElementById("frmG").value, time: document.getElementById("frmT").value, question: document.getElementById("frmQ").value, a: document.getElementById("frmA").value, b: document.getElementById("frmB").value, c: document.getElementById("frmC").value, d: document.getElementById("frmD").value, correct: document.getElementById("frmCorr").value, image: "" }; if(!data.group || !data.question) return alert("Vui lòng điền đủ Tên bài và Câu hỏi!"); document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: id ? 'sua_cau_hoi' : 'them_cau_hoi', data: data }) }); window.isQuizDataLoaded = false; alert("Lưu thành công!"); document.getElementById('loader').style.display = 'none'; quanLyNganHang(curSub, true); }
async function xoaCauHoi(id) { if(confirm("Thầy có chắc chắn muốn xóa câu hỏi này không?")) { document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: 'xoa_cau_hoi', data: { id: id, subject: curSub } }) }); window.isQuizDataLoaded = false; alert("Đã xóa!"); document.getElementById('loader').style.display = 'none'; quanLyNganHang(curSub, true); } }

// --- CHỨC NĂNG LÀM BÀI TẬP (HỌC SINH) ---
async function loadSubject(sub) { 
    if(!currentUser) return showLogin(); curSub = sub; 
    if (!window.isQuizDataLoaded) {
        contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải bài tập...</p></div>`; 
        try { const [mRes, tRes, lRes] = await Promise.all([ fetch(API_URL + "?type=math&t=" + Date.now()), fetch(API_URL + "?type=vietnamese&t=" + Date.now()), fetch(API_URL + "?type=history_all&t=" + Date.now()) ]); Data.math = await mRes.json(); Data.tv = await tRes.json(); Data.vietnamese = Data.tv; Data.log = await lRes.json(); window.isQuizDataLoaded = true; } catch(e) {}
    }
    const qs = Data[sub]; if (!qs) { alert("Không tải được dữ liệu môn này. Vui lòng bấm Đồng Bộ."); return veTrangChu(); }
    const grps = [...new Set(qs.map(x => x.group))].sort(); 
    let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2></div><div class="space-y-3">`; 
    if(grps.length === 0) { html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`; } 
    else {
        grps.forEach(g => { 
            const isDone = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g); 
            const time = qs.find(q => q.group === g).time || 10; const count = qs.filter(q => q.group === g).length; 
            let clickAction = `startQuiz('${g}', ${time})`; if (isDone && currentUser.role === 'student') { clickAction = `alert('Con đã hoàn thành bài tập này và điểm đã được ghi nhận rồi! Hãy làm bài khác để leo Bảng Vàng nhé!')`; } 
            let badgeHtml = !isDone ? `<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>` : `<span class="bg-slate-200 text-slate-500 text-[10px] font-black px-2 py-1 rounded"><i class="fas fa-lock text-xs mr-1"></i>ĐÃ LÀM</span>`; 
            html += `<div onclick="${clickAction}" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${isDone ? 'border-green-100 bg-green-50/40 opacity-80' : 'border-indigo-50'}"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}"><i class="fas ${isDone ? 'fa-check-circle' : 'fa-star'}"></i></div><div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p></div></div>${badgeHtml}</div>`; 
        }); 
    } contentArea.innerHTML = html + `</div>`; 
}

function startQuiz(group, timeMins) { curGrp = group; quiz = Data[curSub].filter(q => q.group === group).sort(() => Math.random() - 0.5).slice(0, 10); currentQIndex = 0; score = 0; wrongAnswersLog = []; renderQuizFrame(); renderQuestion(0); startTimer(timeMins * 60); }
function renderQuizFrame() { contentArea.innerHTML = `<div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4"><div class="flex items-center gap-3"><button onclick="loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-indigo-900 truncate max-w-[150px]">${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div><div id="quizBox" class="bg-white p-5 rounded-3xl shadow-xl border-4 border-white min-h-[400px]"></div>`; }
function renderQuestion(index) { 
    if (index >= quiz.length) { finishQuiz(); return; } const q = quiz[index]; 
    document.getElementById("quizBox").innerHTML = `<div class="mb-6 fade-in"><div class="text-sm font-bold text-indigo-500 mb-2">Câu ${index + 1} / ${quiz.length}</div><div class="text-xl font-bold text-slate-800">${parseImg(q.question)}</div></div><div class="space-y-3 fade-in">${['a','b','c','d'].map(key => `<div onclick="checkAns(this, '${key}', '${q.correct}', ${index})" class="quiz-option p-4 border-2 border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition"><span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase">${key}</span><div class="font-bold text-slate-700 flex-1">${parseImg(q[key])}</div></div>`).join('')}</div>`; 
}
function checkAns(el, selected, correct, index) { 
    document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70')); const q = quiz[index]; 
    if (selected === correct.toLowerCase()) { el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800'); score += 10; } 
    else { el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800'); let qText = parseImg(q.question); let wrongAnsText = parseImg(q[selected]); let correctAnsText = parseImg(q[correct]); let wrongText = `<div class="bg-white p-4 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-red-500">Câu ${index+1}:</span> ${qText}</p><div class="space-y-2 mt-3"><p class="text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-100"><i class="fas fa-times-circle mr-1"></i> <b>Bé chọn (${selected.toUpperCase()}):</b> <span class="font-medium">${wrongAnsText}</span></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng (${correct.toUpperCase()}):</b> <span class="font-medium">${correctAnsText}</span></p></div></div>`; wrongAnswersLog.push(wrongText); } setTimeout(() => renderQuestion(index + 1), 1200); 
}
function startTimer(seconds) { clearInterval(timer); let t = seconds; timer = setInterval(() => { let m = Math.floor(t / 60), s = t % 60; document.getElementById('quizTimer').innerText = `${m}:${s < 10 ? '0' + s : s}`; if (t <= 0) { clearInterval(timer); alert("Hết giờ làm bài!"); finishQuiz(); } t--; }, 1000); }

async function finishQuiz() { 
    clearInterval(timer); const maxPossibleScore = quiz.length * 10; 
    if (score > 0 && score === maxPossibleScore) { var duration = 3 * 1000; var animationEnd = Date.now() + duration; var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; var interval = setInterval(function() { var timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } var particleCount = 50 * (timeLeft / duration); confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }); }, 250); } 
    document.getElementById("quizBox").innerHTML = `<div class="text-center py-10 fade-in"><div class="text-7xl mb-6 animate-bounce">🏆</div><h3 class="text-2xl font-black text-slate-800 mb-2">ĐIỂM CỦA BẠN</h3><p class="text-6xl font-black text-indigo-600 mb-8">${score}</p><button onclick="loadSubject(curSub)" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg btn-3d shadow-lg w-full">Trở về Danh sách</button></div>`; 
    if(currentUser.role === 'student') { 
        let submitTime = new Date().toISOString(); 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score, details: wrongAnswersLog.join('') } }) }); 
        Data.log.push({ id: currentUser.id, subject: curSub, group: curGrp, score: score, time: submitTime, details: wrongAnswersLog.join('') }); 
    } 
}
