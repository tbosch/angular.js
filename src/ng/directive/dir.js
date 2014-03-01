'use strict';

/**
 * @ngdoc directive
 * @name dir
 * @requires $interpolate
 * @requires $bidi
 * @restrict A
 *
 * @description
 * This is a polyfill for `dir="auto"` to provide bidirectional text support in Angular.
 *
 * This directive will calculate the `dir` property of an element based on the text contained in the element
 * as well as based on the content of `input` and `textarea` elements.
 * It is enabled for all elements that have the attribute `dir="auto"` set.
 * The polyfill is needed as not all browsers support the html5 standard, see
 * [W3C dir=auto tests](http://www.w3.org/International/tests/html5/the-dir-attribute/results-dir-auto).
 *
 * Right now, the following directives will be used for the calulcation of the `dir` attribute:
 * Text interpolation (`{{}}`), {@link ngBind ngBind}, {@link ngBindHtml ngBindHtml},
 * {@link ngBindTemplate ngBindTemplate}, {@link ngModel ngModel},
 * `<input value="{{...}}">` and `<textarea value="{{...}}">`.
 *
 * Directives that modify the visible DOM directly (e.g. add text nodes) and want to
 * participate in the calculation of the `dir` attribute can do so via integrating with the
 * {@link dir.DirController DirController}.
 *
 * Attribute interpolation is also integrated with this directive. It uses the unicode
 * characters "Left-To-Right Embedding", "Right-To-Left Embedding" and "Pop Directional Formatting"
 * to mark the directionality for attribute values if they are in contrast to the directionality defined
 * via the `dir` attribute
 * (see  [Unicode controls vs. markup for bidi support](http://www.w3.org/International/questions/qa-bidi-controls)
 * on a discussion about when to use the `dir` attribute vs unicode controls).
 *
 * Finally, this directive provides the special value `dir="locale"` to apply the
 * directionality of the current locale.
 *
 * Restrictions of the polyfill:
 *
 * * If `dir=""` this will not check parent elements for a `dir` attribute
 * * Inside of a `dir="auto"` element there can be no directives that do transcludes (e.g. `ng-repeat`)
 *   or compile and link children manually (e.g. `ng-view`). This is because those directives could add
 *   new static text that the `dir` directive would not know about.
 */
var dirDirective = ['$interpolate', '$bidi',
  function($interpolate, $bidi) {

  if (!$bidi.isEnabled()) {
    return {};
  }

  var nonEscapeableAttributes = {
    '*:dir': true,
    '*:ngBindTemplate':true,
    'INPUT:value': true,
    'TEXTAREA:value': true
  };

  return {
    restrict: 'A',
    controller: ['$scope', '$element', '$attrs', DirController]
  };

  /**
   * @ngdoc type
   * @name dir.DirController
   *
   * @property {boolean} isAuto Whether `dir="auto"` was specified on this node
   *
   * @description
   * `DirController` provides the API for the `dir` directive. The controller contains
   * methods for controlling the direction of bidirectional text.
   */
  function DirController($scope, $element, attrs) {
    var self = this;
    var directionStatusAuto;

    this.isAuto = false;

    /**
     * @ngdoc method
     * @name dir.DirController#createTextChanger
     * @function
     * @description
     * Creates a function that tells the DirController that some child text
     * changed and that it should update the dir property if needed.
     *
     * @param {string} initial text value in the DOM
     * @param {boolean=} isHtml whether the value is html or normal text
     * @return function(value)
     */
    this.createTextChanger = function(initialValue, isHtml) {
      if (!this.isAuto) {
        return;
      }
      var oldValue = initialValue;
      return function(newValue) {
        if (oldValue === newValue) {
          return;
        }
        var oldDir = directionStatusAuto.get();
        directionStatusAuto.remove(oldValue, isHtml).add(newValue, isHtml);
        var newDir = directionStatusAuto.get();
        if (oldDir !== newDir) {
          setDirOnElement(newDir);
        }
        oldValue = newValue;
      }
    };

    /**
     * @ngdoc method
     * @name dir.DirController#escapeAttributeValue
     * @function
     * @description
     * Prepares a string to be set as an attribute value on an html element.
     *
     * Note that his will not modify the actual attribute on the element but
     * only the string itself using special
     * unicode characters for bidirectional text.
     *
     * @param {DOMElement} element the element to modify
     * @param {string} attrName the name of the attribute
     * @param {string} value the value to be set into the attribute
     * @return {string} the modified string
     */
    this.escapeAttributeValue = function escapeAttributeValue(element, attrName, value) {
      if (nonEscapeableAttributes['*:'+attrName] || nonEscapeableAttributes[element[0].nodeName+':'+attrName]) {
        return value;
      }

      var dir = $bidi.estimateDirection(value);
      if ((dir === $bidi.Dir.LTR && this.dir === 'rtl')
           || (dir === $bidi.Dir.RTL && this.dir === 'ltr')) {
        return $bidi.applyDirToText(dir, value);
      }
      return value;
    };

    init();

    function init() {
      if (attrs.dir === 'auto') {
        self.isAuto = true;
        directionStatusAuto = $bidi.estimateDirectionIncremental();
        // Need to initialize the status with the fixed text
        // as Angular does not create directives for fixed text.
        directionStatusAuto.add($element.text(), false);
        setDirOnElement(directionStatusAuto.get());

        $scope.$new = throwOnChildScope;
      } else if (attrs.dir === 'locale') {
        setDirOnElement($bidi.localeDir());
      } else {
        attrs.$observe('dir', function(newValue) {
          self.dir = newValue;
        });
      }
    }

    function setDirOnElement(dir) {
      var htmlDir = '';
      if (dir === $bidi.Dir.LTR) {
        htmlDir = 'ltr';
      } else if (dir === $bidi.Dir.RTL) {
        htmlDir = 'rtl';
      }
      $element.prop('dir', htmlDir);
      self.dir = htmlDir;
    }
  }

  function throwOnChildScope() {
    // TODO: Create an ng min error here!
    // Reason: when ng-repeat adds plain text nodes,
    // a parent dir=auto directive has no chance of being notified!
    // (only for destruction there is the $destroy event on the scope)
    throw new Error('dir=auto does not support child scopes');
  }

}];
