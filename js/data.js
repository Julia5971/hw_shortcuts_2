// 단축키 데이터 구조
const shortcutsData = {
    categories: [
        {
            id: 'windows',
            name: 'Windows',
            shortcuts: [
                {
                    id: 'win-d',
                    keys: ['Win', 'D'],
                    description: '바탕화면 표시/숨기기',
                    category: 'windows',
                    learned: false,
                    favorite: false
                },
                {
                    id: 'win-e',
                    keys: ['Win', 'E'],
                    description: '파일 탐색기 열기',
                    category: 'windows',
                    learned: false,
                    favorite: false
                }
            ]
        },
        {
            id: 'vscode',
            name: 'VS Code',
            shortcuts: [
                {
                    id: 'vscode-format',
                    keys: ['Shift', 'Alt', 'F'],
                    description: '코드 포맷팅',
                    category: 'vscode',
                    learned: false,
                    favorite: false
                },
                {
                    id: 'vscode-search',
                    keys: ['Ctrl', 'F'],
                    description: '파일 내 검색',
                    category: 'vscode',
                    learned: false,
                    favorite: false
                }
            ]
        }
    ]
};

// LocalStorage 관련 함수들
const storage = {
    saveData: function() {
        localStorage.setItem('shortcutsData', JSON.stringify(shortcutsData));
    },

    loadData: function() {
        const savedData = localStorage.getItem('shortcutsData');
        if (savedData) {
            Object.assign(shortcutsData, JSON.parse(savedData));
        }
    },

    clearData: function() {
        localStorage.removeItem('shortcutsData');
    }
};

// 초기 데이터 로드
storage.loadData(); 