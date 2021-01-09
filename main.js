const { app, BrowserWindow, ipcMain } = require('electron')
const { generateKeyPairSync } = require('crypto');
const fs = require('fs')
const path = './stlx.wallet'
const bs58 = require('bs58')
global.addr = ""
global.pbkey = ""
global.balance = ""
global.tobesigned = ""
global.pvkey = ""

// receive message from create.html 
ipcMain.on('setToSign', (event, arg) => {
	tobesigned = arg;
	// send message to create.html
	event.sender.send('setToSign-reply', "done");
});

// receive message from create.html 
ipcMain.on('create-send', (event, arg) => {
	let { publicKey, privateKey } = generateKeyPairSync('rsa', {
	  modulusLength: 2048,
	  publicKeyEncoding: {
		type: 'spki',
		format: 'pem'
	  },
	  privateKeyEncoding: {
		type: 'pkcs8',
		format: 'pem',
		cipher: 'aes-256-cbc',
		passphrase: arg
	  }
	});
	var privkey = privateKey.toString().replace("-----BEGIN ENCRYPTED PRIVATE KEY-----", "");
	privkey = privkey.replace("-----END ENCRYPTED PRIVATE KEY-----", "");
	privkey = privkey.replace(/\n/g, '')
	var pubkey = publicKey.toString().replace("-----BEGIN PUBLIC KEY-----", "");
	pubkey = pubkey.replace("-----END PUBLIC KEY-----", "");
	pubkey = pubkey.replace(/\n/g, '')
	pubkey64 = new Buffer.from(pubkey, 'base64')
	var pubkey = bs58.encode(pubkey64)
	pbkey = pubkey
	var address = pubkey
	var crypto = require('crypto');
	var i = 0;
	var sha = "";
	for(i=0;i<9;i++)
	{
		sha = crypto.createHash('sha512').update(address);
		address = sha.digest();
	}
	sha = crypto.createHash('sha512').update(address);
	address = sha.digest('hex');
	bytes = Buffer.from(address)
	address = "STLX" + bs58.encode(bytes)
	addr = address
	fs.writeFile(path, privkey, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log("wallet saved!");
	}); 
	// send message to create.html
	event.sender.send('create-reply', "created");
});

// receive message from create.html 
ipcMain.on('index-send', (event, arg) => {
	
	var crypto = require('crypto');
	var privateKey = fs.readFileSync(path)
	try
	{
		privateKey = crypto.createPrivateKey({
			'key': "-----BEGIN ENCRYPTED PRIVATE KEY-----\n" + privateKey + "\n-----END ENCRYPTED PRIVATE KEY-----",
			'format': 'pem',
			'type': 'pkcs8',
			'cipher': 'aes-256-cbc',
			'passphrase': arg
		});
		pvkey = privateKey
		console.error(pvkey)
	}
	catch(error)
	{
		console.log(error)
		event.sender.send('index-reply', "bad_decrypt");
	}
	
	var pubKeyObject = crypto.createPublicKey({
		key: privateKey,
		format: 'pem'
	})

	var publicKey = pubKeyObject.export({
		format: 'pem',
		type: 'spki'
	})
	
	var pubkey = publicKey.toString().replace("-----BEGIN PUBLIC KEY-----", "");
	pubkey = pubkey.replace("-----END PUBLIC KEY-----", "");
	pubkey = pubkey.replace(/\n/g, '')
	pubkey64 = new Buffer.from(pubkey, 'base64')
	var pubkey = bs58.encode(pubkey64)
	pbkey = pubkey
	var address = pubkey
	var i = 0;
	var sha = "";
	for(i=0;i<9;i++)
	{
		sha = crypto.createHash('sha512').update(address);
		address = sha.digest();
	}
	sha = crypto.createHash('sha512').update(address);
	address = sha.digest('hex');
	var bytes = Buffer.from(address)
	address = "STLX" + bs58.encode(bytes)
	addr = address
	// send message to create.html
	event.sender.send('index-reply', "opened");
});

// receive message from create.html 
ipcMain.on('transfer', (event, arg) => {
		const https = require('https')
		
		//var postData = JSON.stringify({msg: 'Hello World!'})

		const options = {
		  hostname: 'stlx.online',
		  port: 443,
		  path: '/server.php?q=transfer',
		  method: 'POST',
		  headers: {
		   'Content-Type': 'application/json',
		   'Content-Length': arg.length
		  }
		}
		const req = https.request(options, res => {
		  //console.log(`statusCode: ${res.statusCode}`)
		  res.on('data', d => {
			  //console.log(d.toString('ascii'));
			event.sender.send('reply-transfer', d.toString('ascii'));
		  })
		})
		req.on('error', error => {
		  console.error(error)
		})
		req.write(arg);
		req.end()
});

// receive message from create.html 
ipcMain.on('request', (event, arg) => {
	if(arg == "sign")
	{
		
		var crypto = require('crypto');
		var signature = crypto.sign("sha256", Buffer.from(tobesigned), {
			key: pvkey,
			padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
		})
		var bytes = Buffer.from(signature)
		var sign = bs58.encode(bytes)
		console.log(sign)
		event.returnValue = sign;
	}
	if(arg == "address")
	{
		//event.sender.send('reply-address', addr);
		event.returnValue = addr;
	}
	if(arg == "pubkey")
	{
		//console.log(pbkey);
		event.returnValue = pbkey;
	}
	/*if(arg == "startmining")
	{
		const { Worker } = require('worker_threads');
		const workerScriptFilePath = require.resolve('./miner.js'); 
		const worker = new Worker(workerScriptFilePath);
		worker.on('error', (error) => console.log(error));
		worker.on('exit', (code) => {
		  if (code !== 0)
			throw new Error(`Worker stopped with exit code ${code}`);
		});
	}*/
	
});


try {
  if (fs.existsSync(path)) {
    var iswallet = 1;
  }
  else {
	  var iswallet = 0;
  }
} catch(err) {
  console.error(err)
}

function createWindow () {
  const win = new BrowserWindow({
    width: 1024,
    height: 700,
	minWidth:500,
    webPreferences: {
      nodeIntegration: true
    }
  })
  
  //win.setResizable(false);

  win.setMenuBarVisibility(false)
  
  win.maximize();
  
  if(iswallet == 1)
  {
	  win.loadFile('index.html')
  }
  else
  {
	  win.loadFile('create.html')
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})