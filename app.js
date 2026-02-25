// ==========================================
// NÃO BỘ XỬ LÝ - V68 BẢN CHUẨN (KHÔI PHỤC NÚT LINK)
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycbzpuACT7j54WUonp3-WAoiiWET2XzE10WLSRZdvR8el0Ov0jlKezq2uqnkaT7NolRbJyg/exec";
const AD_PASS = "0982827538";

let Data = { hs: [], math: [], tv: [], log: [], stats: null, leaves: [], notiList: [] };
let currentUser = null, curSub = null, curGrp = null, quiz = [], timer = null, score = 0, currentQIndex = 0;
let wrongAnswersLog = []; 

window.onload = async () => {
    try {
        const [resHs, resNoti] = await Promise.all([fetch(API_URL + "?type=students&t=" + Date.now()), fetch(API_URL + "?type=thong_bao&t=" + Date.now())]);
        Data.hs = await resHs.json(); Data.notiList = await resNoti.json();
        document.getElementById('connStatus').innerText = "Đã kết nối dữ liệu thành công!"; document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-green-500";
        const role = localStorage.getItem('role');
        if(role === 'admin') loginAdmin(); else if(role === 'student') { const u = Data.hs.find(x => x.id === localStorage.getItem('uid')); if(u) loginStudent(u); else loginGuest(); } else loginGuest();
    } catch(e) { document.getElementById('connStatus').innerText = "Lỗi mạng hoặc Link API bị sai!"; document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-red-500"; loginGuest(); }
};

function loginGuest() { currentUser = null; setupUI(); moThongBao(); }

function showLogin() { 
    closeMenu(); document.getElementById('mainApp').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); 
    if(!document.getElementById('btnBackGuest')) {
        const loginForm = document.querySelector('#loginScreen > div'); 
        if(loginForm) {
            const btn = document.createElement('button'); btn.id = 'btnBackGuest'; btn.className = 'w-full mt-5 text-slate-500 font-bold text-sm hover:text-indigo-600 transition flex items-center justify-center gap-2'; btn.innerHTML = '<i class="fas fa-arrow-left"></i> Quay lại Trang chủ Lớp';
            btn.onclick = () => { document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('mainApp').classList.remove('hidden'); if(!currentUser) loginGuest(); };
            loginForm.appendChild(btn);
        }
    }
}

function login() {
    const v = document.getElementById('inputLogin').value.trim();
    if(v === AD_PASS) { localStorage.setItem('role','admin'); loginAdmin(); return; }
    const u = Data.hs.find(s => s.fatherPhone.includes(v) || s.motherPhone.includes(v));
    if(u) { localStorage.setItem('role','student'); localStorage.setItem('uid',u.id); loginStudent(u); } else alert("Sai SĐT hoặc mật khẩu!");
}

function loginAdmin() { currentUser = { role: 'admin', name: "Thầy Hiển" }; setupUI(); renderDashboardAdmin(); }
async function loginStudent(u) { currentUser = { ...u, role: 'student' }; setupUI(); moThongBao(); }

function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('loader').style.display='none'; document.getElementById('mainApp').classList.remove('hidden');
    const headerNameEl = document.getElementById('headerName'); const badgeDiv = headerNameEl ? headerNameEl.closest('[onclick]') : null; 
    const roleTextEl = badgeDiv ? badgeDiv.querySelector('p') : null; const avatarBox = badgeDiv ? badgeDiv.querySelector('div.bg-white') : null; 
    const logoutBtn = document.querySelector('[onclick="logout()"]');

    if(currentUser) {
        if(headerNameEl) headerNameEl.innerText = currentUser.role === 'admin' ? 'GVCN' : currentUser.name.split(" ").pop();
        document.getElementById('menuName').innerText = currentUser.name; 
        if(badgeDiv) badgeDiv.setAttribute('onclick', 'toggleMenu()');
        if(roleTextEl) { roleTextEl.style.display = 'block'; roleTextEl.innerText = currentUser.role === 'admin' ? 'GVCN' : 'HỌC SINH'; }
        if(avatarBox) { avatarBox.style.display = 'flex'; avatarBox.innerHTML = currentUser.role === 'admin' ? '<i class="fas fa-chalkboard-teacher text-blue-600"></i>' : '<i class="fas fa-user-graduate text-blue-600"></i>'; }
        if(logoutBtn) logoutBtn.style.display = '';

        if(currentUser.role === 'admin') {
            document.getElementById('menuTeacher').innerHTML = `<div onclick="chuyenTrangQuanLy()" class="p-3 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-users text-blue-600 w-6"></i> Quản lý Học sinh</div><div onclick="moThongBao()" class="p-3 hover:bg-orange-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-bullhorn text-orange-600 w-6"></i> Quản lý Bảng tin</div><div onclick="moDonTu()" class="p-3 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-envelope-open-text text-red-600 w-6"></i> Hộp thư xin phép</div><div onclick="moTienDo()" class="p-3 hover:bg-purple-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-chart-line text-purple-600 w-6"></i> Tiến độ Học tập</div><div onclick="quanLyNganHang('math')" class="p-3 hover:bg-indigo-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-calculator text-indigo-600 w-6"></i> Kho Toán</div><div onclick="quanLyNganHang('vietnamese')" class="p-3 hover:bg-green-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-book text-green-600 w-6"></i> Kho Tiếng Việt</div>`;
            document.getElementById('menuTeacher').classList.remove('hidden'); document.getElementById('menuStudent').classList.add('hidden');
        } else {
            document.getElementById('menuStudent').innerHTML = `<div onclick="viewProfile(currentUser.id)" class="p-3 hover:bg-yellow-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-id-card text-yellow-600 w-6"></i> Hồ sơ cá nhân</div><div onclick="moXinPhep()" class="p-3 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-envelope-open-text text-red-600 w-6"></i> Hộp thư</div>`;
            document.getElementById('menuStudent').classList.remove('hidden'); document.getElementById('menuTeacher').classList.add('hidden');
        }
    } else {
        if(headerNameEl) headerNameEl.innerText = "Đăng nhập"; document.getElementById('menuName').innerText = "Khách"; 
        if(badgeDiv) badgeDiv.setAttribute('onclick', 'showLogin()'); 
        if(roleTextEl) roleTextEl.style.display = 'none'; if(avatarBox) avatarBox.style.display = 'none'; if(logoutBtn) logoutBtn.style.display = 'none';
        document.getElementById('menuStudent').innerHTML = `<div onclick="showLogin()" class="p-4 bg-blue-50 text-blue-700 rounded-xl font-black flex items-center gap-3 cursor-pointer mb-3 shadow-sm hover:bg-blue-100 transition border border-blue-100"><i class="fas fa-sign-in-alt w-6 text-xl"></i> ĐĂNG NHẬP NGAY</div><div onclick="moGocHocTap()" class="p-3 hover:bg-slate-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer text-slate-600"><i class="fas fa-rocket w-6 text-indigo-500"></i> Góc học tập</div><div onclick="moXinPhep()" class="p-3 hover:bg-slate-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer text-slate-600"><i class="fas fa-envelope-open-text w-6 text-red-500"></i> Hộp thư xin phép</div>`;
        document.getElementById('menuStudent').classList.remove('hidden'); document.getElementById('menuTeacher').classList.add('hidden');
    }
}

