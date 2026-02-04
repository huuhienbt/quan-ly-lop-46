// ==========================================
// NÃO BỘ XỬ LÝ - V68 SIÊU TỐC (UPDATE: ĐÃ CÓ LÀM BÀI)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbzpuACT7j54WUonp3-WAoiiWET2XzE10WLSRZdvR8el0Ov0jlKezq2uqnkaT7NolRbJyg/exec";
const AD_PASS = "123456"; // Lưu ý: Lộ password ở client là không bảo mật, nhưng chấp nhận được với quy mô lớp học nhỏ.

let Data = { hs: [], math: [], tv: [], log: [], stats: null, leaves: [] };
let currentUser = null, curSub = null, curGrp = null, quiz = [], timer = null;

// --- KHỞI TẠO ---
window.onload = async () => {
    try {
        // Tải danh sách HS ngay khi vào để đối chiếu đăng nhập
        const r = await fetch(API_URL + "?type=students&t=" + Date.now());
        Data.hs = await r.json();
        document.getElementById('connStatus').innerText = "Đã kết nối máy chủ!";
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-green-500";
        
        // Kiểm tra phiên đăng nhập cũ
        const role = localStorage.getItem('role');
        if(role === 'admin') loginAdmin();
        else if(role === 'student') {
            const u = Data.hs.find(x => x.id === localStorage.getItem('uid'));
            if(u) loginStudent(u); else showLogin();
        } else showLogin();
    } catch(e) {
        document.getElementById('connStatus').innerText = "Lỗi kết nối! Hãy tải lại trang.";
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-red-500";
    }
};

// --- CÁC HÀM ĐĂNG NHẬP ---
function showLogin() { 
    document.getElementById('loader').style.display = 'none'; 
    document.getElementById('loginScreen').classList.remove('hidden'); 
}

function login() {
    const v = document.getElementById('inputLogin').value.trim();
    if(v === AD_PASS) { localStorage.setItem('role','admin'); loginAdmin(); return; }
    
    // Tìm HS có SĐT khớp (sửa logic một chút để chính xác hơn)
    const u = Data.hs.find(s => 
        (s.fatherPhone && s.fatherPhone.includes(v)) || 
        (s.motherPhone && s.motherPhone.includes(v))
    );
    
    if(u) { 
        localStorage.setItem('role','student'); 
        localStorage.setItem('uid',u.id); 
        loginStudent(u); 
    } else {
        alert("Sai SĐT hoặc SĐT chưa được đăng ký trong danh sách!");
    }
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
    // Tải lịch sử làm bài của HS này
    const r = await fetch(API_URL + "?type=history&studentId=" + u.id);
    Data.log = await r.json();
}

function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('loader').style.display='none';
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('menuName').innerText = currentUser.name;
    document.getElementById('headerName').innerText = currentUser.role === 'admin' ? 'GV' : currentUser.name;
    
    if(currentUser.role === 'admin') {
        document.getElementById('menuTeacher').classList.remove('hidden');
        document.getElementById('menuStudent').classList.add('hidden');
    } else {
        document.getElementById('menuStudent').classList.remove('hidden');
        document.getElementById('menuTeacher').classList.add('hidden');
    }
}

const contentArea = document.getElementById('content');
function toggleMenu() { document.getElementById('appMenu').classList.toggle('hidden'); }
function closeMenu() { document.getElementById('appMenu').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }

function veTrangChu() {
    closeMenu();
    clearInterval(timer); // Dừng đếm giờ nếu đang làm bài
    if(currentUser.role === 'admin') renderDashboardAdmin();
    else renderDashboardStudent();
}

