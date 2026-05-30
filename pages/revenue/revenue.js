const app = getApp()

Page({
  data: {
    channels: ['美团外卖', '饿了么外卖', '美团团购/到店', '私域微信接单', '堂食现金', '其他收入'],
    channelIndex: 0,
    filterStartDate: '',
    filterEndDate: '',
    formData: {
      recordDate: '',
      channel: '',
      amount: '',
      remark: ''
    },
    records: [],
    showModal: false,
    selectedRecord: null
  },

  onLoad: function () {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const firstDay = `${year}-${month.toString().padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]
    
    this.setData({
      'formData.recordDate': dateStr,
      'formData.channel': this.data.channels[0],
      filterStartDate: firstDay,
      filterEndDate: lastDay
    })
    this.loadRecords()
  },

  onShow: function () {
    this.loadRecords()
  },

  onDateChange: function (e) {
    this.setData({
      'formData.recordDate': e.detail.value
    })
  },

  onChannelChange: function (e) {
    const index = e.detail.value
    this.setData({
      channelIndex: index,
      'formData.channel': this.data.channels[index]
    })
  },

  onFilterStartDateChange: function (e) {
    this.setData({
      filterStartDate: e.detail.value
    })
    this.loadRecords()
  },
  
  onFilterEndDateChange: function (e) {
    this.setData({
      filterEndDate: e.detail.value
    })
    this.loadRecords()
  },

  onAmountInput: function (e) {
    this.setData({
      'formData.amount': e.detail.value
    })
  },

  onRemarkInput: function (e) {
    this.setData({
      'formData.remark': e.detail.value
    })
  },

  loadRecords: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 'test_user_1'
    
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const defaultStartDate = `${year}-${month.toString().padStart(2, '0')}-01`
    const defaultEndDate = new Date(year, month, 0).toISOString().split('T')[0]
    
    const startDate = this.data.filterStartDate || defaultStartDate
    const endDate = this.data.filterEndDate || defaultEndDate
    
    console.log('营收记录查询 - 用户ID:', userId, '起始日期:', startDate, '结束日期:', endDate)

    wx.request({
      url: app.globalData.baseUrl + '/revenue/list',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        startDate: startDate,
        endDate: endDate
      },
      success: (res) => {
        if (res.data.code === 200) {
          const records = (res.data.data || []).map(record => ({
            ...record,
            channelName: this.getChannelName(record.channel),
            amountFormatted: this.formatMoney(record.amount)
          }))
          this.setData({
            records: records
          })
        }
      }
    })
  },

  submitForm: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 'test_user_1'
    
    console.log('当前用户ID:', userId)

    if (!this.data.formData.amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }

    const requestData = {
        userId: userId,
        recordDate: this.data.formData.recordDate,
        channel: this.data.formData.channel,
        amount: parseFloat(this.data.formData.amount),
        remark: this.data.formData.remark || ''
      }
      console.log('请求数据:', requestData)
      
      wx.request({
      url: app.globalData.baseUrl + '/revenue/add',
      method: 'POST',
      header: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.setData({
            'formData.amount': '',
            'formData.remark': ''
          })
          this.loadRecords()
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
        }
      }
    })
  },

  showDetail: function (e) {
    const dataset = e.currentTarget.dataset || {}
    const recordIndex = dataset.index
    const record = this.data.records[recordIndex]
    
    const displayRecord = {
      ...record,
      channelName: this.getChannelName(record.channel),
      amountFormatted: this.formatMoney(record.amount)
    }
    
    this.setData({
      selectedRecord: displayRecord,
      showModal: true
    })
  },

  preventClose: function () {},

  closeModal: function () {
    this.setData({
      showModal: false,
      selectedRecord: null
    })
  },

  deleteRecord: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId || !this.data.selectedRecord) return

    wx.request({
      url: app.globalData.baseUrl + '/revenue/delete/' + this.data.selectedRecord.id,
      method: 'DELETE',
      header: {
        'X-User-Id': userId
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          })
          this.closeModal()
          this.loadRecords()
        } else {
          wx.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    })
  },

  formatMoney: function (value) {
    return parseFloat(value).toFixed(2)
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
  }
})