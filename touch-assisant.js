/**
 * @author waraiotoko1108
 * @github 
 * @modified 2015-6-5 09:37
 * @desc 对"剧中人"前辈的toucher库(https://github.com/bh-lay/toucher)做一点小修改
 */

;(function(global,doc,factoryFn){
	
	var factory = factoryFn(global,doc);

	//提供window.util.TouchAss接口
	global.util = global.util || {};
	global.util.TouchAss = global.util.TouchAss ||factory;

})(this,document,function(window,document) {

	/* 检查类名是否存在 Deprecated */
	var hasClass = function(dom,className) {
		if (!dom || !className) {
			if (console) {
				console.log("Error! Expected 2 arguments. found " + (arguments.length) + '.');
				return;	
			};
		};
		return dom.className.match(new RegExp('(\\s|^)'+className+'(\\s|$)'));
	}

	/**
	 * @desc 检查dom是否满足selector Deprecated 
	 *
	 * @param[object] 检查的dom对象
	 * @param[string] selector的字符串
	 */
	var hasSelector = function(dom,selectorStr) {
		if (!selectorStr) {
			return true;
		};
		var arr = this.dom.querySelectorAll(selectorStr);
		return Array.prototype.indexOf.call(arr,dom) >= 0 ? true : false; 
	}

	/**
	 * @method 为对象增加增加事件监听
	 * @desc 支持链式
	 * 
	 * @param string 事件名
	 * @param [string] 委托对象
	 * @param function 事件函数
	 */
	 var ON = function(eventNames,selector,func) {
	 	var that = this;
	 	that._events = that._events || {};
	 	var eventNames,selector,func;
	 	if (arguments.length < 2) {
	 		if (console) {
				console.log("Error! Expected 3 arguments. found " + (arguments.length) + '.');
				return;	
			};
	 	}else if (arguments.length === 2) {
	 		eventNames = arguments[0];
	 		func = arguments[1];
	 		selector = "";
	 	}else if(arguments.length === 3){
	 		eventNames = arguments[0];
	 		selector = arguments[1];
	 		func = arguments[2];
	 	};
	 	if (typeof(func) === "function" && eventNames) {
	 		var eventNameArr = eventNames.split(/\s+/);
	 		eventNameArr.forEach(function(eventName,index,arr) {
	 			if (eventName) {
	 				/* 检查是否存在改事件栈 */
	 				
	 				if (!that._events[eventName]) {
	 					that._events[eventName] = [];
	 				};
	 				that._events[eventName].push({
	 					"selector": selector,
	 					"func": func
	 				});
	 			};
	 		})
	 	};
	 	/* 链式支持 */
	 	return this;
	 }

	 /**
	  * @method 事件触发器
	  * @desc 模拟事件触发和冒泡
	  *
	  * @param string 事件名
	  * @param object 原生事件对象
	  */
	 var Trigger = function(eventName,e){
	 	this._events = this._events || {};
	 	/* 检查该事件是否存在于对象中 */
	 	if(!this._events[eventName]){
	 		return;
	 	}
	 	/* pop the object in _events */
	 	var recycleEventsList = this._events[eventName];
	 	var target = e.target;

	 	while(true){
	 		if (recycleEventsList.length == 0) {
	 			return;
	 		};
			/* propagation is finished */	 		
	 		if (target == this.dom && !target) {
	 			recycleEventsList.forEach(function(element,index,array){
	 				var selectorStr = element['selector'];
	 				var callback = element['func'];

	 				if (!selectorStr) {
	 					fireCallback(eventName,callback,target,e);
	 				};
	 			});
	 			return;
	 		};
	 		/* 需要遍历的事件集合 */
	 		var needValidatedList = recycleEventsList; 
	 		/* 确认不需要触发的事件集合 */
	 		recycleEventsList = [];

	 		needValidatedList.forEach(function(element,index,array) {
	 				var selectorStr = element['selector'];
	 				var callback = element['func'];
	 				/*  */
	 				if (hasSelector(target,selectorStr)) {
	 					if (fireCallback(eventName,callback,target,e)) {
	 						return;
	 					};
	 				}else{
	 					recycleEventsList.push(element)
	 				}
	 		})
	 		/* propage */
	 		target = target.parentNode;
	 	}

	 }

	/**
	 * @desc 使用创建的对象执行回调函数
	 * 
	 * @param[string] 事件名
	 * @param[function] 被执行掉的函数
	 * @param[object] 指向的dom
	 * @param[object] 原生事件对象
	 */
	 var fireCallback = function(eventName,func,dom,e){
	 	var touch = e.touches.length ? e.touches[0] : {};

	 	var myE = {
	 		"type":eventName,
	 		"target":e.target,
	 		"pageX": touch.pageX || 0,
	 		"pageY": touch.pageY || 0
	 	};
	 	//为swipe类型事件加上初始位置和距离
	 	if (name.match(/^swipe/) && e.startPosition) {
	 		myE["startX"] = e.startPosition["pageX"];
	 		myE["startY"] = e.startPosition["pageY"];
	 		myE["moveX"] = myE["pageX"] = myE["startX"];
	 		myE["moveY"] = myE["pageY"] = myE["startY"];
	 	};

	 	var result = func.call(dom,myE);
	 	if (!result) {
	 		e.preventDefault();
	 		e.stopPropagation();
	 	};
	 	return result;
	 }

	 var swipeDirection = function(x1,x2,y1,y2){
	 	return Math.abs(x1 - x2) >= Math.abs(y1 - y2) ? (x1 - x2 > 0 ? "Left" : "Right") : (y1 - y2 > 0 ? "Up" : "Down");
	 }

	/**
	 * @desc 监听原生事件
	 *
	 * @param[object] Dom对象
	 */
	 var initEventListener = function(Dom) {
	 	
	 	var that = this;
	 	/* 触摸开始时事件 */
	 	var touchStartTime = 0;
		/* 上一次触摸时间 */
		var lastTouchTime = 0;
		/* 初始位置 */
		var x1,x2,y1,y2;
		/* 触摸延迟 */
		var touchDelay;
		/* 检验longTap */
		var longTap;
		/* 事件是否正在处理中 */
		var isActive = false;
		/* 缓存事件对象 */
		var cacheE = null;
		/* 单次用户操作结束 */
		var actionEnd = function() {
			isActive = false;
			clearTimeout(longTap);
			clearTimeout(touchDelay);
		}
		/* 触摸开始 */
		var touchStart = function(e){
			/* 重要的信息存起来 */
			cacheE = e;
			x1 = e.touches[0].pageX;
			y1 = e.touches[0].pageY;
			x2 = y2 = 0;
			isActive = true;
			touchStartTime = new Date();
			Trigger.call(that,"swipeStart",e);

			/* 长按事件 */
			clearTimeout(longTap);
			longTap = setTimeout(function(){
				actionEnd();

			}, 500)
		}
		/* 触摸结束 */
		var touchEnd = function(e) {
			/* 以缓存坐标触发swipeEnd事件 */
			Trigger.call(that,"swipeEnd",cacheE);
			if (!isActive) {
				return;
			};
			var currentTime = new Date();
			if(currentTime - lastTouchTime > 260){
				/* 设置延迟以判断是否为双击 */
				touchDelay = setTimeout(function() {
					/* 判断为singleTap */
					actionEnd();
					Trigger.call(that,"singleTap",cacheE);
				}, 260);
			}else{
				/* 260内有第二次触摸 */
				clearTimeout(touchDelay);
				actionEnd();
				Trigger.call(that,"doubleTap",cacheE);
			}
			lastTouchTime = currentTime;
		}
		/* 移动过程 */
		var touchMove = function(e) {
			/* 更新缓存坐标 */
			cacheE = e;
			e.startPosition = {
				pageX: x1,
				pageY: y1
			};
			/* 触发移动事件 */
			Trigger.call(that,"swipe",e);

			if (!isActive) {
				return;
			};
			x2 = e.touches[0].pageX;
			y2 = e.touches[0].pageY;
			if (Math.abs(x1-x2) > 2 || Math.abs(y1-y2) > 2) {
				var direction = swipeDirection(x1,x2,y1,y2);
				Trigger.call(that,"swipe" + direction,e);
			}else{
				actionEnd();
				Trigger.call(that,'singleTap',e);
			}
			actionEnd();
		}

		Dom.addEventListener("touchstart", touchStart, false);
		Dom.addEventListener("touchmove", touchMove, false);
		Dom.addEventListener("touchend", touchEnd, false);

	 }

    /**
     * @desc 构造函数
     * 
     * @param[Object] 传入的Dom对象
     * @param[Object] 额外的参数对象
     */
	 var Touch = function(Dom,param){
	 	var param = param || {};
		this.dom = Dom;	
		this.on = ON;
		initEventListener.call(this,this.dom);
		
	 }

	 Touch['on'] = ON

	return function(dom){
		return new Touch(dom)
	}
	// return function(dom){
	// 	return Object.create(Touch(dom))
	// }
})