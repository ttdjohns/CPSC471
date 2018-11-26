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
const ADMIN_PERMISSION_LEVEL = 3;
const TEAM_MANAGER_PERMISSION_LEVEL = 2;
const WORKER_PERMISSION_LEVEL = 1;


app.get('/', (req, res) => res.send('Hello world'));

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});
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
            async function f(p1, p2) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ status: (p1V && p2V) });
            }
            f(p1, p2);
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
            async function f(p1, p2) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ "status": (p1V && p2V) });
            }
            f(p1, p2);
        }
        else { res.send({ "status": false }) };
    }
    else {
        res.send({ "status": false });
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
    "status": true,
    "Strengths": [
        {
            "Strength_ID": 1,
            "Strength_name": "First Str",
            "Strength_description": ""
        },
        {
            "Strength_ID": 2,
            "Strength_name": " 2 Str",
            "Strength_description": ""
        },
        {
            "Strength_ID": 3,
            "Strength_name": "3 Str",
            "Strength_description": ""
        }
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
                list.push({
                    Strength_ID: p1V[i].Strength_ID,
                    Strength_name: p1V[i].Strength_name,
                    Strength_description: p1V[i].Strength_description
                });
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
    var promise = new Promise(function (resolve, reject) {
        var str = 'select Access_level from ProjectProDB.ACCOUNT_ACCESS where Worker_ID = ' + id.toString();
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve(0);
            }
            else if ((rows[0].Access_level) >= (reqLevel)) {
                resolve(rows[0].Access_level);
            }
            else { resolve(0); };
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

/*
 * request      (note that the Strength is the Strength_ID and the order indicates the rank. Strength[0] is your best)
 *              (always must have 5 strengths)
 *      { "id": 1,
        "Strengths": [2, 3, 4, 5, 1]     
        }
 *
 * response
 * {
    "status": true
}
*/
app.post('/editWorkerStrengths', async function (req, res) {
    // check for permissions
    if ((req.body.Strengths.length == 5) && (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL))) {
        console.log('permission granted');
        var duplicates = false;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Strengths.length; i++) {
            for (var j = i + 1; j < req.body.Strengths.length; j++) {
                if ((req.body.Strengths[i]) == (req.body.Strengths[j])) {
                    duplicates = true;
                };
            }
        }
        if (!duplicates) {
            // connect to db
            var connection = connectToDB();
            // q db

            var p1 = new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.WORKER_HAS_STRENGTHS 
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
                for (var i = 0; i < req.body.Strengths.length; i++) {
                    var str = `insert ProjectProDB.WORKER_HAS_STRENGTHS 
                                values (` + req.body.id + ', ' + req.body.Strengths[i] + ', ' + i + ');';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        };
                    });
                };
                resolve(true);
            });
            async function f(p1, p2) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ status: (p1V && p2V) });
            }
            f(p1, p2);
        }
        else { res.send({ status: false }) };
    }
    else {
        res.send({ status: false });
    }
}); 

