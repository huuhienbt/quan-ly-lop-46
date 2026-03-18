// ==========================================
// FILE 2: UI.JS (ĐIỀU KHIỂN GIAO DIỆN & BẢNG TIN) - BẢN FULL SOẠN THẢO
// ==========================================

const contentArea = document.getElementById('content');
function toggleMenu() { document.getElementById('appMenu').classList.toggle('hidden'); }
function closeMenu() { document.getElementById('appMenu').classList.add('hidden'); }

function veTrangChu() { 
    closeMenu(); clearInterval(timer); 
    if(!currentUser) { moThongBao(); } 
    else if(currentUser.role === 'admin') { renderDashboardAdmin(); } 
    else { moThongBao(); }
}

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

function renderDashboardAdmin() {
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
        vongQuayBtn = `<button onclick="moVongQuay()" class="font-black text-base sm:text-xl pb-2 transition ${active==='vongquay' ? 'text-yellow-500 border-b-4 border-yellow-500' : 'text-slate-400 hover:text-yellow-500'}">🎡 VÒNG QUAY</button>`;
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

// BỘ TẠO THANH CÔNG CỤ SOẠN THẢO VĂN BẢN VÀ HÌNH ẢNH CHUNG
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
            
            <select onchange="document.execCommand('fontName', false, this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Kiểu chữ</option><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Courier New">Courier</option><option value="Tahoma">Tahoma</option></select>
            <select onchange="document.execCommand('fontSize', false, this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ chữ</option><option value="1">Nhỏ</option><option value="3">Vừa</option><option value="5">Lớn</option><option value="7">Khổng lồ</option></select>
            
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            <button onclick="document.execCommand('justifyLeft', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-left"></i></button>
            <button onclick="document.execCommand('justifyCenter', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-center"></i></button>
            <button onclick="document.execCommand('justifyRight', false, null)" class="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 text-slate-600"><i class="fas fa-align-right"></i></button>
            
            <div class="w-px h-6 bg-slate-300 mx-1"></div>
            
            <button onclick="chenLinkVaoEditor('${targetId}')" class="px-2 h-8 bg-blue-50 rounded hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 border border-blue-200"><i class="fas fa-link"></i> Link</button>
            <button onclick="chenAnhVaoEditor('${targetId}')" class="px-2 h-8 bg-indigo-50 rounded shadow-sm hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1 border border-indigo-200"><i class="fas fa-image"></i> Ảnh</button>
            <button onclick="chenVideoYouTube('${targetId}')" class="px-2 h-8 bg-red-50 rounded hover:bg-red-100 text-red-600 font-bold text-xs flex items-center gap-1 border border-red-200"><i class="fab fa-youtube"></i> Video</button>
            <button onclick="chenAmThanh('${targetId}')" class="px-2 h-8 bg-green-50 rounded hover:bg-green-100 text-green-700 font-bold text-xs flex items-center gap-1 border border-green-200"><i class="fas fa-music"></i> Nghe</button>
            <button onclick="chenPDF('${targetId}')" class="px-2 h-8 bg-orange-50 rounded hover:bg-orange-100 text-orange-700 font-bold text-xs flex items-center gap-1 border border-orange-200"><i class="fas fa-file-pdf"></i> PDF</button>
            
            <select onchange="resizeImg(this.value); this.value='';" class="h-8 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded shadow-sm outline-none px-1"><option value="">Cỡ ảnh</option><option value="30%">Nhỏ (30%)</option><option value="60%">Vừa (60%)</option><option value="100%">Lớn (100%)</option></select>
        </div>
    `;
}

function chenAmThanh(targetId) {
    const url = prompt("Dán link file MP3 (từ Google Drive hoặc GitHub) vào đây:"); if (!url) return;
    const audioTitle = prompt("Nhập tiêu đề cho bài nghe:", "BÀI NGHE AUDIO"); if (!audioTitle) return;
    let driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); let audioHtml = "";
    if (driveMatch) { 
        audioHtml = `<div contenteditable="false" style="margin: 15px auto; max-width: 600px; background: #f8fafc; padding: 15px; border-radius: 16px; border: 2px solid #e2e8f0; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"><p style="font-size: 13px; color: #0284c7; font-weight: black; margin-bottom: 12px; text-transform: uppercase;"><i class="fas fa-headphones-alt mr-1"></i> ${audioTitle}</p><iframe src="https://drive.google.com/file/d/${driveMatch[1]}/preview" style="width: 100%; height: 80px; margin: 0 auto; display: block; border:none; border-radius: 8px; background: white;" allow="autoplay"></iframe></div><br>`; 
    } else { 
        let audioSrc = url; if (url.includes("github.com") && url.includes("/blob/")) { audioSrc = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/"); } 
        audioHtml = `<div contenteditable="false" style="margin: 15px auto; max-width: 600px; text-align: center; background: #f8fafc; padding: 15px; border-radius: 16px; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);"><p style="font-size: 13px; color: #0284c7; font-weight: black; margin-bottom: 12px; text-transform: uppercase;"><i class="fas fa-headphones-alt mr-1"></i> ${audioTitle}</p><audio controls style="width: 100%; display: block; margin: 0 auto; outline: none; border-radius: 8px;"><source src="${audioSrc}" type="audio/mpeg">Trình duyệt không hỗ trợ.</audio></div><br>`; 
    }
    document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, audioHtml);
}

function chenPDF(targetId) {
    const url = prompt("Dán link file PDF từ Google Drive vào đây:"); if (!url) return;
    const pdfTitle = prompt("Nhập tên hiển thị cho tài liệu:", "TÀI LIỆU PDF"); if (!pdfTitle) return;
    let pdfSrc = url; let driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); if (driveMatch) pdfSrc = `https://drive.google.com/file/d/${driveMatch[1]}/preview`; 
    const pdfHtml = `<div contenteditable="false" style="margin: 15px 0; width: 100%; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"><div style="background: #f1f5f9; padding: 10px 15px; font-size: 13px; font-weight: bold; color: #475569; border-bottom: 1px solid #e2e8f0; text-transform: uppercase;"><i class="fas fa-file-pdf text-red-500 mr-2 text-lg"></i>${pdfTitle}</div><iframe src="${pdfSrc}" width="100%" height="500px" style="border: none;" allow="autoplay" loading="lazy"></iframe></div><br>`;
    document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, pdfHtml);
}

