'use strict';
const mysql = require('mysql');
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
app.use(bodyParser.json());

const DBPORT = 3306;
const ADMIN_PERMISSION_LEVEL = 2;
const TEAM_MANAGER_PERMISSION_LEVEL = 1;
const WORKER_PERMISSION_LEVEL = 0;
/*
 * request
 *      { "id": 1 }
 * 
 * response 
 * {
 * "status": true,
    "First_name": "Trent",
    "Last_name": "Johnston",
    "Email": [
        "dsoifasodign@gmail.com",
        "ttdjohnston@gmail.com"
    ],
    "Phone_number": [
        "12342363456",
        "29835712394"
    ]
}
 */
app.post('/viewWorkerDetails', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select w.First_name, w.Last_name
                    from (ProjectProDB.WORKERS as w)
                    where w.Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    //console.log(rows[0]);
                    resolve(rows[0]);
                }
            });
        });

        var p2 = new Promise(function (resolve, reject) {
            var str = `select e.Email
                    from (ProjectProDB.WORKER_EMAILS as e) 
                    where e.Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    var list = [];
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        //console.log(i);
                        list.push(rows[i].Email);
                    }
                    console.log(list);
                    resolve(list);
                }
            });
        });

        var p3 = new Promise(function (resolve, reject) {
            var str = `select p.Phone_number
                    from (ProjectProDB.WORKER_PHONE_NUMBERS as p)
                    where p.Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    var list = [];
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        //console.log(i);
                        list.push(rows[i].Phone_number);
                    }
                    console.log(list);
                    resolve(list);
                }
            });
        });


        async function f(p1, p2, p3) {

            let p1V = await p1;
            let p2V = await p2;
            let p3V = await p3;

            var ret = {
                "status": true,
                First_name: p1V.First_name,
                Last_name: p1V.Last_name,
                Email: p2V,
                Phone_number: p3V
            };

            res.send(ret);
        }

        f(p1, p2, p3);


        connection.end();
        console.log('connection closed');
    }
    else {
        res.send({ "status": false });
    }
});

/*
 * request
 *      { "id": 1,
        "First_name": "Trent",
        "Last_name": "Johnston"
           }
 *
 * response
 * {
    "status": true
}
*/
app.post('/editName', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        var p1 = new Promise(function (resolve, reject) {
            var str = `update ProjectProDB.WORKERS 
                    set First_name = \'` + req.body.First_name + `\', Last_name = \'` + req.body.Last_name + `\'
                    where Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        });

        async function f(p1) {

            let p1V = await p1;

            res.send({ status: p1V });
        }
        f(p1);

        connection.end();
        console.log('connection closed');
    }
    else {
        res.send({ status: false });
    }
});

/*
 * request
 *      { "id": 1,
        "Email": ["asdoifnaosdn", "aosiidgnoa"]
        }
 *
 * response
 * {
    "status": true
}
*/
app.post('/editEmail', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var duplicates = false;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Email.length; i++) {
            for (var j = i + 1; j < req.body.Email.length; j++) {
                if ((req.body.Email[i]) == (req.body.Email[j])) {
                    duplicates = true;
                };
            }
        }
        if (!duplicates) {
            // connect to db
            var connection = connectToDB();
            // q db

            var p1 = new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.WORKER_EMAILS 
                    where Worker_ID = ` + req.body.id + ';';
                //console.log(str);
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        
                        resolve(true);
                    }
                });
            });

            var p2 = new Promise(function (resolve, reject) {
                for (var i = 0; i < req.body.Email.length; i++) {
                    var str = `insert ProjectProDB.WORKER_EMAILS 
                                values (` + req.body.id + ', \'' + req.body.Email[i] + '\');';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        };
                    });
                };
                resolve(true);
            });
            async function f(p1) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ status: p1V });
            }
            f(p1);
        }
        else { res.send({ status: false }) };
    }
    else {
        res.send({ status: false });
    }
}); 

