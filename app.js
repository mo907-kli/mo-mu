import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// إعداداتك الخاصة (مع سيرفر أوروبا)
const firebaseConfig = {
    apiKey: "AIzaSyC5U1iJdaqEFcrslw2w1ET_23gPo8vSuIo",
    authDomain: "rof-f756a.firebaseapp.com",
    databaseURL: "https://rof-f756a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "rof-f756a",
    storageBucket: "rof-f756a.firebasestorage.app",
    messagingSenderId: "354363701294",
    appId: "1:354363701294:web:07d38e0bfbf51ac81387bf"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let myName = "";
let currentRoom = "";
let isHost = false;

// فئات اللعبة (قوانين إنسان، حيوان، جماد)
const categories = ['اسم إنسان (ذكر أو أنثى)', 'اسم حيوان', 'اسم نبات أو فاكهة', 'اسم جماد', 'اسم دولة أو مدينة', 'اسم أكلة', 'اسم مهنة أو وظيفة'];

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function showNotif(msg, isError = false) {
    const notif = document.getElementById('notif');
    notif.textContent = msg;
    notif.style.background = isError ? '#e74c3c' : '#4CAF50';
    notif.style.display = 'block';
    setTimeout(() => notif.style.display = 'none', 3000);
}

// 1. إنشاء الغرفة
document.getElementById('btnCreateRoom').onclick = async () => {
    myName = document.getElementById('playerName').value.trim() || 'المضيف';
    currentRoom = Math.random().toString(36).substring(2, 8).toUpperCase();
    isHost = true;

    const allLetters = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ','و','ي'];
    let initialBoard = {};
    allLetters.forEach(l => initialBoard[l] = "empty");

    try {
        await set(ref(db, 'rooms/' + currentRoom), {
            host: myName,
            status: 'lobby',
            scores: { t1: 0, t2: 0 },
            board: initialBoard,
            players: {
                [myName]: { team: 'wait' }
            }
        });
        
        document.getElementById('displayCode').textContent = currentRoom;
        document.getElementById('btnStartGame').style.display = 'block';
        showScreen('lobbyScreen');
        listenToRoom();
        showNotif("تم إنشاء الغرفة بنجاح!");
    } catch (err) {
        showNotif("يوجد مشكلة في فايربيس", true);
    }
};

// 2. الانضمام للغرفة
document.getElementById('btnJoinRoom').onclick = async () => {
    myName = document.getElementById('playerName').value.trim() || 'لاعب';
    let code = document.getElementById('roomCodeInput').value.trim().toUpperCase();
    if(!code) return showNotif("أدخل الكود!", true);

    try {
        const snapshot = await get(ref(db, 'rooms/' + code));
        if (snapshot.exists()) {
            currentRoom = code;
            isHost = false;
            await update(ref(db, `rooms/${currentRoom}/players`), {
                [myName]: { team: 'wait' }
            });
            document.getElementById('displayCode').textContent = currentRoom;
            showScreen('lobbyScreen');
            listenToRoom();
            showNotif("تم الانضمام للغرفة!");
        } else {
            showNotif("كود الغرفة غير صحيح", true);
        }
    } catch (err) {
        showNotif("خطأ في الاتصال", true);
    }
};

// 3. المزامنة الحية للغرفة
function listenToRoom() {
    onValue(ref(db, 'rooms/' + currentRoom), (snapshot) => {
        const data = snapshot.val();
        if(!data) return;

        updateLobbyUI(data.players, data.host);

        if (data.status === 'playing') {
            if (!document.getElementById('gameScreen').classList.contains('active')) {
                buildBoardUI();
                showScreen('gameScreen');
            }
            document.getElementById('scoreT1').textContent = data.scores.t1;
            document.getElementById('scoreT2').textContent = data.scores.t2;
            updateBoardUI(data.board);
        }
    });
}

function updateLobbyUI(players, hostName) {
    const waitList = document.getElementById('waitList');
    const t1List = document.getElementById('t1List');
    const t2List = document.getElementById('t2List');
    
    waitList.innerHTML = ''; t1List.innerHTML = ''; t2List.innerHTML = '';
    let c1 = 0, c2 = 0;

    Object.keys(players).forEach(pName => {
        let p = players[pName];
        let tag = pName === hostName ? ' 👑' : '';
        let div = document.createElement('div');
        div.className = 'player-item';
        div.textContent = pName + tag;

        if (isHost) {
            div.onclick = () => {
                let nextTeam = p.team === 'wait' ? 't1' : p.team === 't1' ? 't2' : 'wait';
                update(ref(db, `rooms/${currentRoom}/players/${pName}`), { team: nextTeam });
            };
        }

        if (p.team === 'wait') waitList.appendChild(div);
        else if (p.team === 't1') { t1List.appendChild(div); c1++; }
        else if (p.team === 't2') { t2List.appendChild(div); c2++; }
    });

    document.getElementById('t1Count').textContent = c1;
    document.getElementById('t2Count').textContent = c2;
}

document.getElementById('btnStartGame').onclick = () => {
    update(ref(db, `rooms/${currentRoom}`), { status: 'playing' });
};

// 4. بناء الخلية وتطبيق قوانين (إنسان، حيوان، جماد)
const rowLayout = [6, 5, 6, 5, 6];
const allLetters = ['أ','ب','ت','ث','ج','ح','خ','د','ذ','ر','ز','س','ش','ص','ض','ط','ظ','ع','غ','ف','ق','ك','ل','م','ن','هـ','و','ي'];

function buildBoardUI() {
    const board = document.getElementById('board');
    if (board.innerHTML !== '') return;
    
    let letterIdx = 0;
    rowLayout.forEach(count => {
        let row = document.createElement('div');
        row.className = 'hex-row';
        for (let i = 0; i < count; i++) {
            if (letterIdx < allLetters.length) {
                let l = allLetters[letterIdx];
                let wrap = document.createElement('div');
                wrap.className = 'hex-wrap';
                wrap.id = 'hex-' + l;
                wrap.innerHTML = `<div class="hex-border"></div><div class="hex-inner">${l}</div>`;
                
                if (isHost) {
                    wrap.onclick = () => handleCellClick(l);
                }
                
                row.appendChild(wrap);
                letterIdx++;
            }
        }
        board.appendChild(row);
    });
}

function updateBoardUI(boardData) {
    allLetters.forEach(l => {
        let cell = document.getElementById('hex-' + l);
        if(cell) {
            cell.className = 'hex-wrap';
            if(boardData[l] === 't1') cell.classList.add('won-t1');
            if(boardData[l] === 't2') cell.classList.add('won-t2');
        }
    });
}

// 5. دالة الضغط على الخلية (توليد التحدي العشوائي حسب القوانين الجديدة)
async function handleCellClick(letter) {
    const snap = await get(ref(db, `rooms/${currentRoom}/board/${letter}`));
    let state = snap.val();
    
    // إذا الخلية غير ملونة، يظهر التحدي للمضيف ليطرحه على الفرق
    if(state === "empty") {
        let randomCategory = categories[Math.floor(Math.random() * categories.length)];
        let challengeMsg = `التحدي: هات [ ${randomCategory} ] يبدأ بحرف الـ ( ${letter} )`;
        
        // إظهار نافذة صغيرة للمضيف لتحديد الفائز
        let answer = prompt(`${challengeMsg}\n\nإذا جاوب الفريق الأول بشكل صحيح اكتب رقم 1\nإذا جاوب الفريق الثاني اكتب رقم 2\nللإلغاء اتركها فارغة.`);
        
        if(answer === '1') {
            update(ref(db, `rooms/${currentRoom}/board`), { [letter]: 't1' });
        } else if(answer === '2') {
            update(ref(db, `rooms/${currentRoom}/board`), { [letter]: 't2' });
        }
    } 
    // إذا كانت ملونة مسبقاً، المضيف يقدر يلغيها أو ينقلها للفريق الآخر
    else {
        let newState = state === "t1" ? "t2" : "empty";
        update(ref(db, `rooms/${currentRoom}/board`), { [letter]: newState });
    }
    
    // تحديث النقاط للجميع تلقائياً
    setTimeout(async () => {
        const boardSnap = await get(ref(db, `rooms/${currentRoom}/board`));
        let t1Score = 0, t2Score = 0;
        Object.values(boardSnap.val()).forEach(val => {
            if (val === 't1') t1Score++;
            if (val === 't2') t2Score++;
        });
        update(ref(db, `rooms/${currentRoom}/scores`), { t1: t1Score, t2: t2Score });
    }, 500);
}
