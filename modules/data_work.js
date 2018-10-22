var CryptoJS = require("crypto-js");


function AnylizeCookie(hash,hashlast,score) {
    var hash_origin=CryptoJS.AES.decrypt(hash.toString(), 'gimmmethefuckingkey5y0u').toString(CryptoJS.enc.Utf8);
    var exponenta = 1;
    var hashsum = 0;
    for(var i=1; i<=score; i++)
    {
        exponenta = exponenta*hash_origin;
        hashsum = hashsum + exponenta*i;
    }
    console.log("hashsum = " + hashsum);
    if(hashsum.toString() == CryptoJS.AES.decrypt(hashlast.toString(), 'gimmmethefuckingkey5y0u').toString(CryptoJS.enc.Utf8))
        return true;
    else return false;
}

module.exports.AnylizeCookie = AnylizeCookie;