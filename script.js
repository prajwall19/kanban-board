// Kanban Board Logic

const THEME_KEY = "mini-kanban-theme";

const columns = {
  todo: document.getElementById("todoColumn"),
  doing: document.getElementById("doingColumn"),
  done: document.getElementById("doneColumn"),
};

const counts = {
  todo: document.getElementById("todoCount"),
  doing: document.getElementById("doingCount"),
  done: document.getElementById("doneCount"),
};

const taskForm = document.getElementById("taskForm");
const taskTitleInput = document.getElementById("taskTitle");
const taskError = document.getElementById("taskError");
const clearBoardBtn = document.getElementById("clearBoardBtn");

const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeIcon = document.getElementById("themeIcon");
const themeLabel = document.getElementById("themeLabel");

let state = {
  todo: [],
  doing: [],
  done: [],
};

let db = null;
let tasksCollection = null;

// Utility functions

function updateCounts() {
  counts.todo.textContent = state.todo.length;
  counts.doing.textContent = state.doing.length;
  counts.done.textContent = state.done.length;
}

function createTaskElement(task, columnKey) {
  const card = document.createElement("article");
  card.className =
    "group rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-xs shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-600 dark:bg-slate-900/80";
  card.draggable = true;
  card.dataset.id = task.id;
  card.dataset.column = columnKey;

  const titleEl = document.createElement("p");
  titleEl.className = "mb-2 text-sm font-medium text-slate-800 dark:text-slate-100 break-words";
  titleEl.textContent = task.title;

  const actions = document.createElement("div");
  actions.className = "flex items-center justify-between gap-2 text-[11px] text-slate-500";

  const moveGroup = document.createElement("div");
  moveGroup.className = "inline-flex items-center gap-1";

  const leftBtn = document.createElement("button");
  leftBtn.type = "button";
  leftBtn.textContent = "◀";
  leftBtn.title = "Move left";
  leftBtn.className =
    "rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700";

  const rightBtn = document.createElement("button");
  rightBtn.type = "button";
  rightBtn.textContent = "▶";
  rightBtn.title = "Move right";
  rightBtn.className = leftBtn.className;

  // Disable buttons at edges
  if (columnKey === "todo") {
    leftBtn.disabled = true;
  }
  if (columnKey === "done") {
    rightBtn.disabled = true;
  }

  leftBtn.addEventListener("click", () => moveTask(task.id, columnKey, "left"));
  rightBtn.addEventListener("click", () => moveTask(task.id, columnKey, "right"));

  moveGroup.appendChild(leftBtn);
  moveGroup.appendChild(rightBtn);

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Delete task";
  deleteBtn.className =
    "ml-auto inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300";

  deleteBtn.addEventListener("click", () => deleteTask(task.id, columnKey));

  actions.appendChild(moveGroup);
  actions.appendChild(deleteBtn);

  card.appendChild(titleEl);
  card.appendChild(actions);

  // Drag & drop events
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragend", handleDragEnd);

  return card;
}

function renderColumn(columnKey) {
  const columnEl = columns[columnKey];
  columnEl.innerHTML = "";
  const tasks = state[columnKey];

  if (tasks.length === 0) {
    const empty = document.createElement("p");
    empty.className =
      "text-[11px] italic text-slate-400 text-center py-4 dark:text-slate-500";
    empty.textContent = "No tasks yet.";
    columnEl.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const card = createTaskElement(task, columnKey);
    columnEl.appendChild(card);
  });
}

function renderBoard() {
  renderColumn("todo");
  renderColumn("doing");
  renderColumn("done");
  updateCounts();
}

function addTask(title) {
  const trimmed = title.trim();
  if (!trimmed) {
    showError("Please enter a task title.");
    return;
  }

  hideError();

  if (tasksCollection) {
    tasksCollection
      .add({
        title: trimmed,
        column: "todo",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((e) => {
        console.error("Failed to add task to Firestore:", e);
      });
  } else {
    // Fallback: in-memory only if Firebase is not available
    const task = {
      id: Date.now().toString(36) + Math.random().toString(16).slice(2),
      title: trimmed,
    };
    state.todo.unshift(task);
    renderBoard();
  }

  taskTitleInput.value = "";
  taskTitleInput.focus();
}

function deleteTask(taskId, columnKey) {
  if (tasksCollection) {
    tasksCollection
      .doc(taskId)
      .delete()
      .catch((e) => {
        console.error("Failed to delete task from Firestore:", e);
      });
  } else {
    state[columnKey] = state[columnKey].filter((t) => t.id !== taskId);
    renderBoard();
  }
}

function moveTask(taskId, fromColumn, direction) {
  const order = ["todo", "doing", "done"];
  const fromIndex = order.indexOf(fromColumn);
  if (fromIndex === -1) return;

  let toIndex = fromIndex;
  if (direction === "left" && fromIndex > 0) {
    toIndex = fromIndex - 1;
  } else if (direction === "right" && fromIndex < order.length - 1) {
    toIndex = fromIndex + 1;
  }
  if (toIndex === fromIndex) return;

  const toColumn = order[toIndex];
  if (tasksCollection) {
    tasksCollection
      .doc(taskId)
      .update({ column: toColumn })
      .catch((e) => {
        console.error("Failed to move task in Firestore:", e);
      });
  } else {
    const taskIndex = state[fromColumn].findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return;

    const [task] = state[fromColumn].splice(taskIndex, 1);
    state[toColumn].unshift(task);
    renderBoard();
  }
}

// Error handling for input
function showError(message) {
  taskError.textContent = message;
  taskError.classList.remove("hidden");
}

function hideError() {
  taskError.classList.add("hidden");
}

// Drag and drop handlers
let dragSourceTaskId = null;
let dragSourceColumnKey = null;

function handleDragStart(e) {
  const card = e.currentTarget;
  dragSourceTaskId = card.dataset.id;
  dragSourceColumnKey = card.dataset.column;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", dragSourceTaskId);
  card.classList.add("opacity-60", "ring-2", "ring-primary-400");
}

function handleDragEnd(e) {
  const card = e.currentTarget;
  card.classList.remove("opacity-60", "ring-2", "ring-primary-400");
  dragSourceTaskId = null;
  dragSourceColumnKey = null;
  Object.values(columns).forEach((col) => {
    col.classList.remove(
      "border-primary-300",
      "bg-primary-50/60",
      "dark:border-primary-500/70",
      "dark:bg-primary-900/10"
    );
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDragEnter(e) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.add(
    "border-primary-300",
    "bg-primary-50/60",
    "dark:border-primary-500/70",
    "dark:bg-primary-900/10"
  );
}

function handleDragLeave(e) {
  const column = e.currentTarget;
  // Only remove highlight if leaving the column entirely
  if (!column.contains(e.relatedTarget)) {
    column.classList.remove(
      "border-primary-300",
      "bg-primary-50/60",
      "dark:border-primary-500/70",
      "dark:bg-primary-900/10"
    );
  }
}

function handleDrop(e) {
  e.preventDefault();
  const targetColumnKey = e.currentTarget.dataset.column;
  if (!dragSourceTaskId || !dragSourceColumnKey || !targetColumnKey) return;
  if (dragSourceColumnKey === targetColumnKey) {
    handleDragEnd({ currentTarget: document.querySelector(`[data-id="${dragSourceTaskId}"]`) });
    return;
  }

  if (tasksCollection) {
    tasksCollection
      .doc(dragSourceTaskId)
      .update({ column: targetColumnKey })
      .catch((e) => {
        console.error("Failed to move task (drag/drop) in Firestore:", e);
      });
  } else {
    const fromTasks = state[dragSourceColumnKey];
    const taskIndex = fromTasks.findIndex((t) => t.id === dragSourceTaskId);
    if (taskIndex === -1) return;

    const [task] = fromTasks.splice(taskIndex, 1);
    state[targetColumnKey].unshift(task);
    renderBoard();
  }
}

// Theme handling
function applyTheme(theme) {
  const root = document.documentElement;
  const isDark = theme === "dark";
  if (isDark) {
    root.classList.add("dark");
    themeIcon.textContent = "☀️";
    if (themeLabel) themeLabel.textContent = "Light mode";
  } else {
    root.classList.remove("dark");
    themeIcon.textContent = "🌙";
    if (themeLabel) themeLabel.textContent = "Dark mode";
  }
}

function loadTheme() {
  let stored = null;
  try {
    stored = localStorage.getItem(THEME_KEY);
  } catch (e) {
    console.warn("Unable to access theme preference from storage.", e);
  }
  if (stored === "light" || stored === "dark") {
    applyTheme(stored);
    return;
  }
  // Fallback to system preference
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(prefersDark ? "dark" : "light");
}

function toggleTheme() {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const next = isDark ? "light" : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    console.warn("Unable to save theme preference.", e);
  }
}

// Event bindings
taskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTask(taskTitleInput.value);
});

taskTitleInput.addEventListener("input", () => {
  if (taskTitleInput.value.trim()) {
    hideError();
  }
});

clearBoardBtn?.addEventListener("click", () => {
  const confirmed = window.confirm(
    "Are you sure you want to clear all tasks from the board?"
  );
  if (!confirmed) return;

  if (tasksCollection && db) {
    tasksCollection
      .get()
      .then((snapshot) => {
        const batch = db.batch();
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });
        return batch.commit();
      })
      .catch((e) => {
        console.error("Failed to clear tasks from Firestore:", e);
      });
  } else {
    state = { todo: [], doing: [], done: [] };
    renderBoard();
  }
});

themeToggleBtn?.addEventListener("click", toggleTheme);

Object.values(columns).forEach((columnEl) => {
  columnEl.addEventListener("dragover", handleDragOver);
  columnEl.addEventListener("dragenter", handleDragEnter);
  columnEl.addEventListener("dragleave", handleDragLeave);
  columnEl.addEventListener("drop", handleDrop);
});

function startFirestoreListener() {
  if (!window.firebase) {
    console.warn("Firebase SDK not found. Board will not sync to Firestore.");
    return;
  }
  db = firebase.firestore();
  tasksCollection = db.collection("tasks");

  tasksCollection.orderBy("createdAt", "asc").onSnapshot(
    (snapshot) => {
      const nextState = { todo: [], doing: [], done: [] };
      snapshot.forEach((doc) => {
        const data = doc.data() || {};
        const columnKey = data.column || "todo";
        const title = data.title || "";
        if (!nextState[columnKey]) return;
        nextState[columnKey].push({
          id: doc.id,
          title,
        });
      });
      state = nextState;
      renderBoard();
    },
    (error) => {
      console.error("Error listening to Firestore tasks:", error);
    }
  );
}

// Initial load
loadTheme();
startFirestoreListener();
renderBoard();

