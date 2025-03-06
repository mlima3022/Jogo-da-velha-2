const bigBoard = document.getElementById('big-board');
const currentPlayerDisplay = document.getElementById('current-player');
const message = document.getElementById('message');
const botModeCheckbox = document.getElementById('bot-mode');

let currentPlayer = 'X';
let nextBoardRow = null;
let nextBoardCol = null;
let bigBoardState = Array.from({ length: 3 }, () => Array(3).fill(null)); // Estado do tabuleiro grande
let isBotMode = false; // Modo bot desativado por padrão

// Atualiza o modo do bot quando o checkbox é alterado
botModeCheckbox.addEventListener('change', () => {
    isBotMode = botModeCheckbox.checked; // Ativa ou desativa o modo bot
    console.log(`Modo Bot: ${isBotMode ? 'Ativado' : 'Desativado'}`);
});

// Cria o tabuleiro grande com 9 tabuleiros menores
function createBigBoard() {
    bigBoard.innerHTML = '';
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const smallBoard = document.createElement('div');
            smallBoard.classList.add('small-board');
            smallBoard.dataset.row = row;
            smallBoard.dataset.col = col;

            // Cria as células dentro de cada tabuleiro menor
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    const cell = document.createElement('div');
                    cell.classList.add('cell');
                    cell.dataset.row = i;
                    cell.dataset.col = j;
                    cell.addEventListener('click', () => handleCellClick(cell, smallBoard));
                    smallBoard.appendChild(cell);
                }
            }

            bigBoard.appendChild(smallBoard);
        }
    }
}

// Função para lidar com o clique em uma célula
function handleCellClick(cell, smallBoard) {
    if (isBotMode && currentPlayer === 'O') return; // Impede o jogador de clicar no turno do bot

    const boardRow = parseInt(smallBoard.dataset.row);
    const boardCol = parseInt(smallBoard.dataset.col);
    const cellRow = parseInt(cell.dataset.row);
    const cellCol = parseInt(cell.dataset.col);

    // Verifica se a célula está vazia e se o tabuleiro menor está ativo
    if (!cell.textContent && (nextBoardRow === null || (nextBoardRow === boardRow && nextBoardCol === boardCol))) {
        cell.textContent = currentPlayer;
        cell.classList.add(currentPlayer);

        // Verifica se há um vencedor no tabuleiro menor
        if (checkSmallBoardWinner(smallBoard)) {
            bigBoardState[boardRow][boardCol] = currentPlayer; // Marca o vencedor no tabuleiro grande
            disableSmallBoard(smallBoard);
            highlightWinner(smallBoard, currentPlayer);

            // Verifica se há um vencedor no tabuleiro grande
            if (checkBigBoardWinner()) {
                message.textContent = `Jogador ${currentPlayer} venceu o jogo!`;
                disableAllBoards();
                return;
            }
        } else if (isSmallBoardFull(smallBoard)) {
            bigBoardState[boardRow][boardCol] = 'draw'; // Marca como empate
        }

        // Define o próximo tabuleiro com base na célula clicada
        nextBoardRow = cellRow;
        nextBoardCol = cellCol;

        // Verifica se o próximo tabuleiro está completo ou inativo
        const nextBoard = document.querySelector(`.small-board[data-row="${nextBoardRow}"][data-col="${nextBoardCol}"]`);
        if (nextBoard && (bigBoardState[nextBoardRow][nextBoardCol] !== null || isSmallBoardFull(nextBoard))) {
            nextBoardRow = null;
            nextBoardCol = null;
        }

        // Alterna o jogador
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        currentPlayerDisplay.textContent = currentPlayer;

        // Atualiza o destaque dos tabuleiros ativos
        updateActiveBoards();

        // Se for o turno do bot, faz a jogada após 3 segundos
        if (isBotMode && currentPlayer === 'O') {
            console.log("Bot está pensando...");
            setTimeout(botMove, 3000); // Delay de 3 segundos
        }
    }
}

