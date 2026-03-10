
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

const router = express.Router();

//创建supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

global.managename = 'ltp-ptl';


//1. 存储提交的价格数据
router.post('/submitprice', async (req, res) => {
  const { token, userIdTemp, marketInput, wareInput, priceInput, unit } = req.body;
  let username = '';

  //跳过登录验证
  if (!token) {
    // 无token时，使用userIdTemp作为标识
    if (!userIdTemp) {
      return res.json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    const tempTimestamp = userIdTemp.split('_').pop();
    if (tempTimestamp < 0 || tempTimestamp > 9) {
      return res.json({ 
        success: false, 
        message: '请先登录或注册，试用次数结束' 
      });
    }
    username = userIdTemp; // 使用userIdTemp作为临时用户名
  }else{
    if (!token) {
      return res.json({ 
        success: false, 
        message: '无token请重新登录' 
      });
    }
    
    // 从token获取账号名验证
    const { data:username1, error:error } = await supabase
      .from('price_users')
      .select('username')
      .eq('token', token)
      .single();
    username = username1.username;
    if (!username) {
      return res.json({ 
        success: false, 
        message: '无效的token' 
      });
    }
  }


  if (!priceInput) {
    return res.json({ 
      success: false, 
      message: '提交的价格不能为空' 
    });
  }
    const { data, error } = await supabase
      .from('price_datas')
      .insert({ market:marketInput, ware:wareInput, price:priceInput, unit, username})
      .select();

    res.json({ 
      success: true, 
      message: '提交成功！',
    });

});


//2. 获取超市的价格记录
router.post('/getpricenote', async (req, res) => {
  console.log('服务器开始获取所有超市价格记录')
  const { token, userIdTemp, markets } = req.body;
  
  //跳过登录验证
  if (!token) {
    // 无token时，使用userIdTemp作为标识
    if (!userIdTemp) {
      return res.json({ 
        success: false, 
        message: '请先登录' 
      });
    }
    const tempTimestamp = userIdTemp.split('_').pop();
    if (tempTimestamp < 0 || tempTimestamp > 9) {
      return res.json({ 
        success: false, 
        message: '请先登录或注册，试用次数结束' 
      });
    }
    console.log(`${userIdTemp}访问`);
    
  }else{
      if (!token) {
        return res.json({ 
          success: false, 
          message: '请先登录' 
        });
      }
      console.log(token)
      // 从token获取账号名验证
      const { data:userJson, error:error } = await supabase
        .from('price_users')
        .select('*')
        .eq('token', token);


      if (!userJson) {
        return res.json({ 
          success: false, 
          message: '无效的token' 
        });
      }
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

      const { data:datai, error:error } = await supabase
        .from('price_datas')
        .select('*')
        .eq('market', i);

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

  const { data:username1, error:error } = await supabase
    .from('price_users')
    .select('username')
    .eq('token', token)
    .single();
  const username = username1.username;

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
      const { data, error1 } = await supabase
        .from('price_users')
        .delete()
        .eq('market',i)
        .eq('ware', delware);


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


export default router;
