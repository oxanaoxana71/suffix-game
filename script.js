// script.js

// Глобальные переменные игры
let currentPlayer = '';
let currentRound = [];
let currentWordIndex = 0;
let scoreCorrect = 0;
let scoreWrong = 0;
let selectedLetter = '';
let gameStartTime = 0;
let gameEndTime = 0;
let isGameFinished = false;
let mistakesLog = [];

// Массивы сообщений
const positiveMessages = [
    "Ты лучший! 🌟", 
    "Ого! Молодец 🎉", 
    "Неплохо! 👍", 
    "Да ты все знаешь! 🧠"
];

const negativeMessages = [
    "Подумай! 🤔", 
    "Упс! Учить надо! 📚", 
    "А если подумать? 💭"
];

// DOM элементы
const welcomeScreen = document.getElementById('welcome-screen');
const gameScreen = document.getElementById('game-screen');
const resultsScreen = document.getElementById('results-screen');
const mistakesScreen = document.getElementById('mistakes-screen');

const playerNameInput = document.getElementById('player-name');
const nameError = document.getElementById('name-error');
const startGameBtn = document.getElementById('start-game-btn');

const currentPlayerElement = document.getElementById('current-player');
const currentWordElement = document.getElementById('current-word');
const correctCountElement = document.querySelector('.correct-count');
const wrongCountElement = document.querySelector('.wrong-count');
const progressFillElement = document.getElementById('progress-fill');

const wordDisplayElement = document.getElementById('word-display');
const feedbackMessageElement = document.getElementById('feedback-message');
const blankSpaceElement = document.createElement('span');

const letterButtons = document.querySelectorAll('.letter-btn');
const clearButton = document.getElementById('clear-btn');
const checkButton = document.getElementById('check-btn');
const skipButton = document.getElementById('skip-btn');

const finalCorrectElement = document.getElementById('final-correct');
const finalPercentageElement = document.getElementById('final-percentage');
const finalTimeElement = document.getElementById('final-time');
const finalMistakesElement = document.getElementById('final-mistakes');
const finalSkipsElement = document.getElementById('final-skips');
const personalLeaderboardElement = document.getElementById('personal-leaderboard');
const rankMessageElement = document.getElementById('rank-message');
const newGameBtn = document.getElementById('new-game-btn');
const exitBtn = document.getElementById('exit-btn');

const mistakesCountElement = document.getElementById('mistakes-count');
const skipsCountElement = document.getElementById('skips-count');
const mistakesListElement = document.getElementById('mistakes-list');
const toLeaderboardBtn = document.getElementById('to-leaderboard-btn');

// Функция восстановления всех кнопок
function resetAllButtons() {
    letterButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.transform = '';
    });
    
    checkButton.disabled = true;
    checkButton.innerHTML = '<i class="fas fa-check-circle"></i> Проверить';
    checkButton.style.backgroundColor = '#27ae60';
    checkButton.style.color = 'white';
    
    skipButton.disabled = false;
    skipButton.style.backgroundColor = '#e74c3c';
    skipButton.style.color = 'white';
    
    clearButton.disabled = false;
    clearButton.style.backgroundColor = '#f8f9fa';
    clearButton.style.color = '#2c3e50';
    
    feedbackMessageElement.textContent = '';
    feedbackMessageElement.className = 'feedback-message';
    feedbackMessageElement.style.backgroundColor = '';
}

// Функция переключения экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.getElementById(screenId).classList.add('active');
}

