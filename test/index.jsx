const liteQ = require('../index.js');
const helper = liteQ.helper;

const user1 = require('./.usertest1.js');
const user2 = require('./.usertest2.js');


const usermodel1 = new user1();
const usermodel2 = new user2();

// usermodel1.migrate();
// usermodel2.migrate();

//事务测试
return usermodel1.transaction(
    async function testf(t) {
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
        await usermodel1.add({ name: '111111111' });
        // await usermodel1.model(usermodel2).add({ name: 'test', aa: 1 });
        await usermodel2.setInstance(t).add({ name: 'test', aa: 1 });
        //     //跨模型执行
        //     await usermodel1.add({name: '11111111111111111'});
        //     let profileModel = await (new usermodel2(config)).setInstance(t);
        //     await profileModel.add({test: 'rrrtest'});
    }
);

// testf();

// 