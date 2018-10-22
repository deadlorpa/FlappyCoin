let obfuscator = require('javascript-obfuscator');
let fs = require("fs");


// Read the file of your original JavaScript Code as text
let ObfuscatedCode = fs.readFile('./modules/game_code.js', "UTF-8", function(err, data) {
    if (err) {
        throw err;
    }

    // Obfuscate content of the JS file
    let obfuscationResult = obfuscator.obfuscate(data);

    // Write the obfuscated code into a new file
    fs.writeFile('./public/javascripts/game.js', obfuscationResult.getObfuscatedCode() , function(err) {
        if(err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
});

module.exports.ObfuscatedCode = ObfuscatedCode;