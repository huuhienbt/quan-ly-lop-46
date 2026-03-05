// ==========================================
// NÃO BỘ XỬ LÝ - APP.JS (BẢN CHUẨN ĐẦY ĐỦ NHẤT)
// Cập nhật: Bảng Vàng TOP 15, Đồng hạng (Dense Ranking), Thời gian nộp bài
// Thêm: Chèn ảnh Kho Toán, Đọc hiểu Tiếng Việt 2 khung, Badge Bài mới
// Sửa lỗi: Chống sập Kho Toán, Xóa Mẹo, Mở khóa nút liệt
// ==========================================

const API_URL = "https://script.google.com/macros/s/AKfycby3g1YD33YvtPHxFrROITYquUiC3-_jw2tuYXDMPZ53RRWdTaDlvvv1MW3aegBzVh9Kdw/exec";

let Data = { hs: [], math: [], tv: [], vietnamese: [], log: [], stats: null, leaves: [], notiList: [] };
let currentUser = null;
let curSub = null;
let curGrp = null;
let quiz = [];
let timer = null;
let score = 0;
let currentQIndex = 0;
let wrongAnswersLog = []; 
let readingPassage = ""; // Biến lưu đoạn văn Đọc hiểu Tiếng Việt
window.currentSelectedImg = null;
window.isQuizDataLoaded = false; 

// --- CSS Hiệu ứng Thác nước ---
const style = document.createElement('style');
style.innerHTML = `
    @keyframes cascadeDrop { 
        0% { opacity: 0; transform: translateY(-40px) scale(0.95); } 
        100% { opacity: 1; transform: translateY(0) scale(1); } 
    } 
    .stagger-item { 
        opacity: 0; 
        animation: cascadeDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; 
    }
`;
document.head.appendChild(style);

// --- KHỞI ĐỘNG HỆ THỐNG ---
window.onload = async () => {
    localStorage.removeItem('L46_Data_Cache'); 
    try {
        const [resHs, resNoti] = await Promise.all([
            fetch(API_URL + "?type=students&t=" + Date.now()), 
            fetch(API_URL + "?type=thong_bao&t=" + Date.now())
        ]);
        
        Data.hs = await resHs.json(); 
        Data.notiList = await resNoti.json();
        
        document.getElementById('connStatus').innerText = "Đã kết nối dữ liệu thành công!"; 
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-green-500";
        
        const role = localStorage.getItem('role');
        if (role === 'admin') {
            loginAdmin(); 
        } else if (role === 'student') { 
            const u = Data.hs.find(x => x.id === localStorage.getItem('uid')); 
            if (u) {
                loginStudent(u); 
            } else {
                loginGuest(); 
            }
        } else {
            loginGuest();
        }
    } catch(e) { 
        document.getElementById('connStatus').innerText = "Lỗi mạng hoặc Link API bị sai!"; 
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-red-500"; 
        loginGuest(); 
    }
};

// --- XỬ LÝ ĐĂNG NHẬP & PHÂN QUYỀN ---
function loginGuest() { 
    currentUser = null; 
    setupUI(); 
    moThongBao(); 
}

function showLogin() { 
    closeMenu(); 
    document.getElementById('mainApp').classList.add('hidden'); 
    document.getElementById('loginScreen').classList.remove('hidden'); 
    
    if(!document.getElementById('btnBackGuest')) {
        const loginForm = document.querySelector('#loginScreen > div'); 
        if(loginForm) {
            const btn = document.createElement('button'); 
            btn.id = 'btnBackGuest'; 
            btn.className = 'w-full mt-5 text-slate-500 font-bold text-sm hover:text-indigo-600 transition flex items-center justify-center gap-2'; 
            btn.innerHTML = '<i class="fas fa-arrow-left"></i> Quay lại Trang chủ Lớp';
            btn.onclick = () => { 
                document.getElementById('loginScreen').classList.add('hidden'); 
                document.getElementById('mainApp').classList.remove('hidden'); 
                if(!currentUser) loginGuest(); 
            };
            loginForm.appendChild(btn);
        }
    }
}

async function login() {
    const v = document.getElementById('inputLogin').value.trim();
    if(!v) return alert("Vui lòng nhập SĐT hoặc Mật khẩu!");

    if (Data.hs.length === 0) {
        document.getElementById('loader').style.display = 'flex';
        try {
            const resHs = await fetch(API_URL + "?type=students&t=" + Date.now());
            Data.hs = await resHs.json();
        } catch(e) {
            document.getElementById('loader').style.display = 'none';
            return alert("Lỗi mạng khi lấy dữ liệu học sinh!");
        }
        document.getElementById('loader').style.display = 'none';
    }

    const u = Data.hs.find(s => s.fatherPhone.includes(v) || s.motherPhone.includes(v));
    if(u) { 
        localStorage.setItem('role','student'); 
        localStorage.setItem('uid',u.id); 
        loginStudent(u); 
        return;
    }

    document.getElementById('loader').style.display = 'flex';
    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: 'check_admin', data: { pass: v } }) 
        });
        const result = await response.json();
        document.getElementById('loader').style.display = 'none';

        if (result.status === "OK") {
            localStorage.setItem('role','admin'); 
            loginAdmin();
        } else {
            alert("Sai SĐT hoặc mật khẩu!");
        }
    } catch(e) {
        document.getElementById('loader').style.display = 'none';
        alert("Lỗi mạng khi kiểm tra bảo mật!");
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
    moThongBao(); 
    setTimeout(checkSinhNhat, 1000); 
}

function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden'); 
    document.getElementById('loader').style.display='none'; 
    document.getElementById('mainApp').classList.remove('hidden');
    
    const headerNameEl = document.getElementById('headerName'); 
    const badgeDiv = headerNameEl ? headerNameEl.closest('[onclick]') : null; 
    const roleTextEl = badgeDiv ? badgeDiv.querySelector('p') : null; 
    const avatarBox = badgeDiv ? badgeDiv.querySelector('div.bg-white') : null; 
    const logoutBtn = document.querySelector('[onclick="logout()"]');

    if(currentUser) {
        if(headerNameEl) headerNameEl.innerText = currentUser.role === 'admin' ? 'GVCN' : currentUser.name.split(" ").pop();
        document.getElementById('menuName').innerText = currentUser.name; 
        
        if(badgeDiv) badgeDiv.setAttribute('onclick', 'toggleMenu()');
        
        if(roleTextEl) { 
            roleTextEl.style.display = 'block'; 
            roleTextEl.innerText = currentUser.role === 'admin' ? 'GVCN' : 'HỌC SINH'; 
        }
        
        if(avatarBox) { 
            avatarBox.style.display = 'flex'; 
            avatarBox.innerHTML = currentUser.role === 'admin' ? '<i class="fas fa-chalkboard-teacher text-blue-600"></i>' : '<i class="fas fa-user-graduate text-blue-600"></i>'; 
        }
        
        if(logoutBtn) logoutBtn.style.display = '';

        if(currentUser.role === 'admin') {
            document.getElementById('menuTeacher').innerHTML = `
                <div onclick="chuyenTrangQuanLy()" class="p-3 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-users text-blue-600 w-6"></i> Quản lý Học sinh
                </div>
                <div onclick="moThongBao()" class="p-3 hover:bg-orange-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-bullhorn text-orange-600 w-6"></i> Quản lý Bảng tin
                </div>
                <div onclick="moDonTu()" class="p-3 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-envelope-open-text text-red-600 w-6"></i> Hộp thư xin phép
                </div>
                <div onclick="moQuanLyThu()" class="p-3 hover:bg-pink-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-comment-dots text-pink-600 w-6"></i> Thư Học Sinh
                </div>
                <div onclick="moTienDo()" class="p-3 hover:bg-purple-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-chart-line text-purple-600 w-6"></i> Tiến độ Học tập
                </div>
                <div onclick="quanLyNganHang('math')" class="p-3 hover:bg-indigo-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-calculator text-indigo-600 w-6"></i> Kho Toán
                </div>
                <div onclick="quanLyNganHang('vietnamese')" class="p-3 hover:bg-green-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-book text-green-600 w-6"></i> Kho Tiếng Việt
                </div>
            `;
            document.getElementById('menuTeacher').classList.remove('hidden'); 
            document.getElementById('menuStudent').classList.add('hidden');
        } else {
            document.getElementById('menuStudent').innerHTML = `
                <div onclick="viewProfile(currentUser.id)" class="p-3 hover:bg-yellow-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-id-card text-yellow-600 w-6"></i> Hồ sơ cá nhân
                </div>
                <div onclick="moXinPhep()" class="p-3 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-envelope-open-text text-red-600 w-6"></i> Hộp thư
                </div>
                <div onclick="moHopThuBiMat()" class="p-3 hover:bg-pink-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer">
                    <i class="fas fa-comment-dots text-pink-500 w-6"></i> Lời muốn nói
                </div>
            `;
            document.getElementById('menuStudent').classList.remove('hidden'); 
            document.getElementById('menuTeacher').classList.add('hidden');
        }
    } else {
        if(headerNameEl) headerNameEl.innerText = "Đăng nhập"; 
        document.getElementById('menuName').innerText = "Khách"; 
        if(badgeDiv) badgeDiv.setAttribute('onclick', 'showLogin()'); 
        if(roleTextEl) roleTextEl.style.display = 'none'; 
        if(avatarBox) avatarBox.style.display = 'none'; 
        if(logoutBtn) logoutBtn.style.display = 'none';
        
        document.getElementById('menuStudent').innerHTML = `
            <div onclick="showLogin()" class="p-4 bg-blue-50 text-blue-700 rounded-xl font-black flex items-center gap-3 cursor-pointer mb-3 shadow-sm hover:bg-blue-100 transition border border-blue-100">
                <i class="fas fa-sign-in-alt w-6 text-xl"></i> ĐĂNG NHẬP NGAY
            </div>
            <div onclick="moGocHocTap()" class="p-3 hover:bg-slate-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer text-slate-600">
                <i class="fas fa-rocket w-6 text-indigo-500"></i> Góc học tập
            </div>
            <div onclick="moXinPhep()" class="p-3 hover:bg-slate-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer text-slate-600">
                <i class="fas fa-envelope-open-text w-6 text-red-500"></i> Hộp thư
            </div>
        `;
        document.getElementById('menuStudent').classList.remove('hidden'); 
        document.getElementById('menuTeacher').classList.add('hidden');
    }
}

const contentArea = document.getElementById('content');

function toggleMenu() { 
    document.getElementById('appMenu').classList.toggle('hidden'); 
}

function closeMenu() { 
    document.getElementById('appMenu').classList.add('hidden'); 
}

function logout() { 
    localStorage.removeItem('role'); 
    localStorage.removeItem('uid');
    window.isQuizDataLoaded = false;
    location.reload(); 
}

function veTrangChu() { 
    closeMenu(); 
    clearInterval(timer); 
    if(!currentUser) {
        moThongBao(); 
    } else if(currentUser.role === 'admin') {
        renderDashboardAdmin(); 
    } else {
        moThongBao(); 
    }
}

