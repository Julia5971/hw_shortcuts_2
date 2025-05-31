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

// 검색 관련 변수
let searchTimeout;
let lastSearchQuery = '';
let searchHistory = [];

// 검색 디버깅
const searchDebug = {
    enabled: false,
    
    log: function(message, data = null) {
        if (!this.enabled) return;
        console.log(`[Search Debug] ${message}`, data || '');
    },
    
    error: function(message, error = null) {
        if (!this.enabled) return;
        console.error(`[Search Debug Error] ${message}`, error || '');
    },
    
    // 검색 결과 분석
    analyzeSearchResults: function(query, results) {
        if (!this.enabled) return;
        
        console.log('=== Search Analysis ===');
        console.log('Query:', query);
        console.log('Results count:', results.length);
        
        // 카테고리별 결과 수
        const categoryCount = {};
        results.forEach(shortcut => {
            categoryCount[shortcut.category] = (categoryCount[shortcut.category] || 0) + 1;
        });
        console.log('Results by category:', categoryCount);
        
        // 난이도별 결과 수
        const difficultyCount = {
            easy: 0,
            medium: 0,
            hard: 0
        };
        results.forEach(shortcut => {
            difficultyCount[shortcut.difficulty]++;
        });
        console.log('Results by difficulty:', difficultyCount);
        
        // 검색어 매칭 분석
        results.forEach(shortcut => {
            const matches = {
                description: shortcut.description.toLowerCase().includes(query.toLowerCase()),
                keys: shortcut.keys.some(key => key.toLowerCase().includes(query.toLowerCase())),
                category: shortcut.category.toLowerCase().includes(query.toLowerCase()),
                difficulty: shortcut.difficulty.toLowerCase().includes(query.toLowerCase()),
                usage: shortcut.usage.toLowerCase().includes(query.toLowerCase())
            };
            console.log(`Matching analysis for "${shortcut.description}":`, matches);
        });
        
        console.log('=====================');
    }
};

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
    const stats = learningManager.getStatistics();
    
    totalShortcutsEl.textContent = stats.total;
    learnedShortcutsEl.textContent = stats.learned;
    favoriteShortcutsEl.textContent = stats.favorites;

    // 카테고리별 진행도 업데이트
    const categoryProgress = document.querySelectorAll('.category-progress');
    categoryProgress.forEach(progress => {
        const category = progress.dataset.category;
        const total = shortcutsData.categories.find(c => c.name === category)?.shortcuts.length || 0;
        const learned = stats.byCategory[category] || 0;
        const percentage = total > 0 ? (learned / total) * 100 : 0;
        
        progress.style.width = `${percentage}%`;
        progress.setAttribute('title', `${learned}/${total} 단축키 학습 완료`);
    });

    // 난이도별 진행도 업데이트
    const difficultyProgress = document.querySelectorAll('.difficulty-progress');
    difficultyProgress.forEach(progress => {
        const difficulty = progress.dataset.difficulty;
        const total = shortcutsData.categories.reduce((total, category) => 
            total + category.shortcuts.filter(s => s.difficulty === difficulty).length, 0);
        const learned = stats.byDifficulty[difficulty] || 0;
        const percentage = total > 0 ? (learned / total) * 100 : 0;
        
        progress.style.width = `${percentage}%`;
        progress.setAttribute('title', `${learned}/${total} 단축키 학습 완료`);
    });
}

