// ==========================================
// FILE 2: UI.JS (GIAO DIỆN CHUNG, MENU & BẢNG TIN)
// ==========================================

const contentArea = document.getElementById('content');
function toggleMenu() { document.getElementById('appMenu').classList.toggle('hidden'); }
function closeMenu() { document.getElementById('appMenu').classList.add('hidden'); }
function veTrangChu() { closeMenu(); clearInterval(timer); if(currentUser && currentUser.role === 'admin') renderDashboardAdmin(); else moThongBao(); }

function setupUI() {
    document.getElementById('loginScreen').classList.add('hidden'); document.getElementById('loader').style.display='none'; document.getElementById('mainApp').classList.remove('hidden');
    const headerNameEl = document.getElementById('headerName'); const badgeDiv = headerNameEl ? headerNameEl.closest('[onclick]') : null; 
    const roleTextEl = badgeDiv ? badgeDiv.querySelector('p') : null; const avatarBox = badgeDiv ? badgeDiv.querySelector('div.bg-white') : null; const logoutBtn = document.querySelector('[onclick="logout()"]');

    if(currentUser) {
        if(headerNameEl) headerNameEl.innerText = currentUser.role === 'admin' ? 'GVCN' : currentUser.name.split(" ").pop();
        document.getElementById('menuName').innerText = currentUser.name; 
        if(badgeDiv) badgeDiv.setAttribute('onclick', 'toggleMenu()');
        if(roleTextEl) { roleTextEl.style.display = 'block'; roleTextEl.innerText = currentUser.role === 'admin' ? 'GVCN' : 'HỌC SINH'; }
        if(avatarBox) { avatarBox.style.display = 'flex'; avatarBox.innerHTML = currentUser.role === 'admin' ? '<i class="fas fa-chalkboard-teacher text-blue-600"></i>' : '<i class="fas fa-user-graduate text-blue-600"></i>'; }
        if(logoutBtn) logoutBtn.style.display = '';

        if(currentUser.role === 'admin') {
            document.getElementById('menuTeacher').innerHTML = `
                <div onclick="chuyenTrangQuanLy()" class="p-3 hover:bg-blue-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-users text-blue-600 w-6"></i> Quản lý Học sinh</div>
                <div onclick="moThongBao()" class="p-3 hover:bg-orange-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-bullhorn text-orange-600 w-6"></i> Quản lý Bảng tin</div>
                <div onclick="moDonTu()" class="p-3 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-envelope-open-text text-red-600 w-6"></i> Hộp thư xin phép</div>
                <div onclick="moQuanLyThu()" class="p-3 hover:bg-pink-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-comment-dots text-pink-600 w-6"></i> Thư Học Sinh</div>
                <div onclick="moTienDo()" class="p-3 hover:bg-purple-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-chart-line text-purple-600 w-6"></i> Tiến độ Học tập</div>
                <div onclick="quanLyNganHang('math')" class="p-3 hover:bg-indigo-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-calculator text-indigo-600 w-6"></i> Kho Toán</div>
                <div onclick="quanLyNganHang('vietnamese')" class="p-3 hover:bg-green-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-book text-green-600 w-6"></i> Kho Tiếng Việt</div>
            `;
            document.getElementById('menuTeacher').classList.remove('hidden'); document.getElementById('menuStudent').classList.add('hidden');
        } else {
            document.getElementById('menuStudent').innerHTML = `
                <div onclick="viewProfile(currentUser.id)" class="p-3 hover:bg-yellow-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-id-card text-yellow-600 w-6"></i> Hồ sơ cá nhân</div>
                <div onclick="moXinPhep()" class="p-3 hover:bg-red-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-envelope-open-text text-red-600 w-6"></i> Hộp thư</div>
                <div onclick="moHopThuBiMat()" class="p-3 hover:bg-pink-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer"><i class="fas fa-comment-dots text-pink-500 w-6"></i> Lời muốn nói</div>
            `;
            document.getElementById('menuStudent').classList.remove('hidden'); document.getElementById('menuTeacher').classList.add('hidden');
        }
    } else {
        if(headerNameEl) headerNameEl.innerText = "Đăng nhập"; document.getElementById('menuName').innerText = "Khách"; 
        if(badgeDiv) badgeDiv.setAttribute('onclick', 'showLogin()'); if(roleTextEl) roleTextEl.style.display = 'none'; if(avatarBox) avatarBox.style.display = 'none'; if(logoutBtn) logoutBtn.style.display = 'none';
        document.getElementById('menuStudent').innerHTML = `
            <div onclick="showLogin()" class="p-4 bg-blue-50 text-blue-700 rounded-xl font-black flex items-center gap-3 cursor-pointer mb-3 shadow-sm hover:bg-blue-100 transition border border-blue-100"><i class="fas fa-sign-in-alt w-6 text-xl"></i> ĐĂNG NHẬP NGAY</div>
            <div onclick="moGocHocTap()" class="p-3 hover:bg-slate-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer text-slate-600"><i class="fas fa-rocket w-6 text-indigo-500"></i> Góc học tập</div>
            <div onclick="moXinPhep()" class="p-3 hover:bg-slate-50 rounded-lg font-bold flex items-center gap-3 cursor-pointer text-slate-600"><i class="fas fa-envelope-open-text w-6 text-red-500"></i> Hộp thư</div>
        `;
        document.getElementById('menuStudent').classList.remove('hidden'); document.getElementById('menuTeacher').classList.add('hidden');
    }
}

