'use strict';

describe('dir', function () {

  var element, $compile, $rootScope, $bidi, $locale, $bidiProvider;

  // a rtl text that gets ltr when adding any ltr word
  var WEAK_RTL_TEXT = 'someText \u05d0';
  var LTR_TEXT = 'someText';


  beforeEach(module(function ($sceProvider, $provide, _$bidiProvider_) {
    $locale = {};
    $provide.value('$locale', $locale);
    $sceProvider.enabled(false);
    $bidiProvider = _$bidiProvider_;
    $bidiProvider.enabled(true);
  }));

  beforeEach(inject(function (_$compile_, _$rootScope_, _$bidi_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $bidi = _$bidi_;
  }));

  afterEach(function () {
    dealoc(element);
  });

  describe('set dir property with dir=locale', function() {

    it('should do nothing if $bidi is disabled', function() {
      $bidiProvider.enabled(false);

      $locale.id = 'en';
      element = $compile('<div dir="locale"></div>')($rootScope);
      expect(element.attr('dir')).toBe('locale');
    });

    it('should work for ltr', function () {
      $locale.id = 'en';
      element = $compile('<div dir="locale"></div>')($rootScope);
      expect(element.attr('dir')).toBe('ltr');
    });

    it('should work for rtl', function () {
      $locale.id = 'ar';
      element = $compile('<div dir="locale"></div>')($rootScope);
      expect(element.attr('dir')).toBe('rtl');
    });

  });

  describe('set dir property with dir=auto', function () {
    function testFixedValue(html) {
      element = $compile(html.replace('$$', ''))($rootScope);
      $rootScope.$digest();
      expect(element.prop('dir')).toBe('');

      element = $compile(html.replace('$$', LTR_TEXT))($rootScope);
      $rootScope.$digest();
      expect(element.prop('dir')).toBe('ltr');

      element = $compile(html.replace('$$', WEAK_RTL_TEXT))($rootScope);
      $rootScope.$digest();
      expect(element.prop('dir')).toBe('rtl');
    }

    function testDynamicValue(html, valueTemplate) {
      valueTemplate = valueTemplate || '$$';
      var scope = $rootScope.$new();
      scope.text = valueTemplate.replace('$$', '');
      element = $compile(html)(scope);
      scope.$digest();
      expect(element.prop('dir')).toBe('');

      scope.text = valueTemplate.replace('$$', LTR_TEXT);
      scope.$digest();
      expect(element.prop('dir')).toBe('ltr');

      scope.text = valueTemplate.replace('$$', WEAK_RTL_TEXT);
      scope.$digest();
      expect(element.prop('dir')).toBe('rtl');

      scope.$destroy();
      dealoc(element);
    }

    it('should do nothing if $bidi is disabled', function() {
      $bidiProvider.enabled(false);

      element = $compile('<div dir="auto">someLtrValue</div>')($rootScope);
      expect(element.attr('dir')).toBe('auto');
    });

    describe('text nodes', function(){

      it('should set the dir property depending on fixed text children', function () {
        testFixedValue('<div dir="auto">$$</div>');
        testFixedValue('<div dir="auto"><span>$$</span></div>');
      });

      it('should update the dir property depending on interpolated text', function () {
        testDynamicValue('<div dir="auto">{{text}}</div>');
        testDynamicValue('<div dir="auto"><span>{{text}}</span></div>');
      });

    });

    describe('ngBind', function() {

      it('should set the dir property for ngBind', function () {
        testDynamicValue('<span dir="auto" ng-bind="text"></span>');
      });

      it('should set the dir property for a child ngBind', function () {
        testDynamicValue('<div dir="auto"><span ng-bind="text"></span></div>');
      });

      it('should update the dir property correctly if there was text inside', function() {
        testDynamicValue('<div dir="auto"><span ng-bind="text">'+LTR_TEXT+'</span></div>');
      });

    });

    describe('ngBindHtml', function() {

      it('should set the dir property for ngBindHtml', function () {
        testDynamicValue('<span dir="auto" ng-bind-html="text"></span>', '<b> $$ </b>');
      });

      it('should set the dir property for child ngBindHtml', function () {
        testDynamicValue('<div dir="auto"><span ng-bind-html="text"></span></div>', '<b> $$ </b>');
      });

      it('should update the dir property correctly if there was text inside', function() {
        testDynamicValue('<div dir="auto"><span ng-bind-html="text">'+LTR_TEXT+'</span></div>', '<b> $$ </b>');
      });

    });

    describe('ngBindTemplate', function() {

      it('should set the dir property for ngBindTemplate', function () {
        testDynamicValue('<span dir="auto" ng-bind-template="{{text}}"></span>');
      });

      it('should set the dir property for a child ngBindTemplate', function () {
        testDynamicValue('<div dir="auto"><span ng-bind-template="{{text}}"></span></div>');
      });

      it('should update the dir property correctly if there was text inside', function() {
        testDynamicValue('<div dir="auto"><span ng-bind-template="{{text}}">'+LTR_TEXT+'</span></div>');
      });

    });

    describe('input', function() {

      it('should set the dir property for input with ngModel', function () {
        testDynamicValue('<input dir="auto" type="text" ng-model="text">');
        testDynamicValue('<div dir="auto"><input type="text" ng-model="text"></div>');
      });

      it('should set the dir property for input with ngModel when the user types', function () {
        element = $compile('<input dir="auto" type="text" ng-model="text">')($rootScope);
        $rootScope.$digest();
        expect(element.prop('dir')).toBe('');

        element.val(LTR_TEXT);
        browserTrigger(element, 'change');
        expect(element.prop('dir')).toBe('ltr');

        element.val(WEAK_RTL_TEXT);
        browserTrigger(element, 'change');
        expect(element.prop('dir')).toBe('rtl');
      });

      it('should set the dir property for a fixed value', function() {
        testFixedValue('<input type="text" dir="auto" value="$$">');
        testFixedValue('<div dir="auto"><input type="text" value="$$"></div>');
      });

      it('should set the dir property for an interpolated value', function() {
        testDynamicValue('<input type="text" dir="auto" value="{{text}}">');
        testDynamicValue('<div dir="auto"><input type="text" value="{{text}}"></div>');
      });
    });

    describe('textarea', function() {

      it('should set the dir property for textarea with ngModel', function () {
        testDynamicValue('<textarea dir="auto" ng-model="text"></textarea>');
        testDynamicValue('<div dir="auto"><textarea ng-model="text"></textarea></div>');
      });

      it('should set the dir property for a fixed value', function() {
        testFixedValue('<textarea dir="auto">$$</textarea>');
        testFixedValue('<div dir="auto"><textarea>$$</textarea></div>');
      });

      it('should set the dir property for an interpolated value', function() {
        testDynamicValue('<textarea dir="auto" value="{{text}}"></textarea>');
        testDynamicValue('<div dir="auto"><textarea value="{{text}}"></textarea></div>');
      });
    });

    describe('child scopes', function() {

      it('should throw if there are child scopes', function() {
        var scope = $rootScope.$new();
        var element = jqLite('<div><div dir="auto"><span ng-if="true"></span></div></div>');
        expect(function() {
          $compile(element)(scope);
          scope.$digest();
        }).toThrow(new Error('dir=auto does not support child scopes'));
        dealoc(element);
        scope.$destroy();
      });

      it('should not throw if dir="auto" is part of an element with template directive', function() {
        element = $compile('<div><div dir="auto" ng-if="true"></div></div>')($rootScope);
        $rootScope.$digest();
      });

    });

  });

  describe('escape values in attribute interpolation',
    function() {

    var elementWithAttr;

    function testTextDirectionCombinations(elementDir, attrName) {
      setEmptyValue();
      expectEmptyValue();

      setLtrValue();
      expectLtrValue(elementDir === 'rtl', attrName);

      setRtlValue();
      expectRtlValue(elementDir === 'ltr', attrName);
    }

    function setEmptyValue() {
      $rootScope.text = '';
      $rootScope.$digest();
    }

    function setLtrValue() {
      $rootScope.text = LTR_TEXT;
      $rootScope.$digest();
    }

    function setRtlValue() {
      $rootScope.text = WEAK_RTL_TEXT;
      $rootScope.$digest();
    }

    function expectEmptyValue() {
      $rootScope.text = '';
    }

    function expectLtrValue(escaped, attrName) {
      attrName = attrName || 'test-attr';
      if (escaped) {
        expect(elementWithAttr.attr(attrName)).toBe($bidi.Format.LRE + LTR_TEXT + $bidi.Format.PDF);
      } else {
        expect(elementWithAttr.attr(attrName)).toBe(LTR_TEXT);
      }
    }

    function expectRtlValue(escaped, attrName) {
      attrName = attrName || 'test-attr';
      if (escaped) {
        expect(elementWithAttr.attr(attrName)).toBe($bidi.Format.RLE + WEAK_RTL_TEXT + $bidi.Format.PDF);
      } else {
        expect(elementWithAttr.attr(attrName)).toBe(WEAK_RTL_TEXT);
      }
    }

    describe('fixed element direction', function() {

      it('should escape rtl text for ltr direction', function() {
        elementWithAttr = element = $compile('<div dir="ltr" test-attr="{{text}}"></div>')($rootScope);
        testTextDirectionCombinations('ltr');
      });

      it('should escape ltr text for rtl direction', function() {
        elementWithAttr = element = $compile('<div dir="rtl" test-attr="{{text}}"></div>')($rootScope);
        testTextDirectionCombinations('rtl');
      });

      it('should escape correctly when the dir attribute is specified in a parent element', function() {
        element = $compile('<div dir="ltr"><span test-attr="{{text}}"></span></div>')($rootScope);
        elementWithAttr = element.find('span');

        testTextDirectionCombinations('ltr');
      });

    });

    describe('interpolated element direction', function() {

      it('should escape rtl text for ltr direction and vice versa but not if the directions are the same', function() {
        elementWithAttr = element = $compile('<div dir="{{dir}}" test-attr="{{text}}"></div>')($rootScope);
        $rootScope.dir = 'ltr';

        testTextDirectionCombinations('ltr');
      });

      it('should update the attribute escaping when the element direction changes', function() {
        $rootScope.dir = 'ltr';
        elementWithAttr = element = $compile('<div dir="{{dir}}" test-attr="{{text}}"></div>')($rootScope);

        setLtrValue();
        expectLtrValue(false);

        $rootScope.dir ='rtl';
        $rootScope.$digest();
        expectLtrValue(true);
      });

      it('should escape correctly when the dir attribute is specified in a parent element', function() {
        element = $compile('<div dir="{{dir}}"><span test-attr="{{text}}"></span></div>')($rootScope);
        elementWithAttr = element.find('span');
        $rootScope.dir = 'ltr';

        testTextDirectionCombinations('ltr');
      });

    });

    describe('dir=auto element direction', function() {

      it('should escape rtl text for ltr direction', function() {
        element = $compile('<div dir="auto">{{dirText}}<span test-attr="{{text}}"></span></div>')($rootScope);
        elementWithAttr = element.find('span');
        $rootScope.dirText = LTR_TEXT;

        testTextDirectionCombinations('ltr');
      });

      it('should escape rtl text for ltr direction', function() {
        element = $compile('<div dir="auto">{{dirText}}<span test-attr="{{text}}"></span></div>')($rootScope);
        elementWithAttr = element.find('span');
        $rootScope.dirText = WEAK_RTL_TEXT;
        $rootScope.$digest();

        testTextDirectionCombinations('rtl');
      });

      it('should update the attribute escaping when the element direction changes', function() {
        element = $compile('<div dir="auto">{{dirText}}<span test-attr="{{text}}"></span></div>')($rootScope);
        elementWithAttr = element.find('span');
        $rootScope.dirText = LTR_TEXT;

        setLtrValue();
        expectLtrValue(false);

        $rootScope.dirText = WEAK_RTL_TEXT;
        $rootScope.$digest();
        expectLtrValue(true);
      });

    });

    describe('interpolated attributes that are never escaped', function() {

      function testNoEscaping(attrName) {
        setLtrValue();
        expectLtrValue(false, attrName);
        setRtlValue();
        expectRtlValue(false, attrName);
      }

      it('should not escape if $bidi is disabled', function() {
        $bidiProvider.enabled(false);

        elementWithAttr = element = $compile('<div dir="ltr" test-attr="{{text}}"></div>')($rootScope);
        testNoEscaping('test-attr');
      });

      it('should not escape if there is no dir attribute', function() {
        elementWithAttr = element = $compile('<div test-attr="{{text}}"></div>')($rootScope);
        testNoEscaping('test-attr');
      });

      it('should not escape the "value" attribute of input elements', function() {
        elementWithAttr = element = $compile('<input dir="ltr" value="{{text}}">')($rootScope);
        testNoEscaping('value');
      });

      it('should not escape the "value" attribute of textarea elements', function() {
        elementWithAttr = element = $compile('<textarea dir="ltr" value="{{text}}"></textarea>')($rootScope);
        testNoEscaping('value');
      });

      it('should escape the "value" attribute of other elements', function() {
        elementWithAttr = element = $compile('<div dir="ltr" value="{{text}}"></div>')($rootScope);
        testTextDirectionCombinations('ltr', 'value');
      });

      it('should not escape the "dir" attribute on elements', function() {
        element = $compile('<div dir="ltr"><span dir="{{text}}"></span></div>')($rootScope);
        elementWithAttr = element.children(0);

        testNoEscaping('dir');
      });

      it('should not escape the "ngBindTemplate" attribute on elements', function() {
        elementWithAttr = element = $compile('<div dir="ltr" ng-bind-template="{{text}}"></div>')($rootScope);
        testNoEscaping('ng-bind-template');
      });
    });

  });

});
