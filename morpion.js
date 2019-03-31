const {
  map,
  flatMap,
  first,
  flow,
  curry,
  nth,
  zip,
  filter,
  has,
  isEqual,
  negate,
  each,
  reject,
  times,
  memoize,
  tap,
  take,
  sample,
  isUndefined,
  range,
  compact,
  find,
  isEmpty,
  sortBy,
  identity,
  reduce,
  join,
  difference,
  values,
  maxBy
} = require('lodash/fp');

const mapWithIndex = map.convert({ cap: false });

const directionOffsets = [[1, -1], [1, 0], [1, 1], [0, 1]];

function Move(x, y, direction, startOffset) {
  return [x, y, direction, startOffset];
}

// Move => Move => Boolean
const areMovesEqual = move1 => move2 =>
  move1[0] === move2[0] &&
  move1[1] === move2[1] &&
  move1[2] === move2[2] &&
  move1[3] === move2[3] &&
  move1[4] === move2[4];

function morpion() {
  return {
    takenMoves: [],
    board: []
  };
}

// modules.export({
//   morpion: morpion
// });

function boardIndexAt(x, y) {
  return (x + 15) * 40 + (y + 15);
}

const movePoints = move =>
  map(directionOffset => {
    const [x, y, direction, offset] = move;
    const [offsetXMag, offsetYMag] = directionOffsets[direction];
    const combinedOffsets = offset + directionOffset;
    return [x + offsetXMag * combinedOffsets, y + offsetYMag * combinedOffsets];
  })([0, 1, 2, 3, 4]);

// board is an array of numbers each number is a bit mask
const masks = {
  x: 0b00001,
  directions: [0b00010, 0b00100, 0b01000, 0b10000]
};

const initialMoves = [
  Move(3, -1, 3, 0),
  Move(6, -1, 3, 0),
  Move(2, 0, 1, 0),
  Move(7, 0, 1, -4),
  Move(3, 4, 3, -4),
  Move(7, 2, 2, -2),
  Move(6, 4, 3, -4),
  Move(0, 2, 3, 0),
  Move(9, 2, 3, 0),
  Move(-1, 3, 1, 0),
  Move(4, 3, 1, -4),
  Move(0, 7, 3, -4),
  Move(5, 3, 1, 0),
  Move(10, 3, 1, -4),
  Move(9, 7, 3, -4),
  Move(2, 2, 0, -2),
  Move(2, 7, 2, -2),
  Move(3, 5, 3, 0),
  Move(6, 5, 3, 0),
  Move(-1, 6, 1, 0),
  Move(4, 6, 1, -4),
  Move(3, 10, 3, -4),
  Move(5, 6, 1, 0),
  Move(10, 6, 1, -4),
  Move(6, 10, 3, -4),
  Move(2, 9, 1, 0),
  Move(7, 9, 1, -4),
  Move(7, 7, 0, -2)
];

const setPointOnBoard = (board, mask) => point => {
  const [x, y] = point;
  const index = boardIndexAt(x, y);
  const boardValue = board[index];

  board[index] = boardValue ? boardValue | mask : mask;
};

const setOnBoardExcludingStart = board => move => {
  const [x, y, direction, offset] = move;

  flow(
    movePoints,
    reject(isEqual([x, y])),
    each(setPointOnBoard(board, masks.x))
  )(move);
};

const initialBoardTemplate = [];
flow(each(setOnBoardExcludingStart(initialBoardTemplate)))(initialMoves);

function initialBoard() {
  // const board = [];
  //
  // flow(each(setOnBoardExcludingStart(board)))(initialMoves);
  //
  // return board;
  return [...initialBoardTemplate];
}

function printBoard(board) {
  times(y => {
    times(x => {
      const boardValue = board[boardIndexAt(x - 15, y - 15)];
      if (boardValue === masks.x) {
        process.stdout.write(' x');
      } else if (!boardValue) {
        process.stdout.write(' 0');
      } else {
        process.stdout.write(` ${boardValue}`);
      }
    })(40);
    console.log();
  })(40);
}

// Board => Direction => Point => Boolean
const isDirectionTaken = (board, direction, point) => {
  const [x, y] = point;
  const index = boardIndexAt(x, y);
  const boardValue = board[index];

  return boardValue & masks.directions[direction];
};

const isEmptyOnBoartAt = board => point => {
  const [x, y] = point;
  const index = boardIndexAt(x, y);
  const boardValue = board[index];

  return isUndefined(boardValue);
};

