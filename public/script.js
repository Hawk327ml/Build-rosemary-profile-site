// Public Firebase web config (access control is Auth + firestore.rules).
// Setup: Email/Password auth + Firestore must be enabled in project daisy-c2db8.
const firebaseConfig = {
  apiKey: "AIzaSyD70bRekX84bNfbsVmapDNCm9RqOFNUQvo",
  authDomain: "daisy-c2db8.firebaseapp.com",
  projectId: "daisy-c2db8",
  storageBucket: "daisy-c2db8.firebasestorage.app",
  messagingSenderId: "305735485435",
  appId: "1:305735485435:web:e8ed60d72ebbe6d2aead5e",
  measurementId: "G-PQGQEVBJ0Q",
};

const checklistFields = [
  "sunlight",
  "soilDry",
  "drainageHoles",
  "wateredOnlyNeeded",
  "checkedLeaves",
  "checkedPests",
  "trimmedThisWeek",
];

const careFieldMap = {
  sunlight: "sunlight",
  soilDry: "soilDry",
  drainageHoles: "drainage",
  wateredOnlyNeeded: "waterOnlyWhenNeeded",
  checkedLeaves: "leavesChecked",
  checkedPests: "pestsChecked",
  trimmedThisWeek: "trimmed",
};

const recordFieldLabels = {
  sunlight: "Sunlight",
  soilDry: "Soil Dry",
  drainage: "Drainage",
  waterOnlyWhenNeeded: "Water",
  leavesChecked: "Leaves",
  pestsChecked: "Pests",
  trimmed: "Trim",
};

let activeUser = null;
let firestoreDb = null;

// Wait until the HTML is ready before selecting page elements.
document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("js-ready");

  setupMobileMenu();
  setupStickyNavigation();
  setupHeroSlider();
  setupAudioToggle();
  setupScrollReveal();

  const checklistApi = setupChecklist();
  setupFirebase(checklistApi);

  setupWateringTool();
  setupAccordion();
});

// Mobile navigation: open, close, and keep ARIA state accurate.
function setupMobileMenu() {
  const menuButton = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (!menuButton || !navLinks) return;

  const closeMenu = () => {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".sr-only").textContent = "Open navigation menu";
    navLinks.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuButton.addEventListener("click", () => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!isOpen));
    menuButton.querySelector(".sr-only").textContent = isOpen
      ? "Open navigation menu"
      : "Close navigation menu";
    navLinks.classList.toggle("is-open", !isOpen);
    document.body.classList.toggle("menu-open", !isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (event.key === "Escape" && isOpen) {
      closeMenu();
      menuButton.focus();
    }
  });

  // Close the menu when a phone user taps outside the navigation area.
  document.addEventListener("click", (event) => {
    const isOpen = menuButton.getAttribute("aria-expanded") === "true";
    if (isOpen && !event.target.closest(".nav")) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 800) closeMenu();
  });
}

// Sticky navigation: add a light shadow and mark the section being viewed.
function setupStickyNavigation() {
  const header = document.querySelector(".site-header");
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if (!header) return;

  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      navLinks.forEach((link) => link.removeAttribute("aria-current"));
      const activeLink = navLinks.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
      activeLink?.setAttribute("aria-current", "page");
    });
  }, { rootMargin: "-25% 0px -65%", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
}

