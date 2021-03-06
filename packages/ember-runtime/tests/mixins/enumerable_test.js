require('ember-runtime/~tests/suites/enumerable');

var indexOf = Ember.EnumerableUtils.indexOf;

/*
  Implement a basic fake enumerable.  This validates that any non-native
  enumerable can impl this API.
*/
var TestEnumerable = Ember.Object.extend(Ember.Enumerable, {

  _content: null,

  init: function(ary) {
    this._content = ary || [];
  },

  addObject: function(obj) {
    if (indexOf(this._content, obj)>=0) return this;
    this._content.push(obj);
    this.enumerableContentDidChange();
  },

  nextObject: function(idx) {
    return idx >= Ember.get(this, 'length') ? undefined : this._content[idx];
  },

  length: Ember.computed(function() {
    return this._content.length;
  }),

  slice: function() {
    return this._content.slice();
  }

});


Ember.EnumerableTests.extend({

  name: 'Basic Enumerable',

  newObject: function(ary) {
    ary = ary ? ary.slice() : this.newFixture(3);
    return new TestEnumerable(ary);
  },

  // allows for testing of the basic enumerable after an internal mutation
  mutate: function(obj) {
    obj.addObject(obj._content.length+1);
  },

  toArray: function(obj) {
    return obj.slice();
  }

}).run();

module('Ember.Enumerable');

test("should apply Ember.Array to return value of map", function() {
  var x = Ember.Object.createWithMixins(Ember.Enumerable);
  var y = x.map(Ember.K);
  equal(Ember.Array.detect(y), true, "should have mixin applied");
});

test("should apply Ember.Array to return value of filter", function() {
  var x = Ember.Object.createWithMixins(Ember.Enumerable);
  var y = x.filter(Ember.K);
  equal(Ember.Array.detect(y), true, "should have mixin applied");
});

test("should apply Ember.Array to return value of invoke", function() {
  var x = Ember.Object.createWithMixins(Ember.Enumerable);
  var y = x.invoke(Ember.K);
  equal(Ember.Array.detect(y), true, "should have mixin applied");
});

test("should apply Ember.Array to return value of toArray", function() {
  var x = Ember.Object.createWithMixins(Ember.Enumerable);
  var y = x.toArray(Ember.K);
  equal(Ember.Array.detect(y), true, "should have mixin applied");
});

test("should apply Ember.Array to return value of without", function() {
  var x = Ember.Object.createWithMixins(Ember.Enumerable, {
    contains: function() {
      return true;
    }
  });
  var y = x.without(Ember.K);
  equal(Ember.Array.detect(y), true, "should have mixin applied");
});

test("should apply Ember.Array to return value of uniq", function() {
  var x = Ember.Object.createWithMixins(Ember.Enumerable);
  var y = x.uniq(Ember.K);
  equal(Ember.Array.detect(y), true, "should have mixin applied");
});

test('any', function() {
  var kittens = Ember.A([{
    color: 'white'
  }, {
    color: 'black'
  }, {
    color: 'white'
  }]),
  foundWhite = kittens.any(function(kitten) { return kitten.color === 'white'; }),
  foundWhite2 = kittens.isAny('color', 'white');

  equal(foundWhite, true);
  equal(foundWhite2, true);
});

test('any with NaN', function() {
  var numbers = Ember.A([1,2,NaN,4]);

  var hasNaN = numbers.any(function(n){ return isNaN(n); });

  equal(hasNaN, true, "works when matching NaN");
});

test('every', function() {
  var allColorsKittens = Ember.A([{
    color: 'white'
  }, {
    color: 'black'
  }, {
    color: 'white'
  }]),
  allWhiteKittens = Ember.A([{
    color: 'white'
  }, {
    color: 'white'
  }, {
    color: 'white'
  }]),
  allWhite = false,
  whiteKittenPredicate = function(kitten) { return kitten.color === 'white'; };

  allWhite = allColorsKittens.every(whiteKittenPredicate);
  equal(allWhite, false);

  allWhite = allWhiteKittens.every(whiteKittenPredicate);
  equal(allWhite, true);

  allWhite = allColorsKittens.isEvery('color', 'white');
  equal(allWhite, false);

  allWhite = allWhiteKittens.isEvery('color', 'white');
  equal(allWhite, true);
});

// ..........................................................
// CONTENT DID CHANGE
//

var DummyEnum = Ember.Object.extend(Ember.Enumerable, {
  nextObject: function() {},
  length: 0
});