// Функция показа экрана разбора ошибок
 function showMistakesScreen() {
    console.log("=== ПОКАЗ ЭКРАНА ОШИБОК ===");
    
    // Подсчитываем ошибки и пропуски
    let mistakeCount = 0;
    let skipCount = 0;
    
    mistakesLog.forEach((item) => {
        if (item.type === 'mistake') {
            mistakeCount++;
        } else if (item.type === 'skip') {
            skipCount++;
        }
    });
    
    // Обновляем счетчики
    if (mistakesCountElement) mistakesCountElement.textContent = mistakeCount;
    if (skipsCountElement) skipsCountElement.textContent = skipCount;
    
    // Очищаем и заполняем список ошибок
    if (mistakesListElement) {
        mistakesListElement.innerHTML = '';
        
        // Если нет ошибок - показываем сообщение
        if (mistakesLog.length === 0 || (mistakeCount === 0 && skipCount === 0)) {
            mistakesListElement.innerHTML = `
                <div style="padding: 40px; text-align: center; color: green; font-size: 18px;">
                    🎉 Отлично! Нет ошибок и пропусков!
                </div>
            `;
        } else {
            mistakesLog.forEach((item, index) => {
                if (item.type === 'mistake' || item.type === 'skip') {
                    const mistakeItem = document.createElement('div');
                    mistakeItem.className = `mistake-item ${item.type}`;
                    
                    // ЭТА СТРОКА БЫЛА НЕПРАВИЛЬНОЙ - ИСПРАВЛЕНО:
                    const displayWord = item.word.replace('..', `<span class="highlight" style="font-weight: 900;">${item.correctAnswer.toUpperCase()}</span>`);
                    
                    // Текст с правильным ответом
                    let answerText = '';
                    if (item.type === 'mistake') {
                        answerText = `Правильно: <span class="correct-answer">${item.correctAnswer}</span>`;
                    } else if (item.type === 'skip') {
                        answerText = `Пропущено. Правильно: <span class="correct-answer">${item.correctAnswer}</span>`;
                    }
                    
                    // HTML без подсказки (hint)
                    mistakeItem.innerHTML = `
                        <div class="mistake-number">${item.wordNumber}</div>
                        <div class="mistake-word">${displayWord}</div>
                        <div class="mistake-answer">${answerText}</div>
                    `;
                    
                    mistakesListElement.appendChild(mistakeItem);
                }
            });
        }
    }
    
    // Показываем экран ошибок
    showScreen('mistakes-screen');
}

// Функция генерации случайного раунда
function generateRandomRound() {
    const availableWords = [...wordsDatabase];
    const roundWords = [];
    
    for (let i = 0; i < 30 && availableWords.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        roundWords.push(availableWords[randomIndex]);
        availableWords.splice(randomIndex, 1);
    }
    
    return roundWords;
}

// Функция показа текущего слова
function showCurrentWord() {
    if (isGameFinished) return;
    
    if (currentWordIndex >= currentRound.length) {
        currentWordIndex = currentRound.length - 1;
    }
    
    const currentWordObj = currentRound[currentWordIndex];
    const wordParts = currentWordObj.word.split('..');
    
    wordDisplayElement.innerHTML = '';
    
    const firstPart = document.createElement('span');
    firstPart.className = 'word-part';
    firstPart.textContent = wordParts[0];
    wordDisplayElement.appendChild(firstPart);
    
    blankSpaceElement.className = 'blank-space';
    blankSpaceElement.textContent = selectedLetter;
    wordDisplayElement.appendChild(blankSpaceElement);
    
    if (wordParts[1]) {
        const secondPart = document.createElement('span');
        secondPart.className = 'word-part';
        secondPart.textContent = wordParts[1];
        wordDisplayElement.appendChild(secondPart);
    }
    
    const wordNumber = currentWordIndex + 1;
    currentWordElement.textContent = `Слово: ${wordNumber}/30`;
    
    // На 30-м слове меняем текст кнопки
    if (wordNumber === 30) {
        checkButton.innerHTML = '<i class="fas fa-flag-checkered"></i> ЗАВЕРШИТЬ ИГРУ';
        checkButton.disabled = false;
    } else {
        checkButton.innerHTML = '<i class="fas fa-check-circle"></i> Проверить';
        checkButton.disabled = !selectedLetter;
    }
    
    selectedLetter = '';
    blankSpaceElement.textContent = '';
}

// Функция обновления счета
function updateScore() {
    correctCountElement.textContent = scoreCorrect;
    wrongCountElement.textContent = scoreWrong;
}

// Функция обновления прогресс-бара
function updateProgressBar() {
    const progress = ((currentWordIndex + 1) / 30) * 100;
    progressFillElement.style.width = `${progress}%`;
}

// Функция проверки ответа
function checkAnswer() {
    const wordNumber = currentWordIndex + 1;
    
    // Если это 30-е слово и нажата кнопка "ЗАВЕРШИТЬ ИГРУ"
    if (wordNumber === 30 && checkButton.textContent.includes('ЗАВЕРШИТЬ')) {
        finishGame();
        return;
    }
    
    if (!selectedLetter) return;
    
    const currentWordObj = currentRound[currentWordIndex];
    const isCorrect = selectedLetter === currentWordObj.answer;
    
    // Логируем результат (включая 30-е слово!)
    mistakesLog.push({
        word: currentWordObj.word,
        userAnswer: selectedLetter,
        correctAnswer: currentWordObj.answer,
        type: isCorrect ? 'correct' : 'mistake',
        hint: currentWordObj.hint,
        wordNumber: wordNumber
    });
    
    if (isCorrect) {
        scoreCorrect++;
        blankSpaceElement.style.backgroundColor = '#27ae60';
        blankSpaceElement.style.color = 'white';
        highlightCorrectButton(currentWordObj.answer, true);
        showFeedback(positiveMessages[Math.floor(Math.random() * positiveMessages.length)], 'positive');
    } else {
        scoreWrong++;
        blankSpaceElement.style.backgroundColor = '#e74c3c';
        blankSpaceElement.style.color = 'white';
        highlightCorrectButton(currentWordObj.answer, false);
        showFeedback(negativeMessages[Math.floor(Math.random() * negativeMessages.length)], 'negative');
    }
    
    updateScore();
}