// Hero slider: fade transition with controls, optional autoplay, reduced-motion safe.
function setupHeroSlider() {
  const slider = document.querySelector(".hero-slider");
  const slides = [...document.querySelectorAll(".hero-slide")];
  const dots = [...document.querySelectorAll(".slider-dot")];
  const prevButton = document.querySelector("#prev-slide");
  const nextButton = document.querySelector("#next-slide");
  let currentSlide = 0;
  let autoplayId = null;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!slides.length || !dots.length) return;

  const showSlide = (index) => {
    currentSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-active", slideIndex === currentSlide);
    });

    dots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentSlide;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-selected", String(isActive));
    });
  };

  const stopAutoplay = () => {
    if (autoplayId) {
      window.clearInterval(autoplayId);
      autoplayId = null;
    }
  };

  const startAutoplay = () => {
    if (reduceMotion || slides.length < 2) return;
    stopAutoplay();
    autoplayId = window.setInterval(() => showSlide(currentSlide + 1), 5500);
  };

  const onManualChange = (index) => {
    showSlide(index);
    startAutoplay();
  };

  prevButton?.addEventListener("click", () => onManualChange(currentSlide - 1));
  nextButton?.addEventListener("click", () => onManualChange(currentSlide + 1));
  dots.forEach((dot, index) => dot.addEventListener("click", () => onManualChange(index)));

  slider?.addEventListener("pointerenter", stopAutoplay);
  slider?.addEventListener("pointerleave", startAutoplay);
  slider?.addEventListener("focusin", stopAutoplay);
  slider?.addEventListener("focusout", (event) => {
    if (!slider.contains(event.relatedTarget)) startAutoplay();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAutoplay();
    else startAutoplay();
  });

  startAutoplay();
}

// Calming audio: use only the real MP3 file, never autoplay, and hide the button if it cannot load.
function setupAudioToggle() {
  const widget = document.querySelector("#audio-widget");
  const button = document.querySelector("#audio-toggle");
  const audio = document.querySelector("#garden-audio");

  if (!widget || !button || !audio) return;

  audio.volume = 0.55;

  const showAudioButton = () => {
    widget.hidden = false;
  };

  const hideAudioButton = () => {
    widget.hidden = true;
    console.warn("Calming garden audio could not load. The audio button is hidden.");
  };

  const updateButton = () => {
    const isPlaying = !audio.paused && !audio.ended;
    button.setAttribute("aria-pressed", String(isPlaying));
    button.textContent = isPlaying ? "Pause audio" : "Play calming garden sound";
  };

  audio.addEventListener("loadedmetadata", showAudioButton, { once: true });
  audio.addEventListener("canplaythrough", showAudioButton, { once: true });
  audio.addEventListener("error", hideAudioButton);
  audio.addEventListener("pause", updateButton);
  audio.addEventListener("ended", updateButton);

  button.addEventListener("click", async () => {
    try {
      if (audio.paused || audio.ended) {
        await audio.play();
      } else {
        audio.pause();
      }
      updateButton();
    } catch (error) {
      hideAudioButton();
      console.warn("Calming garden audio could not play.", error);
    }
  });

  audio.load();
}

// Section reveal: light animation that keeps the page readable.
function setupScrollReveal() {
  const revealItems = [...document.querySelectorAll(".section, .site-footer")];
  revealItems.forEach((item) => item.classList.add("reveal"));

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => observer.observe(item));
}