// --- MENU CỦA THẦY GIÁO ---
function renderDashboardAdmin() {
    contentArea.innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 fade-in">
            <button onclick="chuyenTrangQuanLy()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-users text-3xl text-blue-600"></i>
                <span class="font-bold text-slate-700">Học sinh</span>
            </button>
            <button onclick="moThongBao()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-orange-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-bullhorn text-3xl text-orange-500"></i>
                <span class="font-bold text-slate-700">Bảng tin</span>
            </button>
            <button onclick="moDonTu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-red-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-envelope text-3xl text-red-600"></i>
                <span class="font-bold text-slate-700">Xin phép</span>
            </button>
            <button onclick="moQuanLyThu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-pink-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-comment-dots text-3xl text-pink-500"></i>
                <span class="font-bold text-slate-700">Thư HS</span>
            </button>
            <button onclick="moTienDo()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-chart-line text-3xl text-purple-600"></i>
                <span class="font-bold text-slate-700">Tiến độ</span>
            </button>
            <button onclick="quanLyNganHang('math')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-indigo-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-calculator text-3xl text-indigo-600"></i>
                <span class="font-bold text-slate-700">Kho Toán</span>
            </button>
            <button onclick="quanLyNganHang('vietnamese')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-100 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-book text-3xl text-green-600"></i>
                <span class="font-bold text-slate-700">Kho T.Việt</span>
            </button>
            <button onclick="dongBoDuLieu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-slate-300 flex flex-col items-center gap-3 btn-3d">
                <i class="fas fa-sync-alt text-3xl text-slate-500"></i>
                <span class="font-bold text-slate-700">Đồng bộ</span>
            </button>
        </div>
    `;
}

// ----------------------------------------------------
// MENU ĐIỀU HƯỚNG CÓ ICON CHUẨN XÁC
// ----------------------------------------------------
function getNavHtml(active) {
    if (currentUser && currentUser.role === 'admin') { 
        let title = active === 'bangtin' ? 'BẢNG TIN LỚP' : (active === 'hoctap' ? 'GÓC HỌC TẬP' : 'HỘP THƯ'); 
        return `
            <div class="flex items-center mb-6">
                <button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 class="font-black text-xl text-orange-500 uppercase">${title}</h2>
            </div>
        `; 
    }
    
    let headerGreeting = ""; 
    let thuBiMatBtn = ""; 
    let vongQuayBtn = "";
    
    if (currentUser && currentUser.role === 'student') {
        headerGreeting = `
            <div class="mb-5 fade-in">
                <h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2>
            </div>
        `;
        vongQuayBtn = `
            <button onclick="moVongQuay()" class="font-black text-base sm:text-xl pb-2 transition ${active==='vongquay' ? 'text-yellow-500 border-b-4 border-yellow-500' : 'text-slate-400 hover:text-yellow-500'}">
                <i class="fas fa-dharmachakra"></i> VÒNG QUAY
            </button>
        `;
        thuBiMatBtn = `
            <button onclick="moHopThuBiMat()" class="font-black text-base sm:text-xl pb-2 transition ${active==='thubimat' ? 'text-pink-500 border-b-4 border-pink-500' : 'text-slate-400 hover:text-pink-500'}">
                <i class="fas fa-comment-dots"></i> LỜI MUỐN NÓI
            </button>
        `;
    }
    
    return `
        ${headerGreeting}
        <div class="flex items-center gap-6 sm:gap-10 mb-6 border-b-2 border-slate-100 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button onclick="moThongBao()" class="font-black text-base sm:text-xl pb-2 transition ${active==='bangtin' ? 'text-orange-500 border-b-4 border-orange-500' : 'text-slate-400 hover:text-orange-500'}">
                <i class="fas fa-newspaper"></i> BẢNG TIN
            </button>
            <button onclick="moGocHocTap()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hoctap' ? 'text-indigo-600 border-b-4 border-indigo-500' : 'text-slate-400 hover:text-indigo-500'}">
                <i class="fas fa-rocket"></i> HỌC TẬP
            </button>
            ${vongQuayBtn}
            <button onclick="moXinPhep()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hopthu' ? 'text-red-600 border-b-4 border-red-500' : 'text-slate-400 hover:text-red-500'}">
                <i class="fas fa-envelope-open-text"></i> HỘP THƯ
            </button>
            ${thuBiMatBtn}
        </div>
    `;
}

// ==========================================
// CÔNG CỤ SOẠN THẢO VĂN BẢN (CHÈN ĐƯỢC ẢNH) DÙNG CHUNG
// ==========================================
function getRichTextToolbar(targetId) {
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
            <select onchange="document.execCommand('fontSize', false, this.value)" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1">
                <option value="">Cỡ chữ</option>
                <option value="1">Rất nhỏ</option>
                <option value="2">Nhỏ</option>
                <option value="3">Vừa</option>
                <option value="4">Lớn</option>
                <option value="5">Rất Lớn</option>
                <option value="6">Khổng lồ</option>
            </select>
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            <button onclick="chenAnhVaoEditor('${targetId}')" class="px-3 h-8 bg-indigo-50 rounded shadow-sm hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200">
                <i class="fas fa-image"></i> Chèn Ảnh
            </button>
            <select onchange="resizeImg(this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1">
                <option value="">Cỡ ảnh</option>
                <option value="30%">Nhỏ (30%)</option>
                <option value="60%">Vừa (60%)</option>
                <option value="100%">Lớn (100%)</option>
            </select>
        </div>
    `;
}

window.chenAnhVaoEditor = function(targetId) {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = 'image/*'; 
    input.onchange = async (e) => { 
        const file = e.target.files[0]; 
        if (!file) return; 
        document.getElementById('loader').style.display = 'flex'; 
        const reader = new FileReader(); 
        reader.onload = function(event) { 
            const img = new Image(); 
            img.onload = async function() { 
                const canvas = document.createElement('canvas'); 
                const MAX_WIDTH = 800; 
                let scaleSize = 1; 
                if(img.width > MAX_WIDTH) { scaleSize = MAX_WIDTH / img.width; } 
                canvas.width = img.width * scaleSize; 
                canvas.height = img.height * scaleSize; 
                const ctx = canvas.getContext('2d'); 
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height); 
                const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]; 
                try { 
                    const response = await fetch(API_URL, { 
                        method: 'POST', 
                        body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) 
                    }); 
                    const result = await response.json(); 
                    if(result.url) { 
                        document.getElementById(targetId).focus(); 
                        document.execCommand('insertHTML', false, `<div style="text-align: center;"><img src="${result.url}" loading="lazy" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block; cursor: pointer;"></div><br>`); 
                    } else { 
                        alert("Lỗi! Không lấy được link ảnh từ Server."); 
                    } 
                } catch(err) { 
                    alert("Lỗi mạng khi tải ảnh lên!"); 
                } 
                document.getElementById('loader').style.display = 'none'; 
            }; 
            img.src = event.target.result; 
        }; 
        reader.readAsDataURL(file); 
    }; 
    input.click(); 
};

window.handleEditorClick = function(e) { 
    document.querySelectorAll('div[contenteditable="true"] img').forEach(img => img.style.border = 'none'); 
    window.currentSelectedImg = null; 
    if (e.target.tagName === 'IMG') { 
        e.target.style.border = '3px dashed #f97316'; 
        window.currentSelectedImg = e.target; 
    } 
};

window.resizeImg = function(size) { 
    if(!size) return; 
    if(!window.currentSelectedImg) return alert("Thầy hãy bấm chọn một tấm ảnh ở dưới trước khi chỉnh kích thước nhé!"); 
    window.currentSelectedImg.style.width = size; 
    window.currentSelectedImg.style.height = 'auto'; 
};

function parseImg(t) { 
    return (t||"").toString().replace(/\[img:(.*?)\]/g, '<img src="$1" loading="lazy" class="rounded border my-2">').replace(/\n/g,'<br>'); 
}

// ==========================================
// 📰 BẢNG TIN LỚP
// ==========================================
function moThongBao() { 
    closeMenu(); 
    let btnTaoMoi = currentUser && currentUser.role === 'admin' ? `
        <button onclick="editNotiUI(null)" class="w-full mb-6 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg btn-3d hover:bg-orange-700 transition flex items-center justify-center gap-2">
            <i class="fas fa-plus-circle text-xl"></i> TẠO BÀI VIẾT MỚI
        </button>
    ` : ''; 
    
    let sortedList = [...Data.notiList].sort((a, b) => { 
        const getVal = (item) => { 
            let rawT = item.time.includes('|||') ? item.time.split('|||')[1] : item.time; 
            const m = String(rawT).match(/(\d{2})\/(\d{2})\/(\d{4})/); 
            return m ? parseInt(m[3] + m[2] + m[1]) : 0; 
        }; 
        let dateA = getVal(a), dateB = getVal(b); 
        if (dateA !== dateB) return dateB - dateA; 
        return (parseInt(String(b.id).replace(/\D/g,''))||0) - (parseInt(String(a.id).replace(/\D/g,''))||0); 
    }); 
    
    let listHtml = ""; 
    
    if (sortedList.length === 0) {
        listHtml = `
            <div class="text-center py-10 opacity-60">
                <i class="fas fa-inbox text-6xl text-slate-300 mb-3"></i>
                <p class="font-bold text-slate-400">Chưa có bài viết nào.</p>
            </div>
        `; 
    } else { 
        listHtml = sortedList.map((tb, index) => { 
            let adminButtons = currentUser && currentUser.role === 'admin' ? `
                <div class="flex gap-2 mt-4 pt-3 border-t border-orange-100">
                    <button onclick="editNotiUI('${tb.id}')" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-100 transition text-sm flex items-center justify-center gap-1">
                        <i class="fas fa-edit"></i> Sửa
                    </button>
                    <button onclick="xoaThongBao('${tb.id}')" class="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold hover:bg-red-100 transition text-sm flex items-center justify-center gap-1">
                        <i class="fas fa-trash-alt"></i> Xóa
                    </button>
                </div>
            ` : ''; 
            
            let cleanContent = tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '').replace(/<img /gi, '<img loading="lazy" ') : ""; 
            let typeStr = "Thông báo"; 
            let displayTime = tb.time; 
            let iconHtml = '<i class="fas fa-bullhorn"></i>'; 
            let colorTheme = 'bg-orange-100 text-orange-600'; 
            
            if (tb.time.includes('|||')) { 
                let parts = tb.time.split('|||'); 
                typeStr = parts[0]; 
                displayTime = parts[1]; 
                if(typeStr === 'THÔNG BÁO TỪ GVCN' || typeStr === 'Thông báo chung') typeStr = 'Thông báo'; 
                if(typeStr === 'HOẠT ĐỘNG LỚP 4/6' || typeStr === 'Hoạt động lớp') typeStr = 'Hoạt động'; 
                if (typeStr === 'Hoạt động') { 
                    iconHtml = '<i class="fas fa-camera-retro"></i>'; 
                    colorTheme = 'bg-green-100 text-green-600'; 
                } 
            } else { 
                displayTime = tb.time; 
            } 
            
            let delay = index * 0.2; 
            return `
                <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-5 relative hover:shadow-md transition w-full overflow-hidden stagger-item" style="animation-delay: ${delay}s;">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 ${colorTheme} rounded-full flex items-center justify-center text-lg shrink-0">${iconHtml}</div>
                        <div>
                            <h3 class="font-black text-slate-800 text-sm uppercase tracking-wide">${typeStr}</h3>
                            <p class="text-[11px] font-bold text-slate-400"><i class="fas fa-clock mr-1"></i> ${displayTime}</p>
                        </div>
                    </div>
                    <div class="text-slate-700 text-base w-full overflow-hidden break-words pl-1 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_img]:inline-block [&_a]:text-blue-600 [&_a]:underline [&_a]:font-bold">
                        ${cleanContent}
                    </div>
                    ${adminButtons}
                </div>
            `; 
        }).join(''); 
    } 
    contentArea.innerHTML = `${getNavHtml('bangtin')}${btnTaoMoi}<div class="space-y-4 pb-10">${listHtml}</div>`; 
}

