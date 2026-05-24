const app = getApp()

Page({
  data: {
    categories: ['食材采购', '房租物业', '员工工资/提成', '水电燃气杂费', '耗材采购', '其他支出'],
    categoryIndex: 0,
    filterDate: '',
    formData: {
      recordDate: '',
      category: '',
      amount: '',
      ticketUrl: '',
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
      'formData.category': this.data.categories[0],
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

  onCategoryChange: function (e) {
    const index = e.detail.value
    this.setData({
      categoryIndex: index,
      'formData.category': this.data.categories[index]
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

  uploadImage: function () {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.uploadToServer(tempFilePath)
      }
    })
  },

  uploadToServer: function (filePath) {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.uploadFile({
      url: app.globalData.baseUrl + '/file/upload',
      filePath: filePath,
      name: 'file',
      header: {
        'X-User-Id': userId
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          this.setData({
            'formData.ticketUrl': data.data
          })
          wx.showToast({
            title: '上传成功',
            icon: 'success'
          })
        }
      }
    })
  },

  loadRecords: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.request({
      url: app.globalData.baseUrl + '/expense/list/by-date',
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
    const userId = app.getUserId()

    if (!this.data.formData.amount) {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: app.globalData.baseUrl + '/expense/add',
      method: 'POST',
      header: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      },
      data: {
        recordDate: this.data.formData.recordDate,
        category: this.data.formData.category,
        amount: parseFloat(this.data.formData.amount),
        ticketUrl: this.data.formData.ticketUrl,
        remark: this.data.formData.remark
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.setData({
            'formData.amount': '',
            'formData.ticketUrl': '',
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
      url: app.globalData.baseUrl + '/expense/delete/' + this.data.selectedRecord.id,
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

  getCategoryName: function (category) {
    const categoryMap = {
      '食材采购': '食材采购',
      '房租物业': '房租物业',
      '员工工资/提成': '员工工资',
      '水电燃气杂费': '水电杂费',
      '耗材采购': '耗材采购',
      '其他支出': '其他'
    }
    return categoryMap[category] || category
  }
})