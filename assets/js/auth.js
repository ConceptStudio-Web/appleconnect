// Firebase-based auth + Firestore profile helpers
(function () {
  // Requires firebase compat SDKs and window.FIREBASE_CONFIG loaded on the page.
  if (typeof firebase !== 'undefined' && !firebase.apps.length && window.FIREBASE_CONFIG) {
    firebase.initializeApp(window.FIREBASE_CONFIG);
  }

  const auth = (typeof firebase !== 'undefined') ? firebase.auth() : null;
  const db = (typeof firebase !== 'undefined') ? firebase.firestore() : null;

  function getSession() {
    const u = auth && auth.currentUser;
    return u ? { uid: u.uid, email: u.email } : null;
  }

  async function registerUser({ firstName, surname, birthday, email, whatsapp, password }) {
    if (!auth || !db) throw new Error('Firebase not initialized');
    if (!email) throw new Error('Email is required');
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    const user = cred.user;
    // Create Firestore user profile. Staff can edit this document manually to set role: 'admin'.
    await db.collection('users').doc(user.uid).set({
      firstName: firstName || '',
      surname: surname || '',
      birthday: birthday || '',
      email: user.email,
      whatsapp: whatsapp || '',
      role: 'customer',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return { firstName, surname, birthday, email: user.email, whatsapp };
  }

  async function loginUser(username, password) {
    if (!auth) throw new Error('Firebase not initialized');
    const key = (username || '').trim().toLowerCase();
    if (!key.includes('@')) throw new Error('Please log in with your email address.');
    const cred = await auth.signInWithEmailAndPassword(key, password);
    const u = cred.user;
    if (!db) return { email: u.email };
    try {
      const snap = await db.collection('users').doc(u.uid).get();
      const prof = snap.exists ? snap.data() : {};
      return { firstName: prof.firstName || '', surname: prof.surname || '', birthday: prof.birthday || '', email: u.email, whatsapp: prof.whatsapp || '' };
    } catch(_) { return { email: u.email }; }
  }

  async function logoutUser() {
    if (!auth) return;
    await auth.signOut();
  }

  async function getCurrentUser() {
    if (!auth) return null;
    const u = auth.currentUser;
    if (!u) return null;
    if (!db) return { email: u.email };
    try {
      const snap = await db.collection('users').doc(u.uid).get();
      const prof = snap.exists ? snap.data() : {};
      return { firstName: prof.firstName || '', surname: prof.surname || '', birthday: prof.birthday || '', email: u.email, whatsapp: prof.whatsapp || '' };
    } catch(_) { return { email: u.email }; }
  }

  // Expose minimal API
  window.ACAuth = { registerUser, loginUser, logoutUser, getCurrentUser, getSession };

  // Header helper: update portal action and add logout if on account/admin pages
  document.addEventListener('DOMContentLoaded', () => {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    let portalLink = headerActions.querySelector('[data-portal-link]');
    if (!portalLink) {
      portalLink = document.createElement('button');
      portalLink.type = 'button';
      portalLink.className = 'icon-btn cart-icon';
      portalLink.setAttribute('data-portal-link', '');
      portalLink.setAttribute('aria-label', 'Customer Portal');
      portalLink.title = 'Customer Portal';
      portalLink.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
      portalLink.addEventListener('click', () => {
        const ses = getSession();
        window.location.href = ses ? 'account.html' : 'login.html';
      });
      headerActions.appendChild(portalLink);
    }

    function updateTitle() {
      const ses = getSession();
      portalLink.title = ses ? 'My Account' : 'Customer Portal';
    }

    if (auth) auth.onAuthStateChanged(updateTitle); else updateTitle();

    const onAccount = document.body && (document.body.getAttribute('data-page') === 'account' || document.body.getAttribute('data-page') === 'admin');
    if (onAccount) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'btn btn-small';
      logoutBtn.textContent = 'Log Out';
      logoutBtn.addEventListener('click', async () => {
        await logoutUser();
        window.location.href = 'login.html';
      });
      headerActions.appendChild(logoutBtn);
    }
  });
})();
