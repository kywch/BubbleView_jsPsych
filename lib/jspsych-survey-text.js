/**
 * jspsych-survey-text
 * a jspsych plugin for free response survey questions
 *
 * Josh de Leeuw
 *
 * documentation: docs.jspsych.org
 *
 */


jsPsych.plugins['survey-text'] = (function () {

    var plugin = {};

    plugin.info = {
        name: 'survey-text',
        description: '',
        parameters: {
            questions: {
                type: jsPsych.plugins.parameterType.COMPLEX,
                array: true,
                pretty_name: 'Questions',
                default: undefined,
                nested: {
                    prompt: {
                        type: jsPsych.plugins.parameterType.STRING,
                        pretty_name: 'Prompt',
                        default: undefined,
                        description: 'Prompt for the subject to response'
                    },
                    value: {
                        type: jsPsych.plugins.parameterType.STRING,
                        pretty_name: 'Value',
                        default: "",
                        description: 'The string will be used to populate the response field with editable answer.'
                    },
                    rows: {
                        type: jsPsych.plugins.parameterType.INT,
                        pretty_name: 'Rows',
                        default: 1,
                        description: 'The number of rows for the response text box.'
                    },
                    columns: {
                        type: jsPsych.plugins.parameterType.INT,
                        pretty_name: 'Columns',
                        default: 40,
                        description: 'The number of columns for the response text box.'
                    },
                    required: {
                        type: jsPsych.plugins.parameterType.BOOL,
                        pretty_name: 'Required',
                        default: false,
                        description: 'Require a response'
                    }
                }
            },
            preamble: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Preamble',
                default: null,
                description: 'HTML formatted string to display at the top of the page above all the questions.'
            },
            button_label: {
                type: jsPsych.plugins.parameterType.STRING,
                pretty_name: 'Button label',
                default: 'Submit',
                description: 'The text that appears on the button to finish the trial.'
            },
            minimum_duration: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Minimum duration',
                default: 0,
                description: 'The minimum duration to engage in the trial.'
            },
            required_character: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Required character',
                default: 0,
                description: 'The minimum number of characters required for each answer.'
            },
            maximum_character: {
                type: jsPsych.plugins.parameterType.INT,
                pretty_name: 'Maximum character',
                default: 100,
                description: 'The maximum number of characters for each answer.'
            }
        }
    }

    plugin.trial = function (display_element, trial) {

        for (var i = 0; i < trial.questions.length; i++) {
            if (typeof trial.questions[i].rows == 'undefined') {
                trial.questions[i].rows = 1;
            }
        }
        for (var i = 0; i < trial.questions.length; i++) {
            if (typeof trial.questions[i].columns == 'undefined') {
                trial.questions[i].columns = 40;
            }
        }
        for (var i = 0; i < trial.questions.length; i++) {
            if (typeof trial.questions[i].value == 'undefined') {
                trial.questions[i].value = "";
            }
        }

        var html = '';
        // show preamble text
        if (trial.preamble !== null) {
            html += '<div id="jspsych-survey-text-preamble" class="jspsych-survey-text-preamble">' + trial.preamble + '</div>';
        }
        // add questions
        for (var i = 0; i < trial.questions.length; i++) {
            html += '<div id="jspsych-survey-text-' + i + '" class="jspsych-survey-text-question" style="margin: 2em 0em;">';
            html += '<p class="jspsych-survey-text">' + trial.questions[i].prompt + '</p>';
            var autofocus = i == 0 ? "autofocus" : "";
            var req = trial.questions[i].required ? "required" : "";
            if (trial.questions[i].rows == 1) {
                html += '<input type="text" id="jspsych-survey-text-response-' + i + '" maxlength="' + trial.maximum_character + 
                    '" size="' + trial.questions[i].columns + '" value="' + trial.questions[i].value + '" ' + autofocus + ' ' + req + '></input>';
            } else {
                html += '<textarea id="jspsych-survey-text-response-' + i + '" maxlength="' + trial.maximum_character + 
                    '" cols="' + trial.questions[i].columns + '" rows="' + trial.questions[i].rows + '" ' + autofocus + ' ' + req + '>' +
                    trial.questions[i].value + '</textarea>';
            }
            html += '<br>Charaters: <span id="jspsych-survey-text-response-length-' + i + '"></span> / ' + trial.maximum_character;
            html += '</div>';
        }

        // add space for the submit button
        html += '<div id="jspsych-survey-text-submit" style="height:100px;"></div>';

        display_element.innerHTML = html;

        function btnListener() {
            // measure response time
            var endTime = performance.now();
            var response_time = endTime - startTime;

            // create object to hold responses
            var question_data = {};
            var matches = display_element.querySelectorAll('div.jspsych-survey-text-question');
            for (var index = 0; index < matches.length; index++) {
                var id = "Q" + index;
                var val = matches[index].querySelector('textarea, input').value;
                // check the minimum length
                var valCharCnt = val.replace(/\s/g, "").length;
                if (valCharCnt < trial.required_character) {
                    alert('You must type in ' + trial.required_character + ' characters without space.');
                    return;
                }
                var obje = {};
                obje[id] = val;
                Object.assign(question_data, obje);
            }
            // save data
            var trialdata = {
                "rt": Math.round(response_time),
                "responses": JSON.stringify(question_data)
            };

            display_element.innerHTML = '';

            // next trial
            jsPsych.finishTrial(trialdata);
        }

        jsPsych.pluginAPI.setTimeout(function () {
            document.querySelector("#jspsych-survey-text-submit").insertAdjacentHTML('afterBegin',
                '<button id="jspsych-survey-text-next" class="jspsych-btn">' + trial.button_label + '</button>');
            display_element.querySelector('#jspsych-survey-text-next').addEventListener('click', btnListener);
        }, trial.minimum_duration);

        function countChar(textForm, putCount) {
            var charCnt = jQuery(textForm).val().length;
            jQuery(putCount).text(charCnt);
        }
        for (var i = 0; i < trial.questions.length; i++) {
            var formName = '#jspsych-survey-text-response-' + new Number(i).toString();
            var textName = '#jspsych-survey-text-response-length-' + new Number(i).toString();
            display_element.querySelector(formName).addEventListener('input', function () {
                countChar(formName, textName);
            });
            countChar(formName, textName);
        }

        var startTime = performance.now();
    };

    return plugin;
})();