function renderDashboardAdmin(fromRouter = false) {
    if(!fromRouter) window.history.pushState({}, "", "/");
    contentArea.innerHTML = `
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
    if (currentUser && currentUser.role === 'admin') { 
        let title = active === 'bangtin' ? 'BẢNG TIN LỚP' : (active === 'hoctap' ? 'GÓC HỌC TẬP' : 'HỘP THƯ'); 
        return `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-orange-500 uppercase">${title}</h2></div>`; 
    }
    let headerGreeting = ""; let thuBiMatBtn = ""; let vongQuayBtn = "";
    if (currentUser && currentUser.role === 'student') {
        headerGreeting = `<div class="mb-5 fade-in"><h2 class="text-2xl font-black text-slate-800">Chào, ${currentUser.name}!</h2></div>`;
        vongQuayBtn = `<button onclick="moVongQuay()" class="font-black text-base sm:text-xl pb-2 transition ${active==='vongquay' ? 'text-yellow-500 border-b-4 border-yellow-500' : 'text-slate-400 hover:text-yellow-500'}"><i class="fas fa-dharmachakra"></i> VÒNG QUAY</button>`;
        thuBiMatBtn = `<button onclick="moHopThuBiMat()" class="font-black text-base sm:text-xl pb-2 transition ${active==='thubimat' ? 'text-pink-500 border-b-4 border-pink-500' : 'text-slate-400 hover:text-pink-500'}"><i class="fas fa-comment-dots"></i> LỜI MUỐN NÓI</button>`;
    }
    return `
        ${headerGreeting}
        <div class="flex items-center gap-6 sm:gap-10 mb-6 border-b-2 border-slate-100 pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <button onclick="moThongBao()" class="font-black text-base sm:text-xl pb-2 transition ${active==='bangtin' ? 'text-orange-500 border-b-4 border-orange-500' : 'text-slate-400 hover:text-orange-500'}"><i class="fas fa-newspaper"></i> BẢNG TIN</button>
            <button onclick="moGocHocTap()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hoctap' ? 'text-indigo-600 border-b-4 border-indigo-500' : 'text-slate-400 hover:text-indigo-500'}"><i class="fas fa-rocket"></i> HỌC TẬP</button>
            ${vongQuayBtn}
            <button onclick="moXinPhep()" class="font-black text-base sm:text-xl pb-2 transition ${active==='hopthu' ? 'text-red-600 border-b-4 border-red-500' : 'text-slate-400 hover:text-red-500'}"><i class="fas fa-envelope-open-text"></i> HỘP THƯ</button>
            ${thuBiMatBtn}
        </div>
    `;
}

function parseImg(t) { return (t||"").toString().replace(/\[img:(.*?)\]/g, '<img src="$1" loading="lazy" class="rounded border my-2">').replace(/\n/g,'<br>'); }

