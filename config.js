const API_URL = "https://script.google.com/macros/s/AKfycby3g1YD33YvtPHxFrROITYquUiC3-_jw2tuYXDMPZ53RRWdTaDlvvv1MW3aegBzVh9Kdw/exec";

let Data = { hs: [], math: [], tv: [], vietnamese: [], log: [], stats: null, leaves: [], notiList: [] };
let currentUser = null, curSub = null, curGrp = null, quiz = [], timer = null, score = 0, currentQIndex = 0;
let wrongAnswersLog = []; 
window.currentSelectedImg = null;
window.isQuizDataLoaded = false; 

const style = document.createElement('style');
style.innerHTML = `
    @keyframes cascadeDrop { 0% { opacity: 0; transform: translateY(-40px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } } 
    .stagger-item { opacity: 0; animation: cascadeDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
`;
document.head.appendChild(style);

window.onload = async () => {
    localStorage.removeItem('L46_Data_Cache'); 
    try {
        const [resHs, resNoti] = await Promise.all([
            fetch(API_URL + "?type=students&t=" + Date.now()), fetch(API_URL + "?type=thong_bao&t=" + Date.now())
        ]);
        Data.hs = await resHs.json(); 
        Data.notiList = await resNoti.json();
        document.getElementById('connStatus').innerText = "Đã kết nối dữ liệu thành công!"; 
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-green-500";
        
        const role = localStorage.getItem('role');
        if (role === 'admin') { loginAdmin(); } 
        else if (role === 'student') { 
            const u = Data.hs.find(x => x.id === localStorage.getItem('uid')); 
            if (u) loginStudent(u); else loginGuest(); 
        } else { loginGuest(); }
    } catch(e) { 
        document.getElementById('connStatus').innerText = "Lỗi mạng hoặc Link API bị sai!"; 
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-red-500"; 
        loginGuest(); 
    }
};

// BỘ ĐỊNH TUYẾN (ROUTER) CHIA LINK TRANG
window.onpopstate = () => handleRoute();

function handleRoute() {
    const path = window.location.pathname;
    if (currentUser && currentUser.role === 'admin' && (path === '/' || path === '/index.html')) {
        renderDashboardAdmin(true);
        return;
    }
    if (path === '/hoc-tap') moGocHocTap(true);
    else if (path === '/vong-quay') moVongQuay(true);
    else if (path === '/hop-thu') moXinPhep(true);
    else if (path === '/loi-muon-noi') moHopThuBiMat(true);
    else moThongBao(true); // Default là Bảng tin
}

function loginGuest() { currentUser = null; setupUI(); handleRoute(); }

function showLogin() { 
    closeMenu(); document.getElementById('mainApp').classList.add('hidden'); document.getElementById('loginScreen').classList.remove('hidden'); 
    if(!document.getElementById('btnBackGuest')) {
        const loginForm = document.querySelector('#loginScreen > div'); 
        if(loginForm) {
            const btn = document.createElement('button'); btn.id = 'btnBackGuest'; 
            btn.className = 'w-full mt-5 text-slate-500 font-bold text-sm hover:text-indigo-600 transition flex items-center justify-center gap-2'; 
            btn.innerHTML = '<i class="fas fa-arrow-left"></i> Quay lại Trang chủ';
            btn.onclick = () => { document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('mainApp').classList.remove('hidden'); if(!currentUser) loginGuest(); };
            loginForm.appendChild(btn);
        }
    }
}

async function login() {
    const v = document.getElementById('inputLogin').value.trim();
    if(!v) return alert("Vui lòng nhập SĐT hoặc Mật khẩu!");
    document.getElementById('loader').style.display = 'flex';
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'check_admin', data: { pass: v } }) });
        const result = await response.json(); 
        document.getElementById('loader').style.display = 'none';
        if (result.status === "OK") { localStorage.setItem('role','admin'); loginAdmin(); return; } 
    } catch(e) {}
    
    const u = Data.hs.find(s => s.fatherPhone.includes(v) || s.motherPhone.includes(v));
    if(u) { localStorage.setItem('role','student'); localStorage.setItem('uid',u.id); document.getElementById('loader').style.display='none'; loginStudent(u); return; }
    
    document.getElementById('loader').style.display = 'none';
    alert("Sai SĐT hoặc mật khẩu!");
}

function loginAdmin() { currentUser = { role: 'admin', name: "Thầy Hiển" }; setupUI(); handleRoute(); }
async function loginStudent(u) { currentUser = { ...u, role: 'student' }; setupUI(); handleRoute(); setTimeout(checkSinhNhat, 1000); }
function logout() { localStorage.removeItem('role'); localStorage.removeItem('uid'); window.isQuizDataLoaded = false; location.href = '/'; }
