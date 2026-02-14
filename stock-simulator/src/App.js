import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const GAME_WIDTH = 640;
const GAME_HEIGHT = 480;
const PLAYER_WIDTH = 56;
const PLAYER_HEIGHT = 18;
const PLAYER_SPEED = 6;
const BULLET_SPEED = 8;
const INVADER_ROWS = 4;
const INVADER_COLS = 8;
const INVADER_WIDTH = 38;
const INVADER_HEIGHT = 26;
const INVADER_X_GAP = 18;
const INVADER_Y_GAP = 16;
const INVADER_DROP = 18;
const INVADER_SPEED_START = 1;
const TOTAL_INVADERS = INVADER_ROWS * INVADER_COLS;

function createInvaders() {
  const offsetX = 80;
  const offsetY = 70;
  const invaders = [];

  for (let row = 0; row < INVADER_ROWS; row += 1) {
    for (let col = 0; col < INVADER_COLS; col += 1) {
      invaders.push({
        id: `${row}-${col}`,
        x: offsetX + col * (INVADER_WIDTH + INVADER_X_GAP),
        y: offsetY + row * (INVADER_HEIGHT + INVADER_Y_GAP),
        alive: true,
      });
    }
  }

  return invaders;
}

const initialState = {
  playerX: GAME_WIDTH / 2 - PLAYER_WIDTH / 2,
  bullets: [],
  invaders: createInvaders(),
  direction: 1,
  invaderSpeed: INVADER_SPEED_START,
  score: 0,
  gameOver: false,
  victory: false,
};

