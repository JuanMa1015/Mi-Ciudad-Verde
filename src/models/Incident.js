export function createIncident(overrides = {}) {
  return {
    id: '',
    userId: overrides.userId || '',
    description: '',
    photoUrl: '',
    location: { latitude: 0, longitude: 0 }, 
    createdAt: Date.now(),
    ...overrides,
  };
}
