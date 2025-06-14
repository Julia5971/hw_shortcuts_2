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

// 외운 단축키 체크 상태 관리
const memorizedShortcuts = JSON.parse(localStorage.getItem('memorizedShortcuts') || '{}');
function setMemorized(shortcutId, value) {
    memorizedShortcuts[shortcutId] = value;
    localStorage.setItem('memorizedShortcuts', JSON.stringify(memorizedShortcuts));
}
function isMemorized(shortcutId) {
    return !!memorizedShortcuts[shortcutId];
}

// 단축키 카드 생성 (체크박스 추가, 체크 시 '외웠음!' 메시지만 남김)
function createShortcutCard(shortcut) {
    const card = document.createElement('div');
    card.className = `shortcut-card ${shortcut.difficulty}`;
    card.dataset.id = shortcut.id;

    // 체크박스 UI
    const checked = isMemorized(shortcut.id);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'memorize-checkbox';
    checkbox.checked = checked;
    checkbox.title = '외웠으면 체크!';
    checkbox.style.marginRight = '0.5rem';
    checkbox.style.transform = 'scale(1.3)';
    checkbox.style.cursor = 'pointer';

    // 카드 내용
    const content = document.createElement('div');
    content.className = 'shortcut-content';
    content.innerHTML = `
        <div class="card-header">
            <h3>${shortcut.description}</h3>
            <div class="card-actions">
                <button class="learn-btn ${learningManager.isLearned(shortcut.id) ? 'learned' : ''}" title="${learningManager.isLearned(shortcut.id) ? '학습 완료' : '학습하기'}">
                    <i class="fas ${learningManager.isLearned(shortcut.id) ? 'fa-check-circle' : 'fa-circle'}"></i>
                </button>
                <button class="favorite-btn ${learningManager.isFavorite(shortcut.id) ? 'favorited' : ''}" title="${learningManager.isFavorite(shortcut.id) ? '즐겨찾기 해제' : '즐겨찾기'}">
                    <i class="fas ${learningManager.isFavorite(shortcut.id) ? 'fa-star' : 'fa-star-o'}"></i>
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
        </div>
    `;

    // 외웠음 메시지
    const memorizedMsg = document.createElement('div');
    memorizedMsg.className = 'memorized-msg';
    memorizedMsg.textContent = '외웠음!';
    memorizedMsg.style.display = checked ? '' : 'none';
    memorizedMsg.style.textAlign = 'center';
    memorizedMsg.style.fontWeight = 'bold';
    memorizedMsg.style.fontSize = '1.2rem';
    memorizedMsg.style.color = '#2ecc71';
    memorizedMsg.style.margin = '2rem 0';

    // 체크박스 이벤트
    checkbox.addEventListener('change', () => {
        setMemorized(shortcut.id, checkbox.checked);
        if (checkbox.checked) {
            content.style.display = 'none';
            memorizedMsg.style.display = '';
        } else {
            content.style.display = '';
            memorizedMsg.style.display = 'none';
        }
    });

    // 카드 최상단에 체크박스, 아래에 내용/메시지 추가
    card.appendChild(checkbox);
    card.appendChild(content);
    card.appendChild(memorizedMsg);

    // 기존 학습/즐겨찾기 버튼 이벤트 연결
    const learnBtn = content.querySelector('.learn-btn');
    learnBtn.addEventListener('click', () => {
        learningManager.toggleLearned(shortcut.id);
        learnBtn.classList.toggle('learned');
        learnBtn.querySelector('i').classList.toggle('fa-check-circle');
        learnBtn.querySelector('i').classList.toggle('fa-circle');
        learnBtn.title = learnBtn.classList.contains('learned') ? '학습 완료' : '학습하기';
        updateStats();
    });
    const favoriteBtn = content.querySelector('.favorite-btn');
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

// 성능 최적화를 위한 캐시
const cache = {
    shortcuts: null,
    filteredShortcuts: new Map(),
    searchResults: new Map(),
    
    // 모든 단축키 가져오기 (캐시된 버전)
    getAllShortcuts: function() {
        if (!this.shortcuts) {
            this.shortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
        }
        return this.shortcuts;
    },
    
    // 필터링된 단축키 가져오기
    getFilteredShortcuts: function(categoryId, difficulty) {
        const key = `${categoryId}-${difficulty}`;
        if (!this.filteredShortcuts.has(key)) {
            let filtered = this.getAllShortcuts();
            
            if (categoryId !== 'all') {
                filtered = filtered.filter(s => s.category === categoryId);
            }
            
            if (difficulty !== 'all') {
                filtered = filtered.filter(s => s.difficulty === difficulty);
            }
            
            this.filteredShortcuts.set(key, filtered);
        }
        return this.filteredShortcuts.get(key);
    },
    
    // 검색 결과 가져오기
    getSearchResults: function(query) {
        if (!this.searchResults.has(query)) {
            const results = this.getAllShortcuts().filter(shortcut => {
                const normalizedQuery = query.toLowerCase();
                return (
                    shortcut.description.toLowerCase().includes(normalizedQuery) ||
                    shortcut.keys.some(key => key.toLowerCase().includes(normalizedQuery)) ||
                    shortcut.category.toLowerCase().includes(normalizedQuery) ||
                    shortcut.difficulty.toLowerCase().includes(normalizedQuery) ||
                    shortcut.usage.toLowerCase().includes(normalizedQuery)
                );
            });
            this.searchResults.set(query, results);
        }
        return this.searchResults.get(query);
    },
    
    // 캐시 초기화
    clearCache: function() {
        this.shortcuts = null;
        this.filteredShortcuts.clear();
        this.searchResults.clear();
    }
};

// 가상 스크롤링 구현
class VirtualScroller {
    constructor(container, items, itemHeight) {
        this.container = container;
        this.items = items;
        this.itemHeight = itemHeight;
        this.visibleItems = Math.ceil(container.clientHeight / itemHeight);
        this.scrollTop = 0;
        this.totalHeight = items.length * itemHeight;
        
        this.setupVirtualScroll();
    }
    
    setupVirtualScroll() {
        // 컨테이너 스타일 설정
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        // 가상 스크롤 영역 생성
        const virtualSpace = document.createElement('div');
        virtualSpace.style.height = `${this.totalHeight}px`;
        virtualSpace.style.position = 'relative';
        this.container.appendChild(virtualSpace);
        
        // 스크롤 이벤트 처리
        this.container.addEventListener('scroll', () => {
            this.scrollTop = this.container.scrollTop;
            this.render();
        });
        
        // 초기 렌더링
        this.render();
    }
    
    render() {
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.min(startIndex + this.visibleItems + 1, this.items.length);
        
        // 기존 아이템 제거
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        
        // 가상 스크롤 영역 다시 추가
        const virtualSpace = document.createElement('div');
        virtualSpace.style.height = `${this.totalHeight}px`;
        virtualSpace.style.position = 'relative';
        this.container.appendChild(virtualSpace);
        
        // 현재 보이는 아이템만 렌더링
        for (let i = startIndex; i < endIndex; i++) {
            const item = this.items[i];
            const element = createShortcutCard(item);
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.width = '100%';
            this.container.appendChild(element);
        }
    }
    
    updateItems(newItems) {
        this.items = newItems;
        this.totalHeight = this.items.length * this.itemHeight;
        this.render();
    }
}

// 단축키 렌더링 개선
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

    // 가상 스크롤러 초기화
    if (!window.virtualScroller) {
        window.virtualScroller = new VirtualScroller(
            shortcutsContainer,
            shortcuts,
            120 // 카드 높이 (px)
        );
    } else {
        window.virtualScroller.updateItems(shortcuts);
    }
}

