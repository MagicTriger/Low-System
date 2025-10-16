/**
 * 状态管理集成
 */

import { StateManager } from '../state/StateManager'
import { registerStateModules } from '../state/modules'
import type { Container } from '../di/Container'
import type { EventBus } from '../events/EventBus'
import type { Logger } from '../logging/Logger'
import type { ApiCompatLayer } from '../compat'
import type { FeatureFlags } from '../features'
import { FEATURE_FLAGS } from '../features'

export interface StateManagementIntegrationConfig {
  useGlobalInstance?: boolean
  registerToCompatLayer?: boolean
  verbose?: boolean
  stateManager?: {
    strict?: boolean
    enableTimeTravel?: boolean
    maxHistorySize?: number
    devtools?: boolean
  }
}

export class StateManagementIntegration {
  private stateManager: StateManager
  private container?: Container
  private eventBus?: EventBus
  private logger?: Logger
  private compatLayer?: ApiCompatLayer
  private featureFlags?: FeatureFlags
  private options: Required<Omit<StateManagementIntegrationConfig, 'stateManager'>>

  constructor(
    integrationConfig: StateManagementIntegrationConfig = {},
    coreServices?: {
      container?: Container
      eventBus?: EventBus
      logger?: Logger
    },
    compatLayer?: ApiCompatLayer,
    featureFlags?: FeatureFlags
  ) {
    this.options = {
      useGlobalInstance: true,
      registerToCompatLayer: true,
      verbose: false,
      ...integrationConfig,
    }

    this.container = coreServices?.container
    this.eventBus = coreServices?.eventBus
    this.logger = coreServices?.logger
    this.compatLayer = compatLayer
    this.featureFlags = featureFlags

    this.stateManager = new StateManager(integrationConfig.stateManager)
  }

  async integrate(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔧 Integrating state management...')
    }

    const shouldIntegrate = !this.featureFlags || this.featureFlags.isEnabled(FEATURE_FLAGS.NEW_STATE_MANAGER)

    if (!shouldIntegrate) {
      console.log('ℹ️  State management integration skipped')
      return
    }

    // 注册状态模块
    if (this.options.verbose) {
      console.log('  📝 Registering state modules...')
    }
    registerStateModules(this.stateManager)
    if (this.options.verbose) {
      console.log('  ✓ State modules registered')
    }

    if (this.container) {
      await this.registerToDIContainer()
    }

    if (this.options.registerToCompatLayer && this.compatLayer) {
      await this.registerToCompatLayer()
    }

    await this.configureEvents()

    this.eventBus?.emit('statemanagement.initialized', {
      stateManager: this.stateManager,
    })

    if (this.options.verbose) {
      console.log('✅ State management integrated successfully')
    }
  }

  private async registerToDIContainer(): Promise<void> {
    if (!this.container) return

    if (this.options.verbose) {
      console.log('  📦 Registering to DI container...')
    }

    this.container.register('StateManager', { useValue: this.stateManager }, { lifetime: 'singleton' as any })

    if (this.options.verbose) {
      console.log('  ✓ Registered to DI container')
    }
  }

  private async registerToCompatLayer(): Promise<void> {
    if (!this.compatLayer) return

    if (this.options.verbose) {
      console.log('  🔄 Registering to compatibility layer...')
    }

    this.compatLayer.registerApi('StateManager', this.stateManager)
    this.addLegacyApiMappings()

    if (this.options.verbose) {
      console.log('  ✓ Registered to compatibility layer')
    }
  }

  private addLegacyApiMappings(): void {
    if (!this.compatLayer) return

    this.compatLayer.addMapping({
      pattern: /^store\.register$/,
      target: async call => {
        const [name, module] = call.args || []
        return this.stateManager.registerModule({ name, ...module })
      },
      advice: {
        oldApi: 'store.register',
        newApi: 'StateManager.registerModule',
        description: 'Use new StateManager',
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    this.compatLayer.addMapping({
      pattern: /^store\.commit$/,
      target: async call => {
        const [type, payload] = call.args || []
        return this.stateManager.commit(type, payload)
      },
      advice: {
        oldApi: 'store.commit',
        newApi: 'StateManager.commit',
        description: 'Use new StateManager',
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    this.compatLayer.addMapping({
      pattern: /^store\.dispatch$/,
      target: async call => {
        const [type, payload] = call.args || []
        return this.stateManager.dispatch(type, payload)
      },
      advice: {
        oldApi: 'store.dispatch',
        newApi: 'StateManager.dispatch',
        description: 'Use new StateManager',
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })
  }

  private async configureEvents(): Promise<void> {
    if (!this.eventBus) return

    if (this.options.verbose) {
      console.log('  🔗 Configuring events...')
    }

    this.stateManager.subscribeMutation((mutation, state) => {
      this.eventBus!.emit('state.mutation', { mutation, state })
      this.logger?.debug('State mutation', { type: mutation.type })
    })

    this.stateManager.subscribeAction((action, state) => {
      this.eventBus!.emit('state.action', { action, state })
      this.logger?.debug('State action', { type: action.type })
    })

    if (this.options.verbose) {
      console.log('  ✓ Events configured')
    }
  }

  getStateManager(): StateManager {
    return this.stateManager
  }
}

export async function integrateStateManagement(
  config: StateManagementIntegrationConfig = {},
  coreServices?: {
    container?: Container
    eventBus?: EventBus
    logger?: Logger
  },
  compatLayer?: ApiCompatLayer,
  featureFlags?: FeatureFlags
): Promise<StateManagementIntegration> {
  const integration = new StateManagementIntegration(config, coreServices, compatLayer, featureFlags)

  await integration.integrate()

  return integration
}
