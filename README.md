## Mini Kanban Board

A minimal, responsive Kanban board with three columns (**Todo**, **Doing**, **Done**) built using HTML, Tailwind CSS (CDN), vanilla JavaScript, and optional Firebase Firestore persistence.

### Features

- **Three-column workflow**: Move tasks between Todo, Doing, and Done.
- **Task management**: Add new tasks, move them left/right, and delete them.
- **Drag and drop**: Reorder tasks between columns with drag-and-drop support.
- **Counters per column**: Live task counts for each column.
- **Clear board**: One-click button to remove all tasks.
- **Dark / light mode**: Theme toggle with preference stored in `localStorage`.
- **Firestore sync (optional)**: When Firebase is configured, tasks are stored in a `tasks` collection and loaded in real time.

### Tech Stack

- **HTML5** for structure (`index.html`)
- **Tailwind CSS** via CDN for styling
- **Vanilla JavaScript** (`script.js`) for board logic and drag-and-drop
- **Firebase Firestore** (compat SDK) for optional cloud persistence

### Getting Started

1. **Clone or download** this repository.
2. Open `index.html` directly in your browser (double-click it or use a simple static server).
3. Start adding tasks via the input at the top of the board.

The board will work **without Firebase** (tasks are held in memory for the current session). For real persistence across reloads and devices, configure Firebase.

### Firebase Configuration (Optional but Recommended)

1. Create a Firebase project in the Firebase console.
2. Enable **Firestore Database** in *production or test mode*.
3. In your project settings, generate a Web app config and copy the `firebaseConfig` object.
4. In `index.html`, replace the existing `firebaseConfig` in the head script with your own credentials:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`
5. Make sure Firestore security rules allow the reads/writes you need for the `tasks` collection.

When Firebase is available:

- Tasks are stored in a `tasks` collection with fields: `title`, `column`, `createdAt`.
- The UI listens to Firestore changes in real time and updates all columns accordingly.

### Project Structure

- `index.html` – Main page layout, Tailwind config, Firebase initialization, and markup for the three columns.
- `script.js` – All Kanban logic: task CRUD, drag-and-drop, counts, theme toggle, and Firestore synchronization.

### Customization Ideas

- Change column names or add more columns.
- Adjust Tailwind colors and gradients in the inline Tailwind config.
- Enhance tasks with descriptions, tags, or due dates.
- Add user authentication and per-user boards with Firebase Auth.

### License

You are free to use, modify, and share this project for personal or educational purposes. For commercial use, review and apply an explicit license of your choice.

