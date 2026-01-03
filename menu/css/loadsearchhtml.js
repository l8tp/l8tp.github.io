			// 异步加载HTML组件
			async function loadComponent(containerId, filePath) {
				const container = document.getElementById(containerId);
				if (!container) return;

				const response = await fetch(filePath);
				const html = await response.text();
				//   container.innerHTML = html;

				const tempdiv = document.createElement('div');
				tempdiv.innerHTML = html;

				const element = tempdiv.querySelector('#seamain')
				container.innerHTML = element.innerHTML;

			}

			//防抖函数
			function debounce(fn, delay) {
				let timer = null;
				return function() {
					clearTimeout(timer);
					timer = setTimeout(fn, delay);
				}
			}

			var vvdh = window.innerWidth
			//页面加载完成后加载组件
			document.addEventListener('DOMContentLoaded', function() {
					if (vvdh > 500) {
						loadComponent('soub', 'search.html')
					} else {
						//窗口大小变化
						window.addEventListener('resize', debounce(function() {
							var vvdhnew = window.innerWidth;
							if (vvdhnew > 500 && vvdh <= 500) {
								loadComponent('soub', 'search.html');
								console.log(`窗口变宽，已加载搜索组件`);
								vvdh = vvdhnew;
							}
						}, 100))
					}
				}

			);