export default function App() {
  const [game, setGame] = useState(initialState);
  const [isRunning, setIsRunning] = useState(true);
  const keysRef = useRef({ left: false, right: false, space: false });
  const spaceCooldownRef = useRef(false);

  const resetGame = useCallback(() => {
    setGame(initialState);
    setIsRunning(true);
    spaceCooldownRef.current = false;
  }, []);

  const aliveInvaders = useMemo(
    () => game.invaders.filter((invader) => invader.alive),
    [game.invaders]
  );

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "ArrowLeft") keysRef.current.left = true;
      if (event.key === "ArrowRight") keysRef.current.right = true;
      if (event.key === " ") keysRef.current.space = true;
      if (event.key.toLowerCase() === "r") resetGame();
    };

    const onKeyUp = (event) => {
      if (event.key === "ArrowLeft") keysRef.current.left = false;
      if (event.key === "ArrowRight") keysRef.current.right = false;
      if (event.key === " ") {
        keysRef.current.space = false;
        spaceCooldownRef.current = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [resetGame]);

  useEffect(() => {
    if (!isRunning) return undefined;

    const loop = setInterval(() => {
      setGame((prev) => {
        if (prev.gameOver || prev.victory) return prev;

        let nextPlayerX = prev.playerX;
        if (keysRef.current.left) {
          nextPlayerX = Math.max(0, nextPlayerX - PLAYER_SPEED);
        }
        if (keysRef.current.right) {
          nextPlayerX = Math.min(GAME_WIDTH - PLAYER_WIDTH, nextPlayerX + PLAYER_SPEED);
        }

        const nextBullets = prev.bullets
          .map((bullet) => ({ ...bullet, y: bullet.y - BULLET_SPEED }))
          .filter((bullet) => bullet.y > -10);

        if (keysRef.current.space && !spaceCooldownRef.current) {
          nextBullets.push({
            x: nextPlayerX + PLAYER_WIDTH / 2 - 2,
            y: GAME_HEIGHT - PLAYER_HEIGHT - 20,
          });
          spaceCooldownRef.current = true;
        }

        let minX = Infinity;
        let maxX = -Infinity;
        prev.invaders.forEach((invader) => {
          if (!invader.alive) return;
          minX = Math.min(minX, invader.x);
          maxX = Math.max(maxX, invader.x + INVADER_WIDTH);
        });

        let nextDirection = prev.direction;
        let shouldDrop = false;
        if (maxX + prev.invaderSpeed * prev.direction >= GAME_WIDTH || minX + prev.invaderSpeed * prev.direction <= 0) {
          nextDirection = prev.direction * -1;
          shouldDrop = true;
        }

        let scoreDelta = 0;
        const movedInvaders = prev.invaders.map((invader) => {
          if (!invader.alive) return invader;
          return {
            ...invader,
            x: invader.x + prev.invaderSpeed * nextDirection,
            y: shouldDrop ? invader.y + INVADER_DROP : invader.y,
          };
        });

        const survivingBullets = [];
        const collidedIds = new Set();

        nextBullets.forEach((bullet) => {
          const hitInvader = movedInvaders.find(
            (invader) =>
              invader.alive &&
              bullet.x < invader.x + INVADER_WIDTH &&
              bullet.x + 4 > invader.x &&
              bullet.y < invader.y + INVADER_HEIGHT &&
              bullet.y + 12 > invader.y
          );

          if (hitInvader) {
            collidedIds.add(hitInvader.id);
            scoreDelta += 100;
          } else {
            survivingBullets.push(bullet);
          }
        });

        const nextInvaders = movedInvaders.map((invader) =>
          collidedIds.has(invader.id) ? { ...invader, alive: false } : invader
        );

        const allDefeated = nextInvaders.every((invader) => !invader.alive);
        const reachedPlayer = nextInvaders.some(
          (invader) => invader.alive && invader.y + INVADER_HEIGHT >= GAME_HEIGHT - PLAYER_HEIGHT - 18
        );

        const nextSpeed = allDefeated
          ? prev.invaderSpeed
          : INVADER_SPEED_START +
            (TOTAL_INVADERS - nextInvaders.filter((invader) => invader.alive).length) * 0.05;

        return {
          ...prev,
          playerX: nextPlayerX,
          bullets: survivingBullets,
          invaders: nextInvaders,
          direction: nextDirection,
          invaderSpeed: nextSpeed,
          score: prev.score + scoreDelta,
          gameOver: reachedPlayer,
          victory: allDefeated,
        };
      });
    }, 16);

    return () => clearInterval(loop);
  }, [isRunning]);

  useEffect(() => {
    if (game.gameOver || game.victory) {
      setIsRunning(false);
    }
  }, [game.gameOver, game.victory]);

  return (
    <main className="app">
      <h1>インベーダーゲーム</h1>
      <p className="help">← → で移動 / Space でショット / R でリスタート</p>

      <div className="hud">
        <span data-testid="score">SCORE: {game.score}</span>
        <span data-testid="remaining">REMAINING: {aliveInvaders.length}</span>
      </div>

      <section
        className="game-field"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        aria-label="invader-game-field"
      >
        <div
          className="player"
          style={{
            width: PLAYER_WIDTH,
            height: PLAYER_HEIGHT,
            transform: `translate(${game.playerX}px, ${GAME_HEIGHT - PLAYER_HEIGHT - 8}px)`,
          }}
        />

        {game.bullets.map((bullet, index) => (
          <div
            key={`${bullet.x}-${bullet.y}-${index}`}
            className="bullet"
            style={{ transform: `translate(${bullet.x}px, ${bullet.y}px)` }}
          />
        ))}

        {game.invaders
          .filter((invader) => invader.alive)
          .map((invader) => (
            <div
              key={invader.id}
              className="invader"
              style={{
                width: INVADER_WIDTH,
                height: INVADER_HEIGHT,
                transform: `translate(${invader.x}px, ${invader.y}px)`,
              }}
            />
          ))}

        {game.gameOver && <div className="overlay">GAME OVER</div>}
        {game.victory && <div className="overlay">YOU WIN!</div>}
      </section>

      <button type="button" className="reset-button" onClick={resetGame}>
        リスタート
      </button>
    </main>
  );
}
