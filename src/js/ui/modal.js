/*!
 * 弹层
 * tommyshao <jinhong.shao@frontpay.cn>
 * Reference bootstrap.modal.js
 * API:
 *      // 监听打开
 *      $(element).on('show.ui.modal', function(e, obj){});
 *      $(element).on('shown.ui.modal', function(e, obj){});
 *
 *      // 监听关闭
 *      $(element).on('hide.ui.modal', function(){});
 *      $(element).on('hidden.ui.modal', function(){});

        // 绑定一个弹窗
 *      $(element).modal();
 *
 *      // 自定义弹窗
 *      $(id).modal({title: '提示', content: 'abc'});
        $(id).modal('setContent', 'cdfg');

        // loading
 */

+(function($) {
    'use strict';

    // 构造函数
    // ===============
    var Modal = function(element, options) {
        this.$el = $(element);
        this.options = options;
        this.$body = $(document.body);
        //this.$container = this.$el.parents('.modal-background');
        this.$dialog = this.$el.find('.modal-wrap');
        this.$backdrop = null;
        this.isShown = null;
        this.originalBodyPad = null;
        this.scrollbarWidth = 0;

        if(this.options.remote) {
            this.$el
                .find('.modal-body')
                .load(this.options.remote, $.proxy(function() {
                    this.$element.trigger('loaded.ui.modal');
                }, this))
        }
    };

    Modal.VERSION = '1.0.0';

    // 动画过渡时间
    Modal.TRANSITION_DURATION = 150;

    Modal.DEFAULTS = {
        backdrop: true,
        keyboard: true,
        show: true
    };

    // 自定义弹框模板
    Modal.TEMPLATE =[
                        '<div class="modal-background fade" id="{{mid}}">',
                            '<div class="modal-layer">',
                                '<div class="modal-position">',
                                    '<div class="modal-wrap">',
                                        '<div class="modal-head">',
                                            '<span class="modal-title">{{title}}</span>',
                                            '<button class="modal-close">',
                                            '<i></i>',
                                            '</button>',
                                        '</div>',
                                        '<div class="modal-body">',
                                            '{{content}}',
                                        '</div>',
                                    '</div>',
                                '</div>',
                            '</div>',
                        '</div>'
                    ].join('');

    Modal.CreateModal = function(option) {
        var $body = $(document.body), element;
        if(option && typeof option == "object") {
            element = Modal.TEMPLATE.replace(/{{(\w*)}}/gi, function(match, key){
                if(option[key] && typeof option[key] == "string") return /^(\.|#)\w*/gi.test(option[key]) ? $(option[key]).html() : option[key];
                // dom元素
                if(option[key] && option[key].length && option.length > 0) return option[key].html();
            });

            element = $(element).hide().appendTo($body)
        }
        return element;
    };

    // 打开
    Modal.prototype.toggle = function (_relatedTarget) {
      return this.isShown ? this.hide() : this.show(_relatedTarget);
    };


    // 显示
    Modal.prototype.show = function(_relatedTarget) {
        var that = this;
        var e = $.Event('show.ui.modal', {relatedTarget: _relatedTarget});

        //this.$el.trigger(e);

        if(this.isShown || e.isDefaultPrevented()) return;

        this.isShown = true;
        this.checkScrollbar();
        this.setScrollbar();
        this.$body.addClass('modal-open');

        this.escape();
        this.resize();

        this.$el.on('click.dismiss.ui.modal', '[data-dismiss="modal"],.modal-close', $.proxy(this.hide, this));


        var transition = $.support.transition && that.$el.hasClass('fade');
        that.$el.show().scrollTop(0);

        that.adjustDialog();

        if(transition) {
            that.$el[0].offsetWidth;
        }

        that.enforceFocus();

        //var e = $.Event('shown.ui.modal', {relatedTarget: _relatedTarget});

        if(transition) {
            that.$el.addClass('in').attr('aria-hidden', false);
            that.$dialog.one('uiTransitionEnd', function(){
                that.$el.trigger('focus').trigger(e)
            }).emulateTransitionEnd(Modal.TRANSITION_DURATION)
        } else{
            that.$el.hide().addClass('in').attr('aria-hidden', false).fadeIn(Modal.TRANSITION_DURATION, function(){
                $(this).trigger('focus').trigger(e);
            }).attr('aria-hidden', false);
        }
    };

    // 隐藏
    Modal.prototype.hide = function(e){
        if(e) e.preventDefault();

        var $this = this;

        if(!this.$el.is(':visible') && !this.isShown) return;

        this.isShown = false;

        this.escape();
        this.resize();

        $(document).off('focusin.ui.modal');

        this.$el.removeClass('in').attr('aria-hidden', true).off('click.dismiss.ui.modal').off('mouseup.dismiss.ui.modal');

        this.$dialog.off('mousedown.dismiss.ui.modal');

        $.support.transition && this.$el.hasClass('fade') ?
            this.$el.one('uiTransitionEnd', $.proxy(this.hideModal, this)).emulateTransitionEnd(Modal.TRANSITION_DURATION)
            : (function(){
                $this.$el.fadeOut(Modal.TRANSITION_DURATION, function(){
                    $this.hideModal()
                })
              })();
    };

    Modal.prototype.close = function(id) {
        $(id).data('ui.modal').hide();
    };

    // esc关闭
    Modal.prototype.escape = function(){
        if(this.isShown && this.options.keyboard) {
            this.$el.on('keydown.dismiss.ui.modal', $.proxy(function(e) {
                e.which == 27 && this.hide()
            }, this))
        } else if(!this.isShown) {
            this.$el.off('keydown.dismiss.ui.modal');
        }
    };

    Modal.prototype.hideModal = function() {
        var that = this;
        var e = $.Event('hide.ui.modal', {relatedTarget: that.$el});
        that.$el.hide();
        that.$body.removeClass('modal-open');
        that.resetAdjustments();
        that.resetScrollbar();
        that.$el.trigger(e);
    };
    // 重新缩放
    Modal.prototype.resize = function(){};
    // 调整弹框位置
    Modal.prototype.handleUpdate = function() {
        this.adjustDialog();
    };
    Modal.prototype.adjustDialog = function(){
        return;
        var modalIsOverflowing = this.$el[0].scrollHeight > document.documentElement.clientHeight;

        this.$el.css({
            paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
            paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth: ''
        })
    };
    Modal.prototype.resetAdjustments = function(){
        this.$el.css({
            paddingLeft: '',
            paddingRight: ''
        })
    };
    // 获取焦点
    Modal.prototype.enforceFocus = function(){
        $(document)
            .off('focusin.ui.modal')
            .on('focusin.ui.modal', $.proxy(function(e) {
                if(this.$el[0] !== e.target && !this.$el.has(e.target).length) {
                    this.$el.trigger('focus');
                }
            }, this))
    };

    // 滚动条
    Modal.prototype.checkScrollbar = function () {
        var fullWindowWidth = window.innerWidth; //$(window).width();
        if(!fullWindowWidth) {
            var documentElementRect = document.documentElement.getBoundingClientRect();
            fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left)
        }

        this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
        this.scrollbarWidth = this.measureScrollbar();
    };

    Modal.prototype.setScrollbar = function() {
        var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
        this.originalBodyPad = document.body.style.paddingRight || '';
        if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
    };

    Modal.prototype.resetScrollbar = function () {
        this.$body.css('padding-right', this.originalBodyPad);
    };

    Modal.prototype.measureScrollbar = function() {
        var scrollDiv = document.createElement('div');
        scrollDiv.className = 'modal-scrollbar-measure';
        this.$body.append(scrollDiv);
        var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
        this.$body[0].removeChild(scrollDiv);
        return scrollbarWidth;
    };

    // 扩展方法
    Modal.prototype.setContent = function(content) {
        var $content = this.$el.find('.modal-body');
        $content.length && $content.html(content || '');
    };

    // 设置标题
    Modal.prototype.setTitle = function(title) {
        var $title = this.$el.find('.modal-title');
        $title.length && $title.html(title || '')
    };



    // 插件定义
    //======================
    function Plugin(option, _relatedTarget) {
        if(!$(this).length && option && /^#(\w*)/gi.test($(this).selector)) { // js创建
            var data, fnName; //option = typeof option === 'string' ? {title: '\u6807\u9898', content: ''} : option;  //, uid = Math.random().toString(36).substring(2);
            //option.id = 'modal-'+uid;
            if(typeof option === 'string') {
                fnName = option;
                option = {title: '\u6807\u9898', content: ''};
            }
            option.mid = $(this).selector.replace(/^#/g, '');
            var $this = Modal.CreateModal(option);
            $this.data('mid', option.mid);
            var options = $.extend({}, Modal.DEFAULTS, typeof option== 'object' && option);
            $this.data('ui.modal', (data = new Modal($this, options)));

            if(fnName && typeof data[fnName] === 'function') {
                data[fnName](_relatedTarget);
            }

            if(option['callback']) option['callback'].call($this);

            //return data.show(_relatedTarget);
            data.show(_relatedTarget);
            return $(this);
        } else { // 模板
            return $(this).each(function () {
                var $this = $(this);
                var data = $this.data('ui.modal');
                var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option== 'object' && option);
                if(!data) $this.data('ui.modal', (data = new Modal(this, options)));
                if(typeof option == 'string'){
                    data[option](_relatedTarget);
                }else if(options.show){
                    // 重新设置标题
                    if(options.title) data.setTitle(options.title);
                    // 重新设置内容
                    if(options.content) data.setContent(options.content);

                    data.show(_relatedTarget);
                }
            })
        }
    }


    // jQuery 插件扩展
    $.fn.modal = Plugin;
    $.fn.modal.Constructor = Modal;


    // ajaxLoading
    $.fn.showLoading = function(title, content){
        var $this, title = title || '处理中...', content = content || '请不要关闭浏览器，系统正在处理';
        if($(this).length) {
            if(title) $(this).find('.modal-body h3').html(title);
            if(content ) $(this).find('.loading-content').html(content);

            $(this).modal('show');
        } else {
            var template = ['<div class="notice-wrap waiting in-modal">',
                                '<div class="notice-box">',
                                    '<span class="notice-img"></span>',
                                    '<h3>'+ title +'</h3>',
                                    '<div class="loading-content">'+ content +'</div>',
                                '</div>',
                            '</div>'].join('');
            $(this).modal({title: '提示', content: template , callback: function(){
                $(this).find('.modal-close').hide();
            }});
        }
    };

    $.fn.hideLoading = function(){
        $(this).length && $(this).modal('hide');
    }

    // alert,error,success
    $.fn.modalLayer = function(option) {
        var defaults = {
            icon: 'success',
            title: '成功',
            content: '',
            buttons : [
                {
                    text: '确定',
                    href: false,
                    style: 'btn primary',
                    target: false,
                    ok: $.noop
                }
            ]
        };

        var opt = $.extend({}, defaults, option);
        var $that = $(this);

        if($that.length) {
            $that.modal('show');
        } else { // 初始化
            var template = ['<div class="notice-wrap '+ opt.icon +' in-modal">',
                                '<div class="modalLayer notice-box">',
                                    '<span class="notice-img"></span>',
                                    '<h3 class="modalLayer-title '+ ($.trim(opt.content) == '' ? 'fn-mt-30': '') +'">'+ opt.title +'</h3>',
                                    '<div class="modalLayer-content">'+ opt.content +'</div>',
                                '</div>',
                            '</div>',
                            '<div class="in-modal-btns text-align-center">',
                            '</div>'];
            // 拼接按钮html结构
            var btnHtml = [], btns = opt.buttons;
            for(var i = 0; i < btns.length; i++) {
                if(btns[i].href) {
                    btnHtml.push('<a href="'+ btns[i].href +'" '+ (btns[i].target ? 'target="'+ btns[i].target +'"'  : '') +' class="'+ (btns[i].style || 'btn primary') +'" data-index="'+ i +'">'+ btns[i].text +'</a>');
                } else {
                    btnHtml.push('<button type="button" class="'+ (btns[i].style || 'btn primary') +'" data-index="'+ i +'">'+ btns[i].text +'</button>');
                }
            }

            // 添加自定义按钮html
            template.splice(-1, 0, btnHtml.join(''));

            // 自定义对话弹层实例
            $that = $(this).modal({title: '提示', content: template.join(''), callback: function(obj){
                // 按钮点击触发配置回调函数，没有配置则默认关闭层
                $(this).on('click', '.in-modal-btns .btn' , function(){
                    // 获取当前按钮位置, e 获取用户决定按钮是否可以关闭层，回调函数return false则不关闭层
                    var index = $(this).data('index'), e = true;
                    // 监测用户是否配置回调函数
                    if(opt.buttons.length && opt.buttons[index] && opt.buttons[index]['ok']) {
                        // ok为函数才执行
                        if(opt.buttons[index]['ok'] && typeof  opt.buttons[index]['ok'] === "function") {
                            // 获取用户是否关闭层指令，默认关闭
                            e = opt.buttons[index]['ok'].call(null, $(this), index) === false ? false : true;
                        }
                    }

                    // 指令为true时关闭层
                    e && $($that.selector).modal('hide')
                })
            }});
        }
    };


    // 元素插件绑定
    // ====================
    var initModal = function(){
        $(document).on('click.ui.modal', '[data-toggle="modal"]', function(e) {
            var $this = $(this);
            var href = $(this).attr('href');
            var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')));
            var option = $target.data('ui.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href}, $target.data(), $this.data());

            // 实例化
            Plugin.call($target, option, this);
        });

        // 全局绑定，默认不显示
        //$('.modal-background:not(".display-none")').modal();
    };

    $(document).ready(initModal);
})(jQuery);
