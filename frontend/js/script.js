
/* =================================
   BLOGGER - MAIN APPLICATION
================================= */

// Storage helpers
const getUsers = () =>
    JSON.parse(localStorage.getItem("bloggerUsers") || "[]");

const getPosts = () =>
    JSON.parse(localStorage.getItem("bloggerPosts") || "[]");

const savePosts = posts =>
    localStorage.setItem("bloggerPosts", JSON.stringify(posts));

const getCurrentUser = () =>
    JSON.parse(localStorage.getItem("bloggerCurrentUser") || "null");

const currentUser = getCurrentUser();

function getUserPosts() {
    if (!currentUser) return [];

    return getPosts().filter(
        post => post.author === currentUser.email
    );
}

// Safe HTML for article previews
function sanitizeHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const allowedTags = [
        "P", "BR", "B", "STRONG", "I", "EM",
        "U", "H2", "H3", "UL", "OL", "LI",
        "BLOCKQUOTE"
    ];

    function clean(node) {
        [...node.children].forEach(child => {
            if (!allowedTags.includes(child.tagName)) {
                const text = doc.createTextNode(child.textContent);
                child.replaceWith(text);
                return;
            }

            [...child.attributes].forEach(attribute => {
                child.removeAttribute(attribute.name);
            });

            clean(child);
        });
    }

    clean(doc.body);
    return doc.body.innerHTML;
}

/* =================================
   REGISTRATION
================================= */

const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (password.length < 8) {
            message.textContent = "Password must contain at least 8 characters.";
            return;
        }

        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        const users = getUsers();

        if (users.some(user => user.email === email)) {
            message.textContent = "An account with this email already exists.";
            return;
        }

        // Demo only: never store passwords in localStorage.
        users.push({ name, email });

        localStorage.setItem("bloggerUsers", JSON.stringify(users));

        localStorage.setItem(
            "bloggerCurrentUser",
            JSON.stringify({ name, email })
        );

        message.textContent = "Account created! Redirecting...";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 700);
    });
}

/* =================================
   LOGIN
================================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        const users = getUsers();

        const user = users.find(item => item.email === email);

        if (!user || !password) {
            message.textContent = "Account not found. Please register first.";
            return;
        }

        localStorage.setItem(
            "bloggerCurrentUser",
            JSON.stringify(user)
        );

        message.textContent = "Login successful! Redirecting...";

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);
    });
}

/* =================================
   AUTHENTICATION GUARD
================================= */

const protectedPages = ["dashboard.html", "create-blog.html"];

if (
    protectedPages.some(page => window.location.pathname.endsWith(page))
    && !currentUser
) {
    window.location.href = "login.html";
}

/* =================================
   DASHBOARD
================================= */

const postsList = document.getElementById("postsList");

if (postsList) {
    const dashboardName = document.getElementById("dashboardName");

    if (dashboardName) {
        dashboardName.textContent = currentUser.name;
    }

    function renderDashboard() {
        const posts = getUserPosts();

        document.getElementById("totalPosts").textContent = posts.length;

        document.getElementById("publishedPosts").textContent =
            posts.filter(post => post.status === "Published").length;

        document.getElementById("draftPosts").textContent =
            posts.filter(post => post.status === "Draft").length;

        postsList.innerHTML = "";

        if (posts.length === 0) {
            postsList.innerHTML = `
                <div class="empty-state">
                    <span>✍️</span>
                    <h3>No posts yet</h3>
                    <p>Your stories will appear here.</p>
                    <a href="create-blog.html" class="create-btn">
                        CREATE YOUR FIRST POST
                    </a>
                </div>
            `;
            return;
        }

        posts.forEach(post => {
            const row = document.createElement("article");
            row.className = "post-row";

            const details = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = post.title;

            const category = document.createElement("p");
            category.textContent = post.category;

            const status = document.createElement("span");
            status.className = "post-status";
            status.textContent = post.status;

            details.append(title, category, status);

            const actions = document.createElement("div");
            actions.className = "post-actions";

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => {
                sessionStorage.setItem("editingPostId", post.id);
                window.location.href = "create-blog.html";
            });

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-post";

            deleteButton.addEventListener("click", () => {
                if (!confirm("Delete this post?")) return;

                savePosts(getPosts().filter(item => item.id !== post.id));
                renderDashboard();
            });

            actions.append(editButton, deleteButton);
            row.append(details, actions);

            postsList.appendChild(row);
        });
    }

    renderDashboard();
}

/* =================================
   LOGOUT
================================= */

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("bloggerCurrentUser");
        window.location.href = "index.html";
    });
}

/* =================================
   BLOG EDITOR
================================= */

const contentEditor = document.getElementById("postContent");

if (contentEditor) {

    const titleInput = document.getElementById("postTitle");
    const categoryInput = document.getElementById("postCategory");

    const statusLabel = document.getElementById("editorStatus");

    const editingId = sessionStorage.getItem("editingPostId");

    let editingPost = editingId
        ? getUserPosts().find(post => post.id === editingId)
        : null;

    // Load existing article when editing
    if (editingPost) {
        titleInput.value = editingPost.title;
        categoryInput.value = editingPost.category;
        contentEditor.innerHTML = sanitizeHTML(editingPost.content);
        statusLabel.textContent = "Editing article";
    }

    // Formatting toolbar
    document.querySelectorAll(".editor-toolbar button").forEach(button => {
        button.addEventListener("click", () => {
            const command = button.dataset.command;
            const value = button.dataset.value || null;

            contentEditor.focus();

            document.execCommand(command, false, value);
        });
    });

    // Prepare article
    function preparePost(status) {
        const title = titleInput.value.trim();
        const content = contentEditor.innerHTML.trim();

        if (!title || !contentEditor.textContent.trim()) {
            alert("Please enter both a title and article content.");
            return null;
        }

        return {
            id: editingPost?.id || crypto.randomUUID(),
            title,
            content: sanitizeHTML(content),
            category: categoryInput.value,
            status,
            author: currentUser.email,
            updatedAt: new Date().toISOString()
        };
    }

    // Save or update post
    function savePost(status) {
        const post = preparePost(status);

        if (!post) return;

        const posts = getPosts();

        const index = posts.findIndex(item => item.id === post.id);

        if (index >= 0) {
            posts[index] = post;
        } else {
            posts.push(post);
        }

        savePosts(posts);

        editingPost = post;
        sessionStorage.setItem("editingPostId", post.id);

        statusLabel.textContent = status + " · Saved";

        alert(status === "Published"
            ? "Your article has been published!"
            : "Draft saved successfully!");
    }

    document.getElementById("draftButton").addEventListener("click", () => {
        savePost("Draft");
    });

    document.getElementById("publishButton").addEventListener("click", () => {
        savePost("Published");
    });

    // Article preview
    const previewOverlay = document.getElementById("previewOverlay");

    document.getElementById("previewButton").addEventListener("click", () => {
        const title = titleInput.value.trim();

        if (!title || !contentEditor.textContent.trim()) {
            alert("Write a title and some content before previewing.");
            return;
        }

        document.getElementById("previewTitle").textContent = title;

        document.getElementById("previewCategory").textContent =
            categoryInput.value;

        document.getElementById("previewContent").innerHTML =
            sanitizeHTML(contentEditor.innerHTML);

        previewOverlay.hidden = false;
    });

    document.getElementById("closePreview").addEventListener("click", () => {
        previewOverlay.hidden = true;
    });

}
