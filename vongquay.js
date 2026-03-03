const PRIZES = [ { text: "+10", color: "#34d399", val: 10 }, { text: "Thêm Lượt", color: "#60a5fa", val: 0 }, { text: "-10", color: "#f87171", val: -10 }, { text: "May Mắn", color: "#fbbf24", val: 0 } ];

async function moVongQuay(fromRouter = false) {
    if(!currentUser) return showLogin(); closeMenu();
    if(!fromRouter) window.history.pushState({}, "", "/vong-quay");
    
    document.getElementById('content').innerHTML = `
        ${getNavHtml('vongquay')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm text-center">
            <h2 class="text-2xl font-black text-yellow-500 mb-2">VÒNG QUAY</h2>
            <p class="font-bold mb-6 text-indigo-600">${currentUser.score} điểm</p>
            <div class="relative w-64 h-64 mx-auto mb-8">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 -mt-4 text-4xl text-yellow-500 z-10">▼</div>
                <div id="wheel" class="w-full h-full rounded-full border-8 border-yellow-400" style="background: conic-gradient(#34d399 0deg 90deg, #60a5fa 90deg 180deg, #f87171 180deg 270deg, #fbbf24 270deg 360deg); transition: transform 4s ease-out;"></div>
            </div>
            <button onclick="quay()" class="bg-indigo-600 text-white px-10 py-4 rounded-xl font-black text-xl shadow-lg">QUAY NGAY</button>
        </div>
    `;
}

async function quay() {
    let wheel = document.getElementById('wheel');
    let deg = 360 * 5 + Math.random() * 360;
    wheel.style.transform = `rotate(${deg}deg)`;
    setTimeout(async () => {
        let prize = PRIZES[Math.floor(Math.random() * 4)];
        alert("Kết quả: " + prize.text);
        if(prize.val !== 0) {
            currentUser.score = Number(currentUser.score) + prize.val;
            await fetch(API_URL, { method: 'POST', body: JSON.stringify({ action: 'nop_bai', data: { id_hs: currentUser.id, subject: "LuckySpin", group: "Spin", score_earned: prize.val, details: prize.text } }) });
            location.reload();
        }
    }, 4000);
}

function moXinPhep() {
    if(!currentUser) return showLogin(); closeMenu();
    document.getElementById('content').innerHTML = `
        ${getNavHtml('hopthu')}
        <div class="bg-white p-6 rounded-[2rem] shadow-sm space-y-4">
            <h2 class="font-black text-xl text-red-600">ĐƠN XIN PHÉP</h2>
            <input type="date" id="lDate" class="w-full border-2 p-3 rounded-xl font-bold">
            <textarea id="lReason" class="w-full border-2 p-3 rounded-xl font-medium" placeholder="Lý do nghỉ..."></textarea>
            <button onclick="guiDon()" class="w-full bg-red-600 text-white py-4 rounded-xl font-black">GỬI ĐƠN</button>
        </div>
    `;
}

async function guiDon() {
    let d = document.getElementById('lDate').value;
    let r = document.getElementById('lReason').value;
    if(!d || !r) return alert("Nhập đủ thông tin!");
    await fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'gui_xin_phep', data:{ id:currentUser.id, name:currentUser.name, dateOff:d, type:"Nghỉ", reason:r } }) });
    alert("Đã gửi!"); veTrangChu();
}

function moHopThuBiMat() {
    if(!currentUser) return showLogin(); closeMenu();
    document.getElementById('content').innerHTML = `
        ${getNavHtml('thubimat')}
        <div class="bg-pink-50 p-6 rounded-[2rem] shadow-sm space-y-4">
            <h2 class="font-black text-xl text-pink-600">LỜI MUỐN NÓI</h2>
            <textarea id="mailContent" class="w-full border-2 border-pink-200 p-3 rounded-xl" placeholder="Thầy ơi..."></textarea>
            <button onclick="guiThu()" class="w-full bg-pink-500 text-white py-4 rounded-xl font-black">GỬI THẦY</button>
        </div>
    `;
}

async function guiThu() {
    let c = document.getElementById('mailContent').value;
    if(!c) return alert("Viết gì đi con!");
    await fetch(API_URL, { method:'POST', body:JSON.stringify({ action:'gui_thu_bi_mat', data:{ id:currentUser.id, name:currentUser.name, content:c } }) });
    alert("Đã gửi!"); veTrangChu();
}

async function moDonTu() { // ADMIN XEM ĐƠN
    closeMenu();
    let leaves = await (await fetch(API_URL + "?type=absent_list")).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-red-600">DANH SÁCH ĐƠN</h2></div>`;
    html += leaves.map(l => `<div class="bg-white p-4 rounded-xl border mb-2"><p class="font-bold">${l.name}</p><p>${l.reason}</p><p class="text-xs text-gray-500">${l.dateOff}</p></div>`).join('');
    document.getElementById('content').innerHTML = html;
}

async function moQuanLyThu() { // ADMIN XEM THƯ
    closeMenu();
    let letters = await (await fetch(API_URL + "?type=mailbox")).json();
    let html = `<div class="flex items-center mb-6"><button onclick="veTrangChu()" class="bg-white p-2 rounded shadow mr-3"><i class="fas fa-arrow-left"></i></button><h2 class="font-black text-xl text-pink-600">HỘP THƯ</h2></div>`;
    html += letters.map(l => `<div class="bg-white p-4 rounded-xl border mb-2"><p class="font-bold">${l.name}</p><p>${l.content}</p></div>`).join('');
    document.getElementById('content').innerHTML = html;
}
