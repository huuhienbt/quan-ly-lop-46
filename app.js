// ==========================================
// NÃO BỘ XỬ LÝ - V68 SIÊU TỐC (CÓ GIỚI TÍNH, ZALO, GỌI ĐIỆN)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbzpuACT7j54WUonp3-WAoiiWET2XzE10WLSRZdvR8el0Ov0jlKezq2uqnkaT7NolRbJyg/exec";
const AD_PASS = "123456";

let Data = { hs: [], math: [], tv: [], log: [], stats: null, leaves: [] };
let currentUser = null, curSub = null, curGrp = null, quiz = [], timer = null;

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
    document.getElementById('headerName').innerText = currentUser.role === 'admin' ? 'GV' : currentUser.name;
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

function renderDashboardStudent() {
    contentArea.innerHTML = `
        <div class="text-center mb-6 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in">
            <button onclick="moGocHocTap()" class="h-60 bg-gradient-to-br from-indigo-100 to-white border-4 border-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center btn-3d"><i class="fas fa-rocket text-6xl text-indigo-600 mb-4"></i><span class="font-black text-2xl text-slate-700">GÓC HỌC TẬP</span></button>
            <button onclick="moXinPhep()" class="h-60 bg-gradient-to-br from-orange-100 to-white border-4 border-white rounded-[2rem] shadow-xl flex flex-col items-center justify-center btn-3d"><i class="fas fa-envelope text-6xl text-orange-500 mb-4"></i><span class="font-black text-2xl text-slate-700">GỬI ĐƠN PHÉP</span></button>
        </div>
    `;
}

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

// 🎯 HÀM RENDER HỒ SƠ HS (CÓ GIỚI TÍNH, GỌI ĐIỆN, ZALO)
function viewProfile(id) {
    const s = Data.hs.find(x => x.id === id);
    document.getElementById("pfName").innerText = s.name;
    
    // Tự động tạo nút Gọi & Zalo từ SĐT
    const renderPhoneActions = (phone) => {
        if(!phone || phone === 'undefined') return '<span class="text-gray-400 italic font-normal">Chưa cập nhật</span>';
        const cleanPhone = phone.toString().replace(/\D/g, ''); // Lọc chỉ lấy số
        return `
            <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800">${phone}</span>
                <a href="tel:${cleanPhone}" class="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm hover:bg-green-600 hover:text-white transition" title="Gọi điện"><i class="fas fa-phone-alt"></i></a>
                <a href="https://zalo.me/${cleanPhone}" target="_blank" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm hover:bg-blue-600 hover:text-white transition" title="Nhắn Zalo"><i class="fas fa-comment"></i></a>
            </div>
        `;
    };

    // Chèn dữ liệu vào bảng
    document.getElementById("pfContent").innerHTML = `
        <div class="space-y-4 text-sm text-slate-600">
            <div class="flex justify-between items-center border-b pb-2">
                <span class="font-bold text-gray-400 uppercase text-xs">Giới tính</span>
                <span class="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">${s.gender || 'Chưa rõ'}</span>
            </div>
            <div class="flex justify-between items-center border-b pb-2">
                <span class="font-bold text-gray-400 uppercase text-xs">Ngày sinh</span>
                <b class="text-slate-800">${s.dob || 'Chưa cập nhật'}</b>
            </div>
            <div class="flex justify-between items-center border-b pb-2">
                <span class="font-bold text-gray-400 uppercase text-xs">SĐT Cha</span>
                ${renderPhoneActions(s.fatherPhone)}
            </div>
            <div class="flex justify-between items-center border-b pb-2">
                <span class="font-bold text-gray-400 uppercase text-xs">SĐT Mẹ</span>
                ${renderPhoneActions(s.motherPhone)}
            </div>
            <div class="flex justify-between items-start border-b pb-2">
                <span class="font-bold text-gray-400 uppercase text-xs w-20">Địa chỉ</span>
                <b class="text-slate-800 text-right flex-1 leading-tight">${s.address || 'Chưa cập nhật'}</b>
            </div>
            ${s.note ? `<div class="bg-yellow-50 p-3 rounded-xl text-yellow-800 italic border border-yellow-100"><i class="fas fa-sticky-note mr-2"></i>${s.note}</div>` : ''}
        </div>
    `;

    document.getElementById("modalProfile").classList.remove("hidden");
}

function closeModal(modalId) { document.getElementById(modalId).classList.add('hidden'); }

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
            <button onclick="alert('Tính năng làm bài trắc nghiệm đang được nạp vào V68...');" class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d">TOÁN</button>
            <button onclick="alert('Tính năng làm bài trắc nghiệm đang được nạp vào V68...');" class="bg-gradient-to-br from-green-500 to-emerald-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d">TIẾNG VIỆT</button>
        </div>
    `;
}
