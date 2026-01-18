/**
 * Константы
 */
const DIFFICULTY_SETTINGS = {
  difficulty_easy: { pairs: 6, attempts: 24, time: 120 },
  difficulty_medium: { pairs: 8, attempts: 28, time: 180 },
  difficulty_hard: { pairs: 12, attempts: 36, time: 180 },
};

const GAME_MODES = {
  gamemode_free: "gamemode_free",
  gamemode_attempts: "gamemode_attempts",
  gamemode_time: "gamemode_time"
}

const MODE_DISPLAY_NAMES = {
  gamemode_free: 'Простой',
  gamemode_attempts: 'На попытки',
  gamemode_time: 'На время'
};

const DIFFICULTY_DISPLAY_NAMES = {
  difficulty_easy: 'Лёгкий',
  difficulty_medium: 'Средний',
  difficulty_hard: 'Сложный'
};

const ICONS_ARRAY = [
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
];

const GAME_STATE = {
  mode: null,
  difficulty: null,
  cards: [],
  flippedCards: [],
  matchedPairs: 0,
  attempts: 0,
  attemptsLeft: 0,
  timeLeft: 0,
  timerId: null,
  gameStarted: false,
  gameOver: false,
  firstClick: false,
  totalPairs: 0,
  maxAttempts: 0,
  startTime: 0,
};

function game() {
  loadBestScores();
  setupEventListeners();
  updateBestResultsDisplay();
}

function setupEventListeners(){
  const startButton = document.querySelector('.start__button');
  if (startButton) {
    startButton.addEventListener('click', startGame);
  }

  const gamemodeSelect = document.getElementById('gamemode');
  const difficultySelect = document.getElementById('difficulty');

  if (gamemodeSelect) {
    gamemodeSelect.addEventListener('change', updateStartButtonState);
  }

  if (difficultySelect) {
    difficultySelect.addEventListener('change', updateStartButtonState);
  }

  const restartButton = document.querySelector('.ingame__buttons-restart');
  const changeModeButton = document.querySelector('.ingame__buttons-change-mode');

  if (restartButton) {
    restartButton.addEventListener('click', resetGame);
  }

  if (changeModeButton) {
    changeModeButton.addEventListener('click', returnToSettings);
  }

  const playAgainButton = document.querySelector('.restart__game');
  const openMenuButton = document.querySelector('.open__menu');

  if (playAgainButton) {
    playAgainButton.addEventListener('click', () => {
      hideResultSection();
      resetGame();
    });
  }

  if (openMenuButton) {
    openMenuButton.addEventListener('click', returnToSettings);
  }
}

function updateStartButtonState() {
  const gamemodeSelect = document.getElementById('gamemode');
  const difficultySelect = document.getElementById('difficulty');
  const startButton = document.querySelector('.start__button');

  if (!gamemodeSelect || !difficultySelect || !startButton) return;

  const ModeSelectStatus = gamemodeSelect.value !== '';
  const DifficultySelectStatus = difficultySelect.value !== '';

  if (ModeSelectStatus && DifficultySelectStatus) {
    startButton.disabled = false;
    startButton.style.opacity = '1';
    startButton.style.cursor = 'pointer';
  } else {
    startButton.disabled = true;
    startButton.style.opacity = '0.5';
    startButton.style.cursor = 'not-allowed';
  }
}

function startGame() {

  const gamemodeSelect = document.getElementById('gamemode');
  const difficultySelect = document.getElementById('difficulty');

  if (!gamemodeSelect || gamemodeSelect.value === '' ||
      !difficultySelect || difficultySelect.value === '') {
    return;
  }

  GAME_STATE.mode = GAME_MODES[gamemodeSelect.value];
  GAME_STATE.difficulty = difficultySelect.value;

  const settings = DIFFICULTY_SETTINGS[GAME_STATE.difficulty];
  if (!settings) return;

  GAME_STATE.totalPairs = settings.pairs;
  GAME_STATE.maxAttempts = settings.attempts;
  GAME_STATE.attemptsLeft = settings.attempts;
  GAME_STATE.timeLeft = settings.time;

  GAME_STATE.cards = [];
  GAME_STATE.flippedCards = [];
  GAME_STATE.matchedPairs = 0;
  GAME_STATE.attempts = 0;
  GAME_STATE.gameStarted = false;
  GAME_STATE.gameOver = false;
  GAME_STATE.firstClick = false;

  hideSettingsSection();
  showPlaygroundSection();
  createCards();
  updateStatsDisplay();
  updateTimeDisplay();
}

