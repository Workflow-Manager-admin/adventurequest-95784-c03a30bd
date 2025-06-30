import React, { useState, useEffect, useRef } from "react";
import "./App.css";

/**
 * Minimalistic RPG color palette (see package README):
 * -- primary: #1976d2
 * -- secondary: #424242
 * -- accent: #ffb300
 * Main layout: Map/Inventory (left), Game view (center), Action buttons (right), Status at top.
 */

/** Game instructions (in-app modal) */
function HowToPlayText({ setShowHelp }) {
  return (
    <div style={{ textAlign: "left" }}>
      <h2 style={{ marginTop: 0 }}>How to Play</h2>
      <ul style={{ marginBottom: 10, marginTop: 0 }}>
        <li>
          <b>Move:</b> Arrow keys or W/A/S/D, or click on adjacent map tiles
        </li>
        <li>
          <b>Attack:</b> Press <b>Space</b> or click "🗡️ Attack" – must face enemy
        </li>
        <li>
          <b>Inventory:</b> Press <b>I</b> or click "🧳 Inventory"
        </li>
        <li>
          <b>Use Potion:</b> Open inventory and click "Use" on a Potion to heal 5 HP
        </li>
        <li>
          <b>Goal:</b> Defeat enemies (👾), collect potions (🧪), and survive!
        </li>
        <li>
          Enemies may counterattack. If your HP drops to 0, you'll respawn.
        </li>
      </ul>
      <div style={{ fontSize: "0.98rem", color: "#555" }}>
        Tip: Use theme toggle (top right) for dark/light mode.<br />
        Keys: <b>↑,↓,←,→</b> or <b>WASD</b> to move, <b>Space</b> to attack, <b>I</b> inventory.
      </div>
      <button
        className="close-btn"
        style={{ marginTop: 18, width: "100%" }}
        onClick={() => setShowHelp(false)}
      >
        Close
      </button>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // Game state hooks
  const [theme, setTheme] = useState("light");
  const [player, setPlayer] = useState({
    x: 2,
    y: 2,
    hp: 10,
    maxHp: 10,
    inventory: ["Potion"],
    facing: "down",
  });
  const [map, setMap] = useState(generateMap(8, 8));
  const [message, setMessage] = useState("Explore the map!");
  const [enemy, setEnemy] = useState(spawnEnemy(8, 8));
  const [showInventory, setShowInventory] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e) {
      if (showInventory) return; // Don't move while viewing inventory
      if (["ArrowUp", "w"].includes(e.key)) movePlayer("up");
      if (["ArrowDown", "s"].includes(e.key)) movePlayer("down");
      if (["ArrowLeft", "a"].includes(e.key)) movePlayer("left");
      if (["ArrowRight", "d"].includes(e.key)) movePlayer("right");
      if (e.key === " ") attackEnemy();
      if (e.key === "i") setShowInventory((v) => !v);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line
  }, [player, enemy, showInventory]);

  // Apply theme to root
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((t) => (t === "light" ? "dark" : "light"));
  };

  // PUBLIC_INTERFACE
  function movePlayer(dir) {
    let { x, y } = player;
    let newX = x, newY = y;
    let facing = dir;
    if (dir === "up") newY = Math.max(y - 1, 0);
    if (dir === "down") newY = Math.min(y + 1, map.length - 1);
    if (dir === "left") newX = Math.max(x - 1, 0);
    if (dir === "right") newX = Math.min(x + 1, map[0].length - 1);

    // Prevent walking into enemy
    if (enemy && enemy.x === newX && enemy.y === newY && enemy.hp > 0) {
      setMessage("You bump into an enemy! Try attacking (Space)");
      setPlayer({ ...player, facing });
      return;
    }
    setPlayer((p) => ({ ...p, x: newX, y: newY, facing }));
    setMessage("You moved " + dir + ".");
  }

  // PUBLIC_INTERFACE
  function attackEnemy() {
    // Can attack if facing enemy
    if (!enemy || enemy.hp <= 0) {
      setMessage("No enemy to attack.");
      return;
    }
    let dx = 0, dy = 0;
    if (player.facing === "up") dy = -1;
    if (player.facing === "down") dy = 1;
    if (player.facing === "left") dx = -1;
    if (player.facing === "right") dx = 1;
    if (
      player.x + dx === enemy.x &&
      player.y + dy === enemy.y
    ) {
      // Hit!
      let newHp = Math.max(enemy.hp - 2, 0);
      setEnemy({ ...enemy, hp: newHp });
      setMessage("You attack the enemy!");
      if (newHp === 0) {
        setMessage("Enemy defeated! 🎉");
        setTimeout(() => {
          setEnemy(spawnEnemy(map[0].length, map.length));
          setMessage("A new enemy appears...");
        }, 1200);
      } else {
        // Enemy counters
        setTimeout(() => {
          if (Math.random() > 0.3) enemyAttack();
        }, 550);
      }
    } else {
      setMessage("No enemy in front to attack!");
    }
  }

  // PUBLIC_INTERFACE
  function enemyAttack() {
    setPlayer((p) => {
      let dmg = Math.ceil(Math.random() * 2);
      let newHp = Math.max(p.hp - dmg, 0);
      setMessage(`Enemy hits you for ${dmg} damage.`);
      if (newHp <= 0) {
        setTimeout(() => {
          setMessage("You have been defeated! Respawning...");
          setPlayer({
            ...p,
            x: 2,
            y: 2,
            hp: p.maxHp,
            facing: "down",
          });
        }, 1200);
      }
      return { ...p, hp: newHp };
    });
  }

  // PUBLIC_INTERFACE
  function usePotion() {
    if (!player.inventory.includes("Potion")) {
      setMessage("You have no potions!");
      return;
    }
    setMessage("You drink a Potion and restore 5 HP.");
    setPlayer((p) => ({
      ...p,
      hp: Math.min(p.hp + 5, p.maxHp),
      inventory: p.inventory.filter((i, idx, arr) => {
        let seen = 0;
        if (i === "Potion" && !seen) {
          seen = 1;
          return false;
        }
        return true;
      }),
    }));
    setShowInventory(false);
  }

  // PUBLIC_INTERFACE
  function pickupPotion() {
    setPlayer((p) => ({
      ...p,
      inventory: [...p.inventory, "Potion"],
    }));
    setMessage("You found a Potion!");
  }

  // Game tile renderer
  function renderMap() {
    let display = [];
    for (let y = 0; y < map.length; y++) {
      let row = [];
      for (let x = 0; x < map[y].length; x++) {
        let here = null;
        if (player.x === x && player.y === y) here = <PlayerSprite facing={player.facing} />;
        else if (enemy && enemy.x === x && enemy.y === y && enemy.hp > 0)
          here = <EnemySprite />;
        else if (map[y][x] === "P") // Place a Potion
          here = <span role="img" aria-label="Potion">🧪</span>;
        row.push(
          <div
            key={x}
            className="tile"
            style={{
              border:
                player.x === x && player.y === y
                  ? "2px solid #ffb300"
                  : "1px solid var(--border-color)",
            }}
            onClick={() => tryMoveTo(x, y)}
          >
            {here}
          </div>
        );
      }
      display.push(<div className="map-row" key={y}>{row}</div>);
    }
    return <div className="map">{display}</div>;
  }

  function tryMoveTo(x, y) {
    // Only allow adjacent moves by click for demo
    if (
      (Math.abs(player.x - x) + Math.abs(player.y - y) === 1) &&
      (!enemy || enemy.x !== x || enemy.y !== y)
    ) {
      let dx = x - player.x;
      let dy = y - player.y;
      let dir = dx === 1 ? "right" : dx === -1 ? "left" : dy === 1 ? "down" : "up";
      movePlayer(dir);
    }
  }

  // Pickup potion if on a potion tile
  useEffect(() => {
    if (map[player.y][player.x] === "P") {
      pickupPotion();
      setMap(clearTile(map, player.x, player.y));
    }
    // eslint-disable-next-line
  }, [player.x, player.y]);

  // Render
  return (
    <div className="rpg-app App">
      {/* How to Play floating button */}
      <button
        className="howtoplay-btn"
        aria-label="How to Play"
        title="How to Play"
        style={{
          position: "absolute",
          left: 16,
          top: 16,
          zIndex: 110,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          borderRadius: 9,
          padding: "7px 18px",
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.025em",
          boxShadow: "0 1px 7px #ccd6ff33",
          cursor: "pointer",
        }}
        onClick={() => setShowHelp(true)}
      >
        ❓ How to Play
      </button>
      {/* Modal */}
      {showHelp && (
        <div style={{
          position:"fixed",
          top:0,left:0,right:0,bottom:0,
          background: "rgba(30,40,60,0.24)",
          zIndex:199,
          display: "flex",
          alignItems:"center",
          justifyContent:"center"
        }}>
          <div style={{
            background:"#fff",
            color:"#222",
            minWidth:330,
            maxWidth:420,
            borderRadius:18,
            boxShadow:"0 6px 28px #26323833",
            padding:"32px 24px",
            border:"2.5px solid #1976d2"
          }}>
            <HowToPlayText setShowHelp={setShowHelp} />
          </div>
        </div>
      )}
      <StatusBar
        hp={player.hp}
        maxHp={player.maxHp}
        message={message}
      />
      <div className="rpg-container">
        <LeftPanel
          inventory={player.inventory}
          show={showInventory}
          setShow={setShowInventory}
          usePotion={usePotion}
        />
        <main className="main-canvas">
          <div className="canvas-title">Adventure Map</div>
          {renderMap()}
          <div className="legend-row">
            <span><PlayerSprite /> = You</span>
            <span><EnemySprite /> = Enemy</span>
            <span role="img" aria-label="Potion">🧪</span> = Potion
          </div>
        </main>
        <RightPanel
          onMove={movePlayer}
          onAttack={attackEnemy}
          onInventory={() => setShowInventory((v) => !v)}
          facing={player.facing}
        />
      </div>
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
    </div>
  );
}