function editNotiUI(idToEdit) { 
    const isEdit = idToEdit != null; 
    const tb = isEdit ? Data.notiList.find(x => x.id === idToEdit) : null; 
    const d = new Date(); 
    const dateStr = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); 
    const firstDay = new Date(d.getFullYear(), 0, 1); 
    const weekNum = Math.ceil((((d - firstDay) / 86400000) + firstDay.getDay() + 1) / 7); 
    let defaultTimeStr = `Ngày ${dateStr} - Tuần ${weekNum}`; 
    let defaultType = 'Thông báo'; 
    
    if (isEdit) { 
        if (tb.time.includes('|||')) { 
            let parts = tb.time.split('|||'); 
            defaultType = parts[0]; 
            defaultTimeStr = parts[1]; 
            if(defaultType === 'THÔNG BÁO TỪ GVCN' || defaultType === 'Thông báo chung') defaultType = 'Thông báo'; 
            if(defaultType === 'HOẠT ĐỘNG LỚP 4/6' || defaultType === 'Hoạt động lớp') defaultType = 'Hoạt động'; 
        } else { 
            defaultTimeStr = tb.time; 
        } 
    } 
    const currentContent = isEdit && tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '') : ""; 
    
    contentArea.innerHTML = `
        <div class="flex items-center mb-6">
            <button onclick="moThongBao()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500">
                <i class="fas fa-times"></i>
            </button>
            <h2 class="font-black text-xl text-orange-600 uppercase">${isEdit ? 'SỬA BÀI VIẾT' : 'TẠO BÀI VIẾT MỚI'}</h2>
        </div>
        <div class="bg-white p-4 sm:p-6 rounded-[2rem] shadow-lg border space-y-4 fade-in w-full overflow-hidden">
            <input type="hidden" id="frmNotiId" value="${idToEdit || ''}">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại bài viết</label>
                    <select id="frmNotiType" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400 transition">
                        <option value="Thông báo" ${defaultType === 'Thông báo' ? 'selected' : ''}>📣 Thông báo</option>
                        <option value="Hoạt động" ${defaultType === 'Hoạt động' ? 'selected' : ''}>📸 Hoạt động</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian hiển thị</label>
                    <input type="text" id="frmNotiTime" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400" value="${defaultTimeStr}">
                </div>
            </div>
            <div class="w-full">
                <label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Nội dung</label>
                ${getRichTextToolbar('frmNotiContent')}
                <div id="frmNotiContent" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[200px] bg-white border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:inline-block [&_img]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline">${currentContent}</div>
            </div>
            <button onclick="luuThongBaoLenServer()" class="w-full bg-orange-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-orange-700 transition">
                ${isEdit ? 'LƯU THAY ĐỔI' : 'ĐĂNG LÊN HỆ THỐNG'}
            </button>
        </div>
    `; 
}

window.luuThongBaoLenServer = async function() { 
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
        await fetch(API_URL, { 
            method: 'POST', 
            body: JSON.stringify({ action: act, data: { id: id, time: finalTimeStr, content: contentHTML } }) 
        }); 
        
        if(id) { 
            const idx = Data.notiList.findIndex(x => x.id === id); 
            if(idx > -1) { 
                Data.notiList[idx].time = finalTimeStr; 
                Data.notiList[idx].content = contentHTML; 
            } 
        } else { 
            Data.notiList.unshift({ id: "TB"+Date.now(), time: finalTimeStr, content: contentHTML }); 
        } 
        document.getElementById('loader').style.display = 'none'; 
        alert("Đăng bài thành công!"); 
        moThongBao(); 
    } catch(e) { 
        document.getElementById('loader').style.display = 'none'; 
        alert("Lỗi mạng!"); 
    } 
};

window.xoaThongBao = async function(id) { 
    if(confirm("Xóa thông báo này vĩnh viễn?")) { 
        document.getElementById('loader').style.display = 'flex'; 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'xoa_thong_bao', data: { id: id } }) }); 
        Data.notiList = Data.notiList.filter(x => x.id !== id); 
        document.getElementById('loader').style.display = 'none'; 
        moThongBao(); 
    } 
};

