'use strict';

describe('event directives', function() {
  var element;


  afterEach(function() {
    dealoc(element);
  });

  describe('general event handling', function() {

    function defineBasicTests() {
      it('should listen to the right elements', inject(function($rootScope, $compileInDoc) {
        element = $compileInDoc('<div ng-click="parent = true"><span ng-click="child = true"><a ng-click="childChild = true"></a></span></div>')($rootScope);
        $rootScope.$digest();
        browserTrigger(element.children(), 'click');
        expect($rootScope.parent).toEqual(true);
        expect($rootScope.child).toEqual(true);
        expect($rootScope.childChild).not.toBeDefined();
      }));

      it('should work for all supported markup variants', inject(function($rootScope, $compileInDoc) {
        test('ng-click');
        test('ng:click');
        test('data-ng-click');
        test('x-ng-click');

        function test(attrName) {
          element = $compileInDoc('<div '+attrName+'="clicked = true"></div>')($rootScope);
          $rootScope.$digest();
          $rootScope.clicked = false;
          browserTrigger(element, 'click');
          expect($rootScope.clicked).toBe(true);
        }
      }));

      it('should support stop propagation', inject(function($compileInDoc, $rootScope) {
        element = $compileInDoc('<div ng-click="clicked = true"><span ng-click="$event.stopPropagation()"></span></div>')($rootScope);
        browserTrigger(element.children(), 'click');
        expect($rootScope.clicked).not.toBeDefined();
      }));

    }

    describe('no event delegation', function() {
      var _ngEventSupportsDelegation;
      beforeEach(function() {
        _ngEventSupportsDelegation = window.ngEventSupportsDelegation;
        window.ngEventSupportsDelegation = function() {
          return false;
        }
      });
      afterEach(function() {
        window.ngEventSupportsDelegation = _ngEventSupportsDelegation;
      });

      defineBasicTests();

    });

    describe('event delegation', function() {
      defineBasicTests();

      describe('use correct scope', function() {
        var directiveScope;
        function setup(html, scope, template) {
          module(function($compileProvider) {
            $compileProvider.directive('test', function() {
              return {
                scope: scope,
                template: template,
                link: function(scope) {
                  directiveScope = scope;
                }
              };
            });
          });
          inject(function($rootScope, $compileInDoc) {
            element = $compileInDoc(html)($rootScope);
            $rootScope.$digest();
          });
        }

        it('should use the right scope with scope directives', function() {
          setup('<div test></div>', true, '<div ng-click="clicked = true"></div>');
          browserTrigger(element.children(), 'click');
          expect(directiveScope.clicked).toBe(true);
          expect(directiveScope.$parent.clicked).not.toBeDefined();
        });

        it('should use the right scope with isolate scope directives', function() {
          setup('<div test></div>', {}, '<div ng-click="clicked = true"></div>');
          browserTrigger(element.children(), 'click');
          expect(directiveScope.clicked).toBe(true);
          expect(directiveScope.$parent.clicked).not.toBeDefined();
        });

        it('should use the right scope with isolate scope directives without a template', function() {
          setup('<div test><div ng-click="clicked=true"></div></div>', {}, null);
          browserTrigger(element.children(), 'click');
          expect(directiveScope.clicked).not.toBeDefined();
          expect(directiveScope.$root.clicked).toBe(true);
        });

      });
    });

  });

  describe('ngSubmit', function() {

    it('should get called on form submit', inject(function($rootScope, $compileInDoc) {
      element = $compileInDoc('<form action="" ng-submit="submitted = true">' +
        '<input type="submit"/>' +
        '</form>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.submitted).not.toBeDefined();

      browserTrigger(element.children()[0]);
      expect($rootScope.submitted).toEqual(true);
    }));

    it('should expose event on form submit', inject(function($rootScope, $compileInDoc) {
      $rootScope.formSubmission = function(e) {
        if (e) {
          $rootScope.formSubmitted = 'foo';
        }
      };

      element = $compileInDoc('<form action="" ng-submit="formSubmission($event)">' +
        '<input type="submit"/>' +
        '</form>')($rootScope);
      $rootScope.$digest();
      expect($rootScope.formSubmitted).not.toBeDefined();

      browserTrigger(element.children()[0]);
      expect($rootScope.formSubmitted).toEqual('foo');
    }));
  });
});
