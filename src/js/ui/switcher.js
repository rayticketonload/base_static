/*!
 * switcher 切换器
 * tommyshao <jinhong.shao@frontpay.cn>
 * API:
 *      <div data-toggle="switcher" [data-except="true"|data-item="a"|data-active="current"]/>
 *      $(element).switcher({except:true, item: 'a', active: 'current'});
 *      $(element).on('select.ui.switcher', function(e){ e.relatedTarget; });
 */

+(function($) {
    'use strict';

    var toggle = '[data-toggle="switcher"]';

    // 构造函数
    // ===============
    var Switcher = function(element, option) {
        var $this = this;
        this.$el = $(element);
        this.option = $.extend({}, Switcher.DEFAULTS, option, this.$el.data());
        this.$el.on('click.ui.switcher', this.option.item,  function(e){
            e.stopPropagation();
            e.preventDefault();
            $this.select($(this));
        });
    };

    Switcher.VERSION = '1.0.0';
    Switcher.DEFAULTS = {
        item: 'li',
        active: 'active',
        except: false
    };

    Switcher.prototype.select = function ($target) {
        var o = this.option, e = $.Event('select.ui.switcher', {relatedTarget: $target});
        $target.toggleClass(o.active).trigger(e);
        if(!o.except) $target.siblings(o.item).removeClass(o.active);
    };


    // 插件定义
    //======================
    function Plugin(option) {
        return $(this).each(function () {
            var $this = $(this);
            var data = $this.data('ui.switcher');

            if(!data) $this.data('ui.switcher', (data = new Switcher(this, option)));
            if(typeof option == 'string') data[option]();
        })
    }


    // jQuery 插件扩展
    $.fn.switcher = Plugin;
    $.fn.switcher.Constructor = Switcher;

    // 元素插件绑定
    // ====================
    $(document).ready(function(){ $(toggle).switcher() });
})( jQuery );

