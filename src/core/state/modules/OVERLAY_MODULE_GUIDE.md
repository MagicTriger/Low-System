# Overlay State Module Guide

## Overview

The Overlay State Module manages the state of overlay components (modals, dialogs, drawers) in the application. It provides:

- **State Management**: Track open/closed state of overlays
- **Parameter Injection**: Pass data to overlays when opening
- **Return Data Handling**: Receive data back from overlays
- **Multiple Overlays**: Support multiple overlays open simultaneously
- **Lifecycle Hooks**: Execute actions on open/close events

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Overlay State Module                      │
├─────────────────────────────────────────────────────────────┤
│  State:                                                       │
│  - openOverlays: Map<string, OverlayInstance>                │
│  - overlayParams: Map<string, any>                           │
│  - overlayReturnData: Map<string, any>                       │
│  - overlayStack: string[]                                    │
├─────────────────────────────────────────────────────────────┤
│  Actions:                                                     │
│  - openOverlay(params)                                        │
│  - closeOverlay(params)                                       │
│  - updateOverlayContext(params)                               │
│  - setOverlayReturnData(payload)                              │
│  - getOverlayReturnData(overlayId)                            │
│  - clearOverlayReturnData(overlayId)                          │
│  - clearAllOverlays()                                         │
├─────────────────────────────────────────────────────────────┤
│  Getters:                                                     │
│  - openOverlays                                               │
│  - openOverlayCount                                           │
│  - isOverlayOpen(overlayId)                                   │
│  - getOverlayInstance(overlayId)                              │
│  - getOverlayParams(overlayId)                                │
│  - getOverlayContext(overlayId)                               │
│  - currentOverlay                                             │
│  - currentOverlayId                                           │
│  - overlayStack                                               │
│  - getOverlayReturnData(overlayId)                            │
│  - hasOpenOverlays                                            │
└─────────────────────────────────────────────────────────────┘
```

## Data Structures

### OverlayInstance

```typescript
interface OverlayInstance {
  id: string // Unique overlay identifier
  config: OverlayConfig // Overlay configuration
  context: any // Context data (parameters)
  createdAt: number // Creation timestamp
  parentContext?: any // Parent page context reference
  onReturn?: (data: any) => void // Return data callback
  onClose?: (data?: any) => void // Close callback
}
```

### OverlayState

```typescript
interface OverlayState {
  openOverlays: Map<string, OverlayInstance> // Open overlay instances
  overlayParams: Map<string, any> // Overlay parameters
  overlayReturnData: Map<string, any> // Return data from overlays
  overlayStack: string[] // Stack of overlay IDs (order)
}
```

## Usage Examples

### 1. Opening an Overlay

```typescript
import { stateManager } from '@/core/state/StateManager'

// Open an overlay with parameters
await stateManager.dispatch('overlay/openOverlay', {
  id: 'user-form-overlay',
  config: {
    id: 'user-form-overlay',
    name: 'User Form',
    title: 'Edit User',
    width: 600,
    height: 400,
    closable: true,
    maskClosable: false,
    controls: [
      /* ... */
    ],
    onOpen: [
      /* event actions */
    ],
    onClose: [
      /* event actions */
    ],
  },
  params: {
    userId: 123,
    mode: 'edit',
  },
  parentContext: {
    pageId: 'user-list',
    refreshList: () => {
      /* ... */
    },
  },
  onReturn: data => {
    console.log('Overlay returned data:', data)
    // Handle returned data
  },
  onClose: data => {
    console.log('Overlay closed with data:', data)
    // Handle close event
  },
})
```

### 2. Closing an Overlay

```typescript
// Close specific overlay with return data
await stateManager.dispatch('overlay/closeOverlay', {
  id: 'user-form-overlay',
  returnData: {
    success: true,
    user: { id: 123, name: 'John Doe' },
  },
})

// Close current overlay (top of stack)
await stateManager.dispatch('overlay/closeOverlay', {
  returnData: { cancelled: true },
})

// Close without return data
await stateManager.dispatch('overlay/closeOverlay', {
  id: 'user-form-overlay',
})
```

### 3. Updating Overlay Context

```typescript
// Update overlay context dynamically
stateManager.dispatch('overlay/updateOverlayContext', {
  id: 'user-form-overlay',
  context: {
    step: 2,
    validationErrors: [],
  },
})
```

### 4. Setting Return Data

```typescript
// Set return data from within the overlay
stateManager.dispatch('overlay/setOverlayReturnData', {
  id: 'user-form-overlay',
  data: {
    formData: { name: 'John', email: 'john@example.com' },
    isValid: true,
  },
})
```

### 5. Checking Overlay State

```typescript
// Check if overlay is open
const isOpen = stateManager.getGetters()['overlay/isOverlayOpen']('user-form-overlay')

// Get overlay instance
const instance = stateManager.getGetters()['overlay/getOverlayInstance']('user-form-overlay')

// Get overlay parameters
const params = stateManager.getGetters()['overlay/getOverlayParams']('user-form-overlay')