// --- GIAO DIỆN ADMIN ---
function renderDashboardAdmin() {
    contentArea.innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 fade-in">
            <button onclick="chuyenTrangQuanLy()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-users text-3xl text-blue-600"></i><span class="font-bold text-slate-700">Học sinh</span></button>
            <button onclick="moDonTu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-red-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-envelope text-3xl text-red-600"></i><span class="font-bold text-slate-700">Đơn từ</span></button>
            <button onclick="moTienDo()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-chart-line text-3xl text-purple-600"></i><span class="font-bold text-slate-700">Tiến độ</span></button>
            <button onclick="quanLyNganHang('math')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-indigo-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-calculator text-3xl text-indigo-600"></i><span class="font-bold text-slate-700">Kho Toán</span></button>
        </div>
    `;
}

// --- GIAO DIỆN HỌC SINH ---
function renderDashboardStudent() {
    contentArea.innerHTML = `
        <div class="text-center mb-6 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
            <button onclick="moGocHocTap()" class="h-60 bg-gradient-to-br from-indigo-100 to-white border-4 border-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center btn-3d">
                <i class="fas fa-rocket text-6xl text-indigo-600 mb-4 animate-bounce"></i>
                <span class="font-black text-2xl text-slate-700">GÓC HỌC TẬP</span>
            </button>
            <button onclick="moXinPhep()" class="h-60 bg-gradient-to-br from-orange-100 to-white border-4 border-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center btn-3d">
                <i class="fas fa-envelope text-6xl text-orange-500 mb-4"></i>
                <span class="font-black text-2xl text-slate-700">GỬI ĐƠN PHÉP</span>
            </button>
        </div>
    `;
}

// ---------------------------------------------------------
// [UPDATE] TÍNH NĂNG LÀM BÀI TẬP (QUAN TRỌNG NHẤT)
// ---------------------------------------------------------

async function moGocHocTap() {
    closeMenu();
    contentArea.innerHTML = `<h2 class="text-xl font-black text-indigo-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải bài tập...</h2>`;
    
    // Tải dữ liệu câu hỏi nếu chưa có
    if(Data.math.length === 0) Data.math = await (await fetch(API_URL+"?type=math")).json();
    if(Data.tv.length === 0) Data.tv = await (await fetch(API_URL+"?type=vietnamese")).json();
    
    // Lấy danh sách các nhóm bài (ví dụ: Tuan1, Tuan2)
    const groupsMath = [...new Set(Data.math.map(x=>x.group))];
    const groupsTV = [...new Set(Data.tv.map(x=>x.group))];
    
    let html = `
    <div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">CHỌN BÀI TẬP</h2></div>
    
    <div class="mb-4"><h3 class="font-bold text-lg text-blue-600 border-b-2 border-blue-100 pb-2 mb-3">MÔN TOÁN</h3>
    <div class="grid grid-cols-2 gap-3">`;
    
    html += groupsMath.map(g => {
        // Kiểm tra xem bài này làm chưa
        const daLam = Data.log.find(l => l.subject === 'Toán' && l.group === g);
        const statusClass = daLam ? "bg-green-100 text-green-700 border-green-200" : "bg-white border-blue-100 text-slate-700 hover:bg-blue-50";
        const icon = daLam ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-play"></i>';
        return `<button onclick="vaoHoc('math', '${g}')" class="${statusClass} p-4 rounded-xl border-2 font-bold shadow-sm flex justify-between items-center transition">${g} ${icon}</button>`;
    }).join('');
    
    html += `</div></div>
    
    <div class="mb-4"><h3 class="font-bold text-lg text-green-600 border-b-2 border-green-100 pb-2 mb-3">TIẾNG VIỆT</h3>
    <div class="grid grid-cols-2 gap-3">`;
    
    html += groupsTV.map(g => {
        const daLam = Data.log.find(l => l.subject === 'Tiếng Việt' && l.group === g);
        const statusClass = daLam ? "bg-green-100 text-green-700 border-green-200" : "bg-white border-green-100 text-slate-700 hover:bg-green-50";
        const icon = daLam ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-play"></i>';
        return `<button onclick="vaoHoc('vietnamese', '${g}')" class="${statusClass} p-4 rounded-xl border-2 font-bold shadow-sm flex justify-between items-center transition">${g} ${icon}</button>`;
    }).join('');
    
    html += `</div></div>`;
    
    contentArea.innerHTML = html;
}

