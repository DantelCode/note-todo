const STORAGE = "dantel-note";

const state = JSON.parse(localStorage.getItem(STORAGE)) || {
    theme: "dark",
    view: "notes",
    noteLayout: "list",
    todoOrder: "latest",
    notes: [],
    todos: []
};

const list = document.getElementById("list");
const empty = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const noteLayoutSelect = document.getElementById("noteLayout");
const todoOrderSelect = document.getElementById("todoOrder");
const todoGroups = document.getElementById("todoGroups");
const todoPending = document.getElementById("todoPending");
const todoCompleted = document.getElementById("todoCompleted");
const noteModal = document.getElementById("noteModal");
const todoModal = document.getElementById("todoModal");

let editIndex = null;
let dragIndex = null;


document.body.dataset.theme = state.theme;


searchInput.addEventListener("input", render);


/* ---------- SAVE ---------- */
const save = () => localStorage.setItem(STORAGE, JSON.stringify(state));


/* ---------- TABS ---------- */
function syncActiveTab() {
    document.querySelectorAll(".tab").forEach(tab => {
        tab.classList.toggle(
            "active",
            tab.dataset.view === state.view
        );
    });
}

function syncHeaderControls() {
    document.getElementById("noteLayout").style.display =
        state.view === "notes" ? "block" : "none";

    document.getElementById("todoOrder").style.display =
        state.view === "todos" ? "block" : "none";
}

document.querySelectorAll(".tab").forEach(btn => {
    btn.onclick = () => {
        state.view = btn.dataset.view;
        searchInput.value = "";

        save();
        syncActiveTab();
        syncHeaderControls();
        render();
    };
});


/* ---------- ADD ---------- */
document.getElementById("addBtn").onclick = () => {
    state.view === "notes" ?
        noteModal.style.display = "grid" :
        todoModal.style.display = "grid";
};


/* NOTE & TODO LAYOUT */
function initIconSelect(id, stateKey, onChange) {
    const select = document.getElementById(id);
    const trigger = select.querySelector(".icon-trigger");
    const options = select.querySelectorAll("li");

    function sync() {
        options.forEach(o =>
            o.classList.toggle("selected", o.dataset.value === state[stateKey])
        );
    }

    trigger.onclick = () => {
        select.classList.toggle("open");
    };

    options.forEach(option => {
        option.onclick = () => {
            state[stateKey] = option.dataset.value;
            save();
            sync();
            onChange();
            select.classList.remove("open");
        };
    });

    sync();
}

initIconSelect("noteLayout", "noteLayout", () => {
    applyLayout();
    render();
});

initIconSelect("todoOrder", "todoOrder", () => {
    if (state.todoOrder === "time") {
        state.todos.sort(
            (a, b) => new Date(a.time || Infinity) - new Date(b.time || Infinity)
        );
    }
    render();
});

document.getElementById("noteLayout").onchange = (e) => {
    state.noteLayout = e.target.value;
    save();
    applyLayout();
};

document.getElementById("todoOrder").onchange = (e) => {
    state.todoOrder = e.target.value;

    if (state.todoOrder === "time") {
        state.todos.sort(
            (a, b) => new Date(a.time || Infinity) - new Date(b.time || Infinity)
        );
    }
    // latest = natural array order (unshift + drag)

    save();
    render();
};

function applyLayout() {
    if (state.view === "notes") {
        list.className = `list ${state.noteLayout}`;
    } else {
        list.className = "list todo-list";
    }
}
applyLayout();

document.addEventListener("click", e => {
    document.querySelectorAll(".icon-select").forEach(s => {
        if (!s.contains(e.target)) s.classList.remove("open");
    });
}); // CLOSE ON OUTSIDE CLICK


/* ---------- THEME ---------- */
document.getElementById("themeToggle").onclick = () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = state.theme;
    save();
};


document.getElementById("saveNote").onclick = () => {
    if (!noteTitle.value) return alert('No Title Entered');

    if (editIndex !== null) {
        state.notes[editIndex].title = noteTitle.value;
        state.notes[editIndex].desc = noteDesc.value;
        state.notes[editIndex].updateOn = Date.now();
    } else {
        state.notes.unshift({
            title: noteTitle.value,
            desc: noteDesc.value.trim(),
            updateOn: Date.now(),
            date: Date.now()
        });
    }

    editIndex = null;
    save();
    noteModal.style.display = "none";
    render();
    noteTitle.value = "";
    noteDesc.value = "";
};

document.getElementById("saveTodo").onclick = () => {
    if (editIndex !== null) {
        state.todos[editIndex].title = todoTitle.value;
        state.todos[editIndex].time = todoTime.value;
    } else {
        state.todos.unshift({
            title: todoTitle.value,
            time: todoTime.value,
            done: false
        });
    }

    editIndex = null;
    save();
    todoModal.style.display = "none";
    render();
    todoTitle.value = "";
    todoTime.value = "";
};

