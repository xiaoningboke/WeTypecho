/* WeTypecho-微信小程序版Typecho
   使用教程：www.2012.pro
   有任何使用问题请联系作者QQ 294351525
*/
var API = require('../../utils/api');
var Tips = require('../../utils/tips');
var Net = require('../../utils/net');

// 获取全局应用程序实例对象
var app = getApp();

// 创建页面实例对象
Page({
    /**
     * 页面名称
     */
    name: "index",
    /**
     * 页面的初始数据
     */
    data: {
        postslist: [],
        swipelist: [],
        topswiper: 'none',
        midposts: 'none',
        allcatslist: [],
        allcatpostlist: [],
        current_cat: 0,
        current_position: 'mid_99999999',
        postheight: '0'
    },
    // 获取轮播数据
    fetchposts() {
        var that = this;
        Net.request({
            url: API.GetSwiperPost(),
            success: function(res) {
                var datas = res.data.data;
                if (API.IsNull(datas)) {
                    that.setData({
                        topswiper: 'block',
                        swipelist: datas.map(function(ori_item) {
                            var item = API.ParseItem(ori_item);
                            return item;
                        })
                    })
                }
            }
        })
    },
    touchmove(e) {},
    // 获取分类
    fetchallcats() {
        var that = this;
        Net.request({
            url: API.GetCat(),
            success: function(res) {
                var datas = res.data.data;
                that.data.allcatslist = datas.map(function(item) {
                    item.id_tag = "mid_" + item.mid;
                    return item;
                });
                that.data.allcatpostlist = datas.map(function(item) {
                    return null;
                });
                if (that.data.allcatslist.length > 0) {
                    that.changeCatex(that.data.allcatslist[0].mid);
                }
                that.setData({
                    allcatslist: that.data.allcatslist
                })
            }
        })
    },
    fetchpostbymid(mid) {
        var that = this;
        var idx = this.getmidindex(mid);
        Net.request({
            url: API.GetPostsbyMID(mid),
            success: function(res) {
                var datas = res.data.data;
                if (datas != null && datas != undefined) {
                    for (let i = 0; i < datas.length; i++) {
                        datas[i].image = "https://www.sunxiaoning.com/usr/uploads/2019/03/3616970405.jpeg"
                        for (let j = 0; j < datas[i].thumb.length; j++) {
                            if (that.checkImage(datas[i].thumb[j].str_value)) {
                                datas[i].image = datas[i].thumb[j].str_value
                                break
                            }
                        }
                    }
                    that.data.allcatpostlist[idx] = datas.map(function(item) {
                        item.posttime = API.getcreatedtime(item.created);
                        return item;
                    });
                    that.setData({
                        allcatpostlist: that.data.allcatpostlist,
                        postheight: that.data.allcatpostlist[idx].length * 170 + 'rpx'
                    })
                } else {
                    wx.showToast({
                        title: '该分类没有文章',
                        image: '../../resources/error1.png',
                        duration: 2000
                    })
                }
            }
        })
    },
    getmidindex(mid) {
        for (var i = 0; i < this.data.allcatslist.length; i++)
            if (mid == this.data.allcatslist[i].mid) {
                return i;
            }
    },
    change_finish(e) {
        var that = this;
        if (e.detail.current != this.data.current_cat) {
            this.changeCatex(this.data.allcatslist[e.detail.current].mid);
            this.setData({
                current_cat: e.detail.current,
                current_position: that.data.allcatslist[e.detail.current].id_tag
            })

        }
    },
    changeCat(e) {
        this.data.current_cat_mid = e.target.dataset.mid;
        var idx = this.getmidindex(this.data.current_cat_mid);
        if (idx != this.data.current_cat) {
            this.setData({
                current_cat: idx
            })
            this.changeCatex(this.data.current_cat_mid);
        }
    },
    changeCatex(mid) {
        this.setData({
            catpostlist: []
        })
        this.data.allcatslist = this.data.allcatslist.map(function(item) {
            if (item.mid == mid)
                item.active = true;
            else
                item.active = false;
            return item;
        })
        this.setData({
            allcatslist: this.data.allcatslist
        })
        this.fetchpostbymid(mid);
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad() {
        wx.getUserInfo({
            success: function(res) {
                app.Data.userInfo = res.userInfo;
                wx.login({
                    success: function(res) {
                        app.Data.userInfo.code = res.code;
                        //Login
                        Net.request({
                            url: API.Login(app.Data.userInfo),
                            success: function(res) {
                                var datas = res.data.data;
                                app.Data.userInfo.openid = datas;
                            },
                            fail: function() {}
                        })
                    }
                })
            }
        });
        this.fetchposts();
        this.fetchallcats();
    },
    //检查一个字符串是不是url
    checkImage: function(url) {
        if (!url) {
            return false
        }
        let ext = url.substr(url.lastIndexOf('.') + 1);
        if (ext && (ext == 'png' || ext == 'jpg' || ext == 'jpeg')) {
            return true
        } else {
            return false
        }
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {},

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {},

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {
        wx.stopPullDownRefresh();
        this.setData({
            swipelist: [],
            postslist: [],
            midposts: 'none',
            topswiper: 'none',
            current_cat: 0,
            current_position: 'mid_99999999'
        })
        this.onLoad();
    },


    //以下为自定义点击事件

})