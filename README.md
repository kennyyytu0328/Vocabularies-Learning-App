# Vocabulary Learning Assistant

A lightweight, **static** web application that helps senior high school students learn English vocabulary through interactive games.

---

## ✨ Features
- **Two game modes**:
  - **Cloze (Fill‑in‑the‑blank)** – Vowels are masked, user types the full word.
  - **Definition Quiz** – Choose the correct Chinese definition among three options.
- **Level selection** – 6 difficulty levels, each showing the number of words.
- **Progress tracking** – Stores learning progress in `localStorage` and supports export / import as JSON.
- **Rich feedback** – Animated success/failure overlay with customizable display duration (default 4.2 s).
- **Offline‑first** – All assets are static; once loaded the app works without an internet connection.
- **Responsive UI** – Works on desktop and mobile browsers.

---

## 🛠️ Tech Stack
- **HTML5 / CSS3** – Vanilla markup and styling (no frameworks).
- **JavaScript (ES6+)** – Core logic.
- **sql.js** – Client‑side SQLite (loads `vocab.db` directly in the browser).
- **LocalStorage** – Persists user progress.

---

## 🚀 Getting Started
### Prerequisites
- **Node.js** (for installing `sql.js` via npm).
- **Python** (optional, for a quick static HTTP server).

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/Vocab-Learning-App.git
cd Vocab-Learning-App

# Install the sql.js library (adds the WASM files to /lib)
npm install sql.js
```
> The `npm install` step creates the `node_modules` folder and copies `sql-wasm.js` / `sql-wasm.wasm` into `lib/` (the project already contains a script that does this).

### Run the app locally
You can serve the static files with any HTTP server. The simplest way is using Python:
```bash
python -m http.server 8000
```
Then open your browser and navigate to `http://localhost:8000`.

> **Important:** Opening `index.html` directly via `file://` will not work because the browser blocks loading the `.wasm` and `.db` files.

---

## 📚 How to Use
1. **Select a level** – Click one of the six level buttons; the button shows the word count for that level.
2. **Choose a mode** – Toggle between *Cloze* and *Quiz* using the mode tabs.
3. **Answer** – Type the word (Cloze) or click the correct definition (Quiz).
4. **Feedback** – A green check or red cross overlay appears for 4.2 seconds before the next question loads.
5. **Progress** – The top‑right stats update automatically. Use the backup button to download a JSON file, and the restore button to upload a previously saved progress file.

---

## 🎨 Customisation
- **Feedback duration** – Adjust the timeout in `js/ui.js` (line 215) to change how long the overlay stays visible.
- **Styling** – Edit `css/style.css` to modify colors, fonts, or animations.
- **Word database** – Replace `vocab.db` with a new SQLite file (same schema) to add or modify vocabulary.

---

## 📦 Project Structure
```
Vocab-Learning-App/
├─ css/                # Stylesheets
├─ js/                 # JavaScript modules (ui, game, store, db, app)
├─ lib/                # sql.js WASM files
├─ vocab.db            # SQLite word database (≈6 000 entries)
├─ index.html          # Main entry point
├─ package.json        # npm metadata (sql.js dependency)
└─ README.md           # ← This file
```

---

## 🧪 Testing
Open the app in a browser and try both game modes. Verify that:
- The overlay appears and stays for the configured time.
- Progress is saved after each answer and persists after a page reload.
- Exported JSON can be imported to restore progress.

---

## 📜 License
This project is licensed under the **MIT License** – feel free to use, modify, and share.

---

## 🙏 Acknowledgements
- **sql.js** – https://github.com/sql-js/sql.js
- Icons from **Google Material Icons**
- Inspiration from modern language‑learning web apps.

---

*Happy learning!*