// Функция подсветки правильной кнопки
function highlightCorrectButton(correctLetter, isUserCorrect) {
    const correctButton = Array.from(letterButtons).find(btn => 
        btn.dataset.letter === correctLetter
    );
    
    if (correctButton) {
        if (!isUserCorrect) {
            correctButton.style.backgroundColor = '#27ae60';
            correctButton.style.color = 'white';
            correctButton.style.transform = 'scale(1.1)';
            
            setTimeout(() => {
                correctButton.style.backgroundColor = '';
                correctButton.style.color = '';
                correctButton.style.transform = '';
            }, 1000);
        } else {
            const userButton = Array.from(letterButtons).find(btn => 
                btn.dataset.letter === selectedLetter
            );
            if (userButton) {
                userButton.style.backgroundColor = '#27ae60';
                userButton.style.color = 'white';
                userButton.style.transform = 'scale(1.1)';
                
                setTimeout(() => {
                    userButton.style.backgroundColor = '';
                    userButton.style.color = '';
                    userButton.style.transform = '';
                }, 1000);
            }
        }
    }
}

// Функция показа сообщения с обратной связью
 function showFeedback(message, type) {
    feedbackMessageElement.textContent = message;
    feedbackMessageElement.className = 'feedback-message show';
    
    if (type === 'positive') {
        feedbackMessageElement.style.color = '#27ae60';
        feedbackMessageElement.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
    } else {
        feedbackMessageElement.style.color = '#e74c3c';
        feedbackMessageElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    }
    
    const wordNumber = currentWordIndex + 1;
    
    // Для слов 1-29
    if (wordNumber < 30) {
        currentWordIndex++;
        updateProgressBar();
        
        setTimeout(() => {
            feedbackMessageElement.classList.remove('show');
            setTimeout(() => {
                blankSpaceElement.style.backgroundColor = '';
                blankSpaceElement.style.color = '';
                showCurrentWord();
            }, 300);
        }, 1500);
    } 
    // Для 30-го слова
    else if (wordNumber === 30) {
        setTimeout(() => {
            feedbackMessageElement.classList.remove('show');
            blankSpaceElement.style.backgroundColor = '';
            blankSpaceElement.style.color = '';
            
            // Активируем кнопку "ЗАВЕРШИТЬ ИГРУ"
            checkButton.disabled = false;
            checkButton.innerHTML = '<i class="fas fa-flag-checkered"></i> ЗАВЕРШИТЬ ИГРУ';
            checkButton.style.backgroundColor = '#3498db';
            
            // Блокируем ВСЕ кнопки, кроме "ЗАВЕРШИТЬ ИГРУ"
            letterButtons.forEach(btn => btn.disabled = true);
            skipButton.disabled = true; // ← ВАЖНО: блокируем кнопку пропуска
            clearButton.disabled = true; // ← И кнопку очистки тоже
        }, 1500);
    }
}

// Функция завершения игры
function finishGame() {
     console.log("=== ЗАВЕРШЕНИЕ ИГРЫ ===");
    console.log("Текущее слово №:", currentWordIndex + 1);
    console.log("Выбранная буква:", selectedLetter);
    
    isGameFinished = true;
    gameEndTime = Date.now();
    showMistakesScreen();

}

// Функция пропуска слова
function skipWord() {
    if (isGameFinished) return;
    
    const wordNumber = currentWordIndex + 1;
    
    // Если это 30-е слово - НЕ разрешаем пропускать
    if (wordNumber === 30) {
        return; // Просто выходим, ничего не делаем
    }
    
    // Остальной код для слов 1-29...
    const currentWordObj = currentRound[currentWordIndex];
    mistakesLog.push({
        word: currentWordObj.word,
        userAnswer: null,
        correctAnswer: currentWordObj.answer,
        type: 'skip',
        hint: currentWordObj.hint,
        wordNumber: wordNumber
    });
    
    scoreWrong++;
    updateScore();
    
    feedbackMessageElement.textContent = "Пропущено ⏭️";
    feedbackMessageElement.className = 'feedback-message show';
    feedbackMessageElement.style.color = '#e74c3c';
    feedbackMessageElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    
    currentWordIndex++;
    updateProgressBar();
    
    setTimeout(() => {
        feedbackMessageElement.classList.remove('show');
        showCurrentWord();
    }, 1500);
}

