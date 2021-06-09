const { app, BrowserWindow, ipcMain } = require('electron')
const { generateKeyPairSync } = require('crypto');
const { exec, spawn } = require('child_process');
const fs = require('fs')
const path = require('path').dirname(require.main.filename) + '/../../wallets/stlx.wallet'
//const regfile = require('path').dirname(require.main.filename) + '/../../stlx.reg'
//const temppassfile = require('path').dirname(require.main.filename) + '/../../tmpp.txt'
//const pathurl = require('path').dirname(require.main.filename).replace("\\resources\\app", "").replaceAll("\\", "\\\\");
const bs58 = require('bs58')
global.addr = ""
global.pbkey = ""
global.balance = ""
global.tobesigned = ""
global.tobemined = ""
global.pvkey = ""
global.b58pvkey = ""
global.rawallet = ""
global.txargs = ""
global.iswallet = 0
//global.tmppass = ""

/*var regkey = 'REGEDIT4'
regkey = regkey + "\n"
regkey = regkey + "\n"
regkey = regkey +'[HKEY_CLASSES_ROOT\\stlx]'
regkey = regkey + "\n"
regkey = regkey +'@="URL:stlx"'
regkey = regkey + "\n"
regkey = regkey + '"URL Protocol"=""'
regkey = regkey + "\n"
regkey = regkey + "\n"
regkey = regkey +'[HKEY_CLASSES_ROOT\\stlx\\DefaultIcon]'
regkey = regkey + "\n"
regkey = regkey +'@="\\"' + pathurl + '\\\\stlx-wallet.exe\\""'
regkey = regkey + "\n"
regkey = regkey + "\n"
regkey = regkey +'[HKEY_CLASSES_ROOT\\stlx\\shell]'
regkey = regkey + "\n"
regkey = regkey + "\n"
regkey = regkey +'[HKEY_CLASSES_ROOT\\stlx\\shell\\open]'
regkey = regkey + "\n"
regkey = regkey + "\n"
regkey = regkey +'[HKEY_CLASSES_ROOT\\stlx\\shell\\open\\command]'
regkey = regkey + "\n"
regkey = regkey +'@="\\"' + pathurl + '\\\\stlx-wallet.exe\\" \\"%1\\""'

fs.writeFile(regfile, regkey, function(err) {
	if(err) {
		return console.log(err);
	}
});*/

// receive message from create.html
ipcMain.on('setToSign', (event, arg) => {
	tobesigned = arg;
	// send message to create.html
	event.sender.send('setToSign-reply', "done");
});

ipcMain.on('setToMine', (event, arg) => {
	tobemined = arg;
	// send message to create.html
	event.sender.send('setToMine-reply', "done");
});

/*ipcMain.on('setTMPPass', (event, arg) => {
	pass = arg;
	fs.writeFile(temppassfile, pass, function(err) {
		if(err) {
			return console.log(err);
		}
	});
	// send message to create.html
	event.sender.send('setTMPPass-reply', "done");
});*/

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
	});
	// send message to create.html
	event.sender.send('create-reply', "created");
});

// receive message from create.html
ipcMain.on('index-send', (event, arg) => {

	var crypto = require('crypto');
	var privateKey = fs.readFileSync(path)
	b58pvkey = privateKey
	rawallet = b58pvkey
	b64rpvkey = new Buffer.from(b58pvkey, 'base64')
	b58pvkey = bs58.encode(b64rpvkey)
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
	//console.log(pbkey);
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
ipcMain.on('key-send', (event, arg) => {

	var crypto = require('crypto');
	var pvkeybytes = bs58.decode(arg)
	var privateKey = pvkeybytes.toString()
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
	}
	catch(error)
	{
		console.log(error)
		event.sender.send('key-reply', "bad_decrypt");
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
	//console.log(pbkey);
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
	event.sender.send('key-reply', "opened");
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
		event.returnValue = sign;
	}
	if(arg == "startmining")
	{
		exec('start ./miner/cpuminer.exe ' + tobemined)
		event.returnValue = "ok";
	}
	if(arg == "starthashing")
	{
		exec('start ./stlxhasher/hasher.exe ' + addr)
		event.returnValue = "ok";
	}
/*	if(arg == "installprotocol")
	{
		exec('start regedit.exe /S ' + regfile)
		event.returnValue = "ok";
	}
	if(arg == "editregfile")
	{
		exec('start notepad.exe ' + regfile)
		event.returnValue = "ok";
	}*/
	if(arg == "address")
	{
		event.returnValue = addr;
	}
	if(arg == "txargs")
	{
		var parg = process.argv[1];
		parg = parg.split(":");
		if(parg.length == 2)
			txargs = parg[1];
		event.returnValue = txargs;
	}
	if(arg == "pubkey")
	{
		event.returnValue = pbkey;
	}
	if(arg == "privkey")
	{
		event.returnValue = b58pvkey;
	}
	if(arg == "rawallet")
	{
		event.returnValue = rawallet;
	}
	if(arg == "exit")
	{
		app.quit();
	}
});

try {
  if (fs.existsSync(path)) {
    iswallet = 1;
	/*var parg = process.argv[1];
	parg = parg.split(":");
	if(parg.length == 2)
	{
		var carg = parg[1].split("/");
		if(carg[0] == "signtx")
		{
			iswallet = 2;
		}
		else
		{
			app.quit();
		}
	}*/
  }
  else {
	  iswallet = 0;
  }
} catch(err) {
  console.error(err)
}

function createWindow () {
  if(iswallet == 1)
  {
	  const win = new BrowserWindow({
		width: 1024,
		height: 700,
		minWidth:500,
		webPreferences: {
		  nodeIntegration: true
		}
	  })

	  //win.setResizable(false);
/*	  fs.unlink(temppassfile,function(err){
			if(err) return console.log(err);
		});*/

	  win.setMenuBarVisibility(false)
	  win.maximize();
	  win.loadFile('index.html')
  }
/*  else if(iswallet == 2)
  {
	  const win = new BrowserWindow({
		width: 500,
		height: 700,
		minWidth:500,
		webPreferences: {
		  nodeIntegration: true
		}
	  })

	  //win.setResizable(false);
	  if (fs.existsSync(temppassfile))
			tmppass = fs.readFileSync(temppassfile)
	  else
		  tmppass = "";

	  win.setMenuBarVisibility(false)
	  win.loadURL(require('path').dirname(require.main.filename) + '/sindex.html?tmpp=' + tmppass)
  }*/
  else
  {
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