// Firebase Authentication and Firestore checklist saving.
async function setupFirebase(checklistApi) {
  const signupForm = document.querySelector("#signup-form");
  const loginForm = document.querySelector("#login-form");
  const logoutButton = document.querySelector("#logout-button");
  const authState = document.querySelector("#auth-state");
  const authTitle = document.querySelector("#auth-title");
  const authMessage = document.querySelector("#auth-message");

  if (!signupForm || !loginForm || !logoutButton || !checklistApi) return;

  try {
    const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    ]);

    const app = initializeApp(firebaseConfig);
    const auth = authModule.getAuth(app);
    firestoreDb = firestoreModule.getFirestore(app);

    const updateAuthStatus = (user) => {
      activeUser = user;
      authState.textContent = user ? "Logged in" : "Not logged in";
      authState.classList.toggle("is-logged-in", Boolean(user));
      authTitle.textContent = user
        ? "Your checklist data is saved separately from other users."
        : "Please log in to save your rosemary care data.";
      authMessage.textContent = user
        ? `Signed in as ${user.email}. Checklist changes will be saved to Firestore.`
        : "You can still try the checklist, but cloud saving starts after login.";
      logoutButton.hidden = !user;
    };

    const careLogDocRef = (uid, date = getLocalDateKey()) => firestoreModule.doc(
      firestoreDb,
      "users",
      uid,
      "careLogs",
      date,
    );

    const careLogsCollectionRef = (uid) => firestoreModule.collection(
      firestoreDb,
      "users",
      uid,
      "careLogs",
    );

    const loadTodayRecord = async (user) => {
      if (!user) {
        checklistApi.setSaveStatus("Please log in to save and view your daily rosemary care history.", "warning");
        renderHistoryTable([]);
        renderRecordDetail(null);
        return;
      }

      try {
        checklistApi.setSaveStatus("Loading today's care record from Firebase...", "saved");
        const snapshot = await firestoreModule.getDoc(careLogDocRef(user.uid));
        checklistApi.setAnswers(snapshot.exists() ? recordToChecklistAnswers(snapshot.data()) : {});
        checklistApi.setSaveStatus(
          snapshot.exists()
            ? "Today's saved rosemary care record has been loaded."
            : "No record for today yet. Answer the checklist, then save today's record.",
          "saved",
        );
      } catch (error) {
        checklistApi.setSaveStatus(readableFirebaseError(error), "error");
      }
    };

    const loadHistory = async (user) => {
      if (!activeUser) {
        renderHistoryTable([]);
        renderRecordDetail(null);
        return;
      }

      try {
        const recentQuery = firestoreModule.query(
          careLogsCollectionRef(user.uid),
          firestoreModule.orderBy("date", "desc"),
          firestoreModule.limit(14),
        );
        const snapshot = await firestoreModule.getDocs(recentQuery);
        const records = snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }));
        renderHistoryTable(records);
        renderRecordDetail(records[0] || null);
      } catch (error) {
        renderHistoryTable([]);
        checklistApi.setSaveStatus(readableFirebaseError(error), "error");
      }
    };

    const saveTodayRecord = async () => {
      if (!activeUser) {
        checklistApi.setSaveStatus("Please log in to save and view your daily rosemary care history.", "warning");
        return;
      }

      try {
        const record = checklistAnswersToRecord(checklistApi.getAnswers());
        checklistApi.setSaveStatus("Saving today's rosemary care record...", "saved");
        await firestoreModule.setDoc(careLogDocRef(activeUser.uid, record.date), {
          ...record,
          updatedAt: firestoreModule.serverTimestamp(),
        }, { merge: true });
        checklistApi.setSaveStatus("Today's rosemary care record has been saved.", "saved");
        await loadHistory(activeUser);
      } catch (error) {
        checklistApi.setSaveStatus(readableFirebaseError(error), "error");
      }
    };

    checklistApi.setSaveHandler(() => {
      checklistApi.setSaveStatus("Unsaved changes. Click Save Today's Record to store this day.", "warning");
    });
    checklistApi.setSaveTodayHandler(saveTodayRecord);

    authModule.onAuthStateChanged(auth, async (user) => {
      updateAuthStatus(user);
      await loadTodayRecord(user);
      await loadHistory(user);
    });

    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = signupForm.querySelector('input[name="email"]').value.trim();
      const password = signupForm.querySelector('input[name="password"]').value;

      try {
        authMessage.textContent = "Creating account...";
        await authModule.createUserWithEmailAndPassword(auth, email, password);
        signupForm.reset();
      } catch (error) {
        authMessage.textContent = readableFirebaseError(error);
      }
    });

    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = loginForm.querySelector('input[name="email"]').value.trim();
      const password = loginForm.querySelector('input[name="password"]').value;

      try {
        authMessage.textContent = "Logging in...";
        await authModule.signInWithEmailAndPassword(auth, email, password);
        loginForm.reset();
      } catch (error) {
        authMessage.textContent = readableFirebaseError(error);
      }
    });

    logoutButton.addEventListener("click", async () => {
      await authModule.signOut(auth);
      checklistApi.setAnswers({});
      renderHistoryTable([]);
      renderRecordDetail(null);
    });
  } catch (error) {
    authTitle.textContent = "Firebase could not load.";
    authMessage.textContent = "Check the internet connection and Firebase Console settings before testing login.";
    checklistApi.setSaveStatus(readableFirebaseError(error), "error");
  }
}

