# Blogging Platform

A Blogger-inspired blogging platform built using HTML, CSS and JavaScript.

## Project Structure

- frontend/ - User interface and client-side functionality.
- backend/ - Planned backend architecture.

## Technologies

- HTML5
- CSS3
- JavaScript
- Git
- GitHub

## Current Features

- Responsive homepage# Blogging Platform

A full-stack, Blogger-inspired blogging platform built to let users create, manage, edit, and publish blog posts.

🌐 **Live Demo:** [Blogging Platform](https://blogging-platform-two-mu.vercel.app/)

## Project Structure

```text
blogging-platform/
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   └── create-blog.html
│
└── backend/
    ├── src/
    │   ├── config/
    │   ├── controllers/
    │   ├── middleware/
    │   ├── models/
    │   ├── routes/
    │   └── server.js
    └── package.json
```

## Technologies Used

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JSON Web Tokens (JWT)
- bcryptjs

**Tools & Deployment**
- Git & GitHub
- Postman
- Vercel (Frontend)
- Render (Backend)

## Features

- Responsive homepage and user interface
- User registration and login
- Password hashing and JWT-based authentication
- Personal user dashboard
- Create, edit, and delete blog posts
- Save posts as drafts
- Publish blog posts
- Public access to published posts
- Private draft management
- User-specific blog management
- Article preview

## Deployment

- **Frontend:** Hosted on Vercel
- **Backend:** Hosted on Render
- **Database:** MongoDB Atlas

## Run Locally

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd blogging-platform
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

Start the backend:

```bash
npm run dev
```

### 3. Run the frontend

Open another terminal:

```bash
cd frontend
python3 -m http.server 5500
```

Open `http://localhost:5500` in your browser.

Make sure the frontend API URL points to your local backend when running locally.

## Current Status

The full-stack application is deployed and accessible online.

## Disclaimer

An independent learning project inspired by Google's Blogger. Not affiliated with or endorsed by Google.
- Login and registration interfaces
- User dashboard
- Blog creation and editing
- Draft saving and publishing
- Article preview
- Browser localStorage

## Current Status

Frontend prototype completed.
Backend development planned.

## Disclaimer
An independent learning project inspired by Google's Blogger.
Not affiliated with Google.