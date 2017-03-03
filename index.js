const request = require('request');
const fs = require('fs');
const _ = require('underscore');

var bayes = require('bayes');
var bayes_classifier = bayes({ tokenizer: text => text.toLowerCase().split(' ') });

var natural = require('natural'),
    natural_classifier = new natural.BayesClassifier();


const getAsync = (opt) => {
    return new Promise((ok, fail) => {
        request.get(opt, (err, response, body) => {
            if (err) {
                return fail(err);
            }

            return ok(
                JSON.parse(body)
            )
        });
    });
};

const opt = {
    url: "https://api.nytimes.com/svc/archive/v1/2016/1.json",
    qs: {
        'api-key': "f2bba502d1864695916505535c2ec356"
    },
};


let trainCount = 0;
const categories = {};


const learn = (input, subject) => {
    if (!input) return;

    subject = subject.toLowerCase();
    categories[subject] = categories[subject] ? categories[subject] + 1 : 1;

    bayes_classifier.learn(input, subject);

    natural_classifier.addDocument(input, subject);
    natural_classifier.train();
};

const classify = (input) => {
    input = input.toLowerCase();

    const b = bayes_classifier.categorize(input);
    const n = natural_classifier.classify(input);
    console.log(natural_classifier.getClassifications(input));
   return `b[${b}] === n[${n}]`
};



/*
getAsync(opt).then(r => {

});
*/

const data = JSON.parse(fs.readFileSync('data.json'));

console.time('training');

data.response.docs.forEach(doc => {

    const {  section_name, lead_paragraph, snippet, abstract } = doc;

    if (!section_name || [
        'Health',
        'Science',
        'Movies',
        'Sports',
        'Technology',
        'Fashion & Style',
        'U.S.',
        'Books'
    ].indexOf(section_name) === -1) return;

    learn(lead_paragraph, section_name);
    learn(snippet, section_name);
    learn(abstract, section_name);

    doc.keywords ? doc.keywords.forEach(it => {

        let subjectCombination = section_name;

        if (it.name != 'subject')
            subjectCombination = `${it.name}`
        else
            subjectCombination = `${it.value}` // ${section_name}

        learn(it.value, subjectCombination);
        learn(lead_paragraph, subjectCombination);
        learn(snippet, subjectCombination);
        learn(abstract, subjectCombination);

    }) : void 0;

    trainCount++;


});
console.timeEnd('training');

console.log(`${trainCount}/${data.response.docs.length} `);

const test = (input) => {
    console.log(`classify => [${input}]`);
    const c = classify(input);
    console.log(c);
    console.log('------------------------');
}


// testing
[
    'N.B.A.',
    'Berlin',
    'Pizza',
    'halftime',
    'golf',
    'google',
    'Microsoft',
    'Iphone',
    'donald trump',
    'Elon Musk',
    'internet',
    'Brad pitt',
    'windows',
    'mac os',
    'browser',
    'dollar',
    'mexico',
    'war',
    'Putin',
    'twitter',
    'facebook'
]
    .forEach(test);