// 단축키 카드 생성
function createShortcutCard(shortcut) {
    const card = document.createElement('div');
    card.className = `shortcut-card ${shortcut.difficulty}`;
    card.dataset.id = shortcut.id;

    const isLearned = learningManager.isLearned(shortcut.id);
    const isFavorite = learningManager.isFavorite(shortcut.id);
    const progress = learningManager.getProgress(shortcut.id);

    card.innerHTML = `
        <div class="card-header">
            <h3>${shortcut.description}</h3>
            <div class="card-actions">
                <button class="learn-btn ${isLearned ? 'learned' : ''}" title="${isLearned ? '학습 완료' : '학습하기'}">
                    <i class="fas ${isLearned ? 'fa-check-circle' : 'fa-circle'}"></i>
                </button>
                <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" title="${isFavorite ? '즐겨찾기 해제' : '즐겨찾기'}">
                    <i class="fas ${isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                </button>
            </div>
        </div>
        <div class="card-body">
            <div class="keys">
                ${shortcut.keys.map(key => `<kbd>${key}</kbd>`).join(' + ')}
            </div>
            <div class="shortcut-info">
                <span class="category">${shortcut.category}</span>
                <span class="difficulty ${shortcut.difficulty}">${shortcut.difficulty}</span>
                <span class="usage">${shortcut.usage}</span>
            </div>
            ${progress ? `
                <div class="progress-info">
                    <div class="progress-bar">
                        <div class="progress" style="width: ${(progress.attempts / 10) * 100}%"></div>
                    </div>
                    <span class="attempts">시도: ${progress.attempts}</span>
                </div>
            ` : ''}
        </div>
    `;

    // 학습 버튼 이벤트
    const learnBtn = card.querySelector('.learn-btn');
    learnBtn.addEventListener('click', () => {
        learningManager.toggleLearned(shortcut.id);
        learnBtn.classList.toggle('learned');
        learnBtn.querySelector('i').classList.toggle('fa-check-circle');
        learnBtn.querySelector('i').classList.toggle('fa-circle');
        learnBtn.title = learnBtn.classList.contains('learned') ? '학습 완료' : '학습하기';
        updateStats();
    });

    // 즐겨찾기 버튼 이벤트
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', () => {
        learningManager.toggleFavorite(shortcut.id);
        favoriteBtn.classList.toggle('favorited');
        favoriteBtn.querySelector('i').classList.toggle('fa-star');
        favoriteBtn.querySelector('i').classList.toggle('fa-star-o');
        favoriteBtn.title = favoriteBtn.classList.contains('favorited') ? '즐겨찾기 해제' : '즐겨찾기';
        updateStats();
    });

    return card;
}

