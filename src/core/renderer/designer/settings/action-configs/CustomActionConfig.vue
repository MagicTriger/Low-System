<template>
  <div class="custom-action-config">
    <a-form :model="formData" layout="vertical">
      <a-form-item label="自定义脚本" required>
        <a-textarea
          v-model:value="formData.script"
          placeholder="// 编写自定义 JavaScript 代码&#10;// 可用变量:&#10;// - context: 当前上下文数据&#10;// - event: 触发事件对象&#10;// - control: 当前控件&#10;&#10;console.log('执行自定义脚本', context);"
          :rows="15"
          style="font-family: 'Consolas', 'Monaco', monospace"
        />
        <template #extra>
          <span class="form-hint">编写 JavaScript 代码，可访问 context、event、control 等变量</span>
        </template>
      </a-form-item>

      <a-alert
        message="提示"
        description="自定义脚本在运行时执行，请确保代码安全可靠。可以使用 async/await 处理异步操作。"
        type="info"
        show-icon
        style="margin-bottom: 16px"
      />

      <a-collapse>
        <a-collapse-panel key="1" header="可用 API 参考">
          <div class="api-reference">
            <h4>上下文对象 (context)</h4>
            <ul>
              <li><code>context.data</code> - 当前页面数据</li>
              <li><code>context.state</code> - 当前状态</li>
              <li><code>context.params</code> - 路由参数</li>
            </ul>

            <h4>事件对象 (event)</h4>
            <ul>
              <li><code>event.type</code> - 事件类型</li>
              <li><code>event.target</code> - 事件目标</li>
              <li><code>event.data</code> - 事件数据</li>
            </ul>

            <h4>控件对象 (control)</h4>
            <ul>
              <li><code>control.id</code> - 控件 ID</li>
              <li><code>control.props</code> - 控件属性</li>
              <li><code>control.value</code> - 控件值</li>
            </ul>

            <h4>工具函数</h4>
            <ul>
              <li><code>message.success(msg)</code> - 显示成功消息</li>
              <li><code>message.error(msg)</code> - 显示错误消息</li>
              <li><code>navigate(path, query)</code> - 页面导航</li>
              <li><code>openOverlay(id, params)</code> - 打开浮层</li>
              <li><code>closeOverlay(id)</code> - 关闭浮层</li>
            </ul>
          </div>
        </a-collapse-panel>

        <a-collapse-panel key="2" header="示例代码">
          <div class="code-examples">
            <h4>示例 1: 显示消息</h4>
            <pre><code>message.success('操作成功！');</code></pre>

            <h4>示例 2: 访问上下文数据</h4>
            <pre><code>const userId = context.params.id;
console.log('当前用户ID:', userId);</code></pre>

            <h4>示例 3: 异步操作</h4>
            <pre><code>const response = await fetch('/api/data');
const data = await response.json();
message.success('数据加载成功');</code></pre>

            <h4>示例 4: 打开浮层</h4>
            <pre><code>openOverlay('user-detail', {
  userId: context.selectedId
});</code></pre>
          </div>
        </a-collapse-panel>
      </a-collapse>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

interface Props {
  modelValue: any
  resourceCode?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const formData = ref({
  script: '',
})

// 初始化
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...props.modelValue }
  }
})

// 监听表单变化
watch(
  formData,
  newValue => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)
</script>

<style scoped>
.custom-action-config {
  padding: 16px 0;
}

.form-hint {
  font-size: 12px;
  color: #999;
}

.api-reference,
.code-examples {
  font-size: 13px;
}

.api-reference h4,
.code-examples h4 {
  margin-top: 12px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
}

.api-reference ul {
  margin: 0;
  padding-left: 20px;
}

.api-reference li {
  margin: 4px 0;
}

.api-reference code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', monospace;
}

.code-examples pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  margin: 8px 0;
}

.code-examples code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
}
</style>
