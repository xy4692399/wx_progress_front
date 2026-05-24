const app = getApp()

Page({
  data: {
    channels: ['美团外卖', '饿了么外卖', '美团团购/到店', '私域微信接单', '堂食现金', '其他收入'],
    channelIndex: 0,
    filterDate: '',
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
    this.setData({
      'formData.recordDate': dateStr,
      'formData.channel': this.data.channels[0],
      filterDate: dateStr
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

  onFilterDateChange: function (e) {
    this.setData({
      filterDate: e.detail.value
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
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.request({
      url: app.globalData.baseUrl + '/revenue/list/by-date',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        date: this.data.filterDate
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            records: res.data.data
          })
        }
      }
    })
  },

  submitForm: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 'dev_user_1'
    
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
    this.setData({
      selectedRecord: record,
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