// 단축키 렌더링
function renderShortcuts(shortcuts) {
    shortcutsContainer.innerHTML = '';
    
    if (shortcuts.length === 0) {
        shortcutsContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>검색 결과가 없습니다.</p>
            </div>
        `;
        return;
    }

    shortcuts.forEach(shortcut => {
        const card = createShortcutCard(shortcut);
        shortcutsContainer.appendChild(card);
    });
}

// 검색 기능 개선
function searchShortcuts(query) {
    searchDebug.log('Searching with query:', query);
    
    // 검색어가 비어있으면 모든 단축키 표시
    if (!query.trim()) {
        searchDebug.log('Empty query, showing all shortcuts');
        const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
        renderShortcuts(allShortcuts);
        return;
    }

    // 검색어를 소문자로 변환
    query = query.toLowerCase();
    searchDebug.log('Normalized query:', query);

    // 검색 기록에 추가
    if (query !== lastSearchQuery) {
        searchHistory.unshift(query);
        if (searchHistory.length > 10) searchHistory.pop();
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        lastSearchQuery = query;
        searchDebug.log('Updated search history:', searchHistory);
    }

    // 검색 실행
    const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
    const filtered = allShortcuts.filter(shortcut => {
        // 설명 검색
        const descriptionMatch = shortcut.description.toLowerCase().includes(query);
        
        // 키 조합 검색
        const keysMatch = shortcut.keys.some(key => key.toLowerCase().includes(query));
        
        // 카테고리 검색
        const categoryMatch = shortcut.category.toLowerCase().includes(query);
        
        // 난이도 검색
        const difficultyMatch = shortcut.difficulty.toLowerCase().includes(query);
        
        // 사용빈도 검색
        const usageMatch = shortcut.usage.toLowerCase().includes(query);

        const matches = descriptionMatch || keysMatch || categoryMatch || difficultyMatch || usageMatch;
        if (matches) {
            searchDebug.log(`Match found for "${shortcut.description}"`, {
                descriptionMatch,
                keysMatch,
                categoryMatch,
                difficultyMatch,
                usageMatch
            });
        }

        return matches;
    });

    // 검색 결과 분석
    searchDebug.analyzeSearchResults(query, filtered);

    // 검색 결과 표시
    renderShortcuts(filtered);

    // 검색 결과 없음 처리
    if (filtered.length === 0) {
        searchDebug.log('No results found');
        showNoResultsMessage(query);
    }
}

// 검색 결과 없음 메시지 표시
function showNoResultsMessage(query) {
    searchDebug.log('Showing no results message for query:', query);
    
    const message = document.createElement('div');
    message.className = 'no-results';
    message.innerHTML = `
        <i class="fas fa-search"></i>
        <p>"${query}"에 대한 검색 결과가 없습니다.</p>
        <div class="suggestions">
            <p>다음과 같이 검색해보세요:</p>
            <ul>
                <li>다른 키워드로 검색</li>
                <li>카테고리별로 찾아보기</li>
                <li>난이도별로 찾아보기</li>
            </ul>
        </div>
    `;
    shortcutsContainer.innerHTML = '';
    shortcutsContainer.appendChild(message);
}

// 검색 기록 표시
function showSearchHistory() {
    searchDebug.log('Showing search history');
    
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (history.length === 0) {
        searchDebug.log('No search history found');
        return;
    }

    searchDebug.log('Found search history:', history);

    const historyContainer = document.createElement('div');
    historyContainer.className = 'search-history';
    historyContainer.innerHTML = `
        <h3>최근 검색어</h3>
        <ul>
            ${history.map(query => `
                <li>
                    <a href="#" class="history-item">
                        <i class="fas fa-history"></i>
                        ${query}
                    </a>
                </li>
            `).join('')}
        </ul>
    `;

    // 검색 기록 클릭 이벤트
    historyContainer.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const query = e.target.textContent.trim();
            searchDebug.log('History item clicked:', query);
            searchInput.value = query;
            searchShortcuts(query);
        });
    });

    // 기존 검색 기록 제거 후 새로운 검색 기록 추가
    const existingHistory = document.querySelector('.search-history');
    if (existingHistory) existingHistory.remove();
    searchInput.parentElement.appendChild(historyContainer);
}

// 검색 입력 이벤트 리스너 개선
searchInput.addEventListener('input', (e) => {
    // 디바운스 적용
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        searchShortcuts(e.target.value);
    }, 300);
});

// 검색 버튼 클릭 이벤트
searchBtn.addEventListener('click', () => {
    searchShortcuts(searchInput.value);
});

// 검색 입력 필드 포커스 이벤트
searchInput.addEventListener('focus', () => {
    showSearchHistory();
});

// 검색 입력 필드 블러 이벤트
searchInput.addEventListener('blur', () => {
    // 약간의 지연을 두어 클릭 이벤트가 처리될 수 있도록 함
    setTimeout(() => {
        const historyContainer = document.querySelector('.search-history');
        if (historyContainer) historyContainer.remove();
    }, 200);
});

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
document.addEventListener('DOMContentLoaded', () => {
    // 초기 렌더링
    populateCategoryFilter();
    renderShortcuts(shortcutsData.categories.flatMap(category => category.shortcuts));
    updateStats();

    // 검색 이벤트
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchShortcuts(e.target.value);
        }, 300);
    });

    searchBtn.addEventListener('click', () => {
        searchShortcuts(searchInput.value);
    });

    // 필터 이벤트
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

    // 네비게이션 이벤트
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.dataset.target;
            
            // 모든 섹션 숨기기
            document.querySelectorAll('main > section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // 대상 섹션 표시
            document.getElementById(target).classList.remove('hidden');
            
            // 활성 링크 업데이트
            document.querySelectorAll('.nav-link').forEach(l => {
                l.classList.remove('active');
            });
            e.target.classList.add('active');
        });
    });

    // 초기화 시 검색 디버깅 활성화
    searchDebug.enabled = true;
    searchDebug.log('Search debug mode enabled');
}); 