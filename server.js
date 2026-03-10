import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
//导入路由模块
import productRouter from './routes/products.js';
//挂载路由
app.use('/api/products', productRouter);

//创建supabase客户端
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);


//设置管理员账号
(async function () {
    // 创建用户对象
    global.managename = 'ltp-ptl'
    const username = global.managename
    const password = 'litianpeng6171'
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

  const { data:user, error:error1 } = await supabase
    .from('price_users')
    .select('*')
    .eq('username', username)
    .single();
  if(user){
    const { data, error } = await supabase
      .from('price_users')
      .update({ id:-1, password:hashedPassword })
      .eq('username', username)
      .select();
    console.log('管理员更新成功：' + error)

  }else{
    const { data, error } = await supabase
      .from('price_users')
      .insert({id:-1, username, password:hashedPassword })
      .select();
    console.log('管理员创建成功：' + error)

  }

  
})();


// 1. 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    // const count = await kv.hlen('users');

  const { count, error:error0 } = await supabase
    .from('price_users')
    .select('*', {count: 'exact', head: true});
  console.log(`用户数量${count}`);
    if (count > 499){
      return res.json({ 
        success: false, 
        message: '注册用户已经到500个上限' 
      });
    }


    // 验证输入
    if (!username || !password) {
      return res.json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    if (username.length < 3) {
      return res.json({ 
        success: false, 
        message: '用户名至少3个字符' 
      });
    }

    const pattern = /^[a-zA-Z0-9_-]+$/;
    if (!pattern.test(username)) {
        return res.json({ 
        success: false, 
        message: '用户名只能含有字母、数字、横杠和下划线' 
      });
    }

    
    if (password.length < 6) {
      return res.json({ 
        success: false, 
        message: '密码至少6个字符' 
      });
    }
    
    // 检查用户名是否已存在
    const { data:existingUser, error:error1 } = await supabase
      .from('price_users')
      .select('*')
      .eq('username', username)
      .single();

    if (existingUser || !error1) {
      return res.json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户对象
    const { data, error } = await supabase
      .from('price_users')
      .insert({ username, password:hashedPassword })
      .select();


    res.json({ 
      success: true, 
      message: '注册成功！',
      user: {
        username: username,
        email: email
      }
    });
    
  } catch (error) {
    console.error('注册错误:', error);
    res.json({ 
      success: false, 
      message: '注册失败，服务器错误' 
    });
  }
});

// 2. 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password,} = req.body;
    
    if (!username || !password) {
      return res.json({ 
        success: false, 
        message: '用户名和密码不能为空' 
      });
    }
    
    // 数据库获取用户    
    const { data:userJson, error:error1 } = await supabase
      .from('price_users')
      .select('*')
      .eq('username', username)
      .single();


    if (!userJson) {
      return res.json({ 
        success: false, 
        message: '用户名不存在' 
      });
    }
    
    const user = userJson;
    
    // 验证密码
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (validPassword) {
      // 生成一个简单的token（实际项目中应该用JWT）
      const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
      
      // 保存token
      console.log('登录成功，token：' + token)
      const { data, error } = await supabase
        .from('price_users')
        .update({ token })
        .eq('username',username)
        .select();


      res.json({ 
        success: true, 
        message: '登录成功！',
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        },
        token: token
      });
    } else {
      res.json({ 
        success: false, 
        message: '密码错误' 
      });
    }
    
  } catch (error) {
    console.error('登录错误:', error);
    res.json({ 
      success: false, 
      message: '登录失败，服务器错误' 
    });
  }
});

// 3. 验证token接口
app.post('/api/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.json({ 
        success: false, 
        message: '缺少token' 
      });
    }
        
    // 获取用户信息
    const { data:userJson, error:error } = await supabase
      .from('price_users')
      .select('*')
      .eq('token', token)
      .single();


    if (!userJson) {
      return res.json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    
    const user = userJson;
    
    res.json({ 
      success: true, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
    
  } catch (error) {
    console.error('验证错误:', error);
    res.json({ 
      success: false, 
      message: '验证失败' 
    });
  }
});

// 4. 退出登录接口
app.post('/api/logout', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      const { data, error } = await supabase
        .from('price_users')
        .update({ token:'' })
        .eq('token',token)
        .select();
    }
    
    res.json({ 
      success: true, 
      message: '已退出登录' 
    });
    
  } catch (error) {
    console.error('退出错误:', error);
    res.json({ 
      success: false, 
      message: '退出失败' 
    });
  }
});

// 8. 主页
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
});
// 9. 登录页面
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/public/login.html');
});

// 10. 管理员获取所有用户
app.post('/api/getalluser', async (req, res) => {
  const { token } = req.body;
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

  const { data:userJson, error:error } = await supabase
    .from('price_users')
    .select('*');

    const users = [];

    for(let i of userJson){
      const j = {
        id:i.id,
        username:i.username,
        email:i.email
      };
      users.push(j);
    }


    res.json({ 
      success: true, 
      users: users,
      count: users.length
    });
    
  } catch (error) {
    console.error('获取用户错误:', error);
    res.json({ 
      success: false, 
      message: '获取用户失败' 
    });
  }
});

// 11. 管理员删除用户账号
app.delete('/api/deluser', async (req, res) => {
  const { token, delusername } = req.body;
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
    console.log(`删除的用户: ${delusername}`)

    // 获取用户信息
    const { data:userJson, error } = await supabase
      .from('price_users')
      .select('*')
      .eq('username',delusername)
      .single();


    if (!userJson) {
      return res.json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    const user = userJson;
    
    // 删除用户    
    const { data, error1 } = await supabase
      .from('price_users')
      .delete()
      .eq('username',delusername);

    
    res.json({ 
      success: true, 
      message: '用户删除成功' 
    });
    
  } catch (error) {
    console.error('删除用户错误:', error);
    res.json({ 
      success: false, 
      message: '删除用户失败' 
    });
  }
});


// 本地开发服务器
if (import.meta.main) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 服务器启动成功！`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`🔐 数据库: ${supabaseUrl ? '在线数据库' : '内存存储（测试用）'}`);
    console.log('\n📡 API接口:');
    console.log(`  POST /api/register  - 注册用户`);
    console.log(`  POST /api/login     - 用户登录`);
    console.log(`  POST /api/verify    - 验证token`);
    console.log(`  POST /api/logout    - 退出登录`);
    console.log(`  GET  /api/health    - 健康检查`);
  });
}

//包装函数给vercel
const handler = async (req, res)=>{
  return app(req, res);
}
export default handler;