(function () {
    angular.module('laicos.datacollector.forms', [])
        .factory('forms', function () {

            // comparer namespace for supported operators
            var _comparer = {

                eq: function (value, dependencyVal) {
                    return value == dependencyVal;
                },

                option_eq: function (option, dependencyOption) {
                    return option && dependencyOption && option.value == dependencyOption.value;
                },

                option_neq: function (option, dependencyOption) {

                    return option && dependencyOption && option.value != dependencyOption.value;
                },

                neq: function (value, dependencyVal) {
                    return value != dependencyVal;
                },

                gt: function (value, dependencyVal) {
                    return value > dependencyVal;
                },

                gte: function (value, dependencyVal) {
                    return value >= dependencyVal;
                },

                lt: function (value, dependencyVal) {
                    return value < dependencyVal;
                },

                lte: function (value, dependencyVal) {
                    return value <= dependencyVal;
                },

                range: function (value, dependencyValue) {

                    var min = dependencyValue.length > 0 ? dependencyValue[0] : null;
                    var max = dependencyValue.length > 1 ? dependencyValue[1] : null;

                    if (min != undefined && min != null && max != undefined && max != nul) {
                        // full range present
                        return value >= dependencyValMin && value <= dependencyValMax;

                    } else if (min != undefined && min != null) {
                        // only min 
                        return value >= min;

                    } else if (max != undefined && max != null) {
                        // only max
                        return value <= max;

                    } else {
                        // no range
                        return true;
                    }
                }

            };

            // form validators
            var _validator = {

                required: function (value) {
                    return value != undefined && value != null && value != '';
                },

                eq: function (value, compareValue) {

                    try {
                        return value == compareValue;
                    } catch (e) {
                    }

                    return false;
                },

                lt: function (value, compareValue) {

                    try {
                        return parseFloat(value) < parseFloat(compareValue);
                    } catch (e) {

                    }

                    return false;
                },

                lte: function (value, compareValue) {
                    try {
                        return parseFloat(value) <= parseFloat(compareValue);
                    } catch (e) {

                    }

                    return false;
                },

                gt: function (value, compareValue) {
                    try {
                        return parseFloat(value) > parseFloat(compareValue);
                    } catch (e) {

                    }

                    return false;
                },

                gte: function (value, compareValue) {
                    try {
                        return parseFloat(value) >= parseFloat(compareValue);
                    } catch (e) {

                    }

                    return false;
                }

            };

            // form evaluators
            var _evaluator = {

                compareDependency: function (question, dependency) {

                    try {

                        if (question && dependency.value != null) {

                            // get comparer
                            var comparer = _comparer[dependency.operator];

                            if (comparer) {
                                // execute comparer
                                return comparer(question.answer, dependency.value);

                            } // if-else

                        } // if
                    } catch (e) {
                        console.error(e);
                    }// try-catch

                    // pass if question not provided
                    return true;

                },

                evalDependency: function (object, answers) {

                    try {

                        if (object && object.dependencies && object.dependencies.length > 0
                                && answers) {

                            var pass = true;
                            var curDependency = null;
                            var curAnswer = null;

                            // evaluate dependency
                            for (var i = object.dependencies.length; i--;) {

                                curDependency = object.dependencies[i];

                                if (curDependency != undefined) {
                                    if (curDependency.or) {

                                        // check for $or criteria
                                        // example:
                                        // curDependency = {
                                        //    or: [
                                        //        { questionId: 123, operator: 'eq', value: 0 },
                                        //        { questionId: 321, operator: 'gt', value: 1 }
                                        //    ],
                                        //    operator: '', // ignored
                                        //    value: '' // ignored
                                        // }

                                        pass = false;

                                        for (var j = curDependency.or.length; j--;) {

                                            // find dependent answer
                                            curAnswer = answers[curDependency.or[j].questionId];

                                            pass = pass || _evaluator.compareDependency(curAnswer, curDependency.or[j]);

                                        }// for

                                    } else if (curDependency.sum) {

                                        // check for $sum
                                        // example:
                                        // curDependency = {
                                        //    $sum: [
                                        //            { questionId: 123, operator: '+' }
                                        //            { questionId: 321, operator: '+' }
                                        //    ],
                                        //    operator: 'gt',
                                        //    value: 3
                                        //  }

                                        var exp = {
                                            value: curDependency.sum
                                        };

                                        curAnswer = { answer: _data.evaluateValidationExpression(exp, null, answers) };

                                        pass = _evaluator.compareDependency(curAnswer, curDependency);


                                    } else if (curDependency.questionId) {

                                        // find dependent answer
                                        curAnswer = answers[curDependency.questionId];

                                        pass = _evaluator.compareDependency(curAnswer, curDependency);

                                    }// if-else
                                }// if 

                                // exit if at least one dependency fails
                                if (!pass) {
                                    break;
                                }// if

                            }// for

                            return pass;

                        } // if

                    } catch (e) {

                        console.error(e);

                    }// try-catch

                    // return true for error or invalid dependency
                    return true;
                },

                evalValidators: function (value, validators, cHashTable, qHashTable) {

                    if (validators) {


                        var curValidator = null;
                        var validator = null;
                        var compareObj = null;
                        var compareValue = null;


                        var initValue = _data.getValue(value);
                        var curValue = null;

                        for (var i = validators.length; i--;) {
                            curValidator = validators[i];

                            // get validator
                            validator = _validator[curValidator.operator];

                            if (validator) {

                                // get validator comparison value
                                compareObj = _data.evaluateValidationComparison(curValidator.comparison, cHashTable, qHashTable);
                                compareValue = _data.getValue(compareObj);

                                // apply aggregate if set
                                if (curValidator.aggregate) {
                                    compareValue = _data.evalAggregate(curValidator.aggregate, compareValue);
                                    curValue = _data.evalAggregate(curValidator.aggregate, initValue);
                                } else {
                                    curValue = initValue;
                                }// if

                                // execute validator
                                valid = validator(curValue, compareValue);
                            }// if

                            // return if at least one validation fails
                            if (!valid) {
                                return { valid: false, message: curValidator.invalidMessage };
                            }// if

                        }// for
                    }// if

                    return { valid: true, message: null };
                },

                validateQuestion: function (question, cHashTable, qHashTable) {

                    try {

                        if (question && question.validators && question.validators.length > 0) {

                            // validate question
                            return _evaluator.evalValidators(question.answer, question.validators, cHashTable, qHashTable);

                        }// if

                    } catch (e) {
                        console.error(e);
                    }// try-catch

                    // no validators - return true
                    return { valid: true, message: null };
                },

                validateCard: function (card, cardsList) {

                    try {

                        if (card && card.questions && card.questions.length > 0) {

                            var results = null;
                            var cHashTable = _data.flattenCards(cardsList);
                            var qHashTable = _data.flattenQuestions(cardsList);

                            // iterate through questions and validate
                            for (var i = 0; i < card.questions.length; i++) {

                                // check question validation
                                results = _evaluator.validateQuestion(card.questions[i], cHashTable, qHashTable);

                                // return false if any is invalid
                                if (!results.valid) {
                                    return results;
                                }// if
                            }// for

                            // validate at whole card level
                            if (card.validators && card.validators.length > 0) {
                                return _evaluator.evalValidators(card, card.validators, cHashTable, qHashTable);
                            }// if


                        } // if

                    } catch (e) {
                        console.error(e);
                    }// try-catch

                    return { valid: true, message: null };

                }
            };

            // form object data manipulations
            var _data = {

                getId: function (object) {

                    if (object) {

                        return object.id || object._id;
                    }// if

                    return null;
                },

                typeOf: function (object) {

                    if (object) {
                        // is card?
                        if (object.questions) {
                            return 'card';
                        }// 

                        // is question?
                        if (object.answer) {

                            if (object.answer.value) {
                                return 'question_options'
                            }// if

                            return 'question';
                        }// if

                        if (object.value) {
                            return 'key_value';
                        }// if

                    }// if

                    // return actual
                    return 'literal';
                },

                getValue: function (object) {

                    if (object) {
                        var compareType = _data.typeOf(object);

                        // parse value
                        switch (compareType) {

                            case 'card':
                                return _.pluck(object.questions, 'answer');

                            case 'question_options':
                                return object.answer.value;

                            case 'question':
                                return object.answer;

                            case 'key_value':
                                return object.value;

                        };// switch
                    }// if

                    return object;

                },

                evalAggregate: function (aggregate, object) {

                    try {
                        switch (aggregate) {

                            case 'sum':

                                if (Array.isArray(object)) {

                                    var sum = 0;
                                    var cur = 0;

                                    for (var i = object.length; i--;) {
                                        cur = parseFloat(_data.getValue(object[i]));

                                        if (!isNaN(cur)) {
                                            sum += cur;
                                        }// if
                                    }// for

                                    return sum;
                                } // if

                                break;

                            case 'count_true':
                                if (Array.isArray(object)) {

                                    var count = 0;
                                    var cur = 0;

                                    for (var i = object.length; i--;) {
                                        if (_data.getValue(object[i]) == true) {
                                            count++;
                                        }// if

                                    }// for

                                    return count;
                                } else {

                                    if (_data.getValue(object) == true) {
                                        return 1;
                                    }// if

                                }// if-else
                                break;

                            case 'count_false':
                                if (Array.isArray(object)) {

                                    var count = 0;
                                    var cur = 0;

                                    for (var i = object.length; i--;) {
                                        if (_data.getValue(object[i]) == true) {
                                            count++;
                                        }// if

                                    }// for

                                    return count;
                                } else {

                                    if (_data.getValue(object) == true) {
                                        return 1;
                                    }// if

                                }// if-else
                                break;

                            case 'concat':

                                if (Array.isArray(object)) {

                                    var str = '';

                                    for (var j = 0; j < object.length; j++) {
                                        str += _data.getValue(object[j]);
                                    }// for

                                    return str;
                                }// if

                                break;

                            case 'bool_or':

                                if (Array.isArray(object)) {

                                    var result = false;
                                    var cur = null;

                                    for (var k = object.length; k--;) {
                                        cur = _data.getValue(object[k]);
                                        result = result || (cur === undefined ? false : cur);
                                    }// for

                                    return result;
                                }// if

                                break;

                            case 'bool_and':

                                if (Array.isArray(object)) {

                                    var result = true;
                                    var cur = null;

                                    for (var k = object.length; k--;) {
                                        cur = _data.getValue(object[k]);
                                        result = result && (cur === undefined ? false : cur);
                                    }// for

                                    return result;
                                }// if
                                break;


                        }; // switch
                    } catch (e) {


                    }// try-catch

                    return object;

                },

                pluckQuestions: function (cards) {

                    return _.flatten(_.pluck(cards, 'questions'));
                },

                flattenUserFormSections: function (userForm) {
                    userForm = angular.copy(userForm)
                    userForm.form.cards = []
                    angular.forEach(userForm.form.sections, function (section) {
                        userForm.form.cards = userForm.form.cards.concat(section.cards)
                    })
                    delete userForm.form.sections
                    return _data.flattenUserFormQuestions(userForm)
                },

                // flatten all questions into an hash table lookup object
                flattenUserFormQuestions: function (userForm, filter) {

                    try {


                        if (userForm && userForm.form && userForm.form.cards && userForm.form.cards.length > 0) {

                            return _data.flattenQuestions(userForm.form.cards, filter);

                        }// if

                        return {};

                    } catch (e) {

                        console.error(e);
                        return null;
                    }// try-catch

                },

                // flatten all cards into a hash table lookup
                flattenCards: function (cards) {

                    var hashtable = {};
                    var cur = null;

                    for (var i = cards.length; i--;) {
                        cur = cards[i];

                        hashtable[cur.id] = cur;
                    }// for

                    return hashtable;
                },

                flattenQuestions: function (cards, filter) {

                    var hashtable = {};
                    var curQ = null;

                    // iterate through cards
                    var questions = _data.pluckQuestions(cards);

                    // iterate through questions
                    for (var j = questions.length; j--;) {
                        curQ = questions[j];

                        if (!filter || filter(curQ)) {
                            hashtable[_data.getId(curQ)] = curQ;
                        }// if
                    }// for


                    return hashtable;

                },

                filterOutline: function (outline, progressCards) {

                    var filtered = [];

                    var sections = outline.sections;

                    if (sections && progressCards) {

                        // get unique list of valid sections
                        var validSections = _.uniq(_.map(progressCards, function (card) {
                            return card.section.id;
                        }));

                        var curSection = null;
                        var curCard = null;
                        var idx = -1;

                        for (var i = sections.length; i--;) {

                            // process if valid section
                            if (_.indexOf(validSections, sections[i].id) > -1) {

                                // add to filter
                                curSection = angular.copy(sections[i]);
                                curSection.cards = [];

                                for (var j = sections[i].cards.length; j--;) {

                                    idx = -1;
                                    // find matching card in progress
                                    curCard = _.find(progressCards, function (card) {
                                        idx++;
                                        return card.id == sections[i].cards[j].id;
                                    });

                                    if (curCard) {
                                        // add card if valid
                                        curCard.index = idx;
                                        curSection.cards.unshift(curCard);
                                    }

                                }
                                // add section to filter
                                filtered.unshift(curSection);

                            }// if

                        }// for
                    }// if

                    return filtered;
                },

                evaluateValidationExpression: function (expression, cHashTable, qHashTable) {


                    var resultsVal = 0;

                    if (expression && expression.value && Array.isArray(expression.value) && expression.value.length > 0) {

                        try {

                            var curExp = null;
                            var curObj = null;
                            var curValue = null;
                            var tempVal = null;

                            for (var i = 0, len = expression.value.length; i < len; i++) {

                                curExp = expression.value[i];
                                curObj = _data.evaluateValidationComparison(curExp, cHashTable, qHashTable);
                                curVal = _data.evalAggregate('sum', _data.getValue(curObj));

                                switch (curExp.operator) {

                                    case '-':
                                        // add
                                        tempVal = parseFloat(curVal);

                                        if (!isNaN(tempVal)) {
                                            resultsVal -= tempVal;
                                        }// if
                                        break;

                                    case '/':
                                        // add
                                        tempVal = parseFloat(curVal);

                                        if (!isNaN(tempVal)) {
                                            resultsVal /= tempVal;
                                        }// if
                                        break;

                                    case '*':
                                        // add
                                        tempVal = parseFloat(curVal);

                                        if (!isNaN(tempVal)) {
                                            resultsVal *= tempVal;
                                        }// if
                                        break;

                                    case '+':

                                        // add
                                        tempVal = parseFloat(curVal);

                                        if (!isNaN(tempVal)) {
                                            resultsVal += tempVal;
                                        }// if

                                        break;

                                };// switch

                            }// for

                        } catch (e) { }// try-catch

                    }// if

                    return resultsVal;
                },

                // evaluates comparison validator and returns the object to validate with
                evaluateValidationComparison: function (comparison, cHashTable, qHashTable) {

                    if (comparison) {

                        switch (comparison.type) {
                            case 'card':
                                // find card 
                                return cHashTable[comparison.value];

                            case 'question':
                                // find question and return value
                                var question = qHashTable[comparison.value];

                                if (question) {
                                    return question.answer;

                                }// if

                                return null;
                            case 'expression':

                                return _data.evaluateValidationExpression(comparison, cHashTable, qHashTable);

                            default:
                                // static value comparison
                                return comparison.value;
                        };


                    }// if

                    return null;
                }
            };


            return {

                evaluator: {
                    evalDependency: _evaluator.evalDependency,
                    validateCard: _evaluator.validateCard,
                    validateQuestion: _evaluator.validateQuestion
                },

                data: _data

            };

        })

         .filter('sectionDependencyFilter', [
          "$filter",
          function ($filter) {
              return function (sections, dependencyList) {
                  return _.filter(sections, function (section) {
                      section = angular.copy(section)
                      section.cards = $filter("cardDependencyFilter")(section.cards, dependencyList)
                      return section.cards.length
                  })
              }
          }
         ])

        .filter('cardDependencyFilter', ["forms", function (forms) {

            return function (cards, answers) {

                try {
                    var card = null;
                    var filtered = [];
                    var passed = true;

                    if (cards) {
                        for (var i = cards.length; i--;) {

                            card = cards[i];
                            passed = true;

                            if (card) {

                                // evaluate if card has dependencies
                                if (card.dependencies && card.dependencies.length > 0) {
                                    // eval card
                                    passed = forms.evaluator.evalDependency(card, answers);
                                }// if


                                // evaluate if card eval passed and section has dependencies
                                if (passed && card.section && card.section.dependencies && card.section.dependencies.length > 0) {

                                    // eval section
                                    passed = forms.evaluator.evalDependency(card.section, answers);

                                }// if

                            }// if

                            if (passed) {
                                filtered.unshift(cards[i]);
                            } // if

                        }// for
                    }// if

                    return filtered;


                } catch (e) {

                    console.error(e);

                    return cards;
                }// try-catch
            };
        }])

        .filter('questionDependencyFilter', ["forms", function (forms) {

            return function (questions, answers) {

                var filtered = [];
                var pass = true;

                try {
                    if (questions) {

                        var question = null;
                        for (var i = questions.length; i--;) {

                            question = questions[i];

                            if (question) {

                                if (question.dependencies && question.dependencies.length > 0) {

                                    // evaluate dependency
                                    if (forms.evaluator.evalDependency(question, answers)) {
                                        filtered.unshift(question);
                                    }// if

                                } else {
                                    // no depdencies to evaluate
                                    filtered.unshift(question);
                                }// if-else

                            }// if
                        }// for

                    }

                } catch (e) {
                    return questions;
                }// try-catch

                return filtered;

            };

        }]);

})();