// Get overlay context
const context = stateManager.getGetters()['overlay/getOverlayContext']('user-form-overlay')

// Get current overlay (top of stack)
const currentOverlay = stateManager.getGetters()['overlay/currentOverlay']

// Get number of open overlays
const count = stateManager.getGetters()['overlay/openOverlayCount']

// Check if any overlays are open
const hasOpen = stateManager.getGetters()['overlay/hasOpenOverlays']
```

### 6. Using in Vue Components

```vue
<template>
  <div>
    <button @click="openUserForm">Edit User</button>

    <!-- Overlay component -->
    <a-modal v-model:open="isOverlayOpen" :title="overlayTitle" :width="overlayWidth" @ok="handleOk" @cancel="handleCancel">
      <!-- Overlay content -->
      <div v-if="overlayContext">
        <p>User ID: {{ overlayContext.userId }}</p>
        <p>Mode: {{ overlayContext.mode }}</p>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStateManager } from '@/core/state/composables'

const stateManager = useStateManager()

// Computed properties
const isOverlayOpen = computed(() => stateManager.getGetters()['overlay/isOverlayOpen']('user-form-overlay'))

const overlayInstance = computed(() => stateManager.getGetters()['overlay/getOverlayInstance']('user-form-overlay'))

const overlayTitle = computed(() => overlayInstance.value?.config.title)
const overlayWidth = computed(() => overlayInstance.value?.config.width)
const overlayContext = computed(() => overlayInstance.value?.context)

// Methods
async function openUserForm() {
  await stateManager.dispatch('overlay/openOverlay', {
    id: 'user-form-overlay',
    config: {
      id: 'user-form-overlay',
      name: 'User Form',
      title: 'Edit User',
      width: 600,
      controls: [],
    },
    params: {
      userId: 123,
      mode: 'edit',
    },
    onReturn: data => {
      console.log('Form submitted:', data)
      // Refresh user list or update UI
    },
  })
}

async function handleOk() {
  // Set return data and close
  await stateManager.dispatch('overlay/setOverlayReturnData', {
    id: 'user-form-overlay',
    data: {
      success: true,
      formData: {
        /* ... */
      },
    },
  })

  await stateManager.dispatch('overlay/closeOverlay', {
    id: 'user-form-overlay',
  })
}

async function handleCancel() {
  await stateManager.dispatch('overlay/closeOverlay', {
    id: 'user-form-overlay',
    returnData: { cancelled: true },
  })
}
</script>
```

## Integration with Event System

The overlay module is designed to work with the event execution system:

```typescript
// Event action to open overlay
{
  type: 'OPEN_OVERLAY',
  config: {
    overlayId: 'user-form-overlay',
    overlayParams: {
      userId: '${context.selectedUserId}',
      mode: 'edit'
    }
  },
  onSuccess: [
    // Actions to execute after overlay opens
  ],
  onError: [
    // Actions to execute if opening fails
  ]
}

// Event action to close overlay
{
  type: 'CLOSE_OVERLAY',
  config: {
    overlayId: 'user-form-overlay',
    returnData: {
      success: true
    }
  }
}
```

## Lifecycle Hooks

Overlays support lifecycle hooks that execute event actions:

```typescript
const overlayConfig = {
  id: 'user-form-overlay',
  name: 'User Form',
  onOpen: [
    // Event actions to execute when overlay opens
    {
      type: 'DATA_SOURCE',
      config: {
        dataSourceId: 'user-api',
        operationType: 'READ',
        operationParams: {
          id: '${context.userId}',
        },
      },
    },
  ],
  onClose: [
    // Event actions to execute when overlay closes
    {
      type: 'DATA_SOURCE',
      config: {
        dataSourceId: 'user-list',
        operationType: 'QUERY',
      },
    },
  ],
}
```

## Multiple Overlays

The module supports multiple overlays open simultaneously:

```typescript
// Open first overlay
await stateManager.dispatch('overlay/openOverlay', {
  id: 'overlay-1',
  config: {
    /* ... */
  },
  params: {
    /* ... */
  },
})

// Open second overlay on top
await stateManager.dispatch('overlay/openOverlay', {
  id: 'overlay-2',
  config: {
    /* ... */
  },
  params: {
    /* ... */
  },
})

// Get overlay stack
const stack = stateManager.getGetters()['overlay/overlayStack']
// => ['overlay-1', 'overlay-2']

// Get current overlay (top of stack)
const current = stateManager.getGetters()['overlay/currentOverlay']
// => OverlayInstance for 'overlay-2'

// Close current overlay (overlay-2)
await stateManager.dispatch('overlay/closeOverlay')

// Now overlay-1 is current
```

## Error Handling

The module includes comprehensive error handling:

```typescript
try {
  await stateManager.dispatch('overlay/openOverlay', {
    id: 'user-form-overlay',
    config: {
      /* ... */
    },
    params: {
      /* ... */
    },
  })
} catch (error) {
  console.error('Failed to open overlay:', error)
  // Handle error (show message, etc.)
}

