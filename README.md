# Rosemary Care Notebook

CSM3401 Multimedia Web Interaction · Firebase Hosting botanical guide.

**Live:** https://rosemary-care-notebook.web.app  
**Portfolio:** https://hawk327ml.github.io/  
**Group:** Cool People Club

## What visitors can do

- Read balcony rosemary care guidance (profile, uses, 4-step grow guide, FAQ)
- Use interactive **weekly checklist** with progress feedback
- Try the **watering decision tool**
- Browse a **care calendar**
- Sign up / log in to save checklist answers to **Firestore** (per-user rules)

## Preview

Open `public/index.html` in a browser, or:

```bash
firebase serve --only hosting
```

## Deploy

```bash
firebase login
firebase deploy --only hosting:rosemary --project daisy-c2db8
```

## Structure

```text
public/index.html      # page content + SEO meta
public/style.css       # responsive layout
public/script.js       # menu, slider, checklist, Firebase, watering tool
public/assets/         # illustrations + optional garden audio
firebase.json          # hosting + firestore rules wiring
.firebaserc            # hosting target rosemary-care-notebook
firestore.rules        # users/{uid}/careLogs only for owner
```

## Security notes

- Firebase web config in `script.js` is public client config (normal for web apps).
- Access control relies on Authentication + `firestore.rules` (user can only read/write own care logs).
- Enable Email/Password auth and Firestore in the Firebase console if local demos fail.

## Notes

Hand-drawn illustration panels support the HTML content. Older alternate hosting URL in history: `rosemary-crop-profile-227233.web.app`.