/*
 * request     
 *      { "id": 1    
        }
 *
 * response    
 * {
    "status": true,
    "Desires": [
        {
            "Task_ID": 1,
            "Task_name": "weiof",
            "Task_description": ""
        },
        {
            "Task_ID": 2,
            "Task_name": "asoidfna",
            "Task_description": ""
        },
        {
            "Task_ID": 3,
            "Task_name": "fasiodfna",
            "Task_description": ""
        }
    ]
}
*/
app.post('/viewDesiredTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var connection = connectToDB();
        var p1 = new Promise(function (resolve, reject) {
            var str = `select t.Task_ID, t.Task_name, t.Task_description 
                            from ((ProjectProDB.DESIRES as d) join (ProjectProDB.TASKS as t) on d.Task_ID = t.Task_ID)
                            where d.Worker_ID = ` + req.body.id ;
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
                list.push({
                    Task_ID: p1V[i].Task_ID,
                    Task_name: p1V[i].Task_name,
                    Task_description: p1V[i].Task_description
                });
            }
            var ret = { "status": true, Desires: list };

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
    "status": true,
    "Tasks": [
        {
            "Task_ID": 1,
            "Task_name": "weiof",
            "Task_description": ""
        },
        {
            "Task_ID": 2,
            "Task_name": "asoidfna",
            "Task_description": ""
        }
    ]
}
*/
app.post('/viewAllTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.TASKS as t);`;
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
                list.push({
                    Task_ID: p1V[i].Task_ID,
                    Task_name: p1V[i].Task_name,
                    Task_description: p1V[i].Task_description
                });
            }
            var ret = { "status": true, Tasks: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

/*
 * request          (Tasks is a list of desired Task_ID's)
 *      { "id": 1,
        "Tasks": [1, 2]
        }
 *
 * response
 * {
    "status": true
}
*/
app.post('/editWorkerDesires', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var duplicates = false;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Tasks.length; i++) {
            for (var j = i + 1; j < req.body.Tasks.length; j++) {
                if ((req.body.Tasks[i]) == (req.body.Tasks[j])) {
                    duplicates = true;
                };
            }
        }
        if (!duplicates) {
            // connect to db
            var connection = connectToDB();
            // q db

            var p1 = new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.DESIRES
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
                for (var i = 0; i < req.body.Tasks.length; i++) {
                    var str = `insert ProjectProDB.DESIRES 
                                values (` + req.body.id + ', \'' + req.body.Tasks[i] + '\');';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        };
                    });
                };
                resolve(true);
            });
            async function f(p1, p2) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ status: (p1V && p1V) });
            }
            f(p1, p2);
        }
        else { res.send({ status: false }) };
    }
    else {
        res.send({ status: false });
    }
}); 

/*
 * request  
 *      { "id": 2    
        }
 *
 * response     
 *              
 * {
    "status": true,
    "Assigned_tasks": [
        {
            "Task_ID": 1,
            "Task_name": "weiof",
            "Task_description": "",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around"
        },
        {
            "Task_ID": 2,
            "Task_name": "asoidfna",
            "Task_description": "",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around"
        }
    ]
}
*/
app.post('/viewAssignedTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var connection = connectToDB();
        var p1 = new Promise(function (resolve, reject) {
            var str = `select t.Task_ID, t.Task_name, t.Task_description, p.Project_ID, p.Project_name, p.Project_description
                            from (((ProjectProDB.PROJECT_TASKS as pt) join (ProjectProDB.TASKS as t) on pt.Task_ID = t.Task_ID)
                                    join (ProjectProDB.PROJECTS as p) on pt.Project_ID = p.Project_ID) 
                            where pt.Worker_ID = ` + req.body.id;
            //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else { resolve(rows); }
            });
        });

        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push({
                    Task_ID: p1V[i].Task_ID,
                    Task_name: p1V[i].Task_name,
                    Task_description: p1V[i].Task_description,
                    Project_ID: p1V[i].Project_ID,
                    Project_name: p1V[i].Project_name,
                    Project_description: p1V[i].Project_description
                });
            }
            var ret = { "status": true, Assigned_tasks: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 


/*
 * request { "id": 1 }
 *     
 *
 * response 
 * {
    "status": true,
    "Workers": [
        {
            "Worker_ID": 1,
            "Hours_assigned": 1,
            "Start_date": "2000-01-01T07:00:00.000Z",
            "First_name": "Trent",
            "Last_name": "Johnston",
            "Worker_type": "Employee"
        },
        {
            "Worker_ID": 2,
            "Hours_assigned": 1,
            "Start_date": "2000-01-01T07:00:00.000Z",
            "First_name": "Arthur",
            "Last_name": "L",
            "Worker_type": "Employee"
        }
    ]
}
 * 
*/
app.post('/viewAllWorkers', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = 'select * from ProjectProDB.WORKERS';
        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send({ status: false });
            }
            else {
                var list = [];
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    list.push({
                        Worker_ID: rows[i].Worker_ID,
                        Hours_assigned: rows[i].Hours_assigned,
                        Start_date: rows[i].Start_date,
                        First_name: rows[i].First_name,
                        Last_name: rows[i].Last_name,
                        Worker_type: rows[i].Worker_type
                    });
                }
                res.send({ status: true, Workers: list });
            };
        });
        connection.end();
        console.log('connection closed in allWorkers');
    }
    else {
        res.send({ status: false });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1
}
 *     
 *
 * response 
 * {
    "status": true,
    "Workers": [
        {
            "Worker_ID": 2,
            "First_name": "Arthur",
            "Last_name": "Iwaniszyn",
            "Worker_type": "Employee"
        },
        {
            "Worker_ID": 3,
            "First_name": "Anton",
            "Last_name": "Lysov",
            "Worker_type": "Employee"
        }
    ]
}
 * 