/*
 * request
 *     { "id": 1,
        "Phone_number": ["239847239547", "2934572938"]
        }
 *
 * response
 *{
    "status": true
}
*/
app.post('/editPhoneNumbers', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var duplicates = false;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Phone_number.length; i++) {
            for (var j = i + 1; j < req.body.Phone_number.length; j++) {
                if ((req.body.Phone_number[i]) == (req.body.Phone_number[j])) {
                    duplicates = true;
                };
            }
        }
        if (!duplicates) {
            // connect to db
            var connection = connectToDB();
            // q db

            var p1 = new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.WORKER_PHONE_NUMBERS 
                    where Worker_ID = ` + req.body.id + ';';
                //console.log(str);
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {

                        resolve(true);
                    }
                });
            });

            var p2 = new Promise(function (resolve, reject) {
                for (var i = 0; i < req.body.Phone_number.length; i++) {
                    var str = `insert ProjectProDB.WORKER_PHONE_NUMBERS
                                values (` + req.body.id + ', \'' + req.body.Phone_number[i] + '\');';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        };
                    });
                };
                resolve(true);
            });
            async function f(p1) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ "status": (p1V && p2V) });
            }
            f(p1);
        }
        else { res.send({ "status": false }) };
    }
    else {
        res.send({ "status": false });
    }
});


/*
 * request
 *     
 *
 * response
 * 
*/
app.post('/allWorkers', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = 'select * from ProjectProDB.WORKERS';
        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send("error");
            }
            else {
                //console.log(rows);
                res.send(rows);
            };
        });
        connection.end();
        console.log('connection closed in allWorkers');
    }
    else {
        res.send("invalid permissions");
    }
});

/*
 * request
 *      { "id": 1 }
 *
 * response     (note these are the strength names)
 * {
 *  "status": true,
    "Strengths": [
        "5 Str",
        "First Str",
        " 2 Str",
        "3 Str",
        "DSFAPO3 Str"
    ]
    }
*/
app.post('/viewWorkerStrengths', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select s.Strength_name, whs.Strength_rank 
                            from ((ProjectProDB.WORKER_HAS_STRENGTHS as whs) join (ProjectProDB.STRENGTHS as s) on whs.Strength_ID = s.Strength_ID)
                            where whs.Worker_ID = ` + req.body.id +
                            ' order by whs.Strength_rank asc;';
                //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {

                    resolve(rows);
                }
            });
        });
            
        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push(p1V[i].Strength_name);
            }
            var ret = { "status": true, Strengths: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

/*
 * request
 *      { "id": 1 }
 *
 * response
 *{
 *  "status": true,
    "Strengths": [
        [   1,
            "First Str",
            ""
        ],
        [
            2,
            " 2 Str",
            ""
        ]
    ]
}
*/
app.post('/viewAllStrengths', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.STRENGTHS as s);`;
            //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {

                    resolve(rows);
                }
            });
        });

        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push([p1V[i].Strength_ID, p1V[i].Strength_name, p1V[i].Strength_description]);
            }
            var ret = { "status": true, Strengths: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 



app.get('/', (req, res) => res.send('Hello world'));

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

function connectToDB() {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'ProjectProDB'
    });
    console.log('connection opened');
    return connection;
}

/*
 * request
 *      { "id": 1 }
 *
 * response
 * {
    "status": true,
    "Access_Level": 2
}
*/
app.post('/getPermissionLevel', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var con = connectToDB();

        var p1 = new Promise(function (resolve, reject) {
            var str = 'select Access_level from ProjectProDB.ACCOUNT_ACCESS where Worker_ID = ' + req.body.id;
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(-1);
                }
                else {
                    resolve(rows[0].Access_level);
                };
            });
        });

        async function f(p1) {
            let p1V = await p1;
            con.end();
            console.log('connection closed');
            res.send({ "status": true, Access_Level: p1V });
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

function verifyPermissions(id, reqLevel) {
    var con = connectToDB();
    console.log('connection opened to verify permissions');
    var promise = new Promise(function (resolve, reject) {
        var str = 'select Access_level from ProjectProDB.ACCOUNT_ACCESS where Worker_ID = ' + id.toString();
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve(false);
            }
            else if ((rows[0].Access_level) >= (reqLevel)) {
                resolve(true);
            }
            else { resolve(false); };
        });
    });
    //console.log("permssionResult is " + permissionResult);
    let retValue = promise.then(value => {
        //console.log("value is " + value);
        return value;
    });
    con.end();
    console.log('connection closed in verify permissions');
    return retValue;
}

/*
 * request
 *      { "Username": "ttdjohns",
	"Password": "ttdjohns"
}
 *
 * response
 * {
    "status": true,
    "id": 1,
    "Access_level": 2
}
*/
app.post('/login', async function (req, res) {
    // connect to db
    var con = connectToDB();
    // q db

    var p1 = new Promise(function (resolve, reject) {
        var str = 'select * from ProjectProDB.ACCOUNT_ACCESS where Username = \'' + req.body.Username + '\' and Password = \'' + req.body.Password + '\';';
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve({ status: false, id: -1, Access_level: -1 });
            }
            else if (Object.keys(rows).length > 0) {
                resolve({status: true, id: rows[0].Worker_ID, Access_level: rows[0].Access_level});
            }
            else {
                resolve({ status: false, id: -1, Access_level: -1 });
            };
        });
    });

    async function f(p1) {
        let p1V = await p1;

        con.end();
        console.log('connection closed');
        res.send(p1V);
    }
    f(p1);
}); 
