import { Module } from 'vuex'

export interface ModalState {
  // 存储所有Modal的状态
  modalStates: Record<
    string,
    {
      visible: boolean
      data?: any
    }
  >
}

const modalModule: Module<ModalState, any> = {
  namespaced: true,

  state: (): ModalState => ({
    modalStates: {},
  }),

  getters: {
    // 获取指定Modal的可见状态
    isModalVisible: state => (modalId: string) => {
      return state.modalStates[modalId]?.visible || false
    },

    // 获取指定Modal的数据
    getModalData: state => (modalId: string) => {
      return state.modalStates[modalId]?.data
    },

    // 获取所有可见的Modal
    getVisibleModals: state => {
      return Object.entries(state.modalStates)
        .filter(([_, modalState]) => modalState.visible)
        .map(([modalId]) => modalId)
    },
  },

  mutations: {
    // 打开Modal
    OPEN_MODAL(state, payload: { modalId: string; data?: any }) {
      state.modalStates[payload.modalId] = {
        visible: true,
        data: payload.data,
      }
    },

    // 关闭Modal
    CLOSE_MODAL(state, modalId: string) {
      if (state.modalStates[modalId]) {
        state.modalStates[modalId].visible = false
      }
    },

    // 更新Modal数据
    UPDATE_MODAL_DATA(state, payload: { modalId: string; data: any }) {
      if (state.modalStates[payload.modalId]) {
        state.modalStates[payload.modalId].data = payload.data
      }
    },

    // 清除Modal状态
    CLEAR_MODAL(state, modalId: string) {
      delete state.modalStates[modalId]
    },

    // 清除所有Modal状态
    CLEAR_ALL_MODALS(state) {
      state.modalStates = {}
    },
  },

  actions: {
    // 打开Modal
    openModal({ commit }, payload: { modalId: string; data?: any }) {
      commit('OPEN_MODAL', payload)
    },

    // 关闭Modal
    closeModal({ commit }, modalId: string) {
      commit('CLOSE_MODAL', modalId)
    },

    // 更新Modal数据
    updateModalData({ commit }, payload: { modalId: string; data: any }) {
      commit('UPDATE_MODAL_DATA', payload)
    },

    // 清除Modal状态
    clearModal({ commit }, modalId: string) {
      commit('CLEAR_MODAL', modalId)
    },

    // 清除所有Modal状态
    clearAllModals({ commit }) {
      commit('CLEAR_ALL_MODALS')
    },
  },
}

export default modalModule
