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
let isGameFinished = false; // Флаг завершения игры

// Массивы сообщений с эмодзи
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
const blankSpaceElement = document.createElement('span'); // Будет создан динамически

const letterButtons = document.querySelectorAll('.letter-btn');
const clearButton = document.getElementById('clear-btn');
const checkButton = document.getElementById('check-btn');
const skipButton = document.getElementById('skip-btn');

const finalCorrectElement = document.getElementById('final-correct');
const finalPercentageElement = document.getElementById('final-percentage');
const finalTimeElement = document.getElementById('final-time');
const personalLeaderboardElement = document.getElementById('personal-leaderboard');
const rankMessageElement = document.getElementById('rank-message');
const newGameBtn = document.getElementById('new-game-btn');
const exitBtn = document.getElementById('exit-btn');

// Функция восстановления всех кнопок
function resetAllButtons() {
    // Кнопки букв
    letterButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.transform = '';
    });
    
    // Кнопки управления
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
    
    // Сбрасываем сообщение
    feedbackMessageElement.textContent = '';
    feedbackMessageElement.className = 'feedback-message';
    feedbackMessageElement.style.backgroundColor = '';
}

// Функция очистки старых данных (старше 30 дней)
function cleanOldData() {
    try {
        const playerData = JSON.parse(localStorage.getItem('suffixGame_playerData'));
        if (!playerData || !playerData.allResults) return;
        
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthAgoString = monthAgo.toISOString().split('T')[0];
        
        // Оставляем только результаты не старше месяца
        playerData.allResults = playerData.allResults.filter(result => 
            result.date >= monthAgoString
        );
        
        // Пересчитываем лучшие результаты за каждый день
        const dailyBestResults = {};
        playerData.allResults.forEach(result => {
            const dayKey = `best_${result.date}`;
            const currentBest = dailyBestResults[dayKey];
            
            if (!currentBest || 
                result.percentage > currentBest.percentage ||
                (result.percentage === currentBest.percentage && result.timeSpent < currentBest.timeSpent)) {
                dailyBestResults[dayKey] = result;
            }
        });
        
        playerData.dailyBestResults = dailyBestResults;
        localStorage.setItem('suffixGame_playerData', JSON.stringify(playerData));
    } catch (e) {
        console.log("Ошибка при очистке старых данных:", e);
    }
}

// Функции переключения экранов
function showScreen(screenId) {
    // Скрыть все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Показать нужный экран
    document.getElementById(screenId).classList.add('active');
}

// Функция запуска новой игры
function startNewGame() {
    // Получаем имя игрока
    currentPlayer = playerNameInput.value.trim();
    
    // Проверяем имя
    if (!currentPlayer) {
        if (nameError) {
            nameError.textContent = 'Пожалуйста, введите ваше имя';
        }
        return;
    }
    
    // Сохраняем имя в localStorage
    localStorage.setItem('suffixGame_playerName', currentPlayer);
    
    // Обновляем имя на экране игры
    currentPlayerElement.textContent = `Игрок: ${currentPlayer}`;
    
    // Сбрасываем счетчики и флаги
    currentWordIndex = 0;
    scoreCorrect = 0;
    scoreWrong = 0;
    selectedLetter = '';
    isGameFinished = false;
    
    // Генерируем новый раунд из 30 уникальных слов
    currentRound = generateRandomRound();
    
    // Запускаем таймер
    gameStartTime = Date.now();
    
    // Восстанавливаем все кнопки
    resetAllButtons();
    
    // Обновляем UI
    updateScore();
    updateProgressBar();
    
    // Показываем первое слово
    showCurrentWord();
    
    // Переключаемся на экран игры
    showScreen('game-screen');
}

// Функция генерации случайного раунда (30 уникальных слов)
function generateRandomRound() {
    // Создаем копию базы слов
    const availableWords = [...wordsDatabase];
    const roundWords = [];
    
    // Выбираем 30 случайных слов
    for (let i = 0; i < 30 && availableWords.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availableWords.length);
        roundWords.push(availableWords[randomIndex]);
        availableWords.splice(randomIndex, 1); // Удаляем выбранное слово
    }
    
    return roundWords;
}

