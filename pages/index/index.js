const app = getApp()

Page({
  data: {
    today: '',
    todayData: {
      totalRevenue: 0,
      totalExpense: 0,
      ingredientCost: 0,
      netProfit: 0,
      channelBreakdown: {}
    },
    monthlyData: {
      totalRevenue: 0,
      totalExpense: 0,
      netProfit: 0
    }
  },

  onLoad: function () {
    this.setToday()
    this.loadTodayData()
    this.loadMonthlyData()
  },

  onShow: function () {
    this.loadTodayData()
    this.loadMonthlyData()
  },

  setToday: function () {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    this.setData({
      today: `${year}年${month}月${day}日`
    })
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

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

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
          this.setData({
            monthlyData: {
              totalRevenue: res.data.data.totalRevenue || 0,
              totalExpense: res.data.data.totalExpense || 0,
              netProfit: res.data.data.netProfit || 0
            }
          })
        }
      }
    })
  },

  formatMoney: function (value) {
    if (!value) return '¥0.00'
    return '¥' + parseFloat(value).toFixed(2)
  },

  getChannelName: function (channel) {
    const channelMap = {
      '美团外卖': '美团外卖',
      '饿了么外卖': '饿了么外卖',
      '美团团购/到店': '美团团购',
      '私域微信接单': '微信接单',
      '堂食现金': '堂食现金',
      '其他收入': '其他'
    }
    return channelMap[channel] || channel
  },

  getChannelPercent: function (amount) {
    const total = this.data.todayData.totalRevenue
    if (!total || total <= 0) return 0
    return (parseFloat(amount) / parseFloat(total) * 100).toFixed(0)
  },

  goToPage: function (e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.switchTab({
        url: url
      })
    }
  },

  get profitClass() {
    return this.data.todayData.netProfit >= 0 ? 'profit-positive' : 'profit-negative'
  }
})