var obj, observer;

// ..........................................................
// NOTIFY ENUMERABLE PROPERTY
//

module('mixins/enumerable/enumerableContentDidChange');

test('should notify observers of []', function() {

  var obj = Ember.Object.createWithMixins(Ember.Enumerable, {
    nextObject: function() {}, // avoid exceptions

    _count: 0,
    enumerablePropertyDidChange: Ember.observer('[]', function() {
      this._count++;
    })
  });

  equal(obj._count, 0, 'should not have invoked yet');
  obj.enumerableContentWillChange();
  obj.enumerableContentDidChange();
  equal(obj._count, 1, 'should have invoked');

});

// ..........................................................
// NOTIFY CHANGES TO LENGTH
//

module('notify observers of length', {
  setup: function() {
    obj = DummyEnum.createWithMixins({
      _after: 0,
      lengthDidChange: Ember.observer('length', function() {
        this._after++;
      })

    });

    equal(obj._after, 0, 'should not have fired yet');
  },

  teardown: function() {
    obj = null;
  }
});

test('should notify observers when call with no params', function() {
  obj.enumerableContentWillChange();
  equal(obj._after, 0);

  obj.enumerableContentDidChange();
  equal(obj._after, 1);
});

// API variation that included items only
test('should not notify when passed arrays of same length', function() {
  var added = ['foo'], removed = ['bar'];
  obj.enumerableContentWillChange(removed, added);
  equal(obj._after, 0);

  obj.enumerableContentDidChange(removed, added);
  equal(obj._after, 0);
});

test('should notify when passed arrays of different length', function() {
  var added = ['foo'], removed = ['bar', 'baz'];
  obj.enumerableContentWillChange(removed, added);
  equal(obj._after, 0);

  obj.enumerableContentDidChange(removed, added);
  equal(obj._after, 1);
});

// API variation passes indexes only
test('should not notify when passed with indexes', function() {
  obj.enumerableContentWillChange(1, 1);
  equal(obj._after, 0);

  obj.enumerableContentDidChange(1, 1);
  equal(obj._after, 0);
});

test('should notify when passed old index API with delta', function() {
  obj.enumerableContentWillChange(1, 2);
  equal(obj._after, 0);

  obj.enumerableContentDidChange(1, 2);
  equal(obj._after, 1);
});


// ..........................................................
// NOTIFY ENUMERABLE OBSERVER
//

module('notify enumerable observers', {
  setup: function() {
    obj = DummyEnum.create();

    observer = Ember.Object.createWithMixins({
      _before: null,
      _after: null,

      enumerableWillChange: function() {
        equal(this._before, null); // should only call once
        this._before = Array.prototype.slice.call(arguments);
      },

      enumerableDidChange: function() {
        equal(this._after, null); // should only call once
        this._after = Array.prototype.slice.call(arguments);
      }
    });

    obj.addEnumerableObserver(observer);
  },

  teardown: function() {
    obj = observer = null;
  }
});

test('should notify enumerable observers when called with no params', function() {
  obj.enumerableContentWillChange();
  deepEqual(observer._before, [obj, null, null]);

  obj.enumerableContentDidChange();
  deepEqual(observer._after, [obj, null, null]);
});

// API variation that included items only
test('should notify when called with same length items', function() {
  var added = ['foo'], removed = ['bar'];
  obj.enumerableContentWillChange(removed, added);
  deepEqual(observer._before, [obj, removed, added]);

  obj.enumerableContentDidChange(removed, added);
  deepEqual(observer._after, [obj, removed, added]);
});

test('should notify when called with diff length items', function() {
  var added = ['foo', 'baz'], removed = ['bar'];
  obj.enumerableContentWillChange(removed, added);
  deepEqual(observer._before, [obj, removed, added]);

  obj.enumerableContentDidChange(removed, added);
  deepEqual(observer._after, [obj, removed, added]);
});

test('should not notify when passed with indexes only', function() {
  obj.enumerableContentWillChange(1, 2);
  deepEqual(observer._before, [obj, 1, 2]);

  obj.enumerableContentDidChange(1, 2);
  deepEqual(observer._after, [obj, 1, 2]);
});

test('removing enumerable observer should disable', function() {
  obj.removeEnumerableObserver(observer);
  obj.enumerableContentWillChange();
  deepEqual(observer._before, null);

  obj.enumerableContentDidChange();
  deepEqual(observer._after, null);
});

