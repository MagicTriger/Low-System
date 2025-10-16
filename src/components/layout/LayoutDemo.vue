<template>
  <div class="layout-demo">
    <h1>响应式布局组件演示</h1>
    
    <!-- 容器演示 -->
    <section class="demo-section">
      <h2>Container 容器</h2>
      <div class="demo-item">
        <h3>固定容器</h3>
        <Container class="demo-container">
          <div class="demo-content">固定宽度容器</div>
        </Container>
      </div>
      
      <div class="demo-item">
        <h3>流式容器</h3>
        <Container fluid class="demo-container">
          <div class="demo-content">流式容器（100%宽度）</div>
        </Container>
      </div>
    </section>

    <!-- 网格演示 -->
    <section class="demo-section">
      <h2>Grid 网格系统</h2>
      <div class="demo-item">
        <h3>基础网格</h3>
        <Container>
          <Row class="demo-row">
            <Col :span="12" class="demo-col">
              <div class="demo-content">col-12</div>
            </Col>
            <Col :span="12" class="demo-col">
              <div class="demo-content">col-12</div>
            </Col>
          </Row>
          
          <Row class="demo-row">
            <Col :span="8" class="demo-col">
              <div class="demo-content">col-8</div>
            </Col>
            <Col :span="8" class="demo-col">
              <div class="demo-content">col-8</div>
            </Col>
            <Col :span="8" class="demo-col">
              <div class="demo-content">col-8</div>
            </Col>
          </Row>
          
          <Row class="demo-row">
            <Col :span="6" class="demo-col">
              <div class="demo-content">col-6</div>
            </Col>
            <Col :span="6" class="demo-col">
              <div class="demo-content">col-6</div>
            </Col>
            <Col :span="6" class="demo-col">
              <div class="demo-content">col-6</div>
            </Col>
            <Col :span="6" class="demo-col">
              <div class="demo-content">col-6</div>
            </Col>
          </Row>
        </Container>
      </div>

      <div class="demo-item">
        <h3>响应式网格</h3>
        <Container>
          <Row class="demo-row">
            <Col :xs="24" :sm="12" :md="8" :lg="6" class="demo-col">
              <div class="demo-content">响应式列</div>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="6" class="demo-col">
              <div class="demo-content">响应式列</div>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="6" class="demo-col">
              <div class="demo-content">响应式列</div>
            </Col>
            <Col :xs="24" :sm="12" :md="8" :lg="6" class="demo-col">
              <div class="demo-content">响应式列</div>
            </Col>
          </Row>
        </Container>
      </div>

      <div class="demo-item">
        <h3>偏移和排序</h3>
        <Container>
          <Row class="demo-row">
            <Col :span="8" :offset="8" class="demo-col">
              <div class="demo-content">col-8 offset-8</div>
            </Col>
          </Row>
          
          <Row class="demo-row">
            <Col :span="6" :order="4" class="demo-col">
              <div class="demo-content">1 col-order-4</div>
            </Col>
            <Col :span="6" :order="1" class="demo-col">
              <div class="demo-content">2 col-order-1</div>
            </Col>
            <Col :span="6" :order="3" class="demo-col">
              <div class="demo-content">3 col-order-3</div>
            </Col>
            <Col :span="6" :order="2" class="demo-col">
              <div class="demo-content">4 col-order-2</div>
            </Col>
          </Row>
        </Container>
      </div>
    </section>

    <!-- 间距演示 -->
    <section class="demo-section">
      <h2>Space 间距</h2>
      <div class="demo-item">
        <h3>水平间距</h3>
        <Space size="large" class="demo-space">
          <div class="demo-content">Item 1</div>
          <div class="demo-content">Item 2</div>
          <div class="demo-content">Item 3</div>
        </Space>
      </div>

      <div class="demo-item">
        <h3>垂直间距</h3>
        <Space direction="vertical" size="medium" class="demo-space">
          <div class="demo-content">Item 1</div>
          <div class="demo-content">Item 2</div>
          <div class="demo-content">Item 3</div>
        </Space>
      </div>

      <div class="demo-item">
        <h3>带分割线</h3>
        <Space size="large" split class="demo-space">
          <div class="demo-content">Item 1</div>
          <div class="demo-content">Item 2</div>
          <div class="demo-content">Item 3</div>
        </Space>
      </div>

      <div class="demo-item">
        <h3>自动换行</h3>
        <Space size="medium" wrap class="demo-space">
          <div class="demo-content" v-for="i in 10" :key="i">Item {{ i }}</div>
        </Space>
      </div>
    </section>

    <!-- Flex演示 -->
    <section class="demo-section">
      <h2>Flex 弹性布局</h2>
      <div class="demo-item">
        <h3>基础Flex</h3>
        <Flex justify="space-between" align="center" class="demo-flex">
          <div class="demo-content">Left</div>
          <div class="demo-content">Center</div>
          <div class="demo-content">Right</div>
        </Flex>
      </div>

      <div class="demo-item">
        <h3>垂直Flex</h3>
        <Flex direction="column" align="center" gap="16" class="demo-flex vertical">
          <div class="demo-content">Top</div>
          <div class="demo-content">Middle</div>
          <div class="demo-content">Bottom</div>
        </Flex>
      </div>

      <div class="demo-item">
        <h3>Flex换行</h3>
        <Flex wrap="wrap" gap="16" class="demo-flex">
          <div class="demo-content flex-item" v-for="i in 8" :key="i">Item {{ i }}</div>
        </Flex>
      </div>

      <div class="demo-item">
        <h3>响应式Flex</h3>
        <Flex 
          :direction="{ xs: 'column', md: 'row' }"
          :justify="{ xs: 'center', md: 'space-between' }"
          :gap="{ xs: 8, md: 16 }"
          class="demo-flex"
        >
          <div class="demo-content">响应式项目 1</div>
          <div class="demo-content">响应式项目 2</div>
          <div class="demo-content">响应式项目 3</div>
        </Flex>
      </div>
    </section>

    <!-- 组合使用演示 -->
    <section class="demo-section">
      <h2>组合使用</h2>
      <div class="demo-item">
        <h3>复杂布局示例</h3>
        <Container>
          <!-- 头部 -->
          <Row class="demo-row">
            <Col :span="24" class="demo-col">
              <Flex justify="space-between" align="center" class="header">
                <div class="logo">Logo</div>
                <Space size="large">
                  <div>菜单1</div>
                  <div>菜单2</div>
                  <div>菜单3</div>
                </Space>
              </Flex>
            </Col>
          </Row>
          
          <!-- 内容区 -->
          <Row :gutter="[24, 24]" class="demo-row">
            <Col :xs="24" :md="18" class="demo-col">
              <div class="main-content">
                <h4>主要内容</h4>
                <Space direction="vertical" size="medium" style="width: 100%;">
                  <div class="content-item">内容项目 1</div>
                  <div class="content-item">内容项目 2</div>
                  <div class="content-item">内容项目 3</div>
                </Space>
              </div>
            </Col>
            <Col :xs="24" :md="6" class="demo-col">
              <div class="sidebar">
                <h4>侧边栏</h4>
                <Space direction="vertical" size="small" style="width: 100%;">
                  <div class="sidebar-item">侧边项目 1</div>
                  <div class="sidebar-item">侧边项目 2</div>
                  <div class="sidebar-item">侧边项目 3</div>
                </Space>
              </div>
            </Col>
          </Row>
          
          <!-- 底部 -->
          <Row class="demo-row">
            <Col :span="24" class="demo-col">
              <Flex justify="center" align="center" class="footer">
                <div>© 2024 响应式布局演示</div>
              </Flex>
            </Col>
          </Row>
        </Container>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Container, Row, Col, Space, Flex } from './index'