const contentArea = document.getElementById('content');
function toggleMenu() { document.getElementById('appMenu').classList.toggle('hidden'); }
function closeMenu() { document.getElementById('appMenu').classList.add('hidden'); }
function logout() { localStorage.clear(); location.reload(); }
function veTrangChu() { closeMenu(); clearInterval(timer); if(!currentUser) moThongBao(); else if(currentUser.role === 'admin') renderDashboardAdmin(); else moThongBao(); }

function renderDashboardAdmin() {
    contentArea.innerHTML = `<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 fade-in"><button onclick="chuyenTrangQuanLy()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-users text-3xl text-blue-600"></i><span class="font-bold text-slate-700">Học sinh</span></button><button onclick="moThongBao()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-orange-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-bullhorn text-3xl text-orange-500"></i><span class="font-bold text-slate-700">Bảng tin</span></button><button onclick="moDonTu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-red-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-envelope text-3xl text-red-600"></i><span class="font-bold text-slate-700">Hộp thư</span></button><button onclick="moTienDo()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-chart-line text-3xl text-purple-600"></i><span class="font-bold text-slate-700">Tiến độ</span></button><button onclick="quanLyNganHang('math')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-indigo-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-calculator text-3xl text-indigo-600"></i><span class="font-bold text-slate-700">Kho Toán</span></button><button onclick="quanLyNganHang('vietnamese')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-book text-3xl text-green-600"></i><span class="font-bold text-slate-700">Kho T.Việt</span></button></div>`;
}

function getNavHtml(active) {
    if (currentUser && currentUser.role === 'admin') {
        let title = active === 'bangtin' ? 'BẢNG TIN LỚP' : (active === 'hoctap' ? 'GÓC HỌC TẬP' : 'HỘP THƯ');
        return `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-orange-500 uppercase">${title}</h2></div>`;
    }
    let headerGreeting = "";
    if (currentUser && currentUser.role === 'student') headerGreeting = `<div class="mb-5 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2></div>`;
    return `${headerGreeting}<div class="flex items-center gap-6 sm:gap-10 mb-6 border-b-2 border-slate-100 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide"><button onclick="moThongBao()" class="font-black text-base sm:text-xl pb-2 transition ${active==='bangtin' ? 'text-orange-500 border-b-4 border-orange-500' : 'text-slate-400 hover:text-orange-500'}">BẢNG TIN LỚP</button><button onclick="moGocHocTap()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hoctap' ? 'text-indigo-600 border-b-4 border-indigo-500' : 'text-slate-400 hover:text-indigo-500'}">GÓC HỌC TẬP</button><button onclick="moXinPhep()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hopthu' ? 'text-red-600 border-b-4 border-red-500' : 'text-slate-400 hover:text-red-500'}">HỘP THƯ</button></div>`;
}

function moThongBao() { 
    closeMenu(); 
    let btnTaoMoi = currentUser && currentUser.role === 'admin' ? `<button onclick="editNotiUI(null)" class="w-full mb-6 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg btn-3d hover:bg-orange-700 transition flex items-center justify-center gap-2"><i class="fas fa-plus-circle text-xl"></i> TẠO BÀI VIẾT MỚI</button>` : ''; 
    let sortedList = [...Data.notiList].sort((a, b) => { const getVal = (item) => { let rawT = item.time.includes('|||') ? item.time.split('|||')[1] : item.time; const m = String(rawT).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? parseInt(m[3] + m[2] + m[1]) : 0; }; let dateA = getVal(a), dateB = getVal(b); if (dateA !== dateB) return dateB - dateA; return (parseInt(String(b.id).replace(/\D/g,''))||0) - (parseInt(String(a.id).replace(/\D/g,''))||0); }); 
    let listHtml = ""; 
    if (sortedList.length === 0) listHtml = `<div class="text-center py-10 opacity-60"><i class="fas fa-inbox text-6xl text-slate-300 mb-3"></i><p class="font-bold text-slate-400">Chưa có bài viết nào.</p></div>`; 
    else { 
        listHtml = sortedList.map(tb => { 
            let adminButtons = currentUser && currentUser.role === 'admin' ? `<div class="flex gap-2 mt-4 pt-3 border-t border-orange-100"><button onclick="editNotiUI('${tb.id}')" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-100 transition text-sm flex items-center justify-center gap-1"><i class="fas fa-edit"></i> Sửa</button><button onclick="xoaThongBao('${tb.id}')" class="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold hover:bg-red-100 transition text-sm flex items-center justify-center gap-1"><i class="fas fa-trash-alt"></i> Xóa</button></div>` : ''; 
            let cleanContent = tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '') : ""; 
            let typeStr = "Thông báo"; let displayTime = tb.time; let iconHtml = '<i class="fas fa-bullhorn"></i>'; let colorTheme = 'bg-orange-100 text-orange-600';
            if (tb.time.includes('|||')) { 
                let parts = tb.time.split('|||'); typeStr = parts[0]; displayTime = parts[1]; 
                if(typeStr === 'THÔNG BÁO TỪ GVCN' || typeStr === 'Thông báo chung') typeStr = 'Thông báo'; 
                if(typeStr === 'HOẠT ĐỘNG LỚP 4/6' || typeStr === 'Hoạt động lớp') typeStr = 'Hoạt động'; 
                if (typeStr === 'Hoạt động') { iconHtml = '<i class="fas fa-camera-retro"></i>'; colorTheme = 'bg-green-100 text-green-600'; } 
            } else { displayTime = tb.time; }
            return `<div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-5 relative fade-in hover:shadow-md transition w-full overflow-hidden"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 ${colorTheme} rounded-full flex items-center justify-center text-lg shrink-0">${iconHtml}</div><div><h3 class="font-black text-slate-800 text-sm uppercase tracking-wide">${typeStr}</h3><p class="text-[11px] font-bold text-slate-400"><i class="fas fa-clock mr-1"></i> ${displayTime}</p></div></div><div class="text-slate-700 text-base w-full overflow-hidden break-words pl-1 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_img]:inline-block [&_a]:text-blue-600 [&_a]:underline [&_a]:font-bold">${cleanContent}</div>${adminButtons}</div>`; 
        }).join(''); 
    } 
    contentArea.innerHTML = `${getNavHtml('bangtin')}${btnTaoMoi}<div class="space-y-4 pb-10">${listHtml}</div>`; 
}

