// 단축키 데이터 구조
const shortcutsData = {
    categories: [],
    userStats: {
        totalShortcuts: 0,
        learnedShortcuts: 0,
        favoriteShortcuts: 0,
        lastUpdated: null
    }
};

// LocalStorage 관련 함수들
const storage = {
    saveData: function() {
        localStorage.setItem('shortcutsData', JSON.stringify(shortcutsData));
        this.updateUserStats();
    },

    loadData: function() {
        const savedData = localStorage.getItem('shortcutsData');
        if (savedData) {
            Object.assign(shortcutsData, JSON.parse(savedData));
        } else {
            // 초기 데이터 로드
            fetch('data/shortcuts.json')
                .then(response => response.json())
                .then(data => {
                    shortcutsData.categories = data.categories;
                    this.updateUserStats();
                    this.saveData();
                })
                .catch(error => console.error('Error loading shortcuts data:', error));
        }
    },

    clearData: function() {
        localStorage.removeItem('shortcutsData');
        this.loadData(); // 초기 데이터로 리셋
    },

    updateUserStats: function() {
        const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
        shortcutsData.userStats = {
            totalShortcuts: allShortcuts.length,
            learnedShortcuts: allShortcuts.filter(s => s.learned).length,
            favoriteShortcuts: allShortcuts.filter(s => s.favorite).length,
            lastUpdated: new Date().toISOString()
        };
    },

    // 카테고리별 통계
    getCategoryStats: function() {
        return shortcutsData.categories.map(category => ({
            id: category.id,
            name: category.name,
            total: category.shortcuts.length,
            learned: category.shortcuts.filter(s => s.learned).length,
            favorite: category.shortcuts.filter(s => s.favorite).length
        }));
    },

    // 난이도별 통계
    getDifficultyStats: function() {
        const allShortcuts = shortcutsData.categories.flatMap(category => category.shortcuts);
        const stats = {
            easy: { total: 0, learned: 0 },
            medium: { total: 0, learned: 0 },
            hard: { total: 0, learned: 0 }
        };

        allShortcuts.forEach(shortcut => {
            const difficulty = shortcut.difficulty || 'medium';
            stats[difficulty].total++;
            if (shortcut.learned) {
                stats[difficulty].learned++;
            }
        });

        return stats;
    }
};

// 디버깅 도구
const debug = {
    enabled: false,
    
    log: function(message, data = null) {
        if (!this.enabled) return;
        console.log(`[Debug] ${message}`, data || '');
    },
    
    error: function(message, error = null) {
        if (!this.enabled) return;
        console.error(`[Debug Error] ${message}`, error || '');
    },
    
    warn: function(message, data = null) {
        if (!this.enabled) return;
        console.warn(`[Debug Warning] ${message}`, data || '');
    },
    
    // 학습 관리자 상태 출력
    printLearningManagerState: function() {
        if (!this.enabled) return;
        console.log('=== Learning Manager State ===');
        console.log('Learned Shortcuts:', [...learningManager.learnedShortcuts]);
        console.log('Favorite Shortcuts:', [...learningManager.favoriteShortcuts]);
        console.log('Learning Progress:', learningManager.learningProgress);
        console.log('Last Study Date:', learningManager.lastStudyDate);
        console.log('Study Streak:', learningManager.studyStreak);
        console.log('===========================');
    },
    
    // 로컬 스토리지 상태 출력
    printLocalStorageState: function() {
        if (!this.enabled) return;
        console.log('=== Local Storage State ===');
        console.log('learnedShortcuts:', localStorage.getItem('learnedShortcuts'));
        console.log('favoriteShortcuts:', localStorage.getItem('favoriteShortcuts'));
        console.log('learningProgress:', localStorage.getItem('learningProgress'));
        console.log('lastStudyDate:', localStorage.getItem('lastStudyDate'));
        console.log('studyStreak:', localStorage.getItem('studyStreak'));
        console.log('=========================');
    },
    
    // 데이터 검증
    validateData: function() {
        if (!this.enabled) return;
        
        // 카테고리 검증
        if (!shortcutsData.categories || !Array.isArray(shortcutsData.categories)) {
            this.error('Invalid categories data structure');
            return false;
        }
        
        // 단축키 검증
        for (const category of shortcutsData.categories) {
            if (!category.shortcuts || !Array.isArray(category.shortcuts)) {
                this.error(`Invalid shortcuts array in category: ${category.name}`);
                return false;
            }
            
            for (const shortcut of category.shortcuts) {
                if (!this.validateShortcut(shortcut)) {
                    this.error(`Invalid shortcut in category ${category.name}:`, shortcut);
                    return false;
                }
            }
        }
        
        return true;
    },
    
    // 단축키 데이터 검증
    validateShortcut: function(shortcut) {
        const requiredFields = ['id', 'description', 'keys', 'category', 'difficulty', 'usage'];
        return requiredFields.every(field => shortcut.hasOwnProperty(field));
    },
    
    // 학습 진행도 검증
    validateProgress: function(shortcutId) {
        if (!this.enabled) return;
        
        const progress = learningManager.getProgress(shortcutId);
        if (!progress) {
            this.warn(`No progress data for shortcut: ${shortcutId}`);
            return false;
        }
        
        const requiredFields = ['date', 'attempts', 'lastReview'];
        const isValid = requiredFields.every(field => progress.hasOwnProperty(field));
        
        if (!isValid) {
            this.error(`Invalid progress data for shortcut: ${shortcutId}`, progress);
        }
        
        return isValid;
    }
};

