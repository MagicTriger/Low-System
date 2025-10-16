const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.MOCK_PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// 日志中间件
app.use((req, res, next) => {
  console.log(`🎭 [${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Mock数据存储
let mockData = {
  users: [
    { id: 1, name: '管理员', email: 'admin@example.com', role: '管理员', status: '正常' },
    { id: 2, name: '张三', email: 'zhangsan@example.com', role: '普通用户', status: '正常' },
    { id: 3, name: '李四', email: 'lisi@example.com', role: '普通用户', status: '禁用' }
  ],
  departments: [
    { id: 1, name: '技术部', code: 'tech', parentId: null },
    { id: 2, name: '产品部', code: 'product', parentId: null },
    { id: 3, name: '前端组', code: 'frontend', parentId: 1 },
    { id: 4, name: '后端组', code: 'backend', parentId: 1 }
  ],
  roles: [
    { id: 1, name: '超级管理员', code: 'super_admin', description: '系统超级管理员' },
    { id: 2, name: '管理员', code: 'admin', description: '普通管理员' },
    { id: 3, name: '普通用户', code: 'user', description: '普通用户' }
  ],
  permissions: [
    { id: 1, name: '用户管理', code: 'user.manage', type: 'menu' },
    { id: 2, name: '用户查看', code: 'user.view', type: 'action' },
    { id: 3, name: '用户编辑', code: 'user.edit', type: 'action' },
    { id: 4, name: '用户删除', code: 'user.delete', type: 'action' },
    { id: 5, name: '系统设置', code: 'system.config', type: 'menu' },
    { id: 6, name: '角色管理', code: 'role.manage', type: 'menu' }
  ]
}

// 工具函数
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms))

const paginate = (data, pageNum = 1, pageSize = 10) => {
  const start = (pageNum - 1) * pageSize
  const end = start + pageSize
  return {
    list: data.slice(start, end),
    total: data.length,
    pageNum: parseInt(pageNum),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(data.length / pageSize)
  }
}

const successResponse = (data, message = '操作成功') => ({
  success: true,
  message,
  data,
  timestamp: new Date().toISOString()
})

const errorResponse = (message = '操作失败', code = 500) => ({
  success: false,
  message,
  code,
  timestamp: new Date().toISOString()
})

// 通用CRUD路由生成器
const createCrudRoutes = (resource, dataKey) => {
  // 列表查询
  app.get(`/api/${resource}/list`, async (req, res) => {
    await delay()
    
    const { pageNum = 1, pageSize = 10, keyword = '' } = req.query
    let data = mockData[dataKey] || []
    
    // 关键词搜索
    if (keyword) {
      data = data.filter(item => 
        Object.values(item).some(value => 
          String(value).toLowerCase().includes(keyword.toLowerCase())
        )
      )
    }
    
    const result = paginate(data, pageNum, pageSize)
    res.json(successResponse(result))
  })
  
  // 详情查询
  app.get(`/api/${resource}/:id`, async (req, res) => {
    await delay()
    
    const { id } = req.params
    const data = mockData[dataKey] || []
    const item = data.find(item => item.id == id)
    
    if (item) {
      res.json(successResponse(item))
    } else {
      res.status(404).json(errorResponse('数据不存在', 404))
    }
  })
  
  // 创建
  app.post(`/api/${resource}/save`, async (req, res) => {
    await delay()
    
    const newItem = {
      id: Date.now(),
      ...req.body,
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
    
    if (!mockData[dataKey]) {
      mockData[dataKey] = []
    }
    
    mockData[dataKey].push(newItem)
    res.json(successResponse(newItem, '创建成功'))
  })
  
  // 更新
  app.put(`/api/${resource}/:id`, async (req, res) => {
    await delay()
    
    const { id } = req.params
    const data = mockData[dataKey] || []
    const index = data.findIndex(item => item.id == id)
    
    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...req.body,
        updateTime: new Date().toISOString()
      }
      res.json(successResponse(data[index], '更新成功'))
    } else {
      res.status(404).json(errorResponse('数据不存在', 404))
    }
  })
  
  // 删除
  app.delete(`/api/${resource}/:id`, async (req, res) => {
    await delay()
    
    const { id } = req.params
    const data = mockData[dataKey] || []
    const index = data.findIndex(item => item.id == id)
    
    if (index !== -1) {
      data.splice(index, 1)
      res.json(successResponse(null, '删除成功'))
    } else {
      res.status(404).json(errorResponse('数据不存在', 404))
    }
  })
  
  // 批量删除
  app.post(`/api/${resource}/batch-delete`, async (req, res) => {
    await delay()
    
    const { ids } = req.body
    if (!Array.isArray(ids)) {
      return res.status(400).json(errorResponse('参数错误'))
    }
    
    const data = mockData[dataKey] || []
    mockData[dataKey] = data.filter(item => !ids.includes(item.id))
    
    res.json(successResponse(null, `批量删除成功，共删除${ids.length}条数据`))
  })
}

// 创建CRUD路由
createCrudRoutes('user', 'users')
createCrudRoutes('dept', 'departments')
createCrudRoutes('role', 'roles')
createCrudRoutes('permission', 'permissions')

// 特殊路由
// 用户登录
app.post('/api/auth/login', async (req, res) => {
  await delay()
  
  const { username, password } = req.body
  
  if (username === 'admin' && password === '123456') {
    res.json(successResponse({
      token: 'mock-token-' + Date.now(),
      user: {
        id: 1,
        name: '管理员',
        username: 'admin',
        email: 'admin@example.com',
        role: '管理员'
      }
    }, '登录成功'))
  } else {
    res.status(401).json(errorResponse('用户名或密码错误', 401))
  }
})

// 获取用户信息
app.get('/api/auth/userinfo', async (req, res) => {
  await delay()
  
  const token = req.headers.authorization
  if (token && token.startsWith('Bearer mock-token-')) {
    res.json(successResponse({
      id: 1,
      name: '管理员',
      username: 'admin',
      email: 'admin@example.com',
      role: '管理员',
      permissions: ['user.manage', 'user.view', 'user.edit', 'user.delete', 'system.config']
    }))
  } else {
    res.status(401).json(errorResponse('未授权', 401))
  }
})

// 文件上传
app.post('/api/upload', async (req, res) => {
  await delay()
  
  res.json(successResponse({
    url: `https://picsum.photos/200/300?random=${Date.now()}`,
    filename: `mock-file-${Date.now()}.jpg`,
    size: Math.floor(Math.random() * 1000000)
  }, '上传成功'))
})