// Helpers & Components

// PUBLIC_INTERFACE
function StatusBar({ hp, maxHp, message }) {
  // Minimalist status bar
  return (
    <div className="status-bar">
      <div className="hp">
        HP: <span style={{ color: "#ff1744", fontWeight: 600 }}>{hp}</span> / {maxHp}
      </div>
      <div className="msg">{message}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
function LeftPanel({ inventory, show, setShow, usePotion }) {
  // Panel for inventory
  return (
    <aside className="left-panel">
      <button className="inv-btn" onClick={() => setShow((v) => !v)}>
        🧳 Inventory ({inventory.length})
      </button>
      {show && (
        <div className="inv-modal">
          <h3>Inventory</h3>
          <ul>
            {inventory.length === 0 && <li>Empty</li>}
            {inventory.map((item, idx) => (
              <li key={idx}>
                {item === "Potion" ? (
                  <span>
                    🧪 Potion{" "}
                    <button className="use-btn" onClick={usePotion}>
                      Use
                    </button>
                  </span>
                ) : (
                  item
                )}
              </li>
            ))}
          </ul>
          <button className="close-btn" onClick={() => setShow(false)}>
            Close
          </button>
        </div>
      )}
    </aside>
  );
}

// PUBLIC_INTERFACE
function RightPanel({ onMove, onAttack, onInventory, facing }) {
  // Simple action/controls panel
  return (
    <aside className="right-panel">
      <div className="controls-group">
        <div>
          <button className={`ctrl-btn`} onClick={() => onMove("up")}>
            ▲
          </button>
        </div>
        <div>
          <button className={`ctrl-btn`} onClick={() => onMove("left")}>
            ◀
          </button>
          <button className={`ctrl-btn`} onClick={() => onMove("down")}>
            ▼
          </button>
          <button className={`ctrl-btn`} onClick={() => onMove("right")}>
            ▶
          </button>
        </div>
        <div>
          <button className="act-btn" onClick={onAttack}>
            🗡️ Attack
          </button>
        </div>
        <div>
          <button className="act-btn" onClick={onInventory}>
            🧳 Inventory
          </button>
        </div>
      </div>
      <div className="keys-note">
        [Use arrow keys, WASD, <b>Space</b>=Attack, <b>I</b>=Inventory]
      </div>
    </aside>
  );
}

// PUBLIC_INTERFACE
function PlayerSprite({ facing }) {
  // Minimalistic hero icon (face direction as emoji)
  let face = "😀";
  switch (facing) {
    case "up":
      face = "😐";
      break;
    case "down":
      face = "😀";
      break;
    case "left":
      face = "😏";
      break;
    case "right":
      face = "😎";
      break;
    default:
      face = "😀";
  }
  return (
    <span role="img" aria-label="Hero">
      {face}
    </span>
  );
}

// PUBLIC_INTERFACE
function EnemySprite() {
  // Minimalistic enemy (goblin)
  return (
    <span role="img" aria-label="Goblin">
      👾
    </span>
  );
}

// ---- Utility functions ----

function generateMap(cols, rows) {
  // Returns 2D array with some potion tiles randomly placed
  const m = [];
  for (let y = 0; y < rows; y++) {
    let row = [];
    for (let x = 0; x < cols; x++) {
      row.push(".");
    }
    m.push(row);
  }
  // Place a couple potions randomly
  for (let i = 0; i < 2; i++) {
    let px = Math.floor(Math.random() * cols);
    let py = Math.floor(Math.random() * rows);
    m[py][px] = "P";
  }
  return m;
}

function spawnEnemy(cols, rows) {
  // Enemy placed at random empty cell far from origin
  const startX = Math.min(cols - 1, Math.floor(Math.random() * cols));
  const startY = Math.min(rows - 1, Math.floor(Math.random() * rows));
  // Not placing on player start
  let x = startX;
  let y = startY;
  while ((x === 2 && y === 2) || (Math.abs(x - 2) + Math.abs(y - 2) < 4)) {
    x = Math.floor(Math.random() * cols);
    y = Math.floor(Math.random() * rows);
  }
  return {
    x,
    y,
    hp: 5 + Math.floor(Math.random() * 5),
  };
}

function clearTile(m, x, y) {
  // Returns a new map with the specified tile cleared
  const newM = m.map((row, rIdx) =>
    row.map((cell, cIdx) => (rIdx === y && cIdx === x ? "." : cell))
  );
  return newM;
}

export default App;
