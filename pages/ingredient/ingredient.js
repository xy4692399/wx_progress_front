const app = getApp()

Page({
  data: {
    filterStartDate: '',
    filterEndDate: '',
    formData: {
      ingredientName: '',
      purchaseDate: '',
      unitPrice: '',
      quantity: '',
      totalPrice: '',
      supplier: ''
    },
    records: [],
    ranking: [],
    showModal: false,
    selectedRecord: null
  },

  onLoad: function () {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    this.setData({
      'formData.purchaseDate': dateStr,
      filterStartDate: dateStr,
      filterEndDate: dateStr
    })
    this.loadRecords()
    this.loadRanking()
  },

  onShow: function () {
    this.loadRecords()
    this.loadRanking()
  },

  onDateChange: function (e) {
    this.setData({
      'formData.purchaseDate': e.detail.value
    })
  },

  onStartDateChange: function (e) {
    this.setData({
      filterStartDate: e.detail.value
    })
    this.loadRecords()
  },

  onEndDateChange: function (e) {
    this.setData({
      filterEndDate: e.detail.value
    })
    this.loadRecords()
  },

  onIngredientNameInput: function (e) {
    this.setData({
      'formData.ingredientName': e.detail.value
    })
  },

  onUnitPriceInput: function (e) {
    this.setData({
      'formData.unitPrice': e.detail.value
    })
    this.calculateTotal()
  },

  onQuantityInput: function (e) {
    this.setData({
      'formData.quantity': e.detail.value
    })
    this.calculateTotal()
  },

  onSupplierInput: function (e) {
    this.setData({
      'formData.supplier': e.detail.value
    })
  },

  loadRecords: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.request({
      url: app.globalData.baseUrl + '/ingredient/list',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        startDate: this.data.filterStartDate,
        endDate: this.data.filterEndDate
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

  loadRanking: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.request({
      url: app.globalData.baseUrl + '/ingredient/ranking',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      data: {
        startDate: this.data.filterStartDate,
        endDate: this.data.filterEndDate
      },
      success: (res) => {
        if (res.data.code === 200) {
          const data = res.data.data
          const total = Object.values(data).reduce((sum, val) => sum + parseFloat(val), 0)
          const ranking = Object.entries(data).map(([name, amount]) => ({
            name: name,
            amount: parseFloat(amount),
            percent: total > 0 ? (parseFloat(amount) / total * 100).toFixed(0) : 0
          })).sort((a, b) => b.amount - a.amount).slice(0, 5)
          this.setData({
            ranking: ranking
          })
        }
      }
    })
  },

  calculateTotal: function () {
    const unitPrice = parseFloat(this.data.formData.unitPrice) || 0
    const quantity = parseFloat(this.data.formData.quantity) || 0
    const totalPrice = (unitPrice * quantity).toFixed(2)
    this.setData({
      'formData.totalPrice': totalPrice
    })
  },

  submitForm: function () {
    const userId = app.getUserId()

    if (!this.data.formData.ingredientName) {
      wx.showToast({
        title: '请输入食材名称',
        icon: 'none'
      })
      return
    }

    if (!this.data.formData.totalPrice) {
      wx.showToast({
        title: '请填写单价和数量',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: app.globalData.baseUrl + '/ingredient/add',
      method: 'POST',
      header: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      },
      data: {
        ingredientName: this.data.formData.ingredientName,
        purchaseDate: this.data.formData.purchaseDate,
        unitPrice: parseFloat(this.data.formData.unitPrice),
        quantity: parseFloat(this.data.formData.quantity),
        totalPrice: parseFloat(this.data.formData.totalPrice),
        supplier: this.data.formData.supplier
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.setData({
            'formData.ingredientName': '',
            'formData.unitPrice': '',
            'formData.quantity': '',
            'formData.totalPrice': '',
            'formData.supplier': ''
          })
          this.loadRecords()
          this.loadRanking()
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
      url: app.globalData.baseUrl + '/ingredient/delete/' + this.data.selectedRecord.id,
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
          this.loadRanking()
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
    if (!value) return '0.00'
    return parseFloat(value).toFixed(2)
  }
})