// 统计数据
app.get('/api/dashboard/stats', async (req, res) => {
  await delay()
  
  res.json(successResponse({
    userCount: mockData.users.length,
    deptCount: mockData.departments.length,
    roleCount: mockData.roles.length,
    permissionCount: mockData.permissions.length,
    todayVisits: Math.floor(Math.random() * 1000),
    totalVisits: Math.floor(Math.random() * 100000)
  }))
})

// 图表数据
app.get('/api/dashboard/chart', async (req, res) => {
  await delay()
  
  const { type } = req.query
  
  if (type === 'line') {
    res.json(successResponse({
      xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
      series: [
        {
          name: '访问量',
          data: [120, 200, 150, 80, 70, 110]
        },
        {
          name: '用户数',
          data: [60, 120, 100, 40, 35, 55]
        }
      ]
    }))
  } else if (type === 'pie') {
    res.json(successResponse([
      { name: '技术部', value: 35 },
      { name: '产品部', value: 25 },
      { name: '运营部', value: 20 },
      { name: '其他', value: 20 }
    ]))
  } else {
    res.json(successResponse([]))
  }
})

// 页面设计相关API
app.get('/api/design/:pageCode', async (req, res) => {
  await delay()
  
  const { pageCode } = req.params
  
  // 模拟页面设计数据
  const designData = {
    id: `design-${pageCode}`,
    pageId: pageCode,
    pageCode,
    content: JSON.stringify({
      type: 'page',
      children: [
        {
          type: 'form',
          props: {
            title: `${pageCode}表单`
          },
          children: [
            {
              type: 'input',
              props: {
                label: '名称',
                field: 'name',
                required: true
              }
            }
          ]
        }
      ]
    }),
    config: JSON.stringify({
      title: `${pageCode}页面`,
      layout: 'default'
    }),
    mockData: JSON.stringify({
      name: '示例数据'
    }),
    actions: JSON.stringify([
      {
        id: 'save',
        name: '保存',
        type: 'api',
        config: {
          url: '/api/common/save',
          method: 'POST'
        }
      }
    ])
  }
  
  res.json(successResponse(designData))
})