// Функция завершения игры и перехода к результатам
function endGame() {
    gameEndTime = Date.now();
    
    // Сразу показываем экран ошибок
    showMistakesScreen();
}

// Функция сохранения результата игры
function saveGameResult(timeSpent, percentage, mistakes = 0, skips = 0) {
    const today = new Date().toISOString().split('T')[0];
    
    let playerData;
    try {
        playerData = JSON.parse(localStorage.getItem('suffixGame_playerData'));
    } catch (e) {
        playerData = null;
    }
    
    if (!playerData || typeof playerData !== 'object') {
        playerData = {
            playerName: currentPlayer,
            allResults: [],
            dailyBestResults: {}
        };
    }
    
    if (!Array.isArray(playerData.allResults)) {
        playerData.allResults = [];
    }
    
    if (!playerData.dailyBestResults || typeof playerData.dailyBestResults !== 'object') {
        playerData.dailyBestResults = {};
    }
    
    playerData.playerName = currentPlayer;
    
    const result = {
        date: today,
        playerName: currentPlayer,
        score: scoreCorrect,
        total: 30,
        percentage: percentage,
        timeSpent: timeSpent,
        mistakes: mistakes,
        skips: skips,
        timestamp: Date.now()
    };
    
    playerData.allResults.push(result);
    
    const todayKey = `best_${today}`;
    const currentBest = playerData.dailyBestResults[todayKey];
    
    const shouldUpdateBest = !currentBest || 
        percentage > currentBest.percentage ||
        (percentage === currentBest.percentage && timeSpent < currentBest.timeSpent);
    
    if (shouldUpdateBest) {
        playerData.dailyBestResults[todayKey] = result;
    }
    
    localStorage.setItem('suffixGame_playerData', JSON.stringify(playerData));
}