// --- 🚀 GÓC HỌC TẬP & BẢNG VÀNG CHUẨN THỜI GIAN & BADGE ---
async function moGocHocTap() { 
    closeMenu(); 
    
    if (currentUser && currentUser.role === 'student' && !window.isQuizDataLoaded) {
        contentArea.innerHTML = `
            <div class="text-center mt-10">
                <i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
                <p class="mt-2 font-bold text-gray-500">Đang kiểm tra bài tập...</p>
            </div>
        `;
        try {
            const [mRes, tRes, lRes] = await Promise.all([
                fetch(API_URL + "?type=math&t=" + Date.now()),
                fetch(API_URL + "?type=vietnamese&t=" + Date.now()),
                fetch(API_URL + "?type=history_all&t=" + Date.now())
            ]);
            Data.math = await mRes.json(); Data.tv = await tRes.json(); Data.vietnamese = Data.tv; Data.log = await lRes.json();
            window.isQuizDataLoaded = true;
        } catch(e) { console.log(e); }
    }

    let mathUnread = 0; let tvUnread = 0;
    if (currentUser && currentUser.role === 'student') {
        const myLogs = Data.log.filter(l => String(l.id) === String(currentUser.id));
        const mathGroups = [...new Set(Data.math.map(x => x.group))];
        mathUnread = mathGroups.filter(g => !myLogs.some(l => l.subject === 'math' && l.group === g)).length;
        const tvGroups = [...new Set(Data.tv.map(x => x.group))];
        tvUnread = tvGroups.filter(g => !myLogs.some(l => (l.subject === 'vietnamese' || l.subject === 'tv') && l.group === g)).length;
    }

    let mathBadge = mathUnread > 0 ? `
        <div class="absolute -top-3 -right-3 bg-red-500 text-white text-[12px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">
            ${mathUnread} BÀI MỚI
        </div>
    ` : '';
    let tvBadge = tvUnread > 0 ? `
        <div class="absolute -top-3 -right-3 bg-red-500 text-white text-[12px] font-black px-3 py-1.5 rounded-full border-2 border-white shadow-md animate-pulse z-10">
            ${tvUnread} BÀI MỚI
        </div>
    ` : '';

    let htmlTop = `
        ${getNavHtml('hoctap')}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 relative">
            <button onclick="loadSubject('math')" class="relative bg-gradient-to-br from-blue-500 to-indigo-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${mathBadge}
                <i class="fas fa-calculator text-4xl mb-2 block opacity-90"></i>TOÁN
            </button>
            <button onclick="loadSubject('vietnamese')" class="relative bg-gradient-to-br from-green-500 to-emerald-600 text-white h-36 rounded-[2rem] font-black text-2xl shadow-lg btn-3d hover:scale-[1.02] transition">
                ${tvBadge}
                <i class="fas fa-book-open text-4xl mb-2 block opacity-90"></i>TIẾNG VIỆT
            </button>
        </div>
    `; 
    
    function parseLogTime(timeStr) {
        if(!timeStr) return 0;
        let d = new Date(timeStr);
        return !isNaN(d.getTime()) ? d.getTime() : 0; 
    }

    let studentsWithTime = Data.hs.map(s => {
        let scoreVal = Number(s.score) || 0;
        let userLogs = Data.log.filter(l => String(l.id) === String(s.id) && Number(l.score) !== 0);
        let achievedTime = 0;
        if (userLogs.length > 0) {
            userLogs.sort((a, b) => parseLogTime(a.time) - parseLogTime(b.time));
            let lastLog = userLogs[userLogs.length - 1];
            achievedTime = parseLogTime(lastLog.time);
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
            let rowBg = "bg-slate-50 border-slate-100"; let nameColor = "text-slate-700"; 
            
            if (actualDisplayRank === 1) { rankIcon = `<i class="fas fa-medal text-3xl text-yellow-500 drop-shadow-md"></i>`; rowBg = "bg-yellow-50 border-yellow-200 scale-[1.02] shadow-sm z-10"; nameColor = "text-yellow-700"; } 
            else if (actualDisplayRank === 2) { rankIcon = `<i class="fas fa-medal text-3xl text-slate-400 drop-shadow-md"></i>`; rowBg = "bg-gray-50 border-gray-200"; } 
            else if (actualDisplayRank === 3) { rankIcon = `<i class="fas fa-medal text-3xl text-orange-400 drop-shadow-md"></i>`; rowBg = "bg-orange-50 border-orange-100"; } 
            
            return `
                <div class="flex items-center justify-between p-3 mb-2 rounded-xl border ${rowBg} transition relative">
                    <div class="flex items-center gap-3">
                        <div class="w-10 text-center flex justify-center">${rankIcon}</div>
                        <div class="font-bold ${nameColor} text-sm sm:text-base">${s.name}</div>
                    </div>
                    <div class="font-black text-indigo-600 bg-white px-3 py-1 rounded-lg border border-indigo-100 shadow-sm text-sm">${s.score} <span class="text-[10px] text-indigo-500 font-bold ml-1 uppercase">điểm</span></div>
                </div>
            `; 
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
        leaderboardHtml = `
            <div class="mt-10 bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-yellow-400 fade-in">
                <div class="text-center mb-5">
                    <h3 class="font-black text-xl sm:text-2xl text-yellow-600 uppercase tracking-wide"><i class="fas fa-crown text-yellow-500 mr-2 mb-1 animate-bounce inline-block"></i>BẢNG VÀNG LỚP 4/6</h3>
                </div>
                <div class="flex flex-col">${listHtml}</div>
                ${personalMsg}
            </div>
        `; 
    } else { 
        let personalMsgEmpty = ""; 
        if (currentUser && currentUser.role === 'student') { personalMsgEmpty = `<div class="mt-4 p-3 bg-slate-100 border border-slate-200 rounded-xl text-center"><p class="text-slate-600 font-bold text-sm"><i class="fas fa-fire mr-1 text-orange-500"></i> Hãy làm bài tập để trở thành người đầu tiên vượt mốc 1500 điểm nhé!</p></div>`; } 
        leaderboardHtml = `
            <div class="mt-10 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in opacity-80">
                <i class="fas fa-trophy text-5xl text-slate-200 mb-3 block"></i>
                <p class="font-black text-slate-500 text-lg uppercase">Bảng Vàng đang trống</p>
                <p class="text-sm font-bold text-slate-400 mt-1">Chưa có chiến binh nào vượt mốc 1500 điểm.</p>
                ${personalMsgEmpty}
            </div>
        `; 
    } 
    contentArea.innerHTML = htmlTop + leaderboardHtml; 
}

// --- QUẢN LÝ KHO BÀI TẬP ADMIN ---
async function quanLyNganHang(sub, forceReload = false) { 
    closeMenu(); curSub = sub; 
    if (!forceReload && Data[sub] && Data[sub].length > 0) { renderGiaoDienKho(sub); return; } 
    contentArea.innerHTML = `
        <div class="text-center mt-10">
            <i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i>
            <p class="mt-2 font-bold text-gray-500">Đang tải dữ liệu...</p>
        </div>
    `; 
    try { 
        const qs = await (await fetch(API_URL+"?type="+sub+"&t="+Date.now())).json(); 
        Data[sub] = qs; if(sub === 'vietnamese') Data.tv = qs; if(sub === 'tv') Data.vietnamese = qs; 
        renderGiaoDienKho(sub); 
    } catch(e) { console.log("Lỗi tải kho:", e); } 
}

function renderGiaoDienKho(sub) { 
    const qs = Data[sub]; const groups = [...new Set(qs.map(q => q.group))].filter(g => g).sort(); 
    let filterOptions = `<option value="all">-- Tất cả các Tuần --</option>` + groups.map(g => `<option value="${String(g).replace(/"/g, '&quot;')}">${g}</option>`).join(''); 
    
    contentArea.innerHTML = `
        <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
                <button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <h2 class="font-black text-xl text-indigo-900 uppercase">KHO ${sub === 'math' ? 'TOÁN' : 'T.VIỆT'}</h2>
            </div>
            <button onclick="renderFormCauHoi(null)" class="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold btn-3d text-sm">
                <i class="fas fa-plus mr-1"></i> Tạo câu mới
            </button>
        </div>
        <select id="qFilter" onchange="filterQuestions()" class="w-full p-3 rounded-xl border-2 border-slate-200 mb-6 font-bold text-slate-700 outline-none focus:border-indigo-500">
            ${filterOptions}
        </select>
        <div id="listQuestions" class="space-y-4"></div>
    `; 
    filterQuestions(); 
}

window.filterQuestions = function() { 
    const val = document.getElementById("qFilter").value; 
    let list = val === 'all' ? Data[curSub] : Data[curSub].filter(q => String(q.group) === val); 
    
    if (list.length === 0) { document.getElementById("listQuestions").innerHTML = '<p class="text-center text-slate-400 py-10">Trống</p>'; return; } 
    
    let grouped = {}; list.forEach(q => { if (q.group) { if (!grouped[q.group]) grouped[q.group] = []; grouped[q.group].push(q); } }); 
    let sortedGroups = Object.keys(grouped).sort((a, b) => { let numA = parseInt(a.replace(/\D/g, '')) || 0; let numB = parseInt(b.replace(/\D/g, '')) || 0; if(numA !== numB) return numA - numB; return a.localeCompare(b); }); 
    
    let html = ""; 
    sortedGroups.forEach(grp => { 
        let questions = grouped[grp]; 
        html += `
            <div class="bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 mb-6 fade-in">
                <div class="flex items-center justify-between border-b-2 border-indigo-50 pb-3 mb-4">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-layer-group text-indigo-500 text-xl"></i>
                        <h3 class="font-black text-lg text-slate-800 uppercase">${grp}</h3>
                    </div>
                    <span class="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">${questions.length} câu</span>
                </div>
                <div class="space-y-3">
        `; 
        
        questions.forEach((q, index) => { 
            // FIX SẬP KHO TOÁN: Sử dụng chuỗi rỗng nếu q.question bị undefined
            let qText = parseImg(q.question || ""); 
            if(qText.includes('[BAIDOC]')) qText = "<span class='text-yellow-600 font-bold'>[CHỨA BÀI ĐỌC]</span> " + qText.replace(/\[BAIDOC\].*?\[\/BAIDOC\]/s, '').trim();
            
            html += `
                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition relative">
                    <div class="flex justify-between items-start">
                        <div class="flex gap-3 w-full pr-16">
                            <span class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">${index + 1}</span>
                            <div class="font-medium text-slate-700 text-base mt-1 overflow-hidden break-words w-full [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mt-2">
                                ${qText}
                            </div>
                        </div>
                        <div class="flex gap-2 absolute top-4 right-4">
                            <button onclick="renderFormCauHoi('${q.id}')" class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm" title="Sửa"><i class="fas fa-edit"></i></button>
                            <button onclick="xoaCauHoi('${q.id}')" class="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition shadow-sm" title="Xóa"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `; 
        }); 
        html += `</div></div>`; 
    }); 
    document.getElementById("listQuestions").innerHTML = html; 
};

window.renderFormCauHoi = function(id) { 
    const q = id ? Data[curSub].find(x => x.id === id) : { group: '', time: 10, question: '', a: '', b: '', c: '', d: '', correct: 'a' }; 
    const groups = [...new Set(Data[curSub].map(x => x.group))].filter(g => g); 
    const dl = `<datalist id="groupList">${groups.map(g => `<option value="${g}">`).join('')}</datalist>`; 
    
    let isTV = (curSub === 'vietnamese' || curSub === 'tv');
    let baiDocHtml = ""; 
    let cauHoiHtml = q.question || "";

    if (isTV && cauHoiHtml) {
        let match = cauHoiHtml.match(/\[BAIDOC\](.*?)\[\/BAIDOC\]/s);
        if (match) {
            baiDocHtml = match[1]; 
            cauHoiHtml = cauHoiHtml.replace(match[0], '').trim();
        } else if (cauHoiHtml.includes('[ĐOẠN VĂN]')) {
            baiDocHtml = cauHoiHtml.replace('[ĐOẠN VĂN]', '').trim(); 
            cauHoiHtml = ""; 
        }
    }

    let formLayout = "";
    if (isTV) {
        formLayout = `
            <div class="mb-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl">
                <label class="text-xs font-black text-yellow-700 uppercase tracking-wider block mb-2"><i class="fas fa-book-reader"></i> Khung Bài Đọc (Chỉ cần nhập ở 1 câu bất kỳ của Tuần)</label>
                ${getRichTextToolbar('frmBaiDoc')}
                <div id="frmBaiDoc" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[120px] bg-white border border-yellow-300 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${baiDocHtml}</div>
            </div>
            <div class="w-full mb-4">
                <label class="text-xs font-black text-green-700 uppercase tracking-wider block mb-2"><i class="fas fa-question-circle"></i> Khung Câu Hỏi</label>
                ${getRichTextToolbar('frmQ')}
                <div id="frmQ" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[120px] bg-white border-2 border-green-200 p-4 rounded-xl outline-none focus:border-green-500 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${cauHoiHtml}</div>
            </div>
        `;
    } else {
        formLayout = `
            <div class="w-full mb-4">
                <label class="text-xs font-black text-indigo-700 uppercase tracking-wider block mb-2"><i class="fas fa-calculator"></i> Nội dung câu hỏi (Hỗ trợ chèn Ảnh)</label>
                ${getRichTextToolbar('frmQ')}
                <div id="frmQ" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[150px] bg-white border-2 border-indigo-200 p-4 rounded-xl outline-none focus:border-indigo-500 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:rounded-md">${cauHoiHtml}</div>
            </div>
        `;
    }
    
    contentArea.innerHTML = `
        <div class="flex items-center mb-6">
            <button onclick="quanLyNganHang('${curSub}')" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button>
            <h2 class="font-black text-xl text-indigo-600">${id ? 'SỬA CÂU HỎI' : 'TẠO CÂU HỎI MỚI'}</h2>
        </div>
        
        <div class="bg-white p-5 rounded-3xl shadow border space-y-4 fade-in">
            ${dl}
            <div class="grid grid-cols-3 gap-3 mb-4">
                <div class="col-span-2">
                    <label class="text-xs font-bold text-slate-500 uppercase">Tên Bài Tập (Ví dụ: Tuần 1)</label>
                    <input type="text" id="frmG" list="groupList" value="${q.group}" class="edit-input w-full mt-1" placeholder="Ví dụ: Tuần 1">
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-500 uppercase">Phút</label>
                    <input type="number" id="frmT" value="${q.time}" class="edit-input w-full mt-1 text-center">
                </div>
            </div>
            
            ${formLayout}
            
            <div class="grid grid-cols-2 gap-3 mt-4">
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án A</label><input type="text" id="frmA" value="${q.a}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án B</label><input type="text" id="frmB" value="${q.b}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án C</label><input type="text" id="frmC" value="${q.c}" class="edit-input w-full mt-1"></div>
                <div><label class="text-xs font-bold text-slate-500 uppercase">Đáp án D</label><input type="text" id="frmD" value="${q.d}" class="edit-input w-full mt-1"></div>
            </div>
            
            <div class="mt-4">
                <label class="text-xs font-bold text-slate-500 uppercase">Chọn Đáp Án Đúng</label>
                <select id="frmCorr" class="edit-input w-full mt-1 bg-yellow-50 text-yellow-800 border-yellow-200">
                    <option value="a" ${q.correct=='a'?'selected':''}>Đáp án A</option>
                    <option value="b" ${q.correct=='b'?'selected':''}>Đáp án B</option>
                    <option value="c" ${q.correct=='c'?'selected':''}>Đáp án C</option>
                    <option value="d" ${q.correct=='d'?'selected':''}>Đáp án D</option>
                </select>
            </div>
            
            <button onclick="luuCauHoi('${id || ''}')" class="w-full bg-indigo-600 text-white py-4 rounded-xl font-black btn-3d shadow-lg mt-6 text-lg hover:bg-indigo-700 transition">
                <i class="fas fa-save mr-2"></i> LƯU CÂU HỎI LÊN HỆ THỐNG
            </button>
        </div>
    `; 
};
window.luuCauHoi = async function(id) { 
    let finalQuestionText = document.getElementById("frmQ").innerHTML;
    let isTV = (curSub === 'vietnamese' || curSub === 'tv');
    
    // Gộp bài đọc vào câu hỏi để lưu vào Sheets
    if (isTV) {
        let baiDocText = document.getElementById("frmBaiDoc").innerHTML.trim();
        if (baiDocText && baiDocText !== '<br>') { 
            finalQuestionText = `[BAIDOC]${baiDocText}[/BAIDOC] ` + finalQuestionText; 
        }
    }

    const data = { 
        id: id, subject: curSub, group: document.getElementById("frmG").value, time: document.getElementById("frmT").value, 
        question: finalQuestionText, a: document.getElementById("frmA").value, b: document.getElementById("frmB").value, 
        c: document.getElementById("frmC").value, d: document.getElementById("frmD").value, correct: document.getElementById("frmCorr").value, image: "" 
    }; 
    
    if(!data.group || !finalQuestionText.trim()) return alert("Vui lòng điền đủ Tên bài và Câu hỏi!"); 
    
    document.getElementById('loader').style.display = 'flex'; 
    await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: id ? 'sua_cau_hoi' : 'them_cau_hoi', data: data }) }); 
    window.isQuizDataLoaded = false; 
    alert("Lưu thành công!"); 
    document.getElementById('loader').style.display = 'none'; 
    quanLyNganHang(curSub, true); 
};

