# laicos-datacollector
Data collection controls and functions

This repo provides controls and functions for Laicos data collection tools built with Angular.


<h1>Controls Usage</h1>

1. Add the following import: 

  &lt;link rel="import" href="/components/laicos-datacollector/controls/import.html" /&gt;
   
2. Use datacollector control directive:  

  &lt;datacollector-control question="question" mode="editMode" disabe="readOnly"&gt;&lt;/datacollector-control&gt;

3. The End!


<h1>Filter Usage</h1>

1. Include filter script: 

   &lt;script src="/components/laicos-datacollector/laicos-datacollector-forms.js"&gt;&lt;/script&gt;

2. Inject provider into module for use:

   angular.module('view-form', ['laicos.datacollector.forms']);

3. Inject factory handle into controller:

   myapp.controller('FormController', function (forms) {
            // do stuff

   });


2. Create a scoped dependency list:

	$scope.dependencyList = forms.data.flattenQuestions($scope.userForm,
                                    function (question) {
                                        return question.hasDependents;
                                    });
									
3. Use filter: &lt;div ng-repeat="card in cardList = (userForm.form.cards | cardDependencyFilter:dependencyList)"&gt;&lt;/div&gt;