*/
app.post('/viewTeamWorkers', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = "";
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
            str = `select w.Worker_ID, w.First_name, w.Last_name, w.Worker_type from ((ProjectProDB.WORKERS as w) join (ProjectProDB.IS_PART_OF as ipo) on w.Worker_ID = ipo.Worker_ID)
                    where ipo.Team_ID = (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + ');';
        }
        else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
            str = `select w.Worker_ID, w.First_name, w.Last_name, w.Worker_type from ((ProjectProDB.WORKERS as w) join (ProjectProDB.IS_PART_OF as ipo) on w.Worker_ID = ipo.Worker_ID)
                    where ipo.Team_ID = ` + req.body.Team_ID + ';';
        }
        if (str != "") {
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true,
                        Workers: []
                    }
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        ret.Workers.push({
                            Worker_ID: rows[i].Worker_ID,
                            First_name: rows[i].First_name,
                            Last_name: rows[i].Last_name,
                            Worker_type: rows[i].Worker_type
                        })
                    }
                    res.send(ret);
                };
            });
        }
        else {
            res.send({
                status: false, 
                error_message: "Error: organization manager must specify Team_ID"
            })
        }
        connection.end();
        console.log('connection closed in viewTeamWorkers');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});


/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Worker_ID": 3,
"Team_ID": 1
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addWorkerToTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = "";
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
            str = `insert into ProjectProDB.IS_PART_OF
                    values (` + req.body.Worker_ID + `, (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + '));';
        }
        else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
            str = `insert into ProjectProDB.IS_PART_OF
                    values (` + req.body.Worker_ID + `, ` + req.body.Team_ID + ');';
        }
        if (str != "") {
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    res.send({ status: true });
                };
            });
        }
        else {
            res.send({
                status: false,
                error_message: "Error: organization manager must specify Team_ID"
            })
        }
        connection.end();
        console.log('connection closed in addWorkerToTeam');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Worker_ID": 3,
"Team_ID": 1
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/deleteWorkerFromTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = "";
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
            str = `delete from ProjectProDB.IS_PART_OF
                    where Worker_ID = ` + req.body.Worker_ID + ` and Team_ID = (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + ');';
        }
        else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
            str = `delete from ProjectProDB.IS_PART_OF
                    where Worker_ID = ` + req.body.Worker_ID + ` and Team_ID = ` + req.body.Team_ID + ';';
        }
        if (str != "") {
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    res.send({ status: true });
                };
            });
        }
        else {
            res.send({
                status: false,
                error_message: "Error: organization manager must specify Team_ID"
            })
        }
        connection.end();
        console.log('connection closed in deleteWorkerFromTeam');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1
}
 *     
 *
 * response 
 * {
    "status": true,
    "Projects": [
        {
            "Project_ID": 3,
            "Project_name": "hanging",
            "Project_description": "your best wind chime impression"
        },
        {
            "Project_ID": 4,
            "Project_name": "electric chair",
            "Project_description": "what happens next will shock you"
        }
    ]
}
 * 
*/
app.post('/viewProjects', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = "";
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
            str = `select p.Project_ID, p.Project_name, p.Project_description
                    from (((ProjectProDB.PROJECTS as p) join (ProjectProDB.WORKS_ON as wo) on p.Project_ID = wo.Project_ID)
                        join (ProjectProDB.TEAMS as t) on wo.Team_ID = t.Team_ID)
                    where t.Team_ID = (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + ');';
        }
        else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
            str = `select p.Project_ID, p.Project_name, p.Project_description
                    from (((ProjectProDB.PROJECTS as p) join (ProjectProDB.WORKS_ON as wo) on p.Project_ID = wo.Project_ID)
                        join (ProjectProDB.TEAMS as t) on wo.Team_ID = t.Team_ID)
                    where t.Team_ID = ` + req.body.Team_ID + ';';
        }
        if (str != "") {
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true,
                        Projects: []
                    }
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        ret.Projects.push({
                            Project_ID: rows[i].Project_ID,
                            Project_name: rows[i].Project_name,
                            Project_description: rows[i].Project_description
                        })
                    }
                    res.send(ret);
                };
            });
        }
        else {
            res.send({
                status: false,
                error_message: "Error: organization manager must specify Team_ID"
            })
        }
        connection.end();
        console.log('connection closed in viewProjects');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});