// Callbacks also handle errors
await stateManager.dispatch('overlay/openOverlay', {
  id: 'user-form-overlay',
  config: {
    /* ... */
  },
  onReturn: data => {
    try {
      // Process return data
    } catch (error) {
      console.error('Error processing return data:', error)
    }
  },
  onClose: data => {
    try {
      // Handle close
    } catch (error) {
      console.error('Error handling close:', error)
    }
  },
})
```

## Best Practices

### 1. Use Unique Overlay IDs

```typescript
// Good: Unique, descriptive IDs
'user-form-overlay'
'confirm-delete-overlay'
'image-preview-overlay'

// Bad: Generic or duplicate IDs
'overlay'
'modal-1'
```

### 2. Clean Up Return Data

```typescript
// After retrieving return data, clean it up
const returnData = await stateManager.dispatch('overlay/getOverlayReturnData', 'user-form-overlay')
if (returnData) {
  // Process data
  processData(returnData)

  // Clean up
  stateManager.dispatch('overlay/clearOverlayReturnData', 'user-form-overlay')
}
```

### 3. Handle Parent Context Carefully

```typescript
// Pass only necessary parent context
await stateManager.dispatch('overlay/openOverlay', {
  id: 'user-form-overlay',
  config: {
    /* ... */
  },
  parentContext: {
    // Only pass what's needed
    pageId: 'user-list',
    refreshList: () => {
      /* ... */
    },
  },
  // Don't pass entire page state
})
```

### 4. Use Callbacks for Communication

```typescript
// Use callbacks for parent-child communication
await stateManager.dispatch('overlay/openOverlay', {
  id: 'user-form-overlay',
  config: {
    /* ... */
  },
  onReturn: data => {
    // Handle data returned from overlay
    if (data.success) {
      refreshUserList()
      showSuccessMessage()
    }
  },
  onClose: () => {
    // Handle overlay close
    resetSelection()
  },
})
```

### 5. Clear All Overlays on Navigation

```typescript
// In router navigation guard or page unmount
router.beforeEach((to, from, next) => {
  // Clear all overlays when navigating away
  stateManager.dispatch('overlay/clearAllOverlays')
  next()
})
```

## Testing

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { StateManager } from '@/core/state/StateManager'
import { overlayModule } from './overlay'

describe('Overlay Module', () => {
  let stateManager: StateManager

  beforeEach(() => {
    stateManager = new StateManager()
    stateManager.registerModule(overlayModule)
  })

  it('should open overlay', async () => {
    await stateManager.dispatch('overlay/openOverlay', {
      id: 'test-overlay',
      config: {
        id: 'test-overlay',
        name: 'Test',
        controls: [],
      },
      params: { test: true },
    })

    const isOpen = stateManager.getGetters()['overlay/isOverlayOpen']('test-overlay')
    expect(isOpen).toBe(true)
  })

  it('should close overlay', async () => {
    await stateManager.dispatch('overlay/openOverlay', {
      id: 'test-overlay',
      config: { id: 'test-overlay', name: 'Test', controls: [] },
    })

    await stateManager.dispatch('overlay/closeOverlay', {
      id: 'test-overlay',
    })

    const isOpen = stateManager.getGetters()['overlay/isOverlayOpen']('test-overlay')
    expect(isOpen).toBe(false)
  })

  it('should manage multiple overlays', async () => {
    await stateManager.dispatch('overlay/openOverlay', {
      id: 'overlay-1',
      config: { id: 'overlay-1', name: 'First', controls: [] },
    })

    await stateManager.dispatch('overlay/openOverlay', {
      id: 'overlay-2',
      config: { id: 'overlay-2', name: 'Second', controls: [] },
    })

    const count = stateManager.getGetters()['overlay/openOverlayCount']
    expect(count).toBe(2)

    const currentId = stateManager.getGetters()['overlay/currentOverlayId']
    expect(currentId).toBe('overlay-2')
  })
})
```

## Troubleshooting

### Overlay Not Opening

1. Check if overlay ID is unique
2. Verify overlay config is valid
3. Check console for error messages
4. Ensure StateManager is initialized

### Return Data Not Received

1. Verify `onReturn` callback is provided
2. Check if `setOverlayReturnData` is called
3. Ensure overlay ID matches
4. Check callback execution errors in console

### Multiple Overlays Conflicting

1. Use unique IDs for each overlay
2. Check overlay stack order
3. Verify z-index in CSS
4. Use `currentOverlay` getter to identify active overlay

## Migration from Old System

If migrating from a previous overlay system:

```typescript
// Old way
openModal('user-form', { userId: 123 })

// New way
await stateManager.dispatch('overlay/openOverlay', {
  id: 'user-form-overlay',
  config: overlayConfigs['user-form'],
  params: { userId: 123 },
})
```

## Related Documentation

- [State Management Guide](../README.md)
- [Event System Guide](../../engines/EVENT_EXECUTOR_GUIDE.md)
- [Overlay API](../../api/overlay.ts)
- [Design Document](.kiro/specs/api-datasource-unification/design.md)
