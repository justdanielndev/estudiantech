# Estudiantech

Full school portal based around the Educamos API.
It supports pretty much all the same features their site does, but has an extremely better UI, faster API, extra features created by me and doesn't have security issues everywhere :)

Not affiliated with Educamos in any way.

## Features

- **Dashboard** (Info on tasks, schedule, announcements, and birthdays)
- **Schedule (Horario)**
- **Tasks (Tareas)**
- **Subjects (Asignaturas) and grades**
- **Announcements (Circulares)**
- **Incidents (Incidencias)**
- **Push Notifications**
- **Light/dark mode support**

## Demo Mode

To try the app without real data, use:
- **Username:** `demo`
- **Password:** `demo`

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/justdanielndev/estudiantech.git
cd estudiantech

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit the .env file with your vars
nano .env

# Start development server
pnpm dev
```

### Environment Variables

See `.env.example` for all required variables, since these change on each version I push :) (help)