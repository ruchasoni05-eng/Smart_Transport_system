import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('src/db/db.json');

// Initial seed data
const initialData = {
  users: [
    { id: 1, email: 'alex.rivera@transitops.com', password: 'password', name: 'Alex Rivera', role: 'Fleet Manager', employee_id: 'TX-492' },
    { id: 2, email: 'j.smith@transitops.com', password: 'password', name: 'James Smith', role: 'Driver', employee_id: 'TX-882' },
    { id: 3, email: 's.compliance@transitops.com', password: 'password', name: 'Sarah Compliance', role: 'Safety Officer', employee_id: 'TX-511' },
    { id: 4, email: 'data.desk@transitops.com', password: 'password', name: 'Data Desk', role: 'Financial Analyst', employee_id: 'TX-309' }
  ],
  vehicles: [
    { id: 1, plate_number: 'TX-9921', make_model: 'Freightliner M2', type: 'Heavy Duty', capacity_tons: 10.0, status: 'In Transit', fuel_efficiency_mpg: 7.8, avg_downtime_hours: 4.2 },
    { id: 2, plate_number: 'TX-4402', make_model: 'Mercedes Sprinter', type: 'Medium Duty', capacity_tons: 4.5, status: 'Available', fuel_efficiency_mpg: 14.5, avg_downtime_hours: 2.1 },
    { id: 3, plate_number: 'TX-1188', make_model: 'Volvo FH16', type: 'Heavy Duty', capacity_tons: 15.0, status: 'Maintenance', fuel_efficiency_mpg: 6.5, avg_downtime_hours: 8.5 },
    { id: 4, plate_number: 'TX-8821', make_model: 'Volvo VNL 860', type: 'Heavy Duty', capacity_tons: 12.0, status: 'In Transit', fuel_efficiency_mpg: 8.1, avg_downtime_hours: 3.5 },
    { id: 5, plate_number: 'TX-9104', make_model: 'Mercedes Actros', type: 'Heavy Duty', capacity_tons: 14.0, status: 'In Transit', fuel_efficiency_mpg: 7.9, avg_downtime_hours: 4.0 }
  ],
  drivers: [
    { id: 1, name: 'Carlos Mendez', employee_id: '882', status: 'Active', license_status: 'Active', license_expiry: '2027-10-12', cdl_class: 'Class A' },
    { id: 2, name: 'Sarah Jenkins', employee_id: '412', status: 'Active', license_status: 'Active', license_expiry: '2028-04-15', cdl_class: 'Class A' },
    { id: 3, name: 'James Wilson', employee_id: '009', status: 'Suspended', license_status: 'Expired', license_expiry: '2023-10-12', cdl_class: 'Class A' },
    { id: 4, name: 'Marco Silva', employee_id: '104', status: 'Active', license_status: 'Active', license_expiry: '2027-08-20', cdl_class: 'Class A' },
    { id: 5, name: 'Sarah Chen', employee_id: '205', status: 'Active', license_status: 'Active', license_expiry: '2028-09-01', cdl_class: 'Class A' },
    { id: 6, name: 'Elena Rodriguez', employee_id: '306', status: 'Active', license_status: 'Active', license_expiry: '2026-12-15', cdl_class: 'Class B' }
  ],
  trips: [
    { id: 1, trip_number: 'TRP-9402', vehicle_id: 1, driver_id: 4, source: 'Logistics Hub A - Austin, TX', destination: 'Logistics Hub B - Houston, TX', status: 'In Transit', priority: 'High', load_type: 'Perishables', refrigeration_required: true, eta: '14:45 PM', duration: '4h 45m', distance_miles: 312.4, notes: 'On schedule' },
    { id: 2, trip_number: 'TRP-8821', vehicle_id: 4, driver_id: 5, source: 'Logistics Hub C - Dallas, TX', destination: 'Logistics Hub A - Austin, TX', status: 'Delayed', priority: 'Medium', load_type: 'Dry Goods', refrigeration_required: false, eta: '15:10 PM', duration: '3h 30m', distance_miles: 195.2, notes: 'Traffic delay on I-35S' },
    { id: 3, trip_number: 'TRP-9104', vehicle_id: 5, driver_id: 6, source: 'Logistics Hub B - Houston, TX', destination: 'Logistics Hub C - Dallas, TX', status: 'Loading', priority: 'High', load_type: 'Chemicals', refrigeration_required: false, eta: '16:30 PM', duration: '5h 15m', distance_miles: 239.0, notes: 'At Depot 4' }
  ],
  maintenance: [
    { id: 1, vehicle_id: 3, issue: 'Brake pad replacement and system check', date_logged: '2026-07-10', scheduled_date: '2026-07-12', status: 'In Progress', cost: 450.0 },
    { id: 2, vehicle_id: 2, issue: 'Oil change and tire rotation', date_logged: '2026-07-11', scheduled_date: '2026-07-14', status: 'Scheduled', cost: 150.0 }
  ],
  expenses: [
    { id: 1, type: 'Fuel', amount: 124.5, date: '2026-07-12', reference_no: 'EXP-1092', status: 'Approved', description: 'Fuel fill-up TX-9921' },
    { id: 2, type: 'Maintenance', amount: 450.0, date: '2026-07-10', reference_no: 'EXP-1093', status: 'Pending', description: 'Brake pads replacement TX-1188' }
  ]
};

// Check if db.json exists, if not initialize it
function initDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
    console.log('Database initialized with seed data.');
  }
}

initDb();

function readDb() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file:', err);
    return initialData;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing database file:', err);
  }
}

export const db = {
  getAll: (table) => {
    const data = readDb();
    return data[table] || [];
  },

  getById: (table, id) => {
    const list = db.getAll(table);
    return list.find(item => item.id === Number(id));
  },

  insert: (table, item) => {
    const data = readDb();
    if (!data[table]) data[table] = [];
    
    const newId = data[table].reduce((max, x) => x.id > max ? x.id : max, 0) + 1;
    const newItem = { id: newId, ...item };
    data[table].push(newItem);
    writeDb(data);
    return newItem;
  },

  update: (table, id, updates) => {
    const data = readDb();
    if (!data[table]) return null;
    
    const index = data[table].findIndex(item => item.id === Number(id));
    if (index === -1) return null;
    
    data[table][index] = { ...data[table][index], ...updates };
    writeDb(data);
    return data[table][index];
  },

  delete: (table, id) => {
    const data = readDb();
    if (!data[table]) return false;
    
    const index = data[table].findIndex(item => item.id === Number(id));
    if (index === -1) return false;
    
    data[table].splice(index, 1);
    writeDb(data);
    return true;
  },

  reset: () => {
    writeDb(initialData);
    return true;
  }
};