// Checklist: count Yes/No answers and send changes to Firestore when logged in.
function setupChecklist() {
  const countText = document.querySelector("#progress-count");
  const message = document.querySelector("#progress-message");
  const saveStatus = document.querySelector("#save-status");
  const progressBar = document.querySelector(".progress-track");
  const progressFill = document.querySelector("#progress-fill");
  const progressPanel = document.querySelector(".progress-panel");
  const resetButton = document.querySelector("#reset-checklist");
  const saveTodayButton = document.querySelector("#save-today-record");
  let saveHandler = null;
  let saveTodayHandler = null;

  if (!countText || !message || !progressBar || !progressFill) return null;

  const syncSelectedStyles = () => {
    document.querySelectorAll(".answer-options label").forEach((label) => {
      const input = label.querySelector("input");
      label.classList.toggle("is-selected", Boolean(input?.checked));
    });
  };

  const getAnswers = () => checklistFields.reduce((answers, field) => {
    const selected = document.querySelector(`input[name="${field}"]:checked`);
    if (selected) answers[field] = selected.value;
    return answers;
  }, {});

  const updateProgress = () => {
    syncSelectedStyles();
    const answered = Object.keys(getAnswers()).length;
    const total = checklistFields.length;
    const percent = (answered / total) * 100;

    countText.textContent = `${answered} / ${total}`;
    progressFill.style.width = `${percent}%`;
    progressBar.setAttribute("aria-valuemax", String(total));
    progressBar.setAttribute("aria-valuenow", String(answered));
    progressPanel?.classList.toggle("is-complete", answered === total);

    if (answered === total) {
      message.textContent = "Great job! Your rosemary care checklist is complete!";
      message.classList.add("complete");
    } else if (answered === 0) {
      message.textContent = "0 of 7 care checks answered. Start with sunlight and soil.";
      message.classList.remove("complete");
    } else {
      message.textContent = `${answered} of ${total} care checks answered. Keep going one question at a time.`;
      message.classList.remove("complete");
    }
  };

  const setAnswers = (answers = {}) => {
    checklistFields.forEach((field) => {
      document.querySelectorAll(`input[name="${field}"]`).forEach((input) => {
        input.checked = answers[field] === input.value;
      });
    });
    syncSelectedStyles();
    updateProgress();
  };

  const setSaveStatus = (text, type = "warning") => {
    if (!saveStatus) return;
    saveStatus.textContent = text;
    saveStatus.classList.toggle("is-saved", type === "saved");
    saveStatus.classList.toggle("is-error", type === "error");
  };

  document.querySelectorAll(".checklist input[type='radio']").forEach((input) => {
    input.addEventListener("change", () => {
      updateProgress();
      saveHandler?.(getAnswers());
    });
  });

  resetButton?.addEventListener("click", () => {
    setAnswers({});
    saveHandler?.({});
    document.querySelector(".checklist input[type='radio']")?.focus();
  });

  saveTodayButton?.addEventListener("click", () => {
    if (saveTodayHandler) {
      saveTodayHandler();
      return;
    }

    setSaveStatus("Please log in to save and view your daily rosemary care history.", "warning");
  });

  updateProgress();

  return {
    getAnswers,
    setAnswers,
    setSaveHandler(handler) {
      saveHandler = handler;
    },
    setSaveTodayHandler(handler) {
      saveTodayHandler = handler;
    },
    setSaveStatus,
  };
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function checklistAnswersToRecord(answers) {
  const record = {
    date: getLocalDateKey(),
    totalQuestions: checklistFields.length,
  };

  checklistFields.forEach((field) => {
    record[careFieldMap[field]] = answers[field] || null;
  });

  record.answeredCount = checklistFields.filter((field) => Boolean(answers[field])).length;
  return record;
}

function recordToChecklistAnswers(record = {}) {
  return checklistFields.reduce((answers, field) => {
    const recordField = careFieldMap[field];
    if (record[recordField]) answers[field] = record[recordField];
    return answers;
  }, {});
}

function renderHistoryTable(records) {
  const tableBody = document.querySelector("#history-table-body");
  const summary = document.querySelector("#history-summary");
  const todayLabel = document.querySelector("#today-date-label");

  if (!tableBody) return;

  tableBody.replaceChildren();
  if (todayLabel) todayLabel.textContent = `Today: ${getLocalDateKey()}`;

  if (!activeUser) {
    summary && (summary.textContent = "Please log in to save and view your daily rosemary care history.");
    tableBody.appendChild(createEmptyHistoryRow("Log in to load your personal care history."));
    return;
  }

  if (!records.length) {
    summary && (summary.textContent = "No saved daily records yet. Save today's checklist to begin your history.");
    tableBody.appendChild(createEmptyHistoryRow("No saved daily records yet."));
    return;
  }

  summary && (summary.textContent = `${records.length} recent daily record${records.length === 1 ? "" : "s"} loaded.`);

  records.forEach((record, index) => {
    const row = document.createElement("tr");
    row.className = "history-row";
    if (index === 0) row.classList.add("is-selected");

    const dateCell = document.createElement("td");
    const dateButton = document.createElement("button");
    dateButton.type = "button";
    dateButton.textContent = record.date || record.id || "Unknown date";
    dateButton.addEventListener("click", () => {
      document.querySelectorAll(".history-row").forEach((historyRow) => historyRow.classList.remove("is-selected"));
      row.classList.add("is-selected");
      renderRecordDetail(record);
    });
    dateCell.appendChild(dateButton);
    row.appendChild(dateCell);

    ["sunlight", "soilDry", "drainage", "waterOnlyWhenNeeded", "leavesChecked", "pestsChecked", "trimmed"].forEach((field) => {
      const cell = document.createElement("td");
      cell.appendChild(createAnswerBadge(record[field]));
      row.appendChild(cell);
    });

    const scoreCell = document.createElement("td");
    const scoreBadge = createAnswerBadge(`${record.answeredCount || 0}/${record.totalQuestions || 7}`, "score");
    scoreBadge.classList.add("score-badge");
    scoreCell.appendChild(scoreBadge);
    row.appendChild(scoreCell);

    tableBody.appendChild(row);
  });
}

function createEmptyHistoryRow(message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = 9;
  cell.className = "history-empty";
  cell.textContent = message;
  row.appendChild(cell);
  return row;
}

function createAnswerBadge(value, forcedType) {
  const badge = document.createElement("span");
  const normalized = String(value || "").toLowerCase();
  const type = forcedType || (normalized === "yes" ? "yes" : normalized === "no" ? "no" : "empty");
  badge.className = `answer-badge ${type}`;
  badge.textContent = forcedType === "score"
    ? value
    : normalized === "yes"
      ? "Yes"
      : normalized === "no"
        ? "No"
        : "-";
  return badge;
}

function renderRecordDetail(record) {
  const detailCard = document.querySelector("#record-detail");
  const detailList = document.querySelector("#record-detail-list");

  if (!detailCard || !detailList) return;

  detailList.replaceChildren();

  const title = detailCard.querySelector("h3");
  const copy = detailCard.querySelector("p");

  if (!record) {
    title.textContent = "Care record details";
    copy.textContent = activeUser
      ? "Save a daily checklist record, then select a date to review all seven answers."
      : "Log in to view your personal rosemary care history.";
    return;
  }

  title.textContent = `Care record for ${record.date || record.id}`;
  copy.textContent = `${record.answeredCount || 0} of ${record.totalQuestions || 7} checks answered.`;

  Object.entries(recordFieldLabels).forEach(([field, label]) => {
    const row = document.createElement("div");
    row.className = "detail-row";

    const labelText = document.createElement("span");
    labelText.textContent = label;
    row.appendChild(labelText);
    row.appendChild(createAnswerBadge(record[field]));
    detailList.appendChild(row);
  });

  const meta = document.createElement("p");
  meta.className = "detail-meta";
  meta.textContent = `Last updated: ${formatUpdatedAt(record.updatedAt)}`;
  detailList.appendChild(meta);
}

function formatUpdatedAt(updatedAt) {
  if (!updatedAt) return "Not available yet";

  const date = typeof updatedAt.toDate === "function"
    ? updatedAt.toDate()
    : updatedAt instanceof Date
      ? updatedAt
      : null;

  return date
    ? date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    : "Not available yet";
}

// Watering tool: gives a simple decision based on soil feel and pot drainage.
function setupWateringTool() {
  const form = document.querySelector("#watering-tool");
  const advice = document.querySelector("#water-advice");

  if (!form || !advice) return;

  const updateAdvice = () => {
    const soilFeel = form.querySelector('input[name="soil-feel"]:checked')?.value;
    const drainage = form.querySelector('input[name="drainage"]:checked')?.value;

    advice.classList.remove("success", "warning");

    if (!soilFeel || !drainage) {
      advice.textContent = "Please choose one soil answer and one drainage answer first.";
      advice.classList.add("warning");
      return;
    }

    if (drainage === "no") {
      advice.textContent = "Do not water heavily yet. Rosemary needs a pot with drainage holes, or the roots may stay too wet.";
      advice.classList.add("warning");
      return;
    }

    if (soilFeel === "dry") {
      advice.textContent = "Yes, water slowly until a little water drains from the bottom. Empty the saucer after watering.";
      advice.classList.add("success");
      return;
    }

    advice.textContent = "Skip watering today. Check again when the top 2 to 3 cm of soil feels dry.";
    advice.classList.add("success");
  };

  form.addEventListener("change", updateAdvice);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateAdvice();
  });
}

