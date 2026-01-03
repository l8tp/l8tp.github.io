const filename = window.location.href.split("/").pop().split("?").shift();
console.log(filename)
const params = new URLSearchParams(window.location.search);
var Uname = params.get("name"); //获取URL数据
const itcon = document.getElementById("flei");
const datalink = 'menu.json'; //获取json数据链接			
//加载目录
loadmulu('item.json')
async function loadmulu(datalink) {
	// 1. 使用 Fetch API 获取数据
	const response = await fetch(datalink);
	// 2. 解析 JSON
	const itdat = await response.json();
	console.log('获取目录成功');
	for (let n in itdat) {
		if (n == "index") {
			if(Uname == null){
				itcon.innerHTML += `<li><a href="index.html" style="background-color: #f8f0e1; border: 1.5px solid #b2a181; border-bottom: none;">${itdat[n]}</a></li>`
			}else{
				itcon.innerHTML += `<li><a href="index.html">${itdat[n]}</a></li>`
			}
		} else {
			if(n == Uname){
				itcon.innerHTML += `<li><a href="itindex.html?name=${n}" style="background-color: #f8f0e1; border: 1.5px solid #b2a181; border-bottom: none;">${itdat[n]}</a></li>`
			}else{
				itcon.innerHTML += `<li><a href="itindex.html?name=${n}">${itdat[n]}</a></li>`
			}
		}
	}
	
}