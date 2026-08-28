# Gender Reveal Multi-Screen Interactive Party Web Game

A complete multi-screen interactive party game system for Gender Reveal events, featuring real-time synchronization across player phones, TV display, and host controller.

## Features

- **6-File Architecture**: Pure frontend implementation with no build process required
- **Real-time Sync**: Firebase Realtime Database for instant multi-device synchronization
- **12 Game Phases**: Complete game flow from onboarding to grand reveal
- **Modern Detective Theme**: Cinematic mystery aesthetic with gender reveal party elements
- **Mobile-First**: Optimized for player phones with responsive design
- **TV-Optimized**: Large typography and high contrast for big screen displays
- **Admin Panel**: Content management for questions, bingo phrases, and clues
- **Secure**: Password protection for admin and secret functions

## File Structure

```
/
├── config.js           # Central configuration and utilities
├── index.html          # Player mobile interface
├── display.html        # TV/Projector big screen
├── host.html           # Host control dashboard
├── admin.html          # Content management
└── secret.html         # Secret gender setting
```

## Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS, Tailwind CSS CDN
- **Database**: Firebase Realtime Database (Compat API v10.8.0)
- **Audio**: Howler.js v2.2.4
- **Effects**: canvas-confetti v1.9.3
- **QR Codes**: qrcodejs v1.0.0

## Deployment

This project is designed for GitHub Pages deployment:

1. Push all files to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Access the game at `https://username.github.io/repository-name/`

## Game Phases

1. **ONBOARDING**: Player registration and login
2. **BACKGROUND_STORY**: Game introduction
3. **GAME1_RULES**: Quiz phase instructions
4. **GAME1_QUIZ**: Group quiz (3 questions) + Common quiz (5 questions)
5. **GAME1_SETTLE**: Score calculation and clue rewards
6. **GAME2_RULES**: Bingo phase instructions
7. **GAME2_BINGO**: Evidence collection with 3×3 bingo boards
8. **GAME2_SETTLE**: Bingo completion rewards
9. **GAME3_RULES**: Team battle instructions
10. **GAME3_TEAM_SELECT**: Team BOY vs TEAM GIRL selection
11. **FINAL_CHOICE**: Final gender prediction based on clues
12. **GRAND_REVEAL**: Cinematic gender reveal with confetti

## Setup Instructions

### 1. Firebase Configuration

The project uses a pre-configured Firebase project. The configuration is already set in `config.js`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCEqNyvMHsTiGu-8q3WoK1eBHWJaw8KCJA",
  authDomain: "gender-reveal-party-905de.firebaseapp.com",
  databaseURL: "https://gender-reveal-party-905de-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gender-reveal-party-905de",
  storageBucket: "gender-reveal-party-905de.firebasestorage.app",
  messagingSenderId: "972856514197",
  appId: "1:972856514197:web:d18fd6e881e6992bdfad9c"
};
```

### 2. Initial Setup

1. Open `secret.html` and enter password `1125`
2. Set the secret gender (BOY or GIRL)
3. Lock the selection to prevent accidental changes

### 3. Content Management

1. Open `admin.html` and enter password `1125`
2. Manage group quiz questions (7 groups × 3 questions each)
3. Manage common quiz questions (5 questions)
4. Manage bingo phrases (30 phrases recommended)
5. Manage clues (9 clues: 3× Level 1, 2, 3)

### 4. Game Execution

1. Open `display.html` on TV/Projector
2. Open `host.html` on host device
3. Players scan QR code or use URL from display to join
4. Host progresses through game phases using control panel

## Game Mechanics

### Scoring System

- **Group Quiz**: 1000 points per correct answer
- **Common Quiz**: 1000 + (remaining seconds × 33.3) points
- **No penalties** for wrong answers or timeouts

### Clue Rewards

- **Game 1**: Rank 1-10 → Level 3, Rank 11-20 → Level 2, Rank 21+ → Level 1
- **Game 2**: Top 10 (2 lines) → Level 3, 1 line → Level 1+2, 0 lines → Level 1
- **Game 3**: Winning team → Level 3+2

### Clue Overflow Logic

Clues are awarded with downward overflow:
- Level 3 full → Level 2
- Level 2 full → Level 1
- Level 1 full → No reward (100% complete)

### Bingo System

- Each player gets random 3×3 board with 9 unique phrases
- Host draws phrases randomly without repetition
- Players manually mark matching phrases
- First 10 players to complete 2 lines get Level 3 clues
- Ties at cutoff position all receive same reward

## Visual Design

### Color Palette (Pre-Reveal)

- **Primary**: Charcoal (#1a1a1a), Ink (#0d0d0d), Slate (#334155)
- **Secondary**: Off-white (#f8f8f8), Paper (#fafaf9)
- **Accents**: Electric Blue (#3b82f6), Coral (#f97316), Pink (#ec4899), Amber (#f59e0b)

### Typography

- **Headings**: Space Grotesk, Sora, DM Sans (Geometric Sans)
- **Labels/Mono**: IBM Plex Mono, JetBrains Mono
- **Style**: Large, kinetic, editorial with uppercase labels

### Design Principles

- 70% Modern Detective/Mystery + 30% Gender Reveal Party
- Evidence board styling for bingo
- Case file styling for clues
- Cinematic game show aesthetic for display
- No emojis, no excessive glassmorphism

## Security Notes

This is designed as a one-time private party application:

- Firebase config is exposed (acceptable for this use case)
- Database has read/write=true (acceptable for private party)
- Admin/Secret pages have basic password protection (1125)
- No authentication system (PIN-based player identification)

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- Requires internet connection for Firebase

## Troubleshooting

### Players can't connect
- Check Firebase connection status in admin panel
- Verify internet connection
- Ensure correct URL is being used

### QR code not working
- Ensure QR code library is loaded
- Check that URL is accessible
- Try manual URL entry

### Game not progressing
- Check host control panel for current phase
- Verify Firebase sync is working
- Refresh pages if needed

### Reset functionality
- Use "Reset All Test Data" in host panel
- This clears players and game state only
- Questions, clues, and secret gender are preserved

## License

This is a private party game project. Not intended for commercial use.

## Support

For issues or questions, refer to the project documentation or contact the development team.