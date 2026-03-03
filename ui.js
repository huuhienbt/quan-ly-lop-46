function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('loader').style.display='none'; document.getElementById('mainApp').classList.remove('hidden');
    const role = currentUser ? (currentUser.role === 'admin' ? 'GVCN' : 'HỌC SINH') : 'Khách';
    const name = currentUser ? (currentUser.role === 'admin' ? 'GVCN' : currentUser.name.split(" ").pop()) : 'Đăng nhập';
    document.getElementById('headerName').innerText = name;
    document.getElementById('menuName').innerText = currentUser ? currentUser.name : 'Khách';
    
    const menuT = document.getElementById('menuTeacher');
    const menuS = document.getElementById('menuStudent');
    if(currentUser && currentUser.role === 'admin') {
        menuT.innerHTML = `
            <div onclick="chuyenTrangQuanLy()" class="menu-item"><i class="fas fa-users text-blue-600 w-8"></i> QL Học sinh</div>
            <div onclick="moThongBao()" class="menu-item"><i class="fas fa-bullhorn text-orange-600 w-8"></i> Bảng tin</div>
            <div onclick="moDonTu()" class="menu-item"><i class="fas fa-envelope-open-text text-red-600 w-8"></i> Hộp thư Xin phép</div>
            <div onclick="moQuanLyThu()" class="menu-item"><i class="fas fa-comment-dots text-pink-600 w-8"></i> Thư Học Sinh</div>
            <div onclick="moTienDo()" class="menu-item"><i class="fas fa-chart-line text-purple-600 w-8"></i> Tiến độ Học tập</div>
            <div onclick="quanLyNganHang('math')" class="menu-item"><i class="fas fa-calculator text-indigo-600 w-8"></i> Kho Toán</div>
            <div onclick="quanLyNganHang('vietnamese')" class="menu-item"><i class="fas fa-book text-green-600 w-8"></i> Kho Tiếng Việt</div>
            <div onclick="dongBoDuLieu()" class="menu-item border-t mt-2 pt-2"><i class="fas fa-sync-alt text-slate-500 w-8"></i> Đồng bộ Dữ liệu</div>
        `;
        menuT.classList.remove('hidden'); menuS.classList.add('hidden');
    } else if(currentUser) {
        menuS.innerHTML = `
            <div onclick="viewProfile(currentUser.id)" class="menu-item"><i class="fas fa-id-card text-yellow-600 w-8"></i> Hồ sơ cá nhân</div>
            <div onclick="moXinPhep()" class="menu-item"><i class="fas fa-pen-to-square text-red-600 w-8"></i> Gửi đơn xin phép</div>
        `;
        menuS.classList.remove('hidden'); menuT.classList.add('hidden');
    }
}

function veTrangChu() { document.getElementById('appMenu').classList.add('hidden'); if(currentUser && currentUser.role === 'admin') renderDashboardAdmin(); else moThongBao(); }
function toggleMenu() { document.getElementById('appMenu').classList.toggle('hidden'); }
function closeMenu() { document.getElementById('appMenu').classList.add('hidden'); }

function renderDashboardAdmin(fromRouter = false) {
    if(!fromRouter) window.history.pushState({}, "", "/");
    document.getElementById('content').innerHTML = `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 fade-in">
            <button onclick="chuyenTrangQuanLy()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-blue-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-users text-3xl text-blue-600"></i><span class="font-bold text-slate-700">Học sinh</span></button>
            <button onclick="moThongBao()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-orange-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-bullhorn text-3xl text-orange-500"></i><span class="font-bold text-slate-700">Bảng tin</span></button>
            <button onclick="moDonTu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-red-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-envelope text-3xl text-red-600"></i><span class="font-bold text-slate-700">Xin phép</span></button>
            <button onclick="moQuanLyThu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-pink-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-comment-dots text-3xl text-pink-500"></i><span class="font-bold text-slate-700">Thư HS</span></button>
            <button onclick="moTienDo()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-purple-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-chart-line text-3xl text-purple-600"></i><span class="font-bold text-slate-700">Tiến độ</span></button>
            <button onclick="quanLyNganHang('math')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-indigo-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-calculator text-3xl text-indigo-600"></i><span class="font-bold text-slate-700">Kho Toán</span></button>
            <button onclick="quanLyNganHang('vietnamese')" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-green-100 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-book text-3xl text-green-600"></i><span class="font-bold text-slate-700">Kho T.Việt</span></button>
            <button onclick="dongBoDuLieu()" class="bg-white p-6 rounded-2xl shadow-sm border-b-4 border-slate-300 flex flex-col items-center gap-3 btn-3d"><i class="fas fa-sync-alt text-3xl text-slate-500"></i><span class="font-bold text-slate-700">Đồng bộ</span></button>
        </div>
    `;
}