function chenVideoYouTube(targetId) {
    const url = prompt("Dán link Video (YouTube, Google Drive, GitHub) vào đây:"); if (!url) return;
    const sizeInput = prompt("Chiếm bao nhiêu phần ngang? (Nhập số: 100, 80, 60...)", "100"); const videoWidth = sizeInput ? sizeInput + "%" : "100%";
    let videoHtml = ""; const ytMatch = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/); const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const wrapperStyle = `margin: 15px auto; width: ${videoWidth}; max-width: 800px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 12px; overflow: hidden;`;
    if (ytMatch && ytMatch[2].length === 11) { 
        videoHtml = `<div contenteditable="false" style="${wrapperStyle} position: relative; padding-bottom: calc(${videoWidth} * 0.5625); height: 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" src="https://www.youtube.com/embed/${ytMatch[2]}" allowfullscreen loading="lazy"></iframe></div><br>`; 
    } else if (driveMatch) { 
        videoHtml = `<div contenteditable="false" style="${wrapperStyle} position: relative; padding-bottom: calc(${videoWidth} * 0.5625); height: 0;"><iframe style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" src="https://drive.google.com/file/d/${driveMatch[1]}/preview" allow="autoplay" allowfullscreen loading="lazy"></iframe></div><br>`; 
    } else if (url.includes(".mp4") || url.includes("github.com")) { 
        let videoSrc = url; if (url.includes("github.com") && url.includes("/blob/")) { videoSrc = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/"); } 
        videoHtml = `<div contenteditable="false" style="${wrapperStyle} padding: 10px; background: #f8fafc; border: 2px solid #e2e8f0; text-align: center;"><video controls style="width: 100%; border-radius: 8px; outline: none;"><source src="${videoSrc}" type="video/mp4">Trình duyệt không hỗ trợ.</video></div><br>`; 
    } else { alert("Link Video không hợp lệ!"); return; }
    document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, videoHtml);
}

