/*
jQuery Plugin: imgLiquid v0.9.85dev / 22-04-13
jQuery plugin to resize images to fit in a container.
Copyright (c) 2012 Alejandro Emparan (karacas), twitter: @krc_ale
Dual licensed under the MIT and GPL licenses
https://github.com/karacas/imgLiquid

ex:
	$(".imgLiquid").imgLiquid({fill:true});

	//OPTIONS:

	>js
		fill: true,
		verticalAlign:		//'center' //'top' //'bottom'
		horizontalAlign:	//'center' //'left' //'right'

	>js callBakcs
		onStart:		function(){},
		onFinish:		function(){},
		onItemStart:	function(index, container, img){},
		onItemFinish: function(index, container, img){}

	>hml5 data attr (overwrite all)
		data-imgLiquid-fill="true"
		data-imgLiquid-horizontalAlign="center"
		data-imgLiquid-verticalAlign="center"

*/
//

var imgLiquid = imgLiquid || {VER: '0.9.85'};

(function ($) {


	imgLiquid.isIE = /*@cc_on!@*/ false;
	imgLiquid.backgroundSizeAvaiable = false;

	//___________________________________________________________________

	$(function () {
		imgLiquid.backgroundSizeAvaiable = $('<div style="background-size:cover"></div>').css('background-size') === 'cover';
		//TODO: CHECKEAR EN IE
		//console.log(imgLiquid.backgroundSizeAvaiable);
	});

	//___________________________________________________________________
	$.fn.extend({
		imgLiquid: function (options) {

			var imgLiquidRoot = this;

			this.defaults = {
				fill: true,
				verticalAlign: 'center',		// 'top'	// 'bottom'
				horizontalAlign: 'center',		// 'left'	// 'right'

				useBackgroundSize: true,
				useDataHtmlAttr: true,

				responsive: true,				/*Only for use with BackgroundSize false (or old browsers)*/
				delay: 0,						/*Only for use with BackgroundSize false (or old browsers)*/
				fadeInTime: 0,					/*Only for use with BackgroundSize false (or old browsers)*/
				removeBoxBackground: true,		/*Only for use with BackgroundSize false (or old browsers)*/
				ieFadeInDisabled: true,			/*Only for use with BackgroundSize false (or old browsers)*/
				hardPixels: true,				/*Only for use with BackgroundSize false (or old browsers)*/
				responsiveCheckTime: 500,		/*Only for use with BackgroundSize false (or old browsers)*/ /*time to check div resize*/
				timecheckvisibility: 500,		/*Only for use with BackgroundSize false (or old browsers)*/ /*time to recheck if visible/loaded*/

				//CALLBACKS
				onStart: null, //no-params
				onFinish: null, //no-params
				onItemStart: null, //params: (index, container, img )
				onItemFinish: null //params: (index, container, img )
			};


			//EXTEND GLOBAL SETTINGS
			this.options  = options;
			this.settings = $.extend({}, this.defaults, this.options);


			//CALLBACK > Start
			if (this.settings.onStart) this.settings.onStart();


			//___________________________________________________________________

			return this.each(function ($i) {

				var $imgBoxCont = $(this);
				var $img = $('img:first', $imgBoxCont);
				if ($img.length === 0) {onError(); return;}


				//Settings
				var settings;
				if ($img.data('imgLiquid_settings')) {
					//Recall
					settings = $.extend({}, $img.data('imgLiquid_settings'), imgLiquidRoot.options);
				} else {
					//First time
					settings = $.extend({}, imgLiquidRoot.settings, getSettingsOverwrite());
				}
				$img.data('imgLiquid_settings', settings);


				//Start Callback
				if (settings.onItemStart) settings.onItemStart($i, $imgBoxCont, $img);



				//Process
				if (imgLiquid.backgroundSizeAvaiable && settings.useBackgroundSize) {
					//New browsers with backgroundSize
					processWbgSize();
				} else {
					//Old browsers whitout backgroundSize
					processWoldMethod();
				}


				//END MAIN
				return;



				//___________________________________________________________________

				function processWbgSize() {
					var bsVale = (settings.fill) ? 'cover' : 'contain';
					var bpos = settings.horizontalAlign.toLowerCase() + " " + settings.verticalAlign.toLowerCase();

					//IF SRC CHANGE or 1st TIME
					if ($imgBoxCont.css('background-image').indexOf($img.attr('src')) === -1){
						$imgBoxCont.css({'background-image': 'url(' + $img.attr('src') + ')'});
					}

					$imgBoxCont.css({'background-size': bsVale, 'background-repeat': 'no-repeat', 'background-position': bpos, });
					$('a:first', $imgBoxCont).css({'display': 'block', 'width': '100%', 'height': '100%'});
					$('img', $imgBoxCont).css({'display': 'none'});

					if (settings.onItemFinish) settings.onItemFinish($i, $imgBoxCont, $img);
					checkFinish();
				}


				//___________________________________________________________________

				function processWoldMethod() {

					//REPROCEESS?
					if ($img.data('imgLiquid_oldProcessed')) {
						if (!(imgLiquid.backgroundSizeAvaiable && settings.useBackgroundSize)) makeOldProcess();
						return;
					}

					//DATA
					$img.data('imgLiquid_oldProcessed', false);
					$img.data('imgLiquid_error', false);


					//CSS
					$img.fadeTo(0, 0);
					$('img:not(:first)', $imgBoxCont).css('display', 'none');
					$img.removeAttr("width").removeAttr("height").css({
						'visibility': 'visible',
						'max-width': 'none',
						'max-height': 'none',
						'width': 'auto',
						'height': 'auto',
						'display': 'block'
					});
					$imgBoxCont.css({'overflow': 'hidden'});


					//LOOP ONLOAD
					function onLoad() {
						if ($img.data('imgLiquid_loaded') || $img.data('imgLiquid_oldProcessed')) return;
						if ($imgBoxCont.is(':visible') && $img[0].complete && $img[0].width > 0 && $img[0].height > 0) {
							$img.data('imgLiquid_loaded', true);
							setTimeout(makeOldProcess, $i * settings.delay);
						} else {
							setTimeout(onLoad, settings.timecheckvisibility);
						}
					}

					onLoad()
					checkResponsive();
				}




				//___________________________________________________________________

				function checkResponsive() {
					if (!settings.responsive && !$img.data('imgLiquid_oldProcessed')) return;
					$.extend(settings, $img.data('imgLiquid_settings'));

					$imgBoxCont.actualSize = $imgBoxCont.get(0).offsetWidth + ($imgBoxCont.get(0).offsetHeight / 100000);
					if ($imgBoxCont.sizeOld) {
						if ($imgBoxCont.actualSize !== $imgBoxCont.sizeOld) {
							makeOldProcess();
						}
					}
					$imgBoxCont.sizeOld = $imgBoxCont.actualSize;
					setTimeout(checkResponsive, settings.responsiveCheckTime);
				}



				//___________________________________________________________________

				function onError() {
					$img.data('imgLiquid_error', true);
					$imgBoxCont.css('visibility', 'hidden');
					checkFinish();
				}


				//___________________________________________________________________

				function getSettingsOverwrite() {
					var SettingsOverwrite = {}
					if (imgLiquidRoot.settings.useDataHtmlAttr) {
						if ($imgBoxCont.attr('data-imgLiquid-fill') === 'true') SettingsOverwrite.fill = true;
						if ($imgBoxCont.attr('data-imgLiquid-fill') === 'false') SettingsOverwrite.fill = false;
						if ($imgBoxCont.attr('data-imgLiquid-responsive') === 'true') SettingsOverwrite.responsive = true;
						if ($imgBoxCont.attr('data-imgLiquid-responsive') === 'false') SettingsOverwrite.responsive = false;
						if (Number($imgBoxCont.attr('data-imgLiquid-fadeInTime')) > 0) SettingsOverwrite.fadeInTime = Number($imgBoxCont.attr('data-imgLiquid-fadeInTime'));

						var ha = $imgBoxCont.attr('data-imgLiquid-horizontalAlign');
						var va = $imgBoxCont.attr('data-imgLiquid-verticalAlign');
						if (ha === 'left' || ha === 'center' || ha === 'right') SettingsOverwrite.horizontalAlign = ha;
						if (va === 'top' ||  va === 'bottom' || va === 'center') SettingsOverwrite.verticalAlign = va;
					}
					//ie no anims
					if (imgLiquid.isIE && settings.ieFadeInDisabled) SettingsOverwrite.fadeInTime = 0;
					return SettingsOverwrite
				}



				//___________________________________________________________________

				function makeOldProcess() {

					//RESIZE
					var w, h;
					if ($img.data('owidth') === undefined) $img.data('owidth', $img[0].width);
					if ($img.data('oheight') === undefined) $img.data('oheight', $img[0].height);
					if (settings.fill === ($imgBoxCont.width() / $imgBoxCont.height()) >= ($img.data('owidth') / $img.data('oheight'))) {
						w = '100%';
						h = 'auto';
						if (settings.hardPixels) {
							w = Math.floor($imgBoxCont.width());
							h = Math.floor($imgBoxCont.width() * ($img.data('oheight') / $img.data('owidth')));
						}
					} else {
						h = '100%';
						w = 'auto';
						if (settings.hardPixels) {
							w = Math.floor($imgBoxCont.height() * ($img.data('owidth') / $img.data('oheight')));
							h = Math.floor($imgBoxCont.height());
						}
					}
					$img.css({
						'width': w,
						'height': h
					});


					//align X
					var ha = settings.horizontalAlign.toLowerCase();
					var hdif = $imgBoxCont.width() - $img[0].width;
					var margL = 0;
					if (ha === 'center') margL = hdif / 2;
					if (ha === 'right') margL = hdif;
					$img.css('margin-left', Math.floor(margL));


					//align Y
					var va = settings.verticalAlign.toLowerCase();
					var vdif = $imgBoxCont.height() - $img[0].height;
					var margT = 0;
					if (va === 'center') margT = vdif / 2;
					if (va === 'bottom') margT = vdif;
					$img.css('margin-top', Math.floor(margT));


					//FadeIn
					if (!$img.data('imgLiquid_oldProcessed')) {
						$img.data('imgLiquid_oldProcessed', true);
						if (settings.removeBoxBackground) $imgBoxCont.css('background-image', 'none');
						$img.fadeTo(settings.fadeInTime, 1);
						if (settings.onItemFinish) settings.onItemFinish($i, $imgBoxCont, $img);
						checkFinish();
					}
				}




				//___________________________________________________________________

				function checkFinish() {
					if ($i === imgLiquidRoot.length -1) if (settings.onFinish) settings.onFinish() /*CallBack*/;
				}



			});
		}
	});
})(jQuery);