// Board => Move => Boolean
const isMoveValid = board => move => {
  // console.log(('evaluating move', move));
  // console.log(' points: ', movePoints(move));
  const points = movePoints(move);
  const isSecondPointTakenDirection = isDirectionTaken(
    board,
    move[2],
    points[1]
  );

  const isThirdPointTakenDirection = isDirectionTaken(
    board,
    move[2],
    points[2]
  );
  const isFourthPointTakenDirection = isDirectionTaken(
    board,
    move[2],
    points[3]
  );

  // console.log(
  //   'the middles are free in this direction',
  //   !isSecondPointTakenDirection &&
  //     !isThirdPointTakenDirection &&
  //     !isFourthPointTakenDirection
  // );

  const emptyPoints = filter(isEmptyOnBoartAt(board))(points);

  const emptyPointIndexPairs = flow(
    mapWithIndex((point, index) => {
      // console.log('inside', point, index, isEmptyOnBoartAt(board)(point));
      return isEmptyOnBoartAt(board)(point) ? [point, index] : undefined;
    }),
    compact
  )(points);

  // console.log('emptyPointIndexPairs', emptyPointIndexPairs);

  const retVal =
    !isSecondPointTakenDirection &&
    !isThirdPointTakenDirection &&
    !isFourthPointTakenDirection &&
    emptyPointIndexPairs.length === 1 &&
    flow(
      map(([[x, y], pointIndex]) => Move(x, y, move[2], -pointIndex)),
      first
    )(emptyPointIndexPairs);

  // if (!retVal) {
  //   console.log('REMOVING:', move);
  // } else {
  //   console.log('move', move);
  // }

  // console.log('ret', retVal, emptyPoints.length);

  return retVal;
};

// Move => Move => Boolean
const isLessThan = move =>
  flow(
    zip(move),
    find(([left, right]) => left < right)
  );

const arrayComponentComparator = (a, b) => {
  const res = isLessThan(a)(b) ? -1 : 1;
  console.log('comparing', a, b, res);
  return res;
};

const evaluator = () => {
  const board = initialBoard();
  let possibleMoves = [...initialMoves];
  let takenMoves = [];
  return {
    board,
    possibleMoves: () => possibleMoves,
    makeMove(move) {
      // console.log('making move', move);

      takenMoves.push(move);
      // set all the points of the move on the board
      flow(
        movePoints,
        each(setPointOnBoard(board, masks.directions[move[2]]))
      )(move);

      // console.log('before: ' + possibleMoves.length);
      // remove possibleMoves that are no longer possible
      const filteredPossibleMoves = filter(isMoveValid(board))(possibleMoves);

      // IDEA store the possible moves on the board
      const [moveX, moveY] = move;
      // scan rays around point of new move to find possible moves
      const rayMoves = flatMap(offset =>
        map(direction => Move(moveX, moveY, direction, offset))(range(0, 4))
      )(range(-4, 1));

      const possibleRayMoves = flow(
        map(isMoveValid(board)),
        filter(negate(find(areMovesEqual(move)))),
        compact
      )(rayMoves);

      // console.log('possibleRayMoves', possibleRayMoves);
      possibleMoves = sortBy(identity)([
        ...filteredPossibleMoves,
        ...possibleRayMoves
      ]);

      // console.log('karen', possibleMoves.length);
      // console.log('after: ' + possibleMoves.length);
    },
    noPossibleMoves: () => isEmpty(possibleMoves),
    firstPossibleMove: () => first(possibleMoves),
    randomPossibleMove: () => sample(possibleMoves),
    printBoard: () => printBoard(board),
    score: () => takenMoves.length,
    binaryPack: () => {
      const takenMovesIndex = reduce(
        (sum, num) => ({
          [num]: true,
          ...sum
        }),
        {}
      )(takenMoves);

      const possibleMoves = [...initialMoves];

      const t = flow(
        sortBy(/* implement the same sort as before, can change later */),
        map(move => (takenMovesIndex[move] ? 1 : 0)),
        join('')
      )(possibleMoves);
    }
  };
};

const evaluateRandomly = eve => {
  while (!eve.noPossibleMoves()) {
    const move = eve.randomPossibleMove();
    eve.makeMove(move);
  }
};

const moveToMoveWithFirstPoint = move => [
  move,
  flow(
    movePoints,
    first
  )(move)
];

const moveToOldStyleMove = flow();

// oldStyleMoveToNew: [Int] => [Int]
const oldStyleMoveToNew = ([x, y, startX, startY, direction]) => [
  x,
  y,
  direction - 1,
  Math.min(startX - x, startY - y)
];

// const board = initialBoard();
//
// flow(
//   take(1),
//   each(makeMove(board))
// )(initialMoves);
//
// printBoard(board);
// while (true) {
// const eve = evaluator();
//
// evaluateRandomly(eve);
//
// console.log(eve.binaryPack());
// console.log(eve.score());
// // }
//
// let possibleMoves = [...initialMoves];
//
// // console.log(possibleMoves);
// // console.log(possibleMoves.sort());
// const pairs = flow(
//   map(move => [
//     move,
//     flow(
//       movePoints,
//       first
//     )(move)
//   ]),
//   map(([[x, y, direction, offset], [firstPointX, firstPointY]]) => [
//     [x, y, firstPointX, firstPointY, direction],
//     [x, y, direction, offset]
//   ])
// )(possibleMoves);

// const a = pairs.sort((a, b) => arrayComponentComparator(a[0], b[0]));
//
// console.log(a);

