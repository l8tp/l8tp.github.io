			function appendToInput(taste) {
				document.getElementById("searchKwei").value = taste;
				sousuo();
			}
			
			function btn (){document.getElementById('Results').style.display='none'}
			function sousuo () {  //搜索函数，开始搜索准备
				const SRContainer = document.getElementById('sResults');//const声明常量，但其内部属性和元素可以改变
				const RContainer = document.getElementById('Results');//const声明常量，但其内部属性和元素可以改变
				var sKname = document.getElementById('searchInput').value.toLowerCase();  //输入字符串大写字母转化成小写
				var sKwei = document.getElementById('searchKwei').value.toLowerCase();  //输入字符串大写字母转化成小写
				console.log(sKname + " " + sKwei)
				loadData('menu.json')//调用异步函数加载json数据并匹配
				// 异步加载函数
				async function loadData(datalink) {
					// 1. 使用 Fetch API 获取数据
					const response = await fetch(datalink);
					// 2. 解析 JSON
					const data = await response.json();
					// console.log(data);
					// 3.对比数据并刷新显示
					var number = 1;
					var hasResults = false;
					RContainer.style.display = 'flex'
					SRContainer.innerHTML =""
					SRContainer.innerHTML = `<li class="aurlb" id="head2" onclick="btn()" style = "color:rgb(0, 170, 0)">^收起^</li>`//设置一个收起按钮
					for(var i in data){
						//  console.log(i)
						if((data[i].title.includes(sKname)||data[i].nameb.includes(sKname))&&data[i].kowei.includes(sKwei)){
							console.log(`${data[i].title}包含“${sKname}” 而且 ${data[i].kowei}包含“${sKwei}”`)
							SRContainer.innerHTML += `<li><a href="menu.html?name=${data[i].title}" class='aurl'>${number}.${data[i].title}</a></li>`
							number++;
							hasResults = true;
						}
					};
					if(hasResults){
						RContainer.style.display = 'flex'
					}else{
						RContainer.style.display = 'flex'
						SRContainer.innerHTML += `<li><a style="color: #ff0000;">没搜到</a></li>`
					};
				};
			};			
			
