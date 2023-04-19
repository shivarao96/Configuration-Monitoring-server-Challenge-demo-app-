const express = require('express')
const fileupload = require("express-fileupload");
const app = express();
const cors = require('cors');
const port = 8080
var readline = require('readline');
var stream = require('stream');
const events = require('events');
const fileParser = require('./file-parser');
const fs = require('fs');
const dbServer = require('./db-server');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

const pool = new Pool({
    user: 'wmhrueqw',
    host: 'tiny.db.elephantsql.com',
    database: 'wmhrueqw',
    password: 'VADTbEvKNaa5L3Mzl_2qHGdt6Kiwb6aj',
    port: 5432,
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(fileupload());

app.post('/download-system-config', (req, res) => {
    const filepath = path.join(__dirname,'file') + '/' + 'system.txt';
    res.sendFile(filepath);
});

app.delete('/delete-system-config', (req, res) => {
    const filePath = './file/system.txt'
    fs.stat(filePath, function (err, stats) {
        if (err) {
            return res.status(400).send({message: "error", error: err})
        }
     
        fs.unlink(filePath,function(err){
             if(err) return res.status(400).send({message: "error", error: err})
             return res.send({message: "success",})
        });  
     });
})

app.post('/update-system-config', (req, res) => {
    try {
        var key = req.body.key;
        var value = req.body.value;
        if(fs.existsSync('./file/system.txt')) {
            fs.readFile('./file/system.txt', 'utf-8', function(err, data) {
                if(err) {
                    res.status(400).send({ error: "error" });
                } else {
                    var regex = new RegExp(`#${key}:([^"].*)`, 'gm');
                    var result = data.replace(regex, `#${key}: ${value}`);
                    fs.writeFile('./file/system.txt', result, 'utf-8', function(err) {
                        if(err) res.status(400).send({ error: "error" });
                        else res.send({ message: "success" });
                    });
                }
            });
        } else {
            res.status(400).send({ error: "error" });
        }
    } catch(err) {
        res.status(400).send({ error: "error" });
    }
});

app.get('/system-config-info', (req, res) => {
    try {
        if (fs.existsSync('./file/system.txt')) {
            const rl = readline.createInterface({
                input: fs.createReadStream('./file/system.txt'),
                crlfDelay: Infinity
            });
            const referenceObj = {};
            const parserHandler = fileParser.parseSystemConfigData(referenceObj);
            rl.on('line', function (line) {
                parserHandler(line);
            });
            events.once(rl, 'close').then((r) => {
                res.status(200).send({ status: "success", data: referenceObj })
            })
                .catch(err => {
                    res.status(400).send({
                        message: 'This is an error!',
                        error: err
                    });
                });
        } else {
            res.status(400).send({ error: "Ref file not found !" });    
        }
    } catch(e) {
        res.status(400).send({ message: "error", error: "error" });
    }
});

app.post('/upload-system-config', (req, res, next) => {
    let file = req['files'].uploadedFile;
    if (file.data) {
        var buf = file.data;
        var bufferStream = new stream.PassThrough();
        bufferStream.end(buf);
        fs.writeFile('./file/system.txt', buf, (err) => {
            if (!err) console.log('Data written');
        });
        res.status(200).send({ status: "success" });
    } else {
        res.status(400).send({ error: "error" });
    }
});

app.post('/logger-info', (req, res) => {
    try {
        const body = req.body;
        const offset = body && body.offset ? body.offset : 0;
        const limit = body && body.limit ? body.limit : 100;
        const filter = body && body.filter ? body.filter : 'configuration';
        const searchTerm = body && body.searchTerm ? (body.searchTerm).toLowerCase() : null;
        if (fs.existsSync('./file/log.json')) {
            fs.readFile('./file/log.json', 'utf8', function readFileCallback(err, data) {
                if (err) {
                    res.status(400).send({
                        message: "error",
                        status: 'Failed to read logger file !'
                    })
                } else {
                    obj = JSON.parse(data);
                    let result = obj[filter];
                    if (searchTerm) {
                        result = result.filter((res) => (res.toLowerCase()).includes(searchTerm));
                    }
                    res.send({
                        message: "success",
                        data: result.splice(offset*limit, limit),
                        count: result.length
                    })
                }
            });
        } else {
            res.status(400).send({
                message: "error",
                status: 'Logger not found !'
            })
        }
    } catch (e) {
        res.status(400).send({
            message: "error",
            error: e
        })
    }
})

app.post('/upload-logger-info', (req, res, next) => {
    try {
        const userConfig = [];
        const systemConfig = [];
        let file = req['files'].uploadedFile;
        var buf = file.data;
        var bufferStream = new stream.PassThrough();
        bufferStream.end(buf);
        var rl = readline.createInterface({
            input: bufferStream,
            crlfDelay: Infinity
        });
        rl.on('line', (line) => {
            if (line.includes('simulcrypt')) {
                userConfig.push(line);
            } else {
                systemConfig.push(line);
            }
        });
        events.once(rl, 'close')
            .then((r) => {
                //----
                const obj = {
                    user: userConfig,
                    configuration: systemConfig
                }
                let json = JSON.stringify(obj);
                fs.writeFile('./file/log.json', json, 'utf8', (err) => {
                    if (!err) {
                        res.send({
                            message: "success"
                        })
                    }
                    else {
                        res.status(400).send({
                            message: 'This is an error!',
                            error: err,
                            test: 'one'
                        })
                    }
                });
            })
            .catch(err => res.status(400).send({
                message: 'This is an error!',
                error: err,
                test: "two"
            }));
    } catch (e) {
        res.status(400).send({
            message: 'This is an error!',
            error: e,
            test: "3"
        });
    }

});

app.post('/upload-user-data', (req, res, next) => {
    let file = req['files'].uploadedFile;
    if (file.data) {
        var buf = file.data;
        var bufferStream = new stream.PassThrough();
        bufferStream.end(buf);
        var rl = readline.createInterface({
            input: bufferStream
        });
        const referenceObj = [];
        const parserHandler = fileParser.parseUserData(referenceObj);
        rl.on('line', function (line) {
            parserHandler(line);
        });
        events.once(rl, 'close').then((r) => {
            dbServer.setupUserConfigData(pool, res, referenceObj);
        }).catch(err => {
            res.status(400).send({
                message: 'This is an error!',
                error: err
            });
        });
    } else {
        res.status(400).send({ error: "error" });
    }
});

app.post('/user-config-data', (req, res) => {
    console.log(req.body);
    const body = req.body;
    const limit = body.limit;
    const offset = body.offset;
    const groupId = body.filter?.groupId;
    const serviceId = body.filter?.serviceId;
    const productId = body.filter?.productId;
    dbServer.getAllServiceMetaInfo(pool, res, limit, offset*limit, groupId, serviceId, productId);
});

app.get('/groups', (req, res) => {
    dbServer.getAllGroups(pool, res);
});

app.get('/products', (req, res) => {
    dbServer.getAllProducts(pool, res);
});

app.get('/services', (req, res) => {
    dbServer.getAllServices(pool, res);
});

app.post('/update-service-meta-info', (req, res) => {
    dbServer.updateServiceMetaInfo(pool, res, req.body.groupId, req.body.prevServiceId, req.body.prevProductId, req.body.serviceId, req.body.productId);
})

app.post('/add-service-meta-info', (req, res) => {
    dbServer.addServiceMetaInfo(pool, res, req.body.groupId, req.body.serviceId, req.body.productId);
})

app.post('/delete-service-meta-info', (req, res) => {
    dbServer.deleteServiceMetaInfo(pool, res, req.body.groupId, req.body.serviceId, req.body.productId);
})

app.delete('/remove-all-user-config', (req, res) => {
    dbServer.removeAllUserConfigData(pool, res);
});

// ------------------------------------ run server

app.listen(port, () => {
    console.log(`app listening on port ${port}`)
});