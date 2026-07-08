/**
 * PADYAKWATTS — data layer
 * ------------------------------------------------------------------
 * Stores users, sessions, stations, and reports in localStorage so the
 * whole app runs on static hosting with no server or database.
 *
 * Note: passwords are kept in plain text here purely so the signup/login
 * flow has something to check against. Don't reuse this for a real app.
 * ------------------------------------------------------------------
 */

(function (global) {
  const NS = 'padyakwatts_v1_';
  const KEYS = {
    USERS: NS + 'users',
    SESSIONS: NS + 'sessions',
    STATIONS: NS + 'stations',
    REPORTS: NS + 'reports',
    CURRENT: NS + 'current_user_id',
    SEEDED: NS + 'seeded',
  };

  const DEMO_EMAIL = 'demo@padyakwatts.ph';
  const DEMO_PASSWORD = 'Demo@123';

  // ---------------------------------------------------------------
  // low level storage helpers
  // ---------------------------------------------------------------
  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('padyakwatts: could not read', key, e);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('padyakwatts: could not write', key, e);
    }
  }

  function uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  // ---------------------------------------------------------------
  // seeding — runs once so the demo always looks "lived in"
  // ---------------------------------------------------------------
  const STATIONS_SEED = [
    { id: 'st_1', name: 'PADYAKWATTS Hub — QC Circle', location: 'Quezon City Circle, Quezon City', status: 'active' },
    { id: 'st_2', name: 'UP Diliman Academic Oval Station', location: 'Academic Oval, UP Diliman', status: 'active' },
    { id: 'st_3', name: 'Eastwood Mall Charging Point', location: 'Eastwood City, Libis, QC', status: 'active' },
    { id: 'st_4', name: 'SM North EDSA Station', location: 'SM North EDSA, Quezon City', status: 'maintenance' },
    { id: 'st_5', name: 'Ateneo de Manila Station', location: 'Katipunan Ave, Loyola Heights, QC', status: 'active' },
    { id: 'st_6', name: 'Cubao Terminal Station', location: 'Araneta City, Cubao, QC', status: 'offline' },
  ];

  function daysAgo(n, hour, minute) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  function buildDemoSessions(userId) {
    // A realistic-looking spread of sessions over the last 30 days,
    // including a couple "today" so the dashboard never looks empty.
    const plan = [
      [0, 8, 10, 22, 'st_1'], [0, 17, 30, 18, 'st_2'],
      [1, 7, 45, 25, 'st_1'], [2, 18, 5, 15, 'st_3'],
      [3, 8, 0, 20, 'st_2'],  [4, 17, 50, 30, 'st_1'],
      [5, 9, 15, 18, 'st_5'], [6, 16, 40, 24, 'st_1'],
      [8, 7, 55, 21, 'st_2'], [9, 18, 20, 27, 'st_3'],
      [11, 8, 5, 19, 'st_1'], [12, 17, 10, 23, 'st_5'],
      [14, 9, 0, 16, 'st_2'], [15, 18, 45, 29, 'st_1'],
      [17, 7, 30, 20, 'st_3'], [18, 16, 55, 22, 'st_1'],
      [20, 8, 40, 25, 'st_2'], [21, 17, 25, 18, 'st_5'],
      [23, 9, 10, 21, 'st_1'], [25, 18, 0, 26, 'st_3'],
      [27, 7, 40, 17, 'st_2'], [29, 16, 30, 24, 'st_1'],
    ];

    const stationsById = Object.fromEntries(STATIONS_SEED.map((s) => [s.id, s]));

    return plan.map(([day, hour, minute, durationMinutes, stationId]) => {
      const station = stationsById[stationId];
      // Roughly 0.15 - 0.19 Wh generated per pedaling minute.
      const rate = 0.15 + Math.random() * 0.04;
      const energy = Math.round(durationMinutes * rate * 10) / 10;
      const points = Math.round(energy * 8);
      return {
        id: uid('sess'),
        user_id: userId,
        station_id: stationId,
        station_name: station.name,
        station_location: station.location,
        start_time: daysAgo(day, hour, minute),
        duration_minutes: durationMinutes,
        energy_generated: energy,
        points_earned: points,
      };
    });
  }

  function seedIfNeeded() {
    if (read(KEYS.SEEDED, false)) return;

    write(KEYS.STATIONS, STATIONS_SEED);

    const demoUserId = uid('user');
    const demoUser = {
      id: demoUserId,
      first_name: 'Jamie',
      last_name: 'Dela Cruz',
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      phone: '+63 912 345 6789',
      address: 'Barangay Commonwealth, Quezon City',
      user_type: 'user',
      created_at: (() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 6);
        return d.toISOString();
      })(),
      is_demo: true,
      prefs: {
        email_notifications: true,
        weekly_reports: true,
        marketing_emails: false,
        share_data: true,
      },
    };

    const demoSessions = buildDemoSessions(demoUserId);

    write(KEYS.USERS, [demoUser]);
    write(KEYS.SESSIONS, demoSessions);
    write(KEYS.REPORTS, [
      {
        id: uid('rep'),
        user_id: demoUserId,
        issue: 'points',
        description: 'Points from my last two sessions took a while to show up on my profile.',
        status: 'Resolved',
        created_at: daysAgo(18, 10, 0),
      },
      {
        id: uid('rep'),
        user_id: demoUserId,
        issue: 'energy',
        description: 'Energy total for the Eastwood station session looked lower than expected.',
        status: 'Under Review',
        created_at: daysAgo(5, 14, 0),
      },
    ]);
    write(KEYS.SEEDED, true);
  }

  seedIfNeeded();

  // ---------------------------------------------------------------
  // public API
  // ---------------------------------------------------------------
  function getUsers() {
    return read(KEYS.USERS, []);
  }

  function saveUsers(users) {
    write(KEYS.USERS, users);
  }

  function findUserByEmail(email) {
    return getUsers().find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  }

  function getCurrentUser() {
    const id = read(KEYS.CURRENT, null);
    if (!id) return null;
    return getUsers().find((u) => u.id === id) || null;
  }

  function setCurrentUserId(id) {
    write(KEYS.CURRENT, id);
  }

  function logout() {
    write(KEYS.CURRENT, null);
  }

  /** Returns {ok, error} */
  function login(email, password) {
    const user = findUserByEmail(email);
    if (!user || user.password !== password) {
      return { ok: false, error: 'Invalid email or password.' };
    }
    setCurrentUserId(user.id);
    return { ok: true, user };
  }

  function loginAsDemo() {
    const user = findUserByEmail(DEMO_EMAIL);
    if (user) setCurrentUserId(user.id);
    return user;
  }

  /** Returns {ok, errors[]} */
  function signup(data) {
    const errors = [];
    const firstName = (data.firstName || '').trim();
    const lastName = (data.lastName || '').trim();
    const email = (data.email || '').trim();
    const password = data.password || '';
    const confirmPassword = data.confirmPassword || '';
    const phone = (data.phone || '').trim();
    const address = (data.address || '').trim();

    if (!firstName) errors.push('First name is required.');
    if (!lastName) errors.push('Last name is required.');
    if (!email) errors.push('Email is required.');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format.');
    if (!password) errors.push('Password is required.');
    else if (password.length < 6) errors.push('Password must be at least 6 characters.');
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must include at least one special character.');
    if (password !== confirmPassword) errors.push('Passwords do not match.');
    if (!phone) errors.push('Phone number is required.');
    if (!address) errors.push('Address is required.');
    if (!data.terms) errors.push('You must agree to the terms and conditions.');

    if (errors.length) return { ok: false, errors };

    if (findUserByEmail(email)) {
      return { ok: false, errors: ['Email already registered. Please use a different email or log in.'] };
    }

    const user = {
      id: uid('user'),
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      phone,
      address,
      user_type: 'user',
      created_at: new Date().toISOString(),
      is_demo: false,
      prefs: {
        email_notifications: true,
        weekly_reports: true,
        marketing_emails: false,
        share_data: true,
      },
    };

    const users = getUsers();
    users.push(user);
    saveUsers(users);
    write(KEYS.SESSIONS, read(KEYS.SESSIONS, []).concat([])); // no-op, keeps shape
    setCurrentUserId(user.id);
    return { ok: true, user };
  }

  function updateProfile(userId, updates) {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { ok: false, error: 'User not found.' };
    users[idx] = Object.assign({}, users[idx], updates);
    saveUsers(users);
    return { ok: true, user: users[idx] };
  }

  function deleteAccount(userId) {
    const users = getUsers().filter((u) => u.id !== userId);
    saveUsers(users);
    const sessions = read(KEYS.SESSIONS, []).filter((s) => s.user_id !== userId);
    write(KEYS.SESSIONS, sessions);
    const reports = read(KEYS.REPORTS, []).filter((r) => r.user_id !== userId);
    write(KEYS.REPORTS, reports);
    logout();
  }

  function getStations() {
    return read(KEYS.STATIONS, STATIONS_SEED);
  }

  function getSessionsForUser(userId) {
    return read(KEYS.SESSIONS, [])
      .filter((s) => s.user_id === userId)
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }

  function addSession(userId, session) {
    const sessions = read(KEYS.SESSIONS, []);
    const full = Object.assign(
      {
        id: uid('sess'),
        user_id: userId,
        start_time: new Date().toISOString(),
      },
      session
    );
    sessions.unshift(full);
    write(KEYS.SESSIONS, sessions);
    return full;
  }

  function getReportsForUser(userId) {
    return read(KEYS.REPORTS, [])
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  function addReport(userId, report) {
    const reports = read(KEYS.REPORTS, []);
    const full = Object.assign(
      { id: uid('rep'), user_id: userId, status: 'Under Review', created_at: new Date().toISOString() },
      report
    );
    reports.unshift(full);
    write(KEYS.REPORTS, reports);
    return full;
  }

  // ---------------------------------------------------------------
  // derived stats
  // ---------------------------------------------------------------
  function userStats(userId) {
    const sessions = getSessionsForUser(userId);
    const totalEnergy = sessions.reduce((sum, s) => sum + s.energy_generated, 0);
    const totalPoints = sessions.reduce((sum, s) => sum + s.points_earned, 0);

    const todayKey = new Date().toDateString();
    const todayEnergy = sessions
      .filter((s) => new Date(s.start_time).toDateString() === todayKey)
      .reduce((sum, s) => sum + s.energy_generated, 0);

    // last 7 days, Sun..Sat aligned to the calendar week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekly = Object.fromEntries(days.map((d) => [d, 0]));
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    sessions.forEach((s) => {
      const d = new Date(s.start_time);
      if (d >= sevenDaysAgo) {
        const label = days[d.getDay()];
        weekly[label] += s.energy_generated;
      }
    });

    return {
      totalEnergy: Math.round(totalEnergy * 10) / 10,
      totalPoints: Math.round(totalPoints),
      todayEnergy: Math.round(todayEnergy * 10) / 10,
      totalSessions: sessions.length,
      weekly,
      recentSessions: sessions.slice(0, 10),
    };
  }

  global.PWData = {
    DEMO_EMAIL,
    DEMO_PASSWORD,
    login,
    loginAsDemo,
    logout,
    signup,
    getCurrentUser,
    updateProfile,
    deleteAccount,
    getStations,
    getSessionsForUser,
    addSession,
    getReportsForUser,
    addReport,
    userStats,
  };
})(window);
