const morpion = require('../morpion.js');

describe('morpion', () => {
  describe('oldStyleMoveToNew', () => {
    it('converts an old style move to a new style', () => {
      expect(morpion.oldStyleMoveToNew([6, 10, 6, 6, 4])).toEqual([
        6,
        10,
        3,
        -4
      ]);

      expect(morpion.oldStyleMoveToNew([2, 2, 0, 4, 1])).toEqual([2, 2, 0, -2]);
    });
  });
});
