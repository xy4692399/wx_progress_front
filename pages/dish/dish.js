const app = getApp()

Page({
  data: {
    formData: {
      dishName: '',
      sellingPrice: '',
      ingredientCost: '',
      dailyAverageSales: '',
      profit: '',
      profitRate: ''
    },
    dishList: [],
    highProfitList: [],
    lowProfitList: [],
    showModal: false,
    selectedDish: null
  },

  onLoad: function () {
    this.loadDishes()
  },

  onShow: function () {
    this.loadDishes()
  },

  onDishNameInput: function (e) {
    this.setData({
      'formData.dishName': e.detail.value
    })
  },

  onSellingPriceInput: function (e) {
    this.setData({
      'formData.sellingPrice': e.detail.value
    })
    this.calculateProfit()
  },

  onIngredientCostInput: function (e) {
    this.setData({
      'formData.ingredientCost': e.detail.value
    })
    this.calculateProfit()
  },

  onDailyAverageSalesInput: function (e) {
    this.setData({
      'formData.dailyAverageSales': e.detail.value
    })
  },

  loadDishes: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId) return

    wx.request({
      url: app.globalData.baseUrl + '/dish/profit-analysis',
      method: 'GET',
      header: {
        'X-User-Id': userId
      },
      success: (res) => {
        if (res.data.code === 200) {
          const dishes = res.data.data
          this.setData({
            dishList: dishes,
            highProfitList: dishes.filter(d => d.profitRate >= 50).sort((a, b) => b.profitRate - a.profitRate).slice(0, 5),
            lowProfitList: dishes.filter(d => d.profitRate < 50).sort((a, b) => a.profitRate - b.profitRate).slice(0, 5)
          })
        }
      }
    })
  },

  calculateProfit: function () {
    const sellingPrice = parseFloat(this.data.formData.sellingPrice) || 0
    const ingredientCost = parseFloat(this.data.formData.ingredientCost) || 0
    const profit = (sellingPrice - ingredientCost).toFixed(2)
    const profitRate = sellingPrice > 0 ? ((profit / sellingPrice) * 100).toFixed(1) : '0'
    this.setData({
      'formData.profit': profit,
      'formData.profitRate': profitRate
    })
  },

  submitForm: function () {
    const userId = app.getUserId()

    if (!this.data.formData.dishName) {
      wx.showToast({
        title: '请输入菜品名称',
        icon: 'none'
      })
      return
    }

    if (!this.data.formData.sellingPrice) {
      wx.showToast({
        title: '请输入售价',
        icon: 'none'
      })
      return
    }

    if (!this.data.formData.ingredientCost) {
      wx.showToast({
        title: '请输入食材成本',
        icon: 'none'
      })
      return
    }

    wx.request({
      url: app.globalData.baseUrl + '/dish/add',
      method: 'POST',
      header: {
        'X-User-Id': userId,
        'Content-Type': 'application/json'
      },
      data: {
        dishName: this.data.formData.dishName,
        sellingPrice: parseFloat(this.data.formData.sellingPrice),
        ingredientCost: parseFloat(this.data.formData.ingredientCost),
        dailyAverageSales: this.data.formData.dailyAverageSales ? parseFloat(this.data.formData.dailyAverageSales) : null
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          })
          this.setData({
            'formData.dishName': '',
            'formData.sellingPrice': '',
            'formData.ingredientCost': '',
            'formData.dailyAverageSales': '',
            'formData.profit': '',
            'formData.profitRate': ''
          })
          this.loadDishes()
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
    const dishIndex = dataset.index
    const dish = this.data.dishList[dishIndex]
    this.setData({
      selectedDish: dish,
      showModal: true
    })
  },

  preventClose: function () {},

  closeModal: function () {
    this.setData({
      showModal: false,
      selectedDish: null
    })
  },

  deleteDish: function () {
    const userId = app.globalData.userId || wx.getStorageSync('userId')
    if (!userId || !this.data.selectedDish) return

    wx.request({
      url: app.globalData.baseUrl + '/dish/delete/' + this.data.selectedDish.id,
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
          this.loadDishes()
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
  },

  getProfitClass: function (rate) {
    if (!rate) return 'profit-normal'
    const numRate = parseFloat(rate)
    if (numRate >= 60) return 'profit-high'
    if (numRate >= 40) return 'profit-normal'
    return 'profit-low'
  }
})