function chenLinkVaoEditor(targetId) { 
    const url = prompt("Dán đường link trang web vào đây:"); if (url) { const tenLink = prompt("Nhập chữ hiển thị:", "Bấm vào đây"); if (tenLink) { document.getElementById(targetId).focus(); document.execCommand('insertHTML', false, `<a href="${url}" target="_blank" style="color: blue; text-decoration: underline; font-weight: bold;">${tenLink}</a>`); } } 
}

function chenAnhVaoEditor(targetId) {
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
                const base64Data = canvas.toDataURL('image/jpeg', 0.7).split(',')[1]; 
                try { 
                    const response = await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'upload_image', data: { filename: file.name, mimeType: 'image/jpeg', base64: base64Data } }) }); 
                    const result = await response.json(); 
                    if(result.url) { 
                        document.getElementById(targetId).focus(); 
                        document.execCommand('insertHTML', false, `<div style="text-align: center;"><img src="${result.url}" loading="lazy" style="max-width: 100%; border-radius: 8px; margin: 10px 0; display: inline-block; cursor: pointer;"></div><br>`); 
                    } else { alert("Lỗi! Không lấy được link ảnh từ Server."); } 
                } catch(err) { alert("Lỗi mạng khi tải ảnh lên!"); } 
                document.getElementById('loader').style.display = 'none'; 
            }; img.src = event.target.result; 
        }; reader.readAsDataURL(file); 
    }; input.click(); 
}

window.handleEditorClick = function(e) { 
    document.querySelectorAll('div[contenteditable="true"] img').forEach(img => img.style.border = 'none'); 
    window.currentSelectedImg = null; 
    if (e.target.tagName === 'IMG') { e.target.style.border = '3px dashed #f97316'; window.currentSelectedImg = e.target; } 
};

window.resizeImg = function(size) { 
    if(!size) return; 
    if(!window.currentSelectedImg) return alert("Thầy hãy bấm chọn một tấm ảnh ở dưới trước khi chỉnh kích thước nhé!"); 
    window.currentSelectedImg.style.width = size; window.currentSelectedImg.style.height = 'auto'; 
};

function parseImg(t) { return (t||"").toString().replace(/\[img:(.*?)\]/g, '<img src="$1" loading="lazy" class="rounded border my-2">').replace(/\n/g,'<br>'); }

