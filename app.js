App({
  onLaunch: function () {
    this.login()
  },
  
  onShow: function () {
    console.log('App Show')
  },
  
  onHide: function () {
    console.log('App Hide')
  },
  
  globalData: {
    userInfo: null,
    userId: null,
    baseUrl: 'http://localhost:8087/api'
  },
  
  getUserId: function() {
    return this.globalData.userId || wx.getStorageSync('userId') || 'test_user_1'
  },
  
  login: function() {
    wx.login({
      success: (res) => {
        if (res.code) {
          this.getUserInfo(res.code)
        } else {
          console.log('登录失败！' + res.errMsg)
        }
      }
    })
  },
  
  getUserInfo: function(code) {
    wx.getUserProfile({
      desc: '用于登录验证',
      success: (res) => {
        this.globalData.userInfo = res.userInfo
        this.loginToServer(code, res.userInfo)
      }
    })
  },
  
  loginToServer: function(code, userInfo) {
    wx.request({
      url: this.globalData.baseUrl + '/auth/login',
      method: 'POST',
      data: {
        code: code,
        nickname: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.globalData.userId = res.data.data.id
          wx.setStorageSync('userId', res.data.data.id)
        }
      },
      fail: (err) => {
        console.log('登录失败', err)
      }
    })
  }
})