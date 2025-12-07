🌟 ApniDisha – Swadeshi Smart Education Platform
A National Career Guidance & Smart Education System for Students Across India
Developed by: Team Code Cadets | Smart India Hackathon (SIH) 2025

A full-stack intelligent career guidance system helping students discover suitable career paths based on their personality, interests, and aptitude. Designed to bridge the gap between urban and rural career awareness.

📌 Repository Overview :
This repository contains the frontend, backend, career quiz logic, and AI recommendation workflow.

📦 ApniDisha/
├── Backend/              # API, authentication, quiz logic, DB handlers
├── public/               # Static assets
├── src/                  # Frontend source (React + Vite + Tailwind)
├── .env                  # Environment variables
├── index.html
├── package.json
└── vite.config.js

🎯 Features
🔐 User Authentication

🧠 AI-Based Career Recommendation

📝 Interest + Skill + Personality Quiz

🎓 College, Career, and Roadmap Suggestions

🌍 Multilingual Support

📱 Responsive UI with Tailwind

## 🧩 UML Flow (System Interaction)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant AIEngine
    participant DB

    User->>Frontend: Login / Signup
    Frontend->>Backend: Authenticate User
    Backend->>DB: Validate Credentials
    DB-->>Backend: Auth Result
    Backend-->>Frontend: Token + Profile

    User->>Frontend: Starts Career Quiz
    Frontend->>Backend: Submit Answers
    Backend->>AIEngine: Process Quiz Scores
    AIEngine-->>Backend: Recommended Careers
    Backend-->>Frontend: Show Results + Roadmap

⚙️ Tech Stack 
Frontend - React + Vite + Tailwind CSS

Backend - Node.js / Express

Database - MongoDB

AI Logic - Rule-Based Scoring + Recommendation Engine

🧪 Quiz Scoring Explanation
The quiz evaluates:

Interest - What user enjoys

Skills - What user is good at

Personality - Behavioral fit

Aptitude - Strength mapping

Scores → Career clusters → Final personalized career match.

🚀 Setup & Install
1️⃣ Clone Repository
git clone https://github.com/yourusername/ApniDisha.git
cd ApniDisha

2️⃣ Install Dependencies
npm install

3️⃣ Environment Setup
Create a .env file:

VITE_API_URL=http://localhost:5000
SECRET_KEY=your_key_here

4️⃣ Run Backend
cd Backend
npm install
npm start

5️⃣ Run Frontend
npm run dev

👩‍💻 Contributors
Pranay Gumashta
Atharva Patil
Manish Khushawa
Rushikesh
Om Selkar
Fatima Zaki

📄 License
MIT License ©️ 2025 — ApniDisha Team

## 📬 Contact

📧 Email: **team.codecadets@gmail.com**  
📌 Based in Maharashtra, India

----------

### 🇮🇳 _“Right guidance at the right time can change a student's entire future — ApniDisha exists to deliver that guidance.”_