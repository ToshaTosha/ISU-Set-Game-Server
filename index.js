const express = require("express");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.json());

let deck = []; // колода
let board = []; // карты на столе
let players = []; // игроки

// колода карт для игры состоит из 81 карты, каждая из которых имеет 4 свойства
// генерируем колоду
let id = 0;
for (let count = 1; count <= 3; count++) {
  for (let color = 1; color <= 3; color++) {
    for (let shape = 1; shape <= 3; shape++) {
      for (let fill = 1; fill <= 3; fill++) {
        deck.push({ id, count, color, shape, fill });
        id++;
      }
    }
  }
}

// перемешиваем колоду
deck.sort(function () {
  return 0.5 - Math.random();
});

// кладём 12 карт из колоды на стол
for (let i = 0; i < 12; i++) {
  board.push(deck.shift());
}

// добавляем 3 карты из колоды на стол
function replenishBoard() {
  const numCardsToAdd = Math.min(3, deck.length);
  for (let i = 0; i < numCardsToAdd; i++) {
    board.push(deck.shift());
  }
}

// проверяем есть ли сет
const isSame = (a, b) => a === b;
const isDifferent = (a, b) => a !== b;
function isSet(cards) {
  if (cards.length !== 0) {
    for (let i = 0; i < cards.length - 2; i++) {
      for (let j = i + 1; j < cards.length - 1; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          const a = cards[i];
          const b = cards[j];
          const c = cards[k];

          const colorCheck =
            (isSame(a.color, b.color) && isSame(b.color, c.color)) ||
            (isDifferent(a.color, b.color) &&
              isDifferent(b.color, c.color) &&
              isDifferent(a.color, c.color));

          const shapeCheck =
            (isSame(a.shape, b.shape) && isSame(b.shape, c.shape)) ||
            (isDifferent(a.shape, b.shape) &&
              isDifferent(b.shape, c.shape) &&
              isDifferent(a.shape, c.shape));

          const countCheck =
            (isSame(a.count, b.count) && isSame(b.count, c.count)) ||
            (isDifferent(a.count, b.count) &&
              isDifferent(b.count, c.count) &&
              isDifferent(a.count, c.count));

          const fillCheck =
            (isSame(a.fill, b.fill) && isSame(b.fill, c.fill)) ||
            (isDifferent(a.fill, b.fill) &&
              isDifferent(b.fill, c.fill) &&
              isDifferent(a.fill, c.fill));

          if (colorCheck && shapeCheck && countCheck && fillCheck) {
            return true;
          }
        }
      }
    }
  } else {
    return false;
  }
}

// регистрация пользователя
app.post("/registration", async (req, res) => {
  try {
    const nickname = req.body.nickname;
    const token = jwt.sign(
      {
        _id: nickname,
      },
      "key"
    );

    let player = { nickname: nickname, token: token, points: 0 };
    players.push(player);

    res.json({ status: "ok", token: token });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
    });
  }
});

// пользователи получают карты, которые есть на столе
app.get("/cards", (req, res) => {
  try {
    let setOnBoard = isSet(board);
    // игра заканчивается, когда заканчивается колода и на столе нет "Сета"
    if (deck.length === 0 && setOnBoard === false) {
      res.json({ status: "game end", players: players });
    } // добавляем 3 карты из колоды, если на столе нет сета
    else if (deck.length !== 0 && !!setOnBoard === false) {
      replenishBoard();
      res.json({ status: "ok", board: board });
    } else {
      res.json({ status: "ok", board: board });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
    });
  }
});

// получить всех игроков
app.get("/players", (req, res) => {
  try {
    res.json(players);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
    });
  }
});

// взятие сета
app.post("/cards", (req, res) => {
  try {
    let setFound = false;
    const cards = req.body.cards;
    const token = req.body.token;
    // проверяем есть ли выбраные игроком карты на столе
    for (let i = 0; i < cards.length; i++) {
      const foundObject = board.find(
        (obj) =>
          obj.count === cards[i].count &&
          obj.color === cards[i].color &&
          obj.shape === cards[i].shape &&
          obj.fill === cards[i].fill
      );
      if (!foundObject) {
        res.json({ message: "there are no such cards on the table" });
        return;
      }
    }
    // проверяем являются ли выбраные карты сетом
    setFound = isSet(cards);
    if (setFound) {
      for (let i = 0; i < 3; i++) {
        // убираем карты со стола
        const indexToRemove = board.findIndex((obj) => obj.id === cards[i].id);
        board.splice(indexToRemove, 1);
      }
      // добавляем новые из колоды
      replenishBoard();
      // добавляем очки игроку, который нашёл сет
      let player = players.find((x) => x.token === token);
      player.points++;
      res.json({ message: "sets found", board: board, player: player });
    } else {
      res.json({ message: "no sets found." });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      status: "error",
    });
  }
});

const port = 3000;
app.listen(port, () =>
  console.log(`Set game server listening on port ${port}!`)
);
