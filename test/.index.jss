const liteQ = require('../index.js');
const helper = liteQ.helper;

const user1 = require('./.usertest1.js');
const user2 = require('./.usertest2.js');


const usermodel1 = new user1();
const usermodel2 = new user2();

// usermodel1.migrate();
// usermodel2.migrate();

//事务测试
const trtest = async function (t) {
    //     // for (let i = 1; i < 5; i++) {
    //     //     await usermodel1.add({name: 'rrrrrrrrrrrrr'});
    //     //     await usermodel1.add({name: 'rrrrrrr'});
    //     //     await usermodel1.add({name: 'rrrrrrrrrrrrr'});
    //     // }
    //Promise.all并行
    // let ps = [];
    // for (let i = 1; i < 5; i++) {
    //  ps.push(usermodel1.add({ name: `rrrrrrrrrrrrr${i}` }));
    // }
    // return Promise.all(ps);
    const res1 = await usermodel1.add({ name: '111111111' });
    console.log(res1);
    const res2 = await usermodel1.query(`select * from usertest1`);
    console.log(res2);
    const res3 = await usermodel2.setInstance(t).add({ name: 'test', aa: 1 });
    console.log(res3);
    //     //跨模型执行
    //     await usermodel1.add({name: '11111111111111111'});
    //     let profileModel = await (new usermodel2(config)).setInstance(t);
    //     await profileModel.add({test: 'rrrtest'});
};

const testf = async function () {
    for (let i = 0; i < 1000; i++) {
        await usermodel1.transaction(trtest).then(res => {
            // process.exit();
        }).catch(err => {
            // console.log(err.stack);
            // process.exit();
        });
    }
};

// testf();

// 