# Workforce Pulse

Workforce Pulse is a modern workforce analytics dashboard that transforms messy HRMS and employee activity data into actionable business insights. The application cleans, normalizes, and combines multiple data sources to help organizations identify productivity patterns, repetitive work, and automation opportunities through an intuitive executive dashboard.

## ✨ Features

- 📊 Executive analytics dashboard
- 🧹 Data ingestion and normalization
- 🔗 Employee & activity data integration
- 📈 Productivity and department insights
- 🤖 AI-style business assistant
- 🎯 Automation opportunity ranking
- 💰 Recoverable hours and cost estimation
- 👥 Employee performance analysis
- 📅 Weekly productivity trends
- 📄 Executive summary export (CSV)
- ☀️ Light mode styling with dark layout containers
- 📱 Fully responsive UI

## 🛠️ Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Ant Design / Ant Design Icons
- Recharts
- date-fns

## 📂 Project Structure

```text
├── app/
│   ├── page.tsx (Server Component, hydrates the dashboard with pipeline dataset)
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ai/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatInput.tsx
│   │   ├── ChatMessage.tsx
│   │   └── SuggestedQuestions.tsx
│   ├── ui/ (Sleek UI container buttons and inputs)
│   └── dashboard/ (Charts, Matrix tables, and drawers)
├── data-pipeline/ (Data processing orchestrator)
│   ├── loaders/ (CSV/JSON file readers)
│   ├── normalizers/ (Employee, log, and compensation validators)
│   ├── join/ (Relationships mapper & metrics compiler)
│   └── index.ts
├── lib/
│   ├── ai/
│   │   ├── assistant.ts (Local query router)
│   │   ├── intentMatcher.ts (Keyword-based pattern matching)
│   │   └── answerGenerator.ts (On-the-fly metric calculation)
│   └── utils.ts
├── types/
└── public/
    └── data/ (employees.json and activity_logs.csv)
```

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/workforce-pulse-dashboard.git
cd workforce-pulse-dashboard
```

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open **http://localhost:3000** in your browser.

## 📊 Data Processing

The application reads:

- `employees.json`
- `activity_logs.csv`

The data pipeline:

1. Loads both datasets
2. Cleans inconsistent values
3. Normalizes employee records
4. Normalizes activity logs
5. Merges both datasets
6. Generates a single normalized dataset used throughout the application

## 💡 Dashboard Insights

- Recoverable Hours
- Recoverable Cost
- Department Analytics
- App Usage
- Task Category Analysis
- Employee Drill-down
- Weekly Trends
- Automation Priority Ranking

## 🤖 AI Assistant

The dashboard includes a local AI-style business assistant (Pulse Copilot) that answers workforce-related questions using the normalized dataset. Responses are generated on-the-fly from the processed data without relying on external AI services, making it completely private, fast, and secure with zero API key requirements.

## 📱 Responsive Design

Optimized for:

- Desktop
- Tablet
- Mobile

## 🌐 Deployment

The application can be deployed on:

- Vercel
- Netlify
- Railway
- Render

## 📄 License

This project is created for educational and portfolio purposes.