/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 2,
"Project_ID": 3,
"Project_name": "Lethal Injection",
"Project_description": "Just like a flu shot"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editProject', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = `update ProjectProDB.PROJECTS set Project_name = \'` + req.body.Project_name + `\', 
                Project_description = \'` + req.body.Project_description + '\' where Project_ID = ' + req.body.Project_ID + ';'

        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send({ status: false });
            }
            else {
                var ret = {
                    status: true
                }
                res.send(ret);
            };
        });

        connection.end();
        console.log('connection closed in editProject');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

function getNextPrimary(tableName, keyName) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        var str = `select max(` + keyName + `) as maximum from ProjectProDB.` + tableName + ';';
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve(-1);
            }
            else {
                resolve(rows[0].maximum);
            }
        });
    });
    con.end();
    return p1;
}


/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1,
"Project_name": "Injection",
"Project_description": "Just like a flu shot"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addProject', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) ||
            (permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("PROJECTS", "Project_ID");
        nextPrime++;
        console.log(nextPrime);
        // connect to db
        var connection = connectToDB();
        var p1 = await (new Promise(function (resolve, reject) {
            var str = `insert into ProjectProDB.PROJECTS
                    values (` + nextPrime + `, \'` + req.body.Project_name + `\', \'` + req.body.Project_description + `\');`; 
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        }));
        var str = "";
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
            str = `insert into ProjectProDB.WORKS_ON
                    values (` + nextPrime + `, (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + '));';
        }
        else {
            str = `insert into ProjectProDB.WORKS_ON
                    values (` + nextPrime + `, ` + req.body.Team_ID + ');';
        }
        var p2 = await (new Promise(function (resolve, reject) {
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        }));
        res.send({ status: (p1 && p2) });
        connection.end();
        console.log('connection closed in addProject');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions or organization manager must specify Team_ID"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Strength_name": "Teaching",
"Strength_description": "Instructing others"
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addStrength', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("STRENGTHS", "Strength_ID");
        nextPrime++;
        var nameUnique = await checkUnique(req.body.Strength_name, "STRENGTHS", "Strength_name");
        if (nameUnique) {
            // connect to db
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `insert into ProjectProDB.STRENGTHS
                    values (` + nextPrime + `, \'` + req.body.Strength_name + `\', \'` + req.body.Strength_description + `\');`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in addStrength');
        } else {
            res.send({
                status: false,
                error_message: "Error: Name already exists or is invalid"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

//A function to check the database to see if the proposed name is unique
function checkUnique(proposedAttribute, tableName, keyName) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        if ((proposedAttribute == null) || (proposedAttribute == ("")) || (proposedAttribute == undefined)) {
            resolve(false);
        } else {
            var str = `select * from ProjectProDB.` + tableName + ' where ' + keyName + ' = \'' + proposedAttribute + '\' ; ';
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    if (Object.keys(rows).length > 0) { resolve(false); }
                    else { resolve(true); }
                }
            });
        };
    });
    con.end();
    return p1;
}

//A function to check the database to see if the attribute exists in the given table
function checkExists(attToCheck, tableName, keyName) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        if ((attToCheck == null) || (attToCheck == ("")) || (attToCheck == undefined)) {
            resolve(false);
        } else {
            var str = `select * from ProjectProDB.` + tableName + ' where ' + keyName + ' = \'' + attToCheck + '\' ; ';
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    if (Object.keys(rows).length != 1) { resolve(false); }
                    else {
                        resolve(true);
                    }
                }
            });
        };
    });
    con.end();
    return p1;
}

