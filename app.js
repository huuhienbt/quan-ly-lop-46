// ==========================================
// NÃO BỘ XỬ LÝ - V68 BẢN HOÀN CHỈNH 100%
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbzpuACT7j54WUonp3-WAoiiWET2XzE10WLSRZdvR8el0Ov0jlKezq2uqnkaT7NolRbJyg/exec";
const AD_PASS = "123456";

let Data = { hs: [], math: [], tv: [], log: [], stats: null, leaves: [] };
let currentUser = null, curSub = null, curGrp = null, quiz = [], timer = null, score = 0, currentQIndex = 0;

window.onload = async () => {
    try {
        const r = await fetch(API_URL + "?type=students&t=" + Date.now());
        Data.hs = await r.json();
        document.getElementById('connStatus').innerText = "Đã kết nối dữ liệu thành công!";
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-green-500";
        
        const role = localStorage.getItem('role');
        if(role === 'admin') loginAdmin();
        else if(role === 'student') {
            const u = Data.hs.find(x => x.id === localStorage.getItem('uid'));
            if(u) loginStudent(u); else showLogin();
        } else showLogin();
    } catch(e) {
        document.getElementById('connStatus').innerText = "Lỗi mạng hoặc Link API bị sai!";
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-red-500";
    }
};

function showLogin() { 
    document.getElementById('loader').style.display = 'none'; 
    document.getElementById('loginScreen').classList.remove('hidden'); 
}

function login() {
    const v = document.getElementById('inputLogin').value.trim();
    if(v === AD_PASS) { localStorage.setItem('role','admin'); loginAdmin(); return; }
    const u = Data.hs.find(s => s.fatherPhone.includes(v) || s.motherPhone.includes(v));
    if(u) { localStorage.setItem('role','student'); localStorage.setItem('uid',u.id); loginStudent(u); }
    else alert("Sai SĐT hoặc mật khẩu!");
}

function loginAdmin() {
    currentUser = { role: 'admin', name: "Thầy Hiển" };
    setupUI();
    renderDashboardAdmin();
}

async function loginStudent(u) {
    currentUser = { ...u, role: 'student' };
    setupUI();
    renderDashboardStudent();
    const r = await fetch(API_URL + "?type=history&studentId=" + u.id + "&t=" + Date.now());
    Data.log = await r.json();
}

function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('loader').style.display='none';
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('menuName').innerText = currentUser.name;
    document.getElementById('headerName').innerText = currentUser.role === 'admin' ? 'GVCN' : currentUser.name.split(" ").pop();
    if(currentUser.role === 'admin') document.getElementById('menuTeacher').classList.remove('hidden');
    else document.getElementById('menuStudent').classList.remove('hidden');
}

const contentArea = document.getElementById('content');

