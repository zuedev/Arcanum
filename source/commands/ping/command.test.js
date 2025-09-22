import { createPingCommand } from './command.js';

describe('ping command', () => {
  test('should return a command builder instance', () => {
    const result = createPingCommand();
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');
  });

  test('should create a command with ping name', () => {
    const result = createPingCommand();
    expect(result.name).toBe('ping');
  });

  test('should create a command with correct description', () => {
    const result = createPingCommand();
    expect(result.description).toBe('Replies with pong!');
  });
});