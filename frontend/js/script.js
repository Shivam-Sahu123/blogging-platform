/* =================================
   BLOGGER - MAIN APPLICATION
================================= */

const API_BASE_URL = "https://blogging-backend-lb19.onrender.com/api";

const getToken = () => localStorage.getItem("bloggerToken");
const getCurrentUser = () =>
    JSON.parse(localStorage.getItem("bloggerCurrentUser") || "null");

const currentUser = getCurrentUser();

async function apiRequest(path, options = {}) {
    const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...options.headers
    };

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem("bloggerToken");
            localStorage.removeItem("bloggerCurrentUser");
        }
        throw new Error(data.message || `Request failed (${response.status})`);
    }

    return data;
}

// Keep only basic, safe formatting tags from the editor.
function sanitizeHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const allowedTags = [
        "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE",
        "H2", "H3", "UL", "OL", "LI", "BLOCKQUOTE", "A", "DIV"
    ];

    function clean(node) {
        [...node.children].forEach(child => {
            if (!allowedTags.includes(child.tagName)) {
                child.replaceWith(doc.createTextNode(child.textContent));
                return;
            }

            [...child.attributes].forEach(attribute => {
                const name = attribute.name.toLowerCase();
                if (child.tagName === "A" && name === "href") {
                    const value = child.getAttribute("href");
                    if (!/^https?:\/\//i.test(value)) child.removeAttribute("href");
                } else {
                    child.removeAttribute(attribute.name);
                }
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
    registerForm.addEventListener("submit", async event => {
        event.preventDefault();

        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim().toLowerCase();
        const password = document.getElementById("registerPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");
        const button = registerForm.querySelector('button[type="submit"]');

        if (password.length < 8) {
            message.textContent = "Password must contain at least 8 characters.";
            return;
        }
        if (password !== confirmPassword) {
            message.textContent = "Passwords do not match.";
            return;
        }

        try {
            button.disabled = true;
            button.textContent = "Creating account...";
            const data = await apiRequest("/auth/register", {
                method: "POST",
                body: JSON.stringify({ name, email, password })
            });

            localStorage.setItem("bloggerToken", data.token);
            localStorage.setItem("bloggerCurrentUser", JSON.stringify(data.user));
            window.location.href = "dashboard.html";
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Create account";
        }
    });
}

/* =================================
   LOGIN
================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async event => {
        event.preventDefault();

        const email = document.getElementById("loginEmail").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");
        const button = loginForm.querySelector('button[type="submit"]');

        try {
            button.disabled = true;
            button.textContent = "Signing in...";
            const data = await apiRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            localStorage.setItem("bloggerToken", data.token);
            localStorage.setItem("bloggerCurrentUser", JSON.stringify(data.user));
            window.location.href = "dashboard.html";
        } catch (error) {
            message.textContent = error.message;
        } finally {
            button.disabled = false;
            button.textContent = "Sign in";
        }
    });
}

/* =================================
   AUTHENTICATION GUARD
================================= */
const protectedPages = ["dashboard.html", "create-blog.html"];
const currentPage = window.location.pathname.split("/").pop();

if (protectedPages.includes(currentPage) && !getToken()) {
    window.location.href = "login.html";
}

/* =================================
   NEW POST LINKS
   Always clear an old editing ID.
================================= */
document.querySelectorAll("[data-new-post]").forEach(link => {
    link.addEventListener("click", () => {
        sessionStorage.removeItem("editingPostId");
    });
});

/* =================================
   DASHBOARD - REAL API DATA
================================= */
const postsList = document.getElementById("postsList");

if (postsList) {
    const dashboardName = document.getElementById("dashboardName");
    if (dashboardName && currentUser) {
        dashboardName.textContent = currentUser.name || "Writer";
    }

    async function renderDashboard() {
        postsList.innerHTML = '<div class="empty-state"><h3>Loading your posts...</h3></div>';

        try {
            const posts = await apiRequest("/blogs/me");

            document.getElementById("totalPosts").textContent = posts.length;
            document.getElementById("publishedPosts").textContent =
                posts.filter(post => post.status === "published").length;
            document.getElementById("draftPosts").textContent =
                posts.filter(post => post.status === "draft").length;

            postsList.innerHTML = "";

            if (!posts.length) {
                postsList.innerHTML = `
                    <div class="empty-state">
                        <span>✍️</span>
                        <h3>No posts yet</h3>
                        <p>Your stories will appear here.</p>
                        <a href="create-blog.html?new=1" class="create-btn" data-new-post>
                            CREATE YOUR FIRST POST
                        </a>
                    </div>`;
                postsList.querySelectorAll("[data-new-post]").forEach(link => {
                    link.addEventListener("click", () => sessionStorage.removeItem("editingPostId"));
                });
                return;
            }

            posts.forEach(post => {
                const row = document.createElement("article");
                row.className = "post-row";

                const details = document.createElement("div");
                const title = document.createElement("h3");
                title.textContent = post.title;

                const category = document.createElement("p");
                category.textContent = post.category || "General";

                const status = document.createElement("span");
                status.className = "post-status";
                status.textContent = post.status;

                details.append(title, category, status);

                const actions = document.createElement("div");
                actions.className = "post-actions";

                const editButton = document.createElement("button");
                editButton.type = "button";
                editButton.textContent = "Edit";
                editButton.addEventListener("click", () => {
                    sessionStorage.setItem("editingPostId", post._id);
                    window.location.href = "create-blog.html?edit=" + encodeURIComponent(post._id);
                });

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.textContent = "Delete";
                deleteButton.className = "delete-post";
                deleteButton.addEventListener("click", async () => {
                    if (!confirm("Delete this post permanently?")) return;
                    try {
                        await apiRequest(`/blogs/${post._id}`, { method: "DELETE" });
                        await renderDashboard();
                    } catch (error) {
                        alert(error.message);
                    }
                });

                actions.append(editButton, deleteButton);
                row.append(details, actions);
                postsList.appendChild(row);
            });
        } catch (error) {
            postsList.innerHTML = `<div class="empty-state"><h3>Couldn't load posts</h3><p>${error.message}</p></div>`;
        }
    }

    renderDashboard();
}

/* =================================
   LOGOUT
================================= */
const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
    logoutButton.addEventListener("click", () => {
        localStorage.removeItem("bloggerToken");
        localStorage.removeItem("bloggerCurrentUser");
        sessionStorage.removeItem("editingPostId");
        window.location.href = "index.html";
    });
}

/* =================================
   BLOG EDITOR - CREATE / EDIT
================================= */
const contentEditor = document.getElementById("postContent");

if (contentEditor) {
    const titleInput = document.getElementById("postTitle");
    const categoryInput = document.getElementById("postCategory");
    const statusLabel = document.getElementById("editorStatus");
    const message = document.getElementById("editorMessage");
    const draftButton = document.getElementById("draftButton");
    const publishButton = document.getElementById("publishButton");

    const params = new URLSearchParams(window.location.search);
    const requestedEditId = params.get("edit");
    const isNewPost = params.has("new") || !requestedEditId;

    // A fresh editor URL must never inherit an old edit ID.
    let editingPostId = isNewPost ? null : requestedEditId;
    if (isNewPost) sessionStorage.removeItem("editingPostId");

    async function loadPostForEditing() {
        if (!editingPostId) {
            statusLabel.textContent = "New article";
            return;
        }

        try {
            statusLabel.textContent = "Loading article...";
            const posts = await apiRequest("/blogs/me");
            const post = posts.find(item => item._id === editingPostId);

            if (!post) {
                throw new Error("This post could not be found in your account.");
            }

            titleInput.value = post.title;
            categoryInput.value = post.category || "Other";
            contentEditor.innerHTML = sanitizeHTML(post.content);
            statusLabel.textContent = "Editing article";
        } catch (error) {
            message.textContent = error.message;
            editingPostId = null;
            sessionStorage.removeItem("editingPostId");
        }
    }

    // Text formatting toolbar
    document.querySelectorAll(".editor-toolbar [data-command]").forEach(button => {
        button.addEventListener("click", () => {
            contentEditor.focus();
            document.execCommand(button.dataset.command, false, null);
        });
    });

    const blockFormat = document.getElementById("blockFormat");
    if (blockFormat) {
        blockFormat.addEventListener("change", () => {
            contentEditor.focus();
            document.execCommand("formatBlock", false, blockFormat.value);
        });
    }

    const insertLinkButton = document.getElementById("insertLinkButton");
    if (insertLinkButton) {
        insertLinkButton.addEventListener("click", () => {
            const url = prompt("Enter the full link (https://...)");
            if (!url) return;
            if (!/^https?:\/\//i.test(url)) {
                alert("Please enter a link beginning with http:// or https://");
                return;
            }
            contentEditor.focus();
            document.execCommand("createLink", false, url);
        });
    }

    function getPostPayload(status) {
        const title = titleInput.value.trim();
        const plainText = contentEditor.innerText.trim();
        const content = sanitizeHTML(contentEditor.innerHTML);

        if (!title || !plainText) {
            message.textContent = "Please enter both a title and article content.";
            return null;
        }

        return {
            title,
            content,
            category: categoryInput.value,
            status
        };
    }

    async function savePost(status) {
        const payload = getPostPayload(status);
        if (!payload) return;

        const button = status === "published" ? publishButton : draftButton;
        const originalText = button.textContent;

        try {
            draftButton.disabled = true;
            publishButton.disabled = true;
            button.textContent = "Saving...";
            message.textContent = "";

            let result;
            if (editingPostId) {
                result = await apiRequest(`/blogs/${editingPostId}`, {
                    method: "PUT",
                    body: JSON.stringify(payload)
                });
            } else {
                result = await apiRequest("/blogs", {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                // Keep the returned ID only for subsequent edits in this editor session.
                editingPostId = result.blog?._id || result._id || null;
                if (editingPostId) {
                    sessionStorage.setItem("editingPostId", editingPostId);
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete("new");
                    newUrl.searchParams.set("edit", editingPostId);
                    window.history.replaceState({}, "", newUrl);
                }
            }

            statusLabel.textContent = status === "published" ? "Published" : "Draft saved";
            message.textContent = status === "published"
                ? "Your article has been published."
                : "Your draft has been saved.";
        } catch (error) {
            message.textContent = error.message;
        } finally {
            draftButton.disabled = false;
            publishButton.disabled = false;
            button.textContent = originalText;
        }
    }

    draftButton.addEventListener("click", () => savePost("draft"));
    publishButton.addEventListener("click", () => savePost("published"));

    // Preview
    const previewOverlay = document.getElementById("previewOverlay");
    document.getElementById("previewButton").addEventListener("click", () => {
        if (!titleInput.value.trim() || !contentEditor.innerText.trim()) {
            message.textContent = "Write a title and some content before previewing.";
            return;
        }

        document.getElementById("previewTitle").textContent = titleInput.value.trim();
        document.getElementById("previewCategory").textContent = categoryInput.value;
        document.getElementById("previewContent").innerHTML = sanitizeHTML(contentEditor.innerHTML);
        previewOverlay.hidden = false;
    });

    document.getElementById("closePreview").addEventListener("click", () => {
        previewOverlay.hidden = true;
    });

    previewOverlay.addEventListener("click", event => {
        if (event.target === previewOverlay) previewOverlay.hidden = true;
    });

    loadPostForEditing();
}
