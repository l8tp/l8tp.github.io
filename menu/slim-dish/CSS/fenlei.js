
  const FenLeiContainer = document.querySelector('.FenLei');
  //const声明常量，但其内部属性和元素可以改变
  window.onload = function (){
	fetch('../fen-lei.xml')
	    .then(response => response.text())  //读取响应文本
	    .then(data => {  //处理解析后的文本数据
	        const parser = new DOMParser();  //XML字符串解析为DOM树
	        const xmlDoc = parser.parseFromString(data, 'application/xml');  //解析为DOM树
	        const links = xmlDoc.querySelectorAll('link');  //选择所有的link标签
	
	        links.forEach(link => {  //遍历每一个link
	            const url = link.querySelector('url').textContent.toLowerCase();  //选择标签内的文本内容
	            const content = link.querySelector('content').textContent.toLowerCase();
				
				const li = document.createElement('li');  //动态创建一个空白列表
				li.className = 'aurl';  //设置列表属性
				li.innerHTML = `<a href="../${url}" target="_top" rel="external nofollow"  data-lastfrom="" title="">${content}</a>`;
						 //设置列表内容。反引号代表模板字符串
				FenLeiContainer.appendChild(li);  //选择并添加子节点
				
	            if (content == "减肥菜") {li.className = 'Active';} //设置当前列表属性
	            
	        });
	
	    })
  }