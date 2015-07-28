/*!
 * checkAll 全选
 * tommyshao <jinhong.shao@frontpay.cn>
 * API:
 *      <input type="checkbox" data-toggle="checkAll" data-target="selector" />
 *      $(element).on('checked.ui.checkAll', function(e){ e.relatedTarget; });
 *      $(element).on('reversed.ui.checkAll', function(e){ e.relatedTarget; });
 */

+(function($) {
    'use strict';

    var toggle = '[data-toggle="checkAll"]';

    // 构造函数
    // ===============
    var CheckAll = function(element) {
        var $this = this;
        $this.$el = $(element);
        $this.$target = $($this.$el.data('target'));
        $this.isReverse =$this.$el.data('reverse');
        $this.$el.on('click', $.proxy($this.isReverse ? this.reverse : this.activate, this));
    };

    CheckAll.VERSION = '1.0.0';

    CheckAll.prototype.activate = function () {
        var isCheck = this.$el.is(':checked');
        var e = $.Event('checked.ui.checkAll', {relatedTarget: this.$el});
        this.$target.prop('checked', isCheck);
        this.$el.trigger(e);
    };

    CheckAll.prototype.reverse = function(){
        var isCheck = this.$el.is(':checked');
        var e = $.Event('reversed.ui.checkAll', {relatedTarget: this.$el});
        this.$target.prop('checked', !isCheck);
        this.$el.trigger(e);
    };


    // 插件定义
    //======================
    function Plugin(option) {
        return $(this).each(function () {
            var $this = $(this);
            var data = $this.data('ui.checkAll');

            if(!data) $this.data('ui.checkAll', (data = new CheckAll(this)));
            if(typeof option == 'string') data[option]();
        })
    }


    // jQuery 插件扩展
    $.fn.checkAll = Plugin;
    $.fn.checkAll.Constructor = CheckAll;

    // 元素插件绑定
    // ====================
    $(document).ready(function(){ $(toggle).checkAll() });
})( jQuery );

