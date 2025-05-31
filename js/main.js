// DOM 요소들
const searchInput = document.getElementById('search-input');
const shortcutsContainer = document.getElementById('shortcuts-container');

// 단축키 카드 생성 함수
function createShortcutCard(shortcut) {
    const card = document.createElement('div');
    card.className = 'shortcut-card';
    card.innerHTML = `
        <div class="shortcut-keys">
            ${shortcut.keys.map(key => `<span class="key">${key}</span>`).join(' + ')}
        </div>
        <div class="shortcut-description">${shortcut.description}</div>
        <div class="shortcut-actions">
            <button class="learn-btn" data-id="${shortcut.id}">
                ${shortcut.learned ? '학습 완료' : '학습하기'}
            </button>
            <button class="favorite-btn" data-id="${shortcut.id}">
                ${shortcut.favorite ? '★' : '☆'}
            </button>
        </div>
    `;
    return card;
}

// 단축키 목록 렌더링
function renderShortcuts(shortcuts) {
    shortcutsContainer.innerHTML = '';
    shortcuts.forEach(shortcut => {
        shortcutsContainer.appendChild(createShortcutCard(shortcut));
    });
}

// 검색 기능
function searchShortcuts(query) {
    const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
    const filtered = allShortcuts.filter(shortcut => 
        shortcut.description.toLowerCase().includes(query.toLowerCase()) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query.toLowerCase()))
    );
    renderShortcuts(filtered);
}

// 이벤트 리스너 설정
searchInput.addEventListener('input', (e) => {
    searchShortcuts(e.target.value);
});

// 학습 상태 토글
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('learn-btn')) {
        const shortcutId = e.target.dataset.id;
        const shortcut = shortcutsData.categories
            .flatMap(category => category.shortcuts)
            .find(s => s.id === shortcutId);
        
        if (shortcut) {
            shortcut.learned = !shortcut.learned;
            e.target.textContent = shortcut.learned ? '학습 완료' : '학습하기';
            storage.saveData();
        }
    }
});

// 즐겨찾기 토글
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite-btn')) {
        const shortcutId = e.target.dataset.id;
        const shortcut = shortcutsData.categories
            .flatMap(category => category.shortcuts)
            .find(s => s.id === shortcutId);
        
        if (shortcut) {
            shortcut.favorite = !shortcut.favorite;
            e.target.textContent = shortcut.favorite ? '★' : '☆';
            storage.saveData();
        }
    }
});

// 초기 렌더링
const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
renderShortcuts(allShortcuts); 