const app = getApp()

Page({
  data: {
    today: '',
    monthValue: '',
    monthText: '',
    todayData: {
      totalRevenue: 0,
      totalExpense: 0,
      netProfit: 0
    },
    monthlyData: {
      totalRevenue: 0,
      totalExpense: 0,
      ingredientCost: 0,
      fixedCost: 0,
      netProfit: 0,
      ingredientCostRatio: 0,
      fixedCostRatio: 0
    },
    channelData: [],
    dailyData: []
  },

  onLoad: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()

    this.setData({
      today: `${year}年${month}月${day}日`,
      monthValue: `${year}-${String(month).padStart(2, '0')}`,
      monthText: `${year}年${month}月`
    })

    this.loadTodayData()
    this.loadMonthlyData()
  },

  onShow: function () {
    this.loadTodayData()
    this.loadMonthlyData()
  },

  onMonthChange: function (e) {
    const date = new Date(e.detail.value)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    this.setData({
      monthValue: e.detail.value,
      monthText: `${year}年${month}月`
    })
    this.loadMonthlyData()
  },

  loadTodayData: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.request({
      url: app.globalData.baseUrl + '/report/daily',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        date: new Date().toISOString().split('T')[0]
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            todayData: res.data.data
          })
        }
      }
    })
  },

  loadMonthlyData: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    const date = new Date(this.data.monthValue)
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    wx.request({
      url: app.globalData.baseUrl + '/report/monthly',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        year: year,
        month: month
      },
      success: (res) => {
        if (res.data.code === 200) {
          const data = res.data.data
          this.setData({
            monthlyData: {
              totalRevenue: data.totalRevenue || 0,
              totalExpense: data.totalExpense || 0,
              ingredientCost: data.ingredientCost || 0,
              fixedCost: data.fixedCost || 0,
              netProfit: data.netProfit || 0,
              ingredientCostRatio: data.ingredientCostRatio || 0,
              fixedCostRatio: data.fixedCostRatio || 0
            },
            dailyData: data.dailySummaries || []
          })
          this.processChannelData(data.channelBreakdown)
        }
      }
    })
  },

  processChannelData: function (channelBreakdown) {
    if (!channelBreakdown) {
      this.setData({
        channelData: []
      })
      return
    }

    const total = Object.values(channelBreakdown).reduce((sum, val) => sum + parseFloat(val), 0)
    const data = Object.entries(channelBreakdown).map(([name, amount]) => ({
      name: this.getChannelName(name),
      amount: parseFloat(amount),
      percent: total > 0 ? Math.round(parseFloat(amount) / total * 100) : 0
    }))
    this.setData({
      channelData: data
    })
  },

  getChannelName: function (channel) {
    const channelMap = {
      '美团外卖': '美团',
      '饿了么外卖': '饿了么',
      '美团团购/到店': '美团团购',
      '私域微信接单': '微信',
      '堂食现金': '堂食',
      '其他收入': '其他'
    }
    return channelMap[channel] || channel
  },

  getPieStyle: function (percent, index) {
    const colors = ['#FF6B35', '#52c41a', '#1890ff', '#722ed1', '#fa8c16', '#13c2c2']
    const angle = (percent / 100) * 360
    return {
      background: colors[index % colors.length],
      transform: `rotate(${index > 0 ? this.getPrevAngle(index) : 0}deg)`,
      clipPath: `polygon(50% 50%, 50% 0%, ${this.getPoint(angle)}%, 50% 100%)`
    }
  },

  getPrevAngle: function (index) {
    let angle = 0
    for (let i = 0; i < index; i++) {
      angle += (this.data.channelData[i].percent / 100) * 360
    }
    return angle
  },

  getPoint: function (angle) {
    const rad = (angle * Math.PI) / 180
    const x = 50 + 50 * Math.sin(rad)
    const y = 50 - 50 * Math.cos(rad)
    return `${x}% ${y}%`
  },

  getColor: function (index) {
    const colors = ['#FF6B35', '#52c41a', '#1890ff', '#722ed1', '#fa8c16', '#13c2c2']
    return colors[index % colors.length]
  },

  formatMoney: function (value) {
    if (!value) return '¥0.00'
    return '¥' + parseFloat(value).toFixed(2)
  },

  formatDate: function (dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  },

  exportData: function () {
    wx.showToast({
      title: '导出功能开发中',
      icon: 'none'
    })
  }
})