app.post('/api/design/save', async (req, res) => {
  await delay()
  
  const designData = req.body
  console.log('🎭 保存页面设计:', designData.pageCode)
  
  res.json(successResponse({
    id: designData.id || `design-${Date.now()}`,
    ...designData,
    updateTime: new Date().toISOString()
  }, '页面设计保存成功'))
})

// 通用查询接口
app.post('/api/common/query', async (req, res) => {
  await delay()
  
  const { dataSource, params = {} } = req.body
  
  // 根据数据源返回对应数据
  if (mockData[dataSource]) {
    const data = mockData[dataSource]
    const result = params.pageNum ? paginate(data, params.pageNum, params.pageSize) : data
    res.json(successResponse(result))
  } else {
    res.json(successResponse([]))
  }
})

// 通用保存接口
app.post('/api/common/save', async (req, res) => {
  await delay()
  
  res.json(successResponse({
    id: Date.now(),
    ...req.body,
    createTime: new Date().toISOString()
  }, '保存成功'))
})

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// 获取Mock数据
app.get('/api/mock/data', (req, res) => {
  res.json(successResponse(mockData))
})

// 重置Mock数据
app.post('/api/mock/reset', (req, res) => {
  // 重置为初始数据
  mockData = {
    users: [
      { id: 1, name: '管理员', email: 'admin@example.com', role: '管理员', status: '正常' },
      { id: 2, name: '张三', email: 'zhangsan@example.com', role: '普通用户', status: '正常' },
      { id: 3, name: '李四', email: 'lisi@example.com', role: '普通用户', status: '禁用' }
    ],
    departments: [
      { id: 1, name: '技术部', code: 'tech', parentId: null },
      { id: 2, name: '产品部', code: 'product', parentId: null },
      { id: 3, name: '前端组', code: 'frontend', parentId: 1 },
      { id: 4, name: '后端组', code: 'backend', parentId: 1 }
    ],
    roles: [
      { id: 1, name: '超级管理员', code: 'super_admin', description: '系统超级管理员' },
      { id: 2, name: '管理员', code: 'admin', description: '普通管理员' },
      { id: 3, name: '普通用户', code: 'user', description: '普通用户' }
    ],
    permissions: [
      { id: 1, name: '用户管理', code: 'user.manage', type: 'menu' },
      { id: 2, name: '用户查看', code: 'user.view', type: 'action' },
      { id: 3, name: '用户编辑', code: 'user.edit', type: 'action' },
      { id: 4, name: '用户删除', code: 'user.delete', type: 'action' },
      { id: 5, name: '系统设置', code: 'system.config', type: 'menu' },
      { id: 6, name: '角色管理', code: 'role.manage', type: 'menu' }
    ]
  }
  
  res.json(successResponse(null, 'Mock数据已重置'))
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('🎭 服务器错误:', err)
  res.status(500).json(errorResponse('服务器内部错误'))
})

// 404处理
app.use((req, res) => {
  res.status(404).json(errorResponse('接口不存在', 404))
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎭 Mock服务器启动成功!`)
  console.log(`🌐 服务地址: http://localhost:${PORT}`)
  console.log(`📊 健康检查: http://localhost:${PORT}/health`)
  console.log(`📋 Mock数据: http://localhost:${PORT}/api/mock/data`)
  console.log(`🔄 重置数据: POST http://localhost:${PORT}/api/mock/reset`)
  console.log('')
  console.log('🎯 可用的API端点:')
  console.log('  - GET  /api/user/list      用户列表')
  console.log('  - GET  /api/dept/list      部门列表')
  console.log('  - GET  /api/role/list      角色列表')
  console.log('  - POST /api/auth/login     用户登录')
  console.log('  - GET  /api/auth/userinfo  用户信息')
  console.log('  - POST /api/upload         文件上传')
  console.log('  - GET  /api/dashboard/stats 统计数据')
  console.log('')
})

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🎭 Mock服务器正在关闭...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🎭 Mock服务器正在关闭...')
  process.exit(0)
})