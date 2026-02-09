// routes/products.js
const express = require('express');
const app = express();
const {Redis} = require('@upstash/redis');
const bcrypt = require('bcrypt');

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

const router = express.Router();

const kv = Redis.fromEnv();

//1. 存储提交的价格数据
router.post('/submitprice', async (req, res) => {
  const { token, marketInput, wareInput, priceInput, unit } = req.body;

  if (!token) {
    return res.json({ 
      success: false, 
      message: '无token请重新登录' 
    });
  }
  
  // 从token获取管理员账号名验证
  const username = await kv.hget('tokens', token);
  if (!username) {
    return res.json({ 
      success: false, 
      message: '无效的token' 
    });
  }

  if (!priceInput) {
    return res.json({ 
      success: false, 
      message: '提交的价格不能为空' 
    });
  }

    const time = new Date().toISOString().replaceAll(':','')
    // 创建对象
    const marketpriceData = {
      username,
      market:marketInput,
      ware:wareInput,
      price:priceInput,
      unit,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    // const userpriceData = {
    //   market:marketInput,
    //   price:priceInput,
    //   unit,
    //   createdAt: new Date().toLocaleString(),
    // };
    console.log('开始KV存储')
    // 按超市保存
    await kv.hset(`wareprice:${marketInput}`, { [wareInput]: marketpriceData });

    //此功能暂时封存
    // 按用户保存
    // await kv.hset(`wareprice:${username}`, { [wareInput]: userpriceData });

    console.log(`${username}存储的价格数据：`)
    console.log(marketpriceData)

    res.json({ 
      success: true, 
      message: '提交成功！',
    });

});


//2. 获取超市的价格记录
router.post('/getpricenote', async (req, res) => {
  console.log('服务器开始获取所有超市价格记录')
  const { token, markets } = req.body;
  
  if (!token) {
    return res.json({ 
      success: false, 
      message: '请先登录' 
    });
  }
  
  // 从token获取管理员账号名验证
  const username = await kv.hget('tokens', token);
  if (!username) {
    return res.json({ 
      success: false, 
      message: '无效的token' 
    });
  }
  if(markets.length > 3){
    return res.json({ 
      success: false, 
      message: '只能选3个超市' 
    });
  }


  try {
    //获取KV
    const data = [];
    for (let i of markets){
      const datai = await kv.hgetall(`wareprice:${i}`);
      if(datai){
        data.push(datai);
      }
    }

    res.json({ 
      success: true, 
      data: data,
    });

  } catch (error) {
    console.error('获取价格记录错误:', error);
    res.json({ 
      success: false, 
      message: '获取价格记录失败' 
    });
  }
})

//3. 管理员删除商品
router.delete('/delware', async (req, res) => {
  const { token, markets, delware } = req.body;
  if (!token) {
    return res.json({ 
      success: false, 
      message: '请先登录' 
    });
  }
  
  // 从token获取管理员账号名
  const username = await kv.hget('tokens', token);
  if (username !== global.managename) {
    return res.json({ 
      success: false, 
      message: '不是管理员账号' 
    });
  }

  try {
    console.log(`删除的商品: ${delware}`)

    // 删除商品
    const data = [];
    for (let i of markets){
      await kv.hdel(`wareprice:${i}`, delware);
    }
    
    res.json({ 
      success: true, 
      message: '商品删除成功' 
    });
    
  } catch (error) {
    console.error('删除商品错误:', error);
    res.json({ 
      success: false, 
      message: '删除商品失败' 
    });
  }
});


//此功能暂时封存
//5. 获取用户提交过的价格记录
// router.post('/getmypricenote', async (req, res) => {
//   console.log('服务器开始获取用户价格记录')
//   const { username } = req.body;
//   if (!username) {
//     return res.json({ 
//       success: false, 
//       message: '需要先登录' 
//     });
//   }

//   try {
//     //获取KV
//     const data = await kv.hgetall(`wareprice:${username}`);

//     res.json({ 
//       success: true, 
//       data: data,
//     });

//   } catch (error) {
//     console.error('获取价格记录错误:', error);
//     res.json({ 
//       success: false, 
//       message: '获取价格记录失败' 
//     });
//   }
// })

module.exports = router;