/*
 * request      
 * { "id": 1,
"Task_name": "Waterboarding",
"Task_description": "Showing others how to be a fish",
"Associated_strength_ID": [10, 2]
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addTask', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions(req.body.id, ADMIN_PERMISSION_LEVEL);
    if (permission && (req.body.Associated_strength_ID.length > 0)) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("TASKS", "Task_ID");
        nextPrime++;
        var strengthExists = true;
        for (let i = 0; i < req.body.Associated_strength_ID.length; i++) {
            strengthExists = strengthExists && (await checkExists(req.body.Associated_strength_ID[i], "STRENGTHS", "Strength_ID"));
        }
        var isUnique = await checkUnique(req.body.Task_name, "TASKS", "Task_name");
        if (strengthExists && isUnique) {
            // connect to db
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `insert into ProjectProDB.TASKS
                    values (` + nextPrime + `, \'` + req.body.Task_name + `\', \'` + req.body.Task_description + `\');`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            var p2Success = true;
            for (let i = 0; i < req.body.Associated_strength_ID.length; i++) {
                var p2 = await (new Promise(function (resolve, reject) {
                    var str = `insert into ProjectProDB.ASSOCIATED_STRENGTHS
                    values (` + nextPrime + `, ` + req.body.Associated_strength_ID[i] + `);`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                p2Success = p2Success && p2;
            }
            res.send({ status: (p1 && p2Success) });
            connection.end();
            console.log('connection closed in addTask');
        }
        else {
            res.send({
                status: false,
                error_message: "Either invalid strength provided or Task name already exists"
            })
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});



/*
 * request      
 * { "id": 1,
"Cause_name": "Justice",
"Cause_description": "My perverted sense of"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addCause', async function (req, res) {
    // check for permissions
    var permission = verifyPermissions(req.body.id, ADMIN_PERMISSION_LEVEL);
    if (await permission) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("CAUSES", "Cause_ID");
        nextPrime++;
        var isUnique = await checkUnique(req.body.Cause_name, "CAUSES", "Cause_name");
        if (isUnique) {
            // connect to db
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `insert into ProjectProDB.CAUSES
                    values (` + nextPrime + `, \'` + req.body.Cause_name + `\', \'` + req.body.Cause_description + `\');`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in addCause');
        }
        else {
            res.send({
                status: false,
                error_message: "Either invalid strength provided or Task name already exists"
            })
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request
 *      { "id": 1 }
 *
 * response
 {
    "status": true,
    "Causes": [
        {
            "Strength_ID": 1,
            "Strength_name": "Justice",
            "Strength_description": "My perverted sense of"
        }
    ]
}
 *
*/
app.post('/viewAllCauses', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var connection = connectToDB();
        var p1 = new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.CAUSES as c);`;
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
                list.push({
                    Strength_ID: p1V[i].Cause_ID,
                    Strength_name: p1V[i].Cause_name,
                    Strength_description: p1V[i].Cause_description
                });
            }
            var ret = { "status": true, Causes: list };
            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else {
        res.send({
            "status": false,
            "error_message": "Error: Invalid Permissions"
        });
    };
}); 

/*  NOT FINISHED
 * 
 * request
 *      { "id": 1 }
 *
 * response
 {
    "status": true,
    "Causes": [
        {
            "Strength_ID": 1,
            "Strength_name": "Justice",
            "Strength_description": "My perverted sense of"
        }
    ]
}
 *
*/
app.post('/viewAllTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = await (new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.TASKS as t);`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    resolve(rows);
                }
            });
        }));

        var list = [];
        for (var i = 0; i < Object.keys(p1).length; i++) {

            var p2 = await (new Promise(function (resolve, reject) {
                var str = `select * from ((ProjectProDB.ASSOCIATED_STRENGTHS as as) join (ProjectProDB.STRENGTHS as s) 
                            on as.Strength_ID = s.Strength_ID
                            where as.Task_ID = ` + p1[i].Task_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve([]);
                    }
                    else {
                        resolve(rows);
                    }
                });
            }));

            list.push({
                Strength_ID: p1[i].Cause_ID,
                Strength_name: p1[i].Cause_name,
                Strength_description: p1[i].Cause_description
            });
        }
        var ret = { "status": true, Causes: list };

        connection.end();
        console.log('connection closed');
        res.send(ret);

    }
    else {
        res.send({
            "status": false,
            "error_message": "Error: Invalid Permissions"
        });
    };
}); 