// Movimento do bot
function botMove() {
    console.log("Bot está jogando...");

    let targetBoard;

    // 1. Encontra o tabuleiro ativo
    if (nextBoardRow !== null && nextBoardCol !== null) {
        targetBoard = document.querySelector(
            `.small-board[data-row="${nextBoardRow}"][data-col="${nextBoardCol}"]`
        );
        console.log(`Tabuleiro ativo: [${nextBoardRow}, ${nextBoardCol}]`);
    } else {
        // Se não houver tabuleiro ativo, escolhe um tabuleiro aleatório que não está completo
        const activeBoards = Array.from(document.querySelectorAll('.small-board')).filter(board => {
            const row = parseInt(board.dataset.row);
            const col = parseInt(board.dataset.col);
            return bigBoardState[row][col] === null && !isSmallBoardFull(board);
        });

        if (activeBoards.length === 0) {
            console.log("Nenhum tabuleiro disponível para o bot jogar.");
            return;
        }

        targetBoard = activeBoards[Math.floor(Math.random() * activeBoards.length)];
        console.log("Bot escolheu um tabuleiro aleatório.");
    }

    // 2. Encontra células disponíveis no tabuleiro alvo
    const cells = targetBoard.querySelectorAll('.cell:not(.X):not(.O)');
    if (cells.length === 0) {
        console.log("Nenhuma célula disponível no tabuleiro escolhido.");
        return;
    }

    // 3. Escolhe uma célula aleatória e marca ela
    const randomCell = cells[Math.floor(Math.random() * cells.length)];
    console.log(`Bot jogou na célula: [${randomCell.dataset.row}, ${randomCell.dataset.col}]`);

    // Marca a célula diretamente
    randomCell.textContent = currentPlayer;
    randomCell.classList.add(currentPlayer);

    // Verifica se há um vencedor no tabuleiro menor
    if (checkSmallBoardWinner(targetBoard)) {
        const boardRow = parseInt(targetBoard.dataset.row);
        const boardCol = parseInt(targetBoard.dataset.col);
        bigBoardState[boardRow][boardCol] = currentPlayer; // Marca o vencedor no tabuleiro grande
        disableSmallBoard(targetBoard);
        highlightWinner(targetBoard, currentPlayer);

        // Verifica se há um vencedor no tabuleiro grande
        if (checkBigBoardWinner()) {
            message.textContent = `Jogador ${currentPlayer} venceu o jogo!`;
            disableAllBoards();
            return;
        }
    } else if (isSmallBoardFull(targetBoard)) {
        const boardRow = parseInt(targetBoard.dataset.row);
        const boardCol = parseInt(targetBoard.dataset.col);
        bigBoardState[boardRow][boardCol] = 'draw'; // Marca como empate
    }

    // Define o próximo tabuleiro com base na célula clicada
    nextBoardRow = parseInt(randomCell.dataset.row);
    nextBoardCol = parseInt(randomCell.dataset.col);

    // Verifica se o próximo tabuleiro está completo ou inativo
    const nextBoard = document.querySelector(`.small-board[data-row="${nextBoardRow}"][data-col="${nextBoardCol}"]`);
    if (nextBoard && (bigBoardState[nextBoardRow][nextBoardCol] !== null || isSmallBoardFull(nextBoard))) {
        nextBoardRow = null;
        nextBoardCol = null;
    }

    // Alterna o jogador
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    currentPlayerDisplay.textContent = currentPlayer;

    // Atualiza o destaque dos tabuleiros ativos
    updateActiveBoards();
}

// Verifica se há um vencedor no tabuleiro menor
function checkSmallBoardWinner(smallBoard) {
    const cells = smallBoard.querySelectorAll('.cell');
    const winningCombinations = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Linhas
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Colunas
        [0, 4, 8], [2, 4, 6]             // Diagonais
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        if (cells[a].textContent && cells[a].textContent === cells[b].textContent && cells[a].textContent === cells[c].textContent) {
            return true;
        }
    }

    return false;
}

// Verifica se há um vencedor no tabuleiro grande
function checkBigBoardWinner() {
    const winningCombinations = [
        [[0, 0], [0, 1], [0, 2]], // Linha 1
        [[1, 0], [1, 1], [1, 2]], // Linha 2
        [[2, 0], [2, 1], [2, 2]], // Linha 3
        [[0, 0], [1, 0], [2, 0]], // Coluna 1
        [[0, 1], [1, 1], [2, 1]], // Coluna 2
        [[0, 2], [1, 2], [2, 2]], // Coluna 3
        [[0, 0], [1, 1], [2, 2]], // Diagonal \
        [[0, 2], [1, 1], [2, 0]]  // Diagonal /
    ];

    for (const combination of winningCombinations) {
        const [a, b, c] = combination;
        const valA = bigBoardState[a[0]][a[1]];
        const valB = bigBoardState[b[0]][b[1]];
        const valC = bigBoardState[c[0]][c[1]];

        if (valA && valA === valB && valA === valC) {
            return true; // Há um vencedor
        }
    }

    return false; // Não há vencedor
}

// Desativa um tabuleiro menor
function disableSmallBoard(smallBoard) {
    const cells = smallBoard.querySelectorAll('.cell');
    cells.forEach(cell => cell.style.pointerEvents = 'none');
}

// Desativa todos os tabuleiros
function disableAllBoards() {
    const smallBoards = document.querySelectorAll('.small-board');
    smallBoards.forEach(board => {
        const cells = board.querySelectorAll('.cell');
        cells.forEach(cell => cell.style.pointerEvents = 'none');
    });
}

// Verifica se um tabuleiro menor está cheio
function isSmallBoardFull(smallBoard) {
    const cells = smallBoard.querySelectorAll('.cell');
    return Array.from(cells).every(cell => cell.textContent !== '');
}

// Atualiza o destaque dos tabuleiros ativos
function updateActiveBoards() {
    const smallBoards = document.querySelectorAll('.small-board');
    smallBoards.forEach(board => board.classList.remove('active'));

    if (nextBoardRow !== null && nextBoardCol !== null) {
        const nextBoard = document.querySelector(`.small-board[data-row="${nextBoardRow}"][data-col="${nextBoardCol}"]`);
        if (nextBoard) {
            nextBoard.classList.add('active');
        }
    } else {
        // Se o próximo tabuleiro for nulo, todos os tabuleiros não completos estão ativos
        smallBoards.forEach(board => {
            const row = parseInt(board.dataset.row);
            const col = parseInt(board.dataset.col);
            if (bigBoardState[row][col] === null && !isSmallBoardFull(board)) {
                board.classList.add('active');
            }
        });
    }
}

// Destaca o vencedor de um tabuleiro menor
function highlightWinner(smallBoard, winner) {
    smallBoard.style.backgroundColor = winner === 'X' ? '#ffcccc' : '#ccccff';
}

// Reinicia o jogo
function resetGame() {
    bigBoardState = Array.from({ length: 3 }, () => Array(3).fill(null));
    currentPlayer = 'X';
    nextBoardRow = null;
    nextBoardCol = null;
    message.textContent = '';
    createBigBoard();
    updateActiveBoards();
}

// Inicia o jogo
createBigBoard();