// FAQ accordion: open one answer at a time and allow it to close again.
function setupAccordion() {
  const questions = [...document.querySelectorAll(".faq-question")];

  questions.forEach((question) => {
    question.addEventListener("click", () => {
      const wasOpen = question.getAttribute("aria-expanded") === "true";

      questions.forEach((otherQuestion) => {
        const otherAnswer = document.getElementById(otherQuestion.getAttribute("aria-controls"));
        otherQuestion.setAttribute("aria-expanded", "false");
        otherQuestion.closest(".faq-item")?.classList.remove("is-open");
        otherAnswer?.setAttribute("aria-hidden", "true");
      });

      if (!wasOpen) {
        const answer = document.getElementById(question.getAttribute("aria-controls"));
        question.setAttribute("aria-expanded", "true");
        question.closest(".faq-item")?.classList.add("is-open");
        answer?.setAttribute("aria-hidden", "false");
      }
    });
  });
}

function readableFirebaseError(error) {
  const code = error?.code || "";

  if (code.includes("auth/operation-not-allowed")) {
    return "Firebase Email/Password sign-in is not enabled yet. Enable it in Firebase Console > Authentication > Sign-in method.";
  }

  if (code.includes("auth/email-already-in-use")) {
    return "This email already has an account. Try logging in instead.";
  }

  if (code.includes("auth/weak-password")) {
    return "Password should be at least 6 characters.";
  }

  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
    return "Login failed. Check the email and password.";
  }

  if (code.includes("permission-denied")) {
    return "Firestore permission denied. Check Firestore rules for user-owned checklist data.";
  }

  if (String(error?.message || "").includes("firestore.googleapis.com")) {
    return "Cloud Firestore is not enabled yet. Enable the Firestore API and create a database in Firebase Console.";
  }

  return error?.message || "Something went wrong. Please check Firebase setup.";
}