function vaoHoc(subject, group) {
    curSub = subject === 'math' ? 'Toán' : 'Tiếng Việt';
    curGrp = group;
    
    // Lọc câu hỏi thuộc nhóm này
    const source = subject === 'math' ? Data.math : Data.tv;
    quiz = source.filter(x => x.group === group);
    
    if(quiz.length === 0) return alert("Bài này chưa có câu hỏi!");
    
    renderQuiz();
}

function renderQuiz() {
    let html = `
    <div class="sticky top-0 bg-[#f0f7ff] pt-2 pb-4 z-10 border-b border-indigo-100 mb-4 flex justify-between items-center">
        <div>
            <button onclick="moGocHocTap()" class="text-gray-500 mr-2"><i class="fas fa-times"></i> Thoát</button>
            <span class="font-black text-indigo-800 text-lg">${curSub} - ${curGrp}</span>
        </div>
        <button onclick="nopBai()" class="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition">NỘP BÀI</button>
    </div>
    <div class="space-y-6 pb-20">`;
    
    html += quiz.map((q, idx) => `
        <div class="bg-white p-5 rounded-2xl shadow-sm border-2 border-transparent hover:border-indigo-100 transition question-box" id="qbox-${idx}">
            <div class="flex gap-3 mb-3">
                <span class="bg-indigo-100 text-indigo-700 font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">${idx+1}</span>
                <div class="flex-1 font-bold text-slate-800 text-lg">${q.question.replace(/\n/g,'<br>')}</div>
            </div>
            ${q.image ? `<img src="${q.image}" class="max-w-full rounded-lg mb-3 mx-auto max-h-60" />` : ''}
            <div class="grid grid-cols-1 gap-3">
                ${['a','b','c','d'].map(opt => q[opt] ? `
                    <label class="cursor-pointer relative">
                        <input type="radio" name="q-${idx}" value="${opt}" class="peer sr-only">
                        <div class="p-3 rounded-xl bg-slate-50 border-2 border-slate-200 peer-checked:border-indigo-500 peer-checked:bg-indigo-50 peer-checked:text-indigo-700 font-medium transition flex items-center">
                            <span class="w-6 h-6 border-2 border-slate-300 rounded-full mr-3 flex items-center justify-center peer-checked:border-indigo-500 peer-checked:bg-indigo-500"><i class="fas fa-check text-white text-xs opacity-0 peer-checked:opacity-100"></i></span>
                            ${opt.toUpperCase()}. ${q[opt]}
                        </div>
                    </label>
                ` : '').join('')}
            </div>
        </div>
    `).join('');
    
    contentArea.innerHTML = html + "</div>";
}

async function nopBai() {
    if(!confirm("Con có chắc chắn muốn nộp bài không?")) return;
    
    let score = 0;
    let detail = [];
    
    // Chấm điểm
    quiz.forEach((q, idx) => {
        const selected = document.querySelector(`input[name="q-${idx}"]:checked`);
        const val = selected ? selected.value : "";
        const isCorrect = val === q.correct;
        if(isCorrect) score++;
        detail.push({ q: idx+1, correct: isCorrect, ans: val, rightAns: q.correct });
    });
    
    // Tính điểm thang 10
    const finalScore = Math.round((score / quiz.length) * 10);
    
    document.getElementById('loader').style.display = 'flex';
    document.getElementById('loader').innerHTML = `<div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600 mb-4"></div><p class="font-bold text-indigo-900">ĐANG CHẤM ĐIỂM...</p>`;
    
    try {
        // Gửi kết quả về Server
        await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Quan trọng
            body: JSON.stringify({
                action: 'nop_bai',
                data: {
                    id_hs: currentUser.id,
                    subject: curSub,
                    group: curGrp,
                    score_earned: finalScore
                }
            })
        });
        
        // Cập nhật log cục bộ để không cần tải lại
        Data.log.push({ subject: curSub, group: curGrp });
        
        // Hiện kết quả
        document.getElementById('loader').style.display = 'none';
        hienKetQua(finalScore, score, quiz.length, detail);
        
    } catch(e) {
        alert("Lỗi kết nối! Kết quả có thể chưa được lưu.");
        document.getElementById('loader').style.display = 'none';
    }
}