// Функция показа текущего слова
function showCurrentWord() {
    // Проверяем, не закончился ли раунд
    if (isGameFinished) {
        return;
    }
    
    // Если слова закончились, показываем последнее слово
    if (currentWordIndex >= currentRound.length) {
        currentWordIndex = currentRound.length - 1; // Остаемся на последнем слове
    }
    
    const currentWordObj = currentRound[currentWordIndex];
    const wordParts = currentWordObj.word.split('..');
    
    // Очищаем область отображения слова
    wordDisplayElement.innerHTML = '';
    
    // Добавляем первую часть слова
    const firstPart = document.createElement('span');
    firstPart.className = 'word-part';
    firstPart.textContent = wordParts[0];
    wordDisplayElement.appendChild(firstPart);
    
    // Добавляем пустое окошко
    blankSpaceElement.className = 'blank-space';
    blankSpaceElement.textContent = selectedLetter;
    wordDisplayElement.appendChild(blankSpaceElement);
    
    // Добавляем остальную часть слова (если есть)
    if (wordParts[1]) {
        const secondPart = document.createElement('span');
        secondPart.className = 'word-part';
        secondPart.textContent = wordParts[1];
        wordDisplayElement.appendChild(secondPart);
    }
    
    // Обновляем счетчик слова
    const wordNumber = currentWordIndex + 1;
    currentWordElement.textContent = `Слово: ${wordNumber}/30`;
    
    // Если это последнее слово (30-е), меняем текст и поведение кнопки
    if (wordNumber === 30) {
        checkButton.innerHTML = '<i class="fas fa-flag-checkered"></i> ЗАВЕРШИТЬ ИГРУ';
        checkButton.disabled = false; // Всегда активна на последнем слове!
    } else {
        checkButton.innerHTML = '<i class="fas fa-check-circle"></i> Проверить';
        checkButton.disabled = !selectedLetter; // Активна только с выбранной буквой
    }
    
    // Сбрасываем выбранную букву
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
    
    // Обычная проверка для слов 1-29
    if (!selectedLetter) {
        return;
    }
    
    const currentWordObj = currentRound[currentWordIndex];
    const isCorrect = selectedLetter === currentWordObj.answer;
    
    // Обновляем счет
    if (isCorrect) {
        scoreCorrect++;
        
        // Анимация правильного ответа
        blankSpaceElement.style.backgroundColor = '#27ae60';
        blankSpaceElement.style.color = 'white';
        
        // Подсветка правильной кнопки
        highlightCorrectButton(currentWordObj.answer, true);
        
        // Случайное позитивное сообщение
        showFeedback(positiveMessages[Math.floor(Math.random() * positiveMessages.length)], 'positive');
    } else {
        scoreWrong++;
        
        // Анимация неправильного ответа
        blankSpaceElement.style.backgroundColor = '#e74c3c';
        blankSpaceElement.style.color = 'white';
        
        // Подсветка правильной кнопки
        highlightCorrectButton(currentWordObj.answer, false);
        
        // Случайное негативное сообщение
        showFeedback(negativeMessages[Math.floor(Math.random() * negativeMessages.length)], 'negative');
    }
    
    updateScore();
}

