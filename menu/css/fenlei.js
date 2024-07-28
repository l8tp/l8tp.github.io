var pathname = window.location.pathname; // 使用window.location.pathname获取当前页面的路径部分
if (pathname.endsWith('/')) { pathname = pathname.slice(0, -1);} // 如果路径以斜杠结尾，则去除它
var parentDirectoryName = pathname.split('/').slice(-2, -1)[0]; // 使用字符串的split方法和正则表达式来获取上级目录的名称
console.log(parentDirectoryName); // 输出上级目录的名称

//以上用来获取上级目录的名称

var XML = '../fen-lei.xml' //定义xml的路径
if("menu" == parentDirectoryName){XML = 'fen-lei.xml'} //判断是否为首页

const FenLeiContainer = document.querySelector('.FenLei');
//const声明常量，但其内部属性和元素可以改变

window.onload = function (){
fetch(XML)
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
			if("menu" == parentDirectoryName){ //判断是否为首页
				li.innerHTML = `<a href="${url}" target="_top" rel="external nofollow"  data-lastfrom="" title="">${content}</a>`;
					 //设置列表内容。反引号代表模板字符串
			}else{
				li.innerHTML = `<a href="../${url}" target="_top" rel="external nofollow"  data-lastfrom="" title="">${content}</a>`;
					 //设置列表内容。反引号代表模板字符串
			}
			FenLeiContainer.appendChild(li);  //选择并添加子节点
			
			if(url.includes("/")){ //判断是否为首页
				if (url.split('/').slice(-2, -1)[0] == parentDirectoryName ) {li.className = 'Active';} //设置当前列表属性
			}else{
				if ("menu" == parentDirectoryName ) {li.className = 'Active';} //设置当前列表属性
			}
			
		});

	})
}