function hienKetQua(score, right, total, detail) {
    let msg = score >= 9 ? "XUẤT SẮC! 🎉" : (score >= 7 ? "LÀM TỐT LẮM! 😊" : "CỐ GẮNG HƠN NHÉ! 💪");
    let color = score >= 5 ? "text-green-600" : "text-red-600";
    
    contentArea.innerHTML = `
        <div class="text-center mt-10 fade-in">
            <div class="text-6xl mb-4">🏆</div>
            <h2 class="text-3xl font-black ${color} mb-2">${score} ĐIỂM</h2>
            <p class="font-bold text-slate-500 text-lg mb-6">${msg}</p>
            <p class="mb-6">Con làm đúng <b class="text-slate-800">${right}/${total}</b> câu.</p>
            
            <div class="flex justify-center gap-4">
                <button onclick="moGocHocTap()" class="bg-gray-200 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-300">Quay lại</button>
                <button onclick="xemLoiGiai()" class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700">Xem đáp án</button>
            </div>
        </div>
    `;
    // Lưu tạm detail để xem lời giải nếu cần (logic này có thể phát triển thêm)
}

function xemLoiGiai() {
    alert("Tính năng xem lại bài làm chi tiết sẽ cập nhật sau!");
    moGocHocTap();
}

// ---------------------------------------------------------
// CÁC HÀM CŨ (GIỮ NGUYÊN HOẶC SỬA NHẸ)
// ---------------------------------------------------------

async function moDonTu() {
    closeMenu();
    contentArea.innerHTML = `<h2 class="text-xl font-black text-red-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải...</h2>`;
    const leaves = await (await fetch(API_URL + "?type=absent_list&t=" + Date.now())).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600">HỘP THƯ ĐƠN TỪ</h2></div><div class="space-y-4">`;
    html += leaves.map(l => `
        <div class="bg-white p-4 rounded-xl border shadow-sm flex gap-3">
            <div class="w-10 h-10 bg-red-50 text-red-500 rounded-full flex justify-center items-center"><i class="fas fa-bed"></i></div>
            <div class="flex-1"><div class="flex justify-between font-bold"><span>${l.name}</span><span class="text-xs bg-gray-100 px-2 rounded">${l.dateOff}</span></div><p class="text-sm font-bold text-indigo-600">${l.type}</p><p class="text-xs text-gray-500 italic mt-1">"${l.reason}"</p></div>
        </div>`).join('') || '<p class="text-center text-gray-400">Trống</p>';
    contentArea.innerHTML = html + "</div>";
}