// Функция подсветки правильной кнопки
function highlightCorrectButton(correctLetter, isUserCorrect) {
    // Находим кнопку с правильной буквой
    const correctButton = Array.from(letterButtons).find(btn => 
        btn.dataset.letter === correctLetter
    );
    
    if (correctButton) {
        // Если пользователь ошибся - показываем правильный ответ
        if (!isUserCorrect) {
            correctButton.style.backgroundColor = '#27ae60';
            correctButton.style.color = 'white';
            correctButton.style.transform = 'scale(1.1)';
            
            // Возвращаем нормальный вид через 1 секунду
            setTimeout(() => {
                correctButton.style.backgroundColor = '';
                correctButton.style.color = '';
                correctButton.style.transform = '';
            }, 1000);
        } else {
            // Если пользователь угадал - просто анимируем нажатую кнопку
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

// Функция показа сообщения с обратной связью (только для слов 1-29)
function showFeedback(message, type) {
    feedbackMessageElement.textContent = message;
    feedbackMessageElement.className = 'feedback-message show';
    
    // Устанавливаем цвет в зависимости от типа
    if (type === 'positive') {
        feedbackMessageElement.style.color = '#27ae60';
        feedbackMessageElement.style.backgroundColor = 'rgba(39, 174, 96, 0.1)';
    } else {
        feedbackMessageElement.style.color = '#e74c3c';
        feedbackMessageElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    }
    
    // Увеличиваем индекс текущего слова (только если не 30-е)
    if (currentWordIndex < 29) {
        currentWordIndex++;
        
        // Обновляем прогресс-бар
        updateProgressBar();
        
        // Через 1.5 секунды показываем следующее слово
        setTimeout(() => {
            feedbackMessageElement.classList.remove('show');
            
            // Сбрасываем стили окошка
            setTimeout(() => {
                blankSpaceElement.style.backgroundColor = '';
                blankSpaceElement.style.color = '';
                showCurrentWord();
            }, 300);
        }, 1500);
    }
    // Для 30-го слова ничего не делаем - ждем нажатия "ЗАВЕРШИТЬ ИГРУ"
}

// Функция завершения игры (вызывается с 30-го слова)
function finishGame() {
    isGameFinished = true;
    
    // Показываем финальное сообщение
    feedbackMessageElement.textContent = "Игра завершена! Переходим к результатам... 🏁";
    feedbackMessageElement.className = 'feedback-message show';
    feedbackMessageElement.style.color = '#3498db';
    feedbackMessageElement.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
    
    // Блокируем все кнопки
    checkButton.disabled = true;
    skipButton.disabled = true;
    clearButton.disabled = true;
    letterButtons.forEach(btn => btn.disabled = true);
    
    // Через 1.5 секунды переходим к результатам
    setTimeout(() => {
        feedbackMessageElement.classList.remove('show');
        endGame();
    }, 1500);
}

// Функция пропуска слова (пропуск = ошибка)
function skipWord() {
    if (isGameFinished) return;
    
    const wordNumber = currentWordIndex + 1;
    
    // Если это 30-е слово, не пропускаем, а предлагаем завершить
    if (wordNumber === 30) {
        return;
    }
    
    scoreWrong++; // Пропуск приравнивается к ошибке
    updateScore();
    
    // Показываем сообщение о пропуске
    feedbackMessageElement.textContent = "Пропущено ⏭️";
    feedbackMessageElement.className = 'feedback-message show';
    feedbackMessageElement.style.color = '#e74c3c';
    feedbackMessageElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    
    // Увеличиваем индекс текущего слова
    currentWordIndex++;
    
    // Обновляем прогресс-бар
    updateProgressBar();
    
    // Скрываем сообщение и переходим дальше через 1.5 секунды
    setTimeout(() => {
        feedbackMessageElement.classList.remove('show');
        showCurrentWord();
    }, 1500);
}

// Функция завершения игры
function endGame() {
    gameEndTime = Date.now();
    
    // Рассчитываем время в секундах
    const timeSpentSeconds = Math.floor((gameEndTime - gameStartTime) / 1000);
    const minutes = Math.floor(timeSpentSeconds / 60);
    const seconds = timeSpentSeconds % 60;
    
    // Рассчитываем процент
    const percentage = Math.round((scoreCorrect / 30) * 100);
    
    // Обновляем статистику на экране результатов
    finalCorrectElement.textContent = `${scoreCorrect}/30`;
    finalPercentageElement.textContent = `${percentage}%`;
    finalTimeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Сохраняем результат
    saveGameResult(timeSpentSeconds, percentage);
    
    // Показываем турнирную таблицу
    showPersonalLeaderboard();
    
    // Переключаемся на экран результатов
    showScreen('results-screen');
}

// Функция сохранения результата игры (хранит все результаты + лучшие за день)
function saveGameResult(timeSpent, percentage) {
    // Получаем текущую дату
    const today = new Date().toISOString().split('T')[0];
    
    // Получаем существующие результаты
    let playerData;
    try {
        playerData = JSON.parse(localStorage.getItem('suffixGame_playerData'));
    } catch (e) {
        playerData = null;
    }
    
    // Если данных нет или структура неправильная — создаем заново
    if (!playerData || typeof playerData !== 'object') {
        playerData = {
            playerName: currentPlayer,
            allResults: [], // ВСЕ результаты
            dailyBestResults: {} // Лучшие за каждый день
        };
    }
    
    // Гарантируем, что массивы и объекты существуют
    if (!Array.isArray(playerData.allResults)) {
        playerData.allResults = [];
    }
    
    if (!playerData.dailyBestResults || typeof playerData.dailyBestResults !== 'object') {
        playerData.dailyBestResults = {};
    }
    
    // Обновляем имя игрока
    playerData.playerName = currentPlayer;
    
    // Создаем объект результата
    const result = {
        date: today,
        playerName: currentPlayer,
        score: scoreCorrect,
        total: 30,
        percentage: percentage,
        timeSpent: timeSpent,
        timestamp: Date.now()
    };
    
    // 1. Добавляем в общий список ВСЕХ результатов
    playerData.allResults.push(result);
    
    // 2. Обновляем лучший результат за сегодня (если нужно)
    const todayKey = `best_${today}`;
    const currentBest = playerData.dailyBestResults[todayKey];
    
    const shouldUpdateBest = !currentBest || 
        percentage > currentBest.percentage ||
        (percentage === currentBest.percentage && timeSpent < currentBest.timeSpent);
    
    if (shouldUpdateBest) {
        playerData.dailyBestResults[todayKey] = result;
    }
    
    // Сохраняем
    localStorage.setItem('suffixGame_playerData', JSON.stringify(playerData));
}

// Функция показа личной турнирной таблицы (лучшие результаты за каждый день)
function showPersonalLeaderboard() {
    // Получаем текущую дату
    const today = new Date().toISOString().split('T')[0];
    
    // Получаем данные игрока
    let playerData;
    try {
        playerData = JSON.parse(localStorage.getItem('suffixGame_playerData')) || { 
            dailyBestResults: {},
            allResults: []
        };
    } catch (e) {
        playerData = { dailyBestResults: {}, allResults: [] };
    }
    
    // Получаем ВСЕ лучшие результаты за каждый день
    const bestResults = Object.values(playerData.dailyBestResults || {});
    
    // Сортируем по проценту (убывание), затем по времени (возрастание)
    bestResults.sort((a, b) => {
        if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
        }
        return a.timeSpent - b.timeSpent;
    });
    
    // Берем топ-5 лучших результатов за ВСЕ дни
    const topResults = bestResults.slice(0, 5);
    
    // Очищаем таблицу
    personalLeaderboardElement.innerHTML = '';
    
    // Заполняем таблицу
    if (topResults.length === 0) {
        const emptyRow = document.createElement('div');
        emptyRow.className = 'leaderboard-row';
        emptyRow.innerHTML = '<div style="text-align: center; width: 100%;">Пока нет сохраненных результатов</div>';
        personalLeaderboardElement.appendChild(emptyRow);
        rankMessageElement.textContent = "Это ваш первый результат!";
        return;
    }
    
    topResults.forEach((result, index) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        // Подсвечиваем текущий результат, если он сегодняшний
        const todayKey = `best_${today}`;
        const todayBestResult = playerData.dailyBestResults[todayKey];
        
        if (todayBestResult && result.timestamp === todayBestResult.timestamp) {
            row.classList.add('current-player');
        }
        
        // Форматируем время
        const minutes = Math.floor(result.timeSpent / 60);
        const seconds = result.timeSpent % 60;
        const timeFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Форматируем дату
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
    
    // Определяем место текущего результата (сегодняшнего)
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

// Функция очистки выбора
function clearSelection() {
    if (isGameFinished) return;
    
    selectedLetter = '';
    blankSpaceElement.textContent = '';
    
    // Если не 30-е слово, блокируем кнопку "Проверить"
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
    
    // Активируем кнопку "Проверить"
    checkButton.disabled = false;
}

// Инициализация при загрузке страницы
function initGame() {
    // Очищаем старые данные
    cleanOldData();
    
    // Загружаем сохраненное имя, если есть
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
        // Сбрасываем все флаги и счетчики
        currentWordIndex = 0;
        scoreCorrect = 0;
        scoreWrong = 0;
        selectedLetter = '';
        isGameFinished = false;
        
        // Генерируем новый раунд
        currentRound = generateRandomRound();
        
        // Восстанавливаем все кнопки
        resetAllButtons();
        
        // Обновляем UI
        updateScore();
        updateProgressBar();
        
        // Запускаем таймер
        gameStartTime = Date.now();
        
        // Показываем первое слово
        showCurrentWord();
        
        // Переходим на экран игры
        showScreen('game-screen');
    });
    
    exitBtn.addEventListener('click', () => {
        // Возвращаемся на экран приветствия
        showScreen('welcome-screen');
    });
    
    // Также разрешаем нажатие Enter в поле имени
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startNewGame();
        }
    });
}

// Запускаем игру когда страница загрузится
document.addEventListener('DOMContentLoaded', initGame);