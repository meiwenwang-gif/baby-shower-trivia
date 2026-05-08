# 👶 Baby Shower Trivia — Multiplayer Game

A pixel-art, 8-bit style multiplayer trivia game built for baby showers.  
Players join via a shared room code and move their characters into answer zones.

---

## 🚀 Quick Start (Local)

### Prerequisites
- [Node.js](https://nodejs.org/) v16+ installed

### Steps

```bash
# 1. Clone or unzip the project
cd baby-shower-trivia

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open your browser
# → http://localhost:3000
```

One player clicks **Join / Create Room** (leave the code blank) to create a room.  
They share the **5-letter room code** with others, who enter it on the same page.  
The host presses ▶ **Start Game** when everyone is ready.

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| Arrow Keys / WASD | Move character |
| Mobile | On-screen D-pad appears automatically |

---

## 🌐 Deploy to the Web

### Option A: Railway (Easiest — Free tier)
1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Railway auto-detects Node.js and runs `npm start`
4. Done! Share the Railway URL with your guests.

### Option B: Render (Free tier)
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your repo, set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Deploy and share the URL.

### Option C: Fly.io
```bash
npm install -g flyctl
fly auth login
fly launch        # follow prompts
fly deploy
```

### Option D: Heroku
```bash
heroku create
git push heroku main
```

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT`   | `3000`  | Port the server listens on |

---

## 📋 Game Flow

1. **Lobby** — Players join via room code, choose name/color/avatar
2. **Host starts** — All 10 questions play sequentially
3. **Each question** — 15-second countdown, players move into zone A/B/C/D
4. **Reveal** — Correct zone glows gold, wrong players get splashed with milk!
5. **Scoreboard** — Live leaderboard after each question
6. **Final scores** — Winner crowned at the end 🏆

---

## 🍼 Baby Shower Questions (Built-in)

1. What is the average length of a human pregnancy?  
2. Which sense is most developed at birth?  
3. How many bones does a newborn have?  
4. At what age do most babies start walking?  
5. What is the soft spot on a baby's head called?  
6. How much does the average newborn weigh?  
7. Babies are born without which of the following?  
8. What color is a newborn's first poop (meconium)?  
9. Which lullaby starts with "Hush, little baby"?  
10. What does APGAR stand for?  

---

## 🛠 Project Structure

```
baby-shower-trivia/
├── server.js          # Node.js + Socket.io game server
├── package.json
├── public/
│   └── index.html     # Full HTML5 canvas game client
└── README.md
```

---

## ✏️ Customizing Questions

Edit the `QUESTIONS` array in `server.js`:

```javascript
{
  question: "Your question here?",
  answers: ["Option A", "Option B", "Option C", "Option D"],
  correct: 0   // 0=A, 1=B, 2=C, 3=D
}
```

---

## 📡 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5 Canvas, Vanilla JS, CSS3 |
| Backend | Node.js + Express |
| Realtime | Socket.io (WebSockets) |
| Fonts | Press Start 2P (pixel), Nunito |
| Hosting | Any Node.js host (Railway, Render, Fly, Heroku) |

---

## 💡 Tips for Google Meet Use

- Share your screen showing the **game window** in Meet
- Players join on their **own phones/laptops** (no screen share needed for them)
- Use Railway/Render so everyone gets a public URL
- The game is optimized for **screen share** — big text, high contrast zones

---

Made with 💕 for baby showers everywhere!
