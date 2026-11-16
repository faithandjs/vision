# enVision

A personal vision board. Pin a picture for each thing you're working toward this year, add notes, lists and checklists, and tick items off as you go.

- **Collage view**: a masonry board of your images; click one to open its details.
- **Cards view**: flip cards with your notes and checklists on the back, plus a "Flip all" toggle.
- **Editor** (`/edit`): set your board's title and theme, then add, reorder and remove cards.
- Light and dark themes, sign-in with Google or email and password, and live sync through the Firebase Realtime Database.

Signed-out visitors see an example board. New accounts start from the same example until they save their own.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS 4, Firebase (Auth and Realtime Database), TypeScript.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Firebase keys
npm run dev
```

The app runs without Firebase keys, but only the example board is available.

### Firebase setup

1. Create a project at <https://console.firebase.google.com/> and add a **Web app**. Copy its config values into `.env.local`.
2. **Authentication → Sign-in method**: enable the providers you want:
   - **Email/Password**
   - **Google**: enable it and pick a support email.
   - **Authentication → Settings → Authorized domains**: add your production domain (`localhost` is allowed by default).
3. **Realtime Database**: create a database. If it isn't in the default US region, also set `NEXT_PUBLIC_FIREBASE_DATABASE_URL`.
4. Deploy the security rules in [`database.rules.json`](database.rules.json) so each user can only read and write their own board:

   ```bash
   npx firebase login        # one time, opens the browser
   npm run deploy:rules
   ```

   The target project is set in `.firebaserc`. Change it if you use a different Firebase project.

Each board is stored at `users/{uid}` as `{ title, theme, data: Card[] }`.

## Scripts

| Command         | What it does             |
| --------------- | ------------------------ |
| `npm run dev`   | Start the dev server     |
| `npm run build` | Production build         |
| `npm start`     | Serve the production build |
| `npm run lint`  | ESLint                   |
| `npm run deploy:rules` | Deploy Realtime Database security rules |

## Project layout

```
src/
  app/            routes: / (board), /edit, /signin, /signup
  components/     board views, editor, auth form, header
  context/        theme, toast, auth and board providers
  firebase/       lazy Firebase init, auth and database helpers
  lib/            types, board normalization, example board
  hooks/          localStorage-backed state
```