function moThongBao(fromRouter = false) { 
    closeMenu(); 
    if(!fromRouter) window.history.pushState({}, "", "/bang-tin");
    
    let btnTaoMoi = currentUser && currentUser.role === 'admin' ? `<button onclick="editNotiUI(null)" class="w-full mb-6 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg btn-3d hover:bg-orange-700 transition flex items-center justify-center gap-2"><i class="fas fa-plus-circle text-xl"></i> TẠO BÀI VIẾT MỚI</button>` : ''; 
    let sortedList = [...Data.notiList].sort((a, b) => { const getVal = (item) => { let rawT = item.time.includes('|||') ? item.time.split('|||')[1] : item.time; const m = String(rawT).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? parseInt(m[3] + m[2] + m[1]) : 0; }; let dateA = getVal(a), dateB = getVal(b); if (dateA !== dateB) return dateB - dateA; return (parseInt(String(b.id).replace(/\D/g,''))||0) - (parseInt(String(a.id).replace(/\D/g,''))||0); }); 
    let listHtml = ""; 
    
    if (sortedList.length === 0) { listHtml = `<div class="text-center py-10 opacity-60"><i class="fas fa-inbox text-6xl text-slate-300 mb-3"></i><p class="font-bold text-slate-400">Chưa có bài viết nào.</p></div>`; } 
    else { 
        listHtml = sortedList.map((tb, index) => { 
            let adminButtons = currentUser && currentUser.role === 'admin' ? `<div class="flex gap-2 mt-4 pt-3 border-t border-orange-100"><button onclick="editNotiUI('${tb.id}')" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-100 transition text-sm flex items-center justify-center gap-1"><i class="fas fa-edit"></i> Sửa</button><button onclick="xoaThongBao('${tb.id}')" class="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold hover:bg-red-100 transition text-sm flex items-center justify-center gap-1"><i class="fas fa-trash-alt"></i> Xóa</button></div>` : ''; 
            let cleanContent = tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '').replace(/<img /gi, '<img loading="lazy" ') : ""; 
            let typeStr = "Thông báo"; let displayTime = tb.time; let iconHtml = '<i class="fas fa-bullhorn"></i>'; let colorTheme = 'bg-orange-100 text-orange-600'; 
            if (tb.time.includes('|||')) { let parts = tb.time.split('|||'); typeStr = parts[0]; displayTime = parts[1]; if(typeStr === 'THÔNG BÁO TỪ GVCN' || typeStr === 'Thông báo chung') typeStr = 'Thông báo'; if(typeStr === 'HOẠT ĐỘNG LỚP 4/6' || typeStr === 'Hoạt động lớp') typeStr = 'Hoạt động'; if (typeStr === 'Hoạt động') { iconHtml = '<i class="fas fa-camera-retro"></i>'; colorTheme = 'bg-green-100 text-green-600'; } } else { displayTime = tb.time; } 
            let delay = index * 0.2; 
            return `<div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mb-5 relative hover:shadow-md transition w-full overflow-hidden stagger-item" style="animation-delay: ${delay}s;"><div class="flex items-center gap-3 mb-3"><div class="w-10 h-10 ${colorTheme} rounded-full flex items-center justify-center text-lg shrink-0">${iconHtml}</div><div><h3 class="font-black text-slate-800 text-sm uppercase tracking-wide">${typeStr}</h3><p class="text-[11px] font-bold text-slate-400"><i class="fas fa-clock mr-1"></i> ${displayTime}</p></div></div><div class="text-slate-700 text-base w-full overflow-hidden break-words pl-1 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:my-3 [&_img]:inline-block [&_a]:text-blue-600 [&_a]:underline [&_a]:font-bold">${cleanContent}</div>${adminButtons}</div>`; 
        }).join(''); 
    } 
    contentArea.innerHTML = `${getNavHtml('bangtin')}${btnTaoMoi}<div class="space-y-4 pb-10">${listHtml}</div>`; 
}