// var lineReader = require('readline').createInterface({
//   input: require('fs').createReadStream('test1.moves')
// });
//
// const data = [];
// lineReader.on('line', line => {
//   data.push(JSON.parse(line));
// });
//
// const moveStr = join(',');
//
// lineReader.on('close', () => {
//   const moveData = map(([move, possibleMoves]) => [
//     oldStyleMoveToNew(move),
//     map(oldStyleMoveToNew)(possibleMoves)
//   ])(data);
//
//   const eve = evaluator();
//   let i = 0;
//
//   each(([move, possibleMoves]) => {
//     eve.makeMove(move);
//     console.log(`${i + 1}. ${move}`);
//     // console.log('eve possible', eve.possibleMoves);
//     // console.log('file possible', possibleMoves);
//     console.log(
//       'difference ',
//       difference(map(moveStr)(eve.possibleMoves), map(moveStr)(possibleMoves))
//     );
//     i += 1;
//   })(moveData);
//
//   // console.log(JSON.stringify(t));
// });

const Node = (move, parent) => {
  const moveToChildrenNodes = {};
  // score
  // visits
  // totalSubNodes
  const stats = {};
  let dead = false;
  return {
    move,
    parent,
    setDead: () => (dead = true),
    isDead: () => dead,
    stats: () => stats,
    childNodes: () => values(moveToChildrenNodes),
    moveToChildrenNodes: () => moveToChildrenNodes,
    addChildNode: node => {
      // console.log('adding node', node.move);

      // console.log('before', moveToChildrenNodes);
      moveToChildrenNodes[node.move] = node;
      // console.log('after', moveToChildrenNodes);
      // console.log('karen', has(node.move.toString())(moveToChildrenNodes));
    },
    findUnvisited: possibleMoves =>
      // TODO set a local flag so that there no more passes through the array if they are all used up
      {
        return find(
          negate(possibleMove =>
            has(possibleMove.toString())(moveToChildrenNodes)
          )
        )(possibleMoves);
      },
    selectChild: () =>
      flow(
        values,
        filter(negate(isDeadNode)),
        maxBy(node => {
          const { score, visits } = node.stats();
          return score - visits / 200;
        })
      )(moveToChildrenNodes),
    checkChildrenAndMaybeDie: () => {
      const aliveNode = find(negate(isDeadNode))(parent.childNodes());
      if (!aliveNode) dead = true;
    },
    setStat: (key, value) => (stats[key] = value),
    incrStat: key => {
      stats[key] = (stats[key] || 0) + 1;
    },
    maxStat: (key, value) => {
      stats[key] = Math.max(stats[key] || 0, value);
    }
  };
};

const hasArray = curry((array, hash) => has(array.toString())(hash));

const searchTree = (node, eve) => {
  const possibleMoves = eve.possibleMoves();

  if (node) {
    node.incrStat('visits');
    // console.log(`searching tree ${node.move} ${JSON.stringify(node.stats())}`);
  } else {
    // console.log('searching root');
  }

  const unvisitedMove = node.findUnvisited(possibleMoves);

  if (unvisitedMove) {
    eve.makeMove(unvisitedMove);

    const isLeaf = isEmpty(eve.possibleMoves());

    evaluateRandomly(eve);

    const newNode = Node(unvisitedMove, node);
    // newNode.setStat('score', eve.score());
    newNode.incrStat('visits');
    newNode.maxStat('score', eve.score());
    node.addChildNode(newNode);

    if (isLeaf) {
      // console.log('adding leaf node', newNode);
      newNode.setDead();
      newNode.checkChildrenAndMaybeDie();
    }

    // console.log('Adding move', unvisitedMove, eve.score());
    return newNode;
  }

  const bestChildNode = node.selectChild();
  if (bestChildNode) {
    // console.log('searching ', bestChildNode);
    eve.makeMove(bestChildNode.move);
    const addedNode = searchTree(bestChildNode, eve);
    // console.log('returned added node', addedNode);
    if (addedNode) {
      node.maxStat('score', addedNode.stats().score);
      node.incrStat('totalSubNodes');
    }
    return addedNode;
  }

  // console.log('no move added', node.childNodes());
  node.setDead();
  node.checkChildrenAndMaybeDie();

  return undefined;
};

const root = Node();

// Node => Boolean
const isDeadNode = node => node.isDead();

let misses = 0;
let hits = 0;
let bestScore = 0;

times(step => {
  // console.log(t);
  const createdNode = searchTree(root, evaluator());

  if (createdNode) {
    if (createdNode.stats().score > bestScore) {
      bestScore = createdNode.stats().score;
      console.log(`${step}. ####### ${bestScore}`);
    }

    hits += 1;
  }
  if (!createdNode) misses += 1;
})(10000);

each(node => console.log(`${node.move}  ${JSON.stringify(node.stats())}`))(
  root.childNodes()
);
console.log('hits: ', hits);
console.log('misses: ', misses);

module.exports = {
  oldStyleMoveToNew
};
