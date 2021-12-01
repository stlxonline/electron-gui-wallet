
	async function postData(url = '', data = {}) {
	  // Default options are marked with *
	  const response = await fetch(url, {
		method: 'POST', // *GET, POST, PUT, DELETE, etc.
		mode: 'cors', // no-cors, *cors, same-origin
		cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
		credentials: 'same-origin', // include, *same-origin, omit
		headers: {
		  'Content-Type': 'application/json'
		  //'Content-Type': 'application/x-www-form-urlencoded',
		},
		redirect: 'follow', // manual, *follow, error
		referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
		body: data // body data type must match "Content-Type" header
	  });
	  return response.json(); // parses JSON response into native JavaScript objects
	}
	
	function quit()
	{
		var mining = ipcRenderer.sendSync('request', "exit");
		return;
	}

	function timeSince(date) {

	  var seconds = Math.floor(new Date() / 1000) - date;

	  var interval = seconds / 31536000;

	  if (interval > 1) {
		return Math.floor(interval) + " years ago";
	  }
	  interval = seconds / 2592000;
	  if (interval > 1) {
		return Math.floor(interval) + " months ago";
	  }
	  interval = seconds / 86400;
	  if (interval > 1) {
		return Math.floor(interval) + " days ago";
	  }
	  interval = seconds / 3600;
	  if (interval > 1) {
		return Math.floor(interval) + " hours ago";
	  }
	  interval = seconds / 60;
	  if (interval > 1) {
		return Math.floor(interval) + " minutes ago";
	  }
	  return Math.floor(seconds) + " seconds ago";
	}

	function copytoclipboard() {
	  /* Get the text field */
	  var copyText = document.getElementById("address");
	  /* Select the text field */
	  copyText.select();
	  copyText.setSelectionRange(0, 99999); /* For mobile devices */
	  /* Copy the text inside the text field */
	  document.execCommand("copy");
	  /* Alert the copied text */
	  alert("Copied the text: " + copyText.value);
	}

	function get_balance()
	{
		fetch('https://node1.stlx.online/api/?q=getbalance&address=' + address)
		.then(response => response.text())
		.then((response) => {
			var obj = JSON.parse(response);
			if(obj.balance > 100000000)	document.getElementById('available').innerHTML = (obj.balance/decimal).toFixed(2) + " STLX";
			else document.getElementById('available').innerHTML = obj.balance/decimal + " STLX";
			var prices = ipcRenderer.sendSync('request', "prices");
			var jprices = JSON.parse(prices);
			document.getElementById('availableusd').innerHTML = (obj.balance/decimal*jprices.STLX).toFixed(2);
		});
	}
	
	function openexternal(link) {
	  require("electron").shell.openExternal(link);
	}