<template>
  <div class="user-management-component">
    <a-card :bordered="false" title="用户管理">
      <template #extra>
        <a-space>
          <a-button @click="handleReset" :loading="loading">
            <template #icon><ReloadOutlined /></template>
            刷新
          </a-button>
          <a-button type="primary" @click="handleCreate">
            <template #icon><PlusOutlined /></template>
            新增用户
          </a-button>
        </a-space>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <a-form layout="inline" :model="searchForm">
          <a-form-item label="用户名">
            <a-input
              v-model:value="searchForm.username"
              placeholder="请输入用户名"
              allow-clear
              style="width: 200px"
              @press-enter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="显示名称">
            <a-input
              v-model:value="searchForm.displayName"
              placeholder="请输入显示名称"
              allow-clear
              style="width: 200px"
              @press-enter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="邮箱">
            <a-input
              v-model:value="searchForm.email"
              placeholder="请输入邮箱"
              allow-clear
              style="width: 200px"
              @press-enter="handleSearch"
            />
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="searchForm.enabled" placeholder="请选择状态" allow-clear style="width: 120px">
              <a-select-option value="true">启用</a-select-option>
              <a-select-option value="false">禁用</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" @click="handleSearch" :loading="loading">
                <template #icon><SearchOutlined /></template>
                搜索
              </a-button>
              <a-button @click="handleResetSearch">重置</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </div>

      <!-- 用户表格 -->
      <a-table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="pagination"
        :row-key="(record: User) => record.id || 0"
        @change="handleTableChange"
        class="user-table"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <a-tag :color="record.enabled ? 'green' : 'red'">
              {{ record.enabled ? '启用' : '禁用' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button type="link" size="small" @click="handleEdit(record as User)">
                <template #icon><EditOutlined /></template>
                编辑
              </a-button>
              <a-popconfirm title="确定要删除这个用户吗？" ok-text="确定" cancel-text="取消" @confirm="handleDelete(record as User)">
                <a-button type="link" size="small" danger>
                  <template #icon><DeleteOutlined /></template>
                  删除
                </a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 用户表单弹窗 -->
    <a-modal
      v-model:open="modalVisible"
      :title="modalTitle"
      :confirm-loading="submitting"
      @ok="handleSubmit"
      @cancel="handleCancel"
      width="600px"
    >
      <a-form ref="formRef" :model="formData" :rules="formRules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
        <a-form-item label="用户名" name="username">
          <a-input v-model:value="formData.username" placeholder="请输入用户名" :disabled="isEdit" />
        </a-form-item>
        <a-form-item label="密码" name="password" v-if="!isEdit">
          <a-input-password v-model:value="formData.password" placeholder="请输入密码（6-20位）" />
        </a-form-item>
        <a-form-item label="显示名称" name="displayName">
          <a-input v-model:value="formData.displayName" placeholder="请输入显示名称" />
        </a-form-item>
        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item label="手机号" name="phone">
          <a-input v-model:value="formData.phone" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item label="状态" name="enabled">
          <a-switch v-model:checked="formData.enabled" checked-children="启用" un-checked-children="禁用" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import type { Rule } from 'ant-design-vue/es/form'
import { SearchOutlined, PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { getUserPage, createUser, updateUser, deleteUser, type User, type UserQueryParams, type UnifiedResponse } from '@/core/api/user'

interface Props {
  control?: {
    pageSize?: number
    showSearch?: boolean
    [key: string]: any
  }
}

const props = withDefaults(defineProps<Props>(), {
  control: () => ({
    pageSize: 10,
    showSearch: true,
  }),
})

// 数据
const loading = ref(false)
const submitting = ref(false)
const dataSource = ref<User[]>([])
const searchForm = reactive({
  username: undefined as string | undefined,
  displayName: undefined as string | undefined,
  email: undefined as string | undefined,
  enabled: undefined as string | undefined,
  page: 1,
  size: props.control.pageSize || 10,
})

// 分页
const pagination = reactive({
  current: 1,
  pageSize: props.control.pageSize || 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  pageSizeOptions: ['10', '20', '50', '100'],
  showTotal: (total: number) => `共 ${total} 条`,
})

// 表格列
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username', width: 150 },
  { title: '显示名称', dataIndex: 'displayName', key: 'displayName', width: 150 },
  { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
  { title: '手机号', dataIndex: 'phone', key: 'phone', width: 150 },
  { title: '状态', dataIndex: 'enabled', key: 'enabled', width: 100, align: 'center' as const },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const, align: 'center' as const },
]

// 表单
const modalVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const formData = reactive<User>({
  username: '',
  password: '',
  displayName: '',
  email: '',
  phone: '',
  enabled: true,
})

const modalTitle = computed(() => (isEdit.value ? '编辑用户' : '新增用户'))

const formRules: Record<string, Rule[]> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20个字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20个字符', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }],
  phone: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }],
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    // 构建查询参数，过滤掉空值
    const params: UserQueryParams = {
      page: pagination.current - 1, // 后端页码从0开始
      size: pagination.pageSize,
    }

    // 只添加有值的搜索条件
    if (searchForm.username) params.username = searchForm.username
    if (searchForm.displayName) params.displayName = searchForm.displayName
    if (searchForm.email) params.email = searchForm.email
    if (searchForm.enabled !== undefined) {
      params.enabled = searchForm.enabled === 'true' ? true : searchForm.enabled === 'false' ? false : undefined
    }

    console.log('加载用户列表，参数:', params)
    const response = await getUserPage(params)

    console.log('用户列表响应:', response)

    if (response.code === 200 && response.data) {
      dataSource.value = response.data.content || []
      pagination.total = response.data.totalElements || 0
      console.log('加载成功，共', pagination.total, '条数据')
    } else {
      message.error(response.message || '加载用户列表失败')
    }
  } catch (error: any) {
    console.error('加载用户列表失败:', error)
    message.error(error.message || '加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
function handleSearch() {
  pagination.current = 1
  loadData()
}

// 重置搜索
function handleResetSearch() {
  searchForm.username = undefined
  searchForm.displayName = undefined
  searchForm.email = undefined
  searchForm.enabled = undefined
  pagination.current = 1
  loadData()
}

// 刷新
function handleReset() {
  loadData()
}

// 表格变化
function handleTableChange(pag: any) {
  pagination.current = pag.current
  pagination.pageSize = pag.pageSize
  loadData()
}

// 新增
function handleCreate() {
  isEdit.value = false
  Object.assign(formData, {
    id: undefined,
    username: '',
    password: '',
    displayName: '',
    email: '',
    phone: '',
    enabled: true,
  })
  formRef.value?.clearValidate()
  modalVisible.value = true
}

// 编辑
function handleEdit(record: User) {
  isEdit.value = true
  Object.assign(formData, {
    id: record.id,
    username: record.username,
    displayName: record.displayName,
    email: record.email,
    phone: record.phone,
    enabled: record.enabled ?? true,
  })
  formRef.value?.clearValidate()
  modalVisible.value = true
}

// 删除
async function handleDelete(record: User) {
  if (!record.id) {
    message.warning('用户ID不存在')
    return
  }

  try {
    console.log('删除用户:', record.id)
    const response = await deleteUser(record.id)

    if (response.code === 200) {
      message.success('删除成功')
      // 如果当前页只有一条数据且不是第一页，则返回上一页
      if (dataSource.value.length === 1 && pagination.current > 1) {
        pagination.current--
      }
      loadData()
    } else {
      message.error(response.message || '删除失败')
    }
  } catch (error: any) {
    console.error('删除用户失败:', error)
    message.error(error.message || '删除失败')
  }
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    if (isEdit.value && formData.id) {
      // 编辑用户
      const updateData: Partial<User> = {
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        enabled: formData.enabled,
      }

      console.log('更新用户:', formData.id, updateData)
      const response = await updateUser(formData.id, updateData)

      if (response.code === 200) {
        message.success('更新成功')
        modalVisible.value = false
        loadData()
      } else {
        message.error(response.message || '更新失败')
      }
    } else {
      // 新增用户
      const createData: User = {
        username: formData.username,
        password: formData.password,
        displayName: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        enabled: formData.enabled,
      }

      console.log('创建用户:', createData)
      const response = await createUser(createData)

      if (response.code === 200) {
        message.success('创建成功')
        modalVisible.value = false
        loadData()
      } else {
        message.error(response.message || '创建失败')
      }
    }
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      message.warning('请检查表单填写')
    } else {
      console.error('提交表单失败:', error)
      message.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

// 取消
function handleCancel() {
  modalVisible.value = false
  formRef.value?.resetFields()
}

// 初始化
onMounted(() => {
  console.log('用户管理组件已挂载，开始加载数据')
  loadData()
})
</script>

<style scoped>
.user-management-component {
  width: 100%;
  min-height: 400px;
}

.search-bar {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.user-table {
  margin-top: 16px;
}

:deep(.ant-form-inline .ant-form-item) {
  margin-bottom: 8px;
}

:deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}

:deep(.ant-card-head) {
  border-bottom: 1px solid #f0f0f0;
}

:deep(.ant-card-body) {
  padding: 24px;
}
</style>
