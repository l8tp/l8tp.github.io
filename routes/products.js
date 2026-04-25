
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 去除#后面别名的函数
function delAlias(data) {
    return data.map(item => item.split('#')[0]);
}

// 读取 ware.json 文件
const wareData = JSON.parse(fs.readFileSync(join(__dirname, '../public/json/ware.json'), 'utf8'));
const marketData = delAlias(wareData.market);
const wareDataList = delAlias(wareData.ware);
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {fileSize: 1024*1024}
});

global.managename = 'ltp-ptl';

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

const router = express.Router();

//验证身份中间件
router.use( '/:degree/:action', async (req, res, next) => {
  const {degree, action} = req.params;
  const token = req.headers['authorization'] || '';
  if(degree !== 'manage'){ next() }else{
    //验证管理员身份
    if (token) {
      const { data:userJson, error:error } = await supabase
        .from('price_users')
        .select('username')
        .eq('token', token)
        .single();
      if(userJson){//账号存在
        if(userJson.username === global.managename){ next();//是管理员账号   
        }else{
          res.status(401).json({  success: false, message: '错误，不是管理员账号' });
        }
      }else{
        res.status(401).json({ success: false, message: '请先登录_token无效' });
      }
    } else {
      res.status(401).json({ success: false, message: '请先登录_未提供token' });
    }    
  }
});



//创建supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


//1. 存储提交的价格数据
router.post('/user/submitprice', upload.single('image'), async (req, res) => {
  const file = req.file;
  const jsonData = JSON.parse(req.body.jsonData);
  const { userIdTemp, marketInput, wareInput, priceInput, unit } = jsonData;
  const token = req.headers['authorization'] || '';
  let username = '';
  //跳过登录验证
  if (!token) {
    // 无token时，使用userIdTemp作为标识
    if (!userIdTemp || userIdTemp.length > 50) {
      return res.json({ 
        success: false, 
        message: '临时ID错误' 
      });
    }
    username = userIdTemp; // 使用userIdTemp作为临时用户名
  }else{    
    // 从token获取账号名验证
    const { data:username1, error:error } = await supabase
      .from('price_users')
      .select('username')
      .eq('token', token)
      .single();

    if (!username1) {
      return res.json({ 
        success: false, 
        message: '无效的token' 
      });
    }
    username = username1.username;
  }


    if (!priceInput) {
      return res.json({ 
        success: false, 
        message: '提交的价格不能为空' 
      });
    }

    if(!marketData.includes(marketInput) || !wareDataList.includes(wareInput)){
      return res.json({
        success: false, 
        message: '提交的超市或商品不在列表内' 
      });
    }

    // 使用 Base64 编码确保文件名安全，同时保持唯一性
    const safeFileName = Buffer.from(`${marketInput}_${wareInput}`).toString('base64');
    // 上传图片（如果有图片）
    console.log('接收到文件'+ file)
    let imgUrl = '';
    if (file && file.buffer) {
        const {data:imgdata, error:imgerr} = await supabase.storage
          .from('price_images')
          .upload(safeFileName, file.buffer, {
            contentType: file.mimetype,
            upsert: true
          });
        const {data:{publicUrl}} = supabase.storage
          .from('price_images')
          .getPublicUrl(safeFileName);
        imgUrl = publicUrl;
    }
      
    // 使用 upsert 实现存在则更新，不存在则插入
    const { data, error } = await supabase
      .from('price_datas')
      .upsert({ 
        market: marketInput, 
        ware: wareInput, 
        price: priceInput, 
        unit, 
        url: imgUrl,
        username,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'market,ware'  // 指定唯一性约束字段
      })
      .select();
    
    console.log('提交数据：', `${new Date().toISOString() +':'+ username}提交${marketInput+':'+wareInput}${priceInput + unit}`)
    

    res.json({ 
      success: true, 
      message: '提交成功！',
      publicUrl: imgUrl
    });

});


//2. 获取超市的价格记录
router.post('/user/getpricenote', async (req, res) => {
  console.log('服务器开始获取所有超市价格记录')
  const { token, userIdTemp, markets } = req.body;
  
  //跳过登录验证
  if (!token) {
    // 无token时，使用userIdTemp作为标识
    if (!userIdTemp || userIdTemp.length > 50) {
      return res.json({ 
        success: false, 
        message: '临时ID错误' 
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
router.delete('/manage/delware', async (req, res) => {
  const { markets, delware } = req.body;

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
