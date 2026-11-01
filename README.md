# CAPACITY CONNECT – Digital Capacity Building and Learning Management Portal
### Smart India Hackathon (SIH 2026) | Problem Statement ID: SIH26075
#### Internet & Web Programming (IWP) Lab Mini-Project

---

## 📌 1. Project Overview
**CAPACITY CONNECT** is a responsive, lightweight, three-tiered Learning Management and Digital Capacity Building platform tailored for higher education and vocational skilling.

The application operates with role-based access control (RBAC):
- **👨‍🎓 Trainees / Students:** Discover technical courses, enroll with 1 click, stream module materials (PDFs), monitor progress, and attempt automated timed MCQ examinations.
- **👨‍🏫 Trainers / Faculty:** Author accredited courses, upload syllabus and notes directly to cloud storage, construct multiple-choice quizzes with timer controls, and track learner performance metrics.
- **🛡️ Administrators:** Platform governance console to approve/reject course proposals, audit user credentials, toggle account activation, and broadcast institutional announcements.

---

## 🛠️ 2. Technology Stack
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **UI & Layout:** Bootstrap 5.3 (CDN), Bootstrap Icons 1.11 (CDN)
* **Visualizations:** Chart.js (CDN)
* **Backend Platform:** Supabase
  * **Authentication:** GoTrue JWT Auth with role-based metadata
  * **Database:** PostgreSQL with Row Level Security (RLS)
  * **Storage:** S3-compatible Buckets (`course-thumbnails`, `learning-materials`, `user-avatars`)

> **Note on Architecture:** Built with pure client-side technologies without heavy frameworks (No React, Angular, or Node.js server dependencies), ensuring ultra-fast load times and instant static hosting compatibility.

---

## 🔑 3. Pre-Configured Demo Credentials

Use these verified accounts to demonstrate each user journey during evaluations:

| Portal | Role | Email | Password | Dashboard File |
| :--- | :--- | :--- | :--- | :--- |
| **Faculty Console** | Trainer | `armaan@gmail.com` | *(Your chosen password)* | `trainer-dashboard.html` |
| **Trainee Portal** | Student 1 | `student@connect.edu` | `Student@123` | `student-dashboard.html` |
| **Trainee Portal** | Student 2 | `priya.student@gmail.com` | `Student@123` | `student-dashboard.html` |
| **Admin Console** | Administrator | Direct Access via UI Guard | *(Session Auth)* | `admin-dashboard.html` |

---

## 📁 4. Project Structure

```text
├── index.html               # Public landing page with stats, course showcase & workflow
├── courses.html             # Public course catalog with category filter & live search
├── course-details.html      # Course syllabus, instructor profile, and 1-click enrollment
├── login.html               # Unified authentication portal with role auto-redirection
├── register.html            # Registration form (Student / Trainer role selector)
├── forgot-password.html     # Self-service password recovery
├── student-dashboard.html   # Trainee console (6 tabs: Overview, Courses, PDFs, Quizzes, Results, Announcements)
├── trainer-dashboard.html   # Faculty console (Course creator, PDF uploader, Quiz builder, Performance table)
├── admin-dashboard.html     # Governance console (Chart.js analytics, Course approvals, User status toggle)
├── profile.html             # User profile settings & bio update
├── css/
│   └── style.css            # Custom CSS theme (Deep Navy #0f2942 & Teal #0d9488)
├── js/
│   ├── supabase-config.js   # Supabase client initializer
│   ├── common.js            # Session guards, dynamic navbar, toast alerts, role router
│   ├── auth.js              # Signup, login, password recovery controller
│   ├── courses.js           # Public catalog & course detail fetchers
│   ├── student.js           # Enrollments, PDF materials, quiz submission & result logger
│   ├── trainer.js           # Course creator, Storage uploader, MCQ quiz builder
│   └── admin.js             # Statistics aggregator, course approver, user status manager
└── supabase/
    ├── schema.sql           # Complete PostgreSQL schema (9 tables, RLS policies, storage buckets)
    └── seed.sql             # SQL script to inject pre-verified student accounts & records
```

---

## 🚀 5. Deployment Options

Because CAPACITY CONNECT is 100% static, you can deploy it for free in under 2 minutes:

### Option A: GitHub Pages (Recommended for College Lab Submissions)
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Capacity Connect"
   ```
2. Push to a new GitHub repository:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/capacity-connect.git
   git push -u origin main
   ```
3. In your GitHub repository:
   * Go to **Settings** → **Pages**.
   * Under **Branch**, select `main` / `root` and click **Save**.
   * Your site will be live at `https://<YOUR_USERNAME>.github.io/capacity-connect/`!

### Option B: Vercel / Netlify (Drag & Drop)
* **Vercel:** Run `npx vercel` or import the GitHub repository.
* **Netlify:** Drag and drop the project folder directly into the Netlify dashboard.

---

## ⚙️ 6. Post-Deployment Supabase Configuration
Once your website is deployed, add your live domain to Supabase so authentication and redirects work seamlessly:
1. Open your **[Supabase Dashboard](https://supabase.com/dashboard/project/aqqefwjuprvsthoeuxes)**.
2. Go to **Authentication** → **URL Configuration**.
3. Under **Site URL**, paste your live domain (e.g., `https://your-username.github.io/capacity-connect`).
4. Under **Redirect URLs**, add `https://your-username.github.io/capacity-connect/**`.
5. Click **Save**.
