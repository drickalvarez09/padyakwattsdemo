/**
 * PADYAKWATTS dashboard controller.
 * Small client-side router so tab switches don't cause a full page
 * reload — everything here reads from js/data.js.
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  let user = window.PWData.getCurrentUser();

  // Support a shareable "?demo=1" link (used by the landing page's
  // "View Live Demo" buttons) that drops the visitor straight into a
  // populated dashboard without a signup/login step.
  if (!user && params.get('demo') === '1') {
    user = window.PWData.loginAsDemo();
  }

  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const VALID_TABS = ['energy', 'report', 'profile'];

  function currentTab() {
    const hash = (window.location.hash || '').replace('#', '');
    return VALID_TABS.includes(hash) ? hash : 'energy';
  }

  // ------------------------------------------------------------------
  // toasts
  // ------------------------------------------------------------------
  function toast(message, { type = 'success', icon = 'fa-check-circle' } = {}) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'pw-toast' + (type === 'error' ? ' error' : '');
    el.innerHTML = `
      <i class="fas ${icon} ${type === 'error' ? 'text-red-500' : 'text-green-500'} mt-0.5"></i>
      <span class="text-sm text-gray-700">${message}</span>
    `;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      setTimeout(() => el.remove(), 250);
    }, 3200);
  }

  // ------------------------------------------------------------------
  // sidebar
  // ------------------------------------------------------------------
  function renderSidebar() {
    const stats = window.PWData.userStats(user.id);

    document.getElementById('sidebar-user-name').textContent = `${user.first_name} ${user.last_name}`;
    document.getElementById('sidebar-user-points').textContent = `${stats.totalPoints.toLocaleString()} Points`;
    document.getElementById('sidebar-today-energy').textContent = stats.todayEnergy.toFixed(1);
    document.getElementById('sidebar-today-bar').style.width = Math.min(100, (stats.todayEnergy / 5) * 100) + '%';
    document.getElementById('sidebar-co2').textContent = Math.round(stats.todayEnergy * 37.5).toLocaleString();
    document.getElementById('demo-banner').classList.toggle('hidden', !user.is_demo);

    document.querySelectorAll('.tab-btn[data-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.tab === currentTab());
    });
  }

  // ------------------------------------------------------------------
  // ENERGY tab
  // ------------------------------------------------------------------
  function renderEnergyTab() {
    const stats = window.PWData.userStats(user.id);
    const co2Saved = stats.todayEnergy * 37.5;
    const totalCo2Saved = stats.totalEnergy * 37.5;
    const phoneCharges = stats.todayEnergy / 10;

    const sessionsRows = stats.recentSessions.length
      ? stats.recentSessions.map((s) => {
          const d = new Date(s.start_time);
          const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          return `
            <tr class="hover:bg-green-50 transition-colors">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${dateStr}</div>
                    <div class="text-sm text-gray-500">${timeStr}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="status-indicator status-active"></div>
                        <span class="text-sm text-gray-900">${escapeHtml(s.station_name || 'Unknown Station')}</span>
                    </div>
                    <div class="text-xs text-gray-500">${escapeHtml(s.station_location || 'Location not specified')}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">${s.duration_minutes || 0} minutes</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">${s.energy_generated.toFixed(1)} Wh</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">${s.points_earned} points</span>
                </td>
            </tr>`;
        }).join('')
      : '';

    const sessionsBlock = stats.recentSessions.length
      ? `
        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gradient-to-r from-green-500 to-teal-500">
                    <tr>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Date &amp; Time</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Station</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Duration</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Energy Generated</th>
                        <th class="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Points</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200" id="sessions-tbody">${sessionsRows}</tbody>
            </table>
        </div>`
      : `
        <div class="text-center py-12 bg-gray-50 rounded-lg" id="sessions-empty">
            <i class="fas fa-bicycle text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">No sessions recorded yet</p>
            <p class="text-sm text-gray-500 mt-2">Start pedaling at a station to see your sessions here!</p>
        </div>`;

    return `
    <div class="space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-bold gradient-text">My Energy Stats</h2>
                <p class="text-gray-600">Track your energy generation and environmental impact</p>
            </div>
            <div class="flex items-center space-x-4">
                <span class="energy-badge">
                    <i class="fas fa-bolt"></i>
                    <span class="energy-value count-up" id="today-energy-badge">${stats.todayEnergy.toFixed(1)}</span> Wh Today
                </span>
                <button class="pedal-btn px-4 py-2 rounded-lg font-semibold" id="simulate-session-btn">
                    <i class="fas fa-person-biking mr-2"></i>Simulate a Session
                </button>
            </div>
        </div>

        <!-- Total Energy Generated -->
        <div class="stats-card p-6">
            <h3 class="text-xl font-semibold text-green-800 mb-4">Total Energy Generated</h3>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="flex items-center space-x-6">
                    <div class="relative">
                        <div class="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                            <i class="fas fa-bolt text-white text-3xl"></i>
                        </div>
                        <div class="absolute -top-2 -right-2 w-10 h-10 bg-white rounded-full border-4 border-green-100 flex items-center justify-center">
                            <span class="text-green-600 font-bold">↑</span>
                        </div>
                    </div>
                    <div>
                        <p class="text-3xl font-bold text-gray-800">
                            <span id="total-energy-value" class="count-up">${stats.totalEnergy.toFixed(1)}</span>
                            <span class="text-lg text-gray-600">Wh</span>
                        </p>
                        <p class="text-gray-600 mt-1">Lifetime generation</p>
                        <div class="flex items-center mt-2 text-green-600">
                            <i class="fas fa-arrow-up mr-1"></i>
                            <span class="font-semibold" id="total-points-value">${stats.totalPoints.toLocaleString()} points</span>
                            <span class="text-gray-500 ml-2">earned</span>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 rounded-xl p-4">
                    <h4 class="font-semibold text-gray-700 mb-3">Today's Impact</h4>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-mobile-alt text-green-600 mr-3"></i>
                                <span>Phone Charges</span>
                            </div>
                            <span class="font-semibold" id="phone-charges-value">${phoneCharges.toFixed(1)}x</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-leaf text-green-600 mr-3"></i>
                                <span>CO₂ Saved</span>
                            </div>
                            <span class="font-semibold" id="co2-saved-value">${Math.round(co2Saved)}g</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fas fa-clock text-blue-600 mr-3"></i>
                                <span>Grid Savings</span>
                            </div>
                            <span class="font-semibold" id="grid-savings-value">${Math.round(stats.todayEnergy * 2)} min</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Environmental Impact -->
        <div class="stats-card p-6">
            <h3 class="text-xl font-semibold text-green-800 mb-6">Environmental Impact</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="impact-card">
                    <div class="impact-icon"><i class="fas fa-seedling text-2xl text-green-600"></i></div>
                    <p class="font-semibold text-green-700 mb-2">Total CO₂ Reduced</p>
                    <p class="text-3xl font-bold text-gray-800" id="total-co2-value">${Math.round(totalCo2Saved).toLocaleString()}g</p>
                    <p class="text-gray-600 text-sm mt-2">Equivalent to ${(totalCo2Saved / 21000).toFixed(1)} trees</p>
                </div>

                <div class="impact-card">
                    <div class="impact-icon"><i class="fas fa-clock text-2xl text-blue-600"></i></div>
                    <p class="font-semibold text-blue-700 mb-2">Grid Electricity Saved</p>
                    <p class="text-3xl font-bold text-gray-800">${Math.round(stats.totalEnergy * 2).toLocaleString()} min</p>
                    <p class="text-gray-600 text-sm mt-2">Of conventional electricity use</p>
                </div>

                <div class="impact-card">
                    <div class="impact-icon"><i class="fas fa-trophy text-2xl text-yellow-600"></i></div>
                    <p class="font-semibold text-yellow-700 mb-2">Points Generated</p>
                    <p class="text-3xl font-bold text-gray-800">${stats.totalPoints.toLocaleString()}</p>
                    <p class="text-gray-600 text-sm mt-2">Redeemable for rewards</p>
                </div>
            </div>
        </div>

        <!-- Energy Chart -->
        <div class="stats-card p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-green-800">Weekly Energy Generation</h3>
                <span class="real-time-badge text-xs"><i class="fas fa-circle text-[6px]"></i> Live</span>
            </div>
            <div class="h-96">
                <canvas id="energyChart"></canvas>
            </div>
        </div>

        <!-- Session History -->
        <div class="stats-card p-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <h3 class="text-xl font-semibold text-green-800">Recent Sessions</h3>
                <div class="flex items-center space-x-4 mt-4 md:mt-0">
                    <select class="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400" id="session-filter">
                        <option value="all">All Time</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                    </select>
                </div>
            </div>
            <div id="sessions-wrapper">${sessionsBlock}</div>
        </div>
    </div>`;
  }

  let chartInstance = null;
  function initEnergyChart() {
    const canvas = document.getElementById('energyChart');
    if (!canvas || typeof Chart === 'undefined') return;
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    const stats = window.PWData.userStats(user.id);
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const data = labels.map((d) => stats.weekly[d] || 0);

    chartInstance = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Energy Generated (Wh)',
          data,
          fill: true,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 1)',
          borderWidth: 2,
          tension: 0.4,
          pointBackgroundColor: 'rgba(16, 185, 129, 1)',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#166534', font: { family: "'Poppins', sans-serif", size: 14, weight: '600' } },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(209, 250, 229, 0.3)' },
            ticks: { color: '#166534' },
          },
          x: {
            grid: { color: 'rgba(209, 250, 229, 0.3)' },
            ticks: { color: '#166534' },
          },
        },
      },
    });
  }

  function wireEnergyTab() {
    initEnergyChart();

    const simulateBtn = document.getElementById('simulate-session-btn');
    if (simulateBtn) {
      simulateBtn.addEventListener('click', () => {
        simulateBtn.disabled = true;
        simulateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Pedaling...';

        setTimeout(() => {
          const stations = window.PWData.getStations().filter((s) => s.status === 'active');
          const station = stations[Math.floor(Math.random() * stations.length)] || window.PWData.getStations()[0];
          const durationMinutes = 12 + Math.floor(Math.random() * 30);
          const rate = 0.15 + Math.random() * 0.05;
          const energy = Math.round(durationMinutes * rate * 10) / 10;
          const points = Math.round(energy * 8);

          window.PWData.addSession(user.id, {
            station_id: station.id,
            station_name: station.name,
            station_location: station.location,
            duration_minutes: durationMinutes,
            energy_generated: energy,
            points_earned: points,
          });

          toast(`New session logged: +${energy.toFixed(1)} Wh, +${points} points`, { icon: 'fa-bolt' });
          renderSidebar();
          document.getElementById('tab-content').innerHTML = renderEnergyTab();
          wireEnergyTab();
        }, 900);
      });
    }
  }

  // ------------------------------------------------------------------
  // REPORT tab
  // ------------------------------------------------------------------
  function renderReportTab() {
    const reports = window.PWData.getReportsForUser(user.id);
    const reportItems = reports.length
      ? reports.map((r) => {
          const badgeClass = r.status === 'Resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
          const d = new Date(r.created_at);
          const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
          return `
            <div class="border border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors">
                <div class="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                        <div class="flex items-center mb-2">
                            <span class="font-semibold text-gray-800">${escapeHtml(reportTitle(r.issue))}</span>
                            <span class="ml-3 px-2 py-1 ${badgeClass} rounded-full text-xs font-medium">${r.status}</span>
                        </div>
                        <p class="text-sm text-gray-600">${escapeHtml(r.description).slice(0, 90)}${r.description.length > 90 ? '…' : ''}</p>
                        <p class="text-xs text-gray-400 mt-1">Submitted on ${dateStr}</p>
                    </div>
                </div>
            </div>`;
        }).join('')
      : `<div class="text-center py-12">
            <i class="fas fa-clipboard-check text-4xl text-gray-300 mb-4"></i>
            <p class="text-gray-600">No reports submitted yet</p>
        </div>`;

    return `
    <div class="space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-bold gradient-text">Report a Problem</h2>
                <p class="text-gray-600">Help us maintain PADYAKWATTS by reporting issues</p>
            </div>
        </div>

        <!-- Report Form -->
        <div class="stats-card p-6">
            <h3 class="text-xl font-semibold text-green-800 mb-6">Submit a New Report</h3>

            <form id="report-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2" for="issue-type">
                        <i class="fas fa-exclamation-triangle mr-2 text-yellow-600"></i>Issue Type
                    </label>
                    <select class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent" id="issue-type" name="issue" required>
                        <option value="">Select issue type</option>
                        <option value="account">Account Issue</option>
                        <option value="energy">Energy Tracking Problem</option>
                        <option value="points">Points/Rewards Issue</option>
                        <option value="technical">Technical Problem</option>
                        <option value="general">General Inquiry</option>
                        <option value="other">Other Issues</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2" for="description">
                        <i class="fas fa-file-alt mr-2 text-blue-600"></i>Description
                    </label>
                    <textarea class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent resize-none"
                              id="description" name="description" rows="6" required
                              placeholder="Please describe the issue in detail. Include any relevant information such as when the issue started, what you were doing, and any error messages you saw..."></textarea>
                    <p class="text-xs text-gray-500 mt-2">Be specific about what's not working and when it started.</p>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2" for="file-upload">
                        <i class="fas fa-camera mr-2 text-purple-600"></i>Upload Screenshots (Optional)
                    </label>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
                        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600 mb-2">Drag &amp; drop screenshots here or</p>
                        <label for="file-upload" class="cursor-pointer">
                            <span class="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">Browse Files</span>
                            <input id="file-upload" name="photos[]" type="file" class="hidden" multiple accept="image/*">
                        </label>
                        <p class="text-xs text-gray-500 mt-4">Maximum 5 images, 5MB each</p>
                    </div>
                    <div id="photo-preview" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 hidden"></div>
                </div>

                <div class="bg-gray-50 rounded-xl p-5">
                    <h4 class="font-semibold text-gray-800 mb-4">Contact Information</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Your Name</label>
                            <input type="text" class="w-full px-4 py-2 border border-gray-300 rounded-lg" value="${escapeHtml(user.first_name + ' ' + user.last_name)}" disabled>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input type="email" class="w-full px-4 py-2 border border-gray-300 rounded-lg" value="${escapeHtml(user.email)}" disabled>
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-4 pt-4">
                    <button type="reset" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">Clear Form</button>
                    <button type="submit" id="report-submit-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center">
                        <i class="fas fa-paper-plane mr-2"></i>Submit Report
                    </button>
                </div>
            </form>
        </div>

        <!-- Recent Reports -->
        <div class="stats-card p-6">
            <h3 class="text-xl font-semibold text-green-800 mb-6">Your Recent Reports</h3>
            <div class="space-y-4" id="reports-list">${reportItems}</div>
        </div>
    </div>`;
  }

  function reportTitle(issue) {
    const map = {
      account: 'Account Issue',
      energy: 'Energy Tracking Problem',
      points: 'Points/Rewards Issue',
      technical: 'Technical Problem',
      general: 'General Inquiry',
      other: 'Other Issue',
    };
    return map[issue] || 'Report';
  }

  function wireReportTab() {
    const form = document.getElementById('report-form');
    if (!form) return;

    document.getElementById('file-upload').addEventListener('change', function (e) {
      const preview = document.getElementById('photo-preview');
      preview.innerHTML = '';
      preview.classList.remove('hidden');

      Array.from(e.target.files).forEach((file, index) => {
        if (index < 5) {
          const reader = new FileReader();
          reader.onload = function (ev) {
            const div = document.createElement('div');
            div.className = 'relative';
            div.innerHTML = `
              <img src="${ev.target.result}" class="w-full h-32 object-cover rounded-lg">
              <button type="button" class="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs">×</button>
            `;
            div.querySelector('button').addEventListener('click', () => div.remove());
            preview.appendChild(div);
          };
          reader.readAsDataURL(file);
        }
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const issue = document.getElementById('issue-type').value;
      const description = document.getElementById('description').value.trim();

      if (!issue || !description) {
        toast('Please select an issue type and add a description.', { type: 'error', icon: 'fa-exclamation-circle' });
        return;
      }

      const btn = document.getElementById('report-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Submitting...';

      setTimeout(() => {
        window.PWData.addReport(user.id, { issue, description });
        toast('Report submitted — our team will take a look shortly.');
        document.getElementById('tab-content').innerHTML = renderReportTab();
        wireReportTab();
      }, 500);
    });
  }

  // ------------------------------------------------------------------
  // PROFILE tab
  // ------------------------------------------------------------------
  function renderProfileTab() {
    const stats = window.PWData.userStats(user.id);
    const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const initials = ((user.first_name || 'U')[0] + (user.last_name || '')[0]).toUpperCase();
    const prefs = user.prefs || {};

    return `
    <div class="space-y-8">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h2 class="text-3xl font-bold gradient-text">Profile Settings</h2>
                <p class="text-gray-600">Manage your account and personal information</p>
            </div>
            <div class="flex items-center space-x-4">
                <button class="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors" id="export-data-btn">
                    <i class="fas fa-download mr-2"></i>Export Data
                </button>
            </div>
        </div>

        <!-- Profile Overview -->
        <div class="stats-card p-6">
            <div class="flex flex-col md:flex-row items-center gap-6">
                <div class="relative">
                    <div class="w-32 h-32 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-lg">
                        <span class="text-white text-4xl font-bold">${initials}</span>
                    </div>
                    <button id="change-avatar-btn" class="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full border-2 border-green-100 flex items-center justify-center hover:bg-green-50 transition-colors shadow-md">
                        <i class="fas fa-camera text-green-600"></i>
                    </button>
                    <input type="file" id="avatar-upload" class="hidden" accept="image/*">
                </div>

                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">${escapeHtml(user.first_name + ' ' + user.last_name)}</h3>
                    <p class="text-gray-600 mb-4">
                        <i class="fas fa-calendar-alt mr-2 text-green-600"></i>
                        Energy Contributor since ${memberSince}
                    </p>

                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div class="text-center p-3 bg-green-50 rounded-lg">
                            <div class="text-xl font-bold text-green-600">${stats.totalSessions}</div>
                            <div class="text-sm text-gray-600 mt-1">Sessions</div>
                        </div>
                        <div class="text-center p-3 bg-blue-50 rounded-lg">
                            <div class="text-xl font-bold text-blue-600">${stats.totalEnergy.toFixed(1)} Wh</div>
                            <div class="text-sm text-gray-600 mt-1">Total Energy</div>
                        </div>
                        <div class="text-center p-3 bg-yellow-50 rounded-lg">
                            <div class="text-xl font-bold text-yellow-600">${stats.totalPoints}</div>
                            <div class="text-sm text-gray-600 mt-1">Points</div>
                        </div>
                        <div class="text-center p-3 bg-purple-50 rounded-lg">
                            <div class="text-xl font-bold text-purple-600">#12</div>
                            <div class="text-sm text-gray-600 mt-1">Rank</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Edit Profile Form -->
        <div class="stats-card p-6">
            <h3 class="text-xl font-semibold text-green-800 mb-6"><i class="fas fa-user-edit mr-2"></i>Edit Profile Information</h3>

            <form id="profile-form" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2" for="first-name"><i class="fas fa-user mr-2 text-green-600"></i>First Name *</label>
                        <input type="text" id="first-name" name="first_name" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all" value="${escapeHtml(user.first_name)}" required>
                        <div class="text-xs text-red-500 mt-1 hidden" id="first-name-error"></div>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2" for="last-name"><i class="fas fa-user mr-2 text-green-600"></i>Last Name *</label>
                        <input type="text" id="last-name" name="last_name" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all" value="${escapeHtml(user.last_name)}" required>
                        <div class="text-xs text-red-500 mt-1 hidden" id="last-name-error"></div>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2" for="email"><i class="fas fa-envelope mr-2 text-green-600"></i>Email Address *</label>
                    <input type="email" id="email" name="email" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all" value="${escapeHtml(user.email)}" required>
                    <div class="text-xs text-red-500 mt-1 hidden" id="email-error"></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2" for="phone"><i class="fas fa-phone mr-2 text-green-600"></i>Phone Number</label>
                        <input type="tel" id="phone" name="phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all" value="${escapeHtml(user.phone || '')}" placeholder="+63 912 345 6789">
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2" for="address"><i class="fas fa-map-marker-alt mr-2 text-green-600"></i>Address</label>
                        <input type="text" id="address" name="address" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all" value="${escapeHtml(user.address || '')}" placeholder="Enter your full address">
                    </div>
                </div>

                <div class="pt-6 border-t border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4"><i class="fas fa-shield-alt mr-2 text-green-600"></i>Security Settings</h4>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2" for="current-password"><i class="fas fa-lock mr-2 text-green-600"></i>Current Password</label>
                            <div class="relative">
                                <input type="password" id="current-password" name="current_password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all pr-10" placeholder="Enter current password to change password">
                                <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600" data-toggle="current-password"><i class="fas fa-eye"></i></button>
                            </div>
                            <div class="text-xs text-red-500 mt-1 hidden" id="current-password-error"></div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2" for="new-password"><i class="fas fa-key mr-2 text-green-600"></i>New Password</label>
                                <div class="relative">
                                    <input type="password" id="new-password" name="new_password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all pr-10" placeholder="Enter new password (optional)">
                                    <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600" data-toggle="new-password"><i class="fas fa-eye"></i></button>
                                </div>
                                <div class="text-xs text-red-500 mt-1 hidden" id="new-password-error"></div>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold text-gray-700 mb-2" for="confirm-password"><i class="fas fa-key mr-2 text-green-600"></i>Confirm New Password</label>
                                <div class="relative">
                                    <input type="password" id="confirm-password" name="confirm_password" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all pr-10" placeholder="Confirm new password">
                                    <button type="button" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-600" data-toggle="confirm-password"><i class="fas fa-eye"></i></button>
                                </div>
                                <div class="text-xs text-red-500 mt-1 hidden" id="confirm-password-error"></div>
                            </div>
                        </div>

                        <div class="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-semibold text-gray-700">Password Strength</span>
                                <span class="text-sm font-semibold" id="password-strength-text">Not set</span>
                            </div>
                            <div class="h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                                <div class="h-full bg-gray-300 rounded-full transition-all duration-300" id="password-strength-bar" style="width: 0%"></div>
                            </div>
                            <p class="text-xs text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                Password must be at least 6 characters and include at least one special character
                            </p>
                        </div>
                    </div>
                </div>

                <div class="pt-6 border-t border-gray-200">
                    <h4 class="text-lg font-semibold text-gray-800 mb-4"><i class="fas fa-sliders-h mr-2 text-green-600"></i>Preferences</h4>
                    <div class="space-y-4">
                        <label class="flex items-center p-3 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
                            <input type="checkbox" name="email_notifications" class="rounded border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5" ${prefs.email_notifications ? 'checked' : ''}>
                            <span class="ml-3 text-gray-700">Email notifications for new stations</span>
                        </label>
                        <label class="flex items-center p-3 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
                            <input type="checkbox" name="weekly_reports" class="rounded border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5" ${prefs.weekly_reports ? 'checked' : ''}>
                            <span class="ml-3 text-gray-700">Weekly energy report emails</span>
                        </label>
                        <label class="flex items-center p-3 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
                            <input type="checkbox" name="marketing_emails" class="rounded border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5" ${prefs.marketing_emails ? 'checked' : ''}>
                            <span class="ml-3 text-gray-700">Marketing communications</span>
                        </label>
                        <label class="flex items-center p-3 hover:bg-green-50 rounded-lg transition-colors cursor-pointer">
                            <input type="checkbox" name="share_data" class="rounded border-gray-300 text-green-600 focus:ring-green-500 h-5 w-5" ${prefs.share_data ? 'checked' : ''}>
                            <span class="ml-3 text-gray-700">Share my energy data (anonymously)</span>
                        </label>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row justify-between gap-4 pt-6">
                    <div class="text-sm text-gray-600"><p><i class="fas fa-info-circle mr-1 text-green-600"></i> Fields marked with * are required</p></div>
                    <div class="flex space-x-4">
                        <button type="button" id="reset-btn" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                            <i class="fas fa-undo mr-2"></i>Reset
                        </button>
                        <button type="submit" id="profile-submit-btn" class="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center">
                            <i class="fas fa-save mr-2"></i>Save Changes
                        </button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Danger Zone -->
        <div class="stats-card p-6 border border-red-200 bg-red-50">
            <h4 class="text-lg font-semibold text-red-700 mb-4"><i class="fas fa-exclamation-triangle mr-2"></i>Danger Zone</h4>
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p class="font-semibold text-gray-800">Delete Account</p>
                        <p class="text-sm text-gray-600">Permanently delete your account and all data. This action cannot be undone.</p>
                    </div>
                    <button id="delete-account-btn" class="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors whitespace-nowrap">
                        <i class="fas fa-trash-alt mr-2"></i>Delete Account
                    </button>
                </div>
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p class="font-semibold text-gray-800">Export All Data</p>
                        <p class="text-sm text-gray-600">Download all your data in JSON format for backup</p>
                    </div>
                    <button id="export-data-btn-2" class="px-6 py-2 border border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors whitespace-nowrap">
                        <i class="fas fa-download mr-2"></i>Export Data
                    </button>
                </div>
            </div>
        </div>
    </div>`;
  }

  function exportUserData() {
    const stats = window.PWData.userStats(user.id);
    const payload = {
      profile: user,
      stats,
      sessions: window.PWData.getSessionsForUser(user.id),
      reports: window.PWData.getReportsForUser(user.id),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'padyakwatts-data-export.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Your data export has started downloading.', { icon: 'fa-download' });
  }

  function wireProfileTab() {
    const changeAvatarBtn = document.getElementById('change-avatar-btn');
    const avatarUpload = document.getElementById('avatar-upload');
    if (changeAvatarBtn && avatarUpload) {
      changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
      avatarUpload.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          if (e.target.files[0].size > 5 * 1024 * 1024) {
            toast('File size must be less than 5MB', { type: 'error', icon: 'fa-exclamation-circle' });
            return;
          }
          toast('Avatar update is a planned feature — not wired up in this demo.', { icon: 'fa-camera' });
        }
      });
    }

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
          if (value.length <= 3) value = `+${value}`;
          else if (value.length <= 6) value = `+${value.slice(0, 3)} ${value.slice(3)}`;
          else if (value.length <= 9) value = `+${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`;
          else value = `+${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 9)} ${value.slice(9, 13)}`;
        }
        e.target.value = value;
      });
    }

    const newPasswordInput = document.getElementById('new-password');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');

    function calculatePasswordStrength(password) {
      let strength = 0;
      if (password.length >= 6) strength += 25;
      if (password.length >= 8) strength += 10;
      if (/[A-Z]/.test(password)) strength += 20;
      if (/[0-9]/.test(password)) strength += 20;
      if (/[^A-Za-z0-9]/.test(password)) strength += 25;
      const percentage = Math.min(strength, 100);
      let message = 'Not set';
      let color = '#9CA3AF';
      if (percentage > 0 && percentage < 40) { message = 'Weak'; color = '#EF4444'; }
      else if (percentage < 70 && percentage > 0) { message = 'Medium'; color = '#F59E0B'; }
      else if (percentage >= 70) { message = 'Strong'; color = '#10B981'; }
      return { percentage, message, color };
    }

    if (newPasswordInput) {
      newPasswordInput.addEventListener('input', function () {
        const strength = calculatePasswordStrength(this.value);
        strengthBar.style.width = strength.percentage + '%';
        strengthBar.style.backgroundColor = strength.color;
        strengthText.textContent = strength.message;
        strengthText.className = 'text-sm font-semibold ' + (strength.percentage < 40 ? 'text-red-600' : strength.percentage < 70 ? 'text-yellow-600' : 'text-green-600');
      });
    }

    document.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', function () {
        const input = document.getElementById(this.dataset.toggle);
        const icon = this.querySelector('i');
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      });
    });

    const profileForm = document.getElementById('profile-form');
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();

      document.querySelectorAll('[id$="-error"]').forEach((el) => { el.classList.add('hidden'); el.textContent = ''; });
      document.querySelectorAll('.border-red-500').forEach((el) => el.classList.remove('border-red-500'));

      function showError(input, message) {
        input.classList.add('border-red-500');
        const errorEl = document.getElementById(input.id + '-error');
        if (errorEl) { errorEl.textContent = message; errorEl.classList.remove('hidden'); }
      }

      let isValid = true;
      const firstName = document.getElementById('first-name');
      const lastName = document.getElementById('last-name');
      const email = document.getElementById('email');

      if (!firstName.value.trim()) { showError(firstName, 'First name is required'); isValid = false; }
      if (!lastName.value.trim()) { showError(lastName, 'Last name is required'); isValid = false; }
      if (!email.value.trim()) { showError(email, 'Email is required'); isValid = false; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { showError(email, 'Please enter a valid email address'); isValid = false; }

      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword || confirmPassword) {
        if (!currentPassword) { showError(document.getElementById('current-password'), 'Current password is required to change password'); isValid = false; }
        else if (currentPassword !== user.password) { showError(document.getElementById('current-password'), 'Current password is incorrect'); isValid = false; }

        if (newPassword && (newPassword.length < 6 || !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword))) {
          showError(document.getElementById('new-password'), 'New password must be at least 6 characters with a special character');
          isValid = false;
        }
        if (newPassword !== confirmPassword) { showError(document.getElementById('confirm-password'), 'Passwords do not match'); isValid = false; }
      }

      if (!isValid) return;

      const btn = document.getElementById('profile-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';

      const updates = {
        first_name: firstName.value.trim(),
        last_name: lastName.value.trim(),
        email: email.value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        prefs: {
          email_notifications: profileForm.email_notifications.checked,
          weekly_reports: profileForm.weekly_reports.checked,
          marketing_emails: profileForm.marketing_emails.checked,
          share_data: profileForm.share_data.checked,
        },
      };
      if (newPassword) updates.password = newPassword;

      setTimeout(() => {
        const result = window.PWData.updateProfile(user.id, updates);
        if (result.ok) {
          user = result.user;
          toast('Profile updated successfully.');
          renderSidebar();
          document.getElementById('tab-content').innerHTML = renderProfileTab();
          wireProfileTab();
        } else {
          toast(result.error || 'Something went wrong.', { type: 'error', icon: 'fa-exclamation-circle' });
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-save mr-2"></i>Save Changes';
        }
      }, 400);
    });

    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all changes?')) {
          document.getElementById('tab-content').innerHTML = renderProfileTab();
          wireProfileTab();
        }
      });
    }

    const deleteBtn = document.getElementById('delete-account-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (user.is_demo) {
          toast('The demo account can\'t be deleted — create your own free account to try this.', { type: 'error', icon: 'fa-lock' });
          return;
        }
        if (!confirm('Are you absolutely sure? This will permanently delete your account and all data. This action cannot be undone.')) return;
        const userInput = prompt('Type DELETE to confirm account deletion:');
        if (userInput === 'DELETE') {
          window.PWData.deleteAccount(user.id);
          window.location.href = 'goodbye.html';
        } else {
          toast('Account deletion cancelled.');
        }
      });
    }

    ['export-data-btn', 'export-data-btn-2'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', exportUserData);
    });
  }

  // ------------------------------------------------------------------
  // router
  // ------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTab() {
    const tab = currentTab();
    const container = document.getElementById('tab-content');
    const loading = document.getElementById('loading');

    if (loading) loading.classList.add('active');
    container.style.opacity = '0';
    container.style.transform = 'translateY(10px)';

    setTimeout(() => {
      if (tab === 'energy') {
        container.innerHTML = renderEnergyTab();
        wireEnergyTab();
      } else if (tab === 'report') {
        container.innerHTML = renderReportTab();
        wireReportTab();
      } else {
        container.innerHTML = renderProfileTab();
        wireProfileTab();
      }

      renderSidebar();

      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
      if (loading) loading.classList.remove('active');
    }, 180);
  }

  window.addEventListener('hashchange', renderTab);

  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    window.PWData.logout();
    window.location.href = 'index.html';
  });

  // Sidebar toggle (mobile)
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('-translate-x-full');
      const icon = menuToggle.querySelector('i');
      icon.classList.toggle('fa-bars');
      icon.classList.toggle('fa-times');
    });
  }
  document.addEventListener('click', (event) => {
    if (window.innerWidth < 768 && sidebar && menuToggle) {
      if (!sidebar.contains(event.target) && !menuToggle.contains(event.target) && !sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.add('-translate-x-full');
        const icon = menuToggle.querySelector('i');
        icon.classList.add('fa-bars');
        icon.classList.remove('fa-times');
      }
    }
  });

  if (!window.location.hash) window.location.hash = '#energy';
  renderTab();

  if (user.is_demo && params.get('demo') === '1') {
    setTimeout(() => toast('Welcome to the live demo! Explore the tabs on the left.', { icon: 'fa-hand-sparkles' }), 500);
  }
})();
