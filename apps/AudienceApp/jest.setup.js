import '@testing-library/jest-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Firebase
jest.mock('./firebaseConfig', () => ({
  database: {},
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(),
  push: jest.fn(() => ({ key: 'mock-request-id' })),
  set: jest.fn(() => Promise.resolve()),
  get: jest.fn(),
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'http://localhost/'),
  getInitialURL: jest.fn(() => Promise.resolve(null)),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  parse: jest.fn(() => ({ path: null, queryParams: {} })),
}));
