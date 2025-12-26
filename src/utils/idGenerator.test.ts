import { generateId, generateColor } from './idGenerator';

describe('idGenerator', () => {
  describe('generateId', () => {
    it('should generate a unique ID', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs in the correct format', () => {
      const id = generateId();
      const parts = id.split('-');

      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^\d+$/);
      expect(parts[1]).toHaveLength(9);
    });

    it('should generate unique IDs consistently', () => {
      const ids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateId());
      }

      expect(ids.size).toBe(count);
    });
  });

  describe('generateColor', () => {
    it('should generate a valid hex color', () => {
      const color = generateColor();

      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should generate colors from the predefined palette', () => {
      const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#6C5CE7', '#A29BFE', '#FD79A8',
        '#FDCB6E', '#6C5CE7', '#00B894', '#0984E3'
      ];

      const generatedColor = generateColor();

      expect(colors).toContain(generatedColor);
    });

    it('should generate colors randomly', () => {
      const uniqueColors = new Set();
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        uniqueColors.add(generateColor());
      }

      // Should get at least 2 different colors in 50 iterations
      expect(uniqueColors.size).toBeGreaterThan(1);
    });
  });
});
