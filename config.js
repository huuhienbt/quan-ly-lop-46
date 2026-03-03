const API_URL = "https://script.google.com/macros/s/AKfycby3g1YD33YvtPHxFrROITYquUiC3-_jw2tuYXDMPZ53RRWdTaDlvvv1MW3aegBzVh9Kdw/exec";
let Data = { hs: [], math: [], tv: [], vietnamese: [], log: [], notiList: [] };
let currentUser = null;

const style = document.createElement('style');
style.innerHTML = `@keyframes cascadeDrop { 0% { opacity: 0; transform: translateY(-40px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } } .stagger-item { opacity: 0; animation: cascadeDrop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }`;
document.head.appendChild(style);

window.onload = async () => {
    localStorage.removeItem('L46_Data_Cache');
    try {
        // TẢI SONG SONG MỌI DỮ LIỆU ĐỂ TRÁNH LỖI THIẾU
        const [resHs, resNoti, resMath, resTv, resLog] = await Promise.all([
            fetch(API_URL + "?type=students&t=" + Date.now()),
            fetch(API_URL + "?type=thong_bao&t=" + Date.now()),
            fetch(API_URL + "?type=math&t=" + Date.now()),
            fetch(API_URL + "?type=vietnamese&t=" + Date.now()),
            fetch(API_URL + "?type=history_all&t=" + Date.now())
        ]);
        
        Data.hs = await resHs.json();
        Data.notiList = await resNoti.json();
        Data.math = await resMath.json();
        Data.tv = await resTv.json();
        Data.vietnamese = Data.tv; // QUAN TRỌNG: SỬA LỖI LIỆT NÚT TIẾNG VIỆT
        Data.log = await resLog.json();
        window.isQuizDataLoaded = true;

        document.getElementById('connStatus').innerText = "Đã kết nối dữ liệu thành công!";
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-green-500";
        
        const role = localStorage.getItem('role');
        if (role === 'admin') loginAdmin();
        else if (role === 'student') {
            const u = Data.hs.find(x => x.id === localStorage.getItem('uid'));
            if (u) loginStudent(u); else loginGuest();
        } else loginGuest();
    } catch(e) {
        document.getElementById('connStatus').innerText = "Lỗi mạng hoặc Link API!";
        document.getElementById('connStatus').className = "mt-4 text-xs font-bold text-red-500";
        loginGuest();
    }
};

function handleRoute() {
    const path = window.location.pathname;
    if (currentUser && currentUser.role === 'admin' && path === '/') return renderDashboardAdmin(true);
    if (path === '/hoc-tap') moGocHocTap(true);
    else if (path === '/vong-quay') moVongQuay(true);
    else if (path === '/hop-thu') moXinPhep(true);
    else if (path === '/loi-muon-noi') moHopThuBiMat(true);
    else moThongBao(true);
}
window.onpopstate = () => handleRoute();

function loginGuest() { currentUser = null; setupUI(); handleRoute(); }
function loginAdmin() { currentUser = { role: 'admin', name: "Thầy Hiển" }; setupUI(); handleRoute(); }
async function loginStudent(u) { currentUser = { ...u, role: 'student' }; setupUI(); handleRoute(); setTimeout(checkSinhNhat, 1000); }
function logout() { localStorage.removeItem('role'); localStorage.removeItem('uid'); location.href = '/'; }

async function login() {
    const v = document.getElementById('inputLogin').value.trim();
    if(!v) return alert("Vui lòng nhập SĐT hoặc Mật khẩu!");
    document.getElementById('loader').style.display = 'flex';
    
    // Check Admin
    try {
        const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'check_admin', data: { pass: v } }) });
        const result = await response.json();
        if (result.status === "OK") { localStorage.setItem('role','admin'); loginAdmin(); return; }
    } catch(e) {}

    // Check Student
    const u = Data.hs.find(s => s.fatherPhone.includes(v) || s.motherPhone.includes(v));
    if(u) { localStorage.setItem('role','student'); localStorage.setItem('uid',u.id); loginStudent(u); return; }

    document.getElementById('loader').style.display = 'none';
    alert("Sai SĐT hoặc mật khẩu!");
}
