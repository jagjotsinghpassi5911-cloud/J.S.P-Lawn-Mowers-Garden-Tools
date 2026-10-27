/* Educational local login only. A server is required for real authentication. */
(() => {
  'use strict';
  const A = window.JSP;
  if (!A) return;
  const $ = selector => document.querySelector(selector);
  const ITERATIONS = 120000;
  const normalize = email => email.trim().toLowerCase();
  const bytesToHex = bytes => [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
  const hexToBytes = hex => new Uint8Array(hex.match(/.{1,2}/g).map(pair => parseInt(pair, 16)));
  function message(text, success = false) {
    const box = $('#auth-message'); box.textContent = text; box.hidden = !text; box.classList.toggle('success', success);
  }
  function switchTab(tab) {
    const login = tab === 'login';
    $('#login-form').hidden = !login; $('#signup-form').hidden = login;
    $('#auth-title').textContent = login ? 'Good to see you.' : 'Make room to grow.';
    $('#auth-subtitle').textContent = login ? 'Sign in to your garden profile.' : 'Create your local garden profile.';
    document.querySelectorAll('[data-auth-tab]').forEach(button => {
      const active = button.dataset.authTab === tab;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    message('');
  }
  function updateAccount() {
    const profile = A.getSession();
    $('#auth-forms').hidden = Boolean(profile); $('#account-dashboard').hidden = !profile;
    if (profile) {
      $('#welcome-name').textContent = `Hello, ${profile.name.split(/\s+/)[0]}.`;
      $('#profile-email').textContent = profile.email;
    }
    A.updateState();
  }
  async function hashPassword(password, salt, iterations = ITERATIONS) {
    if (!window.crypto?.subtle) throw new Error('Open this website on HTTPS or localhost to use the local login.');
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), {name:'PBKDF2'}, false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', salt, iterations, hash:'SHA-256'}, material, 256);
    return bytesToHex(new Uint8Array(bits));
  }
  function startSession(email, remember) {
    const kind = remember ? 'localStorage' : 'sessionStorage';
    const other = remember ? 'sessionStorage' : 'localStorage';
    if (!A.remove('jsp.session.v1', other)) return false;
    return A.write('jsp.session.v1', {email, expires:Date.now() + (remember ? 30 : 1) * 86400000}, kind);
  }
  function logout() { A.remove('jsp.session.v1'); A.remove('jsp.session.v1', 'sessionStorage'); updateAccount(); }
  function busy(form, value) { form.querySelector('button[type="submit"]').disabled = value; }
  document.querySelectorAll('[data-auth-tab]').forEach(button => button.addEventListener('click', () => switchTab(button.dataset.authTab)));
  document.querySelectorAll('.password-toggle').forEach(button => button.addEventListener('click', () => {
    const input = document.getElementById(button.getAttribute('aria-controls'));
    const visible = input.type === 'password'; input.type = visible ? 'text' : 'password';
    button.textContent = visible ? 'Hide' : 'Show'; button.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
  }));
  $('#signup-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const name = $('#signup-name').value.trim().replace(/\s+/g, ' ');
    const email = normalize($('#signup-email').value);
    const password = $('#signup-password').value;
    if (name.length < 2) { message('Please enter at least two characters for your name.'); return; }
    if (password !== $('#signup-confirm').value) { message('The passwords do not match. Please check them.'); return; }
    if (password.trim().length < 8) { message('Use at least eight non-space characters for your practice password.'); return; }
    const profiles = A.getProfiles();
    if (profiles.some(profile => profile.email === email)) { message('A local profile already uses this email. Sign in, or use profile help to start again.'); return; }
    if (profiles.length >= 20) { message('This browser has reached 20 local profiles. Remove an unused profile first.'); return; }
    busy(form, true); message('Creating your local profile…', true);
    try {
      if (!window.crypto?.getRandomValues) throw new Error('This browser does not support the local login. Use a current browser on HTTPS or localhost.');
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const hash = await hashPassword(password, salt);
      // Re-read after the asynchronous calculation to avoid overwriting another tab’s new profile.
      const current = A.getProfiles();
      if (current.some(profile => profile.email === email)) throw new Error('A profile with this email was just created. Please sign in.');
      if (!A.write('jsp.profiles.v1', [...current, {name,email,salt:bytesToHex(salt),hash,iterations:ITERATIONS}])) throw new Error('Your profile could not be saved. Enable browser storage and try again.');
      form.reset();
      if (!startSession(email, false)) { switchTab('login'); message('Profile created. Enable browser storage, then sign in.'); return; }
      message(''); updateAccount(); A.toast('Your local profile is ready.');
    } catch (error) { message(error.message || 'Your profile could not be created.'); }
    finally { busy(form, false); }
  });
  $('#login-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const email = normalize($('#login-email').value);
    const profile = A.getProfiles().find(item => item.email === email);
    if (!profile) { message('No matching local profile. Create an account in this browser first.'); return; }
    busy(form, true); message('Checking your local profile…', true);
    try {
      if (!/^[0-9a-f]{32}$/.test(profile.salt) || !/^[0-9a-f]{64}$/.test(profile.hash) || profile.iterations !== ITERATIONS) throw new Error('This local profile is damaged. Use profile help to remove it and create it again.');
      const hash = await hashPassword($('#login-password').value, hexToBytes(profile.salt), profile.iterations);
      if (hash !== profile.hash) { message('The password is incorrect. Please try again.'); return; }
      if (!startSession(email, $('#remember-me').checked)) throw new Error('Your session could not be saved. Enable browser storage.');
      $('#login-password').value = ''; message(''); updateAccount(); A.toast('You’re signed in on this browser.');
    } catch (error) { message(error.message || 'Unable to sign in. Please try again.'); }
    finally { busy(form, false); }
  });
  $('#logout').addEventListener('click', () => { logout(); switchTab('login'); A.toast('Signed out.'); });
  $('#forgot-password').addEventListener('click', () => { $('#reset-email').value = $('#login-email').value; A.showDialog($('#reset-dialog')); });
  $('#delete-profile').addEventListener('click', () => { $('#reset-email').value = A.getSession()?.email || ''; A.showDialog($('#reset-dialog')); });
  $('#reset-form').addEventListener('submit', event => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    const email = normalize($('#reset-email').value);
    const profiles = A.getProfiles();
    if (!profiles.some(profile => profile.email === email)) { A.toast('No local profile was found for that email.'); return; }
    const active = A.getSession()?.email === email;
    if (!A.write('jsp.profiles.v1', profiles.filter(profile => profile.email !== email))) return;
    if (active) logout();
    $('#reset-dialog').close(); event.currentTarget.reset(); switchTab('signup'); updateAccount();
    message('Local profile removed. You can create it again with a new password.', true);
    A.toast('Local profile removed. Your enquiry list is unchanged.');
  });
  window.addEventListener('storage', updateAccount);
  updateAccount();
})();