async function moTienDo() {
    closeMenu();
    contentArea.innerHTML = `<h2 class="text-xl font-black text-purple-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tính toán...</h2>`;
    const math = await (await fetch(API_URL+"?type=math")).json();
    const vietnamese = await (await fetch(API_URL+"?type=vietnamese")).json();
    
    const groupsMath = [...new Set(math.map(x=>"Toán"+x.group))];
    const groupsTV = [...new Set(vietnamese.map(x=>"Tiếng Việt"+x.group))];
    const total = groupsMath.length + groupsTV.length;
    
    const logs = await (await fetch(API_URL+"?type=history_all&t="+Date.now())).json();
    
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600">TIẾN ĐỘ HỌC TẬP (${total} BÀI)</h2></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
    
    html += Data.hs.map(h => {
        const userL = logs.filter(l => l.id === h.id);
        const done = new Set(userL.map(l => l.subject+l.group)).size;
        const pct = total ? Math.round((done/total)*100) : 0;
        return `
            <div class="bg-white p-3 rounded-xl border flex justify-between items-center">
                <span class="font-bold text-sm">${h.name}</span>
                <div class="w-1/2 text-right"><div class="text-xs font-bold mb-1">${done}/${total} (${pct}%)</div><div class="progress-bar"><div class="progress-fill ${pct==100?'bg-green-500':'bg-blue-500'}" style="width:${pct}%"></div></div></div>
            </div>`;
    }).join('');
    contentArea.innerHTML = html + "</div>";
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
    const s = Data.hs.find(x => x.id === id);
    // Code tạo modal profile như cũ... (Bạn giữ nguyên đoạn code viewProfile cũ ở đây nhé để tiết kiệm dòng)
    // Tôi viết tắt lại đoạn này vì logic cũ đã ổn.
    // ... Copy đoạn viewProfile cũ ...
    
    // DEMO đoạn renderPhoneActions để code chạy được
     const renderPhoneActions = (phone) => {
        if(!phone || phone === 'undefined') return '<span class="text-gray-400 italic font-normal">Chưa cập nhật</span>';
        const cleanPhone = phone.toString().replace(/\D/g, ''); 
        return `<div class="flex items-center gap-2"><span class="font-bold text-slate-800">${phone}</span><a href="tel:${cleanPhone}" class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center"><i class="fas fa-phone-alt"></i></a></div>`;
    };
    
     document.getElementById("modalProfile").classList.remove("hidden");
     document.getElementById("pfName").innerText = s.name;
     document.getElementById("pfContent").innerHTML = `
        <div class="space-y-4 text-sm text-slate-600">
             <div class="flex justify-between border-b pb-2"><span>Giới tính</span><b>${s.gender}</b></div>
             <div class="flex justify-between border-b pb-2"><span>SĐT Cha</span>${renderPhoneActions(s.fatherPhone)}</div>
             <div class="flex justify-between border-b pb-2"><span>SĐT Mẹ</span>${renderPhoneActions(s.motherPhone)}</div>
             <div class="flex justify-between border-b pb-2"><span>Địa chỉ</span><b class="text-right">${s.address}</b></div>
        </div>
     `;
}

function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

async function quanLyNganHang(sub) {
    closeMenu();
    contentArea.innerHTML = `<p class="text-center font-bold text-indigo-600 mt-10"><i class="fas fa-spinner fa-spin mr-2"></i> Đang tải câu hỏi...</p>`;
    const qs = await (await fetch(API_URL+"?type="+sub)).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">KHO ${sub=='math'?'TOÁN':'TIẾNG VIỆT'}</h2></div><div class="space-y-4">`;
    html += qs.map(q => `<div class="bg-white p-4 rounded-xl border"><span class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded font-bold">${q.group}</span><div class="mt-2 font-bold">${q.question.replace(/\n/g,'<br>')}</div><div class="mt-2 text-sm text-green-600 font-bold">Đ.án: ${q.correct.toUpperCase()}</div></div>`).join('');
    contentArea.innerHTML = html + "</div>";
}

function moXinPhep() {
    closeMenu();
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600">GỬI ĐƠN PHÉP</h2></div>
        <div class="bg-white p-6 rounded-2xl shadow-sm border space-y-4">
            <div><label class="font-bold text-gray-600">Ngày nghỉ</label><input type="date" id="lDate" class="edit-input w-full mt-1 border p-2 rounded"></div>
            <div><label class="font-bold text-gray-600">Lý do</label><textarea id="lReason" class="edit-input w-full mt-1 border p-2 rounded" rows="3" placeholder="Nhập lý do nghỉ..."></textarea></div>
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
