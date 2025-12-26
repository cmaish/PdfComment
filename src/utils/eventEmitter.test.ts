import { EventEmitter } from './eventEmitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter<string>;

  beforeEach(() => {
    emitter = new EventEmitter<string>();
  });

  describe('on', () => {
    it('should register an event listener', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.emit('test', 'data');

      expect(callback).toHaveBeenCalledWith('data');
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', () => {
      const callback = jest.fn();
      const unsubscribe = emitter.on('test', callback);

      unsubscribe();
      emitter.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should support multiple listeners for the same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.emit('test', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });
  });

  describe('off', () => {
    it('should remove an event listener', () => {
      const callback = jest.fn();
      emitter.on('test', callback);
      emitter.off('test', callback);
      emitter.emit('test', 'data');

      expect(callback).not.toHaveBeenCalled();
    });

    it('should only remove the specified listener', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.off('test', callback1);
      emitter.emit('test', 'data');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith('data');
    });
  });

  describe('emit', () => {
    it('should call all registered listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      emitter.on('test', callback1);
      emitter.on('test', callback2);
      emitter.on('other', callback3);
      emitter.emit('test', 'data');

      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
      expect(callback3).not.toHaveBeenCalled();
    });

    it('should not throw if event has no listeners', () => {
      expect(() => emitter.emit('test', 'data')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all listeners', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      emitter.on('test1', callback1);
      emitter.on('test2', callback2);
      emitter.clear();
      emitter.emit('test1', 'data');
      emitter.emit('test2', 'data');

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
