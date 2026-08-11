# Rosemary Care Notebook

CSM3401 Multimedia Web Interaction · Firebase Hosting product profile site.

**Live:** https://rosemary-care-notebook.web.app  
**Portfolio:** https://hawk327ml.github.io/

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
public/index.html      # page content
public/style.css       # responsive layout
public/script.js       # menu, checklist, FAQ, watering tool
public/assets/         # illustrations + audio
firebase.json          # hosting + firestore rules wiring
.firebaserc            # project / hosting target (rosemary-care-notebook)
```

## Notes

Group: Cool People Club. Hand-drawn illustration panels support the HTML content. Older alternate hosting URL in history: `rosemary-crop-profile-227233.web.app`.