function toggleMenu() { document.getElementById('appMenu').classList.toggle('hidden'); }
function closeMenu() { document.getElementById('appMenu').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
function veTrangChu() {
    closeMenu();
    clearInterval(timer);
    if(currentUser.role === 'admin') renderDashboardAdmin();
    else renderDashboardStudent();
}

// ==========================================
// GIAO DIỆN CHÍNH
// ==========================================
function renderDashboardAdmin() {
    contentArea.innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 fade-in">
            <button onclick="chuyenTrangQuanLy()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-users text-3xl text-blue-600"></i><span class="font-bold text-slate-700">Học sinh</span></button>
            <button onclick="moThongBao()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-orange-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-bullhorn text-3xl text-orange-500"></i><span class="font-bold text-slate-700">Thông báo</span></button>
            <button onclick="moDonTu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-red-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-envelope text-3xl text-red-600"></i><span class="font-bold text-slate-700">Hộp thư</span></button>
            <button onclick="moTienDo()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-chart-line text-3xl text-purple-600"></i><span class="font-bold text-slate-700">Tiến độ</span></button>
            <button onclick="quanLyNganHang('math')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-indigo-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-calculator text-3xl text-indigo-600"></i><span class="font-bold text-slate-700">Kho Toán</span></button>
            <button onclick="quanLyNganHang('vietnamese')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-book text-3xl text-green-600"></i><span class="font-bold text-slate-700">Kho T.Việt</span></button>
        </div>
    `;
}

function renderDashboardStudent() {
    const msg = localStorage.getItem("clsMsg");
    const hasNoti = msg && msg.length > 0;
    
    contentArea.innerHTML = `
        <div class="text-center mb-6 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            <button onclick="moThongBao()" class="col-span-1 md:col-span-2 relative h-32 bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl shadow-lg flex items-center p-6 btn-3d border-2 border-white">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl mr-4"><i class="fas fa-bullhorn"></i></div>
                <div class="text-left"><h3 class="font-black text-2xl text-white tracking-wide">THÔNG BÁO</h3><p class="text-orange-100 text-sm font-bold mt-1">Tin nhắn từ GVCN</p></div>
                ${hasNoti ? '<span class="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full animate-ping border-2 border-white"></span>' : ''}
            </button>
            <button onclick="moGocHocTap()" class="relative h-48 bg-white border-4 border-indigo-50 rounded-3xl shadow-xl flex flex-col items-center justify-center btn-3d"><div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-4xl mb-3"><i class="fas fa-rocket"></i></div><span class="font-black text-xl text-slate-700">GÓC HỌC TẬP</span></button>
            <button onclick="moXinPhep()" class="relative h-48 bg-white border-4 border-red-50 rounded-3xl shadow-xl flex flex-col items-center justify-center btn-3d"><div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl mb-3"><i class="fas fa-envelope-open-text"></i></div><span class="font-black text-xl text-slate-700">GỬI ĐƠN PHÉP</span></button>
        </div>
    `;
}

// ==========================================
// TÍNH NĂNG: GÓC HỌC TẬP VÀ LÀM BÀI (HỌC SINH)
// ==========================================
function moGocHocTap() {
    closeMenu();
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">CHỌN MÔN HỌC</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="loadSubject('math')" class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d"><i class="fas fa-calculator text-4xl mb-2 block"></i>TOÁN</button>
            <button onclick="loadSubject('vietnamese')" class="bg-gradient-to-br from-green-500 to-emerald-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d"><i class="fas fa-book-open text-4xl mb-2 block"></i>TIẾNG VIỆT</button>
        </div>
    `;
}

async function loadSubject(sub) {
    curSub = sub;
    contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải bài tập...</p></div>`;
    
    // Tải dữ liệu từ Google Sheet
    const qs = await (await fetch(API_URL + "?type=" + sub + "&t=" + Date.now())).json();
    Data[sub] = qs;
    
    const grps = [...new Set(qs.map(x => x.group))].sort();
    
    let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2></div>`;
    html += `<div class="space-y-3">`;
    
    if(grps.length === 0) {
        html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`;
    } else {
        grps.forEach(g => {
            const isDone = Data.log.some(l => l.subject === sub && l.group === g);
            const time = qs.find(q => q.group === g).time || 10;
            const count = qs.filter(q => q.group === g).length;
            
            html += `
            <div onclick="startQuiz('${g}', ${time})" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${isDone ? 'border-green-100 bg-green-50/30' : 'border-indigo-50'}">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}">
                        <i class="fas ${isDone ? 'fa-check' : 'fa-star'}"></i>
                    </div>
                    <div>
                        <h3 class="font-black text-lg text-slate-700">${g}</h3>
                        <p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p>
                    </div>
                </div>
                ${!isDone ? '<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>' : ''}
            </div>`;
        });
    }
    html += `</div>`;
    contentArea.innerHTML = html;
}

function startQuiz(group, timeMins) {
    curGrp = group;
    // Lọc lấy câu hỏi của bài này và xáo trộn ngẫu nhiên tối đa 10 câu
    const questions = Data[curSub].filter(q => q.group === group);
    quiz = questions.sort(() => Math.random() - 0.5).slice(0, 10);
    currentQIndex = 0;
    score = 0;
    
    renderQuizFrame();
    renderQuestion(0);
    startTimer(timeMins * 60);
}

function renderQuizFrame() {
    contentArea.innerHTML = `
        <div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
                <button onclick="loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button>
                <span class="font-black text-indigo-900 truncate max-w-[150px]">${curGrp}</span>
            </div>
            <div class="bg-white px-4 py-2 rounded-full font-black text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2">
                <i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span>
            </div>
        </div>
        <div id="quizBox" class="bg-white p-5 rounded-3xl shadow-xl border-4 border-white min-h-[400px]"></div>
    `;
}

function renderQuestion(index) {
    if (index >= quiz.length) { finishQuiz(); return; }
    const q = quiz[index];
    const box = document.getElementById("quizBox");
    
    box.innerHTML = `
        <div class="mb-6 fade-in">
            <div class="text-sm font-bold text-indigo-500 mb-2">Câu ${index + 1} / ${quiz.length}</div>
            <div class="text-xl font-bold text-slate-800">${parseImg(q.question)}</div>
        </div>
        <div class="space-y-3 fade-in">
            ${['a','b','c','d'].map(key => `
                <div onclick="checkAns(this, '${key}', '${q.correct}', ${index})" class="quiz-option p-4 border-2 border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition">
                    <span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase">${key}</span>
                    <div class="font-bold text-slate-700 flex-1">${parseImg(q[key])}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function checkAns(el, selected, correct, index) {
    // Vô hiệu hóa các nút khác
    document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70'));
    
    if (selected === correct.toLowerCase()) {
        el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800');
        score += 10;
    } else {
        el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800');
    }
    
    setTimeout(() => renderQuestion(index + 1), 1200);
}

function startTimer(seconds) {
    clearInterval(timer);
    let t = seconds;
    timer = setInterval(() => {
        let m = Math.floor(t / 60), s = t % 60;
        document.getElementById('quizTimer').innerText = `${m}:${s < 10 ? '0' + s : s}`;
        if (t <= 0) { clearInterval(timer); alert("Hết giờ làm bài!"); finishQuiz(); }
        t--;
    }, 1000);
}

async function finishQuiz() {
    clearInterval(timer);
    document.getElementById("quizBox").innerHTML = `
        <div class="text-center py-10 fade-in">
            <div class="text-7xl mb-6 animate-bounce">🏆</div>
            <h3 class="text-2xl font-black text-slate-800 mb-2">ĐIỂM CỦA BẠN</h3>
            <p class="text-6xl font-black text-indigo-600 mb-8">${score}</p>
            <button onclick="loadSubject(curSub)" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg btn-3d shadow-lg w-full">Trở về Danh sách</button>
        </div>
    `;
    
    // Lưu kết quả về Google Sheet
    if(currentUser.role === 'student') {
        await fetch(API_URL, { 
            method: 'POST', mode: 'no-cors', 
            body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score } }) 
        });
        Data.log.push({ subject: curSub, group: curGrp }); // Cập nhật local
    }
}

// ==========================================
// TÍNH NĂNG: QUẢN LÝ KHO CÂU HỎI (GIÁO VIÊN)
// ==========================================
async function quanLyNganHang(sub) {
    closeMenu();
    curSub = sub;
    contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải dữ liệu...</p></div>`;
    
    const qs = await (await fetch(API_URL+"?type="+sub+"&t="+Date.now())).json();
    Data[sub] = qs;
    
    const groups = [...new Set(qs.map(q => q.group))].sort();
    let filterOptions = `<option value="all">-- Tất cả các bài --</option>` + groups.map(g => `<option value="${g}">${g}</option>`).join('');
    
    contentArea.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">KHO ${sub === 'math' ? 'TOÁN' : 'T.VIỆT'}</h2></div>
            <button onclick="renderFormCauHoi(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold btn-3d text-sm"><i class="fas fa-plus mr-1"></i> Tạo mới</button>
        </div>
        <select id="qFilter" onchange="filterQuestions()" class="w-full p-3 rounded-xl border-2 border-slate-200 mb-6 font-bold text-slate-700 outline-none focus:border-indigo-500">${filterOptions}</select>
        <div id="listQuestions" class="space-y-4"></div>
    `;
    filterQuestions(); // Render lần đầu
}

function filterQuestions() {
    const val = document.getElementById("qFilter").value;
    const list = val === 'all' ? Data[curSub] : Data[curSub].filter(q => q.group === val);
    
    document.getElementById("listQuestions").innerHTML = list.length === 0 ? '<p class="text-center text-slate-400">Trống</p>' : list.map(q => `
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col fade-in">
            <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase">${q.group}</span>
                <div class="flex gap-2">
                    <button onclick="renderFormCauHoi('${q.id}')" class="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition"><i class="fas fa-edit"></i></button>
                    <button onclick="xoaCauHoi('${q.id}')" class="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="font-bold text-slate-800 text-base">${parseImg(q.question)}</div>
        </div>
    `).join('');
}

function renderFormCauHoi(id) {
    const q = id ? Data[curSub].find(x => x.id === id) : { group: '', time: 10, question: '', a: '', b: '', c: '', d: '', correct: 'a' };
    
    // Danh sách gợi ý tên bài
    const groups = [...new Set(Data[curSub].map(x => x.group))];
    const dl = `<datalist id="groupList">${groups.map(g => `<option value="${g}">`).join('')}</datalist>`;
    
    // HTML form sửa trực tiếp trên màn hình (thay vì modal bị kẹt màn hình)
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="quanLyNganHang('${curSub}')" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">${id ? 'SỬA CÂU HỎI' : 'TẠO CÂU HỎI MỚI'}</h2></div>
        <div class="bg-white p-5 rounded-3xl shadow border space-y-4 fade-in">
            ${dl}
            <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2"><label class="text-xs font-bold text-slate-500 uppercase">Tên Bài Tập</label><input type="text" id="frmG" list="groupList" value="${q.group}" class="edit-input w-full mt-1" placeholder="Ví dụ: Tuần 1..."></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Phút</label><input type="number" id="frmT" value="${q.time}" class="edit-input w-full mt-1 text-center"></div>
            </div>
            
            <div><label class="text-xs font-bold text-slate-500 uppercase">Nội dung câu hỏi</label><textarea id="frmQ" rows="3" class="edit-input w-full mt-1">${q.question}</textarea></div>
            
            <div class="grid grid-cols-2 gap-3">
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án A</label><input type="text" id="frmA" value="${q.a}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án B</label><input type="text" id="frmB" value="${q.b}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án C</label><input type="text" id="frmC" value="${q.c}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án D</label><input type="text" id="frmD" value="${q.d}" class="edit-input w-full mt-1"></div>
            </div>
            
            <div>
                <label class="text-xs font-bold text-slate-500 uppercase">Chọn Đáp Án Đúng</label>
                <select id="frmCorr" class="edit-input w-full mt-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                    <option value="a" ${q.correct=='a'?'selected':''}>Đáp án A</option>
                    <option value="b" ${q.correct=='b'?'selected':''}>Đáp án B</option>
                    <option value="c" ${q.correct=='c'?'selected':''}>Đáp án C</option>
                    <option value="d" ${q.correct=='d'?'selected':''}>Đáp án D</option>
                </select>
            </div>
            
            <button onclick="luuCauHoi('${id || ''}')" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black btn-3d shadow-lg mt-4">LƯU CÂU HỎI LÊN HỆ THỐNG</button>
        </div>
    `;
}

async function luuCauHoi(id) {
    const data = {
        id: id, subject: curSub, group: document.getElementById("frmG").value, time: document.getElementById("frmT").value,
        question: document.getElementById("frmQ").value, a: document.getElementById("frmA").value, b: document.getElementById("frmB").value,
        c: document.getElementById("frmC").value, d: document.getElementById("frmD").value, correct: document.getElementById("frmCorr").value, image: ""
    };
    if(!data.group || !data.question) return alert("Vui lòng điền đủ Tên bài và Câu hỏi!");
    
    document.getElementById('loader').style.display = 'flex';
    await fetch(API_URL, { method:'POST', mode:'no-cors', body:JSON.stringify({ action: id ? 'sua_cau_hoi' : 'them_cau_hoi', data: data }) });
    alert("Lưu thành công!");
    document.getElementById('loader').style.display = 'none';
    quanLyNganHang(curSub);
}

async function xoaCauHoi(id) {
    if(confirm("Thầy có chắc chắn muốn xóa câu hỏi này không?")) {
        document.getElementById('loader').style.display = 'flex';
        await fetch(API_URL, { method:'POST', mode:'no-cors', body:JSON.stringify({ action: 'xoa_cau_hoi', data: { id: id, subject: curSub } }) });
        alert("Đã xóa!");
        document.getElementById('loader').style.display = 'none';
        quanLyNganHang(curSub);
    }
}

// ==========================================
// CÁC TÍNH NĂNG CHUNG (Hồ sơ, Thông báo, Tiến độ...)
// ==========================================

function moThongBao() {
    closeMenu();
    const msg = localStorage.getItem("clsMsg") || "Hiện tại chưa có thông báo mới từ GVCN.";
    let btnSua = currentUser.role === 'admin' ? `<button onclick="editNoti()" class="w-full mt-6 bg-orange-100 text-orange-700 py-3 rounded-xl font-bold shadow-sm btn-3d border border-orange-200"><i class="fas fa-edit"></i> Soạn thông báo mới</button>` : '';

    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left text-slate-500"></i></button><h2 class="font-black text-xl text-orange-500 uppercase">THÔNG BÁO LỚP</h2></div>
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-orange-400 fade-in">
            <div class="flex items-center gap-3 mb-4"><div class="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center text-2xl"><i class="fas fa-bell"></i></div><h3 class="font-bold text-slate-800 text-lg">Tin nhắn từ GVCN</h3></div>
            <div class="bg-orange-50 p-5 rounded-2xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap min-h-[120px] border border-orange-100 text-lg">${msg}</div>
            ${btnSua}
        </div>
    `;
}

function editNoti() {
    const n = prompt("Nhập nội dung thông báo mới:", localStorage.getItem("clsMsg") || "");
    if(n !== null) { localStorage.setItem("clsMsg", n); moThongBao(); }
}

function chuyenTrangQuanLy() {
    closeMenu();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600">QUẢN LÝ HS</h2></div><div class="space-y-3">`;
    html += Data.hs.map(h => `
        <div onclick="viewProfile('${h.id}')" class="bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:bg-slate-50 transition">
            <span class="font-bold text-slate-700">${h.name}</span>
            <span class="text-xs text-gray-500">SĐT: ${h.fatherPhone || h.motherPhone || 'Chưa có'}</span>
        </div>`).join('');
    contentArea.innerHTML = html + "</div>";
}

function viewProfile(id) {
    closeMenu();
    const s = Data.hs.find(x => x.id === id);
    if(!s) return;
    
    const renderPhone = (phone) => {
        if(!phone || phone.trim() === '') return '<span class="text-gray-400 italic text-xs">Chưa có</span>';
        const cleanPhone = phone.toString().replace(/\D/g, ''); 
        return `
            <div class="flex items-center gap-2">
                <span class="font-bold">${phone}</span>
                <a href="tel:${cleanPhone}" class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white"><i class="fas fa-phone-alt"></i></a>
                <a href="https://zalo.me/${cleanPhone}" target="_blank" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white"><i class="fas fa-comment"></i></a>
            </div>
        `;
    };

    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="${currentUser.role==='admin'?'chuyenTrangQuanLy()':'veTrangChu()'}" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left text-slate-500"></i></button><h2 class="font-black text-xl text-blue-600 uppercase">HỒ SƠ HỌC SINH</h2></div>
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-blue-500 fade-in">
            <div class="text-center mb-6">
                <div class="w-24 h-24 bg-blue-50 rounded-full mx-auto flex items-center justify-center text-4xl text-blue-400 mb-3 border-4 border-white shadow-md"><i class="fas fa-user-graduate"></i></div>
                <h2 class="text-2xl font-black text-slate-800">${s.name}</h2>
                <p class="text-sm font-mono text-slate-400 mt-1">ID: ${s.id}</p>
            </div>
            <div class="space-y-4 text-sm bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2"><span class="font-bold text-slate-400 uppercase text-[10px]">Giới tính</span><b class="text-slate-800">${s.gender || '-'}</b></div>
                <div class="flex justify-between items-center border-b border-slate-200 pb-2"><span class="font-bold text-slate-400 uppercase text-[10px]">Ngày sinh</span><b class="text-slate-800">${s.dob || '-'}</b></div>
                <div class="flex justify-between items-center border-b border-slate-200 pb-2"><span class="font-bold text-slate-400 uppercase text-[10px]">Cha</span>${renderPhone(s.fatherPhone)}</div>
                <div class="flex justify-between items-center border-b border-slate-200 pb-2"><span class="font-bold text-slate-400 uppercase text-[10px]">Mẹ</span>${renderPhone(s.motherPhone)}</div>
                <div class="flex justify-between items-center border-b border-slate-200 pb-2"><span class="font-bold text-slate-400 uppercase text-[10px]">Điểm rèn luyện</span><span class="bg-yellow-100 text-yellow-700 font-black px-2 py-1 rounded"><i class="fas fa-gem"></i> ${s.score || 0}</span></div>
                <div class="flex flex-col gap-1"><span class="font-bold text-slate-400 uppercase text-[10px]">Địa chỉ</span><b class="text-slate-800">${s.address || '-'}</b></div>
            </div>
        </div>
    `;
}

function moXinPhep() {
    closeMenu();
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600">GỬI ĐƠN PHÉP</h2></div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <div><label class="font-bold text-gray-600">Ngày nghỉ</label><input type="date" id="lDate" class="edit-input w-full mt-1"></div>
            <div><label class="font-bold text-gray-600">Lý do</label><textarea id="lReason" class="edit-input w-full mt-1" rows="3" placeholder="Nhập lý do nghỉ..."></textarea></div>
            <button onclick="sendLeave()" class="w-full bg-red-600 text-white py-3 rounded-xl font-bold btn-3d shadow-lg mt-4">GỬI ĐƠN</button>
        </div>
    `;
    document.getElementById('lDate').valueAsDate = new Date(Date.now()+86400000);
}

async function sendLeave() {
    const d = document.getElementById('lDate').value, r = document.getElementById('lReason').value;
    if(!d || !r) return alert("Vui lòng nhập đủ thông tin!");
    document.getElementById('loader').style.display='flex';
    try {
        await fetch(API_URL, { method:'POST', mode:'no-cors', body:JSON.stringify({ action:'gui_xin_phep', data:{ id:currentUser.id, name:currentUser.name, dateOff:d, type:'Nghỉ cả ngày', reason:r } }) });
        alert("Gửi đơn thành công!"); 
        veTrangChu();
    } catch(e) { alert("Lỗi mạng, chưa gửi được đơn!"); }
    document.getElementById('loader').style.display='none'; 
}

// CÁC HÀM PHỤ TRỢ (Thống kê & Utilities)
async function moDonTu() {
    closeMenu();
    contentArea.innerHTML = `<h2 class="text-xl font-black text-red-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</h2>`;
    const leaves = await (await fetch(API_URL + "?type=absent_list&t=" + Date.now())).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600">HỘP THƯ ĐƠN TỪ</h2></div><div class="space-y-4">`;
    html += leaves.map(l => `<div class="bg-white p-4 rounded-xl border shadow-sm flex gap-3"><div class="w-10 h-10 bg-red-50 text-red-500 rounded-full flex justify-center items-center"><i class="fas fa-bed"></i></div><div class="flex-1"><div class="flex justify-between font-bold"><span>${l.name}</span><span class="text-xs bg-gray-100 px-2 rounded">${l.dateOff}</span></div><p class="text-sm font-bold text-indigo-600">${l.type}</p><p class="text-xs text-gray-500 italic mt-1">"${l.reason}"</p></div></div>`).join('') || '<p class="text-center text-gray-400">Trống</p>';
    contentArea.innerHTML = html + "</div>";
}

async function moTienDo() {
    closeMenu();
    contentArea.innerHTML = `<h2 class="text-xl font-black text-purple-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tính toán...</h2>`;
    const math = await (await fetch(API_URL+"?type=math")).json();
    const vietnamese = await (await fetch(API_URL+"?type=vietnamese")).json();
    const total = [...new Set(math.map(x=>x.group))].length + [...new Set(vietnamese.map(x=>x.group))].length;
    const logs = await (await fetch(API_URL+"?type=history_all&t="+Date.now())).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600">TIẾN ĐỘ HỌC TẬP (${total} BÀI)</h2></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
    html += Data.hs.map(h => {
        const userL = logs.filter(l => l.id === h.id);
        const done = new Set(userL.map(l => l.subject+l.group)).size;
        const pct = total ? Math.round((done/total)*100) : 0;
        return `<div class="bg-white p-3 rounded-xl border flex justify-between items-center"><span class="font-bold text-sm">${h.name}</span><div class="w-1/2 text-right"><div class="text-xs font-bold mb-1">${done}/${total} (${pct}%)</div><div class="progress-bar"><div class="progress-fill ${pct==100?'bg-green-500':'bg-blue-500'}" style="width:${pct}%"></div></div></div></div>`;
    }).join('');
    contentArea.innerHTML = html + "</div>";
}

function parseImg(t) { return (t||"").toString().replace(/\[img:(.*?)\]/g, '<img src="$1" class="rounded border my-2">').replace(/\n/g,'<br>'); }