window.xoaCauHoi = async function(id) { 
    if(confirm("Thầy có chắc chắn muốn xóa câu hỏi này không?")) { 
        document.getElementById('loader').style.display = 'flex'; 
        await fetch(API_URL, { method:'POST', body:JSON.stringify({ action: 'xoa_cau_hoi', data: { id: id, subject: curSub } }) }); 
        window.isQuizDataLoaded = false; 
        alert("Đã xóa!"); 
        document.getElementById('loader').style.display = 'none'; 
        quanLyNganHang(curSub, true); 
    } 
};

// --- LÀM BÀI TẬP HỌC SINH (CHIA ĐÔI MÀN HÌNH TIẾNG VIỆT & VÉ LÀM LẠI) ---
window.loadSubject = async function(sub) { 
    if(!currentUser) return showLogin(); curSub = sub; 
    if (!window.isQuizDataLoaded) {
        contentArea.innerHTML = `<div class="text-center mt-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 font-bold text-gray-500">Đang tải bài tập...</p></div>`; 
        try { 
            const [mRes, tRes, lRes] = await Promise.all([ fetch(API_URL + "?type=math&t=" + Date.now()), fetch(API_URL + "?type=vietnamese&t=" + Date.now()), fetch(API_URL + "?type=history_all&t=" + Date.now()) ]); 
            Data.math = await mRes.json(); Data.tv = await tRes.json(); Data.vietnamese = Data.tv; Data.log = await lRes.json(); window.isQuizDataLoaded = true; 
        } catch(e) {}
    }
    const qs = Data[sub]; if (!qs) { alert("Không tải được dữ liệu môn này. Vui lòng bấm Đồng Bộ."); return veTrangChu(); }
    const grps = [...new Set(qs.map(x => x.group))].sort(); 
    let html = `<div class="flex items-center mb-6"><button onclick="moGocHocTap()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-indigo-900 uppercase">${sub === 'math' ? 'TOÁN' : 'TIẾNG VIỆT'}</h2></div><div class="space-y-3">`; 
    
    if(grps.length === 0) { html += `<p class="text-center text-gray-400 mt-10">Hiện chưa có bài tập nào.</p>`; } 
    else {
        grps.forEach(g => { 
            const isDone = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === sub && l.group === g); 
            const time = qs.find(q => q.group === g).time || 10; 
            const count = qs.filter(q => q.group === g && (q.a || q.b || q.c || q.d || !(q.question||"").includes('[BAIDOC]'))).length; 
            
            let clickAction = `startQuiz('${g}', ${time})`; 
            if (isDone && currentUser.role === 'student') { 
                let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0');
                if(tokens > 0) { clickAction = `promptRedo('${g}', ${time})`; } 
                else { clickAction = `alert('Con đã làm bài này rồi. Hãy quay Vòng Quay Nhân Phẩm để tìm VÉ LÀM LẠI nhé!')`; }
            } 
            
            let badgeHtml = !isDone ? `<span class="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded animate-pulse shadow-md">MỚI</span>` : `<span class="bg-slate-200 text-slate-500 text-[10px] font-black px-2 py-1 rounded"><i class="fas fa-lock text-xs mr-1"></i>ĐÃ LÀM</span>`; 
            html += `<div onclick="${clickAction}" class="bg-white p-4 rounded-2xl border-2 flex justify-between items-center cursor-pointer hover:-translate-y-1 transition btn-3d ${isDone ? 'border-green-100 bg-green-50/40 opacity-80' : 'border-indigo-50'}"><div class="flex items-center gap-4"><div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isDone ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'}"><i class="fas ${isDone ? 'fa-check-circle' : 'fa-star'}"></i></div><div><h3 class="font-black text-lg text-slate-700">${g}</h3><p class="text-xs font-bold text-slate-400 mt-1"><i class="fas fa-clock mr-1"></i>${time} phút • ${count} câu</p></div></div>${badgeHtml}</div>`; 
        }); 
    } contentArea.innerHTML = html + `</div>`; 
};

window.promptRedo = function(group, time) {
    let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0');
    if(tokens > 0) {
        if(confirm(`Con đang có ${tokens} VÉ LÀM LẠI.\nCon có chắc chắn muốn dùng 1 vé để mở khóa và làm lại [${group}] không?`)) {
            localStorage.setItem('redo_tokens_'+currentUser.id, tokens - 1);
            Data.log = Data.log.filter(l => !(String(l.id) === String(currentUser.id) && l.group === group));
            startQuiz(group, time);
        }
    }
};

window.startQuiz = function(group, timeMins) { 
    curGrp = group; let rawQuiz = Data[curSub].filter(q => q.group === group);
    quiz = []; readingPassage = "";

    rawQuiz.forEach(q => {
        let qText = q.question || "";
        let match = qText.match(/\[BAIDOC\](.*?)\[\/BAIDOC\]/s);
        if (match) { readingPassage = match[1]; qText = qText.replace(match[0], '').trim(); } 
        else if (qText.includes('[ĐOẠN VĂN]')) { readingPassage = qText.replace('[ĐOẠN VĂN]', '').trim(); qText = ""; }
        if (qText !== "" || q.a || q.b) { quiz.push({ ...q, question: qText }); }
    });

    quiz = quiz.sort(() => Math.random() - 0.5).slice(0, 10);
    currentQIndex = 0; score = 0; wrongAnswersLog = []; 
    
    if (curSub === 'vietnamese' || curSub === 'tv') {
        if (!readingPassage) readingPassage = "Hãy đọc kỹ các câu hỏi bên phải và chọn đáp án đúng nhất nhé!";
        renderVietnameseFrame();
    } else { renderQuizFrame(); }
    
    renderQuestion(0); startTimer(timeMins * 60); 
};

function renderQuizFrame() { 
    contentArea.innerHTML = `<div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4"><div class="flex items-center gap-3"><button onclick="loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-indigo-900 truncate max-w-[150px]">${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black text-indigo-600 shadow-sm border border-indigo-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div><div id="quizBox" class="bg-white p-5 sm:p-8 rounded-[2rem] shadow-xl border-4 border-white min-h-[400px] text-base sm:text-lg"></div>`; 
}

function renderVietnameseFrame() {
    contentArea.innerHTML = `<div class="sticky top-20 bg-[#f0f7ff] z-30 py-3 flex justify-between items-center mb-4"><div class="flex items-center gap-3"><button onclick="loadSubject(curSub)" class="bg-white w-10 h-10 rounded-full shadow-sm text-slate-500 font-bold border"><i class="fas fa-times"></i></button><span class="font-black text-green-700 truncate max-w-[150px]">${curGrp}</span></div><div class="bg-white px-4 py-2 rounded-full font-black text-green-600 shadow-sm border border-green-100 flex items-center gap-2"><i class="fas fa-stopwatch text-orange-500 animate-pulse"></i><span id="quizTimer">00:00</span></div></div><div class="flex flex-col lg:flex-row gap-6"><div class="lg:w-1/2 bg-[#fffbeb] p-6 sm:p-8 rounded-[2rem] border-2 border-yellow-200 shadow-inner lg:h-[75vh] overflow-y-auto relative custom-scrollbar"><div class="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[10px] font-black px-4 py-1 rounded-bl-xl opacity-80">BÀI ĐỌC</div><h3 class="font-black text-yellow-800 text-xl mb-4 flex items-center gap-2 border-b-2 border-yellow-200 pb-3"><i class="fas fa-book-reader text-2xl"></i> NỘI DUNG ĐỌC HIỂU</h3><div class="text-slate-800 leading-[1.8] text-base sm:text-lg whitespace-pre-wrap font-medium pb-10 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${parseImg(readingPassage)}</div></div><div class="lg:w-1/2" id="quizBox"></div></div>`;
}

function renderQuestion(index) { 
    if (index >= quiz.length) { finishQuiz(); return; } const q = quiz[index]; 
    let colorTheme = (curSub === 'vietnamese' || curSub === 'tv') ? 'text-green-600' : 'text-indigo-600';
    let wrapperClass = (curSub === 'vietnamese' || curSub === 'tv') ? 'bg-white p-6 rounded-[2rem] shadow-lg border-2 border-slate-100' : '';

    document.getElementById("quizBox").innerHTML = `
        <div class="${wrapperClass} fade-in">
            <div class="mb-6"><div class="text-sm font-black ${colorTheme} mb-3 uppercase tracking-widest bg-slate-50 inline-block px-3 py-1 rounded-lg border border-slate-200">CÂU HỎI ${index + 1} / ${quiz.length}</div><div class="text-xl sm:text-2xl font-bold text-slate-800 leading-snug [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-sm [&_img]:my-4">${parseImg(q.question)}</div></div>
            <div class="space-y-4">${['a','b','c','d'].filter(k => q[k]).map(key => `<div onclick="checkAns(this, '${key}', '${q.correct}', ${index})" class="quiz-option p-4 sm:p-5 border-2 border-slate-100 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition btn-3d bg-white"><span class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase text-lg shrink-0 shadow-inner">${key}</span><div class="font-bold text-slate-700 flex-1 text-base sm:text-lg leading-relaxed">${parseImg(q[key])}</div></div>`).join('')}</div>
        </div>
    `; 
}

window.checkAns = function(el, selected, correct, index) { 
    document.querySelectorAll('.quiz-option').forEach(x => x.classList.add('pointer-events-none', 'opacity-70')); const q = quiz[index]; 
    if (selected === correct.toLowerCase()) { el.classList.add('!bg-green-100', '!border-green-500', '!text-green-800', 'scale-[1.02]'); score += 10; } 
    else { el.classList.add('!bg-red-100', '!border-red-500', '!text-red-800', 'scale-[0.98]'); let qText = parseImg(q.question); let wrongAnsText = parseImg(q[selected]); let correctAnsText = parseImg(q[correct]); let wrongText = `<div class="bg-white p-4 rounded-xl border border-red-200 mb-3 shadow-sm"><p class="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2"><span class="text-red-500">Câu ${index+1}:</span> ${qText}</p><div class="space-y-2 mt-3"><p class="text-red-600 text-sm bg-red-50 p-2 rounded-lg border border-red-100"><i class="fas fa-times-circle mr-1"></i> <b>Bé chọn (${selected.toUpperCase()}):</b> <span class="font-medium">${wrongAnsText}</span></p><p class="text-green-600 text-sm bg-green-50 p-2 rounded-lg border border-green-100"><i class="fas fa-check-circle mr-1"></i> <b>Đáp án đúng (${correct.toUpperCase()}):</b> <span class="font-medium">${correctAnsText}</span></p></div></div>`; wrongAnswersLog.push(wrongText); } 
    setTimeout(() => renderQuestion(index + 1), 1200); 
};

function startTimer(seconds) { clearInterval(timer); let t = seconds; timer = setInterval(() => { let m = Math.floor(t / 60), s = t % 60; document.getElementById('quizTimer').innerText = `${m}:${s < 10 ? '0' + s : s}`; if (t <= 0) { clearInterval(timer); alert("Hết giờ làm bài!"); finishQuiz(); } t--; }, 1000); }

async function finishQuiz() { 
    clearInterval(timer); const maxPossibleScore = quiz.length * 10; 
    if (score > 0 && score === maxPossibleScore) { var duration = 3 * 1000; var animationEnd = Date.now() + duration; var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; var interval = setInterval(function() { var timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } var particleCount = 50 * (timeLeft / duration); confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }); }, 250); } 
    contentArea.innerHTML = `<div class="text-center bg-white p-10 rounded-[3rem] shadow-2xl fade-in max-w-lg mx-auto mt-10 border-t-8 border-indigo-500"><div class="text-7xl mb-6 animate-bounce">🏆</div><h3 class="text-3xl font-black text-slate-800 mb-2 uppercase tracking-wider">ĐIỂM CỦA CON</h3><p class="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-10 drop-shadow-sm">${score}</p><button onclick="loadSubject(curSub)" class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl btn-3d shadow-lg w-full hover:scale-[1.02] transition">HOÀN TẤT & TRỞ VỀ</button></div>`; 
    if(currentUser.role === 'student') { 
        let submitTime = new Date().toISOString(); 
        await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: curSub, group: curGrp, score_earned: score, details: wrongAnswersLog.join('') } }) }); 
        Data.log.push({ id: currentUser.id, subject: curSub, group: curGrp, score: score, time: submitTime, details: wrongAnswersLog.join('') }); 
    } 
}