// 학습 관리 시스템
class LearningManager {
    constructor() {
        this.learnedShortcuts = new Set(JSON.parse(localStorage.getItem('learnedShortcuts') || '[]'));
        this.favoriteShortcuts = new Set(JSON.parse(localStorage.getItem('favoriteShortcuts') || '[]'));
        this.learningProgress = JSON.parse(localStorage.getItem('learningProgress') || '{}');
        this.lastStudyDate = localStorage.getItem('lastStudyDate') || null;
        this.studyStreak = parseInt(localStorage.getItem('studyStreak') || '0');
    }

    // 학습 상태 토글
    toggleLearned(shortcutId) {
        debug.log('Toggling learned state for shortcut:', shortcutId);
        const previousState = this.isLearned(shortcutId);
        
        if (this.learnedShortcuts.has(shortcutId)) {
            this.learnedShortcuts.delete(shortcutId);
            delete this.learningProgress[shortcutId];
            debug.log('Removed from learned shortcuts');
        } else {
            this.learnedShortcuts.add(shortcutId);
            this.learningProgress[shortcutId] = {
                date: new Date().toISOString(),
                attempts: 0,
                lastReview: null
            };
            debug.log('Added to learned shortcuts');
        }
        
        this.updateStorage();
        this.updateStudyStreak();
        
        debug.printLearningManagerState();
        return !previousState;
    }

    // 즐겨찾기 토글
    toggleFavorite(shortcutId) {
        debug.log('Toggling favorite state for shortcut:', shortcutId);
        const previousState = this.isFavorite(shortcutId);
        
        if (this.favoriteShortcuts.has(shortcutId)) {
            this.favoriteShortcuts.delete(shortcutId);
            debug.log('Removed from favorites');
        } else {
            this.favoriteShortcuts.add(shortcutId);
            debug.log('Added to favorites');
        }
        
        this.updateStorage();
        debug.printLearningManagerState();
        return !previousState;
    }

    // 학습 진행도 업데이트
    updateProgress(shortcutId, success) {
        debug.log('Updating progress for shortcut:', shortcutId, { success });
        
        if (!this.learningProgress[shortcutId]) {
            this.learningProgress[shortcutId] = {
                date: new Date().toISOString(),
                attempts: 0,
                lastReview: null
            };
            debug.log('Created new progress entry');
        }

        const progress = this.learningProgress[shortcutId];
        progress.attempts++;
        progress.lastReview = new Date().toISOString();
        progress.lastSuccess = success;

        this.updateStorage();
        debug.printLearningManagerState();
    }

    // 학습 스트릭 업데이트
    updateStudyStreak() {
        debug.log('Updating study streak');
        const today = new Date().toDateString();
        const lastDate = this.lastStudyDate ? new Date(this.lastStudyDate).toDateString() : null;
        
        debug.log('Current streak:', this.studyStreak);
        debug.log('Last study date:', lastDate);
        debug.log('Today:', today);

        if (!lastDate || lastDate === today) {
            if (!lastDate) {
                this.studyStreak = 1;
                debug.log('First study day, streak set to 1');
            }
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            if (lastDate === yesterdayString) {
                this.studyStreak++;
                debug.log('Consecutive day, streak increased to:', this.studyStreak);
            } else {
                this.studyStreak = 1;
                debug.log('Streak broken, reset to 1');
            }
        }

        this.lastStudyDate = today;
        this.updateStorage();
        debug.printLearningManagerState();
    }

    // 학습 통계 가져오기
    getStatistics() {
        const totalShortcuts = shortcutsData.categories.reduce((total, category) => 
            total + category.shortcuts.length, 0);

        const learnedByCategory = {};
        const learnedByDifficulty = {
            easy: 0,
            medium: 0,
            hard: 0
        };

        this.learnedShortcuts.forEach(shortcutId => {
            const shortcut = this.findShortcutById(shortcutId);
            if (shortcut) {
                // 카테고리별 통계
                learnedByCategory[shortcut.category] = (learnedByCategory[shortcut.category] || 0) + 1;
                // 난이도별 통계
                learnedByDifficulty[shortcut.difficulty]++;
            }
        });

        return {
            total: totalShortcuts,
            learned: this.learnedShortcuts.size,
            favorites: this.favoriteShortcuts.size,
            streak: this.studyStreak,
            byCategory: learnedByCategory,
            byDifficulty: learnedByDifficulty
        };
    }

    // 단축키 ID로 찾기
    findShortcutById(shortcutId) {
        for (const category of shortcutsData.categories) {
            const shortcut = category.shortcuts.find(s => s.id === shortcutId);
            if (shortcut) return shortcut;
        }
        return null;
    }

    // 로컬 스토리지 업데이트
    updateStorage() {
        localStorage.setItem('learnedShortcuts', JSON.stringify([...this.learnedShortcuts]));
        localStorage.setItem('favoriteShortcuts', JSON.stringify([...this.favoriteShortcuts]));
        localStorage.setItem('learningProgress', JSON.stringify(this.learningProgress));
        localStorage.setItem('lastStudyDate', this.lastStudyDate);
        localStorage.setItem('studyStreak', this.studyStreak.toString());
    }

    // 학습 상태 확인
    isLearned(shortcutId) {
        return this.learnedShortcuts.has(shortcutId);
    }

    // 즐겨찾기 상태 확인
    isFavorite(shortcutId) {
        return this.favoriteShortcuts.has(shortcutId);
    }

    // 학습 진행도 가져오기
    getProgress(shortcutId) {
        return this.learningProgress[shortcutId] || null;
    }
}

// 학습 관리자 인스턴스 생성
const learningManager = new LearningManager();

// 초기 데이터 로드
storage.loadData();

// 초기화 시 디버깅 활성화
debug.enabled = true;
debug.log('Debug mode enabled');
debug.validateData();
debug.printLearningManagerState();
debug.printLocalStorageState(); 