function editNotiUI(idToEdit) { 
    const isEdit = idToEdit != null; const tb = isEdit ? Data.notiList.find(x => x.id === idToEdit) : null; const d = new Date(); const dateStr = ("0" + d.getDate()).slice(-2) + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear(); const firstDay = new Date(d.getFullYear(), 0, 1); const weekNum = Math.ceil((((d - firstDay) / 86400000) + firstDay.getDay() + 1) / 7); let defaultTimeStr = `Ngày ${dateStr} - Tuần ${weekNum}`; let defaultType = 'Thông báo'; 
    if (isEdit) { if (tb.time.includes('|||')) { let parts = tb.time.split('|||'); defaultType = parts[0]; defaultTimeStr = parts[1]; if(defaultType === 'THÔNG BÁO TỪ GVCN' || defaultType === 'Thông báo chung') defaultType = 'Thông báo'; if(defaultType === 'HOẠT ĐỘNG LỚP 4/6' || defaultType === 'Hoạt động lớp') defaultType = 'Hoạt động'; } else { defaultTimeStr = tb.time; } } 
    const currentContent = isEdit && tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '') : ""; 
    
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="moThongBao()" class="bg-white p-2 rounded-xl shadow mr-3"><i class="fas fa-times text-slate-500"></i></button><h2 class="font-black text-xl text-orange-600 uppercase">${isEdit ? 'SỬA BÀI VIẾT' : 'TẠO BÀI VIẾT MỚI'}</h2></div>
        <div class="bg-white p-4 sm:p-6 rounded-[2rem] shadow-lg border space-y-4 fade-in w-full overflow-hidden">
            <input type="hidden" id="frmNotiId" value="${idToEdit || ''}">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại bài viết</label><select id="frmNotiType" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400 transition"><option value="Thông báo" ${defaultType === 'Thông báo' ? 'selected' : ''}>📣 Thông báo</option><option value="Hoạt động" ${defaultType === 'Hoạt động' ? 'selected' : ''}>📸 Hoạt động</option></select></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian hiển thị</label><input type="text" id="frmNotiTime" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400" value="${defaultTimeStr}"></div></div>
            <div class="w-full"><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Nội dung</label><div class="flex flex-wrap gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200 items-center"><button onclick="document.execCommand('bold', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 font-black">B</button><button onclick="document.execCommand('italic', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 italic font-serif">I</button><div class="relative flex items-center bg-white rounded shadow-sm px-1 hover:bg-slate-200 h-8" title="Màu chữ"><input type="color" onchange="document.execCommand('foreColor', false, this.value)" class="w-5 h-5 border-0 bg-transparent cursor-pointer"></div><div class="w-px h-6 bg-slate-300 mx-1"></div><button onclick="document.execCommand('justifyLeft', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn trái"><i class="fas fa-align-left"></i></button><button onclick="document.execCommand('justifyCenter', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn giữa"><i class="fas fa-align-center"></i></button><button onclick="document.execCommand('justifyRight', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn phải"><i class="fas fa-align-right"></i></button><button onclick="document.execCommand('justifyFull', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600" title="Căn đều 2 bên"><i class="fas fa-align-justify"></i></button><div class="w-px h-6 bg-slate-300 mx-1"></div><select onchange="document.execCommand('fontSize', false, this.value)" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ chữ</option><option value="1">Rất nhỏ</option><option value="2">Nhỏ</option><option value="3">Vừa</option><option value="4">Lớn</option><option value="5">Rất Lớn</option><option value="6">Khổng lồ</option></select><select onchange="changeLineSpacing(this.value)" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Giãn dòng</option><option value="1.2">Nhỏ (1.2)</option><option value="1.6">Vừa (1.6)</option><option value="2.0">Rộng (2.0)</option></select><div class="w-px h-6 bg-slate-300 mx-1"></div><button onclick="chenAnhVaoThongBao()" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-indigo-600 font-bold text-xs flex items-center gap-1"><i class="fas fa-upload"></i> Thêm Ảnh</button><button onclick="chenFileVaoThongBao()" class="px-2 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-blue-600 font-bold text-xs flex items-center gap-1"><i class="fas fa-link"></i> Link</button><select onchange="resizeImg(this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ ảnh</option><option value="30%">Nhỏ (30%)</option><option value="60%">Vừa (60%)</option><option value="100%">Lớn (100%)</option></select></div><div id="frmNotiContent" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[200px] bg-white border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:inline-block [&_img]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline">${currentContent}</div></div>
            <button onclick="luuThongBaoLenServer()" class="w-full bg-orange-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-orange-700 transition">${isEdit ? 'LƯU THAY ĐỔI' : 'ĐĂNG LÊN HỆ THỐNG'}</button>
        </div>
    `; 
}

window.handleEditorClick = function(e) { document.querySelectorAll('#frmNotiContent img').forEach(img => img.style.border = 'none'); window.currentSelectedImg = null; if (e.target.tagName === 'IMG') { e.target.style.border = '3px dashed #f97316'; window.currentSelectedImg = e.target; } };
window.resizeImg = function(size) { if(!size) return; if(!window.currentSelectedImg) return alert("Thầy hãy bấm chọn một tấm ảnh ở dưới trước khi chỉnh kích thước nhé!"); window.currentSelectedImg.style.width = size; window.currentSelectedImg.style.height = 'auto'; };

async function luuThongBaoLenServer() { 
    document.querySelectorAll('#frmNotiContent img').forEach(img => img.style.border = 'none'); window.currentSelectedImg = null; 
    const id = document.getElementById("frmNotiId").value; const typeStr = document.getElementById("frmNotiType").value; const timeVal = document.getElementById("frmNotiTime").value; const finalTimeStr = typeStr + "|||" + timeVal; const contentHTML = document.getElementById("frmNotiContent").innerHTML; 
    if(!timeVal || !contentHTML.trim()) return alert("Vui lòng nhập nội dung!"); 
    document.getElementById('loader').style.display = 'flex'; 
    try { 
        const act = id ? 'sua_thong_bao' : 'dang_thong_bao'; await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: act, data: { id: id, time: finalTimeStr, content: contentHTML } }) }); 
        if(id) { const idx = Data.notiList.findIndex(x => x.id === id); if(idx > -1) { Data.notiList[idx].time = finalTimeStr; Data.notiList[idx].content = contentHTML; } } else { Data.notiList.unshift({ id: "TB"+Date.now(), time: finalTimeStr, content: contentHTML }); } 
        document.getElementById('loader').style.display = 'none'; alert("Đăng bài thành công!"); moThongBao(); 
    } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng!"); } 
}

function chenAnhVaoThongBao() { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = async (e) => { const file = e.target.files[0]; if (!file) return; document.getElementById('loader').style.display = 'flex'; const reader = new FileReader(); reader.onload = function(event) { const img = new Image(); img.onload = async function() { const canvas = document.createElement('canvas'); const MAX_WIDTH = 800; let scaleSize = 1; if(img.width > MAX_WIDTH) { scaleSize = MAX_WIDTH / img.width; } canvas.width = img.width * scaleSize; canvas.height = img.height * scaleSize; const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); const dataUrl = canvas.toDataURL('image/jpeg', 0.7); const base64Data = dataUrl.split(',')[1]; try { const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) }); const result = await response.json(); if(result.url) { document.getElementById("frmNotiContent").focus(); document.execCommand('insertHTML', false, `<div style="text-align: center;"><img src="${result.url}" loading="lazy" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block;"></div><br>`); } else { alert("Lỗi! Không lấy được link ảnh từ Server."); } } catch(err) { alert("Lỗi mạng khi tải ảnh lên!"); } document.getElementById('loader').style.display = 'none'; }; img.src = event.target.result; }; reader.readAsDataURL(file); }; input.click(); }
function chenFileVaoThongBao() { const url = prompt("Dán đường link:"); if(url) { const tenLink = prompt("Nhập tên hiển thị:", "Bấm vào đây"); if(tenLink) { document.getElementById("frmNotiContent").focus(); document.execCommand('insertHTML', false, `<a href="${url}" target="_blank">${tenLink}</a>`); } } }
window.changeLineSpacing = function(val) { if(!val) return; document.execCommand('formatBlock', false, 'DIV'); const sel = window.getSelection(); if(sel.rangeCount > 0) { let node = sel.anchorNode; if(node.nodeType === 3) node = node.parentNode; while(node && node.id !== 'frmNotiContent') { if(node.nodeName === 'DIV' || node.nodeName === 'P') { node.style.lineHeight = val; break; } node = node.parentNode; } } };
async function xoaThongBao(id) { if(confirm("Xóa thông báo này vĩnh viễn?")) { document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'xoa_thong_bao', data: { id: id } }) }); Data.notiList = Data.notiList.filter(x => x.id !== id); document.getElementById('loader').style.display = 'none'; moThongBao(); } }