function getNavHtml(active) {
    if (currentUser && currentUser.role === 'admin') return `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-orange-500 uppercase">QUẢN LÝ LỚP</h2></div>`;
    
    let header = `<div class="mb-5 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser ? currentUser.name : 'Khách'}!</h2></div>`;
    return `${header}
        <div class="flex items-center gap-6 sm:gap-10 mb-6 border-b-2 border-slate-100 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button onclick="moThongBao()" class="font-black text-base sm:text-xl pb-2 transition ${active==='bangtin' ? 'text-orange-500 border-b-4 border-orange-500' : 'text-slate-400 hover:text-orange-500'}"><i class="fas fa-newspaper"></i> BẢNG TIN</button>
            <button onclick="moGocHocTap()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hoctap' ? 'text-indigo-600 border-b-4 border-indigo-500' : 'text-slate-400 hover:text-indigo-500'}"><i class="fas fa-rocket"></i> HỌC TẬP</button>
            <button onclick="moVongQuay()" class="font-black text-base sm:text-xl pb-2 transition ${active==='vongquay' ? 'text-yellow-500 border-b-4 border-yellow-500' : 'text-slate-400 hover:text-yellow-500'}"><i class="fas fa-dharmachakra"></i> VÒNG QUAY</button>
            <button onclick="moXinPhep()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hopthu' ? 'text-red-600 border-b-4 border-red-500' : 'text-slate-400 hover:text-red-500'}"><i class="fas fa-envelope-open-text"></i> HỘP THƯ</button>
            <button onclick="moHopThuBiMat()" class="font-black text-base sm:text-xl pb-2 transition ${active==='thubimat' ? 'text-pink-500 border-b-4 border-pink-500' : 'text-slate-400 hover:text-pink-500'}"><i class="fas fa-comment-dots"></i> LỜI MUỐN NÓI</button>
        </div>`;
}

function moThongBao(fromRouter = false) { 
    closeMenu(); 
    if(!fromRouter) window.history.pushState({}, "", "/bang-tin");
    let html = Data.notiList.length ? Data.notiList.map(tb => {
        let parts = tb.time.split('|||');
        let type = parts.length > 1 ? parts[0] : 'Thông báo';
        let time = parts.length > 1 ? parts[1] : tb.time;
        let icon = type.includes('Hoạt động') ? '<i class="fas fa-camera-retro"></i>' : '<i class="fas fa-bullhorn"></i>';
        let color = type.includes('Hoạt động') ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600';
        return `
            <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-5 relative hover:shadow-md transition w-full overflow-hidden stagger-item">
                <div class="flex items-center gap-3 mb-3">
                    <div class="w-10 h-10 ${color} rounded-full flex items-center justify-center text-lg shrink-0">${icon}</div>
                    <div><h3 class="font-black text-slate-800 text-sm uppercase tracking-wide">${type}</h3><p class="text-[11px] font-bold text-slate-400"><i class="fas fa-clock mr-1"></i> ${time}</p></div>
                </div>
                <div class="text-slate-700 text-base w-full overflow-hidden break-words pl-1 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_img]:inline-block [&_a]:text-blue-600 [&_a]:underline [&_a]:font-bold">${tb.content}</div>
                ${currentUser && currentUser.role === 'admin' ? `<div class="flex gap-2 mt-4 pt-3 border-t border-orange-100"><button onclick="xoaThongBao('${tb.id}')" class="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold text-sm"><i class="fas fa-trash-alt"></i> Xóa</button></div>` : ''}
            </div>`;
    }).join('') : `<p class="text-center text-slate-400 py-10">Chưa có bài viết nào.</p>`;
    
    let btnAdd = currentUser && currentUser.role === 'admin' ? `<button onclick="editNotiUI(null)" class="w-full mb-6 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg btn-3d"><i class="fas fa-plus-circle text-xl"></i> ĐĂNG BÀI MỚI</button>` : '';
    document.getElementById('content').innerHTML = `${getNavHtml('bangtin')}${btnAdd}<div class="space-y-4 pb-10">${html}</div>`;
}

function editNotiUI() {
    document.getElementById('content').innerHTML = `
        <div class="flex items-center mb-6"><button onclick="moThongBao()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-times text-slate-500"></i></button><h2 class="font-black text-xl text-orange-600">ĐĂNG BÀI MỚI</h2></div>
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border space-y-4">
            <select id="frmNotiType" class="w-full bg-slate-50 border-2 p-3 rounded-xl font-bold"><option value="Thông báo">📣 Thông báo</option><option value="Hoạt động">📸 Hoạt động</option></select>
            <input type="text" id="frmNotiTime" class="w-full bg-slate-50 border-2 p-3 rounded-xl font-bold" value="${new Date().toLocaleDateString('vi-VN')}">
            <div id="frmNotiContent" contenteditable="true" class="w-full min-h-[200px] bg-white border-2 p-4 rounded-xl outline-none focus:border-orange-400"></div>
            <button onclick="luuThongBao()" class="w-full bg-orange-600 text-white py-4 rounded-2xl font-black btn-3d">ĐĂNG NGAY</button>
        </div>
    `;
}

async function luuThongBao() {
    const type = document.getElementById("frmNotiType").value;
    const time = document.getElementById("frmNotiTime").value;
    const content = document.getElementById("frmNotiContent").innerHTML;
    if(!content) return alert("Chưa nhập nội dung!");
    document.getElementById('loader').style.display = 'flex';
    await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'dang_thong_bao', data: { id: "TB"+Date.now(), time: type+"|||"+time, content: content } }) });
    alert("Đã đăng!"); location.reload();
}
async function xoaThongBao(id) { if(confirm("Xóa nhé?")) { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'xoa_thong_bao', data: { id: id } }) }); location.reload(); } }
async function dongBoDuLieu() { if(confirm("Đồng bộ lại từ Google Sheets?")) { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'clear_cache', data: {} }) }); alert("Đã xong!"); location.reload(); } }