// Функция показа турнирной таблицы
function showPersonalLeaderboard() {
    // Подсчитываем ошибки и пропуски
    let mistakeCount = 0;
    let skipCount = 0;
    
    mistakesLog.forEach(item => {
        if (item.type === 'mistake') mistakeCount++;
        if (item.type === 'skip') skipCount++;
    });
    
    // Обновляем отображение ошибок в результатах
    if (finalMistakesElement) finalMistakesElement.textContent = mistakeCount;
    if (finalSkipsElement) finalSkipsElement.textContent = skipCount;
    
    // Рассчитываем время и процент
    const timeSpentSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    const percentage = Math.round((scoreCorrect / 30) * 100);
    
    // Обновляем основную статистику
    finalCorrectElement.textContent = `${scoreCorrect}/30`;
    finalPercentageElement.textContent = `${percentage}%`;
    finalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Сохраняем результат
    saveGameResult(timeSpentSeconds, percentage, mistakeCount, skipCount);
    
    // Показываем лучшие результаты
    const today = new Date().toISOString().split('T')[0];
    
    let playerData;
    try {
        playerData = JSON.parse(localStorage.getItem('suffixGame_playerData')) || { 
            dailyBestResults: {},
            allResults: []
        };
    } catch (e) {
        playerData = { dailyBestResults: {}, allResults: [] };
    }
    
    const bestResults = Object.values(playerData.dailyBestResults || {});
    
    bestResults.sort((a, b) => {
        if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
        }
        return a.timeSpent - b.timeSpent;
    });
    
    const topResults = bestResults.slice(0, 5);
    
    personalLeaderboardElement.innerHTML = '';
    
    if (topResults.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'leaderboard-row';
        emptyRow.innerHTML = '<div style="text-align: center; width: 100%;">Пока нет сохраненных результатов</div>';
        personalLeaderboardElement.appendChild(emptyRow);
        rankMessageElement.textContent = "Это ваш первый результат!";
    } else {
        topResults.forEach((result, index) => {
            const row = document.createElement('div');
            row.className = 'leaderboard-row';
            
            const todayKey = `best_${today}`;
            const todayBestResult = playerData.dailyBestResults[todayKey];
            
            if (todayBestResult && result.timestamp === todayBestResult.timestamp) {
                row.classList.add('current-player');
            }
            
            const minutes = Math.floor(result.timeSpent / 60);
            const seconds = result.timeSpent % 60;
            const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            const dateObj = new Date(result.date);
            const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}`;
            
            row.innerHTML = `
                <div class="leaderboard-rank">${index + 1}</div>
                <div class="leaderboard-name">${result.playerName}</div>
                <div class="leaderboard-date">${formattedDate}</div>
                <div class="leaderboard-score">${result.percentage}% (${timeFormatted})</div>
            `;
            
            personalLeaderboardElement.appendChild(row);
        });
        
        const todayKey = `best_${today}`;
        const todayBestResult = playerData.dailyBestResults[todayKey];
        
        if (todayBestResult) {
            const currentIndex = bestResults.findIndex(result => 
                result.timestamp === todayBestResult.timestamp
            );
            
            if (currentIndex >= 0) {
                const place = currentIndex + 1;
                const total = bestResults.length;
                
                let message = '';
                if (place === 1) {
                    message = `🥇 Ваш лучший результат сегодня - 1 место из ${total}!`;
                } else if (place === 2) {
                    message = `🥈 Ваш лучший результат сегодня - 2 место из ${total}!`;
                } else if (place === 3) {
                    message = `🥉 Ваш лучший результат сегодня - 3 место из ${total}!`;
                } else {
                    message = `🎯 Ваш лучший результат сегодня - ${place} место из ${total}!`;
                }
                
                rankMessageElement.textContent = message;
            } else {
                rankMessageElement.textContent = "Ваш результат добавлен в таблицу!";
            }
        } else {
            rankMessageElement.textContent = "Сыграйте сегодня, чтобы попасть в таблицу!";
        }
    }
    
    // Показываем экран результатов
    showScreen('results-screen');
}

// Функция очистки выбора
function clearSelection() {
    if (isGameFinished) return;
    
    selectedLetter = '';
    blankSpaceElement.textContent = '';
    
    const wordNumber = currentWordIndex + 1;
    if (wordNumber !== 30) {
        checkButton.disabled = true;
    }
}

// Функция выбора буквы
function selectLetter(letter) {
    if (isGameFinished) return;
    
    selectedLetter = letter;
    blankSpaceElement.textContent = letter;
    
    checkButton.disabled = false;
}
function startNewGame() {
    currentPlayer = playerNameInput.value.trim();
    
    if (!currentPlayer) {
        if (nameError) {
            nameError.textContent = 'Пожалуйста, введите ваше имя';
        }
        return;
    }
    
    localStorage.setItem('suffixGame_playerName', currentPlayer);
    currentPlayerElement.textContent = `Игрок: ${currentPlayer}`;
    
    currentWordIndex = 0;
    scoreCorrect = 0;
    scoreWrong = 0;
    selectedLetter = '';
    isGameFinished = false;
    mistakesLog = [];
    
    currentRound = generateRandomRound();
    gameStartTime = Date.now();
    
    resetAllButtons();
    updateScore();
    updateProgressBar();
    showCurrentWord();
    
    showScreen('game-screen');
}
// Инициализация игры
function initGame() {
    // Загружаем сохраненное имя
    const savedName = localStorage.getItem('suffixGame_playerName');
    if (savedName) {
        playerNameInput.value = savedName;
    }
    
    // Обработчики для экрана приветствия
    startGameBtn.addEventListener('click', startNewGame);
    
    playerNameInput.addEventListener('input', () => {
        if (nameError) {
            nameError.textContent = '';
        }
    });
    
    // Обработчики для клавиш букв
    letterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const letter = button.dataset.letter;
            selectLetter(letter);
        });
    });
    
    // Обработчики для кнопок управления
    clearButton.addEventListener('click', clearSelection);
    
    checkButton.addEventListener('click', () => {
        checkAnswer();
    });
    
    skipButton.addEventListener('click', skipWord);
    
    // Обработчики для экрана результатов
    newGameBtn.addEventListener('click', () => {
        currentWordIndex = 0;
        scoreCorrect = 0;
        scoreWrong = 0;
        selectedLetter = '';
        isGameFinished = false;
        mistakesLog = [];
        
        currentRound = generateRandomRound();
        resetAllButtons();
        updateScore();
        updateProgressBar();
        gameStartTime = Date.now();
        showCurrentWord();
        showScreen('game-screen');
    });
    
    exitBtn.addEventListener('click', () => {
        showScreen('welcome-screen');
    });
    
    // Enter в поле имени
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startNewGame();
        }
    });
    
    // Кнопка перехода к турнирной таблице
    if (toLeaderboardBtn) {
        toLeaderboardBtn.addEventListener('click', () => {
            showPersonalLeaderboard();
        });
    }
}

// Запускаем игру
document.addEventListener('DOMContentLoaded', initGame);