// ==========================================
// 📰 BẢNG TIN LỚP
// ==========================================
function moThongBao() { 
    closeMenu(); 
    let btnTaoMoi = currentUser && currentUser.role === 'admin' ? `<button onclick="editNotiUI(null)" class="w-full mb-6 bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg btn-3d hover:bg-orange-700 transition flex items-center justify-center gap-2"><i class="fas fa-plus-circle text-xl"></i> TẠO BÀI VIẾT MỚI</button>` : ''; 
    let sortedList = [...Data.notiList].sort((a, b) => { const getVal = (item) => { let rawT = item.time.includes('|||') ? item.time.split('|||')[1] : item.time; const m = String(rawT).match(/(\d{2})\/(\d{2})\/(\d{4})/); return m ? parseInt(m[3] + m[2] + m[1]) : 0; }; let dateA = getVal(a), dateB = getVal(b); if (dateA !== dateB) return dateB - dateA; return (parseInt(String(b.id).replace(/\D/g,''))||0) - (parseInt(String(a.id).replace(/\D/g,''))||0); }); 
    let listHtml = ""; 
    
    if (sortedList.length === 0) { listHtml = `<div class="text-center py-10 opacity-60"><i class="fas fa-inbox text-6xl text-slate-300 mb-3"></i><p class="font-bold text-slate-400">Chưa có bài viết nào.</p></div>`; } 
    else { 
        listHtml = sortedList.map((tb, index) => { 
            let adminButtons = currentUser && currentUser.role === 'admin' ? `<div class="flex gap-2 mt-4 pt-3 border-t border-orange-100"><button onclick="editNotiUI('${tb.id}')" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-xl font-bold hover:bg-blue-100 transition text-sm flex items-center justify-center gap-1"><i class="fas fa-edit"></i> Sửa</button><button onclick="xoaThongBao('${tb.id}')" class="flex-1 bg-red-50 text-red-600 py-2 rounded-xl font-bold hover:bg-red-100 transition text-sm flex items-center justify-center gap-1"><i class="fas fa-trash-alt"></i> Xóa</button></div>` : ''; 
            let cleanContent = tb.content ? tb.content.replace(/<button[^>]*>.*?<\/button>/gi, '').replace(/<img /gi, '<img loading="lazy" ') : ""; 
            let typeStr = "Thông báo"; let displayTime = tb.time; let iconHtml = '<i class="fas fa-bullhorn"></i>'; let colorTheme = 'bg-orange-100 text-orange-600'; 
            
            if (tb.time.includes('|||')) { 
                let parts = tb.time.split('|||'); typeStr = parts[0]; displayTime = parts[1]; 
                if(typeStr === 'THÔNG BÁO TỪ GVCN' || typeStr === 'Thông báo chung') typeStr = 'Thông báo'; 
                if(typeStr === 'HOẠT ĐỘNG LỚP 4/6' || typeStr === 'Hoạt động lớp') typeStr = 'Hoạt động'; 
                if (typeStr === 'Hoạt động') { iconHtml = '<i class="fas fa-camera-retro"></i>'; colorTheme = 'bg-green-100 text-green-600'; } 
            } else { displayTime = tb.time; } 
            
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
        <div class="flex items-center mb-6"><button onclick="moThongBao()" class="bg-white p-2 rounded-xl shadow mr-3 text-slate-500"><i class="fas fa-times"></i></button><h2 class="font-black text-xl text-orange-600 uppercase">${isEdit ? 'SỬA BÀI VIẾT' : 'TẠO BÀI VIẾT MỚI'}</h2></div>
        <div class="bg-white p-4 sm:p-6 rounded-[2rem] shadow-lg border space-y-4 fade-in w-full overflow-hidden">
            <input type="hidden" id="frmNotiId" value="${idToEdit || ''}">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại bài viết</label><select id="frmNotiType" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400 transition"><option value="Thông báo" ${defaultType === 'Thông báo' ? 'selected' : ''}>📣 Thông báo</option><option value="Hoạt động" ${defaultType === 'Hoạt động' ? 'selected' : ''}>📸 Hoạt động</option></select></div><div><label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Thời gian hiển thị</label><input type="text" id="frmNotiTime" class="edit-input w-full bg-slate-50 border-2 border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-orange-400" value="${defaultTimeStr}"></div></div>
            <div class="w-full">
                <label class="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Nội dung</label>
                ${getRichTextToolbar('frmNotiContent')}
                <div id="frmNotiContent" onclick="handleEditorClick(event)" contenteditable="true" class="w-full min-h-[200px] bg-white border-2 border-slate-200 p-4 rounded-xl outline-none focus:border-orange-400 transition text-base overflow-hidden break-words [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:inline-block [&_img]:cursor-pointer [&_a]:text-blue-600 [&_a]:underline">${currentContent}</div>
            </div>
            <button onclick="luuThongBaoLenServer()" class="w-full bg-orange-600 text-white py-4 rounded-2xl font-black btn-3d shadow-lg mt-2 text-lg hover:bg-orange-700 transition">${isEdit ? 'LƯU THAY ĐỔI' : 'ĐĂNG LÊN HỆ THỐNG'}</button>
        </div>
    `; 
}

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

async function xoaThongBao(id) { 
    if(confirm("Xóa thông báo này vĩnh viễn?")) { document.getElementById('loader').style.display = 'flex'; await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'xoa_thong_bao', data: { id: id } }) }); Data.notiList = Data.notiList.filter(x => x.id !== id); document.getElementById('loader').style.display = 'none'; moThongBao(); } 
}
