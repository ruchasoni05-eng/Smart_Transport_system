import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('src/stitch_ui');
const destDir = path.resolve('public');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Global script to inject for navigation & profile header
const authCheckScript = `
<script>
  (function() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user && window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.href = '/login';
    }
  })();
</script>
`;

const commonScript = `
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const currentPath = window.location.pathname;

    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      // Update profile name
      const nameEl = document.querySelector('aside span.font-label-md');
      if (nameEl) nameEl.textContent = user.name;
      
      // Update employee ID / role
      const roleEl = document.querySelector('aside span.text-[10px], aside span.text-on-primary-container\\\\/60');
      if (roleEl) roleEl.textContent = user.role + ' (ID: ' + user.employee_id + ')';
    }

    // Unified Desktop Sidebar Rebuilder
    let navItems = [
      { text: 'Dashboard', icon: 'dashboard', href: '/dashboard' },
      { text: 'Fleet', icon: 'local_shipping', href: '/fleet' },
      { text: 'Drivers', icon: 'person', href: '/drivers' },
      { text: 'Trips', icon: 'route', href: '/trips' },
      { text: 'Maintenance', icon: 'build', href: '/maintenance' },
      { text: 'Fuel & Expenses', icon: 'local_gas_station', href: '/expenses' },
      { text: 'Analytics', icon: 'analytics', href: '/analytics' },
      { text: 'Settings', icon: 'settings', href: '/settings' }
    ];

    if (user && user.role === 'Driver') {
      navItems = [
        { text: 'Driver Portal', icon: 'dashboard', href: '/driver' },
        { text: 'Settings', icon: 'settings', href: '/settings' }
      ];
    }

    const nav = document.querySelector('aside nav, nav[class*="w-sidebar-width"], nav[class*="sidebar"], aside[class*="sidebar"] nav');
    if (nav) {
      // Remove any existing nav link elements
      nav.querySelectorAll('a').forEach(a => a.remove());

      // Append new unified links
      navItems.forEach(item => {
        const isActive = item.href === currentPath;
        const activeClass = "bg-secondary-container text-on-secondary-container rounded-lg mx-2 flex items-center px-4 py-3 gap-3 transition-all duration-200 ease-in-out shadow-sm";
        const inactiveClass = "text-on-primary-container/70 flex items-center px-4 py-3 mx-2 gap-3 hover:bg-secondary/10 transition-all rounded-lg duration-200 ease-in-out";
        
        const link = document.createElement('a');
        link.className = isActive ? activeClass : inactiveClass;
        link.setAttribute('href', item.href);
        link.innerHTML = \`
          <span class="material-symbols-outlined">\${item.icon}</span>
          <span class="font-label-md text-label-md">\${item.text}</span>
        \`;
        nav.appendChild(link);
      });
      
      // Wire up sign out link at the bottom of navigation
      const logoutBtn = document.createElement('a');
      logoutBtn.className = "text-on-primary-container/70 flex items-center px-4 py-3 mx-2 gap-3 hover:bg-red-500/20 hover:text-red-300 transition-all rounded-lg mt-8 cursor-pointer duration-200 ease-in-out";
      logoutBtn.innerHTML = '<span class="material-symbols-outlined">logout</span><span class="font-label-md text-label-md">Sign Out</span>';
      logoutBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = '/login';
      });
      nav.appendChild(logoutBtn);
    }

    // Unified Mobile Bottom Navbar Rebuilder
    const mobileNav = document.querySelector('main nav[class*="bottom"], body > nav[class*="bottom"], nav[class*="bottom-0"], nav[class*="fixed"][class*="bottom"]');
    if (mobileNav) {
      let mobileItems = [
        { text: 'Home', icon: 'home', href: '/dashboard' },
        { text: 'Trips', icon: 'map', href: '/trips' },
        { text: 'Fleet', icon: 'minor_crash', href: '/fleet' },
        { text: 'Expenses', icon: 'local_gas_station', href: '/expenses' },
        { text: 'Alerts', icon: 'notifications', href: '#' }
      ];

      if (user && user.role === 'Driver') {
        mobileItems = [
          { text: 'Portal', icon: 'home', href: '/driver' },
          { text: 'Alerts', icon: 'notifications', href: '#' }
        ];
      }

      mobileNav.querySelectorAll('a').forEach(a => a.remove());
      mobileItems.forEach(item => {
        const isActive = item.href === currentPath;
        const activeClass = "flex flex-col items-center justify-center text-secondary font-bold scale-95 active:scale-90 transition-transform";
        const inactiveClass = "flex flex-col items-center justify-center text-on-surface-variant scale-95 active:scale-90 transition-transform";
        
        const link = document.createElement('a');
        link.className = isActive ? activeClass : inactiveClass;
        link.setAttribute('href', item.href);
        link.innerHTML = \`
          <span class="material-symbols-outlined">\${item.icon}</span>
          <span class="text-[10px] font-label-md">\${item.text}</span>
        \`;
        mobileNav.appendChild(link);
      });
    }
  });
</script>
`;