// --- 🎡 VÒNG QUAY MAY MẮN ---
window.moVongQuay = async function() {
    if(!currentUser) return showLogin(); closeMenu(); 
    let todayStr = new Date().toLocaleDateString('vi-VN');
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id) || '{"date": "", "extra": 0, "usedFree": false}');
    if (spinLog.date !== todayStr) { spinLog = { date: todayStr, extra: 0, usedFree: false }; }
    
    let btnStyle = "from-slate-400 to-slate-500 opacity-50 pointer-events-none";
    let slicesHtml = PRIZES.map((p, i) => `<div class="absolute inset-0 flex justify-center" style="transform: rotate(${i * 60}deg);"><div class="pt-5 font-black text-white text-sm drop-shadow-md w-16 text-center leading-tight z-20" style="transform: rotate(0deg);">${p.text}</div></div>`).join('');
    let gradColors = `${PRIZES[0].color} 0deg 60deg, ${PRIZES[1].color} 60deg 120deg, ${PRIZES[2].color} 120deg 180deg, ${PRIZES[3].color} 180deg 240deg, ${PRIZES[4].color} 240deg 300deg, ${PRIZES[5].color} 300deg 360deg`;

    contentArea.innerHTML = `
        ${getNavHtml('vongquay')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 text-center fade-in">
            <h2 class="text-2xl font-black text-slate-800 mb-2 uppercase text-yellow-500">Vòng Quay May Mắn</h2>
            <div class="flex justify-center items-center gap-4 mb-6">
                <p class="text-slate-500 font-bold text-sm">Điểm: <span id="vqCurrentScore" class="text-indigo-600 font-black text-lg">${currentUser.score || 0}</span></p>
                <p class="text-slate-500 font-bold text-sm border-l-2 pl-4">Vé làm lại: <span class="text-orange-500 font-black text-lg">${localStorage.getItem('redo_tokens_'+currentUser.id) || 0}</span></p>
            </div>
            <div class="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-8">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-5xl text-yellow-500 drop-shadow-xl z-30 animate-bounce"><i class="fas fa-caret-down"></i></div>
                <div id="wheel" class="w-full h-full rounded-full border-8 border-yellow-400 shadow-2xl relative overflow-hidden" style="background: conic-gradient(from -30deg, ${gradColors}); transition: transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99);">
                    ${slicesHtml}
                    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full z-30 shadow-inner flex items-center justify-center text-xl">🎡</div>
                </div>
            </div>
            <button id="btnSpin" onclick="thucHienQuay()" class="bg-gradient-to-r text-white px-10 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition ${btnStyle}"><i class="fas fa-spinner fa-spin mr-2"></i> ĐANG KẾT NỐI...</button>
        </div>
    `;

    if(Data.log.length === 0) { try { Data.log = await (await fetch(API_URL+"?type=history_all&t="+Date.now())).json(); } catch(e){} }
    let hasSpunTodayOnServer = Data.log.some(l => String(l.id) === String(currentUser.id) && l.subject === "LuckySpin" && String(l.group).includes(todayStr));
    if (hasSpunTodayOnServer) { spinLog.usedFree = true; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); }
    
    let btnUpdate = document.getElementById('btnSpin');
    if (btnUpdate) {
        let canSpin = !spinLog.usedFree || spinLog.extra > 0;
        btnUpdate.innerHTML = canSpin ? (spinLog.usedFree ? `QUAY (+${spinLog.extra} LƯỢT)` : "QUAY MIỄN PHÍ") : "ĐÃ HẾT LƯỢT HÔM NAY";
        btnUpdate.className = canSpin ? "bg-gradient-to-r text-white px-10 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition from-yellow-400 to-orange-500 hover:scale-[1.02]" : "bg-gradient-to-r text-white px-10 py-4 rounded-2xl font-black shadow-lg btn-3d text-xl transition from-slate-400 to-slate-500 opacity-50 pointer-events-none";
    }
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
    if (rand < 10) idx = 0; else if (rand < 30) idx = 1; else if (rand < 50) idx = 2; else if (rand < 60) idx = 3; else if (rand < 70) idx = 4; else idx = 5;                           

    let prize = PRIZES[idx];
    let wheel = document.getElementById('wheel'); let currentRot = parseFloat(wheel.getAttribute('data-rot') || 0);
    let nextRot = currentRot + (360 * 5) + (360 - (currentRot % 360)) - (idx * 60); 
    wheel.style.transform = `rotate(${nextRot}deg)`; wheel.setAttribute('data-rot', nextRot);
    
    setTimeout(async () => {
        isSpinning = false;
        let uniqueGroup = "Vòng quay ngày " + todayStr + " (" + Date.now() + ")";

        if (prize.extraSpin > 0) { spinLog.extra += prize.extraSpin; localStorage.setItem('spinLog_' + currentUser.id, JSON.stringify(spinLog)); }
        if (prize.id === 'redo') { let tokens = parseInt(localStorage.getItem('redo_tokens_'+currentUser.id) || '0'); localStorage.setItem('redo_tokens_'+currentUser.id, tokens + 1); }
        if (prize.id === 'riddle') { showRiddleModal(todayStr, uniqueGroup); return; }

        showPrizeModal(prize);
        if (prize.netScore !== 0) { currentUser.score = Number(currentUser.score) + prize.netScore; document.getElementById('vqCurrentScore').innerText = currentUser.score; }

        try {
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score_earned: prize.netScore, details: "Quay trúng: " + prize.text } }) });
            Data.log.push({ id: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score: prize.netScore, time: new Date().toISOString() });
        } catch(e) {}
        
        if (prize.netScore > 0 || prize.extraSpin > 0 || prize.id === 'redo') {
            var dur = 3000; var end = Date.now() + dur; 
            var int = setInterval(function() { if (end - Date.now() <= 0) return clearInterval(int); confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, particleCount: 50 * ((end - Date.now()) / dur), origin: { x: Math.random(), y: Math.random() - 0.2 } }); }, 250);
        }
        restoreSpinButton(spinLog);
    }, 4000);
};

function restoreSpinButton(spinLog) {
    let btnUpdate = document.getElementById('btnSpin'); if (!btnUpdate) return;
    let canSpinNow = !spinLog.usedFree || spinLog.extra > 0;
    if (canSpinNow) { btnUpdate.classList.remove('opacity-50', 'pointer-events-none'); btnUpdate.innerText = spinLog.usedFree ? `QUAY (+${spinLog.extra} LƯỢT)` : "QUAY MIỄN PHÍ"; } 
    else { btnUpdate.innerText = "ĐÃ HẾT LƯỢT HÔM NAY"; btnUpdate.className = "w-full px-10 py-4 rounded-2xl font-black shadow-lg text-xl transition bg-gradient-to-r from-slate-400 to-slate-500 opacity-50 pointer-events-none text-white"; }
}

