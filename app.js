// ==========================================
// NÃO BỘ XỬ LÝ - V68 SIÊU TỐC (CẬP NHẬT HỒ SƠ & THÔNG BÁO)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbzpuACT7j54WUonp3-WAoiiWET2XzE10WLSRZdvR8el0Ov0jlKezq2uqnkaT7NolRbJyg/exec";
const AD_PASS = "123456";

let Data = { hs: [], math: [], tv: [], log: [], stats: null, leaves: [] };
let currentUser = null, curSub = null, curGrp = null, quiz = [], timer = null;

// --- KHỞI ĐỘNG VÀ KẾT NỐI ---
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
    const r = await fetch(API_URL + "?type=history&studentId=" + u.id);
    Data.log = await r.json();
}

function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('loader').style.display='none';
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('menuName').innerText = currentUser.name;
    document.getElementById('headerName').innerText = currentUser.role === 'admin' ? 'GV' : currentUser.name.split(" ").pop();
    if(currentUser.role === 'admin') document.getElementById('menuTeacher').classList.remove('hidden');
    else document.getElementById('menuStudent').classList.remove('hidden');
}

// --- ĐIỀU KHIỂN GIAO DIỆN (UI ROUTING) ---
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

// --- RENDER MÀN HÌNH ---
function renderDashboardAdmin() {
    contentArea.innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 fade-in">
            <button onclick="chuyenTrangQuanLy()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-users text-3xl text-blue-600"></i><span class="font-bold text-slate-700">Học sinh</span></button>
            <button onclick="moDonTu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-red-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-envelope text-3xl text-red-600"></i><span class="font-bold text-slate-700">Đơn từ</span></button>
            <button onclick="moTienDo()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-chart-line text-3xl text-purple-600"></i><span class="font-bold text-slate-700">Tiến độ</span></button>
            <button onclick="moThongBao()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-orange-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-bullhorn text-3xl text-orange-500"></i><span class="font-bold text-slate-700">Thông báo</span></button>
            <button onclick="quanLyNganHang('math')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-indigo-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-calculator text-3xl text-indigo-600"></i><span class="font-bold text-slate-700">Kho Toán</span></button>
            <button onclick="quanLyNganHang('vietnamese')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-book text-3xl text-green-600"></i><span class="font-bold text-slate-700">Kho T.Việt</span></button>
        </div>
    `;
}

// 🎯 GIAO DIỆN HỌC SINH MỚI CÓ MỤC THÔNG BÁO
function renderDashboardStudent() {
    contentArea.innerHTML = `
        <div class="text-center mb-6 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 fade-in">
            
            <button onclick="moThongBao()" class="col-span-1 md:col-span-2 relative h-32 bg-gradient-to-r from-orange-400 to-amber-500 rounded-3xl shadow-lg shadow-orange-200 flex items-center p-6 hover:-translate-y-1 transition btn-3d border-2 border-white overflow-hidden group">
                <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white text-3xl mr-4 backdrop-blur-sm border border-white/30"><i class="fas fa-bullhorn"></i></div>
                <div class="text-left"><h3 class="font-black text-2xl text-white tracking-wide">THÔNG BÁO</h3><p class="text-orange-100 text-sm font-bold mt-1">Tin nhắn từ GVCN</p></div>
                <span id="badgeNoti" class="absolute top-4 right-4 w-4 h-4 bg-red-500 rounded-full animate-ping hidden border-2 border-white"></span>
            </button>

            <button onclick="moGocHocTap()" class="relative h-48 bg-white border-4 border-indigo-50 rounded-3xl shadow-xl flex flex-col items-center justify-center hover:-translate-y-1 transition btn-3d"><div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-4xl mb-3"><i class="fas fa-rocket"></i></div><span class="font-black text-xl text-slate-700">GÓC HỌC TẬP</span></button>
            
            <button onclick="moXinPhep()" class="relative h-48 bg-white border-4 border-red-50 rounded-3xl shadow-xl flex flex-col items-center justify-center hover:-translate-y-1 transition btn-3d"><div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-4xl mb-3"><i class="fas fa-envelope-open-text"></i></div><span class="font-black text-xl text-slate-700">GỬI ĐƠN PHÉP</span></button>
        </div>
    `;
    
    // Nếu có thông báo thì hiện chấm đỏ
    if(localStorage.getItem("clsMsg") && localStorage.getItem("clsMsg").length > 0) {
        document.getElementById("badgeNoti")?.classList.remove("hidden");
    }
}

// --- THÔNG BÁO TỪ LỚP ---
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

// 🎯 HỒ SƠ HS BỔ SUNG ĐẦY ĐỦ THÔNG TIN
function viewProfile(id) {
    closeMenu();
    const s = Data.hs.find(x => x.id === id);
    document.getElementById("pfName").innerText = s.name;
    
    const renderPhoneActions = (phone) => {
        if(!phone || phone === 'undefined' || phone.trim() === '') return '<span class="text-gray-400 italic font-normal text-xs">Chưa cập nhật</span>';
        const cleanPhone = phone.toString().replace(/\D/g, ''); 
        return `
            <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">${phone}</span>
                <a href="tel:${cleanPhone}" class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm hover:bg-green-600 hover:text-white transition" title="Gọi điện"><i class="fas fa-phone-alt"></i></a>
                <a href="https://zalo.me/${cleanPhone}" target="_blank" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition" title="Nhắn Zalo"><i class="fas fa-comment"></i></a>
            </div>
        `;
    };

    document.getElementById("pfContent").innerHTML = `
        <div class="space-y-4 text-sm text-slate-600">
            <div class="flex justify-between items-center border-b pb-2 border-slate-100">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Mã Học Sinh</span>
                <span class="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">${s.id}</span>
            </div>
            <div class="flex justify-between items-center border-b pb-2 border-slate-100">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Giới tính</span>
                <span class="font-bold text-slate-800">${s.gender || 'Chưa rõ'}</span>
            </div>
            <div class="flex justify-between items-center border-b pb-2 border-slate-100">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Ngày sinh</span>
                <b class="text-slate-800">${s.dob || 'Chưa cập nhật'}</b>
            </div>
            <div class="flex justify-between items-center border-b pb-2 border-slate-100">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">SĐT Cha</span>
                ${renderPhoneActions(s.fatherPhone)}
            </div>
            <div class="flex justify-between items-center border-b pb-2 border-slate-100">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">SĐT Mẹ</span>
                ${renderPhoneActions(s.motherPhone)}
            </div>
            <div class="flex justify-between items-center border-b pb-2 border-slate-100">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Điểm Rèn Luyện</span>
                <div class="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded text-yellow-600 font-black border border-yellow-200"><i class="fas fa-gem"></i> ${s.score || 0} Kim cương</div>
            </div>
            <div class="flex flex-col border-b pb-2 border-slate-100 gap-1">
                <span class="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Địa chỉ thường trú</span>
                <b class="text-slate-800 leading-snug">${s.address || 'Chưa cập nhật'}</b>
            </div>
            ${s.note ? `<div class="bg-blue-50 p-3 rounded-xl text-blue-800 italic border border-blue-100 text-xs"><i class="fas fa-info-circle mr-1"></i> Ghi chú: ${s.note}</div>` : ''}
        </div>
    `;
    document.getElementById("modalProfile").classList.remove("hidden");
}

// --- CÁC TÍNH NĂNG CHUNG ---
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
    const total = [...new Set(math.map(x=>x.group))].length + [...new Set(vietnamese.map(x=>x.group))].length;
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

async function quanLyNganHang(sub) {
    closeMenu();
    contentArea.innerHTML = `<p class="text-center font-bold text-indigo-600 mt-10"><i class="fas fa-spinner fa-spin mr-2"></i> Đang tải câu hỏi...</p>`;
    const qs = await (await fetch(API_URL+"?type="+sub)).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">KHO ${sub=='math'?'TOÁN':'TIẾNG VIỆT'}</h2></div><div class="space-y-4">`;
    html += qs.map(q => `<div class="bg-white p-4 rounded-xl border"><span class="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded font-bold">${q.group}</span><div class="mt-2 font-bold">${q.question.replace(/\n/g,'<br>')}</div></div>`).join('');
    contentArea.innerHTML = html + "</div>";
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

function moGocHocTap() {
    closeMenu();
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">GÓC HỌC TẬP</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="alert('Tính năng làm bài đang được nạp...');" class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d">TOÁN</button>
            <button onclick="alert('Tính năng làm bài đang được nạp...');" class="bg-gradient-to-br from-green-500 to-emerald-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d">TIẾNG VIỆT</button>
        </div>
    `;
}