</script>

<style scoped>
.layout-demo {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.demo-section {
  margin-bottom: 40px;
}

.demo-section h2 {
  color: #1890ff;
  border-bottom: 2px solid #1890ff;
  padding-bottom: 8px;
  margin-bottom: 20px;
}

.demo-item {
  margin-bottom: 30px;
}

.demo-item h3 {
  color: #666;
  margin-bottom: 16px;
}

.demo-container {
  border: 2px dashed #d9d9d9;
  background-color: #fafafa;
}

.demo-row {
  margin-bottom: 16px;
}

.demo-col {
  margin-bottom: 8px;
}

.demo-content {
  background-color: #1890ff;
  color: white;
  padding: 16px;
  text-align: center;
  border-radius: 4px;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demo-space {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.demo-flex {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  min-height: 80px;
}

.demo-flex.vertical {
  min-height: 200px;
}

.flex-item {
  min-width: 120px;
}

/* 复杂布局样式 */
.header {
  background-color: #001529;
  color: white;
  padding: 16px;
  border-radius: 4px;
}

.logo {
  font-size: 20px;
  font-weight: bold;
}

.main-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 300px;
}

.sidebar {
  background-color: #f0f2f5;
  padding: 24px;
  border-radius: 4px;
  min-height: 300px;
}

.content-item,
.sidebar-item {
  background-color: #e6f7ff;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #1890ff;
}

.sidebar-item {
  background-color: #f6ffed;
  border-left-color: #52c41a;
}

.footer {
  background-color: #f0f2f5;
  padding: 16px;
  border-radius: 4px;
  margin-top: 24px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .layout-demo {
    padding: 10px;
  }
  
  .demo-content {
    padding: 8px;
    font-size: 14px;
  }
  
  .main-content,
  .sidebar {
    padding: 16px;
  }
}
</style>