function showRiddleModal(todayStr, uniqueGroup) {
    let a = Math.floor(Math.random() * 10) + 1; let b = Math.floor(Math.random() * 10) + 1; let c = Math.floor(Math.random() * 10) + 1;
    let correctAns = a + b * c; 
    let overlay = document.createElement('div'); overlay.id = "riddleModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `
        <div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 border-purple-500 animate-[cascadeDrop_0.5s_ease-out_forwards]">
            <div class="text-6xl mb-4 animate-bounce">🧠</div><h3 class="text-2xl font-black text-purple-600 mb-2 uppercase">Thử Tài Giải Đố</h3>
            <p class="text-slate-600 font-bold mb-6">Tính nhanh phép toán sau để nhận ngay 20 điểm:</p>
            <div class="bg-purple-50 text-purple-800 text-3xl font-black p-4 rounded-xl mb-6 shadow-inner border border-purple-200">${a} + ${b} x ${c} = ?</div>
            <input type="number" id="riddleAns" class="w-full p-4 border-2 border-purple-200 rounded-xl font-bold text-2xl text-center mb-6 focus:border-purple-500 outline-none" placeholder="Đáp án của con...">
            <button onclick="checkRiddle(${correctAns}, '${todayStr}', '${uniqueGroup}')" class="w-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-4 rounded-xl font-black shadow-lg btn-3d hover:scale-[1.02] transition">TRẢ LỜI</button>
        </div>`;
    document.body.appendChild(overlay); setTimeout(() => document.getElementById('riddleAns').focus(), 100);
}

window.checkRiddle = async function(correctAns, todayStr, uniqueGroup) {
    let ansStr = document.getElementById('riddleAns').value; if(!ansStr) return alert("Con chưa nhập đáp án kìa!");
    document.getElementById('riddleModal').remove();
    let prize = { icon: "", text: "Giải Đố", color: "", msg: "", netScore: 0 };
    if (parseInt(ansStr) === correctAns) { prize.netScore = 20; prize.msg = "Giỏi quá! Con tính đúng và được thưởng 20 điểm."; prize.icon = "🎉"; prize.color = "#34d399"; } 
    else { prize.msg = `Tiếc quá! Đáp án đúng là ${correctAns}. Hãy cẩn thận hơn ở lần sau nhé!`; prize.icon = "😅"; prize.color = "#f87171"; }
    if (prize.netScore !== 0) { currentUser.score = Number(currentUser.score) + prize.netScore; document.getElementById('vqCurrentScore').innerText = currentUser.score; }
    showPrizeModal(prize);
    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score_earned: prize.netScore, details: "Quay trúng: Giải đố (" + prize.netScore + "đ)" } }) }); Data.log.push({ id: currentUser.id, subject: "LuckySpin", group: uniqueGroup, score: prize.netScore, time: new Date().toISOString() }); } catch(e) {}
    if (prize.netScore > 0) { var dur = 3000; var end = Date.now() + dur; var int = setInterval(function() { if (end - Date.now() <= 0) return clearInterval(int); confetti({ startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, particleCount: 50 * ((end - Date.now()) / dur), origin: { x: Math.random(), y: Math.random() - 0.2 } }); }, 250); }
    let spinLog = JSON.parse(localStorage.getItem('spinLog_' + currentUser.id)); restoreSpinButton(spinLog);
};

function showPrizeModal(prize) {
    let overlay = document.createElement('div'); overlay.id = "prizeModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `<div class="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-t-8 animate-[cascadeDrop_0.5s_ease-out_forwards]" style="border-color: ${prize.color}"><div class="text-7xl mb-4 animate-bounce">${prize.icon}</div><h3 class="text-2xl font-black text-slate-800 mb-2">${prize.text}</h3><p class="text-slate-600 font-bold mb-6">${prize.msg}</p><button onclick="document.getElementById('prizeModal').remove()" class="w-full text-white py-3 rounded-xl font-black shadow-md transition hover:opacity-80" style="background-color: ${prize.color}">ĐÓNG</button></div>`;
    document.body.appendChild(overlay);
}

// --- 💬 THƯ BÍ MẬT & XIN PHÉP ---
window.moHopThuBiMat = function() {
    if(!currentUser) return showLogin(); closeMenu();
    contentArea.innerHTML = `
        ${getNavHtml('thubimat')}
        <div class="bg-[#fff0f5] p-6 rounded-[2rem] shadow-sm border-2 border-pink-200 space-y-5 fade-in relative overflow-hidden">
            <p class="text-slate-600 font-bold text-sm relative z-10 leading-relaxed">Thầy Hiển luôn ở đây để lắng nghe con.</p>
            <textarea id="mailContent" class="w-full bg-white border-2 border-pink-200 p-4 rounded-2xl font-medium text-slate-700 outline-none focus:border-pink-400 transition min-h-[150px] relative z-10" placeholder="Viết điều con muốn nói vào đây..."></textarea>
            <label class="flex items-center gap-3 cursor-pointer relative z-10 bg-white p-3 rounded-xl border border-pink-100"><input type="checkbox" id="mailAnon" class="w-5 h-5 accent-pink-500 cursor-pointer"><span class="font-bold text-slate-600 text-sm">Gửi giấu tên</span></label>
            <button onclick="guiThuBiMat()" class="w-full bg-pink-500 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-pink-600 transition relative z-10"><i class="fas fa-paper-plane mr-2"></i> GỬI CHO THẦY HIỂN</button>
        </div>
    `;
};

window.guiThuBiMat = async function() {
    const content = document.getElementById('mailContent').value.trim(); const isAnon = document.getElementById('mailAnon').checked; if(!content) return alert("Con chưa viết gì cả!");
    document.getElementById('loader').style.display = 'flex';
    try { await fetch(API_URL, { method:'POST', body: JSON.stringify({ action:'gui_thu_bi_mat', data:{ id:currentUser.id, name:currentUser.name, isAnonymous: isAnon, content: content } }) }); alert("Đã gửi thư thành công! Cảm ơn con đã chia sẻ, thầy Hiển sẽ đọc sớm thôi."); veTrangChu(); } 
    catch(e) { alert("Lỗi mạng, chưa gửi được thư!"); }
    document.getElementById('loader').style.display = 'none';
};

window.moXinPhep = function() { 
    if(!currentUser) return showLogin(); closeMenu(); 
    contentArea.innerHTML = `<div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 space-y-5 fade-in"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Ngày nghỉ</label><input type="date" id="lDate" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700"></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại xin phép</label><select id="lType" onchange="changeLeaveType()" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Nghỉ học và bán trú">Nghỉ học và bán trú</option><option value="Nghỉ Bán trú">Nghỉ Bán trú</option></select></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian nghỉ</label><select id="lSession" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-red-400 transition"><option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option></select></div></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Lý do (Bệnh, việc gia đình...)</label><textarea id="lReason" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-medium text-slate-700 outline-none focus:border-red-400 transition" rows="3" placeholder="Nhập lý do chi tiết..."></textarea></div><button onclick="sendLeave()" class="w-full bg-red-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-red-700 transition"><i class="fas fa-paper-plane mr-2"></i> GỬI ĐƠN CHO GVCN</button></div>`; 
    document.getElementById('lDate').valueAsDate = new Date(Date.now()+86400000); 
};
window.changeLeaveType = function() { const type = document.getElementById('lType').value; const session = document.getElementById('lSession'); if (type === 'Nghỉ Bán trú') { session.innerHTML = `<option value="Ăn trưa và Không ngủ trưa">Ăn trưa và Không ngủ trưa</option><option value="Không ăn trưa và không ngủ trưa">Không ăn trưa và không ngủ trưa</option>`; } else { session.innerHTML = `<option value="Cả ngày">Cả ngày</option><option value="Chỉ buổi sáng">Chỉ buổi sáng</option><option value="Chỉ buổi chiều">Chỉ buổi chiều</option>`; } };
window.sendLeave = async function() { const d = document.getElementById('lDate').value; const r = document.getElementById('lReason').value; const type = document.getElementById('lType').value; const session = document.getElementById('lSession').value; if(!d || !r) return alert("Vui lòng chọn Ngày nghỉ và Nhập Lý do!"); const combinedType = `${type} (${session})`; document.getElementById('loader').style.display='flex'; try { await fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'gui_xin_phep', data:{ id:currentUser.id, name:currentUser.name, dateOff:d, type:combinedType, reason:r } }) }); alert("Gửi đơn xin phép thành công! Giáo viên đã nhận được."); veTrangChu(); } catch(e) { alert("Lỗi mạng, chưa gửi được đơn!"); } document.getElementById('loader').style.display='none'; };

// --- ADMIN QUẢN LÝ ĐƠN TỪ & TIẾN ĐỘ ---
window.moDonTu = async function() { closeMenu(); contentArea.innerHTML = `<h2 class="text-xl font-black text-red-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải danh sách...</h2>`; const leaves = await (await fetch(API_URL + "?type=absent_list&t=" + Date.now())).json(); let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600 uppercase">HỘP THƯ ĐƠN TỪ</h2></div>`; if (leaves.length === 0) { html += `<p class="text-center text-slate-400 font-medium py-10"><i class="fas fa-check-circle text-4xl mb-3 text-green-200 block"></i>Lớp đi học đầy đủ, không có đơn xin phép nào.</p>`; } else { const groupedLeaves = {}; leaves.forEach(l => { let fDate = l.dateOff; if (fDate.includes('-')) { const parts = fDate.split('-'); if(parts.length === 3) fDate = `${parts[2]}/${parts[1]}/${parts[0]}`; } if (!groupedLeaves[fDate]) groupedLeaves[fDate] = []; groupedLeaves[fDate].push(l); }); html += `<div class="space-y-6 pb-10">`; for (const [dateStr, items] of Object.entries(groupedLeaves)) { html += `<div class="bg-white p-5 sm:p-6 rounded-[2rem] shadow-md border-t-4 border-red-500 fade-in relative overflow-hidden"><div class="flex items-center justify-between mb-4 border-b border-slate-100 pb-3"><div class="flex items-center gap-2"><i class="fas fa-calendar-alt text-red-500 text-xl"></i><h3 class="font-black text-lg text-slate-800">Xin nghỉ ngày: ${dateStr}</h3></div><span class="bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">${items.length} đơn</span></div><div class="space-y-4">`; items.forEach(l => { const isBanTru = l.type.startsWith('Nghỉ Bán trú') || l.type.includes('Chỉ nghỉ Bán trú'); const badgeColor = isBanTru ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-red-100 text-red-700 border-red-200'; const icon = isBanTru ? 'fa-utensils' : 'fa-bed'; const iconBg = isBanTru ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'; let timeSent = ""; try { let d = new Date(l.time); if(isNaN(d)) timeSent = l.time; else timeSent = d.toLocaleString('vi-VN'); } catch(e) { timeSent = l.time; } html += `<div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-4 hover:border-slate-300 transition"><div class="w-10 h-10 ${iconBg} rounded-full flex justify-center items-center text-lg shrink-0"><i class="fas ${icon}"></i></div><div class="flex-1"><div class="flex justify-between items-start mb-1"><span class="font-black text-slate-800">${l.name}</span></div><div class="mb-2"><span class="text-[11px] font-black inline-block px-2 py-1 rounded border ${badgeColor}">${l.type}</span></div><p class="text-[13px] text-slate-700 italic bg-white p-3 rounded-xl border border-slate-100">" ${l.reason} "</p><p class="text-[10px] text-slate-400 mt-2 text-right">Gửi lúc: ${timeSent}</p></div></div>`; }); html += `</div></div>`; } html += `</div>`; } contentArea.innerHTML = html; };

window.moTienDo = async function() { closeMenu(); contentArea.innerHTML = `<h2 class="text-xl font-black text-purple-600 mb-4 text-center"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu toàn lớp...</h2>`; try { Data.math = await (await fetch(API_URL+"?type=math")).json(); Data.tv = await (await fetch(API_URL+"?type=vietnamese")).json(); Data.vietnamese = Data.tv; Data.log = await (await fetch(API_URL+"?type=history_all&t="+Date.now())).json(); } catch(e){} const mathGroups = [...new Set(Data.math.map(x=>x.group))]; const tvGroups = [...new Set(Data.tv.map(x=>x.group))]; const total = mathGroups.length + tvGroups.length; let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600">TIẾN ĐỘ CHUNG (${total} BÀI)</h2></div><p class="text-xs text-slate-500 mb-4 text-center italic"><i class="fas fa-hand-pointer mr-1"></i> Bấm vào tên học sinh để xem chi tiết điểm số & lỗi sai</p><div class="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10 fade-in">`; html += Data.hs.map(h => { const userL = Data.log.filter(l => String(l.id) === String(h.id)); const done = new Set(userL.map(l => l.subject+l.group)).size; const pct = total ? Math.round((done/total)*100) : 0; return `<div onclick="xemChiTietTienDo('${h.id}', '${h.name}')" class="bg-white p-4 rounded-2xl border-2 border-transparent shadow-sm flex justify-between items-center cursor-pointer hover:border-purple-300 hover:shadow-md transition"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center font-black"><i class="fas fa-user"></i></div><span class="font-bold text-slate-700">${h.name}</span></div><div class="w-1/3 text-right"><div class="text-[11px] font-black mb-1 text-slate-500">${done}/${total} BÀI (${pct}%)</div><div class="progress-bar h-1.5"><div class="progress-fill ${pct==100?'bg-green-500':'bg-purple-500'}" style="width:${pct}%"></div></div></div></div>`; }).join(''); contentArea.innerHTML = html + "</div>"; };