function moGocHocTap() { 
    closeMenu(); 
    contentArea.innerHTML = `${getNavHtml('hoctap')}<div class="grid grid-cols-1 md:grid-cols-2 gap-4"><button onclick="loadSubject('math')" class="bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition"><i class="fas fa-calculator text-4xl mb-2 block"></i>TOÁN</button><button onclick="loadSubject('vietnamese')" class="bg-gradient-to-br from-green-500 to-emerald-600 text-white h-40 rounded-2xl font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition"><i class="fas fa-book-open text-4xl mb-2 block"></i>TIẾNG VIỆT</button></div>`; 
}

// ==========================================
// 🎯 FORM TẠO BÀI (ĐÃ CÓ LẠI NÚT LINK)
// ==========================================
window.currentSelectedImg = null;

function editNotiUI(idToEdit) { 
    const isEdit = idToEdit != null; const tb = isEdit ? Data.notiList.find(x => x.id === idToEdit) : null; 
    const d = new Date(); const dateStr = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); 
    const firstDay = new Date(d.getFullYear(), 0, 1); const weekNum = Math.ceil((((d - firstDay) / 86400000) + firstDay.getDay() + 1) / 7); 
    let defaultTimeStr = `Ngày ${dateStr} - Tuần ${weekNum}`; let defaultType = 'Thông báo';
    
    if (isEdit) { 
        if (tb.time.includes('|||')) { 
            let parts = tb.time.split('|||'); defaultType = parts[0]; defaultTimeStr = parts[1]; 
            if(defaultType === 'THÔNG BÁO TỪ GVCN' || defaultType === 'Thông báo chung') defaultType = 'Thông báo'; 
            if(defaultType === 'HOẠT ĐỘNG LỚP 4/6' || defaultType === 'Hoạt động lớp') defaultType = 'Hoạt động'; 
        } else { defaultTimeStr = tb.time; } 
    }
    const currentContent = isEdit && tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '') : ""; 
    
    contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="moThongBao()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-times text-slate-500"></i></button><h2 class="font-black text-xl text-orange-600 uppercase">${isEdit ? 'SỬA BÀI VIẾT' : 'TẠO BÀI VIẾT MỚI'}</h2></div>
    <div class="bg-white p-4 sm:p-6 rounded-[2rem] shadow-lg border space-y-4 fade-in w-full overflow-hidden">
        <input type="hidden" id="frmNotiId" value="${idToEdit || ''}">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại bài viết</label><select id="frmNotiType" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400 transition"><option value="Thông báo" ${defaultType === 'Thông báo' ? 'selected' : ''}>📣 Thông báo</option><option value="Hoạt động" ${defaultType === 'Hoạt động' ? 'selected' : ''}>📸 Hoạt động</option></select></div>
            <div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian hiển thị</label><input type="text" id="frmNotiTime" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400" value="${defaultTimeStr}"></div>
        </div>
        <div class="w-full">
            <label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Nội dung</label>
            <div class="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200 items-center">
                <button onclick="document.execCommand('bold', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 font-black">B</button>
                <button onclick="document.execCommand('italic', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 italic font-serif">I</button>
                <div class="relative flex items-center bg-white rounded shadow-sm px-1 hover:bg-slate-200 h-8" title="Màu chữ"><input type="color" onchange="document.execCommand('foreColor', false, this.value)" class="w-5 h-5 border-0 bg-transparent cursor-pointer"></div>
                <div class="w-px h-6 bg-slate-300 mx-1"></div>
                <button onclick="document.execCommand('justifyLeft', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn trái"><i class="fas fa-align-left"></i></button>
                <button onclick="document.execCommand('justifyCenter', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn giữa"><i class="fas fa-align-center"></i></button>
                <button onclick="document.execCommand('justifyRight', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn phải"><i class="fas fa-align-right"></i></button>
                <button onclick="document.execCommand('justifyFull', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn đều 2 bên"><i class="fas fa-align-justify"></i></button>
                <div class="w-px h-6 bg-slate-300 mx-1"></div>
                <select onchange="document.execCommand('fontSize', false, this.value)" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ chữ</option><option value="1">Rất nhỏ</option><option value="2">Nhỏ</option><option value="3">Vừa</option><option value="4">Lớn</option><option value="5">Rất Lớn</option><option value="6">Khổng lồ</option></select>
                <select onchange="changeLineSpacing(this.value)" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Giãn dòng</option><option value="1.2">Nhỏ (1.2)</option><option value="1.6">Vừa (1.6)</option><option value="2.0">Rộng (2.0)</option></select>
                <div class="w-px h-6 bg-slate-300 mx-1"></div>
                
                <button onclick="chenAnhVaoThongBao()" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-indigo-600 font-bold text-xs flex items-center gap-1"><i class="fas fa-upload"></i> Thêm Ảnh</button>
                
                <button onclick="chenFileVaoThongBao()" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-blue-600 font-bold text-xs flex items-center gap-1"><i class="fas fa-link"></i> Link</button>

                <div class="w-px h-6 bg-slate-300 mx-1"></div>
                <span class="text-[10px] text-slate-400 font-bold ml-1">Cỡ ảnh:</span>
                <button onclick="resizeImg('30%')" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-orange-100 text-slate-700 font-bold text-[11px]" title="Ảnh nhỏ">Nhỏ</button>
                <button onclick="resizeImg('60%')" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-orange-100 text-slate-700 font-bold text-[11px]" title="Ảnh vừa">Vừa</button>
                <button onclick="resizeImg('100%')" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-orange-100 text-slate-700 font-bold text-[11px]" title="Ảnh lớn">Lớn</button>
            </div>
            <div id="frmNotiContent" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[200px] bg-white border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:inline-block [&_img]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline">${currentContent}</div>
        </div>
        <button onclick="luuThongBaoLenServer()" class="w-full bg-orange-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-orange-700 transition">${isEdit ? 'LƯU THAY ĐỔI' : 'ĐĂNG LÊN HỆ THỐNG'}</button>
    </div>`; 
}

window.handleEditorClick = function(e) {
    document.querySelectorAll('#frmNotiContent img').forEach(img => img.style.border = 'none');
    window.currentSelectedImg = null;
    if (e.target.tagName === 'IMG') {
        e.target.style.border = '3px dashed #f97316'; 
        window.currentSelectedImg = e.target;
    }
};

window.resizeImg = function(size) {
    if(!window.currentSelectedImg) return alert("Thầy hãy bấm chọn một tấm ảnh ở dưới trước khi chỉnh kích thước nhé!");
    window.currentSelectedImg.style.width = size;
    window.currentSelectedImg.style.height = 'auto';
};

async function luuThongBaoLenServer() { 
    document.querySelectorAll('#frmNotiContent img').forEach(img => img.style.border = 'none');
    window.currentSelectedImg = null;

    const id = document.getElementById("frmNotiId").value; 
    const typeStr = document.getElementById("frmNotiType").value;
    const timeVal = document.getElementById("frmNotiTime").value;
    const finalTimeStr = typeStr + "|||" + timeVal; 
    const contentHTML = document.getElementById("frmNotiContent").innerHTML; 
    
    if(!timeVal || !contentHTML.trim()) return alert("Vui lòng nhập nội dung!"); 
    document.getElementById('loader').style.display = 'flex'; 
    try { 
        const act = id ? 'sua_thong_bao' : 'dang_thong_bao'; 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, data: { id: id, time: finalTimeStr, content: contentHTML } }) }); 
        if(id) { const idx = Data.notiList.findIndex(x => x.id === id); if(idx > -1) { Data.notiList[idx].time = finalTimeStr; Data.notiList[idx].content = contentHTML; } } else { Data.notiList.unshift({ id: "TB"+Date.now(), time: finalTimeStr, content: contentHTML }); } 
        localStorage.setItem('L46_Data_Cache', JSON.stringify(Data)); document.getElementById('loader').style.display = 'none'; alert("Đăng bài thành công!"); moThongBao(); 
    } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng!"); } 
}

function chenAnhVaoThongBao() { 
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
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7); const base64Data = dataUrl.split(',')[1];
                try {
                    const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) });
                    const result = await response.json();
                    if(result.url) { document.getElementById("frmNotiContent").focus(); document.execCommand('insertHTML', false, `<div style="text-align: center;"><img src="${result.url}" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block;"></div><br>`); } else { alert("Lỗi! Không lấy được link ảnh từ Server."); }
                } catch(err) { alert("Lỗi mạng khi tải ảnh lên!"); }
                document.getElementById('loader').style.display = 'none';
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function chenFileVaoThongBao() { const url = prompt("Dán đường link:"); if(url) { const tenLink = prompt("Nhập tên hiển thị:", "Bấm vào đây"); if(tenLink) { document.getElementById("frmNotiContent").focus(); document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${tenLink}</a>`); } } }
window.changeLineSpacing = function(val) { if(!val) return; document.execCommand('formatBlock', false, 'DIV'); const sel = window.getSelection(); if(sel.rangeCount > 0) { let node = sel.anchorNode; if(node.nodeType === 3) node = node.parentNode; while(node && node.id !== 'frmNotiContent') { if(node.nodeName === 'DIV' || node.nodeName === 'P') { node.style.lineHeight = val; break; } node = node.parentNode; } } };
async function xoaThongBao(id) { if(confirm("Xóa thông báo này vĩnh viễn?")) { document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'xoa_thong_bao', data: { id: id } }) }); Data.notiList = Data.notiList.filter(x => x.id !== id); localStorage.setItem('L46_Data_Cache', JSON.stringify(Data)); document.getElementById('loader').style.display = 'none'; moThongBao(); } }

// ==========================================
// 🎯 KHO CÂU HỎI THEO TUẦN (GIỮ NGUYÊN)
// ==========================================
async function quanLyNganHang(sub) { 
    closeMenu(); curSub = sub; 
    contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải dữ liệu...</p></div>`; 
    const qs = await (await fetch(API_URL+"?type="+sub+"&t="+Date.now())).json(); 
    Data[sub] = qs; 
    const groups = [...new Set(qs.map(q => q.group))].sort(); 
    let filterOptions = `<option value="all">-- Tất cả các Tuần --</option>` + groups.map(g => `<option value="${g}">${g}</option>`).join(''); 
    contentArea.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">KHO ${sub === 'math' ? 'TOÁN' : 'T.VIỆT'}</h2></div>
            <button onclick="renderFormCauHoi(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold btn-3d text-sm"><i class="fas fa-plus mr-1"></i> Tạo câu mới</button>
        </div>
        <select id="qFilter" onchange="filterQuestions()" class="w-full p-3 rounded-xl border-2 border-slate-200 mb-6 font-bold text-slate-700 outline-none focus:border-indigo-500">${filterOptions}</select>
        <div id="listQuestions" class="space-y-4"></div>
    `; 
    filterQuestions();  
}

function filterQuestions() { 
    const val = document.getElementById("qFilter").value; 
    let list = val === 'all' ? Data[curSub] : Data[curSub].filter(q => q.group === val); 
    
    if (list.length === 0) { document.getElementById("listQuestions").innerHTML = '<p class="text-center text-slate-400 py-10">Trống</p>'; return; }

    let grouped = {};
    list.forEach(q => { if (!grouped[q.group]) grouped[q.group] = []; grouped[q.group].push(q); });

    let sortedGroups = Object.keys(grouped).sort((a, b) => { let numA = parseInt(a.replace(/\D/g, '')) || 0; let numB = parseInt(b.replace(/\D/g, '')) || 0; if(numA !== numB) return numA - numB; return a.localeCompare(b); });

    let html = "";
    sortedGroups.forEach(grp => {
        let questions = grouped[grp];
        html += `<div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-6 fade-in"><div class="flex items-center justify-between border-b-2 border-indigo-50 pb-3 mb-4"><div class="flex items-center gap-2"><i class="fas fa-layer-group text-indigo-500 text-xl"></i><h3 class="font-black text-lg text-slate-800 uppercase">${grp}</h3></div><span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">${questions.length} câu</span></div><div class="space-y-3">`;
        questions.forEach((q, index) => {
            html += `<div class="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition relative"><div class="flex justify-between items-start"><div class="flex gap-3 w-full pr-16"><span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">${index + 1}</span><div class="font-medium text-slate-700 text-base mt-1 overflow-hidden break-words w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mt-2">${parseImg(q.question)}</div></div><div class="flex gap-2 absolute top-4 right-4"><button onclick="renderFormCauHoi('${q.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm" title="Sửa"><i class="fas fa-edit"></i></button><button onclick="xoaCauHoi('${q.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm" title="Xóa"><i class="fas fa-trash"></i></button></div></div></div>`;
        });
        html += `</div></div>`; 
    });
    document.getElementById("listQuestions").innerHTML = html; 
}

