var TelegramBot = require('node-telegram-bot-api');

var token = process.env.TG_BOT;
var bot = new TelegramBot(token, {polling: true});

function Send(name, email, wallet, hash_fst, hash_lst,score) {
    let result = 'name: '+name+'\ne-mail: '+email+'\nwallet: '+wallet+'\nhash_fst: '+hash_fst+'\nhash_lst: '+hash_lst+'\nscore: '+score;
    bot.sendMessage( process.env.CH_ID, result);
}

module.exports.Send = Send;