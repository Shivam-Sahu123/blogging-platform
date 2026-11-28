/* =========================================
   BLOGGER DASHBOARD
   Uses the existing Express API:
   GET    /api/blogs/me
   PUT    /api/blogs/:id (editor)
   DELETE /api/blogs/:id
========================================= */
(() => {
    "use strict";

    const API_BASE_URL = "https://blogging-backend-lb19.onrender.com/api";
    const token = localStorage.getItem("bloggerToken");
    const currentUser = JSON.parse(localStorage.getItem("bloggerCurrentUser") || "null");

    const postsList = document.getElementById("postsList");
    const searchInput = document.getElementById("postSearch");
    const filterButtons = [...document.querySelectorAll("[data-filter]")];
    let posts = [];
    let activeFilter = "all";

    if (!token) {
        window.location.replace("login.html");
        return;
    }

    if (currentUser?.name) {
        document.getElementById("dashboardName").textContent = currentUser.name;
    }

    async function apiRequest(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers: {
                ...(options.body ? { "Content-Type": "application/json" } : {}),
                Authorization: `Bearer ${token}`,
                ...options.headers
            }
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem("bloggerToken");
                localStorage.removeItem("bloggerCurrentUser");
                window.location.replace("login.html");
            }
            throw new Error(data.message || `Request failed (${response.status})`);
        }
        return data;
    }

    function normalStatus(post) {
        return String(post.status || "draft").toLowerCase();
    }

    function formatDate(value) {
        if (!value) return "Date unavailable";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "Date unavailable";
        return new Intl.DateTimeFormat(undefined, {
            day: "numeric", month: "short", year: "numeric"
        }).format(date);
    }

    function readingTime(content) {
        const text = String(content || "").replace(/<[^>]*>/g, " ").trim();
        const words = text ? text.split(/\s+/).length : 0;
        return `${Math.max(1, Math.ceil(words / 200))} min read`;
    }

    function updateStats() {
        document.getElementById("totalPosts").textContent = posts.length;
        document.getElementById("publishedPosts").textContent =
            posts.filter(post => normalStatus(post) === "published").length;
        document.getElementById("draftPosts").textContent =
            posts.filter(post => normalStatus(post) === "draft").length;
    }

    function setFilter(filter) {
        activeFilter = filter;
        filterButtons.forEach(button => {
            button.setAttribute("aria-pressed", String(button.dataset.filter === filter));
        });
        renderPosts();
    }

    function createPostRow(post) {
        const row = document.createElement("article");
        row.className = "post-row";

        const cover = document.createElement("div");
        cover.className = "post-cover";
        const coverUrl = post.coverImage || post.coverImageUrl || post.coverImageURL;
        if (coverUrl) {
            const image = document.createElement("img");
            image.src = coverUrl;
            image.alt = `Cover image for ${post.title || "blog post"}`;
            image.loading = "lazy";
            image.onerror = () => {
                cover.replaceChildren(document.createTextNode("✎"));
            };
            cover.appendChild(image);
        } else {
            cover.textContent = "✎";
            cover.setAttribute("aria-label", "No cover image");
        }

        const main = document.createElement("div");
        main.className = "post-main";

        const title = document.createElement("h3");
        title.className = "post-title";
        title.textContent = post.title || "Untitled post";

        const meta = document.createElement("div");
        meta.className = "post-meta";

        const category = document.createElement("span");
        category.className = "category-pill";
        category.textContent = post.category || "General";

        const status = document.createElement("span");
        const state = normalStatus(post);
        status.className = `status-pill ${state === "published" ? "status-published" : "status-draft"}`;
        status.textContent = state;

        const updated = document.createElement("span");
        updated.textContent = `Updated ${formatDate(post.updatedAt || post.createdAt)}`;

        const read = document.createElement("span");
        read.textContent = readingTime(post.content);

        meta.append(category, status, updated, read);
        main.append(title, meta);

        const actions = document.createElement("div");
        actions.className = "post-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "action-button";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => {
            window.location.href = `create-blog.html?edit=${encodeURIComponent(post._id)}`;
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "action-button delete";
        remove.textContent = "Delete";
        remove.addEventListener("click", async () => {
            if (!window.confirm(`Delete “${post.title || "Untitled post"}”? This cannot be undone.`)) return;
            remove.disabled = true;
            remove.textContent = "Deleting...";
            try {
                await apiRequest(`/blogs/${encodeURIComponent(post._id)}`, { method: "DELETE" });
                posts = posts.filter(item => item._id !== post._id);
                updateStats();
                renderPosts();
            } catch (error) {
                window.alert(error.message);
                remove.disabled = false;
                remove.textContent = "Delete";
            }
        });

        actions.append(edit, remove);
        row.append(cover, main, actions);
        return row;
    }

    function renderPosts() {
        const query = (searchInput.value || "").trim().toLowerCase();
        const visible = posts.filter(post => {
            const statusMatches = activeFilter === "all" || normalStatus(post) === activeFilter;
            const searchMatches = `${post.title || ""} ${post.category || ""}`.toLowerCase().includes(query);
            return statusMatches && searchMatches;
        });

        postsList.replaceChildren();

        if (!visible.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            const icon = document.createElement("div");
            icon.className = "empty-icon";
            icon.textContent = query ? "⌕" : "✍";
            const heading = document.createElement("h3");
            heading.textContent = query ? "No matching posts" :
                (activeFilter === "all" ? "Your next story starts here" : `No ${activeFilter} posts`);
            const description = document.createElement("p");
            description.textContent = query
                ? "Try another title or category."
                : "Create a post or switch filters to see your articles.";
            empty.append(icon, heading, description);
            if (!query && activeFilter === "all") {
                const link = document.createElement("a");
                link.className = "primary-button";
                link.href = "create-blog.html?new=1";
                link.textContent = "+ Create your first post";
                empty.append(link);
            }
            postsList.append(empty);
            return;
        }

        visible.forEach(post => postsList.append(createPostRow(post)));
    }

    async function loadPosts() {
        postsList.innerHTML = '<div class="loading-state">Loading your posts...</div>';
        try {
            const result = await apiRequest("/blogs/me");
            posts = Array.isArray(result) ? result : (result.blogs || []);
            updateStats();
            renderPosts();
        } catch (error) {
            postsList.innerHTML = "";
            const errorBox = document.createElement("div");
            errorBox.className = "empty-state";
            const heading = document.createElement("h3");
            heading.textContent = "Couldn't load your posts";
            const text = document.createElement("p");
            text.className = "error-text";
            text.textContent = error.message;
            const retry = document.createElement("button");
            retry.className = "action-button";
            retry.textContent = "Try again";
            retry.addEventListener("click", loadPosts);
            errorBox.append(heading, text, retry);
            postsList.append(errorBox);
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener("click", () => setFilter(button.dataset.filter));
    });
    searchInput.addEventListener("input", renderPosts);

    document.getElementById("logoutButton").addEventListener("click", () => {
        localStorage.removeItem("bloggerToken");
        localStorage.removeItem("bloggerCurrentUser");
        sessionStorage.removeItem("editingPostId");
        window.location.href = "index.html";
    });

    // On mobile, close the drawer after navigating or tapping outside it.
    const menuButton = document.getElementById("mobileMenuButton");
    const backdrop = document.getElementById("sidebarBackdrop");
    function closeMenu() {
        document.body.classList.remove("nav-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
    }
    menuButton.addEventListener("click", () => {
        const open = document.body.classList.toggle("nav-open");
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    });
    backdrop.addEventListener("click", closeMenu);
    document.querySelectorAll(".sidebar a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    // Clear stale edit state whenever the user starts a fresh post.
    document.querySelectorAll("#newPostButton, #writePostLink, #sidebarCreateLink").forEach(link => {
        link.addEventListener("click", () => sessionStorage.removeItem("editingPostId"));
    });

    loadPosts();
})();
