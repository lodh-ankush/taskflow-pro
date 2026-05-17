# TaskFlow Pro 🎯

&gt; A blazing-fast, offline-capable task manager built with vanilla JavaScript. No frameworks. No dependencies. Just pure browser-native power.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-6366f1)]()
[![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-ES6%2B-f7df1e)]()

---

## ✨ Features

### Core
- **⚡ Zero Dependencies** — Pure ES6+ JavaScript, no build step required
- **💾 Local Persistence** — All data saved to `localStorage` automatically
- **📱 PWA Ready** — Installable on desktop & mobile, works offline via Service Worker
- **🌙 Dark Mode** — Toggle or auto-detects system preference

### Task Management
- **📝 Smart Add Form** — Title, priority, category, due date, and tags
- **✏️ Inline Editing** — Click any task to open the full edit modal
- **☑️ Quick Complete** — Checkbox toggle with animated feedback
- **🗑️ Undo Delete** — 6-second toast with one-click restore
- **🔄 Priority Cycling** — Click the priority badge to cycle Low → Medium → High
- **🏷️ Tag Filtering** — Click any `#tag` to instantly filter the list

### Organization
- **📂 6 Categories** — Personal, Work, Shopping, Health, Finance, Education (color-coded)
- **🔍 Live Search** — Searches titles and tags in real-time
- **🔽 Smart Sorting** — Manual (drag), Due Date, Priority, Created, Alphabetical
- **📊 Progress Ring** — Animated SVG ring showing completion percentage
- **📈 Live Stats** — Total, Done, Pending, and Overdue counters with pop animations

### Interaction
- **🖱️ Drag & Drop Reordering** — Grab the grip handle to reorder tasks (manual sort only)
- **⌨️ Full Keyboard Navigation** — Vim-inspired shortcuts (J/K, Space, Enter, D, etc.)
- **🎯 Focus Mode** — Dim all chrome to concentrate on tasks only
- **☑️ Bulk Actions** — Multi-select tasks to complete or delete in batch
- **💡 Draft Auto-Save** — Unsubmitted input persists across page refreshes

### Delight
- **🎊 Confetti Physics** — Canvas particle explosion when all tasks are completed
- **🔊 UI Sound Effects** — Web Audio API tones for add/complete/delete (toggleable)
- **🍞 Rich Toasts** — Success, error, warning, and undo notifications with progress bars
- **📤 Data Export** — Download tasks as JSON or CSV

---

## 🚀 Quick Start

```bash
git clone https://github.com/yourusername/taskflow-pro.git
cd taskflow-pro

# Option 1: Python
python -m http.server 8000

# Option 2: Node
npx serve .

# Option 3: VS Code
# Right-click index.html → "Open with Live Server"
