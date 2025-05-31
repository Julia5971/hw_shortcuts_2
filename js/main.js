// DOM 요소들
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const shortcutsContainer = document.getElementById('shortcuts-container');
const categoryFilter = document.getElementById('category-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const statsSection = document.getElementById('stats-section');
const totalShortcutsEl = document.getElementById('total-shortcuts');
const learnedShortcutsEl = document.getElementById('learned-shortcuts');
const favoriteShortcutsEl = document.getElementById('favorite-shortcuts');

// 카테고리 필터 옵션 생성
function populateCategoryFilter() {
    shortcutsData.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        categoryFilter.appendChild(option);
    });
}

// 통계 업데이트
function updateStats() {
    const stats = shortcutsData.userStats;
    totalShortcutsEl.textContent = stats.totalShortcuts;
    learnedShortcutsEl.textContent = stats.learnedShortcuts;
    favoriteShortcutsEl.textContent = stats.favoriteShortcuts;
}

// 단축키 카드 생성 함수
function createShortcutCard(shortcut) {
    const card = document.createElement('div');
    card.className = `shortcut-card ${shortcut.difficulty}`;
    card.innerHTML = `
        <div class="shortcut-keys">
            ${shortcut.keys.map(key => `<span class="key">${key}</span>`).join(' + ')}
        </div>
        <div class="shortcut-description">${shortcut.description}</div>
        <div class="shortcut-meta">
            <span class="difficulty"><i class="fas fa-signal"></i> 난이도: ${shortcut.difficulty}</span>
            <span class="usage"><i class="fas fa-chart-line"></i> 사용빈도: ${shortcut.usage}</span>
        </div>
        <div class="shortcut-actions">
            <button class="learn-btn ${shortcut.learned ? 'learned' : ''}" data-id="${shortcut.id}">
                <i class="fas ${shortcut.learned ? 'fa-check' : 'fa-graduation-cap'}"></i>
                ${shortcut.learned ? '학습 완료' : '학습하기'}
            </button>
            <button class="favorite-btn ${shortcut.favorite ? 'favorited' : ''}" data-id="${shortcut.id}">
                <i class="fas ${shortcut.favorite ? 'fa-star' : 'fa-star-o'}"></i>
                ${shortcut.favorite ? '즐겨찾기' : '추가'}
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
    updateStats();
}

// 검색 기능
function searchShortcuts(query) {
    const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
    const filtered = allShortcuts.filter(shortcut => 
        shortcut.description.toLowerCase().includes(query.toLowerCase()) ||
        shortcut.keys.some(key => key.toLowerCase().includes(query.toLowerCase())) ||
        shortcut.category.toLowerCase().includes(query.toLowerCase())
    );
    renderShortcuts(filtered);
}

// 카테고리 필터링
function filterByCategory(categoryId) {
    if (categoryId === 'all') {
        const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
        renderShortcuts(allShortcuts);
    } else {
        const category = shortcutsData.categories.find(c => c.id === categoryId);
        if (category) {
            renderShortcuts(category.shortcuts);
        }
    }
}

// 난이도 필터링
function filterByDifficulty(difficulty) {
    const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
    const filtered = allShortcuts.filter(shortcut => shortcut.difficulty === difficulty);
    renderShortcuts(filtered);
}

// 이벤트 리스너 설정
searchInput.addEventListener('input', (e) => {
    searchShortcuts(e.target.value);
});

searchBtn.addEventListener('click', () => {
    searchShortcuts(searchInput.value);
});

categoryFilter.addEventListener('change', (e) => {
    filterByCategory(e.target.value);
});

difficultyFilter.addEventListener('change', (e) => {
    if (e.target.value === 'all') {
        const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
        renderShortcuts(allShortcuts);
    } else {
        filterByDifficulty(e.target.value);
    }
});

// 학습 상태 토글
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('learn-btn') || e.target.parentElement.classList.contains('learn-btn')) {
        const btn = e.target.classList.contains('learn-btn') ? e.target : e.target.parentElement;
        const shortcutId = btn.dataset.id;
        const shortcut = shortcutsData.categories
            .flatMap(category => category.shortcuts)
            .find(s => s.id === shortcutId);
        
        if (shortcut) {
            shortcut.learned = !shortcut.learned;
            btn.innerHTML = `
                <i class="fas ${shortcut.learned ? 'fa-check' : 'fa-graduation-cap'}"></i>
                ${shortcut.learned ? '학습 완료' : '학습하기'}
            `;
            btn.classList.toggle('learned');
            storage.saveData();
        }
    }
});

// 즐겨찾기 토글
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('favorite-btn') || e.target.parentElement.classList.contains('favorite-btn')) {
        const btn = e.target.classList.contains('favorite-btn') ? e.target : e.target.parentElement;
        const shortcutId = btn.dataset.id;
        const shortcut = shortcutsData.categories
            .flatMap(category => category.shortcuts)
            .find(s => s.id === shortcutId);
        
        if (shortcut) {
            shortcut.favorite = !shortcut.favorite;
            btn.innerHTML = `
                <i class="fas ${shortcut.favorite ? 'fa-star' : 'fa-star-o'}"></i>
                ${shortcut.favorite ? '즐겨찾기' : '추가'}
            `;
            btn.classList.toggle('favorited');
            storage.saveData();
        }
    }
});

// 네비게이션 이벤트 처리
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('href').substring(1);
        
        // 활성 링크 업데이트
        document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');
        
        // 섹션 표시/숨김 처리
        if (target === 'stats') {
            statsSection.classList.remove('hidden');
            shortcutsContainer.classList.add('hidden');
        } else {
            statsSection.classList.add('hidden');
            shortcutsContainer.classList.remove('hidden');
            
            if (target === 'favorites') {
                const favorites = shortcutsData.categories
                    .flatMap(category => category.shortcuts)
                    .filter(shortcut => shortcut.favorite);
                renderShortcuts(favorites);
            } else {
                const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
                renderShortcuts(allShortcuts);
            }
        }
    });
});

// 초기화
populateCategoryFilter();
const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
renderShortcuts(allShortcuts); 