function processFile(filename) {
  let content = fs.readFileSync(path.join(srcDir, filename), 'utf8');

  // Insert authentication check at top of head
  if (filename !== 'login.html' && filename !== 'login_alt.html') {
    content = content.replace('<head>', '<head>' + authCheckScript);
  }

  // Inject common script at the bottom
  if (filename !== 'login.html' && filename !== 'login_alt.html') {
    content = content.replace('</body>', commonScript + '</body>');
  }

  // File specific dynamic page scripts
  if (filename === 'login.html' || filename === 'login_alt.html') {
    content = content.replace('</body>', `
<script>
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value || 'password';
        
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if (data.user.role === 'Driver') {
              window.location.href = '/driver';
            } else {
              window.location.href = '/dashboard';
            }
          } else {
            alert(data.error || 'Login failed');
          }
        } catch (err) {
          console.error(err);
          alert('Server connection error.');
        }
      });
    }
  });
</script>
</body>`);
  } else if (filename === 'dashboard.html') {
    content = content.replace('</body>', `
<script>
  async function loadDashboard() {
    try {
      // Load Stats
      const statsRes = await fetch('/api/dashboard/stats');
      const stats = await statsRes.ok ? await statsRes.json() : null;
      if (stats) {
        const tiles = document.querySelectorAll('section.grid > div');
        tiles.forEach(tile => {
          const span = tile.querySelector('span');
          if (!span) return;
          const label = span.textContent.trim().toLowerCase();
          const valEl = tile.querySelector('.font-display-lg');
          if (!valEl) return;
          
          if (label.includes('active vehicles')) valEl.textContent = stats.activeVehicles;
          else if (label.includes('available')) valEl.textContent = stats.availableVehicles;
          else if (label.includes('maintenance')) valEl.textContent = stats.maintenanceVehicles;
          else if (label.includes('active trips')) valEl.textContent = stats.activeTrips;
          else if (label.includes('pending')) valEl.textContent = stats.pendingTrips;
          else if (label.includes('utilization')) valEl.textContent = stats.utilization;
        });
      }

      // Load active trips list
      const tripsRes = await fetch('/api/trips');
      const trips = await tripsRes.json();
      const activeTripsList = trips.filter(t => t.status !== 'Completed');
      
      const tripContainer = document.querySelector('main .lg\\\\:col-span-2 > div.space-y-2');
      if (tripContainer) {
        tripContainer.innerHTML = '';
        if (activeTripsList.length === 0) {
          tripContainer.innerHTML = '<div class="p-8 text-center text-outline text-body-md bg-white border border-outline-variant rounded-lg">No active trips at the moment.</div>';
        }
        activeTripsList.forEach(t => {
          let badgeColor = 'bg-green-100 text-green-800';
          if (t.status === 'Delayed') badgeColor = 'bg-red-100 text-red-800';
          if (t.status === 'Loading') badgeColor = 'bg-blue-100 text-blue-800';

          tripContainer.innerHTML += \`
            <div class="bg-white border border-outline-variant p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center text-secondary">
                  <span class="material-symbols-outlined">local_shipping</span>
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-data-mono text-data-mono text-primary">#\${t.trip_number}</span>
                    <span class="text-[10px] text-outline">•</span>
                    <span class="font-body-sm text-body-sm text-on-surface-variant font-semibold">\${t.vehicle_name}</span>
                  </div>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="material-symbols-outlined text-[14px] text-outline">person</span>
                    <span class="text-body-sm text-outline">\${t.driver_name}</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-none pt-3 sm:pt-0">
                <div class="flex flex-col items-end">
                  <span class="\${badgeColor} px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider">\${t.status}</span>
                  <span class="text-[10px] text-outline mt-1">\${t.notes}</span>
                </div>
                <div class="text-right">
                  <span class="font-label-md text-label-md text-outline block uppercase">ETA</span>
                  <span class="font-data-mono text-data-mono text-primary">\${t.eta}</span>
                </div>
              </div>
            </div>
          \`;
        });
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  }
  document.addEventListener('DOMContentLoaded', loadDashboard);
</script>
</body>`);
  } else if (filename === 'trips.html') {
    content = content.replace('</body>', `
<script>
  let activeTripId = 1; // Default fallback for complete logs

  async function loadTripDispatcher() {
    try {
      // 1. Fetch available vehicles and drivers
      const fleetRes = await fetch('/api/fleet');
      const vehicles = await fleetRes.json();
      const driverRes = await fetch('/api/drivers');
      const drivers = await driverRes.json();
      
      const vehicleSelect = document.querySelector('select[class*="border-error"]');
      const driverSelect = document.querySelectorAll('select[class*="border-error"]')[1];
      
      if (vehicleSelect) {
        vehicleSelect.className = "w-full px-4 py-2.5 border border-outline-variant bg-white rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none appearance-none";
        // Remove error alert
        const errAlert = vehicleSelect.nextElementSibling;
        if (errAlert && errAlert.textContent.includes('Overloaded')) {
          errAlert.style.display = 'none';
        }
        vehicleSelect.innerHTML = vehicles
          .filter(v => v.status === 'Available')
          .map(v => \`<option value="\${v.id}">\${v.make_model} (\${v.plate_number}) - Cap: \${v.capacity_tons}t</option>\`)
          .join('') || '<option value="">No Vehicles Available</option>';
      }

      if (driverSelect) {
        driverSelect.className = "w-full px-4 py-2.5 border border-outline-variant bg-white rounded-lg focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none appearance-none";
        // Remove error alert
        const errAlert = driverSelect.nextElementSibling;
        if (errAlert && errAlert.textContent.includes('Expired')) {
          errAlert.style.display = 'none';
        }
        driverSelect.innerHTML = drivers
          .filter(d => d.status === 'Active' && d.license_status === 'Active')
          .map(d => \`<option value="\${d.id}">\${d.name} (ID: \${d.employee_id}) - CDL \${d.cdl_class}</option>\`)
          .join('') || '<option value="">No Drivers Available</option>';
      }

      // Update submit button state
      const submitBtn = document.querySelector('button[disabled]');
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.className = "px-8 py-2.5 bg-primary text-white hover:bg-secondary rounded-lg font-label-md text-label-md flex items-center gap-2 cursor-pointer";
        
        // Add form submission handler
        submitBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          const vSelect = document.querySelectorAll('select')[0];
          const dSelect = document.querySelectorAll('select')[1];
          const srcInput = document.querySelector('input[value*="Logistics Hub"]');
          const destInput = document.querySelector('input[placeholder*="destination"]');
          
          if (!vSelect.value || !dSelect.value || !destInput.value) {
            alert('Please select vehicle, driver and enter destination.');
            return;
          }

          const response = await fetch('/api/trips', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicle_id: vSelect.value,
              driver_id: dSelect.value,
              source: srcInput.value,
              destination: destInput.value,
              priority: 'High',
              load_type: 'Perishables',
              refrigeration_required: true
            })
          });

          if (response.ok) {
            alert('Trip Dispatched successfully!');
            window.location.href = '/dashboard';
          } else {
            const err = await response.json();
            alert('Dispatch failed: ' + err.error);
          }
        });
      }

      // Fetch active manifest details
      const tripsRes = await fetch('/api/trips');
      const trips = await tripsRes.json();
      const activeTrip = trips.find(t => t.status === 'In Transit' || t.status === 'Delayed');
      if (activeTrip) {
        activeTripId = activeTrip.id;
        // Update manifest card UI
        const durationEl = document.querySelector('main .col-span-12.lg\\\\:col-span-4 .font-headline-sm');
        if (durationEl) durationEl.textContent = activeTrip.duration;
        const detailsEl = document.querySelector('main .col-span-12.lg\\\\:col-span-4 .text-on-surface-variant');
        if (detailsEl) detailsEl.textContent = \`\${activeTrip.distance_miles} Miles via I-35S\`;
        
        const manifestTitle = document.querySelector('main .col-span-12.lg\\\\:col-span-4 h3');
        if (manifestTitle) manifestTitle.textContent = \`Trip Manifest (#\${activeTrip.trip_number})\`;
      }

      // Complete Trip Modal form submission handler
      const finalizeBtn = document.querySelector('#completeTripModal button[class*="bg-secondary"]');
      if (finalizeBtn) {
        finalizeBtn.addEventListener('click', async () => {
          const odometer = document.querySelector('#completeTripModal input[placeholder="42,198"]').value;
          const fuel = document.querySelector('#completeTripModal input[placeholder="34.5"]').value;
          const notes = document.querySelector('#completeTripModal textarea').value;

          if (!odometer || !fuel) {
            alert('Please input odometer reading and fuel consumption.');
            return;
          }

          const res = await fetch(\`/api/trips/\${activeTripId}/complete\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              odometer_end: odometer,
              fuel_consumption_gal: fuel,
              notes
            })
          });

          if (res.ok) {
            alert('Trip finalized successfully!');
            document.getElementById('completeTripModal').classList.add('hidden');
            window.location.href = '/dashboard';
          } else {
            const err = await res.json();
            alert('Finalization failed: ' + err.error);
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  document.addEventListener('DOMContentLoaded', loadTripDispatcher);
</script>
</body>`);
  } else if (filename === 'fleet.html') {
    content = content.replace('</body>', `
<script>
  async function loadFleet() {
    try {
      const res = await fetch('/api/fleet');
      const vehicles = await res.json();
      
      const tbody = document.querySelector('table tbody');
      if (tbody) {
        tbody.innerHTML = '';
        vehicles.forEach(v => {
          let statusPill = '';
          if (v.status === 'Available') statusPill = '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[11px] font-bold uppercase">Available</span>';
          else if (v.status === 'In Transit') statusPill = '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold uppercase">In Transit</span>';
          else statusPill = '<span class="px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-[11px] font-bold uppercase">Maintenance</span>';
          
          tbody.innerHTML += \`
            <tr class="hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
              <td class="px-6 py-4 font-bold font-data-mono text-primary">\${v.plate_number}</td>
              <td class="px-6 py-4 font-semibold">\${v.make_model}</td>
              <td class="px-6 py-4 text-on-surface-variant">\${v.type}</td>
              <td class="px-6 py-4 font-data-mono">\${v.capacity_tons}t</td>
              <td class="px-6 py-4 font-data-mono">\${v.fuel_efficiency_mpg} MPG</td>
              <td class="px-6 py-4">\${statusPill}</td>
              <td class="px-6 py-4">
                <button class="text-secondary hover:underline text-[12px] font-bold uppercase" onclick="showVehicleDrawer(\${v.id})">Details</button>
              </td>
            </tr>
          \`;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.showVehicleDrawer = async function(id) {
    try {
      const res = await fetch('/api/fleet');
      const list = await res.json();
      const v = list.find(x => x.id === id);
      if (!v) return;
      
      // Update drawer text fields
      const drawer = document.querySelector('aside[class*="fixed right-0"]');
      if (drawer) {
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
        
        const title = drawer.querySelector('h3');
        if (title) title.textContent = \`Vehicle Details: \${v.plate_number}\`;
        
        const inputs = drawer.querySelectorAll('input');
        if (inputs.length >= 4) {
          inputs[0].value = v.make_model;
          inputs[1].value = v.type;
          inputs[2].value = v.capacity_tons;
          inputs[3].value = v.status;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadFleet();
    
    // Close drawer handlers
    const closeDrawerBtn = document.querySelector('aside[class*="fixed right-0"] button');
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => {
        const drawer = document.querySelector('aside[class*="fixed right-0"]');
        if (drawer) {
          drawer.classList.remove('translate-x-0');
          drawer.classList.add('translate-x-full');
        }
      });
    }
  });
</script>
</body>`)  } else if (filename === 'drivers.html') {
    content = content.replace('</body>', `
<script>
  async function loadDrivers() {
    try {
      const res = await fetch('/api/drivers');
      const drivers = await res.json();
      
      // Update KPIs dynamically
      const kpiTiles = document.querySelectorAll('main .grid > div');
      if (kpiTiles.length >= 4) {
        // Total Drivers
        const totalDriversEl = kpiTiles[0].querySelector('.font-display-lg');
        if (totalDriversEl) totalDriversEl.textContent = drivers.length;
        
        // Fleet Avg Score
        const scores = drivers.map(d => d.safety_score || (85 + (d.id * 3) % 15));
        const avgScore = drivers.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';
        const avgScoreEl = kpiTiles[1].querySelector('.font-display-lg');
        if (avgScoreEl) avgScoreEl.textContent = avgScore;
        
        // License Expiry
        const expired = drivers.filter(d => d.license_status === 'Expired').length;
        const expiryEl = kpiTiles[2].querySelector('.font-display-lg');
        if (expiryEl) expiryEl.textContent = String(expired).padStart(2, '0');
        
        // On-Duty Drivers
        const onDuty = drivers.filter(d => d.status === 'Active' || d.status === 'In Transit').length;
        const onDutyEl = kpiTiles[3].querySelector('.font-display-lg');
        if (onDutyEl) onDutyEl.textContent = onDuty;
        const utilizationPct = drivers.length ? ((onDuty / drivers.length) * 100).toFixed(0) : 0;
        const utilText = kpiTiles[3].querySelector('span.text-body-sm') || kpiTiles[3].querySelector('span.text-on-surface-variant\\\\/50');
        if (utilText) utilText.textContent = \`\${utilizationPct}% Utilization\`;
      }

      const tbody = document.querySelector('table tbody');
      if (tbody) {
        tbody.innerHTML = '';
        drivers.forEach(d => {
          const initials = d.name.split(' ').map(n => n[0]).join('').toUpperCase();
          const score = d.safety_score || (85 + (d.id * 3) % 15);
          
          let statusPill = '';
          if (d.status === 'Active' || d.status === 'Available') {
            statusPill = \`
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700">
                <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Available
              </span>
            \`;
          } else if (d.status === 'In Transit') {
            statusPill = \`
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                On Trip
              </span>
            \`;
          } else if (d.status === 'Suspended') {
            statusPill = \`
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-700">
                <span class="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Suspended
              </span>
            \`;
          } else {
            statusPill = \`
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-700">
                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                Off Duty
              </span>
            \`;
          }

          let scoreColor = 'bg-green-500';
          if (score < 80) scoreColor = 'bg-yellow-500';
          if (score < 70) scoreColor = 'bg-red-500';
          
          tbody.innerHTML += \`
            <tr class="hover:bg-surface-container-low transition-colors group border-b border-outline-variant/30">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">\${initials}</div>
                  <div>
                    <div class="font-body-md text-body-md font-semibold">\${d.name}</div>
                    <div class="text-body-sm text-on-surface-variant/60">\${d.cdl_class}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-data-mono text-data-mono">TX-\${d.employee_id}482-A</td>
              <td class="px-6 py-4 font-body-md text-body-md text-on-surface">\${d.license_expiry}</td>
              <td class="px-6 py-4">
                <div class="flex flex-col gap-1 w-24">
                  <div class="flex justify-between items-center">
                    <span class="text-body-sm font-semibold text-primary">\${score}%</span>
                  </div>
                  <div class="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                    <div class="safety-fill \${scoreColor} h-full transition-all duration-500" style="width: \${score}%;"></div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">\${statusPill}</td>
              <td class="px-6 py-4 text-right">
                <button class="text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:underline font-label-md text-label-md" onclick="showDriverDrawer(\${d.id})">Manage</button>
              </td>
            </tr>
          \`;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  window.showDriverDrawer = async function(id) {
    try {
      const res = await fetch('/api/drivers');
      const list = await res.json();
      const d = list.find(x => x.id === id);
      if (!d) return;
      
      const drawer = document.querySelector('aside[class*="fixed right-0"]');
      if (drawer) {
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
        
        const title = drawer.querySelector('h3');
        if (title) title.textContent = \`Driver Profile: \${d.name}\`;
        
        const inputs = drawer.querySelectorAll('input, select');
        if (inputs.length >= 4) {
          inputs[0].value = d.name;
          inputs[1].value = d.cdl_class;
          inputs[2].value = d.license_expiry;
          // License Status select
          inputs[3].value = d.license_status;
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadDrivers();
    const closeBtn = document.querySelector('aside[class*="fixed right-0"] button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const drawer = document.querySelector('aside[class*="fixed right-0"]');
        if (drawer) {
          drawer.classList.remove('translate-x-0');
          drawer.classList.add('translate-x-full');
        }
      });
    }
  });
</script>
</body>`);
  } else if (filename === 'maintenance.html') {
    content = content.replace('</body>', `
<script>
  async function loadMaintenance() {
    try {
      const res = await fetch('/api/maintenance');
      const logs = await res.json();
      
      const tbody = document.querySelector('table tbody');
      if (tbody) {
        tbody.innerHTML = '';
        logs.forEach(l => {
          let badge = '';
          if (l.status === 'Completed') badge = '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[11px] font-bold uppercase">Completed</span>';
          else if (l.status === 'In Progress') badge = '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[11px] font-bold uppercase">In Progress</span>';
          else badge = '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[11px] font-bold uppercase">Scheduled</span>';
          
          tbody.innerHTML += \`
            <tr class="hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
              <td class="px-6 py-4 font-bold font-data-mono text-primary">\${l.vehicle_name}</td>
              <td class="px-6 py-4 font-semibold">\${l.issue}</td>
              <td class="px-6 py-4 font-data-mono">\${l.date_logged}</td>
              <td class="px-6 py-4 font-data-mono">\${l.scheduled_date}</td>
              <td class="px-6 py-4 font-data-mono">\$\${l.cost}</td>
              <td class="px-6 py-4">\${badge}</td>
            </tr>
          \`;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function initMaintenanceForm() {
    const fleetRes = await fetch('/api/fleet');
    const vehicles = await fleetRes.json();
    const select = document.querySelector('select');
    if (select) {
      select.innerHTML = vehicles.map(v => \`<option value="\${v.id}">\${v.make_model} (\${v.plate_number})</option>\`).join('');
    }
    
    // Add submit button event
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const vId = document.querySelector('select').value;
        const issue = document.querySelector('textarea').value;
        const date = document.querySelector('input[type="date"]').value;
        const cost = document.querySelector('input[type="number"]').value;
        const status = document.querySelector('select:nth-of-type(2)').value;
        
        if (!issue || !date) {
          alert('Please enter issue description and scheduled date.');
          return;
        }

        const res = await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicle_id: vId,
            issue,
            scheduled_date: date,
            status,
            cost
          })
        });

        if (res.ok) {
          alert('Maintenance task logged successfully!');
          window.location.reload();
        } else {
          alert('Failed to log task.');
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadMaintenance();
    initMaintenanceForm();
  });
</script>
</body>`);
  } else if (filename === 'expenses.html') {
    content = content.replace('</body>', `
<script>
  async function loadExpenses() {
    try {
      const res = await fetch('/api/expenses');
      const expenses = await res.json();
      
      const tbody = document.querySelector('table tbody');
      if (tbody) {
        tbody.innerHTML = '';
        expenses.forEach(e => {
          let badge = '';
          if (e.status === 'Approved') badge = '<span class="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-[11px] font-bold uppercase">Approved</span>';
          else badge = '<span class="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-[11px] font-bold uppercase">Pending</span>';
          
          tbody.innerHTML += \`
            <tr class="hover:bg-surface-container-low transition-colors border-b border-outline-variant/30">
              <td class="px-6 py-4 font-bold text-primary font-data-mono">\${e.reference_no}</td>
              <td class="px-6 py-4 font-semibold">\${e.type}</td>
              <td class="px-6 py-4 text-on-surface-variant">\${e.description}</td>
              <td class="px-6 py-4 font-data-mono">\${e.date}</td>
              <td class="px-6 py-4 font-data-mono font-bold text-primary">\$\${e.amount}</td>
              <td class="px-6 py-4">\${badge}</td>
            </tr>
          \`;
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadExpenses();
    
    // Wire up new expense logger
    const saveBtn = document.querySelector('button[type="submit"]') || document.querySelector('aside button[class*="bg-primary"]');
    if (saveBtn) {
      saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const type = document.querySelector('select').value;
        const amount = document.querySelector('input[type="number"]').value;
        const description = document.querySelector('textarea').value;
        
        if (!amount) {
          alert('Please enter amount.');
          return;
        }

        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, amount, description, status: 'Pending' })
        });

        if (res.ok) {
          alert('Expense logged successfully!');
          window.location.reload();
        } else {
          alert('Failed to log expense.');
        }
      });
    }
  });
</script>
</body>`);
  } else if (filename === 'analytics.html') {
    content = content.replace('</body>', `
<script>
  async function loadAnalytics() {
    try {
      const statsRes = await fetch('/api/dashboard/stats');
      const stats = await statsRes.json();
      
      const tripRes = await fetch('/api/trips');
      const trips = await tripRes.json();
      
      const fleetRes = await fetch('/api/fleet');
      const vehicles = await fleetRes.json();
      
      // Update stats displays
      const uEl = document.querySelector('.font-display-lg');
      if (uEl) uEl.textContent = stats.utilization + '%';
      
      // Compute uptime percent
      const activePercent = document.querySelectorAll('section.grid .font-display-lg')[1];
      if (activePercent) activePercent.textContent = stats.activeVehicles;
    } catch (err) {
      console.error(err);
    }
  }
  document.addEventListener('DOMContentLoaded', loadAnalytics);
</script>
</body>`);
  }

  fs.writeFileSync(path.join(destDir, filename), content);
  console.log(`Processed and wrote \${filename} to public/`);
}

function processAll() {
  const files = fs.readdirSync(srcDir);
  files.forEach(f => {
    if (f.endsWith('.html')) {
      processFile(f);
    }
  });
  
  // Create static index.html which redirects to /login
  fs.writeFileSync(path.join(destDir, 'index.html'), `
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/login" />
</head>
<body>
  Redirecting to login...
</body>
</html>
  `);
  console.log('Created index.html redirect.');
}

processAll();
