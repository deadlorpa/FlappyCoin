const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'postgres',

    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    operatorsAliases: false
});

const User = sequelize.define('winners', {
    username: Sequelize.STRING,
    useremail: Sequelize.STRING,
    wallet: Sequelize.STRING,
    hash_first: Sequelize.STRING,
    hash_last: Sequelize.STRING,
    score: Sequelize.STRING
});



function add(name,email,wallet, hash_fst, hash_lst, score) {
    sequelize.sync()
        .then(() => User.create({
            username: name,
            useremail: email,
            wallet: wallet,
            hash_first: hash_fst,
            hash_last: hash_lst,
            score: score
        }))
};


async function find_repeat(hash_fst, hash_lst, score)
{
    sequelize.sync();
    let result = await User.count({
            where: {
                hash_first: hash_fst,
                hash_last: hash_lst,
                score: score
            }
        })
    return result;
}

module.exports.add = add;
module.exports.find = find_repeat;