ROSEMARY CROP PROFILE WEBSITE - POLISHED PROGRESS VERSION

Group: Cool People Club
Course: CSM3401 Multimedia Web Interaction

Live website:
https://rosemary-crop-profile-227233.web.app

IMPORTANT
This is a polished progress version, not the final product. The current
hand-drawn illustration panels are integrated as supporting visuals while all
main website content remains editable HTML. Final references and image credits
can still be added by the group before final submission.

PROJECT STRUCTURE
- public/index.html   Website content
- public/style.css    Responsive design
- public/script.js    Menu, checklist, FAQ, watering tool, and navigation interactions
- public/assets/illustrations/  Hand-drawn section illustration panels
- public/images/      Website icon and earlier SVG illustration asset
- firebase.json       Firebase Hosting configuration
- .firebaserc         Firebase project and Hosting target

QUICK PREVIEW
Open public/index.html in a web browser.

Or use Firebase local preview:
firebase serve --only hosting

FIREBASE DEPLOYMENT
Run these commands from this project folder:

firebase login
firebase deploy --only hosting:rosemary --project daisy-c2db8

The existing live site will then be updated.
