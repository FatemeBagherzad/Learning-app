# Cheat Sheets

**Live: [mylearning-app.netlify.app](https://mylearning-app.netlify.app)**

A single-page React + TypeScript app with one scrollable tab per subject — AI, Kubernetes,
Docker, Helm, Python, TypeScript, JavaScript, React and SQL. Mobile first, works just as well
on a wide screen. Everything is local — no accounts, no network.

Colours and card styling match the OPS learning app: light background, white-to-pastel cards
with a coloured left border, one colour per section so you can find your place by eye.

- **The whole header is sticky** — tabs, search, text size and theme stay on screen however
  far down a sheet you are.
- **Remembers where you were.** The open tab, how far down each sheet you had scrolled,
  which sections you folded, your theme and your text size all survive closing the app.
- **A− / A+** in the header resize the whole app (15 → 23px). Phone-comfortable 17px is the
  default on every device, since all sizes are rem-based.
- **Search** filters the current sheet as you type.
- **Fold a section** by tapping its heading.
- **Copy** any snippet with the button in its corner.
- **Scrollable tab strip** — add as many languages as you like, it never wraps or squashes.
- **Works offline** once built (a small service worker caches the app).

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

On your phone, with the phone on the same Wi-Fi as this PC:

```bash
npm run dev -- --host
```

then open the `Network:` address Vite prints (e.g. `http://192.168.1.20:5173`).

## Put it on your phone for good

```bash
npm run build        # output lands in dist/
npm run preview      # check the build locally
```

`dist/` is plain static files with relative paths, so it works on GitHub Pages, Netlify,
Vercel, or any folder on a web server.

It is deployed on Netlify at **[mylearning-app.netlify.app](https://mylearning-app.netlify.app)**
(build command `npm run build`, publish directory `dist`). Open it on the phone once and use
*Add to Home Screen* — it then opens full screen and works with no signal.

## Add a tab

1. Copy `src/data/python.ts` to `src/data/<language>.ts`.
2. Change `id` (keep it stable — it is the key your saved place is stored under),
   `label`, `lang` and `accent`, then write the sections.
3. Import it in `src/data/index.ts` and add it to the `sheets` array.

A sheet looks like this:

```ts
const sheet: Sheet = {
  id: 'go',
  label: 'Go',
  lang: 'javascript',       // used for syntax colours: python | typescript | javascript | shell
  accent: '#00ADD8',        // colour of the active tab
  sections: [
    {
      title: 'Basics',
      blurb: 'Optional one-liner under the heading.',
      snippets: [
        { note: 'Optional note above the code', code: `x := 1` },
      ],
    },
  ],
}
```

`lang` only picks the highlighter, so for a language without its own one, use the closest
of `python` / `javascript` / `typescript` / `sql` / `yaml` / `shell` (the React sheet uses
`typescript`, which covers JSX; the Docker sheet uses `shell`, which also knows the
Dockerfile instructions; `yaml` also highlights Go template actions, for Helm charts). Any snippet can override the sheet's language with its own
`lang`. To add a real highlighter, extend the keyword lists and rules in `src/highlight.ts`.

Section colours are assigned automatically — they cycle through blue, green, violet, orange,
sky, red and yellow in the order you list the sections, so you never pick one by hand.

## Layout of the code

| File | What it does |
| --- | --- |
| `src/App.tsx` | State, persistence (tab, scroll, folds, theme), header |
| `src/components/TabBar.tsx` | The scrollable tab strip |
| `src/components/SheetView.tsx` | Sections, search filtering, folding |
| `src/components/CodeBlock.tsx` | Code rendering + copy button |
| `src/highlight.ts` | Dependency-free syntax tokenizer |
| `src/styles.css` | All styling; colours are CSS variables at the top |
| `src/data/index.ts` | The list of sheets — this order is the tab order |
| `src/data/*.ts` | The cheat sheet content |

Colours live in `:root` (dark) and `html[data-theme='light']` in `src/styles.css` —
change them in one place and the whole app follows.
