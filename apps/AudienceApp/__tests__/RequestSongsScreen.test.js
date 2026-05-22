// Test the pure logic functions extracted from RequestSongsScreen

// --- filterAvailableSongs logic ---
const filterAvailableSongs = (allSongs, requests, setListItems) => {
  const confirmedSongIds = requests
    .filter(r => r.status === 'confirmed')
    .map(r => r.songId);

  const setListSongIds = setListItems
    .filter(item => item.type === 'song')
    .map(item => item.songId);

  return allSongs.filter(
    song =>
      song.isRequestable &&
      !setListSongIds.includes(song.id) &&
      !confirmedSongIds.includes(song.id)
  );
};

// --- search logic ---
const searchSongs = (songs, query) => {
  if (!query) return songs;
  return songs.filter(
    s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.artist.toLowerCase().includes(query.toLowerCase())
  );
};

// --- cooldown logic ---
const getRemainingCooldown = (lastRequestTime, cooldownMs = 120000) => {
  if (!lastRequestTime) return 0;
  const remaining = cooldownMs - (Date.now() - lastRequestTime);
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
};

// --- request data shape ---
const buildRequestData = (requestId, song, customerName, priorityBoost, paymentMethod) => ({
  id: requestId,
  songId: song.id,
  songTitle: song.title,
  artist: song.artist,
  price: song.price,
  customerName: customerName.trim().slice(0, 50) || 'Anonymous',
  timestamp: expect.any(Number),
  paymentMethod,
  status: 'pending',
  priorityBoost,
  playedTimestamp: null,
});

// =====================
// TESTS
// =====================

describe('filterAvailableSongs', () => {
  const songs = [
    { id: '1', title: 'Song A', artist: 'Artist 1', isRequestable: true },
    { id: '2', title: 'Song B', artist: 'Artist 2', isRequestable: true },
    { id: '3', title: 'Song C', artist: 'Artist 3', isRequestable: false },
    { id: '4', title: 'Song D', artist: 'Artist 4', isRequestable: true },
  ];

  test('returns only requestable songs', () => {
    const result = filterAvailableSongs(songs, [], []);
    expect(result.every(s => s.isRequestable)).toBe(true);
    expect(result.find(s => s.id === '3')).toBeUndefined();
  });

  test('excludes confirmed requests', () => {
    const requests = [{ songId: '1', status: 'confirmed' }];
    const result = filterAvailableSongs(songs, requests, []);
    expect(result.find(s => s.id === '1')).toBeUndefined();
    expect(result.find(s => s.id === '2')).toBeDefined();
  });

  test('does not exclude pending requests', () => {
    const requests = [{ songId: '1', status: 'pending' }];
    const result = filterAvailableSongs(songs, requests, []);
    expect(result.find(s => s.id === '1')).toBeDefined();
  });

  test('excludes songs already in set list', () => {
    const setList = [{ type: 'song', songId: '2' }];
    const result = filterAvailableSongs(songs, [], setList);
    expect(result.find(s => s.id === '2')).toBeUndefined();
  });

  test('returns empty array when all songs filtered out', () => {
    const requests = [
      { songId: '1', status: 'confirmed' },
      { songId: '2', status: 'confirmed' },
      { songId: '4', status: 'confirmed' },
    ];
    const result = filterAvailableSongs(songs, requests, []);
    expect(result).toHaveLength(0);
  });
});

describe('searchSongs', () => {
  const songs = [
    { id: '1', title: 'Wagon Wheel', artist: 'Darius Rucker' },
    { id: '2', title: 'Friends in Low Places', artist: 'Garth Brooks' },
    { id: '3', title: 'Take Me Home', artist: 'John Denver' },
  ];

  test('returns all songs when query is empty', () => {
    expect(searchSongs(songs, '')).toHaveLength(3);
  });

  test('filters by title case-insensitively', () => {
    const result = searchSongs(songs, 'wagon');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  test('filters by artist case-insensitively', () => {
    const result = searchSongs(songs, 'garth');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  test('returns empty array when no match', () => {
    expect(searchSongs(songs, 'zzznomatch')).toHaveLength(0);
  });

  test('partial match works', () => {
    const result = searchSongs(songs, 'home');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });
});

describe('getRemainingCooldown', () => {
  test('returns 0 when no last request time', () => {
    expect(getRemainingCooldown(null)).toBe(0);
  });

  test('returns 0 when cooldown has expired', () => {
    const twoMinutesAgo = Date.now() - 130000;
    expect(getRemainingCooldown(twoMinutesAgo)).toBe(0);
  });

  test('returns remaining seconds when cooldown active', () => {
    const oneMinuteAgo = Date.now() - 60000;
    const remaining = getRemainingCooldown(oneMinuteAgo);
    expect(remaining).toBeGreaterThan(55);
    expect(remaining).toBeLessThanOrEqual(60);
  });
});

describe('buildRequestData', () => {
  const song = { id: 'song1', title: 'Wagon Wheel', artist: 'Darius Rucker', price: 5 };

  test('sets status to pending always', () => {
    const data = buildRequestData('req1', song, 'Renee', false, 'venmo');
    expect(data.status).toBe('pending');
  });

  test('uses Anonymous when name is empty', () => {
    const data = buildRequestData('req1', song, '', false, 'cash');
    expect(data.customerName).toBe('Anonymous');
  });

  test('trims and truncates customer name to 50 chars', () => {
    const longName = 'A'.repeat(100);
    const data = buildRequestData('req1', song, longName, false, 'cash');
    expect(data.customerName.length).toBeLessThanOrEqual(50);
  });

  test('correctly sets priorityBoost', () => {
    const data = buildRequestData('req1', song, 'Renee', true, 'venmo');
    expect(data.priorityBoost).toBe(true);
  });

  test('playedTimestamp is null on creation', () => {
    const data = buildRequestData('req1', song, 'Renee', false, 'cash');
    expect(data.playedTimestamp).toBeNull();
  });
});
