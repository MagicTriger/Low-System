// 移动端控件导出
export { default as MobileContainer } from './MobileContainer.vue'
export { default as MobileList } from './MobileList.vue'

// 移动端控件类型定义
export interface MobileContainerProps {
  title?: string
  showHeader?: boolean
  showFooter?: boolean
  showBackButton?: boolean
  showMenuButton?: boolean
  backgroundColor?: string
  headerColor?: string
  footerColor?: string
  borderRadius?: string
  showBorder?: boolean
  orientation?: 'portrait' | 'landscape'
}

export interface MobileListItem {
  id?: string | number
  key?: string | number
  title?: string
  name?: string
  label?: string
  description?: string
  subtitle?: string
  desc?: string
  extra?: string
  time?: string
  count?: string | number
  avatar?: string
  image?: string
  icon?: string
  actions?: MobileListAction[]
  disabled?: boolean
  backgroundColor?: string
  [key: string]: any
}

export interface MobileListAction {
  key: string
  text: string
  type?: 'primary' | 'default' | 'text' | 'link'
  size?: 'small' | 'middle' | 'large'
  disabled?: boolean
}

export interface MobileListProps {
  data?: MobileListItem[]
  showSearch?: boolean
  showAvatar?: boolean
  showDescription?: boolean
  showExtra?: boolean
  showArrow?: boolean
  showActions?: boolean
  showLoadMore?: boolean
  hasMore?: boolean
  emptyText?: string
  loadMoreText?: string
  avatarSize?: 'small' | 'default' | 'large' | number
  avatarShape?: 'circle' | 'square'
  itemHeight?: string | number
  divider?: boolean
  maxHeight?: string | number
  backgroundColor?: string
}

// 移动端控件配置
export const MobileControlConfigs = {
  MobileContainer: {
    name: '移动端容器',
    icon: 'mobile',
    category: 'mobile',
    defaultProps: {
      title: '移动端页面',
      showHeader: true,
      showFooter: false,
      showBackButton: false,
      showMenuButton: false,
      backgroundColor: '#f5f5f5',
      headerColor: '#ffffff',
      footerColor: '#ffffff',
      borderRadius: '12px',
      showBorder: true,
      orientation: 'portrait',
      width: '375px',
      height: '667px'
    }
  },
  MobileList: {
    name: '移动端列表',
    icon: 'unordered-list',
    category: 'mobile',
    defaultProps: {
      showSearch: false,
      showAvatar: true,
      showDescription: true,
      showExtra: false,
      showArrow: true,
      showActions: false,
      showLoadMore: false,
      hasMore: false,
      emptyText: '暂无数据',
      loadMoreText: '加载更多',
      avatarSize: 'default',
      avatarShape: 'circle',
      itemHeight: 'auto',
      divider: true,
      backgroundColor: '#ffffff',
      data: [
        {
          id: 1,
          title: '列表项目 1',
          description: '这是第一个列表项目的描述信息',
          avatar: '',
          extra: '刚刚'
        },
        {
          id: 2,
          title: '列表项目 2',
          description: '这是第二个列表项目的描述信息',
          avatar: '',
          extra: '5分钟前'
        },
        {
          id: 3,
          title: '列表项目 3',
          description: '这是第三个列表项目的描述信息',
          avatar: '',
          extra: '1小时前'
        }
      ]
    }
  }
}

// 移动端设备预设
export const MobileDevicePresets = {
  iPhone12: {
    name: 'iPhone 12',
    width: '390px',
    height: '844px',
    orientation: 'portrait'
  },
  iPhone12Landscape: {
    name: 'iPhone 12 横屏',
    width: '844px',
    height: '390px',
    orientation: 'landscape'
  },
  AndroidPhone: {
    name: 'Android 手机',
    width: '360px',
    height: '640px',
    orientation: 'portrait'
  },
  AndroidPhoneLandscape: {
    name: 'Android 手机横屏',
    width: '640px',
    height: '360px',
    orientation: 'landscape'
  },
  iPad: {
    name: 'iPad',
    width: '768px',
    height: '1024px',
    orientation: 'portrait'
  },
  iPadLandscape: {
    name: 'iPad 横屏',
    width: '1024px',
    height: '768px',
    orientation: 'landscape'
  }
}