window.xemChiTietTienDo = function(studentId, studentName) { const userLogs = Data.log.filter(l => String(l.id) === String(studentId)); const mathGroups = [...new Set(Data.math.map(x=>x.group))].sort(); const tvGroups = [...new Set(Data.tv.map(x=>x.group))].sort(); const renderSubjectProgress = (subjectCode, groupsList) => { if(groupsList.length === 0) return `<p class="text-sm text-slate-400 italic py-2">Chưa có bài tập</p>`; return groupsList.map(grp => { const log = userLogs.find(l => l.subject === subjectCode && l.group === grp); if(log) { const btnChiTiet = log.details ? `<button onclick="xemLoiSai('${studentId}', '${subjectCode}', '${grp}')" class="text-[10px] bg-red-50 text-red-600 font-bold px-3 py-1 rounded hover:bg-red-600 hover:text-white transition shadow-sm"><i class="fas fa-search mr-1"></i>Xem lỗi sai</button>` : `<span class="text-[10px] text-green-500 font-bold px-2 py-1"><i class="fas fa-check-circle"></i> Tuyệt đối</span>`; return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition px-2 rounded-lg"><div class="flex items-center gap-2"><i class="fas fa-check-circle text-green-500 text-lg"></i><span class="font-bold text-slate-700 text-sm">${grp}</span></div><div class="flex items-center gap-3"><span class="font-black text-indigo-600 text-lg">${log.score}đ</span>${btnChiTiet}</div></div>`; } else { return `<div class="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 opacity-50 px-2"><div class="flex items-center gap-2"><i class="far fa-circle text-slate-300 text-lg"></i><span class="font-bold text-slate-500 text-sm line-through">${grp}</span></div><span class="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded">Chưa làm</span></div>`; } }).join(''); }; contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="moTienDo()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-purple-600 uppercase">CHI TIẾT: ${studentName}</h2></div><div class="grid grid-cols-1 md:grid-cols-2 gap-6 fade-in pb-10"><div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-blue-100"><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><i class="fas fa-calculator"></i></div><h3 class="font-black text-blue-800 text-lg">MÔN TOÁN</h3></div><div>${renderSubjectProgress('math', mathGroups)}</div></div><div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"><div class="flex items-center gap-2 mb-4 pb-2 border-b-2 border-green-100"><div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><i class="fas fa-book"></i></div><h3 class="font-black text-green-800 text-lg">MÔN TIẾNG VIỆT</h3></div><div>${renderSubjectProgress('vietnamese', tvGroups)}</div></div></div><div id="modalReview" class="hidden fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm fade-in"><div class="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden flex flex-col max-h-[85vh]"><div class="bg-red-500 p-5 text-white flex justify-between items-center relative shadow-md"><div><h3 class="font-black text-lg uppercase" id="rvTitle">--</h3><p class="text-xs text-red-100 font-bold" id="rvName">--</p></div><button onclick="document.getElementById('modalReview').classList.add('hidden')" class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/40 transition"><i class="fas fa-times"></i></button></div><div id="rvContent" class="p-5 overflow-y-auto bg-slate-50 space-y-4 text-sm text-slate-700 leading-relaxed font-medium"></div></div></div>`; };
window.xemLoiSai = function(studentId, subjectCode, group) { const student = Data.hs.find(s => String(s.id) === String(studentId)); const studentName = student ? student.name : "Học sinh"; const log = Data.log.find(l => String(l.id) === String(studentId) && l.subject === subjectCode && l.group === group); document.getElementById("rvTitle").innerText = "Lỗi sai: " + group; document.getElementById("rvName").innerText = studentName; document.getElementById("rvContent").innerHTML = (log && log.details) ? log.details : '<p class="text-center text-slate-400">Không có dữ liệu chi tiết.</p>'; document.getElementById("modalReview").classList.remove("hidden"); };

window.chuyenTrangQuanLy = function() { closeMenu(); let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600">QUẢN LÝ HS</h2></div><div class="space-y-3">`; html += Data.hs.map(h => `<div onclick="viewProfile('${h.id}')" class="bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"><span class="font-bold text-slate-700">${h.name}</span><span class="text-xs text-gray-500">SĐT: ${h.fatherPhone || h.motherPhone || 'Chưa có'}</span></div>`).join(''); contentArea.innerHTML = html + "</div>"; };

window.viewProfile = function(id) { 
    closeMenu(); const s = Data.hs.find(x => String(x.id) === String(id)); if(!s) return; 
    const avatar = s.gender === 'Nữ' ? '<div class="w-24 h-24 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-graduate"></i></div>' : '<div class="w-24 h-24 bg-blue-100 text-blue-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-astronaut"></i></div>'; 
    let cleanDob = s.dob || 'Chưa cập nhật'; if(cleanDob.includes('T') && cleanDob.includes('.000Z')) { const dt = new Date(cleanDob); cleanDob = ("0" + dt.getDate()).slice(-2) + "/" + ("0" + (dt.getMonth() + 1)).slice(-2) + "/" + dt.getFullYear(); } 
    const renderPhone = (phone, label) => { if(!phone || phone.trim() === '') return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><span class="text-slate-400 italic text-xs">Chưa cập nhật</span></div>`; const cleanPhone = phone.toString().replace(/\D/g, ''); return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><div class="flex items-center gap-2"><span class="font-bold text-slate-700 text-sm">${phone}</span><a href="tel:${cleanPhone}" class="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs hover:bg-green-600 hover:text-white transition"><i class="fas fa-phone"></i></a></div></div>`; }; 
    contentArea.innerHTML = `<div class="flex items-center mb-6"><button onclick="${currentUser && currentUser.role==='admin'?'chuyenTrangQuanLy()':'veTrangChu()'}" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600 uppercase">HỒ SƠ CÁ NHÂN</h2></div><div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-blue-500 fade-in relative overflow-hidden"><div class="text-center mb-6 relative z-10">${avatar}<h2 class="text-2xl font-black text-slate-800">${s.name}</h2><span class="bg-blue-50 text-blue-600 font-mono font-bold px-3 py-1 rounded-full text-xs mt-2 inline-block">ID: ${s.id}</span></div><div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-6 flex items-center justify-between relative overflow-hidden"><div class="absolute -right-4 -bottom-4 text-white opacity-20 text-6xl"><i class="fas fa-gem"></i></div><div><p class="text-xs font-bold opacity-90 uppercase">Điểm tích lũy</p><p class="text-3xl font-black">${s.score || 0}</p></div><div class="text-right"><p class="text-xs font-bold opacity-90 uppercase">Xếp hạng</p><p class="text-lg font-bold"><i class="fas fa-trophy mr-1"></i> Thành viên</p></div></div><div class="space-y-1"><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Ngày sinh</span><b class="text-slate-700">${cleanDob}</b></div><div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Giới tính</span><b class="text-slate-700">${s.gender || '-'}</b></div>${renderPhone(s.fatherPhone, "SĐT Cha")}${renderPhone(s.motherPhone, "SĐT Mẹ")}<div class="py-2"><span class="text-slate-400 font-bold uppercase text-[10px] block mb-1">Địa chỉ</span><b class="text-slate-700 text-sm leading-snug">${s.address || 'Chưa cập nhật'}</b></div></div></div>`; 
};

function checkSinhNhat() {
    if (!currentUser || currentUser.role !== 'student' || !currentUser.dob) return;
    if (sessionStorage.getItem('hpbdShown_' + currentUser.id)) return;
    let dobStr = currentUser.dob; let bDay = 0, bMonth = 0;
    try { if (dobStr.includes('T')) { let dt = new Date(dobStr); bDay = dt.getDate(); bMonth = dt.getMonth() + 1; } else if (dobStr.includes('/')) { let parts = dobStr.split('/'); bDay = parseInt(parts[0]); bMonth = parseInt(parts[1]); } else if (dobStr.includes('-')) { let parts = dobStr.split('-'); bDay = parseInt(parts[2]); bMonth = parseInt(parts[1]); } } catch(e) { return; } 
    let today = new Date();
    if (bDay === today.getDate() && bMonth === (today.getMonth() + 1)) { showHappyBirthdayUI(); sessionStorage.setItem('hpbdShown_' + currentUser.id, 'true'); }
}

function showHappyBirthdayUI() {
    let overlay = document.createElement('div'); overlay.id = "hpbdModal"; overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm fade-in p-4";
    overlay.innerHTML = `<div class="bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 p-1 rounded-[2.5rem] shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-[cascadeDrop_0.8s_ease-out_forwards]"><div class="bg-white rounded-[2.4rem] p-8 text-center relative overflow-hidden"><button onclick="document.getElementById('hpbdModal').remove()" class="absolute top-3 right-4 text-slate-300 hover:text-red-500 transition font-bold text-3xl">&times;</button><div class="text-7xl mb-2 mt-2 animate-bounce">🎂</div><h2 class="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-orange-500 uppercase tracking-wide mb-2">CHÚC MỪNG SINH NHẬT</h2><h3 class="text-3xl font-black text-slate-800 mb-4">${currentUser.name}</h3><div class="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-6 relative"><i class="fas fa-quote-left text-orange-200 text-3xl absolute -top-2 -left-2"></i><p class="text-slate-700 font-bold text-sm leading-relaxed relative z-10">Hôm nay là một ngày thật đặc biệt! Thầy Hiển và tập thể lớp Bốn 6 chúc con thêm tuổi mới luôn vui vẻ, mạnh khỏe, chăm ngoan và đạt được thật nhiều bông hoa điểm 10 nhé! 💖</p></div><button onclick="document.getElementById('hpbdModal').remove()" class="bg-gradient-to-r from-pink-500 to-orange-500 text-white w-full py-4 rounded-2xl font-black shadow-lg btn-3d text-lg hover:scale-[1.02] transition">CẢM ƠN THẦY Ạ!</button></div></div>`;
    document.body.appendChild(overlay);
    var duration = 4 * 1000; var animationEnd = Date.now() + duration; var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 105 };
    var interval = setInterval(function() { var timeLeft = animationEnd - Date.now(); if (timeLeft <= 0) { return clearInterval(interval); } var particleCount = 50 * (timeLeft / duration); confetti({ ...defaults, particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }); }, 250);
}

window.dongBoDuLieu = async function() { 
    if(!confirm("Hành động này sẽ tải lại toàn bộ dữ liệu mới nhất từ Google Sheets. Tiếp tục?")) return; 
    document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG ĐỒNG BỘ MÁY CHỦ..."; 
    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'clear_cache', data: {} }) }); window.isQuizDataLoaded = false; alert("Đồng bộ thành công! Giao diện sẽ tự động tải lại dữ liệu mới."); location.reload(); } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng khi đồng bộ!"); } 
};