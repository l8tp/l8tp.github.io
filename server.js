import dotenv from 'dotenv';
dotenv.config();

// require('dotenv').config();
// const {Redis} = require('@upstash/redis');
// const express = require('express');
// const bcrypt = require('bcrypt');

import express from 'express';
import {Redis} from '@upstash/redis';
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
// const poductRouter = require('./routes/products');
import productRouter from './routes/products.js';
//挂载路由
app.use('/api/products', productRouter);

// 创建Vercel KV客户端
let kv;
try {
  // 检查是否存在 Upstash Redis 环境变量
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    kv = Redis.fromEnv();
    console.log('✅ Vercel KV连接成功');
  } else {
    throw new Error('Vercel KV环境变量未配置');
  }
} catch (error) {
  console.log('⚠️  Vercel KV未配置，使用内存存储（仅限测试）');
  // 如果没有配置KV，使用内存存储（仅用于测试）
  const memoryStore = {};
  kv = {
    hget: async (key, field) => memoryStore[`${key}:${field}`],
    hset: async (key, data) => {
      Object.entries(data).forEach(([field, value]) => {
        memoryStore[`${key}:${field}`] = value;
      });
      return 1;
    },
    hgetall: async (key) => {
      const result = {};
      Object.keys(memoryStore).forEach(k => {
        const i = k.split(':');
        const j = i.pop();
        if (i.join(':') == key) {
          const field = j;
          result[field] = memoryStore[k];
        }
      });
      return result;
    },
    del: async (key) => {
      Object.keys(memoryStore).forEach(k => {
        if (k.startsWith(`${key}:`)) {
          delete memoryStore[k];
        }
      });
      return 1;
    },
    hdel: async (key, field) => {
      Object.keys(memoryStore).forEach(k => {
        if (k.startsWith(`${key}:`)) {
          if (field == k.split(':')[1]) {
            delete memoryStore[k];
          }
        }
      });
      return 1;
    },
    hlen: async (key) => {
      let count = 0;
      Object.keys(memoryStore).forEach(k => {
        if (k.startsWith(`${key}:`)) {
          count++;
        }
      });
      return count;
    }
  };
}

//设置管理员账号
(async function () {
    // 创建用户对象
    global.managename = 'ltp-ptl'
    const username = global.managename
    const password = 'litianpeng6171'
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username,
      password: hashedPassword,
      email: '',
      createdAt: new Date().toISOString(),
      id: 'manage:' + Date.now().toString() // 使用时间戳作为ID
    };
    
    // 保存到KV
    await kv.hset('users', { [username]: userData });
    
    // 也按ID存储一份，方便通过ID查找
    await kv.hset('users_by_id', { [userData.id]: userData });
  
})();


// 1. 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    const count = await kv.hlen('users');
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
    const existingUser = await kv.hget('users', username);
    if (existingUser) {
      return res.json({ 
        success: false, 
        message: '用户名已存在' 
      });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建用户对象
    const userData = {
      username,
      password: hashedPassword,
      email: email || '',
      createdAt: new Date().toISOString(),
      id: Date.now().toString() // 使用时间戳作为ID
    };
    
    // 保存到KV
    await kv.hset('users', { [username]: userData });
    
    // 也按ID存储一份，方便通过ID查找
    await kv.hset('users_by_id', { [userData.id]: userData });
    
    res.json({ 
      success: true, 
      message: '注册成功！',
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email
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
    
    // 从KV获取用户
    const userJson = await kv.hget('users', username);
    
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
      
      // 保存token到KV
      await kv.hset('tokens', { [token]: user.username });
      
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
    
    // 从KV检查token
    const username = await kv.hget('tokens', token);
    console.log(username, token)
    if (!username) {
      return res.json({ 
        success: false, 
        message: '无效的token' 
      });
    }
    
    // 获取用户信息
    const userJson = await kv.hget('users', username);
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
      await kv.hdel('tokens', token);
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
  const username = await kv.hget('tokens', token);
  
  if (username !== global.managename) {
    return res.json({ 
      success: false, 
      message: '不是管理员账号' 
    });
  }

  try {
    const allUsers = await kv.hgetall('users');
    const users = [];
    
    for (const [, userJson] of Object.entries(allUsers)) {
      const user = {...userJson};
      // 移除密码
      delete user.password;
      users.push(user);
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
  const username = await kv.hget('tokens', token);


  if (username !== global.managename) {
    return res.json({ 
      success: false, 
      message: '不是管理员账号' 
    });
  }

  try {
    console.log(`删除的用户: ${delusername}`)

    // 获取用户信息
    const userJson = await kv.hget('users', delusername);
    if (!userJson) {
      return res.json({ 
        success: false, 
        message: '用户不存在' 
      });
    }
    const user = userJson;
    
    // 删除用户
    await kv.hdel('users', delusername);
    await kv.hdel('users_by_id', user.id);
    
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
    console.log(`🔐 数据库: ${process.env.UPSTASH_REDIS_REST_URL ? 'Vercel KV' : '内存存储（测试用）'}`);
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