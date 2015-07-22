/*!
 * 菜单下拉|select
 * tommyshao <jinhong.shao@frontpay.cn>
 * Reference bootstrap.dropdown.js
 */

+(function($) {
    'use strict';

    // 默认高亮类
    var active = 'active';
    // 绑定默认选择器
    var toggle = '[data-toggle="dropdown"],.form-control-dropdown-value,.form-control-dropdown-btn';
    var list = '.form-control-dropdown-menu li, [role="list"] li';

    // 构造函数
    // ===============
    var Dropdown = function(el) {
        $(el).on('click.ui.dropdown', this.toggle);

        var $target = getParent(el);
        $target.on('click.ui.dropSelect', list, this.select($target))
    };

    // 版本
    Dropdown.VERSION = '1.0.0';

    // 鼠标点击
    // =================
    Dropdown.prototype.toggle = function(e) {
        var $this = $(this);

        if($this.is('.disabled,:disabled')) return;

        var $target = getParent($this);
        active = $this.data('active') || active;

        var isActive = $target.hasClass(active);

        clearMenus();

        if(!isActive) {
            $target.addClass(active);
            $this.attr('aria-expanded', true).trigger('show.ui.dropdown', this)
        }

        return false
    };

    // 键盘按键 focus
    // ==============
    Dropdown.prototype.keydown = function (e) {
        if (!/(38|40|27|32)/.test(e.which) || /input|textarea/i.test(e.target.tagName)) return;

        var $this = $(this);

        e.preventDefault();
        e.stopPropagation();

        if($this.is('.disabled, :disabled')) return;

        var $target = getParent($this);
        active = $this.data('active') || active;

        var isActive = $target.hasClass(active);

        if ((!isActive && e.which != 27) || (isActive && e.which == 27)) {
            if (e.which == 27) $target.find(toggle).trigger('focus');
            return $this.trigger('click');
        }

        var $items = $target.find(list);

        if(!$items.length) return;

        var index = $items.index(e.target);

        if (e.which == 38 && index > 0)  index--;  // up
        if (e.which == 40 && index < $items.length - 1) index++; // down
        if (!~index) index = 0;

        $items.eq(index).trigger('focus')
    };

    // 下拉菜单选中
    // ==================
    Dropdown.prototype.select = function(el){
        var $target = el.find(toggle);
        return function(e){
            e.preventDefault();
            console.log($(this))
            var option = $(this).attr('title') || $(this).text();
            $target.html(option);
            clearMenus();
        }
    };

    // 清除页面所有drondown
    // ==================
    function clearMenus(e) {
        $(toggle).each(function () {
            var $this = $(this);
            var $target = getParent($this);
            active = $this.data('active') || active;

            if(!$target.hasClass(active)) return;
            if(e && e.isDefaultPrevented()) return;

            $target.removeClass(active);
            $this.attr('aria-expanded', 'false').trigger('hide.ui.dropdown', this)
        })
    }

    // 获取响应的元素
    // ===================
    function getParent(el) {
        var $parent = $(el).data('target') || $(el).parent();
        return $parent;
    }

    // 插件定义
    //======================
    function Plugin(option) {
        return $(this).each(function () {
            var $this = $(this);
            var data = $this.data('ui.dropdown');

            if(!data) $this.data('ui.dropdown', (data = new Dropdown(this)));
            if(typeof option == 'string') data[option].call($(this));
        })
    }

    // jQuery 插件扩展
    $.fn.dropdown = Plugin;
    $.fn.dropdown.Constructor = Dropdown;

    // 元素插件绑定
    // ====================
    $(document)
        .on('click.ui.dropdown', clearMenus)
        //.on('click.ui.dropdown', toggle, Dropdown.prototype.toggle)
        .on('keydown.ui.dropdown', toggle, Dropdown.prototype.keydown);

    $(toggle).dropdown();
})(jQuery);