/**
 * bubble_view.js
 * Kyoung whan Choe (https://github.com/kywch/)
 *
 * jspsych plugin for showing images with bubble view
 * 
 * For the bubble view paper, see http://bubbleview.namwkim.org/
 * For the original bubble view code, see https://github.com/namwkim/bubbleview 
 * 
 **/

/*
 * Generic task variables
 */
var sbjId = ""; // mturk id
var task_id = ""; // the prefix for the save file -- the main seq
var data_dir = "";
var flag_debug = false;
if (flag_debug) {
    var trial_dur = 1000;
} else {
    var trial_dur = 4000;
}

var viewrt_history = [];
var descrt_history = [];
var desc_content = [];
var maximum_click = 10;

// these urls must be checked
var instr_url = 'https://users.rcc.uchicago.edu/~kywch/Bubble_201904/imgs_guide/';
var save_url = 'https://users.rcc.uchicago.edu/~kywch/Bubble_201904/save_data.php';

/*
 * Helper functions
 */
function shuffle(array) {
    let counter = array.length;
    // While there are elements in the array
    while (counter > 0) {
        // Pick a random index
        let index = Math.floor(Math.random() * counter);
        // Decrease counter by 1
        counter--;
        // And swap the last element with it
        let temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function save_data() { // CHECK THE URL before use
    if (flag_debug) {
        console.log("Save data function called.");
        console.log(jsPsych.data.get().json());
    }

    jQuery.ajax({
        type: 'post',
        cache: false,
        url: save_url, // this is the path to the above PHP script
        data: {
            data_dir: data_dir,
            sbj_id: sbjId,
            sess_data: jsPsych.data.get().json()
        }
    });

}


/*
 * Bubble view instruction page
 */
var bubble_instructions_page = {
    type: 'instructions',
    pages: [
        '<img class="resize" src="' + instr_url + 'Slide1.PNG">',
        '<img class="resize" src="' + instr_url + 'Slide2.PNG">',
        '<img class="resize" src="' + instr_url + 'Slide3.PNG">',
        '<img class="resize" src="' + instr_url + 'Slide4.PNG">',
        '<img class="resize" src="' + instr_url + 'Slide5.PNG">',
        '<div class = centerbox><p class = block-text>Please familiarize yourself with our task with the next 6 practice trials.</p>',
        '<div class = centerbox><p class = block-text>You can read the instruction again by clicking the <strong>Previous</strong> button.</p>' +
        '<p class = block-text>Clicking the <strong>Next</strong> button will finish the instruction.</p></div>'
    ],
    data: {
        exp_stage: 'bubble_instructions_page',
        sbj_id: sbjId
    },
    allow_keys: false,
    show_clickable_nav: true,
    show_page_number: true
};


/*
 * Practice block
 */
function generate_practice_block(prac_img_src, prac_seq, img_ext, img_attn = []) {

    var block_sequence = [];
    var num_trial = prac_seq.length;

    var practice_instructions_page = {
        type: 'instructions',
        pages: [
            '<div class = centerbox><p class = block-text>Click next to begin the practice trials</p></div>'
        ],
        allow_keys: false,
        show_clickable_nav: true,
        allow_backward: false,
        show_page_number: false,
        data: {
            exp_stage: 'practice_instructions',
            sbj_id: sbjId
        }
    };
    block_sequence.push(practice_instructions_page);

    for (var ii = 0; ii < num_trial; ii++) {
        var start_trial = {
            type: 'instructions',
            pages: [
                '<p class = block-text>' +
                'Click next to begin the practice trial ' + (ii + 1).toString() + '/' + num_trial.toString() + '</p></div>'
            ],
            allow_keys: false,
            show_clickable_nav: true,
            allow_backward: false,
            show_page_number: false,
            data: {
                exp_stage: 'practice_trial_start_' + (ii + 1).toString(),
            }
        };
        block_sequence.push(start_trial);

        /*
        var gist_phase = {
            type: 'single-image',
            stimulus: prac_img_src + prac_seq[ii] + '_smt.' + img_ext, // blurry image
            image_size: [800, 450],
            stimulus_duration: 2000,
            data: {
                exp_stage: 'practice_trial_gist_' + (ii + 1).toString()
            }
        };
        block_sequence.push(gist_phase);

        var rating_gist_phase = {
            type: 'html-button-response',
            stimulus: '<p class = block-text>' +
                'Please rate how violent the picture was (1:none - 7:extremely).</p>',
            choices: ['1', '2', '3', '4', '5', '6', '7'],
            data: {
                exp_stage: 'practice_trial_rate_gist' + (ii + 1).toString()
            }
        };
        block_sequence.push(rating_gist_phase);
        */

        var bubble_phase = {
            type: 'bubble-view',
            org_image: prac_img_src + prac_seq[ii] + '.' + img_ext,
            blur_image: prac_img_src + prac_seq[ii] + '_smt.' + img_ext,
            prompt: '<p class = block-text>Please inspect the image using up to <b>' + maximum_click + '</font></b> bubbles.</p>',
            trial_type: 'fixed_click_maximum', // or 'fixed_viewing_duration'
            maximum_click: maximum_click,
            bubble_size: 70,
            image_size: [800, 450],
            data: {
                exp_stage: 'practice_trial_bubble_' + (ii + 1).toString()
            }
        };
        block_sequence.push(bubble_phase);

        var rating_bubble_phase = {
            type: 'html-button-response',
            stimulus: '<p class = block-text>' +
                'Please rate how violent the picture was (1:none - 7:extremely).</p>',
            choices: ['1', '2', '3', '4', '5', '6', '7'],
            data: {
                exp_stage: 'practice_trial_rate_bubble' + (ii + 1).toString(),
                image: prac_seq[ii]
            }
        };
        block_sequence.push(rating_bubble_phase);

        // ATTN CHECK: we are only asking people to provide description of a scene, when its name is in img_attn
        if (img_attn.indexOf(prac_seq[ii]) > -1) {
            var describe_phase = {
                type: 'survey-text',
                questions: [{
                    prompt: '<p class = block-text>Please describe the interaction that you saw<br>(minimum 30 characters).</p>',
                    rows: 4,
                    columns: 50
                }],
                minimum_duration: trial_dur,
                required_character: 23,
                data: {
                    exp_stage: 'practice_trial_describe_' + (ii + 1).toString(),
                    image: prac_seq[ii]
                }
            };
            block_sequence.push(describe_phase);
        }

    }

    return block_sequence;

}


/*
 * Main block
 * Implelment the 3-strikes-out policy
 */
function generate_main_block(main_img_src, main_seq, img_ext, img_attn = []) {

    var block_sequence = [];
    var num_trial = main_seq.length;

    var main_instructions_page = {
        type: 'instructions',
        pages: [
            '<div class = centerbox><p class = block-text>You finshed the practice and are about to begin the main task.</p>' +
            '<p class = block-text>Please take the study seriously.</p>' +
            '<p class = block-text>Again, we very much appreciate your participation!</p></div>',
            '<div class = centerbox><p class = block-text>Click next to continue</p>'
        ],
        allow_keys: false,
        show_clickable_nav: true,
        allow_backward: false,
        show_page_number: false,
        data: {
            exp_stage: 'main_instructions',
            sbj_id: sbjId
        },
        on_finish: function (data) {
            save_data();
        }
    };
    block_sequence.push(main_instructions_page);

    for (var ii = 0; ii < num_trial; ii++) {
        var start_trial = {
            type: 'instructions',
            pages: [
                '<p class = block-text>' +
                'Click next to begin the trial ' + (ii + 1).toString() + '/' + num_trial.toString() + '</p></div>'
            ],
            allow_keys: false,
            show_clickable_nav: true,
            allow_backward: false,
            show_page_number: false,
            data: {
                exp_stage: 'main_trial_start_' + (ii + 1).toString(),
            }
        };
        block_sequence.push(start_trial);


        /*
        var gist_phase = {
            type: 'single-image',
            stimulus: main_img_src + main_seq[ii] + '_smt.' + img_ext, // blurry image
            image_size: [800, 450],
            stimulus_duration: 2000,
            data: {
                exp_stage: 'main_trial_gist_' + (ii + 1).toString()
            }
        };
        block_sequence.push(gist_phase);

        var rating_gist_phase = {
            type: 'html-button-response',
            stimulus: '<p class = block-text>' +
                'Please rate how violent the picture was (1:none - 7:extremely).</p>',
            choices: ['1', '2', '3', '4', '5', '6', '7'],
            data: {
                exp_stage: 'main_trial_rate_gist' + (ii + 1).toString()
            }
        };
        block_sequence.push(rating_gist_phase);
        */

        var bubble_phase = {
            type: 'bubble-view',
            org_image: main_img_src + main_seq[ii] + '.' + img_ext,
            blur_image: main_img_src + main_seq[ii] + '_smt.' + img_ext,
            prompt: '<p class = block-text>Please inspect the image using up to <b>' + maximum_click + '</font></b> bubbles.</p>',
            trial_type: 'fixed_click_maximum', // or 'fixed_viewing_duration'
            maximum_click: maximum_click,
            bubble_size: 70,
            image_size: [800, 450],
            data: {
                exp_stage: 'main_trial_bubble_' + (ii + 1).toString()
            },
            on_finish: function (data) {
                viewrt_history.push(data.viewing_duration);
            }
        };
        block_sequence.push(bubble_phase);

        var rating_bubble_phase = {
            type: 'html-button-response',
            stimulus: '<p class = block-text>' +
                'Please rate how violent the picture was (1:none - 7:extremely).</p>',
            choices: ['1', '2', '3', '4', '5', '6', '7'],
            data: {
                exp_stage: 'main_trial_rate_bubble_' + (ii + 1).toString(),
                image: main_seq[ii]
            }
        };
        block_sequence.push(rating_bubble_phase);

        // ATTN CHECK: we are only asking people to provide description of a scene, when its name is in img_attn
        if (img_attn.indexOf(main_seq[ii]) > -1) {
            var describe_phase = {
                type: 'survey-text',
                questions: [{
                    prompt: '<p class = block-text>Please describe the interaction that you saw<br>(minimum 40 characters).</p>',
                    rows: 5,
                    columns: 50
                }],
                minimum_duration: trial_dur,
                required_character: 30,
                data: {
                    exp_stage: 'main_trial_describe_' + (ii + 1).toString(),
                    image: main_seq[ii]
                },
                on_finish: function (data) {
                    descrt_history.push(data.rt);
                    desc_content.push(data.responses);
                }
            };
            block_sequence.push(describe_phase);
        }

        if (ii % 15 == 14) {
            var break_page = {
                type: 'instructions',
                pages: [
                    '<div class = centerbox><p class = block-text>You can take a short break. Click next to continue</p>'
                ],
                allow_keys: false,
                show_clickable_nav: true,
                allow_backward: false,
                show_page_number: false,
                data: {
                    exp_stage: 'main_break'
                },
                on_finish: function (data) {
                    save_data();
                }
            };
            block_sequence.push(break_page);
        }

    }

    return block_sequence;

}
