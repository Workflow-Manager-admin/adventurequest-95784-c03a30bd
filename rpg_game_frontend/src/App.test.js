import React from "react";
import { render, screen, fireEvent, act, within } from "@testing-library/react";
import App from "./App";

// Utility selectors and helpers for RPG UI
const getHP = () => screen.getByText(/HP:/);
const getStatusBarMsg = () => screen.getByText((content, node) =>
  node.className?.includes("msg") && !!content.trim()
);
const getInventoryBtn = () => screen.getByRole("button", { name: /inventory/i });
const getThemeToggleBtn = () => screen.getByRole("button", { name: /switch to/i });
const getAttackBtn = () => screen.getByRole("button", { name: /attack/i });
const getPotionIcon = () => screen.queryByRole("img", { name: /potion/i });

describe("RPG Game UI Integration Tests", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.spyOn(global.Math, "random").mockImplementation(() => 0.7); // deterministic spawn/damage
  });
  afterAll(() => {
    jest.useRealTimers();
    global.Math.random.mockRestore();
  });

  test("renders core layout elements", () => {
    render(<App />);
    expect(screen.getByText(/Adventure Map/)).toBeInTheDocument();
    expect(screen.getByText(/HP:/)).toBeInTheDocument();
    expect(getInventoryBtn()).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /attack/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /switch to/i })).toBeInTheDocument();
    // Game tiles
    expect(screen.getAllByRole("img", { name: /hero/i })[0]).toBeInTheDocument();
    expect(screen.getByText(/Use arrow keys/i)).toBeInTheDocument();
  });

  test("status bar updates on move", () => {
    render(<App />);
    fireEvent.click(screen.getByText("▲")); // up
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("moved up");
    fireEvent.click(screen.getByText("▶")); // right
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("moved right");
    fireEvent.click(screen.getByText("▼")); // down
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("moved down");
    fireEvent.click(screen.getByText("◀")); // left
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("moved left");
  });

  test("theme toggle switches theme", () => {
    render(<App />);
    const themeButton = getThemeToggleBtn();
    // Expect starts in light mode
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    fireEvent.click(themeButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    fireEvent.click(themeButton);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  test("inventory panel opens and closes, potion use works", () => {
    render(<App />);
    fireEvent.click(getInventoryBtn());
    expect(screen.getByRole("heading", { name: /inventory/i })).toBeInTheDocument();
    // Use potion
    const useBtn = screen.getByRole("button", { name: /^use$/i });
    expect(useBtn).toBeInTheDocument();
    fireEvent.click(useBtn);
    // Modal closes and message updates
    expect(screen.queryByRole("heading", { name: /inventory/i })).not.toBeInTheDocument();
    expect(getStatusBarMsg().textContent).toContain("restore 5 HP");
  });

  test("map tiles and player/enemy render correctly", () => {
    render(<App />);
    // At least one enemy icon present
    expect(screen.getByRole("img", { name: "Hero" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Goblin" })).toBeInTheDocument();
    expect(screen.getAllByRole("img", { name: "Hero" })).toHaveLength(1);
    // Check for potions
    expect(screen.getAllByRole("img", { name: "Potion" }).length).toBeGreaterThan(0);
  });

  test("character can move by clicking map tile", () => {
    render(<App />);
    // Find player position and adjacent tile
    const playerIcon = screen.getByRole("img", { name: "Hero" });
    const tileDiv = playerIcon.closest(".tile");
    const mapRow = tileDiv.closest(".map-row");
    // Try clicking one to the right (simulate starting at 2,2)
    const allTiles = within(mapRow).getAllByRole("img", { hidden: true });
    // We'll just click the next div sibling as proof of concept; actual coordinate logic handled by App
    tileDiv.nextSibling && fireEvent.click(tileDiv.nextSibling);
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("moved");
  });

  test("keyboard controls: WASD and space work", () => {
    render(<App />);
    act(() => {
      fireEvent.keyDown(window, { key: "w" }); // up
      fireEvent.keyDown(window, { key: "a" }); // left
      fireEvent.keyDown(window, { key: "d" }); // right
      fireEvent.keyDown(window, { key: "s" }); // down
    });
    expect(getStatusBarMsg().textContent.toLowerCase()).toMatch(/moved/);

    // Space to attack. If facing enemy fails, show friendly text, not error
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("attack");
  });

  test("enemy can be attacked and defeated, respawns", () => {
    render(<App />);
    // Place player in front of enemy for mock
    // Find enemy and get its parent .tile div, move player next to it
    const enemyIcon = screen.getByRole("img", { name: "Goblin" });
    const enemyTileDiv = enemyIcon.closest(".tile");
    // Fake moving player next to it: just call attack till defeat (state mocked for determinism)
    for (let i = 0; i < 3; ++i) {
      fireEvent.click(getAttackBtn());
      act(() => { jest.advanceTimersByTime(600); });
    }
    expect(getStatusBarMsg().textContent.toLowerCase()).toMatch(/defeated/);
    act(() => { jest.advanceTimersByTime(1300); });
    expect(getStatusBarMsg().textContent.toLowerCase()).toMatch(/new enemy/i);
    // A new goblin appears (test respawn)
    expect(screen.getByRole("img", { name: "Goblin" })).toBeInTheDocument();
  });

  test("shows message if no enemy to attack", () => {
    render(<App />);
    // Remove enemy with repeated attacks
    for (let i = 0; i < 3; ++i) {
      fireEvent.click(getAttackBtn());
      act(() => { jest.advanceTimersByTime(600); });
    }
    fireEvent.click(getAttackBtn());
    expect(getStatusBarMsg().textContent.toLowerCase()).toContain("no enemy");
  });

  test("picking up potion from map updates inventory", () => {
    render(<App />);
    // Simulate stepping onto a potion
    // Find a potion tile that's NOT under player
    const potionTiles = screen.getAllByRole("img", { name: "Potion" });
    if (potionTiles.length > 0) {
      // Find the .tile parent and click it to move
      const pDiv = potionTiles[0].closest(".tile");
      if (pDiv) {
        fireEvent.click(pDiv);
        expect(getStatusBarMsg().textContent.toLowerCase()).toMatch(/found a potion/i);
        fireEvent.click(getInventoryBtn());
        expect(screen.getByText(/potion/i)).toBeInTheDocument();
      }
    }
  });
});

describe("StatusBar Component", () => {
  test("renders correctly with given stats and message", () => {
    // Importing StatusBar directly trick, if needed
    const { StatusBar } = require("./App");
    render(<StatusBar hp={5} maxHp={10} message="Test message" />);
    expect(screen.getByText(/HP:/)).toHaveTextContent("5");
    expect(screen.getByText(/Test message/i)).toBeInTheDocument();
  });
});

describe("LeftPanel Component", () => {
  test("shows inventory and can use potion", () => {
    const { LeftPanel } = require("./App");
    const usePotion = jest.fn();
    const setShow = jest.fn();
    render(
      <LeftPanel
        inventory={["Potion", "Key"]}
        show={true}
        setShow={setShow}
        usePotion={usePotion}
      />
    );
    expect(screen.getByText(/inventory/i)).toBeInTheDocument();
    expect(screen.getByText(/Potion/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/^Use$/i)); // The "Use" button
    expect(usePotion).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/close/i));
    expect(setShow).toHaveBeenCalledWith(false);
  });
});

describe("RightPanel Component", () => {
  test("calls onMove, onAttack, onInventory", () => {
    const { RightPanel } = require("./App");
    const onMove = jest.fn();
    const onAttack = jest.fn();
    const onInventory = jest.fn();
    render(
      <RightPanel
        onMove={onMove}
        onAttack={onAttack}
        onInventory={onInventory}
        facing="down"
      />
    );
    // Test move buttons
    fireEvent.click(screen.getByText("▲"));
    fireEvent.click(screen.getByText("◀"));
    fireEvent.click(screen.getByText("▼"));
    fireEvent.click(screen.getByText("▶"));
    expect(onMove).toHaveBeenCalledTimes(4);

    fireEvent.click(screen.getByText(/attack/i));
    expect(onAttack).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/inventory/i));
    expect(onInventory).toHaveBeenCalled();
  });
});
