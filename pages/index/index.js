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
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 'test_user_1'
    const date = new Date().toISOString().split('T')[0]
    
    console.log('今日数据查询 - 用户ID:', userId, '日期:', date)

    wx.request({
      url: app.globalData.baseUrl + '/report/daily',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        date: date
      },
      success: (res) => {
        console.log('今日数据响应:', res)
        if (res.data.code === 200) {
          const data = res.data.data.data || res.data.data
          console.log('今日数据:', data)
          
          const channelBreakdown = data.channelBreakdown || {}
      const channelList = []
      const channelColors = {
        '美团外卖': '#52c41a',
        '饿了么外卖': '#1890ff',
        '美团团购/到店': '#722ed1',
        '私域微信接单': '#13c2c2',
        '堂食现金': '#fa8c16',
        '其他收入': '#91caff'
      }
      
      for (const key in channelBreakdown) {
        const amount = channelBreakdown[key]
        const percent = data.totalRevenue > 0 ? (amount / data.totalRevenue * 100).toFixed(0) : 0
        channelList.push({
          key: key,
          name: this.getChannelName(key),
          value: amount,
          formattedValue: this.formatMoney(amount),
          percent: percent,
          color: channelColors[key] || '#FF6B35'
        })
      }
      
      const todayData = {
            totalRevenue: data.totalRevenue || 0,
            totalExpense: data.totalExpense || 0,
            netProfit: data.netProfit || 0,
            totalRevenueFormatted: this.formatMoney(data.totalRevenue),
            totalExpenseFormatted: this.formatMoney(data.totalExpense),
            netProfitFormatted: this.formatMoney(data.netProfit),
            channelBreakdown: channelBreakdown,
            channelList: channelList
          }
          
          this.setData({
            todayData: todayData
          })
        }
      },
      fail: (err) => {
        console.log('今日数据请求失败:', err)
      }
    })
  },

  loadMonthlyData: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 'test_user_1'
    
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    
    console.log('月度数据查询 - 用户ID:', userId, '年份:', year, '月份:', month)

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
        console.log('月度数据响应:', res)
        if (res.data.code === 200) {
          const data = res.data.data.data || res.data.data
          console.log('月度数据:', data)
          
          const monthlyData = {
            totalRevenue: data.totalRevenue || 0,
            totalExpense: data.totalExpense || 0,
            netProfit: data.netProfit || 0,
            totalRevenueFormatted: this.formatMoney(data.totalRevenue),
            totalExpenseFormatted: this.formatMoney(data.totalExpense),
            netProfitFormatted: this.formatMoney(data.netProfit)
          }
          
          this.setData({
            monthlyData: monthlyData
          })
        }
      },
      fail: (err) => {
        console.log('月度数据请求失败:', err)
      }
    })
  },

  formatMoney: function (value) {
    console.log('formatMoney 输入:', value, '类型:', typeof value)
    if (!value && value !== 0) {
      console.log('formatMoney 返回: ¥0.00')
      return '¥0.00'
    }
    const result = '¥' + parseFloat(value).toFixed(2)
    console.log('formatMoney 返回:', result)
    return result
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