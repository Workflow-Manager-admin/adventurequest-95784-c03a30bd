# RPG Game Frontend

A minimal React frontend for a lightweight action/adventure RPG game. Play with keyboard/mouse, manage inventory, and battle enemies on a dynamic map.

## Features
- 🌟 Minimal dependencies (React, CSS only)
- 🎮 Keyboard & mouse controls for classic RPG action
- 😈 Enemy encounters and combat
- 🧳 Inventory with healing potions
- 🌓 Light & dark theme toggle
- ❓ Built-in "How to Play" guide in the app

---

## How to Run Locally

### 1. Install Node.js
Ensure Node.js and npm are installed. Download from [nodejs.org](https://nodejs.org/).

### 2. Install project dependencies
Open a terminal in this directory and run:
```sh
npm install
```
*All required dependencies (React, ReactDOM, react-scripts, etc.) will be installed.*

**For testing:**  
This app uses [@testing-library/jest-dom](https://www.npmjs.com/package/@testing-library/jest-dom) for enhanced assertions.  
It is included as a dev dependency. If you encounter issues running tests, (re)install it with:
```sh
npm install --save-dev @testing-library/jest-dom
```

### 3. Start the development server
```sh
npm start
```
This will open the game in your browser at [http://localhost:3000](http://localhost:3000).

### 4. Run tests (optional)
```sh
npm test
```

### 5. Build for production
```sh
npm run build
```

---

## In-Game Instructions

- Click the **❓ How to Play** button (top-left of the game) for controls, movement, goals, and combat details.
- Standard controls: Arrow keys or WASD to move, Space to attack, 'I' to open inventory.
- Collect potions on the map to heal, defeat enemies to survive!

---

## File Structure
- `src/App.js`: Main game logic and UI components.
- `src/App.css`: Themes and UI styling.
- `src/index.js`: Entry point.
- `src/App.test.js`: UI/tests using React Testing Library.

---

## Customization
You can freely modify UI styles in `src/App.css` and game logic/components in `src/App.js`.

---

## Learn More
- [React documentation](https://reactjs.org/)
- [Create React App User Guide](https://facebook.github.io/create-react-app/docs/getting-started)

