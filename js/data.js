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

// 초기 데이터 로드
storage.loadData(); 