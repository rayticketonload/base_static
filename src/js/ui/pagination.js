/*!
 * 分页|pagination
 * tommyshao <jinhong.shao@frontpay.cn>
 * Reference uikit.pagination.js
 * API:
 *      $(element).pagination({ onSelectPage: function(index, instance){});
 *
 *      $(element).on('ui.select.pagination', function(e, index, instance){
            console.log(index)
         })

        $(element).pagination({ onSelectPage: function(index, instance){});

        $(element).pagination('selectPage', 2, 100);
 */

+(function($) {
    'use strict';

    // 默认高亮类
    var active = 'active';

    // 构造函数
    // ===============
    var Pagination = function(element, options) {
        this.$el = $(element);

        this._init(options);
    };

    // 版本
    Pagination.VERSION = '1.0.0';
    Pagination.DEFAULTS = {
        // 总记录数
        items: 1,
        // 每页记录数
        itemsOnPage: 1,
        // 总页数
        pages: 100,
        // 只显示页数区间
        displayedPages: 8,
        // 到末页显示多少页码
        edges: 1,
        // 当前页
        currentPage: 1,
        lblPrev: '\u4e0a\u4e00\u9875', //上一页
        lblNext: '\u4e0b\u4e00\u9875', //下一页
        // 选中触发事件
        onSelectPage: function(){}
    };

    // 初始化
    // =================
    Pagination.prototype._init = function(options, inited) {
        var $this = this;

        this._setOption(options);

        // 总页数
        $this.pages = $this.options.pages ? $this.options.pages : Math.ceil($this.options.items / this.options.itemsOnPage) ? Math.ceil($this.options.items / $this.options.itemsOnPage) : 1;

        // 当前页，从0开始
        $this.currentPage = $this.options.currentPage -1;
        // 页数区间的一半
        $this.halfDisplayed = $this.options.displayedPages / 2;

        // 绑定点击切换页码
        !!!inited && $this.$el.on('click', 'a[data-page]', function(e) {
            e.preventDefault();
            $this.selectPage($(this).data('page'));
        });

        // dom 渲染
        $this._render();
    };

    Pagination.prototype.init = function(options){
        this._init(options, true);
    };

    // 私有方法
    // 设置配置
    Pagination.prototype._setOption = function(options){
        this.options = $.extend({}, Pagination.DEFAULTS, options);
    };

    // 切换页码
    Pagination.prototype.selectPage = function(pageIndex, pages) {
        // 切换到设置页
        this.currentPage = pageIndex - 1;
        // 重新渲染dom
        this.render(pages);

        // 触发切换选择函数
        this.options.onSelectPage(pageIndex, this);
        // 触发api接口
        this.$el.trigger('select.ui.pagination', [pageIndex, this]);
    };

    Pagination.prototype._render  = function(){
        var o = this.options, interval = this._getInterval(), i;
        // 清空dom
        this.$el.empty();

        // 上一页,false时不显示，当前页-1，text为显示文字，true为自定义label
        if(o.lblPrev) this._append(o.currentPage - 1, { text: o.lblPrev}, true);


        // 左边首页显示边缘页数
        if(interval.start > 0 && o.edges > 0) { // 显示末页
            var end = Math.min(o.edges, interval.start);
            for(i = 0; i < end; i++) this._append(i);

            if(o.edges < interval.start && (interval.start - o.edges != 1)) {
                this.$el.append('<li><span>...</span></li>')
            } else if( interval.start - o.edges == 1) {
                this._append(o.edges);
            }
        }

        // 显示 (当前页-4, 当前页， 当前页+4)
        for(i = interval.start; i < interval.end; i++) this._append(i);

        // 右边末页显示边缘页数
        if(interval.end < this.pages && o.edges > 0) {
            if(this.pages - o.edges > interval.end && (this.pages - o.edges - interval.end != 1)) {
                this.$el.append('<li><span>...</span></li>')
            } else if ( this.pages - o.edges - interval.end == 1) {
                this._append(interval.end++);
            }

            var begin = Math.max(this.pages - o.edges, interval.end);

            for(i = begin; i < this.pages; i++) this._append(i);
        }

        // 下一页,false时不显示，当前页+1，text为显示文字，true为自定义label
        if(o.lblNext) this._append(o.currentPage+1, {text: o.lblNext}, true);
    };

    // 重新渲染,外部接口
    Pagination.prototype.render = function(pages){
        this.pages = pages ? pages: this.pages;
        this._render();
    };

    // 获取显示页码范围
    Pagination.prototype._getInterval = function(){
        return {
            start: Math.ceil(
                // 当前页是否大于显示范围的一半
                this.currentPage > this.halfDisplayed
                ? Math.max(
                    // 从当前页-显示一半范围开始
                    Math.min(this.currentPage - this.halfDisplayed, (this.pages - this.options.displayedPages))
                    // 当前页小于一半且总页数小于显示范围，从第一页开始
                    , 0)
                // 从第一页开始
                : 0),
            end: Math.ceil(
                // 当前页是否大于显示范围的一半
                this.currentPage > this.halfDisplayed
                    // 当前页+显示范围的一半
                    ? Math.min(this.currentPage + this.halfDisplayed, this.pages)
                    // 结束为最多显示，末页
                    : Math.min(this.options.displayedPages, this.pages))
        }
    };

    // 重新组织dom结构
    // pageIndex 渲染页码
    // opts 文本配置
    // islb 是否上一页下一页，是永不加active
    Pagination.prototype._append = function(pageIndex, opts, islb) {
        var $this = this, item, options;

        // 判断首页，末页，常规页
        pageIndex = pageIndex < 0 ? 0: (pageIndex < this.pages ? pageIndex : this.pages -1);
        options = $.extend({ text: pageIndex + 1}, opts);

        // 判断当前页与非当前页
        item = (pageIndex == this.currentPage) ? '<li '+ (islb ? '' : 'class="'+ active +'"') +'><a href="###">'+ (options.text) +'</a></li>' : '<li><a href="#page-'+ (pageIndex + 1) +'" data-page="'+ (pageIndex + 1) +'">'+ options.text +'</a></li>';

        $this.$el.append(item);
    };

    // 插件定义
    //======================
    function Plugin(options) {
        var args = arguments;
        return $(this).each(function () {
            var $this = $(this);
            var data = $this.data('ui.pagination');

            if(!data) $this.data('ui.pagination', (data = new Pagination($this, $.extend({}, $this.data(), options))));

            if(typeof options == 'string') { // 调用接口方法
                data[options].apply(data, [].slice.call(args, 1));
            }
        })
    }

    // jQuery 插件扩展
    $.fn.pagination = Plugin;
    $.fn.pagination.Constructor = Pagination;

    // 元素插件绑定
    // ====================
    $(document).ready(function(){
        $('[ui-pagination],.pagination').pagination();
    })
})(jQuery);
