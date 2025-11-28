# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b67ea1ec-a319-4d04-b910-d04edd927d3d

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b67ea1ec-a319-4d04-b910-d04edd927d3d) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b67ea1ec-a319-4d04-b910-d04edd927d3d) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## Bot automation architecture

Trading bots now live in `src/bots/<bot-slug>`.  
Each folder contains:

- `bot.ts` (or `.py` for prototypes): the executable script used both in CI and locally.
- `strategy.md`: concise markdown explaining the trading playbook that powers the dashboard copy.
- `history.json`: activation/deactivation log consumed by the UI.

### Running bots locally (PowerShell)

```powershell
npm install
npm run bot:momentum
```

The command loads `.env.local` automatically through the script, so keep your Firebase/Supabase/BOT credentials in that file.  
Use the `npm run bot:<slug>` naming convention for any new bots you add under `src/bots`.

### GitHub Actions

`.github/workflows/run-bots.yml` still calls `npm run bot:momentum`; because the npm script now points to `src/bots/momentum/bot.ts`, no workflow changes are required beyond the updated repository layout.

After each successful workflow run, `npm run bot:record-activation -- <slug> activated` is executed to append an event inside `src/bots/<slug>/history.json`. The workflow auto-commits that file back to the default branch, so activation dates seen in the UI always reflect the most recent CI execution.
