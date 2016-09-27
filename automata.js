let automata = (() => {
  'strict mode';

  let canvas;
  let ctx;
  let map = [];
  let fillPercent;
  let width;
  let height;

  let requestId;
  let draw = false;
  let column;
  let row;
  let prevX;
  let prevY;

  const GRID_SIZE = 4;
  const ACTIVE_COLOR = '#F89406';
  const INACTIVE_COLOR = '#1F3A93';

  Array.prototype.get = function (i, j) {
    return this[(i * this.width) + j];
  };

  Array.prototype.setwidth = function (w) {
    this.width = w;
  };

  // Used for creating a random ruleset for Cellular Automata
  function random(min, max) {
    return Math.floor(
      Math.random() * (max - min + 1)
    );
  }

  //Gets decimal rule from input and converts it to 8 bit array
  function getRuleFromUser() {
    let ruleSet = parseInt(document.getElementsByName('rule')[0].value);

    let binary = ('00000000' + ruleSet.toString(2)).slice(-8)
    .split('')
    .map(Number);

    return binary;
  }

  //creates random ruleset
  function createRandomRuleset() {
    let randomRuleSet = [];

    for (let i = 0; i < 8; i++) {
      randomRuleSet.push(random(0, 1));
    }

    return randomRuleSet;
  }

  function Cell(x, y) {
    this.x = x;
    this.y = y;
    this.id = x + '_' + y;
    this.isAlive = false;
    this.neighbours = {
      ul: 0,
      up: 0,
      ur: 0,
      le: 0,
      ri: 0,
      ll: 0,
      lo: 0,
      lr: 0,
    };
  }

  //Process rows using rules
  function processAllRows(array) {
    let ruleSet = getRuleFromUser();
    if (isNaN(ruleSet[7])) {
      ruleSet = createRandomRuleset();
    }

    let previousRowPixelStates = [
      [1, 1, 1],
      [1, 1, 0],
      [1, 0, 1],
      [1, 0, 0],
      [0, 1, 1],
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, 0],
    ];

    let row;
    let column;
    let target;
    let prevSelf;
    let leftSibling;
    let rightSibling;
    let state;
    let arrayLength = array.length - 1;

    for (row = 1; row < arrayLength; row++) {
      for (column = 1; column < array[row].length - 1; column++) {
        target = [row, column];
        prevSelf = array[row - 1][column];
        leftSibling = array[row - 1][column - 1];
        rightSibling = array[row - 1][column + 1];

        for (state = 0; state < 8; state++) {
          if (leftSibling === previousRowPixelStates[state][0] &&
            prevSelf === previousRowPixelStates[state][1] &&
            rightSibling === previousRowPixelStates[state][2]
          ) {
            array[row][column] = ruleSet[state];
            break;
          }
        }
      }
    }

    renderAllCells(array, GRID_SIZE);
  }

  // ran once - performance not important
  function getRandom(min, max) {
    return Math.random() * (max - min) + min;
  }

  // ran once - performance not important
  function randomFillMap(array) {
    let x;
    let y;
    for (x = 0; x < height; x++) {
      array[x] = [];
      for (y = 0; y < width; y++) {
        array[x][y] = (getRandom(0, 100) < fillPercent) ? 1 : 0;
      }
    }

    return array;
  }

  function clearMap(array) {
    let x;
    let y;

    for (x = 0; x < height; x++) {
      for (y = 0; y < width; y++) {
        if (x === 0 && y === Math.floor(width / 2)) {
          array[x][y] = 1;
        } else {
          array[x][y] = 0;
        }
      }
    }

    renderAllCells(array, GRID_SIZE);
    return array;
  }

  // ran once - performance not important
  function renderAllCells(array, GRID_SIZE) {
    let x;
    let y;

    for (x = 0; x < width; x++) {
      for (y = 0; y < height; y++) {
        drawCellState(x, y, array[y][x]);
      }
    }
  }

  function drawCellState(x, y, state) {
    state ? ctx.fillStyle = ACTIVE_COLOR : ctx.fillStyle = INACTIVE_COLOR;
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE,  GRID_SIZE, GRID_SIZE);
  }

  function getSurroundingWallcount(array, gridX, gridY) {
    let wallCount = 0;
    let neighbourX;
    let neighbourY;

    for (neighbourX = gridX - 1; neighbourX <= gridX + 1; neighbourX++) {
      for (neighbourY = gridY - 1; neighbourY <= gridY + 1; neighbourY++) {
        if (neighbourX != gridX || neighbourY != gridY) {
          if (wallCount > 3) { break; };

          wallCount += array[neighbourX][neighbourY];

        }
      }
    }

    return wallCount;
  }

  function conwayRules(array) {
    let queue = [];
    let row;
    let column;
    let neighbourWallTiles;

    for (row = 1; row < height - 1; row++) {
      for (column = 1; column < width - 1; column++) {

        neighbourWallTiles = getSurroundingWallcount(array, row, column);

        if (array[row][column] === 1) {
          if (neighbourWallTiles < 2) {
            queue.push({
              x: row,
              y: column,
              state: 0,
            });
          } else if (neighbourWallTiles > 3) {
            queue.push({
              x: row,
              y: column,
              state: 0,
            });
          }
        } else {
          if (neighbourWallTiles === 3) {
            queue.push({
              x: row,
              y: column,
              state: 1,
            });
          }
        }
      }
    }

    queue.forEach((cell) => {
      map[cell.x][cell.y] = cell.state;
      drawCellState(cell.y, cell.x, cell.state);
    });
  }

  function randomMap(array) {
    fillPercent = parseInt(document.getElementsByName('fillPercent')[0].value);
    randomFillMap(array);
    renderAllCells(array, GRID_SIZE);
  }

  function drawing(column, row) {
    let currentState = map[row][column];
    drawCellState(column, row,  1 - currentState);
    map[row][column] = 1 - currentState;
  }

  function main() {
    canvas = document.createElement('canvas');
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w * 0.9;
    canvas.height = h * 0.9;
    ctx = canvas.getContext('2d');
    width = canvas.width / GRID_SIZE;
    height = canvas.height / GRID_SIZE;

    let drawnCells = [];

    document.getElementsByClassName('automata')[0].appendChild(canvas);

    canvas.addEventListener('mousedown', () => {
      event.preventDefault();
      column = Math.floor((event.clientX - canvas.offsetLeft) / GRID_SIZE);
      row = Math.floor((event.clientY - canvas.offsetTop) / GRID_SIZE);
      drawnCells.push(column + '_' + row);
      drawing(column, row);
      draw = true;
    });

    canvas.addEventListener('mouseup', () => {
      draw = false;
      drawnCells = [];
    });

    canvas.addEventListener('mouseleave', () => {
      draw = false;
    });

    canvas.addEventListener('mousemove', (event) => {
      column = Math.floor((event.clientX - canvas.offsetLeft) / GRID_SIZE);
      row = Math.floor((event.clientY - canvas.offsetTop) / GRID_SIZE);
      if (draw && drawnCells.indexOf(column + '_' + row) === -1) {
        drawnCells.push(column + '_' + row);
        drawing(column, row);
      }
    });

    fillPercent = parseInt(document.getElementsByName('fillPercent')[0].value);

    randomFillMap(map);
    renderAllCells(map, GRID_SIZE);
  }

  function automata() {
    processAllRows(map);
  }

  function stop() {
    window.cancelAnimationFrame(requestId);
    requestId = undefined;
  }

  function gol() {
    if (!requestId) {
      let loop = () => {
        conwayRules(map);
        requestId = window.requestAnimationFrame(loop, canvas);
      };

      window.requestAnimationFrame(loop, canvas);
    }
  }

  document.ondomcontentready = main();

  return {
    automata: automata,
    gol: gol,
    stop: stop,
    clearMap: clearMap,
    randomMap: randomMap,
    conwayRules: conwayRules,
    map: map,
  };
})();