function renderFormCauHoi(id) { const q = id ? Data[curSub].find(x => x.id === id) : { group: '', time: 10, question: '', a: '', b: '', c: '', d: '', correct: 'a' }; const groups = [...new Set(Data[curSub].map(x => x.group))]; const dl = `<datalist id="groupList">${groups.map(g => `<option value="${g}">`).join('')}</datalist>`; contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="quanLyNganHang('${curSub}')" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-600">${id ? 'SỬA CÂU HỎI' : 'TẠO CÂU HỎI MỚI'}</h2></div><div class="bg-white p-5 rounded-3xl shadow border space-y-4 fade-in">${dl}<div class="grid grid-cols-3 gap-3"><div class="col-span-2"><label class="text-xs font-bold text-slate-500 uppercase">Tên Bài Tập (Ví dụ: Tuần 21)</label><input type="text" id="frmG" list="groupList" value="${q.group}" class="edit-input w-full mt-1" placeholder="Ví dụ: Tuần 21"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Phút</label><input type="number" id="frmT" value="${q.time}" class="edit-input w-full mt-1 text-center"></div></div><div><label class="text-xs font-bold text-slate-500 uppercase">Nội dung câu hỏi</label><textarea id="frmQ" rows="3" class="edit-input w-full mt-1">${q.question}</textarea></div><div class="grid grid-cols-2 gap-3"><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án A</label><input type="text" id="frmA" value="${q.a}" class="edit-input w-full mt-1"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án B</label><input type="text" id="frmB" value="${q.b}" class="edit-input w-full mt-1"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án C</label><input type="text" id="frmC" value="${q.c}" class="edit-input w-full mt-1"></div><div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án D</label><input type="text" id="frmD" value="${q.d}" class="edit-input w-full mt-1"></div></div><div><label class="text-xs font-bold text-slate-500 uppercase">Chọn Đáp Án Đúng</label><select id="frmCorr" class="edit-input w-full mt-1 bg-yellow-50 text-yellow-800 border-yellow-200"><option value="a" ${q.correct=='a'?'selected':''}>Đáp án A</option><option value="b" ${q.correct=='b'?'selected':''}>Đáp án B</option><option value="c" ${q.correct=='c'?'selected':''}>Đáp án C</option><option value="d" ${q.correct=='d'?'selected':''}>Đáp án D</option></select></div><button onclick="luuCauHoi('${id || ''}')" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black btn-3d shadow-lg mt-4">LƯU CÂU HỎI LÊN HỆ THỐNG</button></div>`; }
async function luuCauHoi(id) { const data = { id: id, subject: curSub, group: document.getElementById("frmG").value, time: document.getElementById("frmT").value, question: document.getElementById("frmQ").value, a: document.getElementById("frmA").value, b: document.getElementById("frmB").value, c: document.getElementById("frmC").value, d: document.getElementById("frmD").value, correct: document.getElementById("frmCorr").value, image: "" }; if(!data.group || !data.question) return alert("Vui lòng điền đủ Tên bài và Câu hỏi!"); document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: id ? 'sua_cau_hoi' : 'them_cau_hoi', data: data }) }); alert("Lưu thành công!"); document.getElementById('loader').style.display = 'none'; quanLyNganHang(curSub); }
async function xoaCauHoi(id) { if(confirm("Thầy có chắc chắn muốn xóa câu hỏi này không?")) { document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: 'xoa_cau_hoi', data: { id: id, subject: curSub } }) }); alert("Đã xóa!"); document.getElementById('loader').style.display = 'none'; quanLyNganHang(curSub); } }

// CÁC HÀM XỬ LÝ SINH VIÊN VÀ BÀI TẬP BÊN DƯỚI GIỮ NGUYÊN
async function loadSubject(sub) { 
    if(!currentUser) return showLogin(); 
    curSub = sub; 
    if(Data[sub] && Data[sub].length > 0) { renderSubjectData(sub); } else { contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải dữ liệu...</p></div>`; }
    const qsRes = await fetch(API_URL + "?type=" + sub + "&t=" + Date.now()); const qs = await qsRes.json(); Data[sub] = qs; localStorage.setItem('L46_Data_Cache', JSON.stringify(Data)); renderSubjectData(sub);
}
function renderSubjectData(sub) {
    const qs = Data[sub]; const grps = [...new Set(qs.map(x => x.group))].sort(); let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2></div><div class="space-y-3">`; 
    if(grps.length === 0) html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`; 
    else grps.forEach(g => { 
        const isDone = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g); 
        const time = qs.find(q => q.group === g).time || 10; const count = qs.filter(q => q.group === g).length; 
        html += `<div onclick="startQuiz('${g}', ${time})" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${isDone ? 'border-green-100 bg-green-50/30' : 'border-indigo-50'}"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}"><i class="fas ${isDone ? 'fa-check' : 'fa-star'}"></i></div><div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p></div></div>${!isDone ? '<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>' : ''}</div>`; 
    }); 
    contentArea.innerHTML = html + `</div>`;
}
function startQuiz(group, timeMins) { curGrp = group; quiz = Data[curSub].filter(q => q.group === group).sort(() => Math.random() - 0.5).slice(0, 10); currentQIndex = 0; score = 0; wrongAnswersLog = []; renderQuizFrame(); renderQuestion(0); startTimer(timeMins * 60); }
function renderQuizFrame() { contentArea.innerHTML = `<div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4"><div class="flex items-center gap-3"><button onclick="loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-indigo-900 truncate max-w-[150px]">${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div><div id="quizBox" class="bg-white p-5 rounded-3xl shadow-xl border-4 border-white min-h-[400px]"></div>`; }
function renderQuestion(index) { if (index >= quiz.length) { finishQuiz(); return; } const q = quiz[index]; document.getElementById("quizBox").innerHTML = `<div class="mb-6 fade-in"><div class="text-sm font-bold text-indigo-500 mb-2">Câu ${index + 1} / ${quiz.length}</div><div class="text-xl font-bold text-slate-800">${parseImg(q.question)}</div></div><div class="space-y-3 fade-in">${['a','b','c','d'].map(key => `<div onclick="checkAns(this, '${key}', '${q.correct}', ${index})" class="quiz-option p-4 border-2 border-slate-100 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition"><span class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase">${key}</span><div class="font-bold text-slate-700 flex-1">${parseImg(q[key])}</div></div>`).join('')}</div>`; }
function checkAns(el, selected, correct, index) { document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70')); const q = quiz[index]; if (selected === correct.toLowerCase()) { el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800'); score += 10; } else { el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800'); let wrongText = `<div class="bg-white p-3 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2">Câu ${index+1}: ${q.question}</p><p class="text-red-600"><i class="fas fa-times-circle mr-1"></i> Bé chọn: <b>${selected.toUpperCase()}</b></p><p class="text-green-600 mt-1"><i class="fas fa-check-circle mr-1"></i> Đúng là: <b>${correct.toUpperCase()}</b></p></div>`; wrongAnswersLog.push(wrongText); } setTimeout(() => renderQuestion(index + 1), 1200); }
function startTimer(seconds) { clearInterval(timer); let t = seconds; timer = setInterval(() => { let m = Math.floor(t / 60), s = t % 60; document.getElementById('quizTimer').innerText = `${m}:${s < 10 ? '0' + s : s}`; if (t <= 0) { clearInterval(timer); alert("Hết giờ làm bài!"); finishQuiz(); } t--; }, 1000); }
async function finishQuiz() { clearInterval(timer); document.getElementById("quizBox").innerHTML = `<div class="text-center py-10 fade-in"><div class="text-7xl mb-6 animate-bounce">🏆</div><h3 class="text-2xl font-black text-slate-800 mb-2">ĐIỂM CỦA BẠN</h3><p class="text-6xl font-black text-indigo-600 mb-8">${score}</p><button onclick="loadSubject(curSub)" class="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-lg btn-3d shadow-lg w-full">Trở về Danh sách</button></div>`; if(currentUser.role === 'student') { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score, details: wrongAnswersLog.join('') } }) }); Data.log.push({ id: currentUser.id, subject: curSub, group: curGrp, score: score, details: wrongAnswersLog.join('') }); localStorage.setItem('L46_Data_Cache', JSON.stringify(Data)); } }
function moXinPhep() { if(!currentUser) return showLogin(); closeMenu(); contentArea.innerHTML = `${getNavHtml('hopthu')}<div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5 fade-in"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Ngày nghỉ</label><input type="date" id="lDate" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700"></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại xin phép</label><select id="lType" onchange="changeLeaveType()" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Nghỉ học và bán trú">Nghỉ học và bán trú</option><option value="Nghỉ Bán trú">Nghỉ Bán trú</option></select></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian nghỉ</label><select id="lSession" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option></select></div></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Lý do (Bệnh, việc gia đình...)</label><textarea id="lReason" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-medium text-slate-700 outline-none focus:border-red-400 transition" rows="3" placeholder="Nhập lý do chi tiết..."></textarea></div><button onclick="sendLeave()" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-red-700 transition"><i class="fas fa-paper-plane mr-2"></i> GỬI ĐƠN CHO GVCN</button></div>`; document.getElementById('lDate').valueAsDate = new Date(Date.now()+86400000); }
window.changeLeaveType = function() { const type = document.getElementById('lType').value; const session = document.getElementById('lSession'); if (type === 'Nghỉ Bán trú') { session.innerHTML = `<option value="Ăn trưa và Không ngủ trưa">Ăn trưa và Không ngủ trưa</option><option value="Không ăn trưa và không ngủ trưa">Không ăn trưa và không ngủ trưa</option>`; } else { session.innerHTML = `<option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option>`; } };
async function sendLeave() { const d = document.getElementById('lDate').value; const r = document.getElementById('lReason').value; const type = document.getElementById('lType').value; const session = document.getElementById('lSession').value; if(!d || !r) return alert("Vui lòng chọn Ngày nghỉ và Nhập Lý do!"); const combinedType = `${type} (${session})`; document.getElementById('loader').style.display='flex'; try { await fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'gui_xin_phep', data:{ id:currentUser.id, name:currentUser.name, dateOff:d, type:combinedType, reason:r } }) }); alert("Gửi đơn xin phép thành công! Giáo viên đã nhận được."); veTrangChu(); } catch(e) { alert("Lỗi mạng, chưa gửi được đơn!"); } document.getElementById('loader').style.display='none'; }
async function moDonTu() { closeMenu(); contentArea.innerHTML = `<h2 class="text-xl font-black text-red-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách...</h2>`; const leaves = await (await fetch(API_URL + "?type=absent_list&t=" + Date.now())).json(); let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left text-slate-500"></i></button><h2 class="font-black text-xl text-red-600 uppercase">HỘP THƯ ĐƠN TỪ</h2></div>`; if (leaves.length === 0) { html += `<p class="text-center text-slate-400 font-medium py-10"><i class="fas fa-check-circle text-4xl mb-3 text-green-200 block"></i>Lớp đi học đầy đủ, không có đơn xin phép nào.</p>`; } else { const groupedLeaves = {}; leaves.forEach(l => { let fDate = l.dateOff; if (fDate.includes('-')) { const parts = fDate.split('-'); if(parts.length === 3) fDate = `${parts[2]}/${parts[1]}/${parts[0]}`; } if (!groupedLeaves[fDate]) groupedLeaves[fDate] = []; groupedLeaves[fDate].push(l); }); html += `<div class="space-y-6 pb-10">`; for (const [dateStr, items] of Object.entries(groupedLeaves)) { html += `<div class="bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-red-500 fade-in relative overflow-hidden"><div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3"><div class="flex items-center gap-2"><i class="fas fa-calendar-alt text-red-500 text-xl"></i><h3 class="font-black text-lg text-slate-800">Xin nghỉ ngày: ${dateStr}</h3></div><span class="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">${items.length} đơn</span></div><div class="space-y-4">`; items.forEach(l => { const isBanTru = l.type.startsWith('Nghỉ Bán trú') || l.type.includes('Chỉ nghỉ Bán trú'); const badgeColor = isBanTru ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'; const icon = isBanTru ? 'fa-utensils' : 'fa-bed'; const iconBg = isBanTru ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'; let timeSent = ""; try { let d = new Date(l.time); if(isNaN(d)) timeSent = l.time; else timeSent = d.toLocaleString('vi-VN'); } catch(e) { timeSent = l.time; } html += `<div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-4 hover:border-slate-300 transition"><div class="w-10 h-10 ${iconBg} rounded-full flex justify-center items-center text-lg shrink-0"><i class="fas ${icon}"></i></div><div class="flex-1"><div class="flex justify-between items-start mb-1"><span class="font-black text-slate-800">${l.name}</span></div><div class="mb-2"><span class="text-[11px] font-black inline-block px-2 py-1 rounded border ${badgeColor}">${l.type}</span></div><p class="text-[13px] text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100">" ${l.reason} "</p><p class="text-[10px] text-slate-400 mt-2 text-right">Gửi lúc: ${timeSent}</p></div></div>`; }); html += `</div></div>`; } html += `</div>`; } contentArea.innerHTML = html; }
async function moTienDo() { closeMenu(); contentArea.innerHTML = `<h2 class="text-xl font-black text-purple-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu toàn lớp...</h2>`; Data.math = await (await fetch(API_URL+"?type=math")).json(); Data.tv = await (await fetch(API_URL+"?type=vietnamese")).json(); Data.log = await (await fetch(API_URL+"?type=history_all&t="+Date.now())).json(); const mathGroups = [...new Set(Data.math.map(x=>x.group))]; const tvGroups = [...new Set(Data.tv.map(x=>x.group))]; const total = mathGroups.length + tvGroups.length; let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600">TIẾN ĐỘ CHUNG (${total} BÀI)</h2></div><p class="text-xs text-slate-500 mb-4 text-center italic"><i class="fas fa-hand-pointer mr-1"></i> Bấm vào tên học sinh để xem chi tiết điểm số & lỗi sai</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10 fade-in">`; html += Data.hs.map(h => { const userL = Data.log.filter(l => l.id === h.id); const done = new Set(userL.map(l => l.subject+l.group)).size; const pct = total ? Math.round((done/total)*100) : 0; return `<div onclick="xemChiTietTienDo('${h.id}', '${h.name}')" class="bg-white p-4 rounded-2xl border-2 border-transparent shadow-sm flex justify-between items-center cursor-pointer hover:border-purple-300 hover:shadow-md transition"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-black"><i class="fas fa-user"></i></div><span class="font-bold text-slate-700">${h.name}</span></div><div class="w-1/3 text-right"><div class="text-[11px] font-black mb-1 text-slate-500">${done}/${total} BÀI (${pct}%)</div><div class="progress-bar h-1.5"><div class="progress-fill ${pct==100?'bg-green-500':'bg-purple-500'}" style="width:${pct}%"></div></div></div></div>`; }).join(''); contentArea.innerHTML = html + "</div>"; }
window.xemChiTietTienDo = function(studentId, studentName) { const userLogs = Data.log.filter(l => l.id === studentId); const mathGroups = [...new Set(Data.math.map(x=>x.group))].sort(); const tvGroups = [...new Set(Data.tv.map(x=>x.group))].sort(); const renderSubjectProgress = (subjectCode, groupsList) => { if(groupsList.length === 0) return `<p class="text-sm text-slate-400 italic py-2">Chưa có bài tập</p>`; return groupsList.map(grp => { const log = userLogs.find(l => l.subject === subjectCode && l.group === grp); if(log) { const safeDetails = log.details ? log.details.replace(/'/g, "\\'").replace(/"/g, "&quot;") : ""; const btnChiTiet = log.details ? `<button onclick="xemLoiSai('${studentName}', '${grp}', '${safeDetails}')" class="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded hover:bg-red-600 hover:text-white transition">Xem lỗi sai</button>` : `<span class="text-[10px] text-green-500 font-bold px-2 py-1"><i class="fas fa-check-circle"></i> Tuyệt đối</span>`; return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"><div class="flex items-center gap-2"><i class="fas fa-check-circle text-green-500 text-lg"></i><span class="font-bold text-slate-700 text-sm">${grp}</span></div><div class="flex items-center gap-3"><span class="font-black text-indigo-600 text-lg">${log.score}đ</span>${btnChiTiet}</div></div>`; } else { return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 opacity-50"><div class="flex items-center gap-2"><i class="far fa-circle text-slate-300 text-lg"></i><span class="font-bold text-slate-500 text-sm line-through">${grp}</span></div><span class="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">Chưa làm</span></div>`; } }).join(''); }; contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="moTienDo()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600 uppercase">CHI TIẾT: ${studentName}</h2></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in pb-10"><div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-100"><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-calculator"></i></div><h3 class="font-black text-blue-800 text-lg">MÔN TOÁN</h3></div><div>${renderSubjectProgress('math', mathGroups)}</div></div><div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-100"><div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><i class="fas fa-book"></i></div><h3 class="font-black text-green-800 text-lg">MÔN TIẾNG VIỆT</h3></div><div>${renderSubjectProgress('vietnamese', tvGroups)}</div></div></div><div id="modalReview" class="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in"><div class="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden flex flex-col max-h-[85vh]"><div class="bg-red-500 p-5 text-white flex justify-between items-center relative shadow-md"><div><h3 class="font-black text-lg uppercase" id="rvTitle">--</h3><p class="text-xs text-red-100 font-bold" id="rvName">--</p></div><button onclick="document.getElementById('modalReview').classList.add('hidden')" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40"><i class="fas fa-times"></i></button></div><div id="rvContent" class="p-5 overflow-y-auto bg-slate-50 space-y-4 text-sm text-slate-700 leading-relaxed font-medium"></div></div></div>`; };
window.xemLoiSai = function(studentName, group, detailsHtml) { document.getElementById("rvTitle").innerText = "Lỗi sai: " + group; document.getElementById("rvName").innerText = studentName; document.getElementById("rvContent").innerHTML = detailsHtml || '<p class="text-center text-slate-400">Không có dữ liệu chi tiết.</p>'; document.getElementById("modalReview").classList.remove("hidden"); };
function chuyenTrangQuanLy() { closeMenu(); let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600">QUẢN LÝ HS</h2></div><div class="space-y-3">`; html += Data.hs.map(h => `<div onclick="viewProfile('${h.id}')" class="bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"><span class="font-bold text-slate-700">${h.name}</span><span class="text-xs text-gray-500">SĐT: ${h.fatherPhone || h.motherPhone || 'Chưa có'}</span></div>`).join(''); contentArea.innerHTML = html + "</div>"; }
function viewProfile(id) { closeMenu(); const s = Data.hs.find(x => x.id === id); if(!s) return; const avatar = s.gender === 'Nữ' ? '<div class="w-24 h-24 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-graduate"></i></div>' : '<div class="w-24 h-24 bg-blue-100 text-blue-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-astronaut"></i></div>'; let cleanDob = s.dob || 'Chưa cập nhật'; if(cleanDob.includes('T') && cleanDob.includes('.000Z')) { const dt = new Date(cleanDob); cleanDob = ("0" + dt.getDate()).slice(-2) + "/" + ("0" + (dt.getMonth() + 1)).slice(-2) + "/" + dt.getFullYear(); } const renderPhone = (phone, label) => { if(!phone || phone.trim() === '') return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><span class="text-slate-400 italic text-xs">Chưa cập nhật</span></div>`; const cleanPhone = phone.toString().replace(/\D/g, ''); return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><div class="flex items-center gap-2"><span class="font-bold text-slate-700 text-sm">${phone}</span><a href="tel:${cleanPhone}" class="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs hover:bg-green-600 hover:text-white transition"><i class="fas fa-phone"></i></a></div></div>`; }; contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="${currentUser && currentUser.role==='admin'?'chuyenTrangQuanLy()':'veTrangChu()'}" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left text-slate-500"></i></button><h2 class="font-black text-xl text-blue-600 uppercase">HỒ SƠ CÁ NHÂN</h2></div><div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-blue-500 fade-in relative overflow-hidden"><div class="text-center mb-6 relative z-10">${avatar}<h2 class="text-2xl font-black text-slate-800">${s.name}</h2><span class="bg-blue-50 text-blue-600 font-mono font-bold px-3 py-1 rounded-full text-xs mt-2 inline-block">ID: ${s.id}</span></div><div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-6 flex items-center justify-between relative overflow-hidden"><div class="absolute -right-4 -bottom-4 text-white opacity-20 text-6xl"><i class="fas fa-gem"></i></div><div><p class="text-xs font-bold opacity-90 uppercase">Điểm tích lũy</p><p class="text-3xl font-black">${s.score || 0}</p></div><div class="text-right"><p class="text-xs font-bold opacity-90 uppercase">Xếp hạng</p><p class="text-lg font-bold"><i class="fas fa-trophy mr-1"></i> Thành viên</p></div></div><div class="space-y-1"><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Ngày sinh</span><b class="text-slate-700">${cleanDob}</b></div><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Giới tính</span><b class="text-slate-700">${s.gender || '-'}</b></div>${renderPhone(s.fatherPhone, "SĐT Cha")}${renderPhone(s.motherPhone, "SĐT Mẹ")}<div class="py-2"><span class="text-slate-400 font-bold uppercase text-[10px] block mb-1">Địa chỉ</span><b class="text-slate-700 text-sm leading-snug">${s.address || 'Chưa cập nhật'}</b></div></div></div>`; }
function parseImg(t) { return (t||"").toString().replace(/\[img:(.*?)\]/g, '<img src="$1" class="rounded border my-2">').replace(/\n/g,'<br>'); }