function createCards() {
  const gameBoard = document.querySelector('.cards__grid');
  if (!gameBoard) return;

  gameBoard.innerHTML = '';

  let columns;
  let rows;
  switch(GAME_STATE.difficulty) {
    case 'difficulty_easy':
      columns = 4;
      rows = 3;
      break;
    case 'difficulty_medium':
      columns = 4;
      rows = 4;
      break;
    case 'difficulty_hard':
      columns = 4;
      rows = 6;
      break;
    default:
      columns = 4;
      rows = 3;
  }

  gameBoard.style.gridTemplateColumns = `repeat(${columns}, 1fr`;
  gameBoard.style.gridTemplateRows = `repeat(${rows}, 1fr`;
  const icons = ICONS_ARRAY.slice(0, GAME_STATE.totalPairs);
  const cardIcons = [...icons, ...icons];

  shuffleArray(cardIcons);

  cardIcons.forEach((icon, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = index;
    card.dataset.icon = icon;
    card.dataset.flipped = 'false';

    card.innerHTML = `
      <div class="card-inner">
        <div class="card-back">?</div>
        <div class="card-front">${icon}</div>
      </div>
    `;

    card.addEventListener('click', () => flipCard(card));

    gameBoard.appendChild(card);
    GAME_STATE.cards.push(card);
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function flipCard(card) {
  if (
    GAME_STATE.gameOver ||
    card.dataset.flipped === 'true' ||
    GAME_STATE.flippedCards.length >= 2 ||
    card.classList.contains('matched')
  ) {
    return;
  }
  
  if (!GAME_STATE.firstClick) {
    GAME_STATE.firstClick = true;
    GAME_STATE.gameStarted = true;
    GAME_STATE.startTime = Date.now();
    startTimer();
  }
  
  card.dataset.flipped = 'true';
  card.classList.add('flipped');
  GAME_STATE.flippedCards.push(card);
  
  if (GAME_STATE.flippedCards.length === 2) {
    GAME_STATE.attempts++;

    if (GAME_STATE.mode === 'gamemode_attempts') {
      GAME_STATE.attemptsLeft--;
      
      updateTimeDisplay();

      if (GAME_STATE.attemptsLeft <= 0 && GAME_STATE.attempts >= GAME_STATE.maxAttempts) {
        setTimeout(() => {
          if (GAME_STATE.matchedPairs < GAME_STATE.totalPairs) {
            endGame(false, GAME_STATE.attempts);
          }
        }, 800);
      }
    }
    setTimeout(checkMatch, 800);
  }
  
  updateStatsDisplay();
}

function startTimer() {
  if (GAME_STATE.timerId) clearInterval(GAME_STATE.timerId);
  GAME_STATE.timerId = setInterval(() => {
    if (GAME_STATE.mode === 'gamemode_time') {
      GAME_STATE.timeLeft--;

      updateTimeDisplay();
      
      if (GAME_STATE.timeLeft <= 0) {
        clearInterval(GAME_STATE.timerId);
        const gameTime = Math.floor((Date.now() - GAME_STATE.startTime) / 1000);
        endGame(false, GAME_STATE.attempts, gameTime);
        return;
      } else if (GAME_STATE.mode === 'free') updateTimeDisplay();
    }
    updateTimeDisplay();
  }, 1000);
}

function showSettingSection(){
  const settingsSection = document.querySelector('.settings__section');
  const playgroundSection = document.querySelector('.playground__section');
  const resultSection = document.querySelector('.result__section');

  if (settingsSection) settingsSection.style.display = 'grid';
  if (playgroundSection) playgroundSection.style.display = 'none';
  if (resultSection) resultSection.style.display = 'none';
}

function hideSettingsSection() {
  const settingsSection = document.querySelector('.settings__section');
  if (settingsSection) settingsSection.style.display = 'none';
}

function showPlaygroundSection() {
  const playgroundSection = document.querySelector('.playground__section');
  if (playgroundSection) playgroundSection.style.display = 'flex';
}

function hidePlaygroundSection() {
  const playgroundSection = document.querySelector('.playground__section');
  if (playgroundSection) playgroundSection.style.display = 'none';
}

function showResultSection() {
  const resultSection = document.querySelector('.result__section');
  if (resultSection) resultSection.style.display = 'flex';
}

function hideResultSection() {
  const resultSection = document.querySelector('.result__section');
  if (resultSection) resultSection.style.display = 'none';
}

function updateStatsDisplay() {
  const pairsFound = document.querySelector('.point__counter-value');
  if (pairsFound) {
    pairsFound.textContent = `${GAME_STATE.matchedPairs}/${GAME_STATE.totalPairs}`;
  }
}

function returnToSettings() {
  stopTimer();
  hideTimer();
  hidePlaygroundSection();
  hideResultSection();
  showSettingSection();
}

function stopTimer() {
  if (GAME_STATE.timerId) {
    clearInterval(GAME_STATE.timerId);
    GAME_STATE.timerId = null;
  }
}

function hideTimer() {
  const timer = document.querySelector('.game__timer');
  if (timer) {
    timer.display = 'none';
  }
}

function checkMatch() {
  if (GAME_STATE.flippedCards.length !== 2) return;
  
  const [card1, card2] = GAME_STATE.flippedCards;
  
  if (card1.dataset.icon === card2.dataset.icon) {

    card1.classList.add('matched');
    card2.classList.add('matched');
    card1.dataset.flipped = 'true';
    card2.dataset.flipped = 'true';
    GAME_STATE.matchedPairs++;
    
    if (GAME_STATE.matchedPairs === GAME_STATE.totalPairs) {
      const gameTime = Math.floor((Date.now() - GAME_STATE.startTime) / 1000);
      const timeLeft = GAME_STATE.mode === 'gamemode_time' ? GAME_STATE.timeLeft : 0;
      endGame(true, GAME_STATE.attempts, gameTime);
    }
  } else {

    setTimeout(() => {
      card1.dataset.flipped = 'false';
      card2.dataset.flipped = 'false';
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
    }, 600);
  }
  
  GAME_STATE.flippedCards = [];
  updateStatsDisplay();
}

function updateTimeDisplay() {
  let timerText = '';
  const timer = document.querySelector('.game__timer');
  if (GAME_STATE.mode === 'gamemode_time') {

    const minutes = Math.floor(GAME_STATE.timeLeft / 60);
    const seconds = GAME_STATE.timeLeft % 60;
    const timeString = `Осталось:<br> ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerText = `${timeString}`;
    
    if (GAME_STATE.timeLeft <= 30) {
      timer.style.color = '#e74c3c';
      timer.style.animation = 'pulse 1s infinite';
    } else {
      timer.style.color = '#fff';
    }
    
  } else if (GAME_STATE.mode === 'gamemode_attempts') {

    timerText = `Попытки:<br> ${GAME_STATE.attemptsLeft}/${GAME_STATE.maxAttempts}`;
    if (GAME_STATE.attemptsLeft <= 5){
      timer.style.color = '#e74c3c';
    }else{
      timer.style.color = '#fff';
    }
    
  } else {

    const elapsedTime = GAME_STATE.gameStarted ? 
      Math.floor((Date.now() - GAME_STATE.startTime) / 1000) : 0;
    
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    timerText = `${timeString}`;
    timer.style.color = '#fff';
  }

  timer.innerHTML = timerText;
}

function endGame(isWin, attemptsUsed = 0, gameTime = 0) {
  stopTimer();
  GAME_STATE.gameOver = true;
  GAME_STATE.gameStarted = false;

  hideTimer();

  hidePlaygroundSection();
  showResultSection();

  const resultTitle = document.querySelector('.result__title');
  const attemptsAmount = document.querySelector('.attempts__amount');

  if (resultTitle) {
    resultTitle.textContent = isWin 
      ? 'Поздравляем! Вы выиграли!' 
      : 'Игра окончена!';
  }

  let resultText = '';
  let bestScore = null;

  if (GAME_STATE.mode === 'gamemode_time') {
    if (isWin) {
      // Для режима на время показываем оставшееся время
      const minutes = Math.floor(gameTime / 60);
      const seconds = gameTime % 60;
      resultText = `Пройдено за: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      // Сохраняем лучший результат (максимальное оставшееся время)
      saveBestScore(GAME_STATE.mode, GAME_STATE.timeLeft, 'time');
      bestScore = getBestScore(GAME_STATE.mode, GAME_STATE.difficulty);
    } else {
      // Проиграли по времени
      const minutes = Math.floor(gameTime / 60);
      const seconds = gameTime % 60;
      resultText = `Время вышло! Играли: ${minutes}:${seconds.toString().padStart(2, '0')}`;
      bestScore = getBestScore(GAME_STATE.mode, GAME_STATE.difficulty);
    }
  } else if (GAME_STATE.mode === 'gamemode_attempts') {
    if (isWin) {
      // Выиграли в режиме на попытки
      resultText = `Использовано попыток: ${attemptsUsed}/${GAME_STATE.maxAttempts}`;
      
      // Сохраняем лучший результат (минимальное количество попыток)
      saveBestScore(GAME_STATE.mode, attemptsUsed, 'attempts');
      bestScore = getBestScore(GAME_STATE.mode, GAME_STATE.difficulty);
    } else {
      // Проиграли по попыткам
      resultText = `Попытки закончились! Использовано: ${attemptsUsed}`;
      bestScore = getBestScore(GAME_STATE.mode, GAME_STATE.difficulty);
    }
  } else {
    // Простой режим
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    resultText = `Время: ${minutes}:${seconds.toString().padStart(2, '0')}, Попытки: ${attemptsUsed}`;
    
    if (isWin) {
      // Сохраняем лучший результат (минимальное время прохождения)
      saveBestScore(GAME_STATE.mode, gameTime, 'time');
      bestScore = getBestScore(GAME_STATE.mode, GAME_STATE.difficulty);
    } else {
      bestScore = getBestScore(GAME_STATE.mode, GAME_STATE.difficulty);
    }
  }
  
  if (attemptsAmount) {
    attemptsAmount.textContent = resultText;
  }

  updateBestResultsDisplay();
}

function saveBestScore(mode, value, valueType) {
  const key = `best_${mode}_${GAME_STATE.difficulty}`;
  
  try {
    const currentBest = localStorage.getItem(key);
    
    if (!currentBest) {
      localStorage.setItem(key, JSON.stringify({
        value: value,
        type: valueType,
        timestamp: Date.now()
      }));
      return;
    }
    
    const currentBestData = JSON.parse(currentBest);
    const currentBestValue = currentBestData.value;
    
    let shouldUpdate = false;
    
    if (valueType === 'time') {
      if (mode === 'gamemode_time') {
        shouldUpdate = value > currentBestValue;
      } else {
        shouldUpdate = value < currentBestValue || currentBestValue === 0;
      }
    } else if (valueType === 'attempts') {
      shouldUpdate = value < currentBestValue;
    }
    
    if (shouldUpdate) {
      localStorage.setItem(key, JSON.stringify({
        value: value,
        type: valueType,
        timestamp: Date.now()
      }));
    }
  } catch (error) {

    localStorage.setItem(key, JSON.stringify({
      value: value,
      type: valueType,
      timestamp: Date.now()
    }));
  }
}

function getBestScore(mode, difficulty) {
  const key = `best_${mode}_${difficulty}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
}

function loadBestScores() {
  const modes = getModes();
  const difficulties = getDifficulties();
  
  modes.forEach(mode => {
    difficulties.forEach(difficulty => {
      const key = `best_${mode}_${difficulty}`;
      if (!localStorage.getItem(key)) {
        const settings = DIFFICULTY_SETTINGS[difficulty];
        let defaultValue, valueType;
        
        if (mode === 'gamemode_time') {
          defaultValue = settings.time;
          valueType = 'time';
        } else if (mode === 'gamemode_attempts') {
          defaultValue = settings.attempts;
          valueType = 'attempts';
        } else {
          defaultValue = 0;
          valueType = 'time';
        }
        
        localStorage.setItem(key, JSON.stringify({
          value: defaultValue,
          type: valueType,
          timestamp: Date.now()
        }));
      }
    });
  });
}

function updateBestResultsDisplay() {
  const resultsList = document.querySelector('.best__results-list');
  if (!resultsList) return;
  

  const allBestScores = [];
  const modes = getModes();
  const difficulties = getDifficulties();
  
  modes.forEach(mode => {
    difficulties.forEach(difficulty => {
      const key = `best_${mode}_${difficulty}`;
      const data = localStorage.getItem(key);
      
      if (data) {
        try {
          const scoreData = JSON.parse(data);
          const settings = DIFFICULTY_SETTINGS[difficulty];
          const isDefaultValue = 
            (mode === 'gamemode_time' && scoreData.value === settings.time) ||
            (mode === 'gamemode_attempts' && scoreData.value === settings.attempts) ||
            (mode === 'gamemode_free' && scoreData.value === 0);
          
          if (!isDefaultValue) {
            allBestScores.push({
              mode: mode,
              difficulty: difficulty,
              value: scoreData.value,
              type: scoreData.type,
              timestamp: scoreData.timestamp
            });
          }
        } catch (e) {
        }
      }
    });
  });
  
  allBestScores.sort((a, b) => b.timestamp - a.timestamp);
  
  if (allBestScores.length === 0) {
    resultsList.textContent = 'Пока нет результатов в других режимах';
    return;
  }
  
  const resultStrings = allBestScores.map(score => {
    const modeName = MODE_DISPLAY_NAMES[score.mode] || score.mode;
    const difficultyName = DIFFICULTY_DISPLAY_NAMES[score.difficulty] || score.difficulty;
    
    let valueText = '';
    if (score.type === 'time') {
      const minutes = Math.floor(score.value / 60);
      const seconds = score.value % 60;
      valueText = `${minutes}:${seconds.toString().padStart(2, '0')} секунд`;
    } else {
      valueText = `${score.value} попыток`;
    }
    return `${modeName} (${difficultyName}): ${valueText}`;
  });
  
  resultsList.innerHTML = '';
  resultStrings.forEach((text, index) => {
    const item = document.createElement('li');
    item.className = "best__results-item"
    item.textContent = text;
    item.style.borderBottom = index < resultStrings.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none';
    resultsList.appendChild(item);
  });
}

function resetGame() {
  stopTimer();
  hideTimer();

  const currentMode = GAME_STATE.mode;
  const currentDifficulty = GAME_STATE.difficulty;

  Object.assign(GAME_STATE, {
    cards: [],
    flippedCards: [],
    matchedPairs: 0,
    attempts: 0,
    attemptsLeft: 0,
    timeLeft: 0,
    timerId: null,
    gameStarted: false,
    gameOver: false,
    firstClick: false,
    totalPairs: 0,
    maxAttempts: 0,
    startTime: 0,
  });

  GAME_STATE.mode = currentMode;
  GAME_STATE.difficulty = currentDifficulty;

  if (currentMode && currentDifficulty) {
    startGame();
  } else {
    returnToSettings();
  }
}

function getModes(){
  return Object.values(GAME_MODES);
}

function getDifficulties(){
  return Object.keys(DIFFICULTY_SETTINGS);
}

document.addEventListener('DOMContentLoaded', () => {
  game();});