function viewProfile(id) { 
    closeMenu(); const s = Data.hs.find(x => String(x.id) === String(id)); if(!s) return; 
    const avatar = s.gender === 'Nữ' ? '<div class="w-24 h-24 bg-pink-100 text-pink-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-graduate"></i></div>' : '<div class="w-24 h-24 bg-blue-100 text-blue-500 rounded-full mx-auto flex items-center justify-center text-5xl mb-3 shadow-inner"><i class="fas fa-user-astronaut"></i></div>'; 
    let cleanDob = s.dob || 'Chưa cập nhật'; if(cleanDob.includes('T') && cleanDob.includes('.000Z')) { const dt = new Date(cleanDob); cleanDob = ("0" + dt.getDate()).slice(-2) + "/" + ("0" + (dt.getMonth() + 1)).slice(-2) + "/" + dt.getFullYear(); } 
    const renderPhone = (phone, label) => { if(!phone || phone.trim() === '') return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><span class="text-slate-400 italic text-xs">Chưa cập nhật</span></div>`; const cleanPhone = phone.toString().replace(/\D/g, ''); return `<div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">${label}</span><div class="flex items-center gap-2"><span class="font-bold text-slate-700 text-sm">${phone}</span><a href="tel:${cleanPhone}" class="w-7 h-7 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs hover:bg-green-600 hover:text-white transition"><i class="fas fa-phone"></i></a></div></div>`; }; 
    
    contentArea.innerHTML = `
        <div class="flex items-center mb-6"><button onclick="${currentUser && currentUser.role==='admin'?'chuyenTrangQuanLy()':'veTrangChu()'}" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600 uppercase">HỒ SƠ CÁ NHÂN</h2></div>
        <div class="bg-white p-6 rounded-[2rem] shadow-lg border-t-4 border-blue-500 fade-in relative overflow-hidden">
            <div class="text-center mb-6 relative z-10">${avatar}<h2 class="text-2xl font-black text-slate-800">${s.name}</h2><span class="bg-blue-50 text-blue-600 font-mono font-bold px-3 py-1 rounded-full text-xs mt-2 inline-block">ID: ${s.id}</span></div>
            <div class="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl p-4 text-white shadow-lg mb-6 flex items-center justify-between relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-white opacity-20 text-6xl"><i class="fas fa-gem"></i></div>
                <div><p class="text-xs font-bold opacity-90 uppercase">Điểm tích lũy</p><p class="text-3xl font-black">${s.score || 0}</p></div>
                <div class="text-right"><p class="text-xs font-bold opacity-90 uppercase">Xếp hạng</p><p class="text-lg font-bold"><i class="fas fa-trophy mr-1"></i> Thành viên</p></div>
            </div>
            <div class="space-y-1">
                <div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Ngày sinh</span><b class="text-slate-700">${cleanDob}</b></div>
                <div class="flex justify-between items-center py-2 border-b border-slate-100"><span class="text-slate-400 font-bold uppercase text-[10px]">Giới tính</span><b class="text-slate-700">${s.gender || '-'}</b></div>
                ${renderPhone(s.fatherPhone, "SĐT Cha")}${renderPhone(s.motherPhone, "SĐT Mẹ")}
                <div class="py-2"><span class="text-slate-400 font-bold uppercase text-[10px] block mb-1">Địa chỉ</span><b class="text-slate-700 text-sm leading-snug">${s.address || 'Chưa cập nhật'}</b></div>
            </div>
        </div>
    `; 
}

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

function chuyenTrangQuanLy() { 
    closeMenu(); 
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3 text-slate-500"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-blue-600">QUẢN LÝ HS</h2></div><div class="space-y-3">`; 
    html += Data.hs.map(h => `<div onclick="viewProfile('${h.id}')" class="bg-white p-4 rounded-xl border flex justify-between items-center cursor-pointer hover:bg-slate-50 transition"><span class="font-bold text-slate-700">${h.name}</span><span class="text-xs text-gray-500">SĐT: ${h.fatherPhone || h.motherPhone || 'Chưa có'}</span></div>`).join(''); 
    contentArea.innerHTML = html + "</div>"; 
}

async function dongBoDuLieu() { 
    if(!confirm("Hành động này sẽ tải lại toàn bộ dữ liệu mới nhất từ Google Sheets. Tiếp tục?")) return; 
    document.getElementById('loader').style.display = 'flex'; document.querySelector('#loader p').innerText = "ĐANG ĐỒNG BỘ MÁY CHỦ..."; 
    try { await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'clear_cache', data: {} }) }); window.isQuizDataLoaded = false; alert("Đồng bộ thành công! Giao diện sẽ tự động tải lại dữ liệu mới."); location.reload(); } catch(e) { document.getElementById('loader').style.display = 'none'; alert("Lỗi mạng khi đồng bộ!"); } 
}
