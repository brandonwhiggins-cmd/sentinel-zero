// Shared real data store for Sentinel Zero Early Adopter pre-registrations and votes.
// Zero mock data policy: all registrations and votes start at 0 and only reflect real submissions.
import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join('/tmp', 'sentinel_adopters.json');

const INITIAL_VOTES = {
  wardogs: 0,
  valorant: 0,
  warzone: 0,
  cod: 0,
  tarkov: 0,
  apex: 0,
  rocketleague: 0,
  fortnite: 0,
  rust: 0,
  overwatch: 0,
  league: 0,
  fc25: 0,
  nba2k: 0,
  madden: 0
};

// In-memory fallback if /tmp is ephemeral
let memoryStore = {
  count: 0,
  target: 500,
  votes: { ...INITIAL_VOTES },
  pledges: []
};

function readStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf-8');
      const data = JSON.parse(raw);
      if (data && typeof data.count === 'number') {
        memoryStore = data;
      }
    }
  } catch (e) {
    // Keep in-memory store
  }
  return memoryStore;
}

function writeStore(data) {
  memoryStore = data;
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

export function getEarlyAdopterState() {
  const store = readStore();
  return {
    count: store.count || 0,
    target: store.target || 500,
    percent: Number((((store.count || 0) / (store.target || 500)) * 100).toFixed(1)),
    remaining: Math.max(0, (store.target || 500) - (store.count || 0)),
    votes: store.votes || { ...INITIAL_VOTES },
    total_pledges: (store.pledges || []).length
  };
}

export function recordEarlyAdopterPledge(pledge) {
  const store = readStore();
  const gamertag = (pledge.gamertag || 'Operative').trim();
  const email = (pledge.email || '').trim();
  const discord = (pledge.discord || '').trim();
  const plan = (pledge.plan || 'pro').toLowerCase();
  const vote = (pledge.vote || '').toLowerCase().trim();
  const voteWeight = plan === 'elite' ? 2 : 1;

  store.count = (store.count || 0) + 1;

  if (vote && store.votes[vote] !== undefined) {
    store.votes[vote] = (store.votes[vote] || 0) + voteWeight;
  } else if (vote) {
    store.votes[vote] = voteWeight;
  }

  const record = {
    ticket_id: `SZ-EA-${Date.now().toString().slice(-6)}`,
    gamertag,
    email,
    discord,
    plan,
    vote,
    voteWeight,
    upfront_charge: 0.00,
    timestamp: Date.now()
  };

  store.pledges = store.pledges || [];
  store.pledges.push(record);

  writeStore(store);

  return {
    record,
    total_count: store.count,
    votes: store.votes
  };
}