// 검색 기능 최적화
function searchShortcuts(query) {
    searchDebug.log('Searching with query:', query);
    
    // 검색어가 비어있으면 모든 단축키 표시
    if (!query.trim()) {
        searchDebug.log('Empty query, showing all shortcuts');
        renderShortcuts(cache.getAllShortcuts());
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

    // 캐시된 검색 결과 사용
    const filtered = cache.getSearchResults(query);

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

// 필터링 최적화
function filterByCategory(categoryId) {
    const filtered = cache.getFilteredShortcuts(categoryId, difficultyFilter.value);
    renderShortcuts(filtered);
}

function filterByDifficulty(difficulty) {
    const filtered = cache.getFilteredShortcuts(categoryFilter.value, difficulty);
    renderShortcuts(filtered);
}

// 카테고리 목록 동적 표시 및 필터링 기능 추가
function showCategoryList() {
    // 이미 표시된 경우 토글로 닫기
    let existing = document.getElementById('category-list-popup');
    if (existing) {
        existing.remove();
        return;
    }
    // 팝업 생성
    const popup = document.createElement('div');
    popup.id = 'category-list-popup';
    popup.style.position = 'absolute';
    popup.style.top = '60px';
    popup.style.left = '50%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.background = '#fff';
    popup.style.border = '1px solid #ddd';
    popup.style.borderRadius = '8px';
    popup.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    popup.style.zIndex = '2000';
    popup.style.padding = '1rem 2rem';
    popup.style.minWidth = '220px';

    // 카테고리 목록
    const list = document.createElement('ul');
    list.style.listStyle = 'none';
    list.style.padding = '0';
    list.style.margin = '0';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '0.5rem';

    // "전체" 항목
    const allItem = document.createElement('li');
    allItem.innerHTML = '<button class="category-list-btn" data-category="all">전체 보기</button>';
    list.appendChild(allItem);

    // 실제 카테고리 목록
    shortcutsData.categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<button class="category-list-btn" data-category="${cat.id}">${cat.name}</button>`;
        list.appendChild(li);
    });
    popup.appendChild(list);
    document.body.appendChild(popup);

    // 버튼 클릭 시 해당 카테고리만 필터링
    popup.querySelectorAll('.category-list-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const catId = e.target.dataset.category;
            if (catId === 'all') {
                renderShortcuts(cache.getAllShortcuts());
            } else {
                const filtered = cache.getFilteredShortcuts(catId, 'all');
                renderShortcuts(filtered);
            }
            popup.remove();
        });
    });

    // 팝업 외부 클릭 시 닫기
    setTimeout(() => {
        document.addEventListener('mousedown', function handler(e) {
            if (!popup.contains(e.target)) {
                popup.remove();
                document.removeEventListener('mousedown', handler);
            }
        });
    }, 10);
}

// 네비게이션의 카테고리 메뉴에 이벤트 추가
function setupCategoryNavMenu() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.textContent.includes('카테고리')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                showCategoryList();
            });
        }
    });
}

// 이벤트 리스너 최적화
document.addEventListener('DOMContentLoaded', () => {
    // 초기 렌더링
    populateCategoryFilter();
    renderShortcuts(cache.getAllShortcuts());
    updateStats();

    // 검색 이벤트 (디바운스 적용)
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchShortcuts(e.target.value);
        }, 300);
    });

    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener('click', () => {
        searchShortcuts(searchInput.value);
    });

    // 필터 이벤트 (쓰로틀링 적용)
    let filterTimeout;
    const handleFilterChange = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            const categoryId = categoryFilter.value;
            const difficulty = difficultyFilter.value;
            const filtered = cache.getFilteredShortcuts(categoryId, difficulty);
            renderShortcuts(filtered);
        }, 100);
    };

    categoryFilter.addEventListener('change', handleFilterChange);
    difficultyFilter.addEventListener('change', handleFilterChange);

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

    setupCategoryNavMenu();
}); 