document.querySelectorAll("[data-close]").forEach(b =>
    b.onclick = () => {
        editIndex = null;
        noteModal.style.display = todoModal.style.display = "none";
    }
);


/* ---------- RENDER ---------- */
function renderItem(item) {
    const index = state.notes.indexOf(item);

    const li = document.createElement("li");
    li.className = "item";
    li.draggable = true;
    li.dataset.index = index;

    li.innerHTML = `
        <div class="note-content">
            <strong>${item.title}</strong>
            ${item.desc ? `<p>${item.desc}</p>` : ""}
            <small>${new Date(item.updateOn || item.date).toLocaleString()}</small>
        </div>

        <div style="display:flex;gap:8px;">
            <button class="icon-btn edit" aria-label="Edit">
                <svg viewBox="0 0 24 24">
                    <path d="M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97l-9.82 9.82-4.12.88.88-4.12 9.82-9.82zM3 21h18" />
                </svg>
            </button>

            <button class="icon-btn delete" aria-label="Delete">
                <svg viewBox="0 0 24 24">
                    <path d="M3 6h18M9 6V4h6v2m-7 4v8m4-8v8m4-8v8M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
                </svg>
            </button>
        </div>
    `;

    // DELETE
    li.querySelector(".delete").onclick = () => {
        state.notes.splice(index, 1);
        save();
        render();
    };

    // EDIT
    li.querySelector(".edit").onclick = () => {
        editIndex = index;
        noteTitle.value = item.title;
        noteDesc.value = item.desc || "";
        noteModal.style.display = "grid";
    };

    li.addEventListener("dragstart", () => {
        dragIndex = index;
        li.classList.add("dragging");
    });

    li.addEventListener("dragend", () => {
        li.classList.remove("dragging");
    });

    li.addEventListener("dragover", e => {
        e.preventDefault();
    });

    li.addEventListener("drop", () => {
        const dropIndex = index;
        if (dragIndex === null || dragIndex === dropIndex) return;

        const moved = state.notes.splice(dragIndex, 1)[0];
        state.notes.splice(dropIndex, 0, moved);

        dragIndex = null;
        save();
        render();
    });


    list.appendChild(li);
}

function renderTodo(item, container) {
    const index = state.todos.indexOf(item);

    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `
        <div class="todo-left">
            <input type="checkbox" ${item.done ? "checked" : ""}/>
            <div>
                <strong>${item.title}</strong>
                ${item.time ? `<small>${new Date(item.time).toLocaleString()}</small>` : ""}
            </div>
        </div>

        <div style="display:flex;gap:8px">
            <button class="icon-btn edit" aria-label="Edit">
                <svg viewBox="0 0 24 24">
                    <path d="M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97l-9.82 9.82-4.12.88.88-4.12 9.82-9.82zM3 21h18" />
                </svg>
            </button>

            <button class="icon-btn delete" aria-label="Delete">
                <svg viewBox="0 0 24 24">
                    <path d="M3 6h18M9 6V4h6v2m-7 4v8m4-8v8m4-8v8M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14" />
                </svg>
            </button>
        </div>
    `;

    // Toggle complete
    li.querySelector("input").onchange = e => {
        item.done = e.target.checked;
        save();
        render();
    };

    // Delete
    li.querySelector(".delete").onclick = () => {
        state.todos.splice(index, 1);
        save();
        render();
    };

    // Edit
    li.querySelector(".edit").onclick = () => {
        editIndex = index;
        todoTitle.value = item.title;
        todoTime.value = item.time || "";
        todoModal.style.display = "grid";
    };

    container.appendChild(li);
}

function render() {
    list.innerHTML = "";
    todoPending.innerHTML = "";
    todoCompleted.innerHTML = "";

    applyLayout();

    const query = searchInput.value.trim().toLowerCase();
    const data = state[state.view].filter(item =>
        item.title.toLowerCase().includes(query)
    );

    syncHeaderControls();

    // EMPTY STATE → ONLY FOR NOTES
    if (state.view === "notes" && !data.length) {
        empty.style.display = "block";
        empty.querySelector("span").textContent =
            query ? "No results found" : "No notes yet";
        list.style.display = "block";
        todoGroups.hidden = true;
        return;
    }

    // Hide empty state otherwise
    empty.style.display = "none";


    // ---------------- NOTES ----------------
    if (state.view === "notes") {
        list.style.display = "block";
        todoGroups.hidden = true;

        data.forEach(renderItem);
        return;
    }

    // ---------------- TODOS ----------------
    list.style.display = "none";
    todoGroups.hidden = false;

    const pending = data.filter(t => !t.done);
    const completed = data.filter(t => t.done);

    pending.forEach(item => renderTodo(item, todoPending));
    completed.forEach(item => renderTodo(item, todoCompleted));
}


syncActiveTab();
render();
syncHeaderControls();