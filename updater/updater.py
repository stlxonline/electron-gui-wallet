import requests
import sys
import zipfile
import json
import shutil
import os

version = 0
wversion = 0

check = str(sys.argv[len(sys.argv)-1])

try:
    with open('../resources/app/package.json') as json_file:
        data = json.load(json_file)
        version = int(data['version'].replace(".", ""))
except:
    version = 1

try:
    r = requests.get('https://node1.stlx.online/wallet-version.txt')
    wversion = int(r.text)
except:
    wversion = 0

if check == "--check":
    if version < wversion:
        print(1)
    else:
        print(0)
else:
    if version < wversion:
        print("Your wallet is outdated...")
        link = "http://node1.stlx.online/wallet-latest.zip"
        file_name = "wallet-latest.zip"
        try:
            with open(file_name, "wb") as f:
                print("Downloading %s" % file_name)
                response = requests.get(link, stream=True)
                total_length = response.headers.get('content-length')

                if total_length is None:
                    f.write(response.content)
                else:
                    dl = 0
                    total_length = int(total_length)
                    for data in response.iter_content(chunk_size=4096):
                        dl += len(data)
                        f.write(data)
                        done = int(50 * dl / total_length)
                        sys.stdout.write("\r[%s%s]" % ('=' * done, ' ' * (50-done)) )    
                        sys.stdout.flush()
        except:
            print("")
            print("Download error. Exiting...")
            sys.exit()
        print("")
        print("Removing old files...")
        try:
            shutil.rmtree("../resources")
        except:
            print("Remove error.")
        print("Uncompressing update...")
        with zipfile.ZipFile("wallet-latest.zip", 'r') as zip_ref:
            zip_ref.extractall("..")
        print("Done!")